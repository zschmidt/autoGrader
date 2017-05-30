var serverName = "thoth.cs.uoregon.edu:3000"


var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var cp = require('child_process');
var app = express();
var dateTime = require('node-datetime');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;



// __dirname is /home/zach/autoGrader/server


function sendAccessToken(access_token){
    return "<!doctype html><html lang='en'><head><style type='text/css'>@keyframes spinner{to{transform:rotate(360deg)}}.spinner:before{content:'';box-sizing:border-box;position:absolute;top:50%;left:50%;width:20px;height:20px;margin-top:-10px;margin-left:-10px;border-radius:50%;border-top:2px solid #07d;border-right:2px solid transparent;animation:spinner.6s linear infinite}</style><meta charset='utf-8'><title>Authenticating...</title></head><body><div class='spinner'></div><script type='text/javascript'>function store(){sessionStorage.removeItem('access_token');sessionStorage.setItem('access_token','"+access_token+"');setTimeout(function(){window.location.replace('http://thoth.cs.uoregon.edu:3000')},1000)}window.onload=store;</script></body></html>";
}

//Don't forget to add the client secret to the environment variables!
app.get('/auth', function(req, res){
    var secret = process.env.client_secret;
    var code = req.query.code;
    var url = "https://github.com/login/oauth/access_token";
    var params = "client_id=02d1c7baba80ece0140f&client_secret="+secret+"&code="+code;
    
    if(url && params){ //Sometimes they're undefined.... spooky!
        console.log('curl --data "'+params+'" '+url);
        var cmd = 'curl --data "'+params+'" '+url;
        cp.exec(cmd, (error, stdout, stderr) => {
            access_token = stdout.split("&")[0].split("=")[1];
            console.log("SUCCESS! Access token: "+access_token);
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


app.get('/getSubmission', function(req, res){

    var test = "I see module "+req.query.module+" and access_token "+req.query.access_token

    var cmd = 'cat '+__dirname+'/../submission.py';
    cp.exec(cmd, (error, stdout, stderr) => {
        res.send(test)

        //res.send(stdout);
    });
});


app.listen(3000, function() {
    console.log('Server listening on port 3000!')
})


// POST method route
app.post('/', function(req, res) {

	var dt = dateTime.create();
	dt = dt.format('Y-m-d H:M:S');
    var pushCmd = 'cd '+__dirname+'/../'+' && rm submission.py && touch submission.py && echo "'+req.body.code+'">>submission.py && git add . && git commit -m "Auto commit from thoth at '+dt+'" && git push';
    cp.exec(pushCmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
    res.send('You just POST\'d: ' + JSON.stringify(req.body));
    console.log(req.body);
})




