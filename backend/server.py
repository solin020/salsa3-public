import json

import numpy as np

from .alignment import align, load_align_model
from .asr import load_model
from starlette import Starlette
from starlette.responses import JSONResponse
app = Starlette()


batch_size = 8
compute_type = "float16"
output_format = "json"
verbose = True
task = "transcribe"
model_dir='/models'
vad_onset = 0.5
vad_offset = 0.363
chunk_size = 30
batch_size: int = 8
output_format: str = "json"
device: str = "cuda"
device_index: int = 0
compute_type: str = "float16"
temperature = [0]
faster_whisper_threads = 4
asr_options = {
    "beam_size": 5,
    "patience": 1.0,
    "length_penalty": 1.0,
    "temperatures": [0],
    "compression_ratio_threshold": 2.4,
    "log_prob_threshold": -1.0,
    "no_speech_threshold": 0.6,
    "condition_on_previous_text": False,
    "initial_prompt": None,
    "suppress_tokens": [-1],
    "suppress_numerals": True,
}
model = load_model('large-v2', 
                   device=device, 
                   device_index=0, 
                   download_root=model_dir, 
                   compute_type=compute_type, 
                   language='en', 
                   asr_options=asr_options, 
                   vad_options={"vad_onset": vad_onset, "vad_offset": vad_offset}, 
                   task='transcribe', 
                   threads=faster_whisper_threads)
align_model, align_metadata = load_align_model(
    'en', 
    device, 
    model_name='WAV2VEC2_ASR_LARGE_LV60K_960H')


@app.post('/process-bytes')
async def process_bytes(request):
    audio = (np.frombuffer(await request.body(), dtype='<i2') / 32768).astype(np.float32)
    print(">>Performing transcription...")
    result = model.transcribe(audio, 
                              batch_size=batch_size, 
                              chunk_size=chunk_size, 
                              print_progress=True)
    print('>>Performing alignment...')
    result = align(result["segments"], 
                   align_model, 
                   align_metadata, 
                   audio, 
                   device, 
                   interpolate_method='nearest', 
                   return_char_alignments=False, 
                   print_progress=True)
    result["language"] = 'en'
    return JSONResponse(json.dumps(result))

