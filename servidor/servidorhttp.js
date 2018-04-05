let express=require("express"),
database=require("./database.js"),
os=require("os"),
path=require("path"),
mime=require("mime"),
crypto=require("crypto"),
compression=require("compression"),
url=require("url"),
https=require("https"),
bodyParser=require("body-parser"),
cookieParser=require("cookie-parser"),
session=require("express-session"),
mongoStore=require("connect-mongo")(session),
multer=require("multer"),
passport=require("passport"),
config=require("./config");

//process.on("uncaughtException",function(err){console.log("\nprocess.on(uncaughtException)["+process.pid+"]",err,err.stack,"\n\n\n\n\n\n\n\n\n\n")});//if(cluster.isWorker)process.kill(process.pid);

let date=new Date();//new Date().getFullYear(),new Date().getMonth(),new Date().getDate(),new Date().getHours()-5,0,0,0
console.log("currentDate",date.toString(),"currentDateUTC",date.toUTCString());
console.log("crypto.getHashes",JSON.stringify(crypto.getHashes()),"\ncrypto.getCiphers",JSON.stringify(crypto.getCiphers()),"\ncrypto.DEFAULT_ENCODING",crypto.DEFAULT_ENCODING);
process.title="cleverleaves-cms";
console.log("networkInterfaces",os.networkInterfaces(),
"\nenv",process.env,
"\nconfig",process.config,
"\nrelease",process.release,
"\nversions",process.versions,
"\nmemoryUsage",process.memoryUsage(),
"\nserverconfig",config,
"\n__dirname",__dirname,
"\ncpus",os.cpus().length,os.cpus().map(function(element,index,array){return element.model}),
"\ntotalmem",os.totalmem(),
"\nfreemem",os.freemem(),
"\ntype",os.type(),
"\narchitecture",process.arch,
"\nplatform",process.platform,
"\nprocess pid",process.pid,
"\nprocess.env.WEB_CONCURRENCY",process.env.WEB_CONCURRENCY,
"\nprocess.env.WEB_MEMORY",process.env.WEB_MEMORY);

let sendError=function(error,request,response){
	console.log("sendError",JSON.stringify(error,null,2));
	let message;
	if(typeof error==="string") message=error;
	else message=JSON.stringify(error);
	response.status(500);
	response.end("500 Internal Server Error: "+message);
};

let compressFilter=function(request,response){
	if(!!request.query.download) return false;
	else return true;
};

let memberPhotoStorage=multer.memoryStorage();
let memberPhotoUpload=multer({storage:memberPhotoStorage,limits:{fileSize:config.appConfig.maxUploadSize},fileFilter:function(req,file,cb){
	if(/image\/jpeg/.test(file.mimetype) || /image\/png/.test(file.mimetype)){
		cb(null,true)
	}else{
		cb("error - invalid type",false)
	}
}}).single("file");

let slideStorage=multer.memoryStorage();
let slideUpload=multer({storage:slideStorage,limits:{fileSize:config.appConfig.maxUploadSize},fileFilter:function(req,file,cb){
	if(/image\/jpeg/.test(file.mimetype) || /image\/png/.test(file.mimetype)){
		cb(null,true)
	}else{
		cb("error - invalid type",false)
	}
}}).single("file");

let ckeditoruploadStorage=multer.memoryStorage();
let ckeditoruploadUpload=multer({storage:ckeditoruploadStorage,limits:{fileSize:config.appConfig.maxUploadSize},fileFilter:function(req,file,cb){
	console.log("filter",req.body);
	if(/image\/jpeg/.test(file.mimetype) || /image\/png/.test(file.mimetype) || /image\/gif/.test(file.mimetype)){
		cb(null,true)
	}else{
		cb("error - invalid type",false)
	}
}}).single("upload");

let app=express();
app.use(require("prerender-node").set("prerenderServiceUrl",config.prerenderURL));
let port=process.env.PORT || config.webServerEndPointPort;
let httpServer=require("http").createServer(app);

httpServer.listen(port,function(){
	console.log("cleverleaves-cms server listening on port "+port);
});

