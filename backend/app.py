from fastapi import FastAPI, Request, Response, Depends, HTTPException, Query
from starlette.responses import FileResponse , StreamingResponse, PlainTextResponse
from fastapi.responses import JSONResponse
from starlette.staticfiles import StaticFiles
from starlette.background import BackgroundTask
from twilio.rest import Client
from .database import get_db,  mark_downloaded, get_superuser_db, update_salsa_config, salsa_config
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, text
from sqlalchemy import text as sqlalchemy_text, bindparam, String
from datetime import datetime, timezone, timedelta
from uuid import uuid4
import re, aiofiles, os, aiofiles.os, phonenumbers, asyncio, csv, zipfile
from zipfile import ZipFile
from ..config import (frontend_directory,
    docker_internal_port, config_varnames)
import datetime as DateTime
import json
from .upload_files import (save_submission,save_test_prototype, 
    get_test_prototype_dir_path,get_test_prototype_file_path,get_test_prototype_zip_path, save_xml, 
    make_file_zip)
from .test_prototype import TestPrototypeMetadata
from fastapi.middleware.cors import CORSMiddleware
from io import StringIO, BytesIO
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn
from urllib.parse import quote_plus, quote
from aiortc import MediaStreamTrack, RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer
from twilio.twiml.voice_response import VoiceResponse, Connect, Gather, Stream
from .call_state import CallState
from .browser_conversation_translator import BrowserConversationTranslator
from .phone_conversation_translator import PhoneConversationTranslator
from .conversation_controller import ConversationController, EndCall
from starlette.websockets import WebSocketDisconnect
from websockets.exceptions import ConnectionClosedError, ConnectionClosedOK
import traceback
from ..dialogtree.dialog import Dialog



RETRIES = 3
RETRY_SECONDS = 600
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,  
    allow_methods=["*"],         
    allow_headers=["*"], 
)




class NoCacheMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-cache"
        return response

app.add_middleware(NoCacheMiddleware)

origins = ['*',]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
                                                                                                



#region device




@app.post('/salsa/device/api/upload-response-file')
async def device_upload_response_file_nozip(r:Request, db:AsyncSession=Depends(get_db)):
    participant_id = r.headers['X-Authenticated-User']
    print('subject_id', participant_id, flush=True)
    submission_id = r.query_params['schedule_id']
    print('schedule_id', submission_id, flush=True)
    test_prototype_id = r.query_params['test_prototype_id']
    sequence_no = int(r.query_params['sequence_no'])
    real_timestamp = datetime.fromisoformat(r.query_params['timestamp'].replace('Z','+00:00'))
    form = await r.form()
    fname, infile = list(form.items())[0]
    stimulus_id = fname.split('.')[0] 
    if (project := (await db.execute(
            text('SELECT projects FROM participants WHERE id = :participant_id'),
            {'participant_id':participant_id}
        )).one().projects[0]):
        now = datetime.now(timezone.utc).astimezone()
        filepath = await save_submission(
            project, submission_id, test_prototype_id, 
            real_timestamp.isoformat(), participant_id, 
            infile, fname
        )
        await db.execute(text('''INSERT INTO submission (project, participant_id, real_timestamp, test_prototype_id, submission_id, stimulus_id, sequence_no, quality )
                                          VALUES     (:project, :participant_id, :real_timestamp, :test_prototype_id, :submission_id, :stimulus_id, :sequence_no, 'perfect' )'''),
                                                      {'project':project, 
                                                       'participant_id':participant_id,     
                                                       'real_timestamp':real_timestamp, 
                                                       'test_prototype_id':test_prototype_id, 
                                                       'submission_id':submission_id,   
                                                       'stimulus_id':stimulus_id, 
                                                       'sequence_no':sequence_no } )
        await db.execute(text('''INSERT INTO submission_files (project, submission_id, stimulus_id, filepath )
                                          VALUES           (:project, :submission_id, :stimulus_id, :filepath )'''),
                                                        {
                                                            'project':project,
                                                            'submission_id':submission_id,
                                                            'stimulus_id':stimulus_id,
                                                            'filepath':filepath
                                                        }  )
        await db.commit()
        return Response('OK')
    return Response('Invalid response code', status_code=406)
               




@app.get('/salsa/device/client/client.html')
async def test_get_client():
    return FileResponse(os.path.join(frontend_directory, 'backend/dummyclient.html'))

@app.get('/salsa/device/client/openpgp.js')
async def test_get_openpgp():
    return FileResponse(os.path.join(frontend_directory, 'backend/openpgp.js'))
#endregion
#region coordinator




@app.get('/salsa/server/api/get-your-email')
async def get_your_email(r:Request)->str:
    print('salsaid ')
    return r.headers.get('X-Authenticated-User')



@app.post('/salsa/server/admin/set-config')
async def set_config(varname: str, varval: str, db:AsyncSession=Depends(get_db)):
    print(varname, config_varnames, flush=True)
    if varname in config_varnames:
        print('got here!!!')
        await db.execute(text(f'UPDATE salsa_config SET varval = :varval WHERE varname = :varname'), {'varname':varname, 'varval':varval})
        await db.commit()
        update_salsa_config()

@app.get('/salsa/server/admin/get-config')
async def get_config(db:AsyncSession=Depends(get_db)):
    return {r.varname: r.varval for r in (await db.execute(text(f'SELECT varname, varval FROM salsa_config'))).all()}

@app.get('/salsa/server/api/get-admins')
async def get_admins(db:AsyncSession=Depends(get_db)) -> list[str]:
    return [a.id for a in (await db.execute(text('SELECT id FROM admins'))).all()]

@app.post('/salsa/server/update-admin-password')
async def update_admin_password(id:str, old_password: str, new_password:str, db:AsyncSession=Depends(get_db)):
    await db.execute(text(
        'CALL update_admin_password(:id, :old_password, :new_password)'
    ),{
        'id':id,
        'old_password':old_password,
        'new_password':new_password,
    })
    await db.commit()

@app.post('/salsa/server/update-coordinator-password')
async def update_coordinator_password(id:str, old_password: str, new_password:str, db:AsyncSession=Depends(get_db)):
    await db.execute(text(
        'CALL update_coordinator_password(:id, :old_password, :new_password)'
    ),{
        'id':id,
        'old_password':old_password,
        'new_password':new_password,
    })
    print('updated password!', new_password)
    await db.commit()




