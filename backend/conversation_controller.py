import asyncio, aiohttp, aiofiles, collections, webrtcvad
import numpy as np, time, sys
import nltk
from urllib.parse import quote_plus
from .database import salsa_config
from openai import AsyncOpenAI
from io import BytesIO
import wave


vad = webrtcvad.Vad()
vad.set_mode(1)


INTERNAL_SAMPLE_RATE=16000
INTERNAL_BYTE_WIDTH=2
SILENCE_CHECK_INTERVAL = 0.5
STOPWORD_INTERVAL = 0.75
STOPWORD_WINDOW = int(1.5*INTERNAL_SAMPLE_RATE*INTERNAL_BYTE_WIDTH)
TURN_WAIT_INTERVAL = 3
VAD_FRAME_BYTES = INTERNAL_BYTE_WIDTH * int((INTERNAL_SAMPLE_RATE/100)*3)
FRAMES_TO_SECONDS = 0.03
def seconds_to_time(t):
    return INTERNAL_BYTE_WIDTH * int(t*INTERNAL_SAMPLE_RATE)

  
OUTBOUND_BUFFER = 640
SILENCE_THRESHOLD = 0.4

class EndCall(Exception):
    pass


class ConversationController():
    def __init__(self, default_silence_window=1):
        self.participant_internal_track = bytearray()#translated to 16khz pcm_s16le mono from inbound audio (8Khz mulaw for phone)
        self.outbound_internal_track = bytearray()#robot's voice in its internal 16khz pcm_s16le mono representation 
        self.participant_received_pos = 0
        self.vad_pos = 0
        self.outbound_sent_pos = 0
        self.timers = {}
        self.call_over = False
        self.end_event = asyncio.Event()
        self.default_silence_window = default_silence_window
        self.listeners = []



    async def check_timers(self):
        evict_flags = []
        for k, v in self.timers.items():
            if self.outbound_sent_pos > k:
                v.set()
                evict_flags.append(k)
        for k in evict_flags:
            self.timers.pop(k)


    def add_timer(self, end_pos):
        timer = asyncio.Event()
        self.timers[end_pos] = timer
        return timer


    async def receive_inbound(self, received_bytes):
        self.participant_internal_track.extend(received_bytes)
        self.participant_received_pos = len(self.participant_internal_track)
        await self.check_timers()

    def send_outbound(self):
        if self.call_over:
            raise EndCall
        buffer_pos = self.participant_received_pos + OUTBOUND_BUFFER
        silence_needed = buffer_pos - len(self.outbound_internal_track)
        if silence_needed > 0:
            self.outbound_internal_track.extend(silence_needed*b'\x00')
        retval = self.outbound_internal_track[self.outbound_sent_pos:buffer_pos]
        self.outbound_sent_pos = buffer_pos
        return retval
    
    def send_outbound_desync(self, num_samples):
        if self.call_over:
            raise EndCall
        buffer_pos = self.outbound_sent_pos + num_samples
        silence_needed = buffer_pos - len(self.outbound_internal_track)
        if silence_needed > 0:
            self.outbound_internal_track.extend(silence_needed*b'\x00')
        retval = self.outbound_internal_track[self.outbound_sent_pos:buffer_pos]
        self.outbound_sent_pos = buffer_pos
        return retval
    

    def pause(self, seconds):
        self.outbound_internal_track.extend(seconds_to_time(seconds) * b'\x00')
        return len(self.outbound_internal_track)

    async def await_silence(self, *args, **kwargs):
        silence_window_check_length = int(kwargs['silence_window'] / 0.03)
        force_end = asyncio.ensure_future(asyncio.sleep(70))
        silence_window_vadframes = int(kwargs['minimum_turn_time'] // 0.03)
        observation_window = collections.deque(maxlen=silence_window_vadframes)
        self.vad_pos = len(self.participant_internal_track)
        while True:
            if force_end.done():
                return True
            await asyncio.sleep(SILENCE_CHECK_INTERVAL)
            while True:
                frame = self.participant_internal_track[self.vad_pos:self.vad_pos + VAD_FRAME_BYTES]
                self.vad_pos += VAD_FRAME_BYTES
                if self.vad_pos > len(self.participant_internal_track):
                    self.vad_pos = len(self.participant_internal_track)
                if len(frame) == VAD_FRAME_BYTES:
                    is_speech = vad.is_speech(frame, INTERNAL_SAMPLE_RATE)
                    observation_window.append(is_speech)
                else:
                    is_speech_prob = sum(list(observation_window)[-silence_window_check_length:]) / silence_window_check_length
                    print('speech prob', is_speech_prob)
                    print(len(observation_window), silence_window_vadframes, silence_window_vadframes*0.03)
                    if len(observation_window) == silence_window_vadframes  and\
                    is_speech_prob < SILENCE_THRESHOLD:
                        return True
                    else:
                        break


    async def await_stopword(self, stopword_list):
        force_end = asyncio.ensure_future(asyncio.sleep(70))
        while True:
            if force_end.done():
                return ""
            await asyncio.sleep(STOPWORD_INTERVAL)
            async with aiohttp.ClientSession() as session:
                async with session.post(f'{salsa_config.stt_url}/process-stopword', data=self.participant_internal_track[-STOPWORD_WINDOW:]) as resp:
                    stopword = await resp.text()
                    print('stopword', stopword, flush=True)
                    if any(sl.lower() in stopword.lower() for sl in stopword_list):
                        return stopword

    async def await_time(self, time):
        await asyncio.sleep(time)
        return True
    

    #Files to be played must be in the 16khz pcm_s16le mono wav format
    async def play_file(self, file_:str, final_pause:float=0, initial_pause:float=0.5):
        async with aiofiles.open(file_) as f:
            self.outbound_internal_track.extend((await f.read())[44:])
        await self.pause(initial_pause)
        self.send_outbound()
        await self.pause(final_pause)
        return len(self.outbound_internal_track) 


    async def say(self, quote:str, final_pause:float=0, initial_pause:float=0.5):
        if salsa_config.tts_type == 'openai':
            client = AsyncOpenAI(api_key=salsa_config.api_key)
        self.pause(initial_pause)
        for sentence in nltk.sent_tokenize(quote):
            if salsa_config.tts_type == 'self-hosted':
                async with aiohttp.ClientSession() as session:
                    async with session.get(f'{salsa_config.tts_url}/generate', json=sentence) as resp:
                        bytes_ = (await resp.read())[44:]
                resample = 16000 / 16000
            elif salsa_config.tts_type == 'openai':
                speech = await client.audio.speech.create(
                    model=salsa_config.tts_model,  
                    voice="alloy",            # available voices: alloy, verse, shimmer, etc.
                    input=sentence,
                    response_format='pcm'
                )
                bytes_ = speech.read()
                resample = 16000 / 24000 
            code = '<i2'
            #The voice seems to come in too loud so i reduce the volume this way
            y = np.frombuffer(bytes_, code) >> 1
            oldxlen = y.size
            oldx = np.linspace(0, oldxlen, oldxlen)
            newx = np.linspace(0, oldxlen, int(oldxlen*resample))
            new_bytes_ = np.interp(newx, oldx, y).astype('<i2').tobytes()
            self.outbound_internal_track.extend(new_bytes_)
        self.pause(final_pause)
        print('got to end of say')
        return len(self.outbound_internal_track) 

    async def ask(
            self, 
            question, 
            file=None, 
            await_silence=True, 
            stopword_list=None, 
            wait_time=30, 
            minimum_turn_time=3, 
            silence_window=None, 
            final_pause=0.5,return_stopword=False):
        if salsa_config.stt_type == 'openai':
            client = AsyncOpenAI(api_key=salsa_config.api_key)
        if silence_window is None:
            silence_window = self.default_silence_window
        await self.say(question, final_pause=final_pause)
        if file is not None:
            await self.play_file(file)
        end_speech_pos = self.pause(2)
        print('end_speech_pos', end_speech_pos)
        await self.add_timer(end_speech_pos).wait()
        print("asked", question)
        start_timepoint = len(self.participant_internal_track) - seconds_to_time(2)
        self.listeners = []
        if wait_time:
            self.listeners.append(self.await_time(wait_time))
        if stopword_list:
            self.listeners.append(self.await_stopword(stopword_list))
        if await_silence:
            self.listeners.append(self.await_silence(minimum_turn_time=minimum_turn_time, silence_window=silence_window))
        self.listeners = [asyncio.create_task(l) for l in self.listeners]
        done, pending = await asyncio.wait(self.listeners, return_when=asyncio.FIRST_COMPLETED)
        for t in pending:
            t.cancel()
        print('finished listening')
        if return_stopword:
            return done.pop().result()
        send_bytes = self.participant_internal_track[start_timepoint:]
        if salsa_config.stt_type == 'self-hosted':
            async with aiohttp.ClientSession() as session:
                async with session.post(f'{salsa_config.stt_url}/process-bytes?prompt={quote_plus(question)}', data=send_bytes) as resp:
                    callee_says = await resp.text()
                    retval = callee_says
        elif salsa_config.stt_type == 'openai':
            audio_file = BytesIO()
            audio_file.name='audio.wav'
            with wave.open(audio_file, 'wb') as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(16000)
                wf.writeframes(send_bytes)
            audio_file.seek(0)
            transcript = await client.audio.transcriptions.create(
                    model=salsa_config.stt_model,  
                    file=audio_file,
                )
            callee_says = transcript.text
            print("callee", callee_says, flush=True)
            retval = callee_says
        return retval

    
    async def listen(
        self, 
        await_silence=True, 
        stopword_list=None, 
        wait_time=30, 
        minimum_turn_time=3, 
        silence_window=None, 
        return_stopword=False):
        if silence_window is None:
            silence_window = self.default_silence_window
        end_speech_pos = self.pause(0.1)
        print('end_speech_pos', end_speech_pos)
        await self.add_timer(end_speech_pos).wait()
        start_timepoint = len(self.participant_internal_track) - seconds_to_time(2)
        self.listeners = []
        if wait_time:
            self.listeners.append(self.await_time(wait_time))
        if stopword_list:
            self.listeners.append(self.await_stopword(stopword_list))
        if await_silence:
            self.listeners.append(self.await_silence(minimum_turn_time=minimum_turn_time, silence_window=silence_window))
        self.listeners = [asyncio.create_task(l) for l in self.listeners]
        done, pending = await asyncio.wait(self.listeners, return_when=asyncio.FIRST_COMPLETED)
        for t in pending:
            t.cancel()
        print('finished listening')
        if return_stopword:
            return done.pop().result()
        send_bytes = self.participant_internal_track[start_timepoint:]
        async with aiohttp.ClientSession() as session:
            async with session.post(f'{salsa_config.stt_url}/process-bytes', data=send_bytes) as resp:
                callee_says = await resp.text()
                print("callee", callee_says, flush=True)
                retval = callee_says
        return retval

    def goodbye(self):
        print('goodbye')
        for l in self.listeners:
            l.cancel()
        self.call_over = True
        self.end_event.set()
