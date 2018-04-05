window.onerror=function(){//errorMsg, url, lineNumber, column, errorObj
	//alert(JSON.stringify(arguments));
};

window.onload=function(){
	
};

(function(){
	let app=angular.module("cleverleaves-cms",["ngRoute","ngSanitize","vjs.video","angular-p5","oc.lazyLoad","720kb.socialshare","ngCookies","ngTagsInput","720kb.datepicker","ngFileUpload","ckeditor"]);//,'ngDisqus','djds4rce.angular-socialshare',"ezfb"
	app.config(function($routeProvider,$locationProvider,$ocLazyLoadProvider,socialshareConfProvider){//,$disqusProvider,ezfbProvider
		console.log("app.config");
	  socialshareConfProvider.configure([
	    {
	      "provider":"twitter",
	      "conf":{
	        "trigger":"click",
	        "popupHeight":600,
	        "popupWidth":600
	      }
	    },
	    {
	      "provider":"facebook",
	      "conf":{
	        "trigger":"click",
	        "popupHeight":600,
	        "popupWidth":600
	      }
	    }
	  ]);
		$locationProvider.html5Mode(true);
		$ocLazyLoadProvider.config({
			debug:true,
			events:true
		});
		$routeProvider
			.when("/",{templateUrl:"./templates/index.html",controller:"indexController"})
			.when("/index",{templateUrl:"./templates/index.html",controller:"indexController"})
			.when("/error",{templateUrl:"./templates/secondary/400error.html",controller:"400errorController"})
			.when("/admin",{templateUrl:"./templates/admin.html",controller:"adminController"})
			.when("/admin/:p1",{templateUrl:"./templates/admin.html",controller:"adminController"})
			.otherwise({templateUrl:"./templates/secondary/404error.html",controller:"404errorController"});
		console.log("app.config.end");
		
	});
	
	app.run(function($rootScope,$http,Page,$cookies,$timeout,$route){
		console.log("app.run");
		Page.setTitle("Clever Leaves CMS");
		$rootScope.sidemenuSelected="";
		
		$rootScope.checkSession=function(){
			if(!!$cookies.get("session")) return true;
			else return false;
		};
		if(!!$cookies.get("user")){
			$rootScope.user=JSON.parse($cookies.get("user"));
		}
		
		$rootScope.reload=function(){
			$timeout(function(){$route.reload();},800);
		};
		
		let dataSuccess=function(response){
			$rootScope.pagesList=response.data;
		};
		let dataError=function(response){
			console.log(response);
		};
		$http({
			method:"GET",
			url:"./admin/pageslist",
			params:{}
		}).then(dataSuccess,dataError);
		
		console.log("app.run.end");
	});
	
	app.controller("appController",function($scope,$rootScope){
		console.log("app.appController");
		
		$scope.onload=function(){
			//console.log("$scope.onload");
		};
		
		$scope.$on("$destroy",function(){
			
		});

		console.log("app.appController.end");
	});
	
	app.controller("appHeadCtrl",["$scope","Page",function($scope,Page){
		console.log("app.appHeadCtrl");
		$scope.Page=Page;

		$scope.$on("$destroy",function(){
			
		});
		console.log("app.appHeadCtrl.end");
	}]);

	app.controller("sliderController",function($scope,$rootScope,$window,$location,$timeout,p5){
		console.log("app.sliderController");
		$scope.$on("$destroy",function(){
			
		});
		console.log("app.sliderController.end");
	});
	
	app.controller('CkeditorCtrl',['$scope',function($scope){
		console.log("app.CkeditorCtrl");
		
		$scope.options={
			language:"es",
			height:450,
			allowedContent:true,
			entities:false,
			contentsCss:"https://cleverleaves.herokuapp.com/assets/css/layout.css",
			extraPlugins:"imagebrowser,codemirror",
			filebrowserUploadUrl:"/admin/ckeditorphotoupload?page="+$scope.$parent.page.objectId,
			imageBrowser_listUrl:"/admin/ckeditorphotos?page="+$scope.$parent.page.objectId,
			codemirror:{
				theme:"default",
				lineNumbers:true,
				matchBrackets:true,
				highlightMatches:true,
				styleActiveLine:true
			}
		};
		
		$scope.onReady=function(){
			console.log("ckeditorready");
		};
		
		$scope.$on("$destroy",function(){
			for(let i=0;i<Object.keys(CKEDITOR.instances).length;i++){
				CKEDITOR.instances[Object.keys(CKEDITOR.instances)[i]].destroy();
			}
		});
		
		console.log("app.CkeditorCtrl.end");
	}]);
	
	app.factory("Page",function(){
		let title="Clever Leaves CMS";
		return{
			title:function(){return title;},
			setTitle:function(newTitle){title=newTitle;}
		};
	});

	app.filter("to_trusted",["$sce",function($sce){
		return function(text){
			return $sce.trustAsHtml(text);
		};
	}]);

	app.filter("to_trusted_url",["$sce",function($sce){
		return function(text){
			return $sce.trustAsResourceUrl(text);
		};
	}]);
	
}());

