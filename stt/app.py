from starlette.responses import PlainTextResponse
from starlette.requests import Request
from starlette.applications import Starlette
from starlette.routing import Route
import whisper
import numpy as np
import os
import wave
import time
from ..config import model_directory, stt_port
import torch
stt_model_dir = os.path.join(model_directory, 'whisper-large-v2')
device='cuda:0'
model = whisper.load_model('large-v3', device=device)
import math


SILENCE_TOKEN = "~silence~"      # What to return for non-speech
SAMPLE_RATE = 16000              # Whisper expects 16kHz
# Thresholds (tune for your data/room)
RMS_GATE_DBFS = -45.0            # below this avg level, treat as silence early
NO_SPEECH_PROB_THRESH = 0.60     # avg no_speech probability to call it "no speech"
MIN_TRANSCRIPT_CHARS = 3         # if transcript shorter than this, likely noise
MIN_ALPHA_RATIO = 0.25           # letters / all chars; low ratio => likely noise

"Say yes, no, or continue to move on. Are you ready?"
app = Starlette()


@app.route('/process-bytes', methods=['POST'])
async def process_array(request):
    start_time = time.time()
    audio = (np.frombuffer(await request.body(), dtype='<i2') / 32768).astype(np.float32)
    transcription = transcribe(audio) 
    print('stt time', time.time()-start_time)
    return PlainTextResponse(transcription)

@app.route('/process-stopword', methods=['POST'])
async def process_array(request):
    start_time = time.time()
    audio = (np.frombuffer(await request.body(), dtype='<i2') / 32768).astype(np.float32)
    transcription = transcribe(audio) 
    print('stopword time', time.time()-start_time)
    return PlainTextResponse(transcription)





def _dbfs(x: np.ndarray) -> float:
    """RMS dBFS (0 dBFS = full-scale)."""
    if x.size == 0:
        return -120.0
    rms = np.sqrt(np.mean(np.square(x), dtype=np.float64))
    # Full-scale for float PCM assumed = 1.0
    return 20.0 * math.log10(max(rms, 1e-12))

def _alpha_ratio(s: str) -> float:
    if not s:
        return 0.0
    letters = sum(ch.isalpha() for ch in s)
    return letters / max(len(s), 1)

def transcribe(
    audio,
    language: str = 'en',  # set 'en' if you know it; else None for auto,
    prompt = None
):
    """
    Args:
      audio: path to audio file (any ffmpeg-readable) OR 1D float32 numpy array at 16kHz.
      language: ISO 639-1 code (e.g. 'en'), or None for auto-detect.

    Returns:
      dict with:
        - label: "speech" | "no_speech"
        - text: transcript (when speech)
        - token: SILENCE_TOKEN (when no_speech)
        - metrics: diagnostic numbers to help tuning
    """
    # Load/normalize audio for Whisper
    if isinstance(audio, str):
        wav = whisper.load_audio(audio)           # returns float32, 16kHz
    else:
        wav = audio.astype(np.float32, copy=False)

    # Quick sanity: mono & 16k
    if wav.ndim != 1:
        raise ValueError("Expect a mono 1D waveform at 16 kHz.")
    # Early energy gate for near-zero clips
    clip_dbfs = _dbfs(wav)
    if clip_dbfs < RMS_GATE_DBFS:
        return SILENCE_TOKEN

    # Transcribe with decoding knobs that help Whisper suppress non-speech
    # - temperature=0 for deterministic decoding
    # - condition_on_previous_text=False so each clip stands alone
    # - without_timestamps speeds things up and simplifies outputs
    result = model.transcribe(
        wav,
        language=language,
        task="transcribe",
        temperature=0.0,
        condition_on_previous_text=False,
        no_speech_threshold=NO_SPEECH_PROB_THRESH,
        logprob_threshold=-1.0,             # keep fairly permissive; we gate ourselves
        compression_ratio_threshold=2.4,    # default; helps filter garbage when extreme
        without_timestamps=True,
        fp16=(device == "cuda"),
        verbose=False,
    )

    text = (result.get("text") or "").strip()
    segments = result.get("segments") or []

    # Aggregate Whisper's non-speech score
    if segments:
        avg_no_speech = float(np.mean([seg.get("no_speech_prob", 0.0) for seg in segments]))
    else:
        # (rare) if no segments returned, treat as no speech
        avg_no_speech = 1.0

    alpha = _alpha_ratio(text)
    char_len = len(text)

    # Decision logic:
    #   - High no_speech score and tiny/garbage text => no speech
    #   - Otherwise, accept transcript
    is_non_speech_by_model = avg_no_speech >= NO_SPEECH_PROB_THRESH
    is_tiny_or_noise_text = (char_len < MIN_TRANSCRIPT_CHARS) or (alpha < MIN_ALPHA_RATIO)

    if is_non_speech_by_model and is_tiny_or_noise_text:
        return SILENCE_TOKEN
    # Otherwise: speech detected
    return text

with wave.open(os.path.join(os.path.dirname(os.path.realpath(__file__)),'warmup.wav')) as f:
    start_time = time.time()
    frames = f.readframes(f.getnframes())
    audio = (np.frombuffer(frames, dtype='<i2') / 32768).astype(np.float32)

    
import uvicorn
uvicorn.run(app, host='0.0.0.0', port=int(stt_port))
