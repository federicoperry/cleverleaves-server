(function(){
	var app=angular.module("cleverleaves-cms");
	
	app.controller("404errorController",function($scope,$rootScope,Page){
		Page.setTitle("Error - Page not found - Clever Leaves CMS");
		
		$scope.$on("$destroy",function(){
			
		});
		
	});
}());
