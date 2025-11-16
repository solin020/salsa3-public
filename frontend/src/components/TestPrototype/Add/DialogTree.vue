
<template>
  <div class="dt-navbar">
      <!--<j-tooltip style="grid-column: 1;">
      <template #anchor>Help</template>
      <div class="dt-tooltip">
        <p>Click on green bars to insert new comand</p>
        <p>⌘/⊞-click on a green bar to delete a command</p>
        <p>Alt-click inside of an command's text to insert variables into the text</p>
        <p>⌘/⊞-z to undo a change</p>
        <p>⌘/⊞-shift-z to redo a change</p>
      </div>
      </j-tooltip>-->
      <v-btn @click="saveAndCloseEditor()" style="grid-column: 1;">Close Editor</v-btn>
      <popup style="grid-column: 2;" :disabled="insertMenuChoices === null" :control-from-outside="getInsertPopupClosed()">
        <template #open>
          Insert
        </template>
        <template #content>
          <template v-if="insertMenuChoices === 'say'">
            <span class="dt-add-consult-llm" @click="insertNewDestination('consult-llm')">Consult LLM</span>
            <span class="dt-add-run" @click="insertNewDestination('run')">Run</span>
            <span class="dt-add-context" @click="insertNewDestination('context')">Context</span>
            <span class="dt-add-last-user-statement" @click="insertNewDestination('last-user-statement')">Last User
              statement</span>
            <span class="dt-add-last-chatbot-statement" @click="insertNewDestination('last-chatbot-statement')">Last Chatbot
              statement</span>
            <span class="dt-add-listen" @click="insertNewDestination('listen')">Listen</span>
          </template>
          <template v-else-if="insertMenuChoices === 'chatml'">
            <span class="dt-add-context" @click="insertNewDestination('context')">Context</span>
            <span class="dt-add-last-user-statement" @click="insertNewDestination('last-user-statement')">Last User
              statement</span>
            <span class="dt-add-last-chatbot-statement" @click="insertNewDestination('last-chatbot-statement')">Last Chatbot
              statement</span>
            <span class="dt-add-listen" @click="insertNewDestination('listen')">Listen</span>
          </template>
          <template v-else>
            Can't insert here
          </template>
        </template>
      </popup>
      <v-btn style="grid-column: 3;" @click="undoRedo.undo()">
        Undo
      </v-btn>
      <v-btn style="grid-column: 4;" @click="undoRedo.redo()">
        Redo
      </v-btn>
      <v-btn style="grid-column: 5;" @click="openChat()">
         Text conversation
      </v-btn>
      <v-btn @click="makeCall" style="grid-column: 6;"> Audio call</v-btn>
  </div>
    <div class="dt-whole-editor" style="grid-column: 1;">
      <input ref="keyboardTrap" style="position: absolute; left: -9999px;" />
      <div class="dt-caret" ref="caret" />
      <div style="height: 2em; min-height: 2em;"/>
      <div class="dt-editor" ref="editand" />
      <div ref="rectContainer" />
      <div ref="topLevelInsertPopup" class="dt-insert-popup">
        <span class="dt-add-say" @click="insertNewDestination('say')">Say</span>
        <span class="dt-add-branch" @click="insertNewDestination('branch')">Branch</span>
        <span class="dt-add-run" @click="insertNewDestination('run')">Run</span>
        <span class="dt-add-goto" @click="insertNewDestination('goto')">Goto</span>
        <span class="dt-add-goodbye" @click="insertNewDestination('goodbye')">Goodbye</span>
        <span class="dt-add-paste" @click="doPaste('topLevel')">📋Paste</span>
        <span class="dt-add-paste" @click="doDelete()">❌Delete</span>
        <span class="dt-add-paste" @click="addLabel()">Add label</span>
      </div>
      <div ref="matchInsertPopup" class="dt-insert-popup">
        <span class="dt-add-say" @click="insertNewDestination('say')">Say</span>
        <span class="dt-add-run" @click="insertNewDestination('run')">Run</span>
        <span class="dt-add-goto" @click="insertNewDestination('goto')">Goto</span>
        <span class="dt-add-retry" @click="insertNewDestination('retry')">Retry</span>
        <span class="dt-add-paste" @click="doPaste('matchLevel')">📋Paste</span>
        <span class="dt-add-paste" @click="doDelete()">❌Delete</span>

      </div>
      <div ref="branchInsertPopup" class="dt-insert-popup">
        <span class="dt-add-say" @click="insertNewDestination('say')">Say</span>
        <span class="dt-add-run" @click="insertNewDestination('run')">Run</span>
        <span class="dt-add-goto" @click="insertNewDestination('goto')">Goto</span>
        <span class="dt-add-retry" @click="insertNewDestination('retry')">Retry</span>
        <span class="dt-add-match" @click="insertNewDestination('match')">Match</span>
        <span class="dt-add-paste" @click="doPaste('branchLevel')">📋Paste</span>
        <span class="dt-add-paste" @click="doDelete()">❌Delete</span>

      </div>
      <div ref="contentInsertPopup" class="dt-insert-popup">
        <span class="dt-add-consult-llm" @click="insertNewDestination('consult-llm')">Consult LLM</span>
        <span class="dt-add-run" @click="insertNewDestination('run')">Run</span>
        <span class="dt-add-context" @click="insertNewDestination('context')">Context</span>
        <span class="dt-add-last-user-statement" @click="insertNewDestination('last-user-statement')">Last User
          statement</span>
        <span class="dt-add-last-chatbot-statement" @click="insertNewDestination('last-chatbot-statement')">Last Chatbot
          statement</span>
        <span class="dt-add-listen" @click="insertNewDestination('listen')">Listen</span>
        <span class="dt-add-paste" @click="doPaste('sayLevel')">Paste</span>
        <span class="dt-add-paste" @click="doDelete()">❌Delete</span>
      </div>
      <div ref="chatmlInsertPopup" class="dt-insert-popup">
        <span class="dt-add-chatml" @click="insertNewDestination('chatml-system')">Chatml-System</span>
        <span class="dt-add-chatml" @click="insertNewDestination('chatml-question')">Chatml-Question</span>
        <span class="dt-add-paste" @click="doPaste('consultLLMLevel')">📋Paste</span>
        <span class="dt-add-paste" @click="doDelete()">❌Delete</span>

      </div>
      <div class="dt-debug-arrow" ref="debugArrow"></div>
      <div class="dt-explanations">
        <div ref="sayExplanation">
          <p>
            The <strong class="dt-add-say">say</strong> command makes the chatbot speak.
            You can have it say plain text verbatim,
            or have it ask an LLM what to say using a <strong class="dt-add-consult-llm">consult-llm</strong> command to
            generate a response using an LLM,
            or say the result of python code run by a <strong class="dt-add-run">run</strong> element.
            You can also have the chatbot say snippets of information it has stored
            using dynamic elements like <strong class="dt-add-context">context</strong>,
            <strong class="dt-add-last-user-statement">last-user-statement</strong>,
            and <strong class="dt-add-chatbot-statement">last-chatbot-statement</strong>.
          </p>
        </div>
        <div ref="runExplanation">
          <p>
            The <strong class="dt-add-run">run</strong> command executes Python code.
            It has access to the variable <code>context</code>, which is dictionary for storing data. You can write
            to it or read it.
            When finished, this command is replaced with the returned string, unless it returns <code>None</code> or
            lacks a <code>return</code> statement entirely.
          </p>
        </div>
        <div ref="goodbyeExplanation">
          <p>
            This does the same thing as a <strong class="dt-add-say">say</strong> command but also ends the conversation
            and hangs up the phone
            (depending on how you are interacting with the script)
          </p>
        </div>
        <div ref="contextExplanation">
          <p>
            This command is replaced with whatever string you placed in the <code>context</code> dictionary
            under the key you give it. For example, if you have a "Say Hello!: <code> context key= username</code>"
            in your script, and the context dictionary has the user's name saved in it, then the chatbot will
            say Hello to the user's actual name, like "Hello John Doe!" or "Hello Jane Smith!"
          </p>
        </div>
        <div ref="gotoExplanation">
          <p>
            This command goes to the point in the script you have typed into it. You can also put <strong
              class="dt-add-run">Run</strong>
            or Consult LLM commands if you want python code or an LLM to state a label to go to in the dialog instead
            when its necessary to do more complex things.
          </p>
        </div>
        <div ref="retryExplanation">
          <p>
            This command goes back to the beginning of the branch command it is inside of.
          </p>
        </div>
        <div ref="listenExplanation">
          <p>
            This command pauses the chatbot to listen for the user to say or type something.
            It then gets replaced with whatever the user has just typed/said.
          </p>
        </div>
        <div ref="lastUserStatementExplanation">
          <p>
            This command is replaced with whatever the last thing the user said was.
          </p>
        </div>
        <div ref="lastChatbotStatementExplanation">
          <p>
            This command is replaced with whatever the last thing the chatbot said was.
            Please note that this doesn't include things that an LLM has generated under
            consultLLM blocks that were not placed in say blocks.
          </p>
        </div>
        <div ref="branchExplanation">
          <p>
            Use the <strong class="dt-add-branch">Branch</strong> command when you need to go to different points in the
            dialog depending
            on what the user has just said or on the result of code execution. The "choice" command is
            first run, and then the rest of the commands in the branch are executed one by one.
            For any commands underneath a <strong class="dt-add-match">Match</strong> blocks in the branch, those are only
            run if they match the result of the
            <strong class="dt-add-choice">Choice</strong> command. The other commands in the branch are always run every
            time, unless
            you a goto or a retry to leave or restart the branch.
          </p>
        </div>
        <div ref="choiceExplanation">
          <p>
            The result of the <strong class="dt-add-choice">Choice</strong> command is compared with each match in the
            branch to conditionally
            do things depending on the result of the choice. The simplest way to use <strong
              class="dt-add-choice">Choice</strong> is to wrap
            a <strong class="dt-add-consult-llm">Consult LLM</strong> around a <strong
              class="dt-add-listen">Listen</strong> to have the LLM try and parse whatever the user
            has just said into a short list of options. For example, if you have a "Consult LLM: The user has just been
            asked a question.
            If they said something like 'yes', say 'yes', if they said something like 'no', say 'no', otherwise, say
            'other', <strong class="dt-add-listen">Listen</strong>,
            this will cause the LLM to parse whatever the user just said, like "yeah, yep, OK" or "no, nope, I don't think
            so" or "I'm not sure" into
            a "yes" or a "no" or an "other" and that will become the choice. The choice will then be matched with the
            match blocks, so if the
            choice was "yes", the "yes" match block will be run, if the choice was "no", the "no" match block will be run,
            and if the choice was "other", and there is no specific "other" <strong class="dt-add-match">Match</strong>
            block, the script will just keep going and run
            all of the commands that are outside of match blocks. You can put anything you can put into a "say" command
            into a choice command.
          </p>
        </div>
        <div ref="matchExplanation">
          <p>
            The commands under the <strong class="dt-add-match">Match</strong> block will only be run if the choice from
            the earlier choice block matches
            one of the words typed in the choices next to the match block
          </p>
        </div>
        <div ref="labelExplanation">
          <p>
            This is the label of this particular point in the dialog, which is used by "goto" commands
            to figure out where to go to next.
          </p>
        </div>
        <div ref="consultLLMExplanation">
          This command asks a question to an LLM and then gets replaced with whatever the LLM says back.
          Note: You have to put this element inside a "say" command to actually get the chatbot
          to say what the LLM has said back. This element can also used in the choice part of a branch commands to allow
          the LLM to decide where to go next. This command's contents have to be structured with
          <strong class="dt-add-chatml">Chatml</strong> blocks
        </div>
        <div ref="chatmlExplanation">
          These blocks are used to help the LLM distinguish between its system prompt and instructions
          (these go under role="system") and whatever questions have been asked it (these go under role="question").
          It usually makes sense to put <strong class="dt-add-listen">Listen</strong> commands inside of question role
          chatml blocks, since usually the things
          the user has just said are questions. You can put everything that you could put in a "say" command in these
          blocks.
        </div>
      </div>
    </div>
    <div style="grid-column: 2;">
      <div style="position: sticky; top: 10px;" :style="{ visibility: debugSocket ? 'visible' : 'hidden' }">
        <h1>Debug</h1>
          <!--<v-btn style="border: 4px inset black; font-size: 16pt;" @click="advanceDebugger">Click to advance
            debugger</v-btn>-->
        <div style="overflow-y: scroll; max-height: 80vh;" ref="debugColumn">
          <ol>
            <li v-for="dbm in debugMessages">
              <div>
                <h4>{{ dbm[0] }}</h4>
                <p>
                  {{ dbm[1] }}
                </p>
              </div>
            </li>
          </ol>

        </div>

      </div>

    </div>
    <div style="grid-column: 3;">
      <beautiful-chat :participants="participants" :messageList="messageList" :onMessageWasSent="onMessageWasSent"
        :isOpen="isChatOpen" :close="closeChat" :open="openChat" :colors="redColors"
        :showTypingIndicator="showTypingIndicator" :alwaysScrollToBottom="true">
        <template v-slot:user-avatar="{ message, user }">
          <img :src="user.imageUrl" class="dt-avatar-img">
        </template>
      </beautiful-chat>
    </div>
    <video ref="remoteVideo" autoplay/>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, type Ref, inject } from 'vue'