@app.post('/salsa/server/api/add-admin')
async def add_admin(id:str, password:str, db:AsyncSession=Depends(get_db)):
    check_valid_username(id)
    await db.execute(text('CALL create_admin(:id, :password)'), {'id': id, 'password': password})
    await db.commit()

@app.delete('/salsa/server/api/delete-admin')
async def delete_admin(id:str, db:AsyncSession=Depends(get_db)):
    await (db.execute(text('DELETE FROM admins WHERE id=:id'), {'id':id}))
    print(f"id is |{id}|")
    await db.commit()


@app.get('/salsa/server/api/get-coordinators')
async def get_coordinators(db:AsyncSession=Depends(get_db)):
    return [c._asdict() for c in (await db.execute(text('SELECT id, projects FROM coordinators'))).all()]

@app.post('/salsa/server/add-coordinator')
async def add_coordinator(id:str, project:str, password:str, db:AsyncSession=Depends(get_db)):
    await db.execute(text('CALL create_coordinator(:id, :password, :projects)'), {'id': id, 'password': password, 'projects':[project]})
    await db.commit()


@app.delete('/salsa/server/delete-coordinator-project')
async def delete_coordinator_project(id:str, project:str, db:AsyncSession=Depends(get_db)):
    await db.execute(text('UPDATE coordinators SET projects = array_remove(projects,:project) WHERE id=:id'),{
        'id':id, 'project':project,
    })
    await db.commit()

@app.post('/salsa/server/add-coordinator-project')
async def add_coordinator_project(id:str, project:str, db:AsyncSession=Depends(get_db)):
    await db.execute(text('UPDATE coordinators SET projects = array_append(projects,:project) WHERE id=:id AND :project!=ALL(projects)'),{
        'id':id, 'project':project,
    })
    await db.commit()

@app.delete('/salsa/server/api/delete-coordinator')
async def delete_coordinator(id:str, db:AsyncSession=Depends(get_db)):
    await db.execute(text('DELETE FROM coordinators WHERE id=:id '), {'id':id})
    await db.commit()

@app.post('/salsa/server/admin-change-coordinator-password')
async def admin_change_coordinator_password(id:str, password:str, db:AsyncSession=Depends(get_db)):
    print(f'changed password of {id} to {password} !', flush=True)
    await db.execute(text(
        '''UPDATE coordinators SET password = crypt(:password, gen_salt('bf')) WHERE id=:id'''
        ),{'id':id, 'password':password})
    await db.commit()









           

@app.post('/salsa/server/api/add-participant')
async def add_participant(r:Request, id:str, project:str, phone_number:str, schedule_prototype_id:str, twilio_nickname:str, dashboard_code:str, timezone:str, db:AsyncSession=Depends(get_db)):
    pn = phonenumbers.parse(phone_number, "US")
    #this accounts for variability in phone number formatting
    adjusted_pn = f'+{pn.country_code}{pn.national_number}'
    schedule = await r.json()
    await db.execute(text('INSERT INTO participants(projects, phone_number, id, schedule_prototype_id, twilio_nickname, dashboard_code, timezone,  project)'
                          '''VALUES (:projects, :phone_number, :id, :schedule_prototype_id, :twilio_nickname, :dashboard_code, :timezone,  :project)'''
                     ), {
                         'projects':[project],
                         'project': project,
                         'phone_number':adjusted_pn,
                         'id':id,
                         'schedule_prototype_id': schedule_prototype_id,
                         'twilio_nickname':twilio_nickname,
                         'dashboard_code': dashboard_code,
                         'timezone': timezone,
                     })
    insert_schedule_stmt = text('INSERT INTO schedule (project, schedule_prototype_id, participant_id, phase, sequence_no, test_prototype_id, scheduled_time)'
                                'VALUES (:project, :schedule_prototype_id, :participant_id, :phase, :sequence_no, :test_prototype_id, :scheduled_time)'
                                )
    insert_schedule_rows = []
    insert_messages_stmt = text('INSERT INTO phone_schedule (project, participant_id, schedule_prototype_id, phase, sequence_no, delay, condition, message, basis) '
                                '''VALUES (:project, :participant_id, :schedule_prototype_id, :phase, :sequence_no, :delay ::interval, :condition, :message, :basis)''').bindparams(bindparam("delay", type_=String()))
    insert_messages_rows = []
    top_associated_messages = schedule.get('associated_messages', [])
    for phase in schedule['phases']:
        phase_associated_messages = phase.get('associated_messages',{'type':'inherit'})
        if phase_associated_messages['type'] == 'inherit':
            phase_associated_messages = top_associated_messages
        phase_id = phase['id']
        for test in phase['spec']['tests']:
            timestamp_components = test['formal_timestamp'].split(' ')
            scheduled_time = f'{timestamp_components[0]} {timestamp_components[1]}'
            insert_schedule_rows.append({
                'project':project,
                'schedule_prototype_id':schedule_prototype_id,
                'participant_id':id,
                'phase':phase_id,
                'sequence_no':test['sequence_no'],
                'test_prototype_id':test['prototype_selection']['test_prototype_id'],
                'scheduled_time':datetime.strptime(scheduled_time, "%Y/%m/%d %H:%M"),
            })
            test_associated_messages = test.get('associated_messages',{'type':'inherit'})
            if test_associated_messages['type'] == 'inherit':
                test_associated_messages = phase_associated_messages
            for tam in test_associated_messages.get('messages', []):
                delay_unit = tam['interval']['unit']
                delay_count = tam['interval']['count']
                is_call = tam.get('call', True)
                insert_messages_rows.append({
                    'project':project,
                    'schedule_prototype_id':schedule_prototype_id,
                    'participant_id':id,
                    'phase':phase_id,
                    'sequence_no':test['sequence_no'],  
                    'delay': f'{delay_count} {delay_unit}',
                    'condition': tam['condition'],
                    'message': tam['message'],
                    'basis': 'test',
                    'type': 'call' if is_call else 'sms',
                })
    default_selection = schedule['default_selection']
    if 'test_prototype_ids' in default_selection:
        default_tests = default_selection['test_prototype_ids']
    elif 'test_prototype_id' in default_selection:
        default_tests = [default_selection['test_prototype_id']]
    else:
        default_tests = []
    for i, default_test in enumerate(default_tests):
        sequence_no = -(i + 1)
        insert_schedule_rows.append({
                'project':project,
                'schedule_prototype_id':schedule_prototype_id,
                'participant_id':id,
                'phase':schedule['default_selection']['type'],
                'sequence_no':sequence_no,
                'test_prototype_id':default_test,
                'scheduled_time':None,
            })
    await db.execute(insert_schedule_stmt, insert_schedule_rows)
    if len(insert_messages_rows) > 0:  
        await db.execute(insert_messages_stmt, insert_messages_rows)
    await db.commit()

