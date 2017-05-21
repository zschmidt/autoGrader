var absolutePath = "/home/zach/autoGrader";

var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var cp = require('child_process');
var app = express();
var dateTime = require('node-datetime');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;



// __dirname is /home/zach/autoGrader/server


app.get('/auth/?code=:code', function(req, res){
    res.send('code '+req.params.code);

    console.log("client secret "+process.env.client_secret);

    // var xhr = new XMLHttpRequest();
    // post.open('POST', "https://github.com/login/oauth/access_token?client_id=02d1c7baba80ece0140f&redirect_uri=http://thoth.cs.uoregon.edu:3000/&client_secret="+process.env.client_secret+"&code="+code);
    // post.addEventListener("readystatechange", getAccessCode, false);

    // function getAccessCode(e) {
    //     if (post.readyState === 4 && post.status == 200) {
    //         console.log("Here's your response: ", post.response);
    //     }
    // }

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
    var cmd = 'cat '+absolutePath+'/submission.py';
    cp.exec(cmd, (error, stdout, stderr) => {
        res.send(stdout);
    });
});


app.listen(3000, function() {
    console.log('Server listening on port 3000!')
})


// POST method route
app.post('/', function(req, res) {

	var dt = dateTime.create();
	dt = dt.format('Y-m-d H:M:S');
    var pushCmd = 'cd '+absolutePath+' && rm submission.py && touch submission.py && echo "'+req.body.code+'">>submission.py && git add . && git commit -m "Auto commit from thoth at '+dt+'" && git push';
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




