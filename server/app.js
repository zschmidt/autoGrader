var serverName = "thoth.cs.uoregon.edu:3000"


var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var cp = require('child_process');
var app = express();
var dateTime = require('node-datetime');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;



// __dirname is /home/zach/autoGrader/server


function sendAccessToken(access_token) {
    return "<!doctype html><html lang='en'><head><style type='text/css'>@keyframes spinner{to{transform:rotate(360deg)}}.spinner:before{content:'';box-sizing:border-box;position:absolute;top:50%;left:50%;width:20px;height:20px;margin-top:-10px;margin-left:-10px;border-radius:50%;border-top:2px solid #07d;border-right:2px solid transparent;animation:spinner.6s linear infinite}</style><meta charset='utf-8'><title>Authenticating...</title></head><body><div class='spinner'></div><script type='text/javascript'>function store(){sessionStorage.removeItem('access_token');sessionStorage.setItem('access_token','" + access_token + "');setTimeout(function(){window.location.replace('http://thoth.cs.uoregon.edu:3000')},1000)}window.onload=store;</script></body></html>";
}

//Don't forget to add the client secret to the environment variables!
app.get('/auth', function(req, res) {
    var secret = process.env.client_secret;
    var code = req.query.code;
    var url = "https://github.com/login/oauth/access_token";
    var params = "client_id=02d1c7baba80ece0140f&client_secret=" + secret + "&code=" + code;

    if (url && params) { //Sometimes they're undefined.... spooky!
        console.log('curl --data "' + params + '" ' + url);
        var cmd = 'curl --data "' + params + '" ' + url;
        cp.exec(cmd, (error, stdout, stderr) => {
            access_token = stdout.split("&")[0].split("=")[1];
            console.log("SUCCESS! Access token: " + access_token);
            res.send(sendAccessToken(access_token));
            res.redirect('/');
        });
    }


});

app.use(express.static(path.join(__dirname, '/public')));




// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}))

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


// parse application/json
app.use(bodyParser.json())



//We respond with a JSON object
//  {
//      "submission":   SUBMISSION_TEXT,
//      "login":        GITHUB_LOGIN 
//  }
app.get('/getSubmission', function(req, res) {
    var response = {};
    var module = req.query.module;
    var userLogin = 'curl https://api.github.com/user?access_token=' + req.query.access_token;
    console.log(userLogin);
    cp.exec(userLogin, (error, stdout, stderr) => {
        var login = JSON.parse(stdout).login;
        response.login = login;
        var lastSubmission = 'curl https://raw.githubusercontent.com/' + login + '/' + module + '/master/submission.py'
        cp.exec(lastSubmission, (error, stdout, stderr) => {
            response.submission = stdout;
            if (stdout.includes("404: Not Found"))
                response.submission = " ";
            res.send(JSON.stringify(response));
        });
    });
});

//Starting the server... nothing really to see here...
app.listen(3000, function() {
    console.log('Server listening on port 3000!')
})


