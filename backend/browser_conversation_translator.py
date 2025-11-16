
from websockets.exceptions import ConnectionClosedError, ConnectionClosedOK
from starlette.websockets import WebSocketDisconnect
from .conversation_controller import EndCall
import time
from aiortc import MediaStreamTrack
from av import AudioFrame
import numpy as np
import fractions
import asyncio

last_time = None


class BrowserConversationTranslator:
    class OpusTranslator(MediaStreamTrack):
        kind = "audio"

        def __init__(self, controller):
            super().__init__()
            self.controller = controller
            self.timestamp = 0
            self.pts = 48000
            self.outtrack = bytearray()
            self.start_time = None
        
        async def recv(self):
            try:
                if self.start_time is None:
                    self.start_time = time.time()
                b = np.frombuffer(self.controller.send_outbound_desync(320), '<i2')
                blen = len(b)
                rawbytes = np.repeat(b, 3).tobytes()
                samples = len(rawbytes) // 2
                frame = AudioFrame(format='s16', layout='mono', samples=samples)
                frame.planes[0].update(rawbytes)
                frame.sample_rate = 48000
                frame.time_base = fractions.Fraction(1, 48000)
                self.timestamp += len(rawbytes) // 2
                should_send = (time.time() - self.start_time) * 48000
                if (self.timestamp - should_send) > 0:
                    await asyncio.sleep((self.timestamp - should_send) / 48000)
                frame.pts = self.timestamp
                self.outtrack.extend(rawbytes)
                return frame
            except Exception as e:
                print(e)


    
    def __init__(self, remote_track, local_track,  call_sid, controller, pc):
        self.remote_track = remote_track
        self.controller = controller
        self.local_track = local_track
        self.call_sid = call_sid
        self.pc = pc
        self.inbytes = bytearray()
    
    async def handle_sockets(self):
        try:
            print('in handle sockets')
            while True:
                frame = await self.remote_track.recv()
                this_time = time.time()
                if frame.samples == 0:
                    if last_time is None:
                        continue
                    else:
                        if this_time - last_time > 10:
                            raise EndCall
                else:
                    last_time = this_time
                await self.translate_receive_inbound(frame)
        except EndCall:
            print('call ended')
        finally:
            self.controller.goodbye()
            with open('test.pcm', 'wb+') as f:
                f.write(self.inbytes)
            


    async def translate_receive_inbound(self, frame):
        if frame.format.name == 's16':
            arr = frame.to_ndarray()
            channel_0 = arr.reshape(-1, len(frame.layout.channels))[:, 0]
            #crude but effective means of downsampling from 48 khz to 16 khz
            every_third = channel_0.reshape(-1, 3)[:, 0]
            rawbytes = every_third.tobytes()
            #channel_0 = torch.from_numpy(samples[:, 0].astype(np.float32) / 2**15)
            #resampled = (self.input_resampler(channel_0).numpy() * 2**15).astype('<i2')
            #rawbytes = resampled.tobytes()
        self.inbytes.extend(rawbytes)
        await self.controller.receive_inbound(rawbytes)