var express = require('express');
var bodyParser = require('body-parser')
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

app.get('/', function (req, res) {
  res.send('<h1>Everything is easier in JavaScript!!</h1>')
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

// POST method route
app.post('/', function (req, res) {
  res.send('You just POST\'d: '+ JSON.stringify(req.body));
  console.log(req.body);
})