@app.patch('/salsa/server/api/drop-participant')
async def delete_participant(id:str, db:AsyncSession=Depends(get_db)):
    await db.execute(text(
        'DELETE FROM participants WHERE id=:id'
        ),{'id':id})
    await db.commit()

@app.get('/salsa/server/api/get-participants-admin')
async def get_participants_admin(db:AsyncSession=Depends(get_db)):
    return [
        r._asdict()
        for r in (await db.execute(text(
            'SELECT * FROM participants'
        ))).all()
    ]
@app.get('/salsa/server/api/get-participants')
async def get_participant(project:str,db:AsyncSession=Depends(get_db)):
    return [
        r._asdict()
        for r in (await db.execute(text(
            'SELECT * FROM participants WHERE :project = ANY(projects)'
        ),{'project':project})).all()
    ]




@app.get('/salsa/server/api/coordinator-get-projects')
async def coordinator_get_projects(db:AsyncSession=Depends(get_db)) -> list[str]:
    return [project for project in (await db.execute(text('SELECT projects FROM coordinators'))).one_or_none().projects]


@app.get('/salsa/server/api/admin-get-projects')
async def admin_get_projects(db:AsyncSession=Depends(get_db)) -> list[str]:
    return list({project for projects in (await db.execute(text('SELECT projects FROM coordinators'))).all() for project in projects.projects})


@app.get('/salsa/server/api/annotator-get-projects')
async def annotator_get_projects(db:AsyncSession=Depends(get_db)) -> list[str]:
    return [project for project in (await db.execute(text('SELECT projects FROM annotators'))).one_or_none().projects]


@app.get('/salsa/server/api/get-twilio-info')
async def get_twilio_info(project:str, db:AsyncSession=Depends(get_db)):
    return [
        r._asdict()
        for r in (await db.execute(text(
            'SELECT  project, account_sid, auth_token, phone_number, id as nickname, answer_script, require_caller_login, lookup_participant_script FROM twilio_info WHERE project=:project'
        ),{'project':project})).all()
    ]


@app.post('/salsa/server/api/add-twilio-info')

async def add_twilio_info(project:str, nickname:str, account_sid:str, auth_token:str, phone_number:str, 
                          answer_script:str, require_caller_login:bool, lookup_participant_script:bool,
                          db:AsyncSession=Depends(get_db)):
    await db.execute(text('''INSERT INTO twilio_info (project, account_sid, auth_token, phone_number, id, answer_script, require_caller_login, lookup_participant_script)
                     VALUES                         (:project, :account_sid, :auth_token,:phone_number,:id,:answer_script,:require_caller_login,:lookup_participant_script)
                     ON CONFLICT (id) DO UPDATE
                    SET account_sid=:account_sid, auth_token=:auth_token, phone_number=:phone_number, 
                    answer_script=:answer_script, require_caller_login=:require_caller_login, 
                    lookup_participant_script=:lookup_participant_script
                          '''),
                                              {
                                                  'project':project,  
                                                  'account_sid':account_sid, 
                                                  'auth_token':auth_token, 
                                                  'phone_number':phone_number, 
                                                  'id':nickname,
                                                  'answer_script':answer_script,
                                                  'require_caller_login':require_caller_login,
                                                  'lookup_participant_script':lookup_participant_script
                                                  })
    await db.commit()

@app.delete('/salsa/server/api/delete-twilio-info')
async def delete_twilio_info(project:str, account_sid:str, auth_token:str, phone_number:str, db:AsyncSession=Depends(get_db)):
    await db.execute(
        text('DELETE FROM twilio WHERE project=:project AND account_sid=:account_sid AND auth_token=:auth_token AND phone_number=:phone_number',
             {
                 'project':project,
                 'account_sid': account_sid,
                 'auth_token':auth_token,
                 'phone_number':phone_number,
             })
    )

    await db.commit()


@app.post('/salsa/server/api/schedule-messages')
async def coordinator_schedule_messages(r:Request, db:AsyncSession=Depends(get_db)):
    pass












@app.get('/salsa/server/get-project-zip')
async def get_project_zip(project: str, db:AsyncSession=Depends(get_db)) -> Response:
    fnames = [r.filepath for r in 
                (await db.execute(
                    text('SELECT filepath FROM submission_with_files WHERE project=:project'),
                    {'project': project}
                ))
            ]
    return StreamingResponse(
        content=await make_file_zip(fnames), 
        headers={"Content-disposition":f'''attachment; filename="{project}.zip"'''},
        media_type="application/zip"
    )

@app.get('/salsa/server/get-study-zip')
async def get_study_zip(project: str, schedule_prototype_id:str, db:AsyncSession=Depends(get_db)) -> Response:
    fnames = [r.filepath for r in 
                (await db.execute(
                    text('SELECT filepath FROM submission_with_files WHERE schedule_prototype_id=:schedule_prototype_id'),
                    {'schedule_prototype_id': schedule_prototype_id}
                ))
            ]
    return StreamingResponse(
        content=await make_file_zip(fnames), 
        headers={"Content-disposition":f'''attachment; filename="{schedule_prototype_id}.zip"'''},
        media_type="application/zip"
    )




@app.get('/salsa/server/get-participant-zip')
async def get_participant_zip(participant_id: str, db:AsyncSession=Depends(get_db)) -> Response:
    fnames = [r.filepath for r in 
                (await db.execute(
                    text('SELECT filepath FROM submission_with_files WHERE participant_id=:participant_id'),
                    {'participant_id': participant_id}
                ))
            ]
    return StreamingResponse(
        content=await make_file_zip(fnames), 
        headers={"Content-disposition":f'''attachment; filename="{participant_id}.zip"'''},
        media_type="application/zip"
    )



