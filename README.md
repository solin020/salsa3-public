#Contact Info
Direct any questions about this software to

Jacob Solinsky

University of Minnesota - College of Pharmacy

PhD Candidate

solin020@umn.edu

# Getting started
Install docker onto your server. Your server must use a linux kernel with the x86_64 ISA, other setups are not supported.
Download the salsa3's docker image with 
docker pull solin020/salsa_final:public
Then download the associated repository with
git clone from https://github.com/solin020/salsa3-public
enter the directory you just git cloned and type the commands
mkdir uploads
mkdir uploads/message-responses
mkdir uploads/call_recordings
mkdir uploads/annotations
mkdir uploads/test-prototypes
All of the files used by your installation will be stored here.

Now execute

`docker run --name salsa3_server  -e PGPASSFILE=/var/lib/postgresql/data/.pgpass -p {port_number_you_are_serving_salsa_3_out_of}:80 -v {path_to_downloaded_salsa3_github_repository}:/app  -v salsa3_data:/var/lib/postgresql/data  -d solin020/salsa_final:public /bin/bash -c  " tail -f /dev/null"`
This will create a docker container called `salsa4_server`, and also implicitly create a docker volume named `salsa3_data`, where your postgres database will live. This database must be initialized

# Preparing the database


Now execute
`docker exec -it salsa3_server /bin/bash`
to get a shell into your docker container

Run 
`su -c '/usr/lib/postgresql/16/bin/initdb -D /var/lib/postgresql/data -U salsa_root --pwprompt' postgres`
Record the password you wrote down in this step, it is now your database's superuser password

Run 
`cp /pg_hba.conf /var/lib/postgresql/data/pg_hba.conf`
`cp /postgresql.conf /var/lib/postgresql/data/postgresql.conf`

Edit /.pgpass

Its contents should look like this:

/var/run/postgresql:5432:salsa:salsa_root:superuser_password

change 'superuser_password' to the appropriate salsa_root password you specified earlier 

Now run `cp /.pgpass /var/lib/postgresql/data/.pgpass`
Now run `chmod 600 /var/lib/postgresql/data/.pgpass`
Now run `chown postgres /var/lib/postgresql/data/.pgpass`

Find the line
cron.database_name = cron.database_name = 'postgresql://salsa_root:superuser_password@%2Fvar%2Frun%2Fpostgresql/salsa'
And replace the superuser_password part with the password you set for salsa_root in the preceding step (you will have to URL-encode the password if it uses URL-incompatible characters)

This enables pgcron to connect to your database to run scheduled tasks
Run 


Run 
`su -c '/usr/lib/postgresql/16/bin/pg_ctl start -D /var/lib/postgresql/data -s' postgres &`

This will cause the pg_cron scheduler to start immediately, which will cause it to complain because the salsa database is not initialized

Run 
`psql -U salsa_root -d postgres -f full_dump.sql `
to initialize the database and the cron error messages should stop.

Log into the database using 
`psql -U salsa_root -d salsa`

In postgresql, execute the command
`ALTER USER salsa WITH PASSWORD 'salsa_password';`

substituting in to give your website user a password (the 'salsa' user has less privileges than salsa_root, and is more appropriate for the website to use)

create 
`/app/.env`
 and have its contents be this:
```
DBUSERNAME=salsa
DBPASSWORD=salsa_password
DBNAME=salsa
DBHOST=localhost:5432
```
# Configuring the server

edit `/app/apache/apache2.conf`

Find this line: 
`DBDParams "host=/var/run/postgresql dbname=salsa user=salsa password=salsa_password"`
Change the salsa user's password to what you specified in the preceding step



(If you ran the docker container with -p argument 3005:80)
now execute apachectl start

run 
`gpg --full-generate-key`
do the defaults (3072 bit RSA)
use the same string for both Real Name and email and document it, this is the key's id
give the key a passphrase and document it 
You will have to redo this process each time you rotate out the gpg key. This key is used by the app to encrypt uploads such that no party other than you can ever read them, even if a participant's phone is stolen.


now execute 
`python3 -m app.backend.app`
This starts the server

# Running the server dmin

log into http://localhost:3005/salsa/server/admin.html

the start admin username is amia