import { insertElements, dialogtree2html, html2dialogtree, pharm3 } from './inserts'
import {DiffDOM} from 'diff-dom'
import { project_key } from '@/injectkeys'
import JTooltip from '@/components/JTooltip.vue'
import Popup from '@/components/Popup.vue'
const project = inject(project_key)!
const insertPopupClosed = ref(false)
function getInsertPopupClosed(){
  return insertPopupClosed
}
declare global {
  interface HTMLElementEventMap {
    'adjust-pin-event': CustomEvent<{}>
    'accept-paste': CustomEvent<{ pasteLevel: string }>
    'try-insert-popup': CustomEvent<{x:number, y:number}>
  }
}
const props = defineProps<{
  docname:string|undefined, 
  closeEditor:Function, 
  background:HTMLDivElement,
  xmlstring:Ref<string>}>()

function saveAndCloseEditor(){
  const dtDoc = editand.value!.firstElementChild!
  nodeIdStart = 0
  assignNodeId(dtDoc as HTMLElement)
  props.xmlstring.value = transform2Dialogtree(dtDoc)
  props.closeEditor()
}

const editand = ref<HTMLDivElement | null>(null)
const caret = ref<HTMLDivElement | null>(null)
const keyboardTrap = ref<HTMLInputElement | null>(null)
const rectContainer = ref<HTMLDivElement | null>(null)
const debugColumn = ref<HTMLDivElement | null>()
const topLevelInsertPopup = ref<HTMLDivElement | null>(null)
const branchInsertPopup = ref<HTMLDivElement | null>(null)
const matchInsertPopup = ref<HTMLDivElement | null>(null)
const contentInsertPopup = ref<HTMLDivElement | null>(null)
const chatmlInsertPopup = ref<HTMLDivElement | null>()
const insertPopups = [topLevelInsertPopup, branchInsertPopup, matchInsertPopup, contentInsertPopup, chatmlInsertPopup]

const sayExplanation = ref<HTMLDivElement | null>(null)
const runExplanation = ref<HTMLDivElement | null>(null)
const goodbyeExplanation = ref<HTMLDivElement | null>(null)
const branchExplanation = ref<HTMLDivElement | null>(null)
const gotoExplanation = ref<HTMLDivElement | null>(null)
const retryExplanation = ref<HTMLDivElement | null>(null)
const choiceExplanation = ref<HTMLDivElement | null>(null)
const matchExplanation = ref<HTMLDivElement | null>(null)
const contextExplanation = ref<HTMLDivElement | null>(null)
const lastUserStatementExplanation = ref<HTMLDivElement | null>(null)
const lastChatbotStatementExplanation = ref<HTMLDivElement | null>(null)
const chatmlExplanation = ref<HTMLDivElement | null>(null)
const consultLLMExplanation = ref<HTMLDivElement | null>(null)

const explanationMap = {
  'DT-SAY': sayExplanation,
  'DT-RUN': runExplanation,
  'DT-GOODBYE': goodbyeExplanation,
  'DT-BRANCH': branchExplanation,
  'DT-GOTO': gotoExplanation,
  'DT-RETRY': retryExplanation,
  'DT-CHOICE': choiceExplanation,
  'DT-MATCH': matchExplanation,
  'DT-CONTEXT': contextExplanation,
  'DT-LAST-USER-STATEMENT': lastUserStatementExplanation,
  'DT-LAST-CHATBOT-STATEMENT': lastChatbotStatementExplanation,
  'DT-CHATML': chatmlExplanation,
  'DT-CONSULT-LLM': consultLLMExplanation,
}

let activeExplanation = consultLLMExplanation



const debugArrow = ref<HTMLDivElement | null>(null)

type BeautifulMessage = { type: string, author: string, data: { text: string } }
const messageList = ref<BeautifulMessage[]>([])
function onMessageWasSent(message: BeautifulMessage) {
  // called when the user sends a message
  messageList.value.push(message)
  sendMessage(message.data.text)
}

const isChatOpen = ref(false)
const newMessagesCount = ref(0)
async function openChat() {
  await startDialog()
  // called when the user clicks on the fab button to open the chat
  isChatOpen.value = true
  newMessagesCount.value = 0
}
function closeChat() {
  // called when the user clicks on the botton to close the chat
  isChatOpen.value = false
}

let insertPosNode: HTMLElement | null = null
let insertBefore = false

const forbiddenSelects = ['DT-CHOICE', 'DT-LABEL', 'DT-ROLE']

const participants = [
  {
    id: 'Chatbot',
    name: 'Chatbot',
    imageUrl: 'annie.png'
  }
]

let redColors = {
  header: {
    bg: '#D32F2F',
    text: '#fff'
  },
  launcher: {
    bg: '#D32F2F'
  },
  messageList: {
    bg: '#fff'
  },
  sentMessage: {
    bg: '#F44336',
    text: '#fff'
  },
  receivedMessage: {
    bg: '#eaeaea',
    text: '#222222'
  },
  userInput: {
    bg: '#fff',
    text: '#212121'
  }
}

const insertOptions = ref(['consult-llm', 'last-user-statement', 'last-chatbot-statement', 'listen', 'context'])



let mouseDown = false
let pin: Range | null = null
let caretPos: Range | null = null
let currentRange: Range | null = new Range()
//This is done to avoid having to type a bunch of pointless exclamation marks on a variable that is only null for a few milliseconds
//@ts-ignore