let sessionStore=new mongoStore({url:config.mongoDatabaseURL});
let sessionTime=config.expressSessionTime;

let router=express.Router();

app.disable("x-powered-by");
app.use(bodyParser.urlencoded({extended:true}));//true qs or false querystring library
app.use(bodyParser.json({strict:false}));
app.use(cookieParser());
let expressSession=session({
	secret:config.serverSecretKey1,
	name:"session",
	store:sessionStore,
	saveUninitialized:false,
	resave:true,
	rolling:false,
	unset:"destroy",//"keep"
	cookie:{
		httpOnly:false,
		path:"/",
		secure:false,
		maxAge:sessionTime
	}
});
app.use(expressSession);
require("./passport.js")(app);

app.use("/api",database.api);

app.use(function(request,response,next){
	let check=function(){
		response.on("error",function(){console.log("response.onerror",err,response.socket.remoteAddress);});
		
		if(/get/i.test(request.method)){
			if(request._parsedUrl.pathname==="/index" || request._parsedUrl.pathname==="/index/") request.url="/main.html";
			else if(request._parsedUrl.pathname==="/error" || request._parsedUrl.pathname==="/error/") request.url="/main.html";
			else if(request._parsedUrl.pathname==="/admin" || request._parsedUrl.pathname==="/admin/") request.url="/main.html";
		}
		
		response.set("Cache-Control","no-cache, must-revalidate");
		response.set("X-Frame-Options","DENY");
		
		next();
	};
	if(!!request.user){
		//console.log("request.user",request.user.Role);//,JSON.stringify(request.user)
		if(!request.cookies.session || !request.cookies.user){
			response.clearCookie("user");
			response.clearCookie("session");
		}else{
			request.session.cookie.maxAge=sessionTime;
			response.cookie("user",request.cookies.user,{httpOnly:false,maxAge:sessionTime});
		}
		check();
	}else{
		//console.log("request.user false");
		response.clearCookie("user");
		response.clearCookie("session");
		check();
	}
});

app.use("/",router);
app.use(compression({filter:compressFilter,level:9,memLevel:9}));
app.use(express.static(__dirname+"/../public",{"index":"main.html",setHeaders:function(response,path,stat){
	if(path==="/"){
		path="/main.html";
		response.type(mime.lookup(path)+"; charset=utf-8");
	}
}}));

router.param("p1",function(request,response,next,p1){
	//console.log('router.param(p1)'+p1);
	request.p1=p1;
	next();
});

router.param("p2",function(request,response,next,p2){
	//console.log('router.param(p2)'+p2);
	request.p2=p2;
	next();
});