@app.get('/salsa/server/get-visit-zip')
async def get_visit_zip(schedule_id: str, db:AsyncSession=Depends(get_db)) -> list[str]:
    fnames = [r.filepath for r in 
                (await db.execute(
                    text('SELECT filepath FROM submission_files WHERE submission_id=:submission_id'),
                    {'submission_id': schedule_id}
                ))
            ]
    return StreamingResponse(
        content=await make_file_zip(fnames), 
        headers={"Content-disposition":f'''attachment; filename="{schedule_id}.zip"'''},
        media_type="application/zip"
    )
    


@app.get('/salsa/server/get-visit-files')
async def get_visit_files(schedule_id: str, stimulus_id, db:AsyncSession=Depends(get_db)):
    filepaths =  [r.filepath for r in 
                (await db.execute(
                    text('SELECT filepath FROM submission_files WHERE submission_id=:submission_id AND stimulus_id=:stimulus_id'),
                    {'submission_id': schedule_id, 'stimulus_id':stimulus_id}
                ))
            ]
    retval = []
    for fp in filepaths:
        url = '/salsa/server/get-visit-file?filepath=' + quote_plus(fp)
        retval.append([fp, url])
    return retval


@app.get('/salsa/server/get-visit-file')
async def get_visit_file(filepath:str, db:AsyncSession=Depends(get_db)):
    if (await db.execute(text('SELECT filepath FROM submission_files WHERE filepath=:filepath'), {'filepath':filepath})).one_or_none():
        return FileResponse(filepath)
    raise HTTPException(status_code=404, detail="File not found")



     
    




@app.get('/salsa/device/get-test-prototype')
async def device_get_test_prototype(id:str, db:AsyncSession=Depends(get_db)) -> FileResponse:
    zip_path = (await db.execute(text('SELECT zippath FROM test_prototype WHERE id=:id'), {'id':id})).one().zippath
    return FileResponse(zip_path)

@app.get('/salsa/server/get-test-prototype')
async def server_get_test_prototype(id:str, db:AsyncSession=Depends(get_db)) -> FileResponse:
    zip_path = (await db.execute(text('SELECT zippath FROM test_prototype WHERE id=:id'), {'id':id})).one().zippath
    return FileResponse(zip_path)
 
     

@app.get('/salsa/device/get-schedule')
async def device_get_schedule(r: Request, db:AsyncSession=Depends(get_db)):
    participant_id = r.headers['X-Authenticated-User']
    schedule = (await db.execute(
            text('SELECT json as schedule FROM schedule_json WHERE participant_id = :participant_id'), 
            {'participant_id':participant_id}
          )).one().schedule
    try: 
        await mark_downloaded(participant_id)
    except Exception as e:
        with open('error.txt', 'w+') as f:
            f.write(str(e))
            f.flush()
            os.fsync(f.fileno())
    return JSONResponse(schedule)
      


      
@app.get('/salsa/server/api/get-schedules')
async def get_schedules(project:str, db:AsyncSession=Depends(get_db)):
    return [
        r.schedule
        for r in (await db.execute(
            text('SELECT schedule FROM schedule_prototype WHERE project=:project'),
            {'project':project}
        ))
    ]

@app.post('/salsa/server/api/change-phone-number')
async def change_phone_number(participant_id:str, phone_number:str, db:AsyncSession=Depends(get_db)):
    pn = phonenumbers.parse(phone_number, "US")
    adjusted_pn = f'+{pn.country_code}{pn.national_number}'
    await db.execute(text(f"UPDATE participants SET phone_number=:adjusted_pn WHERE id=:participant_id"), 
                     {
                      'adjusted_pn': adjusted_pn,
                      'participant_id': participant_id,
                      })
    await db.commit()
    return Response('OK')

@app.get('/salsa/server/api/get-self-initiated-summary')
async def get_self_initiated_summary(project:str, schedule_prototype_id:str, db:AsyncSession=Depends(get_db)):
    return [r._asdict() for r in 
    (await db.execute(text(
        'SELECT * FROM self_initiated_summary WHERE project=:project AND schedule_prototype_id=:schedule_prototype_id'
    ),{
        'project':project,
        'schedule_prototype_id':schedule_prototype_id
        })).all()
    ]


@app.get('/salsa/server/api/get-per-stimulus-summary')
async def get_per_stimulus_summary(project:str, schedule_prototype_id:str, db:AsyncSession=Depends(get_db)):
    return [r._asdict() for r in 
        (await db.execute(text(
        'SELECT * FROM dashboard_summary_perstimulus WHERE project=:project AND schedule_prototype_id=:schedule_prototype_id'
        ),{
        'project':project,
        'schedule_prototype_id':schedule_prototype_id
            }
        )).all()
    ]



@app.get('/salsa/server/api/get-dashboard-summary')
async def get_dashboard_summary(project:str, schedule_prototype_id:str, db:AsyncSession=Depends(get_db)):
    return [r._asdict() for r in 
        (await db.execute(text(
        'SELECT * FROM dashboard_summary WHERE project=:project AND schedule_prototype_id=:schedule_prototype_id'
        ),{
        'project':project,
        'schedule_prototype_id':schedule_prototype_id
            }
        )).all()
    ]

@app.get('/salsa/server/get-dialogtree')
async def get_dialogtree(project:str, dialogtree:str, db:AsyncSession=Depends(get_db)):
    filepath_row = (await db.execute(text('SELECT zippath FROM test_prototype WHERE project = :project AND id = :test_prototype_id'),{
        'project':project,
        'test_prototype_id':dialogtree,
    })).one_or_none()
    if filepath_row:
        return FileResponse(filepath_row.zippath)
    else:
        raise HTTPException(status_code=404, detail="File not found")
 







@app.post('/salsa/server/api/add-schedule')
async def add_schedule(r: Request, project:str, id:str, db:AsyncSession=Depends(get_db)):
    await db.execute(text('INSERT INTO schedule_prototype(project, id, schedule) VALUES (:project, :id, :schedule)'),
                     {'project':project, 'id':id, 'schedule': json.dumps(await r.json())})
    await db.commit()