function getCaretPos(e: MouseEvent): Range {
    //@ts-ignore
  if (document.caretPositionFromPoint) {
    //@ts-ignore
    const caretPos = document.caretPositionFromPoint(e.clientX, e.clientY)!
    const retval = new Range()
    retval.setStart(caretPos?.offsetNode, caretPos.offset)
    retval.collapse(true)
    return retval
  } else {
    return document.caretRangeFromPoint(e.clientX, e.clientY)!
  }
}



function getRangeHTML(): [string, string] {
  const unfilteredContents = currentRange!.cloneContents()
  const contents = getPasteLevel(unfilteredContents)
  const retHTML = transform2Dialogtree(contents)
  return [retHTML, '']
}
function substituteHTML(text: string) {
  console.log('am I in substitute html?')
  // 1. Clear the range
  currentRange!.deleteContents()
  // 2. Create fragment from HTML
  const div = document.createElement('div')
  div.innerHTML = text

  const fragment = document.createDocumentFragment();
  let lastNode = null;
  while (div.firstChild) {
    lastNode = div.firstChild;
    fragment.appendChild(div.firstChild);
  }
  if (!lastNode) {
    return
  }
  undoRedo.clean = false
  undoRedo.saveUndo()
  // 3. Insert content
  const range = document.createRange()
  range.setStart(currentRange!.startContainer, currentRange!.startOffset);
  range.collapse(true)

  range.insertNode(fragment)

  // 4. Move caret after the last inserted node
  const newRange = document.createRange()

  if (lastNode!.nodeType === Node.TEXT_NODE) {
    // If it's a text node, move to its end
    newRange.setStart(lastNode!, (lastNode!).textContent!.length)
  } else {
    // Otherwise, move after the element
    newRange.setStartAfter(lastNode!)
  }

  newRange.collapse(true)
  resetSelection(newRange)
  console.log('got here')
  undoRedo.saveUndo()
}
function substituteText(text: string) {
  let newRange = currentRange
  if (currentRange) {
    let leftString = ''
    let rightString = ''
    let oldStartNode = currentRange!.startContainer
    let oldEndNode = currentRange!.endContainer
    //If this condition isn't checked then pasting could happen inside of a non-text-node, which would raise an error
    if (!(oldStartNode.nodeType === 3 && oldEndNode.nodeType === 3)){
      return
    }
    if(oldStartNode === oldEndNode){
      const oldString = oldStartNode.nodeValue || ''
      leftString = oldString.slice(0, currentRange.startOffset)
      rightString = oldString.slice(currentRange.endOffset, oldString.length)
      oldStartNode.nodeValue =  leftString + text + rightString
    }else{
      while (oldStartNode.nextSibling !== oldEndNode){
        oldStartNode.nextSibling!.remove()
      }
      const oldLeftString = oldStartNode.nodeValue || ''
      const oldRightString = oldEndNode.nodeValue || ''
      leftString = oldLeftString.slice(0, currentRange.startOffset)
      rightString = oldRightString.slice(currentRange.endOffset, oldRightString.length);
      (oldEndNode as ChildNode).remove()
      oldStartNode.nodeValue = leftString + text + rightString
    }
    const newOffset = leftString.length + text.length
    newRange = new Range()
    newRange.setStart(oldStartNode, newOffset)
    newRange.setEnd(oldStartNode, newOffset)

  }
  undoRedo.clean = false
  undoRedo.saveUndo()
  resetSelection(newRange!)
}

//This avoids pointless undoRedo! typing when undoRedo is null only for a few milliseconds
//@ts-ignore
let undoRedo: UndoRedo = null
onMounted(   (async ()=>{
  await nextTick()
  await loadPage()
  undoRedo = new UndoRedo()
  editand.value!.addEventListener('mousedown', (e) => {
    deleteSelection()
    caret.value!.style.visibility = 'visible'
    mouseDown = true
    resetSelection(getCaretPos(e))
    if (e.altKey){
      console.log('tried firing custom event')
      e.composedPath()[0].dispatchEvent(
        new CustomEvent('try-insert-popup', {bubbles: true, detail: {x: e.clientX, y: e.clientY}})
      )
    }
  })
  editand.value!.addEventListener('mousemove', (e) => {
    if (!mouseDown) return
    if (!pin) {
      pin = currentRange!.cloneRange()
    }
    caretPos = getCaretPos(e)
    caretPos.startContainer.dispatchEvent(new CustomEvent('adjust-pin-event', { bubbles: true }))
    pin.startContainer.dispatchEvent(new CustomEvent('adjust-pin-event', { bubbles: true }))
    const nextRange = new Range()
    if (pin.compareBoundaryPoints(Range.START_TO_START, caretPos) < 0) {
      nextRange.setStart(pin.startContainer, pin.startOffset)
      nextRange.setEnd(caretPos.endContainer, caretPos.endOffset)
    } else {
      nextRange.setStart(caretPos.startContainer, caretPos.startOffset)
      nextRange.setEnd(pin.endContainer, pin.endOffset)
    }
    resetSelection(nextRange)
    undoRedo.saveUndo()
  })
  props.background.addEventListener('mouseup', (e) => {
    mouseDown = false
    pin = null
  })
  props.background.addEventListener('click', (e) => {
    const r = topLevelInsertPopup.value!.getBoundingClientRect()
    undoRedo.saveUndo()
    if ((e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom)) return
    topLevelInsertPopup.value!.style.display = 'none'

  }, { capture: true })

  keyboardTrap.value!.addEventListener("paste", (e) => {
    undoRedo.saveUndo()
    e.preventDefault()
  })
  keyboardTrap.value!.addEventListener("copy", (e) => {
    undoRedo.saveUndo()
    e.preventDefault()
  })
  keyboardTrap.value!.addEventListener('keydown', (e) => {
    if (e.key === 'c' && e.metaKey) {
      e.preventDefault()
      if (currentRange?.startContainer === currentRange?.endContainer && currentRange?.startContainer?.nodeType === 3){
        const copySourceString = currentRange?.startContainer?.nodeValue || ''
        navigator.clipboard.write([
           new ClipboardItem({
            "text/plain": new Blob([copySourceString.slice(currentRange.startOffset, currentRange.endOffset)], { type: 'text/plain' }),
          }) 
        ])
      } else {      
        const [copyHTML, copyText] = getRangeHTML()
        navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([copyHTML], { type: 'text/plain' }),
          })
        ])
        undoRedo.saveUndo()
      }
    }
    else if (e.key === 'z' && e.metaKey){
      if (e.shiftKey){
        undoRedo.redo()
      } else{
        undoRedo.undo()
      }
    }
    else if (e.key === "ArrowLeft") {
      undoRedo.saveUndo()
      e.preventDefault()
      const newRange = currentRange!.cloneRange()
      newRange.setStart(currentRange!.startContainer, currentRange!.startOffset - 1)
      newRange.collapse(true)
      resetSelection(newRange)
    }
    else if (e.key === "ArrowRight") {
      undoRedo.saveUndo()
      e.preventDefault()
      const newRange = currentRange!.cloneRange()
      newRange.setStart(currentRange!.endContainer, currentRange!.endOffset + 1)
      newRange.collapse(false)
      resetSelection(newRange)
    }
    else if (e.key === 'Backspace' || e.key === 'Delete') {
      const shouldSave = (currentRange && !(currentRange.collapsed))
      e.preventDefault()
      keyboardTrap.value!.value = ' '
      requestAnimationFrame(() => { keyboardTrap.value!.value = '' })
      let oldStartNode = currentRange!.startContainer
      let oldEndNode = currentRange!.endContainer
      const newRange = new Range()
      if (currentRange!.collapsed) {
        //This branch handles the case where there is an inline element embedded in the text
        if (currentRange?.startOffset === 0){
          const previousSibling = currentRange?.startContainer?.previousSibling
          const twoBackSibling = currentRange?.startContainer?.previousSibling?.previousSibling
          if (levels.sayLevel.includes((previousSibling! as HTMLElement)?.tagName!)){
            previousSibling?.remove()
            if (twoBackSibling?.nodeType === 3){
              const previousTextNode = twoBackSibling as Text
              const previousTextNodeContents = previousTextNode.nodeValue || ''
              const newTextNodeContents = previousTextNodeContents + ((currentRange?.startContainer as Text)?.nodeValue || '')
              previousTextNode.nodeValue = newTextNodeContents;
              (currentRange?.startContainer as Text).remove()
              const newRange = new Range()
              newRange.setStart(previousTextNode, previousTextNodeContents.length)
              newRange.setEnd(previousTextNode, previousTextNodeContents.length)
              undoRedo.clean = false
              //save an undo if the user deleted a highlighted region of text instead of a single character
              if (shouldSave){
                undoRedo.saveUndo()
              }
              resetSelection(newRange)
            }
          }
          return
        }
        else{
          currentRange!.setStart(currentRange!.startContainer, currentRange!.startOffset - 1)
          currentRange!.setEnd(currentRange!.endContainer, currentRange!.endOffset)
        }

      }
      newRange.setStart(currentRange!.startContainer, currentRange!.startOffset)
      newRange.collapse(true)
      currentRange!.deleteContents()
      resetSelection(newRange)
      oldStartNode.normalize()
      oldEndNode.normalize()
      undoRedo.clean = false
      //save an undo if the user deleted a highlighted region of text instead of a single character
      if (shouldSave){
        undoRedo.saveUndo()
      }

    }
    requestAnimationFrame(() => {
      keyboardTrap.value!.focus()
    })
  })
  keyboardTrap.value!.addEventListener('paste', (e)=>{
    console.log('paste event attempted')
    undoRedo.saveUndo()
    undoRedo.clean = false
    e.preventDefault()
    navigator.clipboard.read().then(items => {
      for (const item of items) {
        if (item.types.includes("text/plain")) {
          item.getType("text/plain").then(b => b.text()).then(t => {
            if (t.includes('<?xml')) {
              console.log('html paste')
              substituteHTML(t)
            } else {
              console.log('text paste', t)
              substituteText(t)
            }
          }
          )
          return
        }
      }
    })
  })
  keyboardTrap.value!.addEventListener('input', () => {
    const insertedText = keyboardTrap.value!.value
    requestAnimationFrame(() => {
      keyboardTrap.value!.value = ''
    })
    substituteText(insertedText)
    //do not save an undo of a single character insert, only mark undoRedo state as unclean
    undoRedo.clean = false
  })
  keyboardTrap.value!.addEventListener('beforeinput', () => {
    const x = props.background.scrollLeft;
    const y = props.background.scrollTop;
    requestAnimationFrame(() => props.background.scrollTo(x, y));
  })
}))

