/*
TODO:
-an array for usernames in order to secure a new username for registration
instead of searching the db for username, search and add a new username
to the array to secure it
-make user authentication in memory
*/

var express = require('express');
var fs = require("fs");
var path = require('path');

var bodyParser = require('body-parser');
var multer  = require('multer');
var upload = multer({dest:'uploads/'}).single('file');
//var upload = multer({ dest: 'uploads/' });

var crypto = require('crypto');

var low = require('lowdb');
var db = low('database/bannermaker-db.json');
// db.defaults({ posts: [], users: [] })
//   .write();

function authenticateUser(email, password){

	var passHash = crypto.createHash('sha256').update(password).digest('base64');
	var user = db.get('users')
				 .find({email: email, passHash: passHash})
				 .value();
	
	if(user){
		return true;
	}
	else{
		return false;
	}

}

var registeredEmails = {};

function loadRegisteredEmails(){
	var users = db.get('users').value();

	for(var i = 0; i < users.length; i++){
		registeredEmails[users[i].email] = true;
	}
}

loadRegisteredEmails();

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

app.post('/login', function (req, res) {

	var email = req.body.email;
	var password = req.body.password;

	if(authenticateUser(email, password)){
		res.status(200).send('User authenticated successfully!');
	}
	else{
		res.status(400).send('User authentication failed!');
	};

});

app.post('/register', function (req, res) {

	var email = req.body.email;
	var password = req.body.password;

	// var user = db.get('users')
	// 			 .find({email: email})
	// 			 .value();
	
	if(registeredEmails[email] !== undefined){
		res.status(400).send('This email is in use, please choose another one!');
	}
	else {
		registeredEmails[email] = true;
		var passHash = crypto.createHash('sha256').update(password).digest('base64');
		db.get('users').push({email: email, passHash: passHash}).write();
		res.send("Registration Successful!");
	}

});

app.post('/save-banner', function(req, res){
	var email = req.body.email;
	// var password = req.body.password;
	var bannerName = req.body.bannerName;
	var bannerData = req.body.bannerData;

	// if(!authenticateUser(email, password)){
	// 	res.status(400).send('User authentication failed!');
	// 	return;
	// }
	//console.log(JSON.stringify(bannerData));
	var banner = db.get('banners')
				   .find({email: email, bannerName: bannerName}).value();
	
	//console.log("come on: " + JSON.stringify(banner));
	if(banner){
		db.get('banners')
		  .find({email: email, bannerName: bannerName})
		  .assign({bannerData: bannerData})
		  .write();
	}
	else{
		 db.get('banners')
    	   .push({email: email, 
				  bannerName: bannerName, 
				  bannerData: bannerData})
		   .write();
	}

	res.send({msg: "ok"});

});

app.post('/get-banner', function (req, res) {
	var email = req.body.email;
	var password = req.body.password;
	var bannerName = req.body.bannerName;

	if(!authenticateUser(email, password)){
		res.status(400).send('User authentication failed!');
		return;
	}

	var banner = db.get('banners')
				 .find({
					email: email, 
					bannerName: bannerName})
				.value();

	res.send(banner);

});

app.post('/get-banner-list', function (req, res) {
	var email = req.body.email;
	var password = req.body.password;

	if(!authenticateUser(email, password)){
		res.status(400).send('User authentication failed!');
		return;
	}

	var banners = db.get('banners')
				.value(); //possible performance issue? solution: filter or is it the same performancewise? 
	
	var bannerList = [];
	for(var i = 0; i < banners.length; i++){
		if(banners[i].email == email){
			bannerList.push({
				bannerName: banners[i].bannerName,
				bannerPreview: banners[i].bannerData.slides[0].preview
			});
		}
	}

	res.send(bannerList);

});

app.post('/banner-exists', function (req, res) {
	var email = req.body.email;
	var password = req.body.password;
	var bannerName = req.body.bannerName;

	if(!authenticateUser(email, password)){
		res.status(400).send('User authentication failed!');
		return;
	}

	var banner = db.get('banners')
				 .find({
					email: email, 
					bannerName: bannerName})
				.value();
	
	if(banner){
		res.send({exists: true});
	}
	else{
		res.send({exists: false});
	}
	

});

app.post('/delete-banner', function(req, res){
	var email = req.body.email;
	var password = req.body.password;
	var bannerName = req.body.bannerName;

	if(!authenticateUser(email, password)){
		res.status(400).send('User authentication failed!');
		return;
	}

	db.get('banners')
    	   .remove({email: email, 
				    bannerName: bannerName})
		   .write();

});

var server = app.listen(8082, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Banner Maker app listening at http://%s:%s", host, port)
});