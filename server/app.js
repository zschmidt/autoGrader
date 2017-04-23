var express = require('express');
var bodyParser = require('body-parser');
var cp = require('child_process');
var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// parse application/json
app.use(bodyParser.json())

app.listen(3000, function () {
  console.log('Server listening on port 3000!')
})

// POST method route
app.post('/', function (req, res) {

  var request = JSON.stringify(req.body);

  var rm = spawn('rm', ['-f', '../fake.txt']);
  rm.on('close', (code) => {
    console.log(`rm exited with code ${code}`);
    var touch = spawn('touch', ['../fake.txt']);
    touch.on('close', (code) => {
      console.log(`touch exited with code ${code}`);
      var echo = spawn('echo', ['"'+request+'">>../fake.txt']);
    });
  });
  res.send('You just POST\'d: '+ request);
  console.log(req.body);
})
