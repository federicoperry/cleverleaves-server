(function(){
	let app=angular.module("cleverleaves-cms");
	
	app.controller("editPageController",function($scope,$rootScope,$interval,$http,Page,$location,$window,$ocLazyLoad,$timeout,$anchorScroll,Upload,$route){
		console.log("app.editPageController");
		$window.scrollTo(0,0);
		Page.setTitle("Edit page - Clever Leaves CMS");
		$scope.page=undefined;
		$scope.submitButtonActive=true;
		$scope.crudform={};
		$scope.selectedLanguage="es";
		$scope.memberHovered=undefined;
		$scope.config=undefined;
		$scope.team=undefined;
		$scope.memberDisabled=false;
		$scope.pageChanged=false;
		$scope.pageWatch=undefined;
		$scope.configWatch=undefined;
		
		if($location.hash()==""){
			$scope.selectedTab="detailstab";
		}else{
			$scope.selectedTab=$location.hash();
		}
		
		$scope.$on("$locationChangeStart",function(event,next,current){
			//console.log("$locationChangeStart",arguments,next.split("#"));
			if($scope.pageChanged && !next.split("#")[1]){
				if(!$window.confirm("Se han hecho cambios, desea continuar?")){
					event.preventDefault();
				}
			}
		});
		
		$window.onbeforeunload=function(){
			console.log("onbeforeunload",arguments,$scope.pageChanged);
			if($scope.pageChanged){
				return "Se han hecho cambios, desea continuar?";
			}
		};
		
		let lastRoute=$route.current;
		$scope.$on("$locationChangeSuccess",function(event,next,current){
			if(!!next.split("#")[1]){
				$route.current=lastRoute;
			}
		});
		
		$scope.getPage=function(){
			if(!$location.search().id){
				$scope.page={};
				if(!!$scope.pageWatch) $scope.pageWatch();
				let initializing=true;
				$scope.pageWatch=$scope.$watch("page",function(newValue,oldValue,scope){
					if(initializing){
						$timeout(function(){initializing=false;});
					}else{
						$scope.pageChanged=true;
					}
				},true);
			}else{
				let dataSuccess=function(response){
					$rootScope.pagesList=response.data;
					$scope.page=$rootScope.pagesList.find(function(element,index,array){return element.url==$location.search().id});
					$rootScope.sidemenuSelected=$scope.page.url;
					if(!!$scope.pageWatch) $scope.pageWatch();
					let initializing=true;
					$scope.pageWatch=$scope.$watch("page",function(newValue,oldValue,scope){
						if(initializing){
							$timeout(function(){initializing=false;});
						}else{
							$scope.pageChanged=true;
						}
					},true);
					if($location.search().id=="contact") $scope.getConfig();
					if($location.search().id=="about") $scope.getTeam();
				};
				let dataError=function(response){
					console.log(response);
				};
				$http({
					method:"GET",
					url:"./admin/pageslist",
					params:{}
				}).then(dataSuccess,dataError);
			}
		};
		$scope.getPage();
		
		$scope.getConfig=function(){
			let dataSuccess=function(response){
				$scope.config=response.data;
				if(!!$scope.configWatch) $scope.configWatch();
				let initializing=true;
				$scope.configWatch=$scope.$watch("config",function(newValue,oldValue,scope){
					if(initializing){
						$timeout(function(){initializing=false;});
					}else{
						$scope.pageChanged=true;
					}
				},true);
			};
			let dataError=function(response){
				console.log(response);
			};
			$http({
				method:"GET",
				url:"./admin/config",
				params:{}
			}).then(dataSuccess,dataError);
		};
		
		$scope.getTeam=function(){
			let dataSuccess=function(response){
				$scope.team=response.data;
				$scope.team.team.forEach(function(element,index,array){
					array[index].order=array[index].order+1;
				});
				$scope.team.advisoryTeam.forEach(function(element,index,array){
					array[index].order=array[index].order+1;
				});
				$scope.submitButtonActive=true;
				$scope.memberDisabled=false;
			};
			let dataError=function(response){
				console.log(response);
				$scope.submitButtonActive=true;
				$scope.memberDisabled=false;
			};
			$http({
				method:"GET",
				url:"./admin/teamdata",
				params:{}
			}).then(dataSuccess,dataError);
		};
		
		$scope.selectTab=function(tab){
			//console.log(tab,$scope.post);
			$scope.selectedTab=tab;
			$location.hash(tab);
		};
		
		$scope.hoverMember=function(member){
			$scope.memberHovered=member;
		};
		
		$scope.addMember=function(type){
			if(!!$scope.team[type].length>0){
				if(!!$scope.team[type][$scope.team[type].length-1].name){
					$scope.team[type].push({});
				}
			}else{
				$scope.team[type].push({});
			}
		};
		
		$scope.savePage=function(){
			console.log("savepage",$scope.page);
			if($scope.submitButtonActive){
				$scope.submitButtonActive=false;
				let dataSuccess=function(response){
					if($scope.page.url=="contact"){
						let dataSuccess=function(response){
							//$window.location.reload();
							$scope.getPage();
							$scope.submitButtonActive=true;
							$scope.pageChanged=false;
							$window.alert("datos guardados");
						};
						let dataError=function(response){
							console.log(response);
							$window.alert(response.data);
							$scope.submitButtonActive=true;
						};
						$http({
							method:"PUT",
							url:"./admin/config",
							data:{
								email:$scope.config.email,
								telefonos:$scope.config.telefonos,
								direccion:$scope.config.direccion,
								facebookLink:$scope.config.facebookLink,
								twitterLink:$scope.config.twitterLink,
								linkedinLink:$scope.config.linkedinLink
							}
						}).then(dataSuccess,dataError);
					}else{
						//$window.location.reload();
						$scope.getPage();
						$scope.submitButtonActive=true;
						$scope.pageChanged=false;
						$window.alert("datos guardados");
					}
				};
				let dataError=function(response){
					console.log(response);
					$window.alert(response.data);
					$scope.submitButtonActive=true;
					
				};
				$http({
					method:"PUT",
					url:"./admin/page",
					data:{
						objectId:$scope.page.objectId,
						esTitle:$scope.page.esTitle,
						enTitle:$scope.page.enTitle,
						esHtml:$scope.page.esHtml,
						enHtml:$scope.page.enHtml,
						esSeoTitle:$scope.page.esSeoTitle,
						enSeoTitle:$scope.page.enSeoTitle,
						esSeoDescription:$scope.page.esSeoDescription,
						enSeoDescription:$scope.page.enSeoDescription,
						esSeoKeywords:$scope.page.esSeoKeywords,
						enSeoKeywords:$scope.page.enSeoKeywords
					}
				}).then(dataSuccess,dataError);
			}
		};
		
		$scope.memberOrderChanged=function(index,event,type){
			if($scope.submitButtonActive){
				if(event.keyCode==13 || (event.type=="blur" && index+1!=$scope.team[type][index].order)){
					$scope.submitButtonActive=false;
					$scope.memberDisabled=true;
					let dataSuccess=function(response){
						//$window.alert("data saved");
						console.log(response);
						$scope.getTeam();
					};
					let dataError=function(response){
						console.log(response);
						$scope.getTeam();
					};
					$http({
						method:"PUT",
						url:"./admin/teammemberorder",
						data:{member:$scope.team[type][index].objectId,order:$scope.team[type][index].order-1}
					}).then(dataSuccess,dataError);
				}
			}
		};
		
		$scope.memberPhotoUpload=function(member){
			if($scope.submitButtonActive){
				$scope.submitButtonActive=false;
				if($scope.crudform["memberPhotoUploadFile"+member.objectId].$valid && !!member.memberPhotoUploadFile){//
					//console.log("ok");
					Upload.upload({
						url:"./admin/teammemberphotoupload",//+"&var="+$scope.var
						method:"PUT",
						data:{member:member.objectId,file:member.memberPhotoUploadFile}
					}).then(function(response){
						$scope.submitButtonActive=true;
						Page.setTitle("Edit page - Clever Leaves CMS");
						$scope.getTeam();
					},function(response){ //catch error
						console.log("error",response);
						$scope.submitButtonActive=true;
						Page.setTitle("Edit page - Clever Leaves CMS");
					},function(evt){
						let progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
						Page.setTitle("Uploading "+progressPercentage+"% - Clever Leaves CMS");
					});
				}else{
					$scope.submitButtonActive=true;
				}
			}
		};
		
		$scope.saveMember=function(member,type){
			console.log("saveMember",member);
			if($scope.submitButtonActive){
				$scope.submitButtonActive=false;
				let dataSuccess=function(response){
					$window.alert("datos guardados");
					$scope.submitButtonActive=true;
					$scope.getTeam();
				};
				let dataError=function(response){
					console.log(response);
					$window.alert(response.data);
					$scope.submitButtonActive=true;
				};
				let reqMethod;
				if(!member.objectId){
					reqMethod="POST";
				}else{
					reqMethod="PUT";
				}
				$http({
					method:reqMethod,
					url:"./admin/teammember",
					data:{
						objectId:member.objectId,
						type:type,
						name:member.name,
						esPosition:member.esPosition,
						enPosition:member.enPosition,
						esExperience:member.esExperience,
						enExperience:member.enExperience
					}
				}).then(dataSuccess,dataError);
			}
		};
		
		$scope.deleteMember=function(member){
			console.log("deleteMember",member);
			if($scope.submitButtonActive){
				if($window.confirm("borrar "+member.name+"?")){
					$scope.submitButtonActive=false;
					let dataSuccess=function(response){
						$scope.submitButtonActive=true;
						$scope.getTeam();
					};
					let dataError=function(response){
						console.log(response);
						$window.alert(response.data);
						$scope.submitButtonActive=true;
					};
					$http({
						method:"DELETE",
						url:"./admin/teammember",
						data:{
							objectId:member.objectId
						},
						headers:{"Content-Type":"application/json;charset=utf-8"}
					}).then(dataSuccess,dataError);
				}
			}
		};
		
		$scope.$on("$destroy",function(){
			if(!!$scope.pageWatch) $scope.pageWatch();
			if(!!$scope.configWatch) $scope.configWatch();
			$window.onbeforeunload=null;
		});
		
		console.log("app.editPageController.end");
	});
	
}());