// POST method route
// This one is a bear.
// It takes an object that looks like this:
// {
//    module: MODULE,
//    code: SUBMISSION,
//    access_token: ACCESS_TOKEN,
//    login: GITHUB_LOGIN
// }
app.post('/', function(req, res) {

    var dt = dateTime.create();
    dt = dt.format('Y-m-d H:M:S');


    var module = req.body.module;
    var repo = module; //Easier to think about this way....
    var code = req.body.code;
    var access_token = req.body.access_token;
    var login = req.body.login;

    //Don't look here. I'm using this as a goto statement... 
    //  too tired to think of a better way...
    function repoExists() {
        // 1.) The repo exists, we need the SHA of the last commit
        var SHA_LAST_COMMIT = "curl https://api.github.com/repos/" + login + "/" + repo + "/git/refs/heads/master";
        console.log("SHA_LAST_COMMIT " + SHA_LAST_COMMIT);
        cp.exec(SHA_LAST_COMMIT, (error, stdout, stderr) => {
            var response = JSON.parse(stdout);
            SHA_LAST_COMMIT = response.object.sha; //Oh JavaScript, you dog you.
            console.log("Responded: SHA_LAST_COMMIT="+SHA_LAST_COMMIT);
            // 2.) We now need the SHA of the base tree
            var SHA_BASE_TREE = "curl https://api.github.com/repos/" + login + "/" + repo + "/git/commits/" + SHA_LAST_COMMIT;
            console.log("SHA_BASE_TREE " + SHA_BASE_TREE);
            cp.exec(SHA_BASE_TREE, (error, stdout, stderr) => {
                var response = JSON.parse(stdout);
                SHA_BASE_TREE = response.tree.sha;
                console.log("Responded: SHA_BASE_TREE="+SHA_BASE_TREE);
                // 3.) Post out for a new tree -> save the resulting SHA
                var content = {
                    "base_tree": SHA_BASE_TREE,
                    "tree": [{
                        "path": "submission.py",
                        "mode": "100644",
                        "type": "blob",
                        "content": code
                    }]
                };
                var SHA_NEW_TREE = "curl -H 'Content-Type: application/json' -X POST -d '" + JSON.stringify(content) + "' https://api.github.com/repos/" + login + "/" + repo + "/git/trees?access_token=" + access_token;
                console.log("SHA_NEW_TREE " + SHA_NEW_TREE);
                cp.exec(SHA_NEW_TREE, (error, stdout, stderr) => {
                    var response = JSON.parse(stdout);
                    SHA_NEW_TREE = response.sha;
                    console.log("Responded: SHA_NEW_TREE="+SHA_NEW_TREE);
                    // 4.) Post to get new commit SHA
                    var content = {
                        "message": "Auto commit from thoth at " + dt,
                        "parents": [
                            SHA_LAST_COMMIT
                        ],
                        "tree": SHA_NEW_TREE
                    }
                    var SHA_NEW_COMMIT = "curl -H 'Content-Type: application/json' -X POST -d '" + JSON.stringify(content) + "' https://api.github.com/repos/" + login + "/" + repo + "/git/commits?access_token=" + access_token;
                    console.log("SHA_NEW_COMMIT "+SHA_NEW_COMMIT);
                    cp.exec(SHA_NEW_COMMIT, (error, stdout, stderr) => {
                        var response = JSON.parse(stdout);
                        SHA_NEW_COMMIT = response.sha;
                        console.log("Responded: SHA_NEW_COMMIT="+SHA_NEW_COMMIT);
                        // 5.) We made it! Push to github!
                        var push = "curl -H 'Content-Type: application/json' -X POST -d '{\"sha\":\"" + SHA_NEW_COMMIT + "\"}' https://api.github.com/repos/" + login + "/" + repo + "/git/refs/heads/master?access_token=" + access_token;
                        console.log("Push "+push);
                        cp.exec(push, (error, stdout, stderr) => {
                            res.send("Successfully pushed to GitHub");
                        });
                    });
                });
            });
        });
    }


    // 0.) We've got to check to see if the repo exists
    var lookForRepo = 'curl https://api.github.com/repos/' + login + '/' + module;

    console.log("lookForRepo " + lookForRepo);

    cp.exec(lookForRepo, (error, stdout, stderr) => {
        var response = JSON.parse(stdout);
        if (response.message && response.message === "Not Found") {
            //We haven't created this repo yet
            console.log("Could not find repo.... creating!");
            var makeRepo = "curl -H 'Content-Type: application/json' -X POST -d '{\"name\":\"" + module + "\",\"description\":\"This repo holds code submissions for " + module + "\", \"auto_init\":true}' https://api.github.com/user/repos?access_token=" + access_token;
            console.log("makeRepo " + makeRepo);
            cp.exec(makeRepo, (error, stdout, stderr) => {
                repoExists();
            });
        } else {
            repoExists();
        }
    });
})
