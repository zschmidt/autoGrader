var absolutePath = "/home/zach/autoGrader";


var express = require('express');
var bodyParser = require('body-parser');
var cp = require('child_process');
var app = express();
var dateTime = require('node-datetime');



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
    var testCmd = 'cd '+absolutePath+' && rm submission.py && touch submission.py && echo "'+req.body.code+'">>submission.py && git add . && git commit -m "Auto commit from thoth at '+dt+'" && git push';
    console.error("This is a custom error!!");
    console.log("Request ", req);
    cp.exec(testCmd, (error, stdout, stderr) => {
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




