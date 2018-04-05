(function(){
	var app=angular.module("cleverleaves-cms");
	
	app.controller("indexController",function($rootScope,$scope,Page,$window,$http,$location){
		console.log("app.indexController");
		Page.setTitle("Login - Clever Leaves CMS");
		$window.scrollTo(0,0);
		$scope.submitButtonActive=true;
		
		$scope.login=function(){
			//console.log($scope.loginEmail,$scope.loginPassword);
			if($scope.submitButtonActive){
				$scope.submitButtonActive=false;
				var loginSuccess=function(response){
					//console.log(response.data);
					$scope.submitButtonActive=true;
					if(response.status==200){
						if(response.data.correcto){
							$rootScope.user=JSON.parse(response.data.msg);
							$location.url("/admin");
						}else{
							$window.alert(response.data.msg)
						}
					}
				};
				var loginError=function(response){
					$window.alert(response.data);
					$scope.submitButtonActive=true;
				};
				$http({
					method:"POST",
					url:"./login",
					data:{"email":$scope.loginEmail,"password":$scope.loginPassword}
					//,headers: {'Content-Type': 'application/x-www-form-urlencoded'}
				}).then(loginSuccess,loginError);
			}
		};
		
		$scope.logout=function(){
			if($scope.submitButtonActive){
				var logoutSuccess=function(response){
					console.log(response);
					$scope.submitButtonActive=true;
					if(response.status==200){
						$window.location.href="/";
					}
				};
				var logoutError=function(response){
					console.log("logouterror"+JSON.stringify(arguments));
					$scope.submitButtonActive=true;
				};
				$http({
					method:"POST",
					url:"./logout"
				}).then(logoutSuccess,logoutError);
			}
		};
		
		
		
		$scope.$on("$destroy",function(){
			
		});
		
		console.log("app.indexController.end");
	});
	
	
}());


