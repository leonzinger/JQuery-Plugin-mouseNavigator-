/**
 * JQuery Plugin mouseNavigator
 * 
 * Written by Josiah Wong : jo_b_there@hotmail.com
 * Using JQuery 1.6.1
 * 
 * Version : 1.0
 * Date: 06-07-2011
 * 
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 */
(function($) {
	 $.fn.mouseNavigator = function(options) {

		 $.fn.mouseNavigator.defaults = {
				 	stepSize:10,
				 	minDur:10,
				 	maxDur:20,
				 	deadZoneSpread:25,
				 	contentSelector:false,
				 	showItemSpeed:20,
				 	direction:"horizontal",
				 	invertedControl:false,
				 	objProxy:false
				 };

		 var opts = $.extend({}, $.fn.mouseNavigator.defaults, options);
		 
		 opts = $.meta ? $.extend({}, opts, this.data()) : opts;
		 
		 return this.each(function(){
			 	var DIRECTION_HORIZONTAL = "horizontal";
			 	var DIRECTION_VERTICAL = "vertical";
			 	
			 	var viewPort=$(this);
			 	var contentContainer=false;
			 	var navInterval=false;
			 	var centerPoint = {x:0,y:0}; //position relative to whole document
			 	var mouse;
			 	var firstItem=false;
			 	var lastItem=false;

			 	contentContainer = $(opts.contentSelector);
				
				if(contentContainer.length == 0){
					contentContainer = viewPort.children().first();
				};
				
				viewPort
					.bind("mousemove.mouseNavigator", function(e){handleMouseMove(e);})
					.bind("mouseleave.mouseNavigator", function(e){handleMouseOut(e);})
					.bind("mouseenter.mouseNavigator", function(e){handleMouseOver(e);})
					.bind("resize.mouseNavigator", function(e){handleResize(e);});
				
				if(opts.objProxy){	
					opts.objProxy.bringItemIntoView = function(index){bringItemIntoView(index);};
					opts.objProxy.setFirstItem = function(item){setFirstItem(item);};
					opts.objProxy.setLastItem = function(item){setLastItem(item);};
				}
			 	
				// private function for debugging, only works with firefox/firebug
				function debug(msg) {
					if (window.console && window.console.log)
						window.console.log(msg);
				};
				
				function trackMouse(e){
					mouse = e;
				};
				
				function calculateCenterPoint (){
					centerPoint.x = Math.round(viewPort.offset().left + (viewPort.innerWidth()/2));
					centerPoint.y = Math.round(viewPort.offset().top + (viewPort.innerHeight()/2));
				};
				
				/* @TODO what else is needed here and when to call this function*/
				function handleResize (e){
					calculateCenterPoint();
					
				};
				
				function navigate(){
					
					if(!shouldScroll()){
						return;
					}
					if(isScrollBackward()){
						scrollBackward(opts.stepSize);
					}else{
						scrollForward(opts.stepSize);
					}
				};
				
				function shouldScroll(){
					if(isEntireContentContainerFitInViewPort()){
						debug("item container smaller than viewPort, no scrolling " + contentContainer.innerWidth() + " : " + viewPort.innerWidth() );
						return false;
					};
					
					if(isInsideDeadZone()){
						return false;
					}
					
					return true;
				};
				
				function isInsideDeadZone(){
					//both mouse and centerPoint values are relative to the document
					return (opts.direction == DIRECTION_HORIZONTAL)?
							(Math.abs(mouse.pageX - centerPoint.x) < opts.deadZoneSpread)? true : false :
							(Math.abs(mouse.pageY - centerPoint.y) < opts.deadZoneSpread)? true : false;
				};
				
				function isEntireContentContainerFitInViewPort(){
					var lastItem = getLastItem();
					var firstItem = getFirstItem();
					
					return (opts.direction == DIRECTION_HORIZONTAL)?
								((contentContainer.position().left + firstItem.position().left) >= 0 && (contentContainer.position().left + lastItem.position().left + lastItem.innerWidth())<= viewPort.innerWidth()):
								((contentContainer.position().top + firstItem.position().top) >= 0 && (contentContainer.position().top + lastItem.position().top + lastItem.innerHeight())<= viewPort.innerHeight());
				};
				
				
				function scrollBackward (dist){
					var lastItem = getLastItem();
					
					if(opts.direction == DIRECTION_HORIZONTAL){
						if((lastItem.position().left + lastItem.innerWidth() - Math.abs(contentContainer.position().left) ) < viewPort.innerWidth()){ 
							debug("cannot scroll more backwards");
							return;
						}		
						
						contentContainer.css("left", (contentContainer.position().left - dist) + "px");
					}else{
						if((lastItem.position().top + lastItem.innerHeight() - Math.abs(contentContainer.position().top) ) < viewPort.innerHeight()){ 
							debug("cannot scroll more backwards");
							return;
						}		
						
						contentContainer.css("top", (contentContainer.position().top - dist) + "px");
					}
					
				};
				
				function scrollForward (dist){
					if(opts.direction == DIRECTION_HORIZONTAL){
						if(contentContainer.position().left + getFirstItem().position().left > 0){
							debug("cannot scroll more fowards");
							return;
						}
						
						contentContainer.css("left", contentContainer.position().left + dist + "px");
					}else{
						if(contentContainer.position().top + getFirstItem().position().left > 0){
							debug("cannot scroll more fowards");
							return;
						}
						contentContainer.css("top", contentContainer.position().top + dist + "px");
					}
					
				};
				
				function handleMouseOut(e){
					stopNavigation(e);
				};
				
				function handleMouseOver(e){
					stopNavigation();
					calculateCenterPoint();
					startNavigation(calculateDuration(e));
				};

				function startNavigation (duration){
					navInterval = setInterval(function(){navigate();},duration);
				};
				
				function stopNavigation(){
					if(navInterval) clearInterval(navInterval);
				};
				
				function handleMouseMove(e){
					stopNavigation();
					startNavigation(calculateDuration(e));
				};
				
				/* Calculate interval time between steps. 
				 * Value is proportional of the maxDur / minDur values and
				 * the distance beyond the dead zone 
				 * */
				function calculateDuration(e){
					mouse = e;
					var dist;
					var halfContainer;
					
					if(opts.direction == DIRECTION_HORIZONTAL){
						dist = Math.abs(mouse.pageX - centerPoint.x) - opts.deadZoneSpread;
						halfContainer = viewPort.innerWidth()/2;
					}else{
						dist = Math.abs(mouse.pageY - centerPoint.y)- opts.deadZoneSpread;
						halfContainer = viewPort.innerHeight()/2;
					}
					return (opts.maxDur - opts.minDur)*((halfContainer - dist)/(halfContainer)) + opts.minDur;
				};
				
				function isScrollBackward(){
					var result = false;
					if(opts.direction == DIRECTION_HORIZONTAL){
						result = (mouse.pageX > centerPoint.x)? true:false;
					}else{
						result = (mouse.pageY > centerPoint.y)? true:false;						
					}
					
					return (!opts.invertedControl)? result : !result;
				};
				
				function isWithInContainer(targetItem, container){
					var target = targetItem;
					
					if(opts.direction == DIRECTION_HORIZONTAL){
						if(target.offset().left >= container.offset().left){
							return (target.innerWidth() + target.offset().left <= (container.offset().left + container.innerWidth()))? true : false;
						}else{
							return false;
						}
					}else{
						if(target.offset().top >= container.offset().top){
							return (target.innerHeight() + target.offset().top <= (container.offset().top + container.innerHeight()))? true : false;
						}else{
							return false;
						}
					}
				};
				
				/*
				 * @TODO : do we need to account for border/margin/padding?
				 */
				function bringItemIntoView(index){
					 var item = $(contentContainer.children()[index]);
						
					 if(item.length == 0) return;
					
					 if(isWithInContainer(item, viewPort)){
						 debug("index " + index + " is within the view port");
						 return;
					 }
					 
					 if(opts.direction == DIRECTION_HORIZONTAL){
						 var itemXDelta = item.offset().left - viewPort.offset().left;
						 var newContentContainerLeft;
						 if(itemXDelta < 0){
							 newContentContainerLeft =  contentContainer.position().left + Math.abs(itemXDelta);
						 }else{
							 newContentContainerLeft =  contentContainer.position().left - (itemXDelta - viewPort.innerWidth() + item.innerWidth());
						 }
						
						 contentContainer.animate({left: newContentContainerLeft + "px"}, opts.showItemSpeed);
					 }else{
						 var itemYDelta = item.offset().top - viewPort.offset().top;
						 var newContentContainerTop;
						 if(itemYDelta < 0){
							 newContentContainerTop =  contentContainer.position().top + Math.abs(itemYDelta);
						 }else{
							 newContentContainerTop =  contentContainer.position().top - (itemYDelta - viewPort.innerHeight() + item.innerHeight());
						 }
						
						 contentContainer.animate({top: newContentContainerTop + "px"}, opts.showItemSpeed);
					 }
				};
				
				function getFirstItem(){
					if(!firstItem){
						setFirstItem(contentContainer.children().first());
					}
					
					return firstItem;
				};
				
				function getLastItem(){
					if(!lastItem){
						setLastItem(contentContainer.children().last());
					}
					
					return lastItem;
				};
				
				function setFirstItem(item){
					firstItem = item;
				};
				
				function setLastItem(item){
					lastItem = item;
				}
		 });
	 };
	 
	 
	
})(jQuery);