var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');
var csv = require('fast-csv');

//MongoDB
var mongoose = require('mongoose');
var models = require('../models/models');
var User = models.User,
	Post = models.Post;
	
mongoose.connect('mongodb://localhost/ricemee');
//End of MongoDB

//Passport
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, '_id details.name details.photo', function(err, user) {
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
//End of Passport

/* Authority Map */
var authoritymap = {
};
/* End of Authority Map */


/* Action */
//GET home page
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

//Sign Up
router.route('/signup')
	.get(function(req, res, next) {
		if(req.isAuthenticated()){
			res.redirect('/');
		}
		else
			res.render('signup', {user: ""});
	})
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
			res.redirect('/');
		});
	});
	
router.route('/signup_vc')
	.get(function(req, res, next) {
		if(req.isAuthenticated()){
			res.redirect('/');
		}
		else
			res.render('signup_vc', {user: ""});
	})
	.post(function(req, res, next) {
		res.json(req.body);
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
			res.redirect('/');
		});
	});
	
//Sign In
router.route('/signin')
	.get(function(req, res, next) {
		if(req.isAuthenticated()){
			res.redirect('/');
		}
		else
			res.render('signin', {user: ""});
	})
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

//Sign Out
router.route('/signout')
	.get(function(req, res, next){
		req.logout();
		res.redirect('/');
	});	

//Create Post
router.route('/post')
	.get(function(req,res,next){
		if(req.isAuthenticated()){
			res.render('makepost', {user: req.user});
		}
		else
			res.redirect('/signin');
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
			res.redirect('/signin');
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
			res.redirect('/signin');
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
			res.redirect('/signin');
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
			res.redirect('/signin');
	});

//List Posts
router.route('/listpost')
	.get(function(req,res,next){
		Post.find({})
			.sort({date: -1})
			.populate('madeby', '_id details.name details.name details.photo')
			.exec(function(err,posts){
				//console.log(posts);
				//res.json(posts);
				if(req.isAuthenticated())
					res.render('listpost', {user: req.user, posts: posts});
				else
					res.render('listpost', {user: '', posts: posts});
			});
	});
	
//View VC
router.route('/viewvc')
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
		User.find(req.query, function(err,users){
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
/* End of Action */

/* Test */
/* router.route('/testvc')
	.get(function(req, res, next){
		User.findOne({_id: req.query.id, authority: 3})
			.exec(function(err,vc){
				Post.find({madeby: vc._id})
					.sort({date: -1})
					.populate('madeby', '_id details.name details.name details.photo')
					.exec(function(err, posts){
						if(req.isAuthenticated())
							res.render('test/blog_vc', {user: req.user,vc: vc, posts: posts});
						else
							res.render('test/blog_vc', {user: '',vc: vc, posts: posts});
					});
			});
	}); */

router.route('/test')
	.get(function(req, res, next){
		new User({
			username: 'tomcat',
			password: '123456',
			authority: 3,
			status: 0,
			details: {
				photo: 'images/banner.png',
				name: {
					first: 'Tom',
					last: 'Cat'
				},
				//birthday: req.body.birthday,
				//email: req.body.email,
				//phone: req.body.phone,
				//occupations: req.body.occupations,
				introduction: 'here show be fill with a short paragraph to describe this vc',
				brief:[{
					title: 'hightlight 1',
					details: 'here show be fill with a short paragraph to describe the hightlight '
				},
				{
					title: 'hightlight 2',
					details: 'here show be fill with a short paragraph to describe the hightlight '
				},
				{
					title: 'hightlight 3 ',
					details: 'here show be fill with a short paragraph to describe the hightlight'
				},
				{
					title: 'hightlight 4',
					details: 'here show be fill with a short paragraph to describe the hightlight'
				}]
			}
		}).save(function(err, user){
			res.json(user);
		});
		/* User.find({authority: 3})
			.exec(function(err,vcs){
				//console.log(posts);
				//res.json(posts);
				if(req.isAuthenticated())
					res.render('test/index', {user: req.user, vcs: vcs});
				else
					res.render('test/index', {user: '', vcs: vcs});
			});  */
		/* Post.find({})
			.sort({date: -1})
			.populate('madeby', '_id details.name details.name details.photo')
			.exec(function(err,posts){
				//console.log(posts);
				//res.json(posts);
				if(req.isAuthenticated())
					res.render('test/index', {user: req.user, vcs: vcs});
				else
					res.render('test/index', {user: '', vcs: vcs});
			});  */
		/* Test of Schema */
		// User
		// new User({username: 'test02',
					// password: '123456',
					// name: {first: 'hello',
							// last: 'world'},
					// titles: ['test','test1'],
					// occupations: ['test'],
					// birthday: new Date(),
					// email: 'abc@123.com',
					// phone: '0000000000',
					// introduction: 'hello world',
					// status: 0,
					// posts: []})
					// .save(function(err, data){
						// if(err)
							// res.json(err);
						// else
							// res.json(data);
					// });
					
		// User.find({username: 'test01'})
			// .populate('posts')
			// .exec(function(err,data){
				// res.json(data);
			// });
		// User.update({username: 'test01'}, {$pull: {posts: '57feb59f4af8ac1ff84af7a0'}},{multi: true}, function(err, tank){
			// if(err)
				// res.json(err);
			// else
				// res.json(tank);
		// });
		
		//Post
		// new Post({
			// date: new Date(),
			// contents: {pictures: [],
						// text: 'this is my first post',
						// video: 'hahah'},
			// likes: [],
			// comments: [],
			// status: 0
		// }).save(function(err,data){
			// res.json(data);
		// });
		// Post.update({},{$push: {likes : '57feae1669303706fc5aaec5'}}, function(err, tank){
			// res.json(tank);
		// });
		// Post.find({})
			// .populate('comments')
			// .populate('likes')
			// .exec(function(err,data){
				// res.json(data);
			// });
		
		//Comment
		// new Comment({madeby: '57feae1669303706fc5aaec5',
					// date:  new Date(),
					// comment: 'this is my first comment!',
					// status: 0})
					// .save(function(err, data){
						// res.json(data);
					// });
		//Event
		// new Event({
			// holdby: '57feae1669303706fc5aaec5',
			// participants: [],
			// name: 'test',
			// schedule: new Date(),
			// details: 'this is my first event',
			// likes: [],
			// comments: [],
			// status: 0
		// }).save(function(err, data){
			// res.json(data);
		// });
		
		
	});
/* End of Test */
module.exports = router;
