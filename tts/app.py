from starlette.responses import PlainTextResponse
from starlette.requests import Request
from starlette.applications import Starlette
from starlette.routing import Route
import torch
import time
from ..config import model_directory, tts_port
import os
from transformers import SpeechT5Processor, SpeechT5ForTextToSpeech, SpeechT5HifiGan
from datasets import load_dataset

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
embeddings_dataset = load_dataset("Matthijs/cmu-arctic-xvectors", split="validation")
speaker_embedding = torch.tensor(embeddings_dataset[7306]["xvector"]).unsqueeze(0).to(device=device)
processor = SpeechT5Processor.from_pretrained("microsoft/speecht5_tts")
model = SpeechT5ForTextToSpeech.from_pretrained("microsoft/speecht5_tts").to(device)
vocoder = SpeechT5HifiGan.from_pretrained("microsoft/speecht5_hifigan").to(device)

def get_bytes(text):
    inputs = processor(text=text, return_tensors="pt").to(device)
    return (model.generate_speech(inputs["input_ids"], speaker_embedding, vocoder=vocoder).cpu().numpy() * 2 **15).astype('<i2').tobytes()



app = Starlette()
@app.route('/generate', methods=['GET'])
async def generate(request):
    text = await request.json()
    start_time = time.time()
    bytes_ = get_bytes(text)
    print('tts time', start_time-time.time())
    return PlainTextResponse(bytes_)

    
import uvicorn
uvicorn.run(app, host='0.0.0.0', port=int(tts_port))
