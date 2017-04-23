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
  //I'm just a dummy comment!
  console.log('Server listening on port 3000!')
})

// POST method route
app.post('/', function (req, res) {
  var ls = cp.spawn('ls');
  ls.stdout.on('data', function(data) {
	console.log('Message: ' + data);
  });
  res.send('You just POST\'d: '+ JSON.stringify(req.body));
  console.log(req.body);
})
