import asyncio, aiofiles, os
from .conversation_controller import ConversationController
from ..config import ( call_recordings_directory)
from tempfile import NamedTemporaryFile
from dataclasses import dataclass
from ..dialogtree.dialog import Dialog
import json
from sqlalchemy import text
from .database import get_superuser_db
import datetime

STOPWORD_LIST =  ["yes", "sure", "yep", "yeah", "go", "ahead", "next", "ready", "ok", "okay", "continue", "going"]
NEGATIVE_STOPWORD_LIST =  ["no", "nope", "not", "isn't", "don't", "nuh", "aren't", "aint", "wait", "yet", "bit"]

dirpath = os.path.dirname(os.path.realpath(__file__))

@dataclass
class CallState:
    submission_id: str
    phone_number: str
    history: list
    controller: ConversationController
    previous_calls: int
    uuid: str
    outbound_call_script: str
    inbound_call_script: str

    def __init__(self, 
                xml_string:str,
                controller,
                stimulus_id:str = None,
                translator = None,
                participant_id:str = None,
                project:str = None,
                sequence_no:str = None,
                test_prototype_id:str=None,
                phone_number: str=None,
                submission_id:str=None
                ):
        self.submission_id = submission_id
        self.phone_number = phone_number
        self.xml_string = xml_string
        self.history = []
        self.controller = controller
        self.translator = translator
        self.project = project
        self.participant_id = participant_id
        self.real_timestamp = datetime.datetime.now()
        self.test_prototype_id = test_prototype_id
        self.stimulus_id = stimulus_id
        self.sequence_no=sequence_no


    async def hangup_on_time_limit(self):
        await asyncio.sleep(600)
        await self.controller.goodbye()



    async def say(self, quote:str, **kwargs):
        self.history.append(("SYSTEM", quote))
        await self.controller.say(quote=quote, **kwargs)
    
    async def listen(self):
        reply = await self.controller.listen()
        self.history.append(('USER', reply))
        return reply
    
    async def ask(self, quote, **kwargs):
        self.history.append(("SYSTEM", quote))
        print('got to ask')
        reply =  await self.controller.ask(quote, **kwargs)
        self.history.append(("USER", reply))
        return reply
    
    async def goodbye(self):
        self.controller.goodbye()


    async def after_call(self):
        #this prevents anything being saved if a coordinator is just testing a script in the browser
        print('got to after call', flush=True)
        await self.controller.end_event.wait()
        if self.project is None:
            return
        outbound_pcm_file = NamedTemporaryFile(suffix='.pcm', delete=False).name
        internal_pcm_file = NamedTemporaryFile(suffix='.pcm', delete=False).name
        async with aiofiles.open(internal_pcm_file, 'wb+') as f:
            await f.write(self.controller.participant_internal_track)
        async with aiofiles.open(outbound_pcm_file, 'wb+') as f:
            await f.write(self.controller.outbound_internal_track)
        dirname = f'{call_recordings_directory}/{self.project}'
        print(f'{self.project=}, {dirname=}')
        os.makedirs(dirname, exist_ok=True)
        wavname = f'{dirname}/{self.submission_id}.wav'
        transcript_json = {'call_info': self.dialog.get_json_to_save(), 'phone_number':self.phone_number}
        proc = await asyncio.create_subprocess_shell(
            (f'ffmpeg -ar 16k -f s16le -i {outbound_pcm_file} -ar 16k -f s16le -i {internal_pcm_file}'
            ' -filter_complex "[0:a][1:a]join=inputs=2:channel_layout=stereo[a]" -map "[a]" ')
            + wavname + 
            (f'&& rm {internal_pcm_file} {outbound_pcm_file}'),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        print(await proc.communicate(), flush=True)
        #This is a very bizarre control flow construct mandated by the requirements of python
        #This loop only ever "iterates" once
        async for db in get_superuser_db():
            if self.participant_id != '':
                await db.execute(text(
                    'INSERT INTO submission (project, participant_id, real_timestamp, other_data, test_prototype_id, submission_id, stimulus_id, sequence_no, quality) '
                    "             VALUES (:project, :participant_id, :real_timestamp, :other_data, :test_prototype_id, :submission_id, :stimulus_id, :sequence_no, 'perfect')"),{
                        'project':self.project,
                        'participant_id':self.participant_id,
                        'real_timestamp': self.real_timestamp,
                        'other_data':json.dumps(transcript_json),
                        'test_prototype_id':self.test_prototype_id,
                        'submission_id': self.submission_id,
                        'stimulus_id': self.stimulus_id,
                        'sequence_no': int(self.sequence_no) if self.sequence_no else None,
                    })
                await db.execute(text('''INSERT INTO submission_files (project, submission_id, stimulus_id, filepath )
                                        VALUES           (:project, :submission_id, :stimulus_id, :filepath )'''),
                                                    {
                                                        'project':self.project,
                                                        'submission_id':self.submission_id,
                                                        'stimulus_id':self.test_prototype_id,
                                                        'filepath':wavname
                                                    }  )
            else:
                await db.execute(text(
                    'INSERT INTO anonymous_phonecall (project, phone_number, real_timestamp, other_data, test_prototype_id, call_sid) '
                    "             VALUES (:project, :participant_id, :real_timestamp, :other_data, :test_prototype_id, :call_sid)"),{
                        'project':self.project,
                        'phone_number':self.phone_number,
                        'real_timestamp': self.real_timestamp,
                        'other_data':json.dumps(transcript_json),
                        'test_prototype_id':self.test_prototype_id,
                        'call_sid': self.submission_id,
                    })
                await db.execute(text('''INSERT INTO anonymous_phonecall_files (project, call_sid, filepath )
                                        VALUES           (:project, :submission_id, :call_sid, :filepath )'''),
                                                    {
                                                        'project':self.project,
                                                        'call_sid':self.submission_id,
                                                        'filepath':wavname
                                                    }  )

            await db.commit()
            
        


    async def inbound_coro(self):
        asyncio.ensure_future(self.after_call())
        context = {'patient_firstname': 'Jacob'}
        with open(f'{dirpath}/documents.json') as f:
            context['documents'] = json.load(f)
        with open(f'{dirpath}/prescriptions.txt') as f:
            context['prescriptions'] = f.read()
        self.dialog = Dialog(conversation=self, 
                        xml_text=self.xml_string, 
                         model="llama3.1:70b", functions={}, context=context)
        await self.dialog.run()
    
    def set_debug_socket(self, debug_socket):
        self.dialog.debug_socket = debug_socket





   

   


        