function pasteIntoText(e: Event){
  console.log('paste event attempted')
  undoRedo.saveUndo()
  undoRedo.clean = false
  e.preventDefault()
  navigator.clipboard.read().then(items => {
    for (const item of items) {
      if (item.types.includes("text/plain")) {
        item.getType("text/plain").then(b => b.text()).then(t => {
          if (t.includes('<?xml')) {
            console.log('html paste')
            substituteHTML(t)
          } else {
            console.log('text paste')
            substituteText(t)
          }
        }
        )
        return
      }
    }
  })
}

function addLabel(){
  insertPopups.forEach(p => p.value!.style.display = 'none')
  if (!insertPosNode){
    return
  }
  if (insertPosNode.firstElementChild?.tagName === 'DT-LABEL'){
    insertPosNode.removeChild(insertPosNode?.firstElementChild)
    renderSelection(null)
    undoRedo.saveUndo()
  } 
  const labelName = prompt('Enter label for this point in the dialogtree script')
  if (labelName){
    const newLabel = document.createElement('dt-label')
    const labelText = document.createTextNode(labelName)
    newLabel.appendChild(labelText)
    newLabel.setAttribute('dt-attr', '')
    insertPosNode.prepend(newLabel)
    renderSelection(null)
    undoRedo.saveUndo()
  }
}

class DtBase extends HTMLElement {
  pasteLevels: string[] = []
  giveText:boolean = true
  canBeInline:boolean = false
  constructor() {
    super()
    this.pasteLevels = []
  }
  connectedCallback() {

    this.addEventListener('adjust-pin-event', (e) => {
      
      const myRange = new Range()
      myRange.selectNode(this)
      const caretAfterPin = caretPos!.compareBoundaryPoints(Range.START_TO_START, pin!) >= 0
      const startP = (caretAfterPin ? pin! : caretPos!).cloneRange()
      const endP = (caretAfterPin ? caretPos! : pin!).cloneRange()
      const containsStart = (myRange.compareBoundaryPoints(Range.START_TO_START, startP) <= 0
        && myRange.compareBoundaryPoints(Range.END_TO_END, startP) >= 0
      )
      const containsEnd = (myRange.compareBoundaryPoints(Range.START_TO_START, endP) <= 0
        && myRange.compareBoundaryPoints(Range.END_TO_END, endP) >= 0
      )
      if (containsStart && containsEnd) {
        //selected range is inside node
        return
      } else if (!containsStart && !containsEnd) {
        //selected range is outside of node
        return
      }
      let nodeToSelect: HTMLElement = this
      if (forbiddenSelects.includes(this.tagName)) {
        console.log('forbiddenSelect')
        nodeToSelect = this.parentElement!
      }
      if (containsStart && !containsEnd) {
        startP.selectNode(nodeToSelect)
        startP.collapse(true)
      } else if (containsEnd && !containsStart) {
        endP.selectNode(nodeToSelect)
        endP.collapse(false)
      }
      if (caretAfterPin) {
        pin = startP
        caretPos = endP
      } else {
        pin = endP
        caretPos = startP
      }


    })
    if (['DT-DIALOGTREE', 'DT-BRANCH', 'DT-MATCH'].includes(this.parentElement!.tagName)) {

    }

    this.addEventListener('click', (e) => {
      if (!(this.tagName === 'DT-RUN') && this === e.composedPath()[0]){
        console.log(this.tagName, this.tagName === 'DT-RUN')
        caret.value!.style.backgroundColor = 'black'
      }
      insertPopups.forEach(p => p.value!.style.display = 'none')
      const myRect = this.getBoundingClientRect()
      const computedStyle = getComputedStyle(this)
      const paddingTop = parseFloat(computedStyle.paddingTop)
      const borderTop = parseFloat(computedStyle.borderTopWidth)
      const paddingBottom = parseFloat(computedStyle.paddingBottom)
      const borderBottom = parseFloat(computedStyle.borderBottom)
      const borderLeft = parseFloat(computedStyle.borderLeftWidth)
      const midPointX = myRect.left + (myRect.width / 2)
      const paddingTopMaxY = myRect.top + borderTop + paddingTop
      const paddingBottomMinY = myRect.bottom - borderBottom - paddingBottom
      const appropriateInsertPopup = this.parentElement!.tagName === 'DT-DIALOGTREE' ?
        topLevelInsertPopup.value! : this.parentElement!.tagName === 'DT-BRANCH' ?
          branchInsertPopup.value! : this.parentElement!.tagName === 'DT-MATCH' ?
            matchInsertPopup.value! : this.parentElement!.tagName === 'DT-CONSULT-LLM' ?
              chatmlInsertPopup.value! : contentInsertPopup.value!
      
      //branch for top green border
      if (e.clientY > myRect.top && e.clientY < paddingTopMaxY) {
        insertBefore = true
        insertPosNode = this
        if (e.metaKey){
          undoRedo.saveUndo()
          this.remove()
          undoRedo.clean= false
          return
        }
        if (e.shiftKey){
          if (!(insertPosNode.parentElement?.tagName === 'DT-DIALOGTREE')){
            return
          }
          if (insertPosNode.firstElementChild?.tagName === 'DT-LABEL'){
            insertPosNode.removeChild(insertPosNode?.firstElementChild)
            renderSelection(null)
            undoRedo.saveUndo()
          } 
          const labelName = prompt('Enter label for this point in the dialogtree script')
          if (labelName){
            const newLabel = document.createElement('dt-label')
            const labelText = document.createTextNode(labelName)
            newLabel.appendChild(labelText)
            newLabel.setAttribute('dt-attr', '')
            insertPosNode.prepend(newLabel)
            renderSelection(null)
            undoRedo.saveUndo()
          }

          return
        }
        renderSelection(null)
        renderInsertPopup(myRect.left, myRect.top + 23, appropriateInsertPopup)
        e.stopImmediatePropagation()
      }
      else if (e.clientX > myRect.left && e.clientX < myRect.left + borderLeft){
        const ae = activeExplanation.value
        if (ae) {
          ae.style.display = 'block'
          const parentScrollTop = ae.offsetParent!.scrollTop;
          ae.style.left = (myRect.left) + 'px'
          ae.style.top = (e.clientY + 20 + parentScrollTop) + 'px'
          e.stopPropagation()
        }
      }
      //branch for bottom green border
      else if (e.clientY < myRect.bottom && e.clientY > paddingBottomMinY) {
        insertBefore = false
        insertPosNode = this
        renderSelection(null)
        renderInsertPopup(myRect.left, paddingBottomMinY + 23, appropriateInsertPopup)
        e.stopImmediatePropagation()
      } else{
        if (this.childNodes.length === 0 && this.giveText){
          const newText = document.createTextNode(' ')
          this.appendChild(newText)
          const newRange = new Range()
          newRange.setStart(newText, 0)
          newRange.setEnd(newText, 0)
          e.stopImmediatePropagation()
          resetSelection(newRange)
        } else if (this.childNodes.length === 1  
            && this.childNodes[0].nodeType === 3 
            && (this.childNodes[0] as Text).data.length === 0 
            && this.giveText){
          const myTextNode = (this.childNodes[0] as Text)
          myTextNode.data = ' '
          const newRange = new Range()
          newRange.setStart(myTextNode, 0)
          newRange.setEnd(myTextNode, 0)
          e.stopImmediatePropagation()
          resetSelection(newRange)
        }
        //This branch handles the cursor going to the left or the right of an inline element
        else if (!(this.giveText)){
          console.log('got to can be inline')
          const newRange = new Range()
          if (e.clientX < midPointX){
            console.log('got to can be inline left')
            const previousSibling = this.previousSibling
            if ((!previousSibling) || previousSibling?.nodeType !== 3){
              const newPreviousSibling = new Text()
              newPreviousSibling.nodeValue = ''
              this.before(newPreviousSibling)
              newRange.setStart(newPreviousSibling, 0)
              newRange.setEnd(newPreviousSibling, 0)
            } else if (previousSibling.nodeType === 3){
              const pText = previousSibling as Text
              if (!(pText.nodeValue)){
                pText.nodeValue = ''
              }
              newRange.setStart(previousSibling, pText.nodeValue.length)
              newRange.setEnd(previousSibling, pText.nodeValue.length)
            }
          } else{
            console.log('got to can be inline right')
            const nextSibling = this.nextSibling
            if ((!nextSibling) || nextSibling?.nodeType !== 3){
              const newNextSibling = new Text()
              newNextSibling.nodeValue = ''
              this.after(newNextSibling)
              newRange.setStart(newNextSibling, 0)
              newRange.setEnd(newNextSibling, 0)
              console.log(newRange)
            } else if (nextSibling.nodeType === 3){
              const nText = nextSibling as Text
              if (!(nText.nodeValue)){
                nText.nodeValue = ''
              }
              newRange.setStart(nextSibling, 0)
              newRange.setEnd(nextSibling, 0)
            }
          }
          resetSelection(newRange)
        }
      } 
    })
    this.addEventListener('mousemove', (e) => {
      const myRect = this.getBoundingClientRect()
      const computedStyle = getComputedStyle(this)
      const paddingTop = parseFloat(computedStyle.paddingTop)
      const borderTop = parseFloat(computedStyle.borderTopWidth)
      const paddingBottom = parseFloat(computedStyle.paddingBottom)
      const borderBottom = parseFloat(computedStyle.borderBottom)
      const borderLeft = parseFloat(computedStyle.borderLeftWidth)
      const paddingTopMaxY = myRect.top + borderTop + paddingTop
      const paddingBottomMinY = myRect.bottom - borderBottom - paddingBottom
      // detect click on top green bar
      if (e.clientY > myRect.top && e.clientY < paddingTopMaxY) {
        this.style.cursor = 'copy'
      // detect click on bottom green bar
      } else if (e.clientY < myRect.bottom && e.clientY > paddingBottomMinY) {
        this.style.cursor = 'copy'
      // detect click on left colored info bar
      } else if (e.clientX > myRect.left && e.clientX < myRect.left + borderLeft) {
        this.style.cursor = 'help'
        //@ts-expect-error
        activeExplanation = explanationMap[this.tagName]

      } else {
        this.style.cursor = 'default'
        if (activeExplanation?.value) {
          activeExplanation.value.style.display = 'none'
        }
      }
    })
  }
}