the start admin password is Amia2025*

click in the upper right hand corner to change the default password

Relogin

Click on the coordinators tab to add your first coordinator
give them a username, a password, and a project

Go to the config tab.

In public_url and wss_url, substitute 'your.domain.net' with whatever domain name you succeed in acquiring for your salsa installation.

If you wish to use openai to support tts, stt, and llm functionality, select 'openai' for tts type, stt type, and llm type
Make sure to enter your openai key to enable them to connect. Provide model names for each service type.

Otherwise, you may link up your llm to an ollama server, whose URL you can supply with llm url. 

Supply your gpg key's name and passphrase. These settings will have to be updated in the admin site every time you rotate the keys. The participant app always downloads the newest gpg public key on login.

The github repository shows examples of what the self_hosted tts and stt servers look like. This document will not provide instructions on how to set these up.


close your browser to log out

log into http://localhost:3005/salsa/server/coordinator.html

You are now ready to start using salsa. Use the videos and slides in the associated google drive folder here: 
https://drive.google.com/drive/folders/1q7qT0qqGmlLlClMFCfGg-kr136_4c0J2?usp=sharing

for a guide. The 'urls' document contains links to the youtube videos.

In that google drive is also a side-loadable android app.

This app allows you to configure it to match your

salsa installation's domain name, unlike the app store and google play
store versions, which are locked to UMN and UW

# Summary

To summarize, over the course of initialization, you have created/supplied the following credentials
- gpg keyname and passphrase
- PSQL superuser's password for salsa_root
- PSQL normal user's password for salsa
- SALSA3's 1st admin user's password (initially 'amia' and 'Amia2025*')
- SALSA3's 1st coordinator user's username and password 
- openai auth_token if using openai models
- Twilio account_sid and auth_token if connecting to twilio

In addition, the following information was supplied
- your publicly routable internet domain name
- the port the docker container is being served on (I recommend 443). 

for twilio to forward incoming calls to your SALSA installation,
you need to ensure that 'A call comes in' is configured to an HTTP POST webhook
in your twilio dashboard for your number using a URL such as 

https://your.domain.net/salsa/twilio/inbound-call?twilio_info=your-twilio-info-name&project=your-project

With the twilio_info and project query params set to the twilio_info nickname and project name
in the database which has been linked to twilio.

For your salsa3 installation to be accessible both to the app or to Twilio,
it is necessary that you get yourself a domain name and an SSL certificate for HTTPS so that your installation can be reached on the public internet. Here is a discussion on how to do that: 
https://webmasters.stackexchange.com/questions/89143/can-i-make-my-site-available-world-wide-without-renting-a-hosting-server

Most critically, you will need your server's public IPv4 address (which will look something like 123.45.67.89), and the port on your computer you would wish to serve Salsa3 out of (which should probably be 443 if you are serving over https). If your installation is not served over https it will not be secure and attackers will be able to read everything being sent back and forth between your server and the app (most critically, they will be able to see usernames and passwords, in particular, your own admin password. Audio and questionnaire responses are encrypted by a separate mechanism not using). 
Link the domain name you get to your server's IPv4 address.
I do not recommend making your server accessible to the public internet until you are completely done with config,
so that you have made sure that there are no default passwords left lying around.


# Lack of Support notes

Scheduled SMS or phone calls are not supported in this version. An A2P-10DLC permitted twilio account with SMS campaign is required for this, and we have a bespoke SMS service running at the U of W.
The only kind of ad-lib test supported is the version where the user gets to select one of several from a group.
You may use the code in the /tts and /stt directories to figure out what kind of services salsa3 is expecting if you configured yours in the admin dashboard to use the 'self-hosted' option, but they are not particularly easy to install.
Right now, only a single test prototype can be linked to a phone number.Some other options exist in the twilio part of the dashboard but they are disabled. This may be configured to require login, if a participant has been enrolled in the dashboard and if the participant's login code is purely numeric (such that they can enter their code over DTMF)
Disabling the default HTTP-basic login and replacing it with your local institution's 2-factor shibboleth  (or whatever other system might be being used) will require editing /app/apache2.conf and signigicant assistance with your local IT department. Both of our real installations at HALO and ANNA use institutional login and not HTTP basic.



