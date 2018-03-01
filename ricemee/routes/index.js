var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');
var csv = require('fast-csv');

/* MongoDB */
var mongoose = require('mongoose');
var models = require('../models/models');
var User = models.User,
	Post = models.Post;
	
mongoose.connect('mongodb://localhost/ricemee');
/* End of MongoDB */

/* Passport */
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, '_id details.name details.photo authority', function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({username: username}, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, {message: "Incorrect username or Password!"})}
        if (user.password != password) { return done(null, false, {message: "Incorrect password!"})}
        return done(null, user);
    });
  }
));
/* End of Passport */

/* Authority Map */
var authoritymap = {
};
/* End of Authority Map */

/* Action */
router.route('/')
	.get(function(req, res, next) {
		User.find({authority: 3})
			.exec(function(err,vcs){
				//console.log(posts);
				//res.json(posts);
				if(req.isAuthenticated())
					res.render('index', {user: req.user, vcs: vcs});
				else
					res.render('index', {user: '', vcs: vcs});
			}); 
	});
	
router.route('/signin')
	.post(function(req, res, next) {
		passport.authenticate('local', function(err, user, info) {
			if (err) { return next(err) }
			if (!user) {
				return res.json({ message: info.message});
			}else if(user.status == 1){
				return res.json({ message: 'User is inactive.'});
			}else
				req.logIn(user, function(err) {
				  if (err) { return next(err); }
				  return res.json({ message: 'success'});
				});
		})(req, res, next);
	});	
	
router.route('/signout')
	.get(function(req, res, next){
		req.logout();
		res.redirect('/');
	});		
	
router.route('/signup')
	.post(function(req, res, next) {
		new User({
			username: req.body.username,
			password: req.body.password,
			authority: 0,
			status: 0,
			details: {
				photo: 'userphoto_default.jpg',
				name: {
					first: req.body.first_name,
					last: req.body.last_name
				},
				birthday: req.body.birthday,
				email: req.body.email,
				phone: req.body.phone,
				occupations: req.body.occupations,
				introduction: req.body.introduction
			}
		}).save(function(err,user){
			console.log(user);
			if(err)
				res.json('error')
			else
				res.json('success');
		});
	});	

router.route('/vc')
	.get(function(req, res, next){
		User.findOne({_id: req.query.id, authority: 3})
			.exec(function(err,vc){
				Post.find({madeby: vc._id})
					.sort({date: -1})
					.populate('madeby', '_id details.name details.name details.photo')
					.exec(function(err, posts){
						if(req.isAuthenticated())
							res.render('blog_vc', {user: req.user,vc: vc, posts: posts});
						else
							res.render('blog_vc', {user: '',vc: vc, posts: posts});
					});
			});
	});		

//check uniqueness of username, email & phone
router.route('/checkavaliability')
	.get(function(req,res,next){
		if(Object.keys(req.query)[0] == 'username')
			query = req.query
		else{
			key = Object.keys(req.query)[0]
			newkey = 'details.' + key
			query = {}
			query[newkey] = req.query[key]
		}
		console.log(query);
		User.find(query, function(err,users){
			if(err) return next(err);
			else{
				if(users.length == 0){
					return res.end(res.writeHead(200, 'OK'));
				}else{
					return res.end(res.writeHead(400, 'Existed! Please input another one!'));
				}
			}
		});
	});

//Post Event
router.route('/postevent')
	.post(function(req,res,next){
		if(req.isAuthenticated()){
		  //生成multiparty对象，并配置上传目标路径
			var form = new multiparty.Form({uploadDir: './public/files/'});
		  //上传完成后处理
			form.parse(req, function(err, fields, files) {
				var filesTmp = JSON.stringify(files,null,2);
				if(err){
				  console.log('parse error: ' + err);
				  res.json({error: 'error!!!!'});
				}else{
					//console.log(fields);
					//console.log(fields);
					new Post({
						madeby: req.user._id,
						type: 4,
						details:{
							title: fields['title'][0],
							participator: [],
							schedule: fields['schedule'][0],
							details: fields['details'][0],
							link: fields['link'][0],
							url: "files/"+files.inputFile[0].path.split('\\').slice(-1)[0]
						}
					}).save(function(err,data){
						console.log(fields);
						console.log(data);
						res.json("success");
					}); 
				}
			});
		}else
			res.json('error');
	});

//Post Text
router.route('/posttext')
	.post(function(req,res,next){
		if(req.isAuthenticated()){
			new Post({
				madeby: req.user._id,
				type: 1,
				details: {
					title: req.body.title,
					details: req.body.details
				}
			}).save(function(err,post){
				if(err) return next(err);
				else
					res.redirect("/");
			});
		}else
			res.json('error');
	});

//Post photos
router.route('/postphotos')	
	.post(function(req,res,next){
		if(req.isAuthenticated()){
		  //生成multiparty对象，并配置上传目标路径
			var form = new multiparty.Form({uploadDir: './public/files/'});
		  //上传完成后处理
			form.parse(req, function(err, fields, files) {
				var filesTmp = JSON.stringify(files,null,2);
				if(err){
				  console.log('parse error: ' + err);
				  res.json({error: 'error!!!!'});
				}else{
					//console.log(fields);
					//console.log(fields);
					new Post({
						madeby: req.user._id,
						type: 2,
						details: {
							title: fields['title'][0],
							text: fields['details'][0],
							url: "files/"+files.inputFile[0].path.split('\\').slice(-1)[0]
						}
						// priority: 0,
						// status: 0
					}).save(function(err,data){
						console.log(fields);
						console.log(data);
						res.json("success");
					}); 
				}
			});
		}else
			res.json('error');
	});
	
//Post Video
router.route('/postvideo')	
	.post(function(req,res,next){
		if(req.isAuthenticated()){
		  //生成multiparty对象，并配置上传目标路径
			var form = new multiparty.Form({uploadDir: './public/files/'});
		  //上传完成后处理
			form.parse(req, function(err, fields, files) {
				var filesTmp = JSON.stringify(files,null,2);
				if(err){
				  console.log('parse error: ' + err);
				  res.json({error: 'error!!!!'});
				}else{
					//console.log(fields);
					//console.log(fields);
					new Post({
						madeby: req.user._id,
						type: 3,
						details: {
							title: fields['title'][0],
							text: fields['details'][0],
							url: "files/"+files.inputFile[0].path.split('\\').slice(-1)[0]
						}
						// priority: 0,
						// status: 0
					}).save(function(err,data){
						console.log(fields);
						console.log(data);
						res.json("success");
					}); 
				}
			});
		}else
			res.json('error');
	});
	
	
router.route('/event')
	.get(function(req,res,next){
		res.render('event');
	});
	
router.route('/menu')
	.get(function(req,res,next){
		res.render('menu');
	});
router.route('/test')
	.get(function(req,res,next){
		Post.remove({"details.title":"asfsadfsadf"}, function(err,data){
			res.json(data);
		});
	});
/* End of Action */
module.exports = router;
