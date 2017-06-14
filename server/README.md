# Server Directory

This directory houses everything that goes on the server side of the app.



## GitHub OAuth Information

The general process is as follows:

1. The user hits a webpage that has a button to redirect them to GitHub to give the app access to their profile (client/autoGrader)
2. The owner of the GitHub app (me) gets to say where the user is redirected to after they click "Authorize App" on GitHub. 
3. That page will have a temporary token in the URL, which needs to be sent off to GitHub in order to get a real access token (see `server/app.js`, specifically the route that handles `\auth`)
4. If all went well, the user now has an access token!


## Node Service Setup


To set up the server as a service (so that it restarts automatically), I made a systemd service (called `nodeserver.service`).

TL;DR -- I followed this website:

https://www.axllent.org/docs/view/nodejs-service-with-systemd/


Additionally, I needed this service to have access to environment variables. To do this, I had to do systemctl edit nodeserver.service


In that file, I added:

[Service]
Environment="client_secret=[client secret]"


Don't forget to restart the server!



## Travis Notes

After the user hits the index page, they will have a repo for every module. It is at this point that they will need to go to Travis CI and enable all repos (I cannot see a way to automate this).

The Travis YML file is very important, but it's tough to make changes by committing and seeing if it works. To fix that, there's a lint'r here:

https://lint.travis-ci.org/


Generally, we only use two API calls:



* `https://api.travis-ci.org/repos/zschmidt/autoGrader` returns a repo ID

* `https://api.travis-ci.org/repos/zschmidt/autoGrader/builds` returns the builds for the repo... but they are in opposite order!!