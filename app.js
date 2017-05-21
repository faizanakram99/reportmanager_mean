var express = require('express');
var reportController = require('./controllers/reportController');

var app = express();

//static files
app.use('/assets', express.static('assets'));

app.get('/', function (req,res) {
   res.sendFile(__dirname + '/index.html');
});

//fire the controllers
reportController(app);

//listen to port
app.listen(3000, '127.0.0.1');
console.log('You are listening to port 3000');