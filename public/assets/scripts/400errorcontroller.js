(function(){
	var app=angular.module("cleverleaves-cms");
	
	app.controller("400errorController",function($scope,$rootScope,Page,$location,$cookies){
		
		//$scope.location=$location;
		//$scope.message=$cookies.get("msg").split("_")[1];
		//$scope.status=$cookies.get("msg").split("_")[0];
		$scope.message=$location.hash().split("_")[1] || "BAD REQUEST";
		$scope.status=$location.hash().split("_")[0] || "400 BAD REQUEST";
		Page.setTitle("Error - "+$scope.message+" - Clever Leaves CMS");
		
		$scope.$on("$destroy",function(){
			
		});
	});
}());