const insertMenuChoices = ref<'say'|'chatml'|null>(null)


class DtRun extends DtBase {
  constructor() {
    super()
  }
  connectedCallback(){
    super.connectedCallback()
    this.addEventListener('click', ()=>{
      caret.value!.style.backgroundColor = 'white'
    })
  }
}
if (!customElements.get('dt-run')){
  customElements.define('dt-run', DtRun)
}

class DtSay extends DtBase {
  constructor() {
    super()
  }
  connectedCallback(){

    super.connectedCallback()
    this.addEventListener('try-insert-popup',  (e)=>{
      e.stopImmediatePropagation()
      renderInsertPopup(e.detail.x, e.detail.y, contentInsertPopup.value!)
    })
  }
}
if (!customElements.get('dt-say')){
  customElements.define('dt-say', DtSay)
}
class DtConsultLLM extends DtBase {
  constructor() {
    super()
  }
  connectedCallback(){
    super.connectedCallback()
    this.addEventListener('try-insert-popup',  (e)=>{
      e.stopImmediatePropagation()
      renderInsertPopup(e.detail.x, e.detail.y, contentInsertPopup.value!)
    })
  }

}
if (!customElements.get('dt-consult-llm')){
  customElements.define('dt-consult-llm', DtConsultLLM)
}

class DtBranch extends DtBase {
  constructor() {
    super()
  }
  connectedCallback() {
    super.connectedCallback()
  }
}

if (!customElements.get('dt-branch')){
  customElements.define('dt-branch', DtBranch)
}

class DtChoice extends DtBase {
  constructor() {
    super()
  }
}

if (!customElements.get('dt-choice')){
  customElements.define('dt-choice', DtChoice)
}

class DtMatch extends DtBase {
  constructor() {
    super()
  }
  connectedCallback() {
    super.connectedCallback()
  }
}
if (!customElements.get('dt-match')){
  customElements.define('dt-match', DtMatch)
}

class DtChoices extends DtBase {
  constructor() {
    super()
  }
}

if (!customElements.get('dt-choices')){
  customElements.define('dt-choices', DtChoices)
}


class DtGoto extends DtBase {
  constructor() {
    super()
  }
  connectedCallback(): void {

    super.connectedCallback()
  }
}

if (!customElements.get('dt-goto')){
  customElements.define('dt-goto', DtGoto)
}

class DtRetry extends DtBase {
  constructor() {
    super()
    this.giveText = false
  }
}

if (!customElements.get('dt-retry')){
  customElements.define('dt-retry', DtRetry)
}

class DtListen extends DtBase {
  constructor() {
    super()
    this.giveText = false
    this.canBeInline = true
  }
}
if (!customElements.get('dt-listen')){
  customElements.define('dt-listen', DtListen)
}

class DtLastChatbotStatement extends DtBase {
  constructor() {
    super()
    this.giveText = false
    this.canBeInline = true

  }
}

if (!customElements.get('dt-last-chatbot-statement')){
  customElements.define('dt-last-chatbot-statement', DtLastChatbotStatement)
}

class DtLastUserStatement extends DtBase {
  constructor() {
    super()
    this.giveText = false
    this.canBeInline = true
  }
}

if (!customElements.get('dt-last-user-statement')){
  customElements.define('dt-last-user-statement', DtLastUserStatement)
}

class DtContext extends DtBase {
  constructor() {
    super()
    this.canBeInline = true
  }
}

if (!customElements.get('dt-context')){
    customElements.define('dt-context', DtContext)
}


class DtChatml extends DtBase {
  constructor() {
    super()
  }
  connectedCallback(){

    super.connectedCallback()
    this.addEventListener('try-insert-popup',  (e)=>{
      e.stopImmediatePropagation()
      renderInsertPopup(e.detail.x, e.detail.y, contentInsertPopup.value!)
    })

  }
}

if (!customElements.get('dt-chatml')){
  customElements.define('dt-chatml', DtChatml)
}

class DtRole extends DtBase {
  constructor() {
    super()
  }
}

if (!customElements.get('dt-role')){
  customElements.define('dt-role', DtRole)
}


class DtLabel extends DtBase {
  constructor() {
    super()
  }
}

if (!customElements.get('dt-label')){
  customElements.define('dt-label', DtLabel)
}


class DtGoodbye extends DtBase {
  constructor() {
    super()
  }
  connectedCallback(): void {
    super.connectedCallback()
  }
}
if (!customElements.get('dt-goodbye')){
  customElements.define('dt-goodbye', DtGoodbye)
}

class DtDialogTree extends HTMLElement {
  constructor() {
    super()
  }
  connectedCallback() {
  this.addEventListener('click', e =>{
    if (e.composedPath()[0] === this && this.children.length===0){
      const doc = parser.parseFromString(insertElements['say'], 'application/xml')
      const frag = transform2Html(doc)
      while (frag.lastChild){
        this.appendChild(frag.lastChild)
      }
    }
  })
  }
}
if (!customElements.get('dt-dialogtree')){
  customElements.define('dt-dialogtree', DtDialogTree)
}






const levels = {
  topLevel: ['DT-SAY', 'DT-RUN', 'DT-BRANCH', 'DT-GOTO', 'DT-LISTEN'],
  sayLevel: ['DT-CONTEXT', 'DT-LAST-USER-STATEMENT', 'DT-LAST-CHATBOT-STATMENT', 'DT-HISTORY', 'DT-LISTEN', 'DT-RUN', 'DT-CONSULT-LLM'],
  consultLLMLevel: ['DT-CHATML'],
  branchLevel: ['DT-SAY', 'DT-MATCH', 'DT-RUN', 'DT-GOTO', 'DT-RETRY'],
  matchLevel: ['DT-SAY', 'DT-RUN', 'DT-GOTO', 'DT-RETRY']
}

function getPasteLevel(frag: DocumentFragment) {
  const tags = new Set<string>()
  for (const n of frag.childNodes) {
    if (n.nodeType === Node.ELEMENT_NODE) {
      tags.add((n as Element).tagName)
    }
  }
  const tagArr = Array.from(tags)

  const retlevels = []
  for (const [levelName, levelTagList] of Object.entries(levels)) {
    if (tagArr.every(t => levelTagList.includes(t))) {
      retlevels.push(levelName)
    }
  }
  const retval = document.createElement('dt-dialogtree')
  retval.setAttribute('data-paste-level', retlevels.join(' '))
  retval.appendChild(frag)
  return retval
}



function resetSelection(r: Range | null) {
  //@ts-ignore
  if ( r?.startContainer?.parentElement?.giveText === false ){
    resetSelection(null)
  //@ts-ignore
  }  else if ( r?.endContainer?.parentElement?.giveText === false ){
    resetSelection(null)
  }
  requestAnimationFrame(() => { keyboardTrap.value!.focus({ preventScroll: true }) })
  let sel = window.getSelection()!
  sel.removeAllRanges()
  if (r) {
    sel.addRange(r)
  }
  renderSelection(r)
}
const parser = new DOMParser()
const xmlSerializer = new XMLSerializer()
const dialogtree2HtmlProcessor = new XSLTProcessor()
const html2DialogtreeProcessor = new XSLTProcessor()

function dedentAllTextChildren(n: Node) {
  for (const cn of n.childNodes) {
    if (cn.nodeType === Node.TEXT_NODE && cn.nodeValue) {
      const stripFunction = cn.parentElement?.tagName === 'DT-RUN' ? dedentStripRun : dedentStrip
      const insval = stripFunction((cn as Text).nodeValue!)
      cn.textContent = insval
    } else {
      dedentAllTextChildren(cn)
    }
  }
}
function getScrollTop(n: HTMLElement){
  return n.offsetParent!.scrollTop
}

