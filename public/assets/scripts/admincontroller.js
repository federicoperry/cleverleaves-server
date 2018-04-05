(function(){
	let app=angular.module("cleverleaves-cms");
	
	app.controller("adminController",function($scope,$rootScope,$http,$window,$routeParams,$location,$anchorScroll,$timeout,$cookies,$ocLazyLoad,Page){
		console.log("app.adminController");
		$window.scrollTo(0,0);
		$scope.routeParams=[];
		//$scope.netError=false;
		let link="";
		for(let i=0;i<Object.keys($routeParams).length;i++){
			link=link+"/"+$routeParams[Object.keys($routeParams)[i]];
			$scope.routeParams[i]={"link":link.slice(1,link.length),"text":$routeParams[Object.keys($routeParams)[i]]}
		}
		//console.log($routeParams,$rootScope.checkSession(),$rootScope.user);
		
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
		
		let headError=function(response){
			console.log("headError");
			if(response.status===404){
				$scope.adminTemplate="./templates/secondary/404error.html";
				Page.setTitle("Page not found - 404 error - Clever Leaves CMS");
			}else if(response.status===403){
				$scope.adminTemplate="./templates/secondary/403error.html";
				Page.setTitle("Permission required - 403 error - Clever Leaves CMS");
			}else if(response.status===401){
				//$scope.studentTemplate="./templates/secondary/401error.html";
				//Page.setTitle('Authentication required - 401 error - Deedly');
				$location.url("/");
			}else if(response.status===500){
				$scope.error=response.data;
				$scope.adminTemplate="./templates/secondary/500error.html";
				Page.setTitle("Server error - 500 error - Clever Leaves CMS");
			}
			else if(response.status===400){
				$scope.adminTemplate="./templates/secondary/400error.html";
				$scope.location=$location;
				$location.hash(response.data);
				$scope.message=$cookies.get("msg");
				let title=$scope.location.hash() || $scope.message || "BAD REQUEST";
				Page.setTitle("Error - "+title+" - Clever Leaves CMS");
			}else{
				Page.setTitle("Network Error - Clever Leaves CMS");
				//angular.element($("#content")).html("<div style='overflow:auto'><h1 style='color:red'>NETWORK ERROR</h1>"+JSON.stringify(response)+"</div>");
				console.log("network-error",$routeParams,$location.url());
			}
		};
		if(!!$routeParams.p2){///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			//Page.setTitle($routeParams.p2+' - Deedly');
			let headSuccessP2=function(response){
				$scope.adminTemplate="./admin/"+$routeParams.p1+"/templates/"+$routeParams.p2+".html";
			};
			$http({
				method:"HEAD",
				url:"./admin/"+$routeParams.p1+"/templates/"+$routeParams.p2+".html",
				//,headers:{'Content-Type':'application/x-www-form-urlencoded'}
			}).then(headSuccessP2,headError);
		}else if(!!$routeParams.p1){///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			//Page.setTitle($routeParams.p1+' - Deedly');
			let path="";
			let headErrorP1=function(response){
				//console.log("headErrorP1");
				path="./admin/"+$routeParams.p1+"/";
				$http({
					method:"HEAD",
					url:path
				}).then(headSuccessP1,headError);
			};
			let headSuccessP1=function(response){
				//console.log("headSuccessP1");
				$scope.adminTemplate=path;//"./intranet/templates/"+$routeParams.p1+".html"
			};
			path="./admin/templates/"+$routeParams.p1+".html";
			$http({
				method:"HEAD",
				url:path
			}).then(headSuccessP1,headErrorP1);
		}else{///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			Page.setTitle("Admin - Clever Leaves CMS");
			let headSuccessP0=function(response){
				$scope.adminTemplate="./admin/main.html";
			};
			$http({
				method:"HEAD",
				url:"./admin/main.html"
				//,headers:{'Content-Type':'application/x-www-form-urlencoded'}
			}).then(headSuccessP0,headError);
		}
		
		
		$scope.$on("$destroy",function(){
			
		});
		
		
		
		//if(!$routeParams.p1) $routeParams.p1="main";
		//$scope.proyectosycapacitacionTemplate="./proyectosycapacitacion/"+$rootScope.proyectosycapacitacionTabSelected+".html";
		
		
		
		console.log("app.adminController.end");
	});
	
	
}());