router.route("/login")
.post(function(request,response,next){
	console.log("login>>>request.query",request.query,"request.body",request.body);
	if(!request.body.email || !request.body.password){response.status(405);response.end("error - empty fields");}
	else if(!/^[a-z0-9._-]{1,50}@[a-z0-9_-]{1,50}\.[a-z.]{2,10}$/.test(request.body.email)
		|| !/^[áàãâäéèêëíìîïóòõôöúùûüÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÖÔÚÙÛÜÝýỲỳŶŷŸÿỸỹçÇñÑa-zA-Z0-9.:,;_@·#$~%&¬\/=*+-?¿¡!^<>\s]{4,20}$/.test(request.body.password)){response.status(405);response.end("error - incorrect fields");}
	else{
		passport.authenticate("local",function(error,user){
			//console.log("passportuser",user);
			if(!user){
				response.json({msg:error.message,correcto:false});
			}else{
				request.login(user,function(error2){
					if(error2) response.json({msg:JSON.stringify(error2),correcto:false});
					else{
						//setTimeout(function(){console.log("\n\n\n\n\n\nmaxAge "+sessionTime)},sessionTime-15000);
						//user.password=null;
						let User=database.Parse.Object.extend("_User");
						let queryDb=new database.Parse.Query(User);
						queryDb.get(user.id,{useMasterKey:true})
						.then(function(item){
							//console.log("item",item);
							item=JSON.parse(JSON.stringify(item));
							item.ACL=undefined;
							//item.objectId=undefined;
							item.emailVerificationToken=undefined;
							item.passwordResetToken=undefined;
							item.passwordResetTokenExpiration=undefined;
							response.cookie("user",JSON.stringify(item),{httpOnly:false,maxAge:sessionTime});
							response.json({msg:JSON.stringify(item),correcto:true});
						},function(error3){sendError(error3,request,response)});
					}
				});
			}
		})(request,response,next);
	}
});

router.route("/logout")
.post(function(request,response,next){
	console.log("logout",request.session.id,request.user.email);
	if(!request.user){
		response.status(401);
		response.set("WWW-Authenticate",'Commonauth realm="common", title="Login to /"');
		request.url="/main.html";
		next();
	}else{
		request.logout();
		sessionStore.destroy(request.session.id,function(error){
			if(error) sendError({"error sessionStore.destroy.":error},request,response);
			else{
				request.session.destroy(function(error2){
					if(error2) sendError({"error request.session.destroy.":error2},request,response);
					else{
						response.clearCookie("session");
						response.clearCookie("user");
						response.end();
					}
				});
			}
		});
	}
});

router.route("/admin/:p1*")//:p1 *
.all(function(request,response,next){
	//console.log("router.route('/intranet/:p1*')",request.user,request.p1);
	if(!request.user){
		response.status(401);
		response.set("WWW-Authenticate",'Adminauth realm="admin", title="Login to /"');
		request.url="/main.html";
		next();
	}else if(request.user.type!=="admin"){
		response.status(403);
		request.url="/main.html";
		next();
	}else{
		switch(true){
			case(/posts/.test(request.p1)):
				if((request.url==="/admin/posts" || request.url==="/admin/posts/") && (!request.get("referer") || !!request.get("Upgrade-Insecure-Requests"))) request.url="/main.html";
				next();
				break;
			case(/categories/.test(request.p1)):
				//console.log("\n\n\nupgrade-insecure-requests",request.get("Upgrade-Insecure-Requests"),"\nreferrer",request.get("referer"));
				if((request.url==="/admin/categories" || request.url==="/admin/categories/") && (!request.get("referer") || !!request.get("Upgrade-Insecure-Requests"))) request.url="/main.html";// request.get("referer")==""      !!request.get("Upgrade-Insecure-Requests")
				next();
				break;
			case(/editpost/.test(request.p1)):
				if((request.url==="/admin/editpost" || request.url==="/admin/editpost/") && (!request.get("referer") || !!request.get("Upgrade-Insecure-Requests"))) request.url="/main.html";
				next();
				break;
			case(/editcategories/.test(request.p1)):
				if((request.url==="/admin/editcategories" || request.url==="/admin/editcategories/") && (!request.get("referer") || !!request.get("Upgrade-Insecure-Requests"))) request.url="/main.html";
				next();
				break;
			default:
				next();
				break;
		}
	}
});

router.route("/admin/ckeditorphotos")
.get(function(request,response){
	console.log("ckeditorphotos>>>","request.query",request.query,"request.body",request.body,request.user.email);
	let Page=database.Parse.Object.extend("Page");
	let queryDb=new database.Parse.Query(Page);
	queryDb.get(request.query.page,{useMasterKey:true})
	.then(function(item){
		let Photo=database.Parse.Object.extend("Photo");
		let queryDb=new database.Parse.Query(Photo);
		queryDb.equalTo("page",item);
		queryDb.find({useMasterKey:true})
		.then(function(items){
			items.forEach(function(element,index,array){
				array[index]={
					image:array[index].get("file")._url,
					thumb:array[index].get("file")._url,
					folder:"color"
				};
			});
			response.end(JSON.stringify(items));
		},function(error2){sendError(error2,request,response)});
	},function(error){sendError(error,request,response)});
});

router.route("/admin/ckeditorphotoupload")
.post(function(request,response){
	console.log("ckeditorphotoupload>>>","request.query",request.query,"request.body",request.body,request.user.email);
	ckeditoruploadUpload(request,response,function(error){
		response.removeHeader("X-Frame-Options");
		response.set("Content-Type","text/html");
		if(error) response.end('<script type="text/javascript">window.parent.CKEDITOR.tools.callFunction("'+request.query.CKEditorFuncNum+'", "", "'+error+'");</script>');
		else{
			console.log("ckeditorphotoupload>>>","request.query",request.query,"request.body",request.body,request.user.email);
			let Page=database.Parse.Object.extend("Page");
			let queryDb=new database.Parse.Query(Page);
			queryDb.get(request.query.page,{useMasterKey:true})
			.then(function(item){
				let Photo=database.Parse.Object.extend("Photo");
				let photo=new Photo();
				let file=new database.Parse.File(request.file.originalname,{base64:request.file.buffer.toString("base64")},request.file.mimetype);
				photo.set("file",file);
				photo.set("page",item);
				photo.save(null,{useMasterKey:true})
				.then(function(item2){
					//response.end(JSON.stringify({uploaded:1,fileName:item2.get("file")._name,url:encodeURI(item2.get("file")._url)}));
					response.end('<script type="text/javascript">window.parent.CKEDITOR.tools.callFunction("'+request.query.CKEditorFuncNum+'", "'+item2.get("file")._url+'", "");</script>');
				},function(error3){response.end('<script type="text/javascript">window.parent.CKEDITOR.tools.callFunction("'+request.query.CKEditorFuncNum+'", "", "'+error3.message+'");</script>');});
			},function(error2){response.end('<script type="text/javascript">window.parent.CKEDITOR.tools.callFunction("'+request.query.CKEditorFuncNum+'", "", "'+error2.message+'");</script>');});
		}
	});
});

router.route("/admin/pageslist")
.get(function(request,response){
	console.log("pageslist>>>","request.query",request.query,"request.body",request.body);
	let Page=database.Parse.Object.extend("Page");
	let queryDb=new database.Parse.Query(Page);
	queryDb.exists("objectId");
	queryDb.ascending("order");
	queryDb.find({useMasterKey:true})
	.then(function(items){
		response.end(JSON.stringify(items));
	},function(error){sendError(error,request,response)});
});

router.route("/admin/config")
.get(function(request,response){
	console.log("config>>>","request.query",request.query,"request.body",request.body);
	let Configuration=database.Parse.Object.extend("Configuration");
	let queryDb=new database.Parse.Query(Configuration);
	queryDb.exists("objectId");
	queryDb.first({useMasterKey:true})
	.then(function(item){
		if(!item){
			response.status(405);response.end("error - item no encontrado");
		}else{
			response.end(JSON.stringify(item));
		}
	},function(error){sendError(error,request,response)});
})
.put(function(request,response){
	console.log("config>>>","request.query",request.query,"request.body",request.body);
	if(!request.body.email
		|| !request.body.telefonos
		|| !request.body.direccion){response.status(405);response.end("error - campos vacios");}
	else{
		let Configuration=database.Parse.Object.extend("Configuration");
		let queryDb=new database.Parse.Query(Configuration);
		queryDb.exists("objectId");
		queryDb.first({useMasterKey:true})
		.then(function(item){
			item.set("email",request.body.email);
			item.set("telefonos",request.body.telefonos);
			item.set("direccion",request.body.direccion);
			item.set("facebookLink",request.body.facebookLink);
			item.set("twitterLink",request.body.twitterLink);
			item.set("linkedinLink",request.body.linkedinLink);
			item.save(null,{useMasterKey:true})
			.then(function(item2){
				response.end("ok");
			},function(error2){sendError(error2,request,response)});
		},function(error){sendError(error,request,response)});
	}
});

router.route("/admin/page")
.get(function(request,response){
	console.log("page>>>","request.query",request.query,"request.body",request.body);
	if(!request.query.page){response.status(405);response.end("error - campos vacios");}
	else{
		let Page=database.Parse.Object.extend("Page");
		let queryDb=new database.Parse.Query(Page);
		queryDb.equalTo("url",request.query.page);
		queryDb.first({useMasterKey:true})
		.then(function(item){
			console.log("item",item);
			if(!item){
				response.status(405);response.end("error - pagina no encontrada");
			}else{
				response.end(JSON.stringify(item));
			}
		},function(error){sendError(error,request,response)});
	}
})
.put(function(request,response){
	console.log("page>>>","request.query",request.query,"request.body",request.body);
	if(!request.body.objectId
		|| !request.body.esTitle
		|| !request.body.enTitle
		|| !request.body.esHtml
		|| !request.body.enHtml
		|| !request.body.esSeoDescription
		|| !request.body.enSeoDescription
		|| !request.body.esSeoKeywords
		|| !request.body.enSeoKeywords){response.status(405);response.end("error - campos vacios");}
	else{
		let Page=database.Parse.Object.extend("Page");
		let queryDb=new database.Parse.Query(Page);
		queryDb.get(request.body.objectId,{useMasterKey:true})
		.then(function(item){
			item.set("esTitle",request.body.esTitle);
			item.set("enTitle",request.body.enTitle);
			item.set("esHtml",request.body.esHtml);
			item.set("enHtml",request.body.enHtml);
			if(!!request.body.esSeoTitle){
				item.set("esSeoTitle",request.body.esSeoTitle);
			}else{
				item.set("esSeoTitle",request.body.esTitle);
			}
			if(!!request.body.enSeoTitle){
				item.set("enSeoTitle",request.body.enSeoTitle);
			}else{
				item.set("enSeoTitle",request.body.enTitle);
			}
			item.set("esSeoDescription",request.body.esSeoDescription);
			item.set("enSeoDescription",request.body.enSeoDescription);
			item.set("esSeoKeywords",request.body.esSeoKeywords);
			item.set("enSeoKeywords",request.body.enSeoKeywords);
			item.save(null,{useMasterKey:true})
			.then(function(item2){
				response.end("ok");
			},function(error2){sendError(error2,request,response)});
		},function(error){sendError(error,request,response)});
	}
});

router.route("/admin/teamdata")
.get(function(request,response){
	console.log("teamdata>>>","request.query",request.query,"request.body",request.body);
	let TeamMember=database.Parse.Object.extend("TeamMember");
	let queryDb=new database.Parse.Query(TeamMember);
	queryDb.exists("objectId");
	queryDb.ascending("order");
	queryDb.find({useMasterKey:true})
	.then(function(items){
		let array={};
		array.team=items.filter(function(element,index,array){return element.get("type")==="TEAM"});
		array.advisoryTeam=items.filter(function(element,index,array){return element.get("type")==="MANAGEMENT ADVISORY TEAM"});
		response.end(JSON.stringify(array));
	},function(error){sendError(error,request,response)});
});

router.route("/admin/teammember")
.put(function(request,response){
	console.log("teammember>>>","request.query",request.query,"request.body",request.body);
	if(!request.body.objectId
		|| !request.body.type
		|| !request.body.name
		|| !request.body.esPosition
		|| !request.body.enPosition
		|| !request.body.esExperience
		|| !request.body.enExperience){response.status(405);response.end("error - empty fields");}
	else{
		let TeamMember=database.Parse.Object.extend("TeamMember");
		let queryDb=new database.Parse.Query(TeamMember);
		queryDb.get(request.body.objectId,{useMasterKey:true})
		.then(function(item){
			item.set("name",request.body.name);
			item.set("esPosition",request.body.esPosition);
			item.set("enPosition",request.body.enPosition);
			item.set("esExperience",request.body.esExperience);
			item.set("enExperience",request.body.enExperience);
			item.save(null,{useMasterKey:true})
			.then(function(item2){
				response.end("ok");
			},function(error2){sendError(error2,request,response)});
		},function(error){sendError(error,request,response)});
	}
})
.post(function(request,response){
	console.log("teammember>>>","request.query",request.query,"request.body",request.body);
	if(!request.body.type
		|| !request.body.name
		|| !request.body.esPosition
		|| !request.body.enPosition
		|| !request.body.esExperience
		|| !request.body.enExperience){response.status(405);response.end("error - empty fields");}
	else{
		let TeamMember=database.Parse.Object.extend("TeamMember");
		let queryDb=new database.Parse.Query(TeamMember);
		queryDb.equalTo("type",request.body.type);
		queryDb.find({useMasterKey:true})
		.then(function(items){
			let TeamMember=database.Parse.Object.extend("TeamMember");
			let teamMember=new TeamMember();
			teamMember.set("type",request.body.type);
			teamMember.set("name",request.body.name);
			teamMember.set("esPosition",request.body.esPosition);
			teamMember.set("enPosition",request.body.enPosition);
			teamMember.set("esExperience",request.body.esExperience);
			teamMember.set("enExperience",request.body.enExperience);
			teamMember.set("order",items.length);
			teamMember.save(null,{useMasterKey:true})
			.then(function(item){
				response.end("ok");
			},function(error2){sendError(error2,request,response)});
		},function(error){sendError(error,request,response)});
	}
})
.delete(function(request,response){
	console.log("teammember>>>","request.query",request.query,"request.body",request.body);
	if(!request.body.objectId){response.status(405);response.end("error - empty fields");}
	else{
		let TeamMember=database.Parse.Object.extend("TeamMember");
		let queryDb=new database.Parse.Query(TeamMember);
		queryDb.get(request.body.objectId,{useMasterKey:true})
		.then(function(item){
			let type=item.get("type");
			item.destroy({useMasterKey:true})
			.then(function(item2){
				let TeamMember=database.Parse.Object.extend("TeamMember");
				let queryDb=new database.Parse.Query(TeamMember);
				queryDb.equalTo("type",type);
				queryDb.ascending("order");
				queryDb.find({useMasterKey:true})
				.then(function(items){
					if(items.length===0){
						response.end("ok");
					}else{
						let itemsDone=0;
						let check=function(array){
							itemsDone++;
							if(itemsDone===array.length){
								response.end("ok");
							}
						};
						items.forEach(function(element,index,array){
							element.set("order",index);
							element.save(null,{useMasterKey:true})
							.then(function(item4){
								check(array);
							},function(error4){console.log("teammembererror4",error4);check(array)});
						});
					}
				},function(error3){sendError(error3,request,response)});
			},function(error2){sendError(error2,request,response)});
		},function(error){sendError(error,request,response)});
	}
});

router.route("/admin/teammemberorder")
.put(function(request,response){
	console.log("teammemberorder>>>","request.query",request.query,"request.body",request.body);
	if(!request.body.member || request.body.order===undefined){response.status(405);response.end("error - empty fields");}
	else{
		let TeamMember=database.Parse.Object.extend("TeamMember");
		let queryDb=new database.Parse.Query(TeamMember);
		queryDb.get(request.body.member,{useMasterKey:true})
		.then(function(item){
			let TeamMember=database.Parse.Object.extend("TeamMember");
			let queryDb=new database.Parse.Query(TeamMember);
			queryDb.equalTo("type",item.get("type"));
			queryDb.find({useMasterKey:true})
			.then(function(items){
				if(request.body.order<0 || request.body.order>items.length-1){
					response.status(405);response.end("error - invalid order");
				}else{
					let itemIndex=items.findIndex(function(element,index,array){return element.id===request.body.member});
					let targetIndex=items.findIndex(function(element2,index2,array2){return element2.get("order")===request.body.order});
					let aux=items[itemIndex].get("order");
					items[itemIndex].set("order",request.body.order);
					items[itemIndex].save(null,{useMasterKey:true})
					.then(function(item){
						items[targetIndex].set("order",aux);
						items[targetIndex].save(null,{useMasterKey:true})
						.then(function(item2){
							response.end("ok");
						},function(error4){sendError(error4,request,response)});
					},function(error3){sendError(error3,request,response)});
				}
			},function(error2){sendError(error2,request,response)});
		},function(error){sendError(error,request,response)});
	}
});

router.route("/admin/teammemberphotoupload")
.put(function(request,response,next){
	console.log(">>memberphotoupload>>>request.query",request.query,"request.body",request.body);
	memberPhotoUpload(request,response,function(error){
		if(error) sendError(error,request,response);
		else{
			console.log(">>memberphotoupload>>>request.query",request.query,"request.body",request.body);
			let TeamMember=database.Parse.Object.extend("TeamMember");
			let queryDb=new database.Parse.Query(TeamMember);
			queryDb.get(request.body.member,{useMasterKey:true})
			.then(function(item){
				let file=new database.Parse.File(request.file.originalname,{base64:request.file.buffer.toString("base64")},request.file.mimetype);
				item.set("photo",file);
				item.save(null,{useMasterKey:true})
				.then(function(item2){
					response.end("ok");
				},function(error3){sendError(error3,request,response)});
			},function(error2){sendError(error2,request,response)});
		}
	});
});

router.route("/admin/indexsliderdata")
.get(function(request,response,next){
	console.log(">>indexsliderdata>>>request.query",request.query,"request.body",request.body);
	let Slide=database.Parse.Object.extend("Slide");
	let queryDb=new database.Parse.Query(Slide);
	queryDb.equalTo("slider","index");
	queryDb.descending("order");
	queryDb.find({useMasterKey:true})
	.then(function(items){
		response.end(JSON.stringify(items));
	},function(error){sendError(error,request,response)});
});

router.route("/admin/slideupload")
.put(function(request,response,next){
	console.log(">>slideupload>>>request.query",request.query,"request.body",request.body);
	slideUpload(request,response,function(error){
		if(error) sendError(error,request,response);
		else{
			console.log(">>slideupload>>>request.query",request.query,"request.body",request.body);
			if(!!request.body.slide){
				let Slide=database.Parse.Object.extend("Slide");
				let queryDb=new database.Parse.Query(Slide);
				queryDb.get(request.body.slide,{useMasterKey:true})
				.then(function(item){
					let file=new database.Parse.File(request.file.originalname,{base64:request.file.buffer.toString("base64")},request.file.mimetype);
					item.set("image",file);
					item.save(null,{useMasterKey:true})
					.then(function(item2){
						response.end("ok");
					},function(error3){sendError(error3,request,response)});
				},function(error2){sendError(error2,request,response)});
			}else{
				let Slide=database.Parse.Object.extend("Slide");
				let queryDb=new database.Parse.Query(Slide);
				queryDb.equalTo("slider","index");
				queryDb.find({useMasterKey:true})
				.then(function(items){
					let Slide=database.Parse.Object.extend("Slide");
					let slide=new Slide();
					let file=new database.Parse.File(request.file.originalname,{base64:request.file.buffer.toString("base64")},request.file.mimetype);
					slide.set("image",file);
					slide.set("esCaption",request.body.esCaption);
					slide.set("enCaption",request.body.enCaption);
					slide.set("order",items.length);
					slide.set("slider","index");
					slide.save(null,{useMasterKey:true})
					.then(function(item3){
						response.end("ok");
					},function(error5){sendError(error5,request,response)});
				},function(error4){sendError(error4,request,response)});
			}
		}
	});
});

router.route("/admin/slideorder")
.put(function(request,response){
	console.log("slideorder>>>","request.query",request.query,"request.body",request.body);
	if(!request.body.slide || request.body.order===undefined){response.status(405);response.end("error - campos vacios");}
	else{
		let Slide=database.Parse.Object.extend("Slide");
		let queryDb=new database.Parse.Query(Slide);
		queryDb.equalTo("slider","index");
		queryDb.find({useMasterKey:true})
		.then(function(items){
			if(request.body.order<0 || request.body.order>items.length-1){
				response.status(405);response.end("error - orden invalido");
			}else{
				let itemIndex=items.findIndex(function(element,index,array){return element.id===request.body.slide});
				let targetIndex=items.findIndex(function(element2,index2,array2){return element2.get("order")===request.body.order});
				let aux=items[itemIndex].get("order");
				items[itemIndex].set("order",request.body.order);
				items[itemIndex].save(null,{useMasterKey:true})
				.then(function(item){
					items[targetIndex].set("order",aux);
					items[targetIndex].save(null,{useMasterKey:true})
					.then(function(item2){
						response.end("ok");
					},function(error3){sendError(error3,request,response)});
				},function(error2){sendError(error2,request,response)});
			}
		},function(error){sendError(error,request,response)});
	}
});

router.route("/admin/slide")
.put(function(request,response){
	console.log("slide>>>","request.query",request.query,"request.body",request.body);
	if(!request.body.objectId){response.status(405);response.end("error - empty fields");}
	else{
		let Slide=database.Parse.Object.extend("Slide");
		let queryDb=new database.Parse.Query(Slide);
		queryDb.get(request.body.objectId,{useMasterKey:true})
		.then(function(item){
			item.set("esCaption",request.body.esCaption);
			item.set("enCaption",request.body.enCaption);
			item.save(null,{useMasterKey:true})
			.then(function(item2){
				response.end(item2.id);
			},function(error2){sendError(error2,request,response)});
		},function(error){sendError(error,request,response)});
	}
})
.delete(function(request,response){
	console.log("slide>>>","request.query",request.query,"request.body",request.body);
	if(!request.body.slide){response.status(405);response.end("error - empty fields");}
	else{
		let Slide=database.Parse.Object.extend("Slide");
		let queryDb=new database.Parse.Query(Slide);
		queryDb.get(request.body.slide,{useMasterKey:true})
		.then(function(item){
			item.destroy({useMasterKey:true})
			.then(function(item2){
				let Slide=database.Parse.Object.extend("Slide");
				let queryDb=new database.Parse.Query(Slide);
				queryDb.equalTo("slider","index");
				queryDb.ascending("order");
				queryDb.find({useMasterKey:true})
				.then(function(items){
					if(items.length===0){
						response.end("ok");
					}else{
						let itemsDone=0;
						let check=function(array){
							itemsDone++;
							if(itemsDone===array.length){
								response.end("ok");
							}
						};
						items.forEach(function(element,index,array){
							element.set("order",index);
							element.save(null,{useMasterKey:true})
							.then(function(item4){
								check(array);
							},function(error4){console.log("slideerror4",error4);check(array)});
						});
					}
				},function(error3){sendError(error3,request,response)});
			},function(error2){sendError(error2,request,response)});
		},function(error){sendError(error,request,response)});
	}
});





























router.route("*")
.post(function(request,response,next){
	console.log("router.route(*)");
	if(response.statusCode===403){
		response.end("error - 403 Forbidden");
	}else if(response.statusCode===401){
		response.end("error - 401 Unauthorized");
	}else{
		response.status(405);
		response.end("error - 405 Method not allowed");
	}
})
.put(function(request,response,next){
	console.log("router.route(*)");
	if(response.statusCode===403){
		response.end("error - 403 Forbidden");
	}else if(response.statusCode===401){
		response.end("error - 401 Unauthorized");
	}else{
		response.status(405);
		response.end("error - 405 Method not allowed");
	}
})
.delete(function(request,response,next){
	console.log("router.route(*)");
	if(response.statusCode===403){
		response.end("error - 403 Forbidden");
	}else if(response.statusCode===401){
		response.end("error - 401 Unauthorized");
	}else{
		response.status(405);
		response.end("error - 405 Method not allowed");
	}
})
.options(function(request,response,next){
	response.set("Access-Control-Allow-Methods","HEAD,GET,POST,PUT,DELETE,OPTIONS");
	response.set("Allow","HEAD,GET,POST,PUT,DELETE,OPTIONS");
	response.set("Access-Control-Max-Age","1728000");//20dias
	response.status(200);
	response.end();
});

app.get("*",function(request,response){
	response.status(404);
	let options={root:"./public/",dotfiles:"deny",headers:{}};
	response.type("text/html; charset=utf-8");
	response.sendFile("main.html",options,function(err){
		if(err) sendError({"error response.sendFile.":err},request,response);
	});
});