async function loadDocument(docname: string|undefined) {
  let frag = null
  if (docname){
    frag = transform2Html(parser.parseFromString(
      await (await fetch(
        '/salsa/server/get-dialogtree?' + new URLSearchParams({'dialogtree':docname, 'project':project})
      )).text(), 'application/xml'
    ))
  } else{
    console.log('tried to parse pharm3')
    frag = transform2Html(parser.parseFromString(
      pharm3, 'application/xml'
    ))
  }
  dedentAllTextChildren(frag)
  editand.value!.appendChild(frag)
}

function transform2Html(n: Node) {
  return dialogtree2HtmlProcessor.transformToFragment(n, document)
}
function transform2Dialogtree(n: Element) {
  const retval = xmlSerializer.serializeToString(html2DialogtreeProcessor.transformToDocument(
    parser.parseFromString(n.outerHTML, 'application/xml')
  ))
  return retval
}



async function loadPage() {
  dialogtree2HtmlProcessor.importStylesheet(parser.parseFromString(
    dialogtree2html, 'application/xml'
  ))
  html2DialogtreeProcessor.importStylesheet(parser.parseFromString(
    html2dialogtree, 'application/xml'
  ))
  await loadDocument(props.docname)
}








let nodeIdStart = 0
function assignNodeId(n: HTMLElement) {
  if (n.nodeType === Node.ELEMENT_NODE) {
    (n as Element).id = 'n' + nodeIdStart
    nodeIdStart += 1
  }
  for (const child of n.childNodes) {
    assignNodeId(child as HTMLElement)
  }
}

function highlightActiveNode(s: string) {
  const dba = debugArrow.value!
  const activeNode = document.getElementById(s)!
  const activeNodeRect = activeNode.getBoundingClientRect()!
  dba.style.visibility = 'visible'
  dba.style.left = (activeNodeRect.right) + 'px'
  dba.style.top = (activeNodeRect.top + getScrollTop(dba)) + 'px'
  dba.scrollIntoView({
    behavior: 'smooth',
    block: 'center', // Center the element vertically
  })
}
// #DOM manipulation
function insertNewDestination(name: (
  'say' | 'goodbye' | 'branch' | 'run' | 'goto' | 'context' | 'last-user-statement' |
  'last-chatbot-statement' | 'retry' | 'consult-llm' | 'match' | 'listen' | 'chatml-system' |
  'chatml-question'
)) {
  insertPopupClosed.value = false
  if (! undoRedo.clean){
      undoRedo.saveUndo()
  }
  let xmlSource
  if (name === 'context'){
    const keyName = prompt('Enter name of key to read from context')
    xmlSource = `<context>${keyName}</context>`
  } else{
    xmlSource = insertElements[name]
  }
  const doc = parser.parseFromString(xmlSource, 'application/xml')
  const frag = transform2Html(doc)
  insertPopups.forEach(p => p.value!.style.display = 'none')
  //ungeneric
  if (currentRange?.collapsed){
    const sParent = currentRange?.startContainer
    const beginText = sParent?.textContent?.slice(0, currentRange!.startOffset)!
    const beginNode = document.createTextNode(beginText)
    const endText = sParent?.textContent?.slice(currentRange!.startOffset)!
    const endNode = document.createTextNode(endText)
    sParent!.parentNode?.insertBefore(beginNode, sParent!)
    sParent!.parentNode?.insertBefore(endNode, sParent!)
    while (frag.lastChild!) {
      sParent?.parentNode?.insertBefore(frag.lastChild, endNode)
    }
    sParent?.parentNode?.removeChild(sParent)
    resetSelection(null)
  } else if (currentRange === null){
    const point = insertPosNode!
    const before = insertBefore!
    const parent = point.parentElement
    while (frag.lastChild!) {
      if (before) {
        parent?.insertBefore(frag.lastChild, point)

      } else if (point.nextElementSibling) {
        parent?.insertBefore(frag.lastChild, point.nextElementSibling)
      } else {
        parent?.append(frag.lastChild)
      }
    }
  } else{
    if (currentRange.startContainer === currentRange.endContainer && currentRange.startContainer.nodeType === 3){
      console.log('got to insert replace fragment')
      const leftNode = currentRange.startContainer as Text
      const origString = leftNode.nodeValue || ''
      const leftValue = origString.slice(0, currentRange.startOffset)
      const rightValue = origString.slice(currentRange.endOffset, origString.length)
      console.log('left value', leftValue)
      leftNode.nodeValue = leftValue
      console.log('right value', rightValue)
      leftNode.after(rightValue)
      leftNode.after(frag)
      resetSelection(null)
    }
  }

  //ungeneric
  resetSelection(null)
  undoRedo.clean = false
  undoRedo.saveUndo()
}
function doDelete(){
  insertPopups.forEach(p => p.value!.style.display = 'none')
  undoRedo.saveUndo()
  insertPosNode!.remove()
  undoRedo.clean= false
  return
}

async function doPaste(level: (
  'topLevel' | 'branchLevel' | 'matchLevel' | 'consultLLMLevel' | 'sayLevel'
)) {
  undoRedo.saveUndo()
  undoRedo.clean = false
  insertPopups.forEach(p => p.value!.style.display = 'none')
  const items = await navigator.clipboard.read()
  for (const item of items) {
    if (!item.types.includes('text/plain')) continue
    const chosenItem = await (await item.getType('text/plain')).text()
    if (!chosenItem.includes('<dialogtree data-paste-level')) continue
    const doc = parser.parseFromString(chosenItem, 'application/xml')
    if (!(doc.documentElement.getAttribute('data-paste-level')!.split(' ').includes(level))) {
      alert("Can't paste that here!")
      return
    }
    const frag = transform2Html(doc)
    {
      let div = document.createElement('div')
      div.appendChild(frag.cloneNode(true))
      console.log('pasteval', div.innerHTML)
    }
    const point = insertPosNode!
    const before = insertBefore!
    const parent = point.parentElement
    while (frag.lastChild!) {
      if (before) {
        parent?.insertBefore(frag.lastChild, point)

      } else if (point.nextElementSibling) {
        parent?.insertBefore(frag.lastChild, point.nextElementSibling)
      } else {
        parent?.append(frag.lastChild)
      }
    }
    undoRedo.saveUndo()
    return
  }
}

function dedentStripRun(s: string) {
  const minIndent = Math.min(...
    s.split('\n').filter(t => t.trim()).map(t => t.match(/^(\s|\t)*/)![0].length)
  )
  return (s.split('\n').map(t => t.slice(minIndent))).join('\n').trim()
}
function dedentStrip(s: string): string {
  const retval: string[] = []
  for (const l of s.split('\n')) {
    const strip_amount = l.match(/^(\s|\t)*/)![0].length
    retval.push(l.slice(strip_amount))
  }
  return retval.join('\n').trim()
}

const editedNode =  ref<HTMLElement|null|undefined>(null)
function switcheditedNode(newNode: HTMLElement|null|undefined){
  if (editedNode.value){
    editedNode.value.classList.remove('dt-edited-node')
  }
  if (newNode){
    newNode.classList.add('dt-edited-node')
  }
  editedNode.value = newNode
}

function deleteSelection() {
  rectContainer.value!.querySelectorAll('.dt-selectrect').forEach(el => el.remove())
}
function renderInsertPopup(x: number, y: number, popup: HTMLElement) {
  popup.style.display = 'block'
  popup.style.top = (y + getScrollTop(popup)) + 'px'
  popup.style.left = (x) + 'px'

}
function setInsertMenuChoice(r: Range|null) {
  let tag = ''
  let choice:('say'|'chatml'|null) = null
  if (!r){
  } else if (r.startContainer === r.endContainer && r.startContainer.nodeType === 3){
    tag = r.startContainer?.parentElement?.tagName || ''
  } 
  if (['DT-SAY', 'DT-GOODBYE', 'DT-GOTO', 'DT-CHOICE'].includes(tag)){
    choice = 'say'
  } else if (['DT-CHATML'].includes(tag)){
    choice = 'chatml'
  } 
  insertMenuChoices.value = choice
}
function renderSelection(r: Range | null) {
  setInsertMenuChoice(r)
  const parentScrollTop = getScrollTop(caret.value!)
  if (!r) {
    console.log('got null')
  }
  deleteSelection()
  currentRange = r

  if (!r) {
    caret.value!.style.visibility = 'hidden'
    switcheditedNode(null)
    return
  } else if (r.collapsed) {
    caret.value!.style.visibility = 'visible'
    if (currentRange!.startContainer.nodeType !== Node.TEXT_NODE) return
    switcheditedNode(currentRange?.startContainer?.parentElement)
    const posRange = currentRange!.cloneRange()
    let rects = null
    try {
      posRange.setEnd(currentRange!.startContainer, currentRange!.startOffset + 1)
      rects = posRange.getClientRects()
      caret.value!.style.left = (rects[0].left) + "px";
    } catch {
      posRange.setStart(currentRange!.startContainer, currentRange!.startOffset - 1)
      rects = posRange.getClientRects()
      caret.value!.style.left = (rects[rects.length - 1].right) + "px";
    }
    caret.value!.style.top = (rects[0].top) + parentScrollTop   + "px";
    caret.value!.style.height = (rects[0].height)   + "px";
    return
  } else {
    caret.value!.style.visibility = 'hidden'
    switcheditedNode(null)
  }
  const rects = r.getClientRects()
  for (const rect of rects) {
    const highlight = document.createElement('div')
    highlight.className = 'dt-selectrect'
    rectContainer.value!.appendChild(highlight)
    highlight.style.width = rect.width + 'px'
    highlight.style.height = rect.height + 'px'
    highlight.style.left = rect.left  + "px";
    highlight.style.top = rect.top + parentScrollTop  + "px";
  }
}
// #endregion

