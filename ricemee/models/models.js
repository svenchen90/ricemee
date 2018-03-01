var mongoose = require("mongoose");
var Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

//Test
//End of Test

//User
var userSchema = new Schema({
	//regex
	username: {type: String, required: true, unique: true},
	//need to hash && regex
	password: {type: String, required: true},
	details: {type: Schema.Types.Mixed},
	// 0: inactive, 1: general customer, 2: premium customer, 3: general VC, 4： premium customer, 5: general group, 6 premium group
	authority: {type: Number, default: 0, required: true},
	// 0: inactive, 1: active
	status: {type: Number, default: 0, required: true},
	follow: [{type: ObjectId, ref: 'User'}],
	details: {type: Schema.Types.Mixed}
});

var personalDetails = {
	photo: {type: String, default: 'userphoto_default.jpg',required: true},
	name: {first: {type: String, required: true},
			last: {type: String, required: true}},
	birthday: {type: Date},
	// regex for email and phone
	email: {type: String, required: true},
	phone: {type: String, required: true},
	//titles: [{type: String}],
	occupations: [{type: String}],
	//display format?
	introduction: {type: String}
};

var groupDetails = {
	logo: {type: String, required: true},
	name: {type: String, required: true},
	//there should be a list of options of types  && need to be valify
	type: {type: String, required: true},
	date_established: {type: Date, required: true},
	introduction: {type: String},
	members: [{member: {type: String}, title: {type: String, required: true}}]
};
//Group
/* var groupSchema = new Schema({
	logo: {type: String, required: true},
	name: {type: String, required: true},
	//there should be a list of options of types  && need to be valify
	type: {type: String, required: true},
	date_established: {type: Date, required: true},
	introduction: {type: String},
	members: [{member: {type: ObjectId, ref: 'User'}, title: {type: String, required: true}}],
	posts: [{type: ObjectId, ref: 'Post'}]
	// 0: inactive, 1: general group, 2: premium group,
	authority: {type: Number, default: 0, required: true},
	// 0: inactive, 1: active, 2: await VC, 3: have VC already
	status: {type: Number, default: 0, required: true},
}); */
//Event
/* var eventSchema = new Schema({
	//By group or individual
	holdby: {type: ObjectId, required: true},
	participants: [{type: ObjectId, ref: 'User'}],
	name: {type: String, required: true},
	schedule: {type: String, required: true},
	details: {type: Schema.Types.Mixed, required: true},
	likes: [{type: ObjectId, ref: 'User'}],
	comments: [{
		madeby: {type: ObjectId, ref: 'User', required: true},
		date: {type: Date, default: Date.now, required: true},
		comment: {type: String, required: true},
		status: {type: Number, required: true}
	}],
	priority:  {type: Number, default: 0, required: true},
	status: {type: Number, default: 0, required: true}
}); */
//Post
/* There should be several different types of post, such as text, pictures & vidoes */
var postSchema = new Schema({
	madeby: {type: ObjectId, ref: 'User', required: true},
	date: {type: Date, default: Date.now, required: true},
	// 1: text, 2: picutres, 3: video, 4: event
	type: {type: Number, required: true},
	details: {type: Schema.Types.Mixed, required: true},
	likes: [{type: ObjectId, ref: 'User'}],
	comments: [{
		madeby: {type: ObjectId, ref: 'User', required: true},
		date: {type: Date, default: Date.now, required: true},
		comment: {type: String, required: true},
		status: {type: Number, required: true}
	}],
	priority:  {type: Number, default: 0, required: true},
	status: {type: Number, default: 0, required: true}
});

exports.User = mongoose.model('User', userSchema);
//exports.Group = mongoose.model('Group', groupSchema);
//exports.Event = mongoose.model('Event', eventSchema);
exports.Post = mongoose.model('Post', postSchema);