@app.get('/salsa/server/get-test-prototypes')
async def coordinator_get_test_prototypes(project:str, db:AsyncSession=Depends(get_db))->list:
    retval = []
    for tp in (await (db.execute(text(
            'SELECT * FROM test_prototype WHERE project=:project'
        ), {'project':project}))).all():
        async with aiofiles.open(get_test_prototype_file_path(tp.project, tp.id, 'metadata.json')) as f:
            metadata = json.loads(await f.read())
            response_stimuli = []
            stimulus_ids = []
            print(metadata, flush=True)
            for m in metadata['stimuli']:
                stimulus_ids.append(m['id'])
                if m['type'] in ('recording', 'ema'):
                    response_stimuli.append({'id':m['id'],'type': m['type']})
            retval.append({
                'id':tp.id, 
                'project':tp.project, 
                'groups':tp.groups, 
                'response_stimuli':response_stimuli,
                'randomized': tp.randomized,
                'stimulus_ids':stimulus_ids,
                'schedule_type':tp.schedule_type,
            })
    return retval




@app.get('/salsa/server/refresh')
async def refresh(db:AsyncSession=Depends(get_superuser_db)):
    await db.execute(text('CALL refresh_json()'))
    await db.commit()


    
    

@app.get('/salsa/server/api/participant-query')
async def participant_query(
        project: str, 
        schedule_prototype_id: str, 
        min_perfect: float = None,
        max_perfect: float = None,
        min_submitted: float = None,
        max_submitted:float = None,
        dropout:bool = None,
        downloaded:bool = None,
        last_phase:str = None,
        next_phase:str = None,
        imminent:bool = None,
        missing_streak:int = None,
        participant_id:str = None,
        dashboard_code:str = None,
        suspect:bool = None,
        gamer:bool = None,
        dropout_reason: str = None,
        gamer_reason: str = None,
        db:AsyncSession=Depends(get_db)):
    retval = []
    print('got here', flush=True)
    statement = sqlalchemy_text(
            """
            SELECT participant_id FROM participant_query(
                _project := :project,
                _schedule_prototype_id := :schedule_prototype_id,
                min_perfect := :min_perfect,
                max_perfect := :max_perfect,
                min_submitted := :min_submitted,
                max_submitted := :max_submitted,
                dropout := :dropout,
                downloaded := :downloaded,
                last_phase := :last_phase,
                next_phase := :next_phase,
                imminent := :imminent,
                missing_streak := :missing_streak,
                p_id := :participant_id,
                dashboard_code := :dashboard_code,
                suspect := :suspect,
                gamer := :gamer,
                dropout_reason := :dropout_reason,
                gamer_reason := :gamer_reason

            )
            """
    )
    for row in await db.execute(statement, {
        'project':project, 
        'schedule_prototype_id':schedule_prototype_id,
                'min_perfect' : min_perfect,
                'max_perfect' : max_perfect,
                'min_submitted': min_submitted,
                'max_submitted' : max_submitted,
                'dropout' : dropout,
                'downloaded' : downloaded,
                'last_phase' : last_phase,
                'next_phase' : next_phase,
                'imminent': imminent,
                'missing_streak':missing_streak,
                'participant_id':participant_id,
                'dashboard_code':dashboard_code,
                'suspect':suspect,
                'gamer':gamer,
                'dropout_reason': dropout_reason,
                'gamer_reason':gamer_reason,
        }):
        retval.append(row[0])
    return retval
    


@app.get('/salsa/server/api/get-dashboard2-data')
async def get_dashboard2_data(project: str, schedule_prototype_id: str, participant_ids: str, db:AsyncSession=Depends(get_db)):
    participant_ids = json.loads(participant_ids)
    return [
        r.json
       for r in (await db.execute(text(
           'SELECT json FROM participant_json WHERE id = any(:participant_ids) ORDER BY start_time DESC'
           ),{
               'project':project, 'schedule_prototype_id':schedule_prototype_id, 'participant_ids':participant_ids
       })).all()
    ]

@app.get('/salsa/server/get-test-prototype-files')
async def get_test_prototype_files(id: str, project:str,  db:AsyncSession=Depends(get_db)) -> list[str]:
    return [r.filepath for r in 
            (await db.execute(
                text('SELECT filepath FROM test_prototype_files WHERE test_prototype_id=:id AND project=:project'),
                {'id': id, 'project':project}
            ))
        ]
    

@app.get('/salsa/server/get-test-prototype-file')
async def get_test_prototype_file(filepath:str, project:str, db:AsyncSession=Depends(get_db)):
    if (await db.execute(text('SELECT filepath FROM test_prototype_files WHERE filepath=:filepath'), 
                        {'filepath':filepath, 'project':project})).one_or_none():
        return FileResponse(filepath)
 
