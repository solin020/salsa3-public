tts_port=54322
stt_port=54323
model_directory='./salsa_scheduler/models'
import os
from starlette.config import Config
dir_path = os.path.dirname(os.path.realpath(__file__))
secret_config = Config(f"{dir_path}/.env")
frontend_directory = '/app/frontend'
test_prototype_directory = '/app/uploads/test-prototypes'
message_response_directory = '/app/uploads/message-responses'
annotation_directory = '/app/uploads/annotations'
db_username = secret_config('DBUSERNAME')
db_password = secret_config('DBPASSWORD')
db_host = secret_config('DBHOST')
db_name = secret_config('DBNAME')
docker_internal_port=8000
main_port='3001'
tts_port = '54322'
stt_port = '54323'
config_varnames = [
    'tts_url',
    'stt_url',
    'ollama_url',
    'public_url',
    'wss_url',
    'llm_model', 
    'llm_type',
    'stt_type',
    'tts_type',
    'api_key',
    'tts_model',
    'stt_model',
    'gpg_key_name',
    'gpg_passphrase',
]
call_recordings_directory = '/app/uploads/call_recordings'

