import asyncio
from datetime import datetime
from database import Job


async def parse_atq() -> list[Job]:
    #This first command shows all of the jobs but doesn't show all the details we need per job
    proc = await asyncio.create_subprocess_shell("atq", stdout=asyncio.subprocess.PIPE,stderr=asyncio.subprocess.PIPE)
    stdout, stderr = await proc.communicate()
    joblist = [nn.strip() for nn in stdout.decode('utf-8').split("\n") if nn.strip()]
    retval = []
    for jl in joblist:
        job_id, rest = jl.split('\t')
        *time, _, _ = rest.split(' ')
        time = ' '.join(time)
        timestamp = datetime.strptime(time, "%a %b %d %H:%M:%S %Y") 
        retval.append((job_id, timestamp))
    #This second command is needed to get all the details we need per job
    proc = await asyncio.create_subprocess_shell("""atq | awk '{ system("at -c " $1) }'""", stdout=asyncio.subprocess.PIPE,stderr=asyncio.subprocess.PIPE)
    stdout, stderr = await proc.communicate()
    job_details = [nn.strip() for nn in stdout.decode('utf-8').split("\n\n") if nn.strip()][:-1]
    retval2 = []
    for jd in job_details:
        jdend = jd.split('\n')[-1]
        _,_,phone_number,response_code = jdend.split(' ')
        retval2.append((phone_number, response_code))
    retval3 = []
    for (job_id, timestamp), (phone_number, response_code) in zip(retval, retval2):
        retval3.append(Job(job_id=job_id, timestamp=timestamp, phone_number=phone_number, response_code=response_code))
    retval3.sort(key = lambda x: x.timestamp)
    return retval3