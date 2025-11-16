
from xml.etree import ElementTree as ET
import textwrap
import requests, jsonlines
from io import StringIO
from collections.abc import Callable
from ..backend.conversation_controller import ConversationController
import asyncio
from ..backend.database import salsa_config
from openai import AsyncOpenAI




        
        
RETRY_BRANCH = -1
from typing import Callable


class Dialog:
    def __init__(self,conversation:ConversationController, xml_text:str, model:str, functions:dict[str, Callable], context={}, save_keys=[]):
        self.parse(xml_text)
        self.functions=functions
        self.conversation=conversation
        self.context = context
        self.model = model
        self.last_user_statement = ''
        self.last_chatbot_statement = ''
        self.choice = ''
        self.history = []
        self.instruction_pointer = 0
        self.goto = False
        self.debug_socket = None
        self.text_socket = None
        self.done = asyncio.Event()
        self.step_by_step_mode = False
        self.save_keys = save_keys
    
    def __init_subclass__(self, treefile:str, functions:dict[str, Callable], *args, **kwargs):
        self.parse(ET.parse(treefile).getroot())
        self.functions=functions
    
    def get_json_to_save(self):
        return {
            'transcript':self.history,
            'save_keys': {k:self.context.get(k, None) for k in self.save_keys}
        }
    
    async def append_history(self, h):
        self.history.append(h)
        try:
            if self.debug_socket:
                await self.debug_socket.send_json(h)
                if h[0] == 'executing-node-id' and self.step_by_step_mode:
                    pass
                    #await self.debug_socket.receive_json()
        except Exception as e:
            print('websocket exception', e)
            pass

    
    async def say(self, statement):
        self.last_chatbot_statement = statement
        await self.append_history(['chatbot', statement])
        listeners = []
        if self.conversation:
            listeners.append(self.conversation.say(statement))
        if self.text_socket:
            listeners.append(self.text_socket.send_json(statement))
        listeners = [asyncio.create_task(l) for l in listeners]
        await asyncio.sleep(0)
        done, pending = await asyncio.wait(listeners, return_when=asyncio.ALL_COMPLETED)
        return statement



    
    async def listen(self):
        listeners = []
        if self.conversation:
            listeners.append(asyncio.create_task(self.conversation.listen()))
        if self.text_socket:
            #this tells client that listening is ready
            await self.text_socket.send_json(1)
            #zz = await self.text_socket.receive_json()
            listeners.append(asyncio.create_task(self.text_socket.receive_json()))
        await asyncio.sleep(0)
        done, pending = await asyncio.wait(listeners, return_when=asyncio.FIRST_COMPLETED)
        for t in pending:
            t.cancel()
        statement = done.pop().result()

        self.last_user_statement = statement
        await self.append_history(['user', statement])
        if self.text_socket and self.conversation:
            self.text_socket.send_json([2, statement])
        return statement
    
    async def goodbye(self, statement):
        await self.append_history(['goodbye', statement])
        self.done.set()
        if self.text_socket:
            await self.text_socket.send_json(statement)
            await self.text_socket.send_json(1)
        if self.conversation:
            await self.conversation.ask(statement, wait_time=0.5)
            self.conversation.goodbye()







    
    def parse(self, rawtext: str):
        tree = ET.parse(StringIO(rawtext))
        root = tree.getroot()
        self.targets = [tn for tn in root]
        self.start_target = self.targets[0]
        self.jump_destinations = {}
        for i, t in enumerate(self.targets):
            if 'label' in t.attrib:
                self.jump_destinations[t.attrib['label'].strip()] = i
    
    async def run(self):
        while True:
            current_target = self.targets[self.instruction_pointer]
            print('current_target', current_target, current_target.tag)
            await eval_node(current_target, self)
            if self.goto:
                #the special retry goto retries the node being executed and prevents
                #the instruction pointer being incremented
                if self.goto == RETRY_BRANCH:
                    print('got to retry')
                    self.goto = False
                    continue
                else:
                    self.instruction_pointer = self.jump_destinations[self.goto]
                    self.goto = False
            elif current_target.tag == 'goodbye':
                #conversation ends if goodbye is hit
                break
            elif self.instruction_pointer +1 == len(self.targets):
                #Default if script is missing a goodbye and reaches the end
                await self.goodbye('Thanks for talking, goodbye!')
                break        
            else:
                #increment by default
                self.instruction_pointer += 1
    
    async def execute_jump_function(self, node):
        if 'function_name' in node.attrib:
            retval = await self.functions[node.attrib['function_name']](self.last_user_statement, self.context, self.last_chatbot_statement)
        elif (node.text is not None) and node.text.strip():
            ldict = {}
            exec("async def jfun(last_user_statement, context, last_chatbot_statement):\n" +
                        textwrap.indent(textwrap.dedent(node.text).strip(), prefix='    '), globals(), ldict)
            retval = await (ldict['jfun'](self.last_user_statement, self.context, self.last_chatbot_statement))
        await self.append_history(['run-return-value', retval])
        return retval
    


    


    async def eval_node_contents(self, node):
        if salsa_config.llm_type == 'openai' and node.tag=='consult-llm':
            print('got to this loop?', flush=True)
            return [await eval_node(item, self) for item in node]
        else:
            retval = node.text if node.text  else ''
            for item in node:
                result = await eval_node(item, self)
                if result is None:
                    retval += ''
                else:
                    retval += result
                retval += item.tail if item.tail else ''
            return textwrap.dedent(retval).strip()
        
    
    async def complete(self, prompt):
        if salsa_config.llm_type == 'ollama':
            prompt = '<|im_start|>system\nYou are a chatbot speaking over the phone. keep your responses brief and conversational\n<|im_end|>\n' + prompt
            prompt = prompt + '\n<|im_start|>answer\n'
            await self.append_history(['prompt', prompt])
            with jsonlines.Reader(StringIO(
                    requests.post(salsa_config.ollama_url, json={"model":salsa_config.llm_model, 'prompt':prompt}).text
                )) as jlr:
                continuation = ''.join(ll['response'] for ll in jlr) 
                await self.append_history(['continuation', continuation])
                return continuation
        elif salsa_config.llm_type == 'openai':
            await self.append_history(['prompt', str(prompt)])
            print('messages', prompt, flush=True)
            client = AsyncOpenAI(api_key=salsa_config.api_key)
            response = await client.chat.completions.create(
                model=salsa_config.llm_model,
                messages=prompt
            )
            return response.choices[0].message.content
        
