import requests
import sys
phone_number = sys.argv[-2]
response_code = sys.argv[-1]
print('here here!') 
requests.post(f'http://localhost:8123/internal/send-message', json=[phone_number, response_code])