@app.post('/salsa/server/add-test-prototype')
async def add_test_prototype(r:Request, db:AsyncSession=Depends(get_db)):
    print('added test prototype', flush=True)
    params = r.query_params
    project = params['project']
    id = params['id'] 
    groups:list[str] = json.loads(params['groups'])
    replace = False
    if (await db.execute(
        text('SELECT zippath FROM test_prototype WHERE id=:id AND project=:project'),
        {'id':id, 'project':project}
    )).one_or_none():
        replace=True
    if params.get('type', None) == 'phone':
        xml = (await r.body()).decode('utf-8')
        metadata_json_full = json.dumps({
            'stimuli':[{'id':id, 'type':'dialogtree'}],
            'groups': groups,
            'randomized': False,
            'id': id,
            'schedule_type':'phone',
        })
        xml_path, metadata_path = await save_xml(project=project, id_=id, xml=xml, metadata_json=metadata_json_full)
        await db.execute(text('INSERT INTO test_prototype (project, id, groups, randomized, zippath, schedule_type) '
                       '''VALUES (:project, :id, :groups, :randomized, :zippath, 'phone') ON CONFLICT (project, id) DO UPDATE SET groups = :groups, randomized = :randomized, zippath = :zippath '''),{
            'project': project,
            'groups': groups,
            'randomized': False,
            'id': id,
            'zippath': xml_path,
        })
        await db.execute(text('DELETE FROM test_prototype_files WHERE test_prototype_id = :test_prototype_id AND project = :project'), {
            'project': project, 
            'test_prototype_id':id,
        }), 
        await db.execute(text('INSERT INTO test_prototype_files (test_prototype_id, filepath, project) '
                    'VALUES (:test_prototype_id, :filepath, :project) ON CONFLICT (test_prototype_id, filepath, project) DO NOTHING'
                    ), {
                        'test_prototype_id':id,
                        'filepath':metadata_path,
                        'project':project,
                    } )
        await db.execute(text('INSERT INTO stimulus (project, id, type) '
                            'VALUES (:project, :id, :type) ON CONFLICT (project, id) DO NOTHING'),
                                {
                                    'project': project,
                                    'id': id,
                                    'type': 'dialogtree',
                                } 
                            )
        await db.commit()
        return
    randomized = True if params['randomized'] == 'true'  else False
    filenames = []
    infiles = []
    stimuli = []
    async with r.form() as form:
        fdict = {}
        for k, v in form.items():
            fdict[k] = v
        metadata_json=json.loads(fdict.pop('metadata.json'))
        for stimulus in metadata_json:
            if stimulus['type'] in ['recording', 'ema', 'dialogtree']:
                stimuli.append(stimulus)
        metadata_json_full = json.dumps({
            'stimuli': metadata_json,
            'groups': groups,
            'randomized': randomized,
            'id': id
        })
        for k, v in fdict.items():
            filenames.append(k)
            infiles.append(v)
        zippath, filepaths = await save_test_prototype(
            project=project,
            id_=id,
            metadata_json=metadata_json_full,
            infiles=infiles,
            filenames=filenames,
            replace=replace
        )
    print(filepaths)
    await db.execute(text('INSERT INTO test_prototype (project, id, groups, randomized, zippath, schedule_type) '
                       '''VALUES (:project, :id, :groups, :randomized, :zippath, 'app') ON CONFLICT (project, id) DO UPDATE '''
                       ''' SET groups=:groups, randomized=:randomized, zippath=:zippath'''),{
            'project': project,
            'groups': groups,
            'randomized': randomized,
            'id': id,
            'zippath': zippath,
    })
    if len(filepaths) > 0:
        await db.execute(text('INSERT INTO test_prototype_files (test_prototype_id, filepath, project) '
                            'VALUES (:test_prototype_id, :filepath, :project) ON CONFLICT (test_prototype_id, filepath, project) DO NOTHING'
                            ), [{
                                'test_prototype_id':id,
                                'filepath':filepath,
                                'project':project,
                            } for filepath in filepaths])
    await db.execute(text('INSERT INTO stimulus (project, id, type) '
                          'VALUES (:project, :id, :type) ON CONFLICT (project, id) DO UPDATE SET type=raise_if_not_equal(stimulus.type, EXCLUDED.type)'),[
                              {
                                  'project': project,
                                  'id': s['id'],
                                  'type': s['type'],
                              } for s in stimuli
                          ])
    await db.execute(text('INSERT INTO stimulus_x_test_prototype (project, test_prototype_id, stimulus_id) '
                          'VALUES (:project, :test_prototype_id, :stimulus_id) ON CONFLICT (project, test_prototype_id, stimulus_id) DO NOTHING'),[
                              {
                                  'project': project,
                                  'stimulus_id': s['id'],
                                  'test_prototype_id': id,
                              } for s in stimuli
                          ])
    await db.commit()


@app.get('/salsa/server/api/get-groups')
async def get_groups(project:str, db:AsyncSession=Depends(get_db))->list[str]:
    return [g.group for g in 
    (await db.execute(
        text('SELECT DISTINCT unnest(groups) as group from test_prototype WHERE project=:project'), 
        {'project':project}
        )).all()
    ]



@app.get('/salsa/server/api/get-messages')
async def get_messages(participant_id:str,  db:AsyncSession=Depends(get_db)):
    return {'timezone':(await db.execute(
            text('SELECT timezone FROM participants WHERE id=:id'), 
            {'id': participant_id}
        )).one().timezone, 
            'messages': [
                {
                    'their_time':m.their_time,
                    'utc_time':m.utc_time,
                    'message':m.message,
                    'sent':m.sent,
                    'condition':m.condition
                }
                for m in (await db.execute(text(
                    'SELECT PSWRT.message, PSWRT.sent, PSWRT.condition, PSWRT.real_utc_timestamp AS utc_time, '
                    ' PSWRT.real_utc_timestamp AT TIME ZONE p.timezone AS their_time'
                    ' FROM phone_schedule_with_real_time PSWRT LEFT JOIN participants P ON PSWRT.participant_id = P.id'
                    ' WHERE PSWRT.participant_id = :id'
                    ),
                                           {'id':participant_id})).all()]
        }


@app.post('/salsa/server/api/update-timezone')
async def update_timezone(participant_id:str, timezone:str,  db:AsyncSession=Depends(get_db)):
    await db.execute(text(f"CALL update_timezone('{participant_id}', '{timezone}')"))
    await db.commit()


@app.post('/salsa/server/api/update-dashboard-code')
async def update_dashboard_code(participant_id:str, dashboard_code:str, db:AsyncSession=Depends(get_db)):
    await db.execute(text(
        'UPDATE participants SET dashboard_code=:dashboard_code WHERE id=:participant_id'

    ),{'participant_id': participant_id, 'dashboard_code': dashboard_code})
    await db.commit()



@app.post('/salsa/server/api/send-emergency-sms')
async def send_emergency_sms(project:str, schedule_prototype_id:str, message:str,  db:AsyncSession=Depends(get_db)):
    await db.execute(text(f"CALL broadcast_sms('{project}', '{schedule_prototype_id}', $a1b6575${message}$a1b6575$)"))
    await db.commit()

def check_valid_username(s):
    assert re.match('\A[a-zA-Z0-9_.@]+\Z', s), "Invalid username"

def check_valid_project(s):
    assert re.match('\A[a-zA-Z0-9_.@ ]+\Z', s), "Invalid username"



@app.get("/salsa/device/get-public-key",)
async def read_public_key(r:Request, db:AsyncSession=Depends(get_db)):
    print('got here')
    participant_id = r.headers['X-Authenticated-User']
    if (gpg_key_name := (await db.execute(text(
        'SELECT get_latest_gpg_key() AS gpg_key_name'
      ))).one_or_none().gpg_key_name):
        command = f"""gpg --armor --export '{gpg_key_name}'"""
        print(command)
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE 
        )
        key, stderr = await proc.communicate()
        print(key, stderr)
        return PlainTextResponse(key.strip())
    return Response('Invalid response code', status_code=406)



@app.get("/salsa/server/coordinator.html",)
async def read_coordinator():
    return FileResponse(os.path.join(frontend_directory, 'dist/coordinator.html'))