const textSocket = ref<WebSocket | null>(null)
const debugSocket = ref<WebSocket | null>(null)
const webrtcSocket = ref<WebSocket | null>(null)


const showTypingIndicator = ref("")
type DebugMessage = (
  ['chatbot', string] |
  ['user', string] |
  ['goodbye', string] |
  ['run-return-value', string] |
  ['prompt', string] |
  ['continuation', string] |
  ['executing-node-id', string] |
  ['choice', string] |
  ['retry', string] |
  ['goto', string]

)


const debugMessages = ref<DebugMessage[]>([])

async function startDialog() {
  textSocket.value = new WebSocket(`wss://${window.location.host}/salsa/socket/text-socket`)
  const dtDoc = editand.value!.firstElementChild!
  nodeIdStart = 0
  assignNodeId(dtDoc as HTMLElement)
  const xmlText = transform2Dialogtree(dtDoc)
  const callSid = 'test_jacob'
  textSocket.value!.onopen = () => {
    textSocket.value!.send(JSON.stringify(callSid))
    textSocket.value!.send(JSON.stringify(xmlText))
  }
  textSocket.value!.onmessage = (e) => {
    const data = JSON.parse(e.data)
    if (data === -2) {
      debugSocket.value = new WebSocket(`wss://${window.location.host}/salsa/socket/debug-socket`)
      debugSocket.value.onmessage = (e) => {
        const data: DebugMessage = JSON.parse(e.data)
        if (data[0] === 'executing-node-id') {
          highlightActiveNode(data[1])
        } else {
          debugMessages.value.push(data)
          nextTick().then(() => debugColumn.value!.scrollTo({ top: debugColumn.value!.scrollHeight, behavior: 'smooth' }))

        }
      }
      debugSocket.value.onopen = (e) => {
        debugSocket.value!.send(JSON.stringify(callSid))
      }
    } else if (data === 1) {
      showTypingIndicator.value = ""
    } else if (data[0] === 2){
      messageList.value.push({ type: 'text', author: 'me', data: { text: data[1] } })
    }
    else {
      messageList.value.push({ type: 'text', author: 'Chatbot', data: { text: data } })
    }
  }
}



async function sendMessage(m: string) {
  showTypingIndicator.value = "Chatbot"
  textSocket.value!.send(JSON.stringify(m))
}
async function advanceDebugger() {
  debugSocket.value!.send(JSON.stringify("step"))
}





// #region webrtc

const servers = {
    iceServers: [
        {'url': 'stun:global.stun.twilio.com:3478',
      'urls': 'stun:global.stun.twilio.com:3478'},
    {'url': 'turn:global.turn.twilio.com:3478?transport=udp',
      'username': 'ba869459b241183104321b4a28eba5f5f42e95d4a0a8575f2c0c411c704250cd',
      'urls': 'turn:global.turn.twilio.com:3478?transport=udp',
      'credential': 'LDaVKc9+vTr3jaus0VQS/oFb7KPYXGzOrWn1+VJ+JR4='},
    {'url': 'turn:global.turn.twilio.com:3478?transport=tcp',
      'username': 'ba869459b241183104321b4a28eba5f5f42e95d4a0a8575f2c0c411c704250cd',
      'urls': 'turn:global.turn.twilio.com:3478?transport=tcp',
      'credential': 'LDaVKc9+vTr3jaus0VQS/oFb7KPYXGzOrWn1+VJ+JR4='},
    {'url': 'turn:global.turn.twilio.com:443?transport=tcp',
      'username': 'ba869459b241183104321b4a28eba5f5f42e95d4a0a8575f2c0c411c704250cd',
      'urls': 'turn:global.turn.twilio.com:443?transport=tcp',
      'credential': 'LDaVKc9+vTr3jaus0VQS/oFb7KPYXGzOrWn1+VJ+JR4='}
  ],
  }
type WsMessageToServer = {
  verb: 'logon',
  username: string,
  call_sid: string,
  xml_text: string,
} | {
  verb: 'offer',
  offer: {
    sdp?: string
    type: RTCSdpType
  },
  toUser: string
} | {
  verb: 'answer',
  answer: {
    sdp?: string
    type: RTCSdpType
  },
  toUser: string
} | {
  verb: 'offerCandidate',
  offerCandidate: RTCIceCandidateInit,
  toUser: string
} | {
  verb: 'answerCandidate',
  answerCandidate: RTCIceCandidateInit,
  toUser: string
} | {
  verb: 'logoff'
}

export type WsMessageFromServer = {
  verb: 'logon',
  username: string
} | {
  verb: 'users',
  users: string[]
} | {
  verb: 'offer',
  offer: {
    sdp?: string
    type: RTCSdpType
  },
  fromUser: string
} | {
  verb: 'answer',
  answer: {
    sdp?: string
    type: RTCSdpType
  },
  fromUser: string
} | {
  verb: 'offerCandidate',
  offerCandidate: RTCIceCandidateInit,
  fromUser: string,
} | {
  verb: 'answerCandidate',
  answerCandidate: RTCIceCandidateInit,
  fromUser: string,
} | {
  verb: 'logoff',
  username: string
} | {
  verb: 'usernameTaken'
}

let localStream: (MediaStream | undefined)
let localStreamRef = ref<MediaStream>()
const connections: Map<string, RTCPeerConnection> = new Map()
const loggedIn = ref(false)
const webcamOn = ref(false)
const username = ref('jacob_test')
const userlist = ref<string[]>([])
const offerMap = ref(new Map<string, { sdp?: string, type: RTCSdpType }>())






const remoteVideo = ref<HTMLVideoElement | null>(null)
let pc: RTCPeerConnection

async function makeCall() {
  webrtcSocket.value = new WebSocket(`wss://${window.location.host}/salsa/socket/webrtc-socket`)
  await new Promise((resolve, reject) => {
    webrtcSocket.value!.onopen = () => { return resolve(undefined) }
  })
  pc = new RTCPeerConnection(

    servers
  )

  const dtDoc = editand.value!.firstElementChild!
  assignNodeId(dtDoc as HTMLElement)
  const xml_text = transform2Dialogtree(dtDoc)
  const call_sid = 'test_jacob'
  const username = 'test_jacob_username'
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  pc.addTrack(stream.getTracks()[0])
  const remoteStream = new MediaStream()
  remoteVideo.value!.srcObject = remoteStream
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      console.log('track ever added')
      remoteStream.addTrack(track)
    })
  }
  const offerDescription = await pc.createOffer()
  await pc.setLocalDescription(offerDescription)

  await new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve(undefined);
    } else {
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          resolve(undefined);
        }
      };
    }
  });
  console.log('done resolving')


  webrtcSocket.value!.onmessage = (e) => {
    const data = JSON.parse(e.data)
    if (data === 'ready') {
      webrtcSocket.value!.send(JSON.stringify("continue"))
      openChat()
      return
    }
    console.log('gothere!')
    pc.setRemoteDescription((new RTCSessionDescription(data)))
  }
  const offer = {
    sdp: pc.localDescription!.sdp,
    type: pc.localDescription!.type
  }
  webrtcSocket.value!.send(JSON.stringify({
    xml_text, username, call_sid, 'rtc_params': offer
  }))
}

class UndoRedo{
  clean: boolean
  undoBasis: Element
  undoStack: any[]
  redoStack: any[]
  dd:DiffDOM
  maxStackLen: number
  constructor(){
    this.clean = true
    this.undoStack = []
    this.redoStack = []
    this.undoBasis = editand.value!.cloneNode(true) as Element
    this.dd = new DiffDOM()
    this.maxStackLen = 10
  }
  undoStackPush(val:any){
    this.undoStack.push(val)
    this.undoStack.splice(0, this.undoStack.length - this.maxStackLen)
  }
  redoStackPush(val:any){
    this.redoStack.push(val)
    this.redoStack.splice(0, this.redoStack.length - this.maxStackLen)
    console.log('redo stack len', this.redoStack.length)
  }
  undo(){
    if (this.clean){
      if (this.undoStack.length > 0){
        //undoBasis and editan.value are equal at the beginning
        this.dd.apply(editand.value!, this.undoStack.pop())
        caret.value!.style.visibility = 'hidden'
        const redoDiff = this.dd.diff(editand.value!, this.undoBasis)
        this.redoStackPush(redoDiff)
        this.undoBasis = editand.value!.cloneNode(true) as Element
      }
      //This branch is called when undoing a sequence of typing without any other actions intervening
    } else{
      const undoDiff = this.dd.diff(editand.value!, this.undoBasis)
      const redoDiff = this.dd.diff(this.undoBasis, editand.value!)
      this.redoStackPush(redoDiff)
      this.dd.apply(editand.value!, undoDiff)
      caret.value!.style.visibility = 'hidden'
      this.clean = true
    }
  }
  redo(){
    console.log('tried Redo!', this.redoStack.length)
    if (this.redoStack.length > 0){
      const oldBasis = editand.value!.cloneNode(true) as Element
      this.dd.apply(editand.value!, this.redoStack.pop())
      caret.value!.style.visibility = 'hidden'
      const undoDiff = this.dd.diff(editand.value!, oldBasis)
      this.undoStack.push(undoDiff)
    }
  }
  saveUndo(){
    if (!this.clean){
      const undoDiff = this.dd.diff(editand.value!, this.undoBasis)
      this.undoStackPush(undoDiff)
      this.undoBasis = editand.value!.cloneNode(true) as Element
      this.clean = true
    }
  }
}





