var express = require('express');
var fs = require("fs");

var bodyParser = require('body-parser');
var multer  = require('multer');
var upload = multer({dest:'uploads/'}).single('file');
//var upload = multer({ dest: 'uploads/' });

var crypto = require('crypto');

var app = express();

app.use(express.static('./'));
app.use(bodyParser.json({limit: '100mb'}));

var server = app.listen(8082, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Banner Maker app listening at http://%s:%s", host, port)
});