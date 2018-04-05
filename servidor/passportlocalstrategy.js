let passport=require("passport"),
LocalStrategy=require("passport-local").Strategy,
database=require("./database.js");

module.exports=function(){
	passport.use(new LocalStrategy({
		usernameField:"email",
		passwordField:"password"
	},function(username,password,cb){
		database.Parse.User.logIn(username,password)
		.then(function(user){
			let Session=database.Parse.Object.extend("_Session");
			let queryDb=new database.Parse.Query(Session);
			queryDb.equalTo("sessionToken",user.get("sessionToken"));
			queryDb.first({useMasterKey:true})
			.then(function(item2){
				item2.destroy();
			},function(){console.log("session.firsterror",arguments)});
			let User=database.Parse.Object.extend("_User");
			queryDb=new database.Parse.Query(User);
			queryDb.get(user.id,{useMasterKey:true})
			.then(function(item){
				cb(null,item);
			});
		},function(error,user){
			console.log("user.login error>>",user,error);
			cb(error,null);
		});
	}));
};