@app.get("/salsa/server/annotator.html",)
async def read_annotator():
    return FileResponse(os.path.join(frontend_directory, 'dist/annotator.html'))
 
@app.get("/salsa/server/admin.html",)
async def read_admin():
    return FileResponse(os.path.join(frontend_directory, 'dist/admin.html'))

@app.get("/salsa/server/favicon.ico",)
async def read_admin():
    return FileResponse(os.path.join(frontend_directory, 'public/favicon.ico'))

@app.get("/salsa/server/phonesim.html",)
async def read_phonesim():
    return FileResponse(os.path.join(frontend_directory, 'dist/phonesim.html'))



app.mount("/salsa/server/assets", StaticFiles(directory=os.path.join(frontend_directory, 'dist/assets')), name="dist")

if __name__ == "__main__":
    uvicorn.run("app.backend.app:app", host="127.0.0.1", port=docker_internal_port, reload=True)

#endregion 




class AutoExpireDict:
    def __init__(self, time):
        self.d = {}
        self.tasks = set()
        self.time = time
        self.cleaner = asyncio.ensure_future(self.clean())
    
    def get(self, key, default):
        return self.d.get(key, default)
    
    def __getitem__(self, key):
        return self.d.get(key, None)
    
    async def remove(self, key):
        await asyncio.sleep(self.time)
        self.d.pop(key, None)
    
    async def clean(self):
        while True:
            await asyncio.sleep(self.time*10)
            for t in list(self.tasks):
                if t.done():
                    self.tasks.remove(t)
    
    def pop(self,key):
        return self.d.pop(key, None)

    
    def __setitem__(self, key, value):
        self.d[key] = value
        self.tasks.add(asyncio.ensure_future(self.remove(key)))



    




ice_servers = [
    RTCIceServer(urls='stun:global.stun.twilio.com:3478'),
    RTCIceServer(urls='turn:global.turn.twilio.com:3478?transport=udp', username='ba869459b241183104321b4a28eba5f5f42e95d4a0a8575f2c0c411c704250cd', credential='LDaVKc9+vTr3jaus0VQS/oFb7KPYXGzOrWn1+VJ+JR4='),
    RTCIceServer(urls='turn:global.turn.twilio.com:3478?transport=tcp', username='ba869459b241183104321b4a28eba5f5f42e95d4a0a8575f2c0c411c704250cd', credential='LDaVKc9+vTr3jaus0VQS/oFb7KPYXGzOrWn1+VJ+JR4='),
    RTCIceServer(urls='turn:global.turn.twilio.com:443?transport=tcp', username='ba869459b241183104321b4a28eba5f5f42e95d4a0a8575f2c0c411c704250cd', credential='LDaVKc9+vTr3jaus0VQS/oFb7KPYXGzOrWn1+VJ+JR4='),
]

rtc_config = RTCConfiguration(iceServers=ice_servers)



import asyncio, uuid
inbound_or_outbound = None
this_phone_number = None
phone_number_dict = AutoExpireDict(20)
call_dict = AutoExpireDict(1800)








#this has to be eliminated and replaced with a script lookup
my_xml = ''


#region Twilio Logic


@app.get('/salsa/twilio/make-call')
async def make_call(outbound_phone_number: str, twilio_phone_number: str, auth_token: str, account_sid: str):
    client = Client(account_sid, auth_token)
    call = client.calls.create(
            to='='+outbound_phone_number,
            from_=twilio_phone_number,
            twiml = begin_conversation().__str__(),
        )
    if not call.sid:
        raise Exception("Twilio failure")
    phone_number_dict[call.sid] = outbound_phone_number
    await asyncio.sleep


@app.post('/salsa/twilio/inbound-call')
async def inbound_call(request:Request, twilio_info:str, project:str,  db:AsyncSession=Depends(get_superuser_db)):
    form = await request.form()
    phone_number_dict[form['CallSid']] = form['From']
    script_info = (await db.execute(text(
        'select TW.*, TP.zippath as script_path from twilio_info TW LEFT JOIN test_prototype TP '
        ' ON TW.project=TP.project AND TW.answer_script=TP.id WHERE TW.id=:twilio_nickname AND TW.project=:project'),{
            'twilio_nickname':twilio_info, 'project':project,
        })).one()
    if not script_info.require_caller_login:
        return Response(begin_conversation(participant_id='', script_path=script_info.script_path, project=script_info.project).__str__(), media_type='application/xml')
    return Response(
        begin_conversation_with_login(
            script_path = script_info.script_path, 
            project = script_info.project).__str__(), 
        media_type='application/xml'
    )

def begin_conversation(script_path, participant_id, project, sequence_no):
    vr = VoiceResponse()
    connect = Connect()
    stream = Stream(url=f'{salsa_config.wss_url}/phone-socket')
    stream.parameter(name='script_path', value=script_path)
    stream.parameter(name='participant_id', value=participant_id)
    stream.parameter(name='project', value=project)
    stream.parameter(name='sequence_no', value=sequence_no)
    connect.append(stream)
    vr.append(connect)
    return vr

def begin_conversation_with_login(script_path, project):
    vr = VoiceResponse()
    vr.say('Hello. This is the salsa system.')
    gather = Gather(num_digits=4,
        action=f'{salsa_config.public_url}/dtmf-digits?script_path={quote_plus(script_path)}&project={quote_plus(project)}',
        method='POST',
        timeout=10,
        finish_on_key='#',
    )
    gather.say('Please enter your 4 digit study code and then press pound.')
    vr.append(gather)
    vr.say('We did not hear any button presses. Goodbye.')
    return vr

def retry_inbound_conversation(script_path, project):
    vr = VoiceResponse()
    vr.say('Your study code was not recognized.')
    gather = Gather(num_digits=4,
        action=f'{salsa_config.public_url}/dtmf-digits?script_path={quote_plus(script_path)}&project={quote_plus(project)}',
        method='POST',
        timeout=10,
        finish_on_key='#',
    )
    gather.say('Please enter your 4 digit study code and press pound.')
    vr.append(gather)
    vr.say('We did not hear any button presses. Goodbye.')
    return vr

