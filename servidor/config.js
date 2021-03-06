module.exports={
	production:true,
	webServerEndPointURL:"https://cleverleaves-server.herokuapp.com",
	webServerEndPointPort:8091,
	parseServerEndPointURL:"https://cleverleaves-server.herokuapp.com",
	parseAppId:"cleverleaves",
	parseMaserKey:"1234",
	expressSessionTime:365*24*60*60*1000,
	serverSecretKey1:"isadbf8734qgho3q4hfoq39f4hqfh0q37fuhauiosdfj90q87rhf",
	appVersion:"0.1.1",
	prerenderURL:"https://prerender-server-moadw.herokuapp.com/",
	mongoDatabaseURL:"mongodb://root:root@ds161018.mlab.com:61018/cleverleaves",
	mandrillKey:"A-_lGAmDlLxI1NlrPBevJg",
	appConfig:{
		validation:{
			fieldRegExp:{
				name:/^[áàãâäéèêëíìîïóòõôöúùûüÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÖÔÚÙÛÜÝýỲỳŶŷŸÿỸỹçÇñÑa-zA-Z\s]{1,80}$/,
				email:/^[a-z0-9._-]{1,50}@[a-z0-9_-]{1,50}\.[a-z.]{2,10}$/,
				password:/^[áàãâäéèêëíìîïóòõôöúùûüÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÖÔÚÙÛÜÝýỲỳŶŷŸÿỸỹçÇñÑa-zA-Z0-9.,;_·#$~%&¬=*+-?¿¡!^<>\s]{4,20}$/,
				birthdate:/^[0-9]{2}-[0-9]{2}-[0-9]{4}$/
			},
			maxUploadSize:2000000
		},
	}
};