//#endregion





</script>
<style>


.dt-whole-editor, .dt-navbar{
  --say-color: green;
  --branch-color: blue;
  --goto-color: grey;
  --retry-color: rgb(218, 97, 83);
  --run-color: rgb(200, 0, 249);
  --last-user-statement-color: black;
  --last-user-statement-background-color: gold;
  --last-chatbot-statement-color: black;
  --last-chatbot-statement-background-color: rgb(0, 218, 218);
  --listen-color: white;
  --listen-background-color: green;
  --context-color: rgb(94, 16, 94);
  --context-background-color: lavender;
  --consult-llm-color: brown;
  --chatml-color: rgb(87, 64, 33);
  --chatml-background-color: rgb(246, 217, 179);
  --match-color: teal;
  --goodbye-color: red;
  --choice-color: rgb(211, 137, 1);
  --insert-color: rgb(209, 236, 209);

}

.dt-editor {
  width: 50em;
  user-select: none;
  font-family: Consolas, Menlo, Monaco, "Lucida Console", "DejaVu Sans Mono", monospace;
  font-size: 16pt;
  white-space: pre-wrap;


  dt-last-user-statement,
  dt-last-chatbot-statement,
  dt-listen,
  dt-context {
    border: 2px solid grey;
    display: inline-block;
    border-radius: 3px;
  }



  dt-last-user-statement {
    color: var(--last-user-statement-color);
    background-color: var(--last-user-statement-background-color);

    &::before {
      content: "Last user statement";
    }
  }

  dt-last-chatbot-statement {
    color: var(--last-chatbot-statement-color);
    background-color: var(--last-chatbot-statement-background-color);

    &::before {
      content: "Last chatbot statement";
    }
  }

  dt-listen {
    color: var(--listen-color);
    background-color: var(--listen-background-color);

    &::before {
      content: "Listen";
    }
  }

  dt-context {
    background-color: var(--context-background-color);

    &::before {
      color: var(---context-color);
      content: "Context=";
    }
  }


  dt-role {
    display: block;
    position: relative;
    left: 4em;
    top: -1.2em;
    border-right: 2px solid rgb(0,0,0,0);

    &::before {
      color: grey;
      content: " Role: ";
    }


}



  dt-say,
  dt-run,
  dt-consult-llm,
  dt-branch,
  dt-goto,
  dt-choice,
  dt-match,
  dt-retry,
  dt-goodbye,
  dt-chatml {
    &::before {
      position: relative;
      left: -1em;
    }

    margin-top: 0.3em;
    margin-bottom: 0.3em;
    border-top: 2em solid rgb(209, 236, 209);
    border-bottom: 2em solid rgb(209, 236, 209);
    border-left: 10px solid black;
    padding-left: 1em;
    display: block;
    min-height: 1em;
  }

  dt-say {
    &::before {
      content: 'Say';
      color: var(--say-color);
    }

    border-left-color: var(--say-color);
  }

  dt-branch {
    &::before {
      content: 'Branch';
      color: var(--say-color);
    }

    border-left-color: var(--branch-color);
  }

  dt-goto {
    &::before {
      content: 'Goto';
      color: var(--goto-color);
    }

    border-left-color: var(--goto-color);

  }
  dt-goodbye {
    &::before {
      content: 'Goodbye';
      color: var(--goodbye-color);
    }

    border-left-color: var(--goodbye-color);

  }

  dt-retry {
    &::before {
      content: 'Retry';
      color: var(--retry-color);
    }

    border-left-color: var(--retry-color);
  }

  dt-run {
    &::before {
      content: '  Run\A';
      color: var(--run-color);
    }

    border-left-color: var(--run-color);
    background-color: black;
    color: white;
    padding-left: 0em;
  }

  dt-choice {
    &::before {
      content: 'Choice';
      color: var(--choice-color);
    }

    border-top: none;
    border-bottom: none;
    border-left-color: var(--choice-color);
  }

  dt-consult-llm {
    &::before {
      content: 'Consult LLM';
      color: var(--consult-llm-color);
    }

    border-left-color: var(--consult-llm-color);
  }

  dt-match {
    &::before {
      content: 'Match';
      color: var(--match-color);
    }

    border-left-color: var(--match-color);
  }

  dt-chatml {
    background-color: var(--chatml-background-color);
    display: block;

    &::before {
      color: var(--chatml-color);
      content: " Chatml";
      display: block;
      position: relative;
    }

    border-left-color: var(--chatml-color);
  }









  .dt-meta {
    color: grey;
    font-family: Arial;
  }

  dt-label {
    &::before {
      Content: "Label:";
      color: grey;
    }

    display: block;
    position: relative;
    left: -0.5em;
    color: black;
  }




  dt-dialogtree:not(:has(> *)){
    background-color: var(--insert-color);
    min-height: 2em;
    display: block;
    cursor: copy;
  }

  .executing {
    background-color: lightsalmon;
  }


}

.dt-caret {
  display: inline-block;
  z-index: 9999;
  background-color:black;
  width: 2px;

  animation: blink 1s steps(2, start) infinite;
  vertical-align: text-bottom;
  position: absolute;
  visibility: hidden;
}

.dt-recttest {
  display: block;
  position: absolute;
  z-index: 10;
  background: rgba(0, 0, 0, 0.5)
}

@keyframes blink {
  to {
    visibility: hidden;
  }
}

@keyframes fadeInOut {
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }

  0% {
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes borderTopBlink {
  100% {
    border-top: 2em solid rgb(209, 236, 209, 1)
  }

  50% {
    border-top: 2em solid rgb(209, 236, 209, 0);
  }

  0% {
    border-top: 2em solid rgb(209, 236, 209, 1);
  }
}

@keyframes borderBottomBlink {
  100% {
    border-bottom: 2em solid rgb(209, 236, 209, 1)
  }

  50% {
    border-bottom: 2em solid rgb(209, 236, 209, 0);
  }

  0% {
    border-bottom: 2em solid rgb(209, 236, 209, 1);
  }
}


.border-bottom-blink {
  animation: borderBottomBlink 1s steps(2, start) infinite;
}

.border-top-blink {
  animation: borderTopBlink 1s steps(2, start) infinite;
}



.dt-selectrect {
  position: absolute;
  background-color: rgba(0, 120, 215, 0.3);
  pointer-events: none;
  z-index: 9999;
}

.dt-insert-popup {
  display: none;
  height: 2em;
  position: absolute;
  font-size: 2em;
  cursor: copy;
  z-index: 9999;
}

[class ^="dt-add-"] {
  border: 2px solid black;
  border-radius: 3px;
  display: inline-block;
  font-family: Consolas, Menlo, Monaco, "Lucida Console", "DejaVu Sans Mono", monospace;
  font-size: 16pt;
  background-color: white;
  margin-right: 0.2em;
  padding-left: 0.5em;
  padding-right: 0.5em;
}

.dt-add-say {
  color: var(--say-color);

}

.dt-add-branch {
  color: var(--branch-color);
}

.dt-add-run {
  color: var(--run-color);
}

.dt-add-goto {
  color: var(--goto-color);
}

.dt-add-retry {
  color: var(--retry-color);
}

.dt-add-goodbye {
  color: var(--goodbye-color);
}

.dt-add-match {
  color: var(--match-color);
}

.dt-add-consult-llm {
  color: var(--consult-llm-color);

}

.dt-add-context {
  color: var(--context-color);
  background-color: var(--context-background-color);
}

.dt-add-listen {
  color: var(--listen-color);
  background-color: var(--listen-background-color);
}

.dt-add-last-user-statement {
  color: var(--last-user-statement-color);
  background-color: var(--last-user-statement-background-color)
}

.dt-add-last-chatbot-statement {
  color: var(--last-chatbot-statement-color);
  background-color: var(--last-chatbot-statement-background-color);
}

.dt-add-chatml-system {
  color: var(--chatml-color);
  background-color: var(--chatml-background-color);
}

.dt-add-chatml-question {
  color: var(--chatml-color);
  background-color: var(--chatml-background-color);
}

.dt-add-paste {
  color: black;
  background-color: rgb(254, 254, 254);
}

.dt-debug-arrow {
  display: block;
  visibility: hidden;
  position: absolute;
  width: 0.6em;
  height: 0.6em;
  border: 0.6em solid red;
  border-width: 0 0.6em 0.6em 0;
  transform: rotate(135deg);
  /* base arrow pointing down-right */
}

.dt-avatar-img {
  width: 2em;
  height: 2em;
  border-radius: 2em;
}

.dt-explanations>div {
  position: absolute;
  max-width: 50vw;
  font-size: 16pt;
  display: none;
  background-color: beige;
  border: 2px solid black;
  border-radius: 5px;

}
.dt-tooltip{
  font-size: 24pt;
  color: black;
}
.dt-navbar{
  min-height: 1em;
  border-top: 2px solid black;
  border-bottom: 2px solid black;
  position: fixed;
  top: 0px;
  background-color: white;
  display: grid;
  width: 100vw;
  z-index:2147483600;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 5fr 1fr;

}
.dt-edited-node{
    border-right: 5px solid rgb(255, 0, 0, 1)
}
</style>