node_eval_funcs: dict[str, Callable[[ET.Element, Dialog], str]] = {}
def register_node(nodename):
    def decorator(func):
        node_eval_funcs[nodename] = func
        return func
    return decorator

async def eval_node(node: ET.Element, dialog: Dialog) -> str:
    await dialog.append_history(['executing-node-id', node.attrib.get('id', None)])
    return await node_eval_funcs[node.tag](node, dialog)



@register_node('consult-llm')
async def eval_consult_llm(node, dialog:Dialog):
    return await dialog.complete(await dialog.eval_node_contents(node))

@register_node('run')
async def eval_run(node: ET.Element, dialog:Dialog):
    return await dialog.execute_jump_function(node)

@register_node('last-user-statement')
async def eval_last_user_statement(node: ET.Element, dialog:Dialog):
    return dialog.last_user_statement

@register_node('last-chatbot-statement')
async def eval_last_chatbot_statement(node: ET.Element, dialog:Dialog):
    return dialog.last_chatbot_statement

@register_node('history')
async def eval_history(node: ET.Element, dialog:Dialog):
    return dialog.get_history(await dialog.eval_node_contents(node))


@register_node('context')
async def eval_context(node: ET.Element, dialog:Dialog):
    return dialog.context[await dialog.eval_node_contents(node)]

@register_node('say')
async def eval_say(node: ET.Element, dialog:Dialog):
    return await dialog.say(await dialog.eval_node_contents(node))

@register_node('listen')
async def eval_listen(node: ET.Element, dialog:Dialog):
    return await dialog.listen()

@register_node('choice')
async def eval_choice(node: ET.Element, dialog:Dialog):
    choice = await dialog.eval_node_contents(node)
    await dialog.append_history(['choice', choice])
    return choice




@register_node('branch')
async def eval_branch(node: ET.Element, dialog:Dialog):
    choice_node, *matches = node
    dialog.choice = await eval_node(choice_node, dialog)
    for m in matches:
        if m.tag == 'match':
            choices = m.attrib['choices']
            for c in choices.split(' '):
                if c.lower() in dialog.choice.lower():
                    await eval_node(m,dialog)
        else:
            await eval_node(m, dialog)
        #prevents advancement from a goto
        if dialog.goto:
            break


@register_node('match')
async def eval_match(node: ET.Element, dialog:Dialog):
    for item in node:
        await eval_node(item, dialog)

@register_node('retry')
async def eval_retry(node: ET.Element, dialog:Dialog):
    await dialog.append_history(['retry', ''])
    dialog.goto = RETRY_BRANCH

@register_node('goto')
async def eval_goto(node: ET.Element, dialog:Dialog):
    label = await dialog.eval_node_contents(node)
    await dialog.append_history(['goto', label])
    dialog.goto = label
    
@register_node('goodbye')
async def eval_goodbye(node: ET.Element, dialog:Dialog):
    contents = await dialog.eval_node_contents(node)
    await dialog.goodbye(contents)

@register_node('chatml')
async def chatml(node: ET.Element, dialog:Dialog):
    contents = await dialog.eval_node_contents(node)
    role = node.attrib['role'].strip()
    if salsa_config.llm_type == 'ollama':
        return f'<|im_start|>{role}\n{contents}<|im_end|>'
    elif salsa_config.llm_type == 'openai':
        #openai uses different nomenclature
        if role=='question':
            role='user'
        return {'role':role, 'content':contents}

    


    
        



