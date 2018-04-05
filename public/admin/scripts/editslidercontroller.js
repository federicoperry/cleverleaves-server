(function(){
	let app=angular.module("cleverleaves-cms");
	
	app.controller("editSliderController",function($scope,$rootScope,$interval,$http,Page,$location,$window,$ocLazyLoad,$timeout,$anchorScroll,Upload,$route){
		console.log("app.editSliderController");
		$window.scrollTo(0,0);
		Page.setTitle("Edit Slider - Clever Leaves CMS");
		$scope.submitButtonActive=true;
		$scope.crudform={};
		$scope.selectedLanguage="es";
		$rootScope.sidemenuSelected="slider";
		$scope.slideDisabled=false;
		$scope.sliderData=undefined;
		
		$scope.getSliderData=function(){
			let dataSuccess=function(response){
				$scope.sliderData=response.data;
				$scope.sliderData.forEach(function(element,index,array){
					if(!!array[index].objectId){
						array[index].order=array[index].order+1;
					}
				});
				$scope.slideDisabled=false;
				$scope.submitButtonActive=true;
			};
			let dataError=function(response){
				console.log(response);
				$scope.slideDisabled=false;
			};
			$http({
				method:"GET",
				url:"./admin/indexsliderdata",
				params:{}
			}).then(dataSuccess,dataError);
		};
		$scope.getSliderData();
		
		$scope.addSlide=function(index){
			if($scope.sliderData.length>0){
				if(!!$scope.sliderData[0].order || !!$scope.sliderData[0].image){
					$scope.sliderData.unshift({});
				}
			}else{
				$scope.sliderData.unshift({});
			}
		};
		
		$scope.saveSlide=function(index){
			if($scope.submitButtonActive){
				$scope.submitButtonActive=false;
				let dataSuccess=function(response){
					$scope.getSliderData();
					$window.alert("datos guardados");
				};
				let dataError=function(response){
					console.log(response);
					$window.alert(response.data);
					$scope.submitButtonActive=true;
				};
				$http({
					method:"PUT",
					url:"./admin/slide",
					data:{
						objectId:$scope.sliderData[index].objectId,
						esCaption:$scope.sliderData[index].esCaption,
						enCaption:$scope.sliderData[index].enCaption,
					}
				}).then(dataSuccess,dataError);
			}
		};
		
		$scope.deleteSlide=function(index){
			if($scope.submitButtonActive){
				if($window.confirm("borrar imagen?")){
					$scope.submitButtonActive=false;
					let dataSuccess=function(response){
						$scope.getSliderData();
					};
					let dataError=function(response){
						console.log(response);
						$scope.submitButtonActive=true;
					};
					$http({
						method:"DELETE",
						url:"./admin/slide",
						data:{slide:$scope.sliderData[index].objectId},
						headers:{"Content-Type":"application/json;charset=utf-8"}
					}).then(dataSuccess,dataError);
				}
			}
		};
		
		$scope.slideOrderChanged=function(index,event){
			if($scope.submitButtonActive){
				if(event.keyCode==13 || (event.type=="blur" && index+1!=$scope.sliderData[index].order)){
					$scope.submitButtonActive=false;
					$scope.slideDisabled=true;
					let dataSuccess=function(response){
						//$window.alert("data saved");
						console.log(response);
						$scope.getSliderData();
					};
					let dataError=function(response){
						console.log(response);
						$scope.getSliderData();
					};
					$http({
						method:"PUT",
						url:"./admin/slideorder",
						data:{slide:$scope.sliderData[index].objectId,order:$scope.sliderData[index].order-1}
					}).then(dataSuccess,dataError);
				}
			}
		};
		
		$scope.slideUpload=function(index){
			if($scope.submitButtonActive){
				$scope.submitButtonActive=false;
				if($scope.crudform["slideUploadFile"+index].$valid && !!$scope.sliderData[index].slideUploadFile){//
					//console.log("ok");
					let reqData={};
					if(!$scope.sliderData[index].objectId){
						reqData={
							esCaption:$scope.sliderData[index].esCaption,
							enCaption:$scope.sliderData[index].enCaption,
							file:$scope.sliderData[index].slideUploadFile
						}
					}else{
						reqData={
							slide:$scope.sliderData[index].objectId,
							file:$scope.sliderData[index].slideUploadFile
						}
					}
					Upload.upload({
						url:"./admin/slideupload",//+"&var="+$scope.var
						method:"PUT",
						data:reqData
					}).then(function(response){
						$scope.submitButtonActive=true;
						Page.setTitle("Edit Slider - Clever Leaves CMS");
						$scope.getSliderData();
					},function(response){
						console.log("error",response);
						$window.alert(response.data);
						$scope.submitButtonActive=true;
						Page.setTitle("Edit Slider - Clever Leaves CMS");
					},function(evt){
						let progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
						Page.setTitle("Uploading "+progressPercentage+"% - Clever Leaves CMS");
					});
				}else{
					$scope.submitButtonActive=true;
				}
			}
		};
		
		$scope.$on("$destroy",function(){
			//$scope.dateWatcher();
		});
		
		console.log("app.editSliderController.end");
	});
	
}());