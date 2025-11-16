# Adding a new project coordinator 
- Get their university email
- Go to the `/salsa/coordinator/` section in the gateway server's apache2 or httpd conf file (`/etc/httpd/conf/httpd.conf currently`)
login into the salsa database with the admin role salsa
```console 
$ psql -U salsa -d salsa
```

  *please note the single and double quotes in the following postgres syntax, the distinction is important.*
```console
SET ROLE salsaadmin;
CREATE ROLE "person@uni.edu" WITH LOGIN;
GRANT coordinator to "person@uni.edu";
RESET ROLE;
INSERT INTO projects VALUES ('project_name', 'person@uni.edu');
```
- The final `INSERT INTO` step can be repeated for as many projects as you wish to add the coordinator to. 
To create a project all that is need is to add its name and coordinator to the projects table,
there is no other metadata associated with them. All data in the salsa database is in tables
with a 'project' column containing the name of the project they belong to, only coordinators
who are registered in the database with said project name have permission to view these 
table rows, alter them, or add new rows with the same project name.