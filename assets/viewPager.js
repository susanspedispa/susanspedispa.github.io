window.vp = (function() {
				//VIEWPAGER STATIC GLOBALS
				var gesturesEnabled = false;
				var count = 0;
				//END VIEWPAGER STATIC GLOBALS
				
				//VIEWPAGER GLOBAL CONSTRUCTOR
				if(typeof Hammer == 'function'){ gesturesEnabled = true; }
				if(!window.console){ window.console = function(){}; } 
				//END VIEWPAGER GLOBAL CONSTRUCTOR
				
				function clearChildren(domElement, log) {
					if(!domElement.hasChildNodes)
						console.log("VIEWPAGER ERROR: Supplied element is not in DOM.")
					var poorState = false;
					while (domElement.hasChildNodes()) {
					    domElement.removeChild(domElement.lastChild);
					    poorState = true;
					}
					if(poorState && log){ console.log("VIEWPAGER WARNING: Supplied element emptied. There were children in there!"); }
				}
				
				
				function newViewPager(viewport) {
					count++;
					clearChildren(viewport, true);
					
					viewport.ondragstart = function() { return false; };
					var frag = document.createDocumentFragment();
					var viewWindow = document.createElement("div");
						viewWindow.style.width = "100%";
						viewWindow.style.height = "100%";
						viewWindow.style.position = "relative";
						viewWindow.style.overflow = "hidden";
						viewWindow.ondragstart = function() { return false; };
					var slidingPane = document.createElement("div");
						slidingPane.style.width = "300%";
						slidingPane.style.height = "100%";
						slidingPane.style.position = "absolute";
						slidingPane.style.left = "-"+viewport.clientWidth + "px";						
						slidingPane.ondragstart = function() { return false; };
					var view = document.createElement("div");
						view.style.width = viewport.clientWidth + "px";
						view.style.height = "100%";
						view.style.styleFloat = "left";
						view.style.cssFloat = "left";
						view.style.position = "relative";
						view.ondragstart = function() { return false; };
					var viewStore = document.createElement("div");
						viewStore.style.display = "none";
					
					var slidingPaneFrag = document.createDocumentFragment();
						slidingPaneFrag.appendChild(view.cloneNode(true));
						slidingPaneFrag.appendChild(view.cloneNode(true));
						slidingPaneFrag.appendChild(view);
					
					viewWindow.appendChild(slidingPane);
					frag.appendChild(viewWindow);
					frag.appendChild(viewStore);
					viewport.appendChild(frag);
					
					var pages = [];
					var pageNames = [];
					var currentIndex = 0;
					var callback = {
						"next" : [],
						"prev" : [],
						"positionChange" : [],
						"nameChange" : [],
						"pageChange" : []				
					};
					
					var offset = 0;
					var viewPager = function(specifiedIndex) {
						index = specifiedIndex|0;
							
						clearChildren(slidingPane, false);
						slidingPane.style.left = "-"+viewport.clientWidth + "px";
						clearChildren(viewStore, false);
						
						
						var tempFrag = slidingPaneFrag.cloneNode(true);
						var left, center, right;
						if(pages.length > 0) {
							
							center = pages[index];
							tempFrag.childNodes[1].appendChild(center);
							
							if(index == pages.length - 1) {
								right = pages[0];
							} else {
								right = pages[index + 1]
							}
							if(right == center)
								tempFrag.childNodes[2].appendChild(right.cloneNode(true));
							else
								tempFrag.childNodes[2].appendChild(right)
							
							if(index == 0) {
								left = pages[pages.length - 1];
							} else {
								left = pages[index - 1];
							}
							if(left == center || left == right)
								tempFrag.childNodes[0].appendChild(left.cloneNode(true));
							else
								tempFrag.childNodes[0].appendChild(left);								
							
						}
						slidingPane.appendChild(tempFrag);
						
						var viewStoreFrag = document.createDocumentFragment();
						for(var i=0; i<pages.length; i++)
						{
							if(!(pages[i] == center || pages[i] == right || pages[i] == left))
								viewStoreFrag.appendChild(pages[i]);
						}
						viewStore.appendChild(viewStoreFrag);
						return viewPager;
					}
					
				//Private Methods:
					var notifyCallbacks = function(type) {
						var args = Array.prototype.slice.call(arguments);
						args.splice(0, 1);
						var callbacks = callback[type];
						for (i = 0; i < callbacks.length; i++) {
						  callbacks[i].apply(this, args);
						} 
					}
					
					var easeInOutQuad = function (t, b, c, d) {
						t /= d/2;
						if (t < 1) return c/2*t*t + b;
						t--;
						return -c/2 * (t*(t-2) - 1) + b;
					};
					
					var locked = false;
					var interuptAnimation = false;
					var finish = 500;
					var currentTime = 0;
					var frameDuration = 10;
					
					var currentPosition = 0;
					var exactPosition = 0;
					var requestedPosition = 0;
					

					var animate = function(fromPosition, lockpick) {
						if( (!locked || lockpick) && !interuptAnimation )
						{
							locked = true;
							var change = requestedPosition - fromPosition;
							var offset = easeInOutQuad(currentTime, fromPosition, change, finish);
							setOffset(offset);
							
							currentTime += frameDuration;
							
							if(currentTime >= finish) {
								currentTime = 0;
								setOffset(requestedPosition);
								currentPosition = requestedPosition;
								locked = false;
							} else {
								setTimeout(IEDoesNotUnderstandSetTimeout(fromPosition, true), frameDuration);
							}
						}
					} 
					
					var IEDoesNotUnderstandSetTimeout = function(fromPosition, lockpick) {
						return function() {
							animate(fromPosition, lockpick);
						}
					}
					
					var setOffset = function(normalizedOffset) {
						exactPosition = normalizedOffset;
						notifyCallbacks("positionChange", exactPosition);
						var intQuotient = normalizedOffset | 0; //OR 0 results in a truncated int, different from floor for negative values
						var remainderOffset = normalizedOffset % 1;
						
						var index = (currentIndex + intQuotient) % pages.length;
						if(index < 0)
							index = pages.length + index;
							
						
						if(exactPosition == exactPosition|0)
							notifyCallbacks("pageChange", index);
								
						if(pages[index] != viewport.childNodes[0].childNodes[0].childNodes[1].childNodes[0])
						{
							viewPager(index);
						}
						
						
						var actualOffset = ((viewport.clientWidth * remainderOffset * -1) - viewport.clientWidth)|0;
						slidingPane.style.left = actualOffset + "px";
					}
				//Public Methods:
					
					//chainable methods:
					viewPager.next = function() {
						requestedPosition++;
						notifyCallbacks("next", (requestedPosition%pages.length));
						animate(exactPosition);						
						return viewPager;
					}
					
					viewPager.prev = function() {
						requestedPosition--;
						notifyCallbacks("prev", (requestedPosition%pages.length));
						animate(exactPosition);
						return viewPager;
					}
					
					viewPager.setOffset = function(normalizedOffset) {
						interuptAnimation = true;
						locked = false;
						setOffset(normalizedOffset)
						return viewPager;
					}
					
					viewPager.release = function() {
						interuptAnimation = false;
						requestedPosition = Math.round(exactPosition);
						animate(exactPosition);
						return viewPager;
					}
					
					viewPager.addCallback = function(type, doCallback) {
						if(callback[type] && typeof doCallback == 'function')
							callback[type].push(doCallback);
						if(!callback[type])
							console.log("VIEWPAGER ERROR in viewPager.addCallback(): Stop trying to make callback type '"
										+type+"' happen. It's not going to happen.");
						if(typeof doCallback != 'function')
							console.log("VIEWPAGER ERROR in viewPager.addCallback(): Conjunction junction that's no function!")
						return viewPager;
					}
					
					viewPager.addPage = function(domElement, title) {
						pages.push(domElement);
						pageNames.push(title);
						notifyCallbacks("nameChange", pageNames);
						return viewPager(currentIndex);
					}
					
					viewPager.removePage = function(index) {
						notifyCallbacks("nameChange", pageNames);
						return viewPager(currentIndex);
					}
					
					viewPager.goToPage = function(index) {
						var curIndex = (exactPosition|0) % pages.length;
						if(curIndex < 0)
							curIndex = pages.length + curIndex;
						if(curIndex == 0 && index == pages.length-1)
							requestedPosition--;
						else if(curIndex == pages.length -1 && index == 0)
							requestedPosition++;
						else
							requestedPosition = (exactPosition|0) + index -curIndex;
							
						animate(exactPosition);
						return viewPager;
					}
					
					//unchainable methods:
					viewPager.getPosition = function() {
						return exactPosition;
					}
					
					viewPager.getPageNames = function() {
						return pageNames;
					}
					
					
					return viewPager(currentIndex);
				}
				
				function newIndicator(viewport, viewPager) {
					
					clearChildren(viewport, true);
					
					var frag = document.createDocumentFragment();
					
					
					var bottomLayer = document.createElement("div");
						bottomLayer.style.width = "100%";
						bottomLayer.style.height = "100%";
						bottomLayer.style.position = "absolute";
						bottomLayer.style.overflow = "hidden";
						bottomLayer.style.zIndex = "0";
					
					var left = document.createElement("div");
						left.style.height = "100%";
						left.style.position = "absolute";
						left.style.padding = "4px";
					
					var center = document.createElement("div");
						center.style.height = "100%";
						center.style.position = "absolute";
						center.style.padding = "4px";
						
					var right = document.createElement("div");
						right.style.height = "100%";
						right.style.position = "absolute";
						right.style.padding = "4px";
						
									
					bottomLayer.appendChild(left);
					bottomLayer.appendChild(center);
					bottomLayer.appendChild(right);
					frag.appendChild(bottomLayer);
					
					viewport.appendChild(frag);
					
					var names = [];
					var position = 0;				
					
					var buildNames = function() {
						
					}
					
					var buildOffsets = function(intOffset, remainderOffset) {
						var leftPos = 0;
						var centerPos = (viewport.clientWidth/2) - (center.clientWidth/2);
						var rightPos = viewport.clientWidth - right.clientWidth;
						
						
						if(position < 0)
						{
							intOffset--;
						}
						
						
						if(remainderOffset < 0.5)
						{
							if(names[getIndexAtPosition(intOffset - 1)]) {
								if(left.firstChild)
									left.replaceChild(names[getIndexAtPosition(intOffset - 1)], left.firstChild);
								else
									left.appendChild(names[getIndexAtPosition(intOffset - 1)]);
								
								if(center.firstChild)
									center.replaceChild(names[getIndexAtPosition(intOffset )], center.firstChild);
								else
									center.appendChild(names[getIndexAtPosition(intOffset )]);
									
								if(right.firstChild)
									right.replaceChild(names[getIndexAtPosition(intOffset + 1)], right.firstChild);
								else
									right.appendChild(names[getIndexAtPosition(intOffset + 1)]);	
							}
							
							rightPos = viewport.clientWidth - right.clientWidth;				
							centerPos = (viewport.clientWidth/2) - ((remainderOffset/0.5) * (viewport.clientWidth/2)) - (center.clientWidth/2);
							if(centerPos < 0) centerPos = 0;
							if(centerPos < leftPos + left.clientWidth) leftPos -= leftPos + left.clientWidth - centerPos;
						} else {
							
							if(names[getIndexAtPosition(intOffset)]) {
								if(left.firstChild)
									left.replaceChild(names[getIndexAtPosition(intOffset)], left.firstChild);
								else
									left.appendChild(names[getIndexAtPosition(intOffset)]);
								
								if(center.firstChild)
									center.replaceChild(names[getIndexAtPosition(intOffset + 1)], center.firstChild);
								else
									center.appendChild(names[getIndexAtPosition(intOffset + 1)]);
									
								if(right.firstChild)
									right.replaceChild(names[getIndexAtPosition(intOffset + 2)], right.firstChild);
								else
									right.appendChild(names[getIndexAtPosition(intOffset + 2)]);	
							}
							
							var leftPos = 0;
							centerPos = viewport.clientWidth - (((remainderOffset-0.5)/0.5) * (viewport.clientWidth/2)) - (center.clientWidth/2);
							if(centerPos + center.clientWidth > viewport.clientWidth) centerPos = viewport.clientWidth - center.clientWidth;
							if(centerPos + center.clientWidth > rightPos) rightPos += centerPos + center.clientWidth - rightPos;
						}
						
						
						left.style.left = leftPos + "px";
						center.style.left = centerPos + "px";
						right.style.left = rightPos + "px"; 
					}
					
					var setPosition = function(pos) {
						position = pos;
						var intOffset = pos | 0;
						var remainderOffset = pos % 1;
						if(pos<0)
							remainderOffset = 1 + remainderOffset;
						buildOffsets(intOffset, remainderOffset);
					}
					
					var getIndexAtPosition = function(pos) {
						var index =  pos % names.length;
						if(index<0) index = names.length + index;
						return index;
					}

					var setNames = function(pageNames) {
						for(var i=0; i<pageNames.length; i++) {
							var link = document.createElement("a");
							link.appendChild(document.createTextNode(pageNames[i]));
							link.onclick = linkClosure(i);
							link.href = "#";
							link.title = "Go to " + pageNames[i];
							names[i] = link;
						}
						setPosition(position);
					}
					
					var linkClosure = function(i) {
						return function() {
							viewPager.goToPage(i);
							return false;
						}
					}
					
					//bootstrap it
					setNames(viewPager.getPageNames());
					setPosition(viewPager.getPosition());
					
					viewPager.addCallback("positionChange", setPosition);
					viewPager.addCallback("nameChange", setNames);
				}
				
				
				
				return {
					viewPager : newViewPager,
					indicator : newIndicator,
					isHammerTime : gesturesEnabled
				}
			})();
			
			
