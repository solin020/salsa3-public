from fastapi import UploadFile
import os
from ..config import message_response_directory, test_prototype_directory
import aiofiles, asyncio
import aiofiles.os
from .database import salsa_config
from uuid import uuid4



async def save_submission(project: str, 
                                schedule_id:str,  
                                test_prototype_id: str, 
                                datestr:str, 
                                subject_id:str, 
                                infile: UploadFile,
                                fname: str):
    project_directory = os.path.join(message_response_directory, project)
    if not os.path.exists(project_directory):
        os.mkdir(project_directory)
    final_destination = os.path.join(project_directory, schedule_id)
    command = f'''mkdir -p "{final_destination}"'''
    await (await asyncio.create_subprocess_shell(command)).wait()
    os.chdir(final_destination)
    gpg_destination = fname
    filename = gpg_destination[:-4]
    print('gpg_destination', gpg_destination, flush=True)
    prefix = f'project={project}&subject_id={subject_id}&test_prototype_id={test_prototype_id}&date={datestr}&file='
    fullname = prefix + filename
    async with aiofiles.open(gpg_destination, 'wb+') as gpg_f:
        await gpg_f.write(await infile.read())
    command = (f'''gpg --no-tty --pinentry-mode=loopback --passphrase "{salsa_config.gpg_passphrase}" '''
                f''' -d -o "{fullname}" "{gpg_destination}" ;'''
                f''' rm "{gpg_destination}" ;''')
    await (await asyncio.create_subprocess_shell(command)).wait()
    return f'{final_destination}/{fullname}'


    


 




async def save_test_prototype(project:str, id_:str, metadata_json:str, infiles: list[UploadFile], filenames:list[str], replace=False):
    retpaths = []
    cwd = os.getcwd()
    project_directory = os.path.join(test_prototype_directory, project)
    if not os.path.exists(project_directory):
        await aiofiles.os.mkdir(project_directory)  
    os.chdir(project_directory)
    true_path = id_
    true_zip = id_ + '.zip'  
    if replace:
        command = f''' rm -rf {true_path}; rm {true_zip} '''
        await (await asyncio.create_subprocess_shell(command)).wait()
    if not os.path.exists(true_path):
        await aiofiles.os.mkdir(true_path)
    for infile, filename in zip(infiles, filenames):
        fpath = os.path.join(true_path, filename)
        retpaths.append(f'{project_directory}/{fpath}')
        print('saving filename')
        async with aiofiles.open(fpath, 'wb+') as f:
            await f.write(await infile.read()) 
    metadata_path = os.path.join(true_path, 'metadata.json')
    retpaths.append(f'{project_directory}/{metadata_path}')
    async with aiofiles.open(metadata_path, 'w+') as f:
        await f.write(metadata_json) 
    command = f'''zip -r {true_zip} {true_path} '''
    await (await asyncio.create_subprocess_shell(command)).wait()
    os.chdir(cwd)
    zippath = f'{project_directory}/{true_zip}'
    return zippath, retpaths

async def save_xml(project:str, id_:str, xml:str, metadata_json:str):
    cwd = os.getcwd()
    project_directory = os.path.join(test_prototype_directory, project)
    if not os.path.exists(project_directory):
        await aiofiles.os.mkdir(project_directory)  
    os.chdir(project_directory)
    true_path = id_
    if not os.path.exists(true_path):
        await aiofiles.os.mkdir(true_path)
    true_xml= id_ + '.xml'  
    async with aiofiles.open(true_xml,  'w+') as f:
        await f.write(xml)
    true_metadata = os.path.join(true_path, 'metadata.json')
    async with aiofiles.open(true_metadata, 'w+') as f:
        await f.write(metadata_json) 
    os.chdir(cwd)
    xmlpath = f'{project_directory}/{true_xml}'
    metadata_path = f'{project_directory}/{true_metadata}'
    return xmlpath, metadata_path


def get_test_prototype_zip_path(project: str, id:str):
    return os.path.join(test_prototype_directory, project, id+'.zip')

def get_test_prototype_dir_path(project: str, id:str):
    return os.path.join(test_prototype_directory, project, id)

def get_test_prototype_file_path(project: str, id:str, filename:str):
    return os.path.join(test_prototype_directory, project, id, filename)


async def delete_test_prototype(project: str, id:str):
    dir_path = get_test_prototype_dir_path(project, id)
    zip_path = get_test_prototype_zip_path(project, id)
    await aiofiles.os.remove(zip_path)
    command = f'''rm -rf {dir_path}'''
    await (await asyncio.create_subprocess_shell(command)).wait()




async def make_file_zip(files:list[str])->bytes:
    cwd = os.getcwd()
    id = str(uuid4())
    download_directory = os.path.join(message_response_directory, id)
    zip_location = os.path.join(message_response_directory, f'{id}.zip')
    if not os.path.exists(download_directory):
        await aiofiles.os.mkdir(download_directory)  
    os.chdir(download_directory)
    for sid, fname in files:
        participant_id = fname.split('&')[1].split('=')[1]
        command = f'''mkdir -p {download_directory}/{participant_id}/{sid} ; cp '{fname}' '{download_directory}/{participant_id}/{sid}/{sid}|{fname.split('/')[-1]}' '''
        await (await asyncio.create_subprocess_shell(command)).wait()
    command = f'''zip -r {zip_location} . '''
    print('zipcommand', command)
    await (await asyncio.create_subprocess_shell(command)).wait()
    os.chdir(cwd)
    async def iterfile():
       async with aiofiles.open(zip_location, 'rb') as f:
            while chunk := await f.read(2**10):
                yield chunk
            command = f'''rm -rf {download_directory}; rm -rf {zip_location}'''
            await (await asyncio.create_subprocess_shell(command)).wait()
            yield b''
    return iterfile()

