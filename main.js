var express = require('express');
var fs = require("fs");
var path = require('path');

var bodyParser = require('body-parser');
var multer  = require('multer');
var upload = multer({dest:'uploads/'}).single('file');
//var upload = multer({ dest: 'uploads/' });

var crypto = require('crypto');

var app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({limit: '100mb'}));


app.post('/image_proxy', function(req, res){
	var username = req.body.username;
	var bannerName = req.body.bannerName;
	var bannerFilename = username + '.' + bannerName;



	db.save(bannerFilename, req.body, function(err){
		res.send({msg: "ok"});
	});
	//console.log('body: ' + JSON.stringify(req.body));

});

var server = app.listen(8082, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Banner Maker app listening at http://%s:%s", host, port)
});