@app.post('/salsa/twilio/dtmf-digits')
async def dtmf_digits(request:Request, script_path:str, project:str, db:AsyncSession=Depends(get_superuser_db)):
    form = await request.form()
    print(request, form, flush=True)
    print('got digits', form['Digits'])
    participant = (await db.execute(text('SELECT id FROM participants WHERE id=:id'),
                   {'id':form['Digits']})
                   ).one_or_none()
    if participant is not None:
        sequence_no = -1
        return Response(begin_conversation(script_path=script_path, participant_id=participant.id, project=project, sequence_no=sequence_no).__str__(), media_type='application/xml')
    else:
        return Response(retry_inbound_conversation(script_path).__str__(), media_type='application/xml')


@app.websocket_route('/salsa/socket/phone-socket')
async def phone_socket(websocket, script_path: str = ''):
    params = websocket.query_params
    running_dialog = None
    socket_handler = None
    print(f'phone socket received', flush=True)
    await websocket.accept()

    call_sid = ''
    stream_sid = ''
    try:
        frame = await websocket.receive_json()
        if frame['event'] == 'connected':
            print('phone socket connection accepted', flush=True)
        else:
            raise Exception('connected frame missing from phone socket')
        frame = await websocket.receive_json()
        if frame['event'] == 'start':
            stream_sid = frame['start']['streamSid']
            call_sid = frame['start']['callSid']
            project = frame['start']['customParameters']['project']
            script_path = frame['start']['customParameters']['script_path']
            stimulus_id = script_path.split('/')[-1].split('.')[0]
            participant_id = frame['start']['customParameters']['participant_id']
            sequence_no = frame['start']['customParameters']['sequence_no']
            async with aiofiles.open(script_path) as f:
                my_xml = await f.read()
            controller = ConversationController(default_silence_window=2)
            translator = PhoneConversationTranslator(
                controller=controller,
                stream_sid=stream_sid,
                phone_socket=websocket,
            )
            call_state = CallState(
                submission_id=call_sid,
                phone_number=phone_number_dict.pop(call_sid),
                xml_string=my_xml,
                controller=controller,
                translator=translator,
                project=project,
                participant_id=participant_id,
                sequence_no=sequence_no,
                stimulus_id=stimulus_id, 
                test_prototype_id=stimulus_id,
            )
            call_dict[call_sid] = call_state
            socket_handler = asyncio.create_task(translator.handle_sockets())
            asyncio.ensure_future(socket_handler)
            running_dialog = asyncio.create_task(call_state.inbound_coro())
            await running_dialog
    except (WebSocketDisconnect, ConnectionClosedError, ConnectionClosedOK):
        print('connection closed disgracefully', flush=True)
    except EndCall:
        print('call ended')
    finally:
        #complicated bits of async garbage collection and resource recovery
        await call_dict[call_sid].goodbye()
        if running_dialog is not None:
            running_dialog.cancel()
        if socket_handler is not None:
            socket_handler.cancel()
        call_dict.pop(call_sid)



@app.websocket_route('/salsa/socket/webrtc-socket')
async def browser_conversation_socket(websocket):
    await websocket.accept()
    print('gothere')
    info = await websocket.receive_json()
    print('gothere2')
    call_sid = info['call_sid']
    xml_text = info['xml_text']
    params = info['rtc_params']
    controller = ConversationController()
    local_track = BrowserConversationTranslator.OpusTranslator(controller)
    pc = RTCPeerConnection(configuration=rtc_config)
    pc.addTrack(local_track)
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])
    @pc.on('connectionstatechange')
    async def on_connectionstatechange():
        if pc.connectionState == "failed":
            await pc.close()
            call_dict.pop('call_sid')
    
    @pc.on('track')
    async def on_track(remote_track):
        translator = BrowserConversationTranslator(
            controller=controller,
            call_sid=call_sid,
            remote_track=remote_track,
            local_track=local_track,
            pc = pc
        )
        call_state = CallState(
            xml_string=xml_text,
            controller=controller,
            translator=translator,
        )
        call_dict[call_sid] = call_state
        @remote_track.on('ended')
        async def on_ended():
            pass
        asyncio.ensure_future(translator.handle_sockets())
        await websocket.send_json('ready')
        print('conversation started')
        await call_state.inbound_coro()

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await websocket.send_json({"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})
    #sent once the track is found
    await websocket.receive_json()
    

@app.websocket_route('/salsa/socket/debug-socket')
async def debug_socket(websocket):
    try:
        print('debug socket recieved')
        await websocket.accept()
        call_sid = await websocket.receive_json()
        call_state = call_dict[call_sid]
        if call_state.__class__ == CallState:
            for h in call_state.dialog.history:
                await websocket.send_json(h)
            call_state.dialog.debug_socket = websocket
            await call_state.dialog.done.wait()
        elif call_state.__class__ == Dialog:
            for h in call_state.history:
                await websocket.send_json(h)
            call_state.debug_socket = websocket
            call_state.step_by_step_mode=True
            await call_state.done.wait()
    finally:
        await websocket.close()

@app.websocket_route('/salsa/socket/text-socket')
async def text_socket(websocket):
    dirpath = os.path.dirname(os.path.realpath(__file__))
    try:
        print('text socket recieved')
        await websocket.accept()
        call_sid = await websocket.receive_json()
        print('call_sid: ', call_sid)
        call_state = call_dict.get(call_sid, None)
        xml_text = await websocket.receive_json()
        dialog = None
        if not call_state:
            print('xml_text: ', xml_text)
            context = {'patient_firstname': 'Jacob'}
            with open(f'{dirpath}/documents.json') as f:
                context['documents'] = json.load(f)
            with open(f'{dirpath}/prescriptions.txt') as f:
                context['prescriptions'] = f.read()
            dialog = Dialog(conversation=None, 
                        xml_text=xml_text, 
                        model="llama3.1:70b", functions={}, context=context)
            dialog.text_socket = websocket
            call_dict[call_sid] = dialog
            await websocket.send_json(-2)
            await dialog.run()
        else:
            call_state.dialog.text_socket = websocket
            await websocket.send_json(-2)
            for entry in call_state.dialog.history:
                if entry[0] == 'chatbot':
                    await websocket.send_json(entry[1])
                if entry[0] == 'user':
                    await websocket.send_json([2,entry[1]])
            await call_state.dialog.done.wait()
    except Exception:
        print(traceback.format_exc())
        await websocket.close()
        call_dict.pop(call_sid)
    finally:
        call_dict.pop(call_sid)
