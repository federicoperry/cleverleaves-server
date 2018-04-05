let Parse=require("parse/node").Parse,
config=require("./config"),
ParseServer=require("parse-server").ParseServer;

let api=new ParseServer({
	verbose:false,
	databaseURI:config.mongoDatabaseURL,
	appId:config.parseAppId,
	masterKey:config.parseMaserKey,
	serverURL:config.parseServerEndPointURL+"/api",
	/*liveQuery:{
	 classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
	 },*/
	maxUploadSize:"500mb",
	logLevel:"warn"
});

Parse.initialize(config.parseAppId,"",config.parseMaserKey);

exports.api=api;
exports.Parse=Parse;