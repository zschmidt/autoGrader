//This is the server that hosts the website... should probably be done a different way...
var serverName = "thoth.cs.uoregon.edu:3000"


var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var cp = require('child_process');
var app = express();
var dateTime = require('node-datetime');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;



// __dirname is /home/zach/autoGrader/server


//This is a disgusting hack to send an entire html page... I don't want to save it anywhere...
// it's just a file that contains a spinner, and populates the session storage with the github access token
function sendAccessToken(access_token) {
    return "<!doctype html><html lang='en'><head><style type='text/css'>@keyframes spinner{to{transform:rotate(360deg)}}.spinner:before{content:'';box-sizing:border-box;position:absolute;top:50%;left:50%;width:20px;height:20px;margin-top:-10px;margin-left:-10px;border-radius:50%;border-top:2px solid #07d;border-right:2px solid transparent;animation:spinner.6s linear infinite}</style><meta charset='utf-8'><title>Authenticating...</title></head><body><div class='spinner'></div><script type='text/javascript'>function store(){sessionStorage.removeItem('access_token');sessionStorage.setItem('access_token','" + access_token + "');setTimeout(function(){window.location.replace('http://thoth.cs.uoregon.edu:3000')},1000)}window.onload=store;</script></body></html>";
}

//When the GitHub oauth redirect hits this, we go and get the access token, then send it back to the user

//NOTE: Don't forget to add the client secret to the environment variables!
app.get('/auth', function(req, res) {
    var secret = process.env.client_secret;
    var code = req.query.code;
    var url = "https://github.com/login/oauth/access_token";
    var params = "client_id=02d1c7baba80ece0140f&client_secret=" + secret + "&code=" + code;

    if (url && params) { //Sometimes they're undefined.... spooky!
        console.log('curl --data "' + params + '" ' + url);
        var cmd = 'curl --data "' + params + '" ' + url;
        var stdout = cp.execSync(cmd).toString();
        access_token = stdout.split("&")[0].split("=")[1];
        console.log("SUCCESS! Access token: " + access_token);
        res.send(sendAccessToken(access_token));
        res.redirect('/');
    }
});


//This line allows us to serve anything from the /public directory
app.use(express.static(path.join(__dirname, '/public')));




// I forget why I added these... they're probably necessary though
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


// If you want to look in request bodys
app.use(bodyParser.json())



//Helper function -- takes a gitHub access_token, returns a gitHub login
function getLogin(access_token){
    var userLogin = 'curl https://api.github.com/user?access_token=' + access_token;
    console.log('getSubmission ' + userLogin);
    var stdout = cp.execSync(userLogin).toString();
    return JSON.parse(stdout).login;
}

//This is how we get the last thing that the student sumitted for this module

//We respond with a JSON object
//  {
//      "submission":   SUBMISSION_TEXT,
//      "login":        GITHUB_LOGIN 
//  }
app.get('/getSubmission', function(req, res) {
    var response = {};
    var module = req.query.module;
    response.login = getLogin(req.query.access_token);
    console.log("Inside getSubmission -- access_token is "+req.query.access_token+" login is "+response.login);
    var login = response.login; 
    var lastSubmission = 'curl https://raw.githubusercontent.com/' + login + '/' + module + '/master/submission.py'
    var stdout = cp.execSync(lastSubmission).toString();
    response.submission = stdout;
    if (stdout.includes("404: Not Found"))
        response.submission = " ";
    res.send(JSON.stringify(response));
});

//Starting the server... nothing really to see here...
app.listen(3000, function() {
    console.log('Server listening on port 3000!')
})



//You can add a file to a repo like this:
// curl -i -X PUT -H 'Authorization: token <token_string>' -d '{"path": "<filename.extension>", "message": "<Commit Message>", "committer": {"name": "<Name>", "email": "<E-Mail>"}, "content": "<Base64 Encoded>", "branch": "master"}' https://api.github.com/repos/<owner>/<repository>/contents/<filename.extension>
// Who knew?!
function addFile(filename, access_token, repo, login, base64){
    var dt = dateTime.create().format('Y-m-d H:M:S');
    var obj = {
        path: filename,
        message: "File added automatically at "+dt,
        content: base64,
        branch: "master"
    };
    var addFileString = 'curl -i -X PUT -H "Authorization: token '+access_token+'" -d \''+JSON.stringify(obj)+'\' https://api.github.com/repos/'+login+'/'+repo+'/contents/'+filename;
    console.log("AddFile ", addFileString);
    var result = cp.execSync(addFileString).toString();
    console.log("After adding file, result = ", result);
}


//As a spin off of above, we can update a file in a similar way
function updateFile(filename, access_token, repo, login, base64, sha){
    var dt = dateTime.create().format('Y-m-d H:M:S');
    var obj = {
        path: filename,
        message: "File added automatically at "+dt,
        content: base64,
        sha: sha,
        branch: "master"
    };
    var addFileString = 'curl -i -X PUT -H "Authorization: token '+access_token+'" -d \''+JSON.stringify(obj)+'\' https://api.github.com/repos/'+login+'/'+repo+'/contents/'+filename;
    console.log("UpdateFile ", addFileString);
    var result = cp.execSync(addFileString).toString();
    console.log("After adding file, result = ", result);
}


function getBase64(path){
    var getBase64 = 'base64 '+path;
    var base64 = cp.execSync(getBase64).toString();
    return base64;
}

function getBase64FromString(content){
    var getBase64 = 'echo \''+content+'\' | base64';
    var base64 = cp.execSync(getBase64).toString();
    return base64;
}


function makeRepo(login, module, access_token){
    //This function makes a repo (if one doesn't already exist) named "module" for user "login"
    var lookForRepo = 'curl https://api.github.com/repos/' + login + '/' + module;
    console.log("lookForRepo " + lookForRepo);
    var stdout = cp.execSync(lookForRepo).toString();
    var response = JSON.parse(stdout);
    console.log("Inside lookForRepo... what happened? ", response);
    if (response.message && response.message === "Not Found") {
        //We haven't created this repo yet
        console.log("Could not find repo.... creating!");
        var makeRepo = "curl -H 'Content-Type: application/json' -X POST -d '{\"name\":\"" + module + "\",\"description\":\"This repo holds code submissions for " + module + "\", \"auto_init\":true}' https://api.github.com/user/repos?access_token=" + access_token;
        console.log("makeRepo " + makeRepo);
        cp.execSync(makeRepo);
    }
}


// This function gets called the first time the user hits the module page
// The object that this takes looks like this:
// {
//     access_token:   ACCESS_TOKEN,
//     modules:        LIST_OF_MODULES
// }
app.post('/makeRepos', function(req, res) {

    console.log("Inside makeRepos...");
    console.log("Heres' the body ", req.body);

    console.log("I see modules ", req.body.modules);
    var modules = JSON.parse(req.body.modules);
    var access_token = req.body.access_token;
    var login = getLogin(access_token);

    for(var i=0; i<modules.length; i++){
        var repo = modules[i];
        makeRepo(login, repo, access_token);
        var base64 = getBase64(__dirname+'/../validationRepos/'+repo+'/validation.py');
        addFile("validation.py", access_token, repo, login, base64);
        base64 = getBase64(__dirname+'/../validationRepos/'+repo+'/.travis.yml');
        addFile(".travis.yml", access_token, repo, login, base64);
    }
});


function fileExists(repo, login, filename){
    var lookForFile = 'curl https://api.github.com/repos/'+login+'/'+repo+'/git/trees/master';
    var result = JSON.parse(cp.execSync(lookForFile).toString());
    console.log("Inside fileExists -- before -- ", result);
    result = result.tree;
    console.log("Inside fileExists -- after -- ", result);
    for(var i=0; i<result.length; i++){
        var file = result[i].path;
        if(file === filename){
            return result[i].sha;
        }
    }
    return false;
}


// When the user presses "Submit", this is the function that gets hit
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

    // 0.) We've got to check to see if the repo exists
    makeRepo(login, module, access_token);
    // 1.) The repo exists, we need to see if this is a new file or an update
    var sha = fileExists(repo, login, "submission.py");
    var base64 = getBase64FromString(code);
    if(sha){
        updateFile("submission.py", access_token, repo, login, base64, sha)
    }else{
        addFile("submission.py", access_token, repo, login, base64)
    }
    
    res.send("Successfully pushed to GitHub");
});
