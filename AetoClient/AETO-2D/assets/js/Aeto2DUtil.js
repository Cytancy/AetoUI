"use strict";

function Aeto2DUtil() {
	var functionQueues = {}, textAnimQueue = {}, _this = this;

	this.loadAUI = function(A) {
		_this.A = A;
	}

	this.hideNode = function(node) {
		node.addClass('anim-hidden');
	}

	this.unhideNode = function (node) {
		node.removeClass('anim-hidden');
	}

	function delayedRemoveAddClass(node, oldClass, newClass, time) {
    	setTimeout(function() {
    		node.removeClass(oldClass);
    		node.addClass(newClass);
		}, time);
	}

	function delayedAddClass(node, className, time) {
    	setTimeout(function() {
    		node.addClass(className);
		}, time);
	}

	function delayedRemoveClass(node, className, time) {
    	setTimeout(function() {
    		node.removeClass(className);
		}, time);
	}

	// Hides an element until a given time and adds an animation class, removes the animation class
	// after a given number of expected animations
	this.hideAndDelayAnimClass = function(node, newClass, animationCount, time) {
		var animEvent = this.animationEventEnd(),
			animCount = 0,
			markClass = "marked-for-" + newClass, 
			currentAnimationName = "";

		node.addClass("anim-hidden " + markClass);

		setTimeout(function() {
			var handler = function(e) {
				if (e.animationName != currentAnimationName) {
					currentAnimationName = e.animationName;
					animCount++;
					
					if (animCount >= animationCount) {
						node.removeClass(markClass);
						node.removeClass(newClass);

						if (functionQueues[node] != null && functionQueues[node].length > 0) {
							functionQueues[node][0]();
							functionQueues[node].shift()

							if (functionQueues[node].length == null) functionQueues[node] = null;
						}

						node.getDOMNode().removeEventListener(animEvent, handler);
					}
				}
			};

			animEvent && node.getDOMNode().addEventListener(animEvent, handler);
		}, time);

		delayedRemoveAddClass(node, "anim-hidden", newClass, time);
	}

	this.delayedRemoveNodeAfterAnimation = function(node, checkClass, newClass, animationCount, time) {
		var animEvent = this.animationEventEnd(),
			animCount = 0;

		node.addClass("marked-for-" + newClass);

		var removeThisNode = function(t) {
			var handler = function() {
					animCount++;

					if (animCount >= animationCount) {
						node.addClass("anim-hidden");

						setTimeout(function() {
							node.getDOMNode().removeEventListener(animEvent, handler);
							node.remove();
						}, 100);
					}
				};

			animEvent && node.getDOMNode().addEventListener(animEvent, handler);

			delayedAddClass(node, newClass, t);
		}

		if (node.hasClass("marked-for-" + checkClass)) {
			if (functionQueues[node] == null) {
				functionQueues[node] = [];
			}

			functionQueues[node].push(removeThisNode);
		}
		else {
			removeThisNode(time);
		}
	}

	this.animationEventEnd = function(){
	    var t,
	    	el = document.createElement('fakeelement'),
	    	transitions = {
		      'animation':'animationend',
		      'OAnimation':'oAnimationEnd',
		      'MozAnimation':'animationend',
		      'WebkitAnimation':'webkitAnimationEnd'
		    }

	    for(t in transitions){
	        if( el.style[t] !== undefined ){
	            return transitions[t];
	        }
	    }
	}

	this.animationEventIterated = function(){
	    var t,
	    	el = document.createElement('fakeelement'),
	    	transitions = {
		      'animation':'animationiteration',
		      'OAnimation':'oAnimationIteration',
		      'MozAnimation':'animationiteration',
		      'WebkitAnimation':'webkitAnimationIteration'
		    }

	    for(t in transitions){
	        if( el.style[t] !== undefined ){
	            return transitions[t];
	        }
	    }
	}

	this.animateNodeNumber = function(node, targetValue, duration, shake, hasSymbol, intervalDuration, padding) {
		var textAnimationItem = function(node) {
			this.queue = [];
			var active = true;

			this.run = function() {
				if (shake) node.addClass("shake");
				
				for (var i = 0; i < this.queue.length; i++) {
					setTextAfterDelay(this.queue[i].str, this.queue[i].del, i == (this.queue.length - 1) ? true : false);
				}
			}

			this.deactivate = function() {
				active = false;
			}

			this.isActive = function() {
				return active;
			}

			function setTextAfterDelay(string, delay, isLast) {
				setTimeout(function() {
					if (active) {
						node.set("innerHTML", string);

						if (isLast) {
							active = false;
							node.removeClass("shake");
						}
					}
				}, delay);
			}
		};

		function checkGetSymbol(value) {
			var stringVal = value + "";

			while (padding != null && stringVal.length < padding) stringVal = "0" + stringVal;

			if (hasSymbol && value >= 0) {
				stringVal = "<span>+</span>" + stringVal;
			}

			return stringVal;
		} 

		if (duration > 0) {
			if (textAnimQueue[node] != null && textAnimQueue[node].isActive()) {
				textAnimQueue[node].deactivate();
			}

			var currentValue = parseInt(node.get("textContent")),
				difference = targetValue - currentValue,
				interval = (intervalDuration == null) ? 50 : intervalDuration,
				changeCount = parseInt(duration/interval),
				rate = parseInt( difference/changeCount);

			var textAnimItem = new textAnimationItem(node);

			for (var i = 0; i < changeCount; i++) {
				 currentValue += rate;

				 textAnimItem.queue.push({str: checkGetSymbol(currentValue), del: i * interval});
			}

			textAnimItem.queue.push({str: checkGetSymbol(targetValue), del: i * interval});

			textAnimQueue[node] = textAnimItem;

			textAnimItem.run();
		}
		else {
			node.set("innerHTML", targetValue);
		}
	}

	this.addAnimationEndListener = function(node, handler) {
		var animEvent = _this.animationEventEnd();
		
		animEvent && node.getDOMNode().addEventListener(animEvent, handler);
	}

	this.removeAnimationEndListener = function(node, handler) {
		var animEvent = _this.animationEventEnd();
		
		node.getDOMNode().removeEventListener(animEvent, handler);
	}

	// this.getEaseInOutArray = function(count, duration) {
	// 	var easingArray = [],
	// 		timeValue = 0;

	// 	for (var i = 0; i < count; i++) {
	// 		easingArray.push(easeInOutCubicForX(i + 1, 80, 1000));
	// 	}

	// 	return easingArray;
	// }

	// var easeInOutCubicForX = function (x, c, d) {
	// 	var tempX = x;

	// 	x /= c/2;

	// 	if (x < 1) return Math.pow(x, 1/3) * d/2;

	// 	if ((c & 1) == 0) x = (tempX - 1) / (c/2);

	// 	x = Math.abs(x - 2);
		
	// 	return (2 - Math.pow(x, 1/3)) * d/2;
	// }

 	// Based off Bezier.js from https://gist.github.com/BonsaiDen

	this.Bezier = function(a, b, c, d) {
	    this.a = a;
	    this.b = b;
	    this.c = c;
	    this.d = d;
	    
	    this.len = 100;
	    this.arcLengths = new Array(this.len + 1);
	    this.arcLengths[0] = 0;
	    
	    var ox = this.x(0), oy = this.y(0), clen = 0;

	    for(var i = 1; i <= this.len; i += 1) {
	        var x = this.x(i * 0.01), y = this.y(i * 0.01);
	        var dx = ox - x, dy = oy - y;        
	        clen += Math.sqrt(dx * dx + dy * dy);
	        this.arcLengths[i] = clen;
	        ox = x, oy = y;
	    }

	    this.length = clen;    
	}
 
	this.Bezier.prototype = {
	    map: function(u) {
	        var targetLength = u * this.arcLengths[this.len];
	        var low = 0, high = this.len, index = 0;
	        while (low < high) {
	            index = low + (((high - low) / 2) | 0);
	            if (this.arcLengths[index] < targetLength) {
	                low = index + 1;
	            
	            } else {
	                high = index;
	            }
	        }
	        if (this.arcLengths[index] > targetLength) {
	            index--;
	        }
	        
	        var lengthBefore = this.arcLengths[index];
	        if (lengthBefore === targetLength) {
	            return index / this.len;
	        
	        } else {
	            return (index + (targetLength - lengthBefore) / (this.arcLengths[index + 1] - lengthBefore)) / this.len;
	        }
	    },
	    
	    mx: function (u) {
	        return this.x(this.map(u));
	    },
	    
	    my: function (u) {
	        return this.y(this.map(u));
	    },
	    
	    x: function (t) {
	        return ((1 - t) * (1 - t) * (1 - t)) * this.a.x
	               + 3 * ((1 - t) * (1 - t)) * t * this.b.x
	               + 3 * (1 - t) * (t * t) * this.c.x
	               + (t * t * t) * this.d.x;
	    },
	    
	    y: function (t) {
	        return ((1 - t) * (1 - t) * (1 - t)) * this.a.y
	               + 3 * ((1 - t) * (1 - t)) * t * this.b.y
	               + 3 * (1 - t) * (t * t) * this.c.y
	               + (t * t * t) * this.d.y;
	    }
	};

	this.angleBetweenPointsInDegrees = function(p1, p2) {
		return _this.angleBetweenPoints(p1, p2) * 180 / Math.PI;
	};

	this.angleBetweenPoints = function(p1, p2) {
		return Math.atan2(p2.y - p1.y, p2.x - p1.x);
	};

	this.distanceBetweenPoints = function(p1, p2) {
		var xSet = Math.pow((p2.x - p1.x), 2),
			ySet = Math.pow((p2.y - p1.y), 2);

		return Math.sqrt(xSet + ySet);
	}

	this.loadNode = function(path, onComplete, onFailure) {
		var node;

		if (_this.nodeCache == null) _this.nodeCache = {};

		if (_this.nodeCache[path] == null) {
			var A = _this.A,
				request = A.io(path, {
					on: {
						complete: parseNode,
						end: prepareNode
					},
				});
		}
		else {
			onComplete(this.nodeCache[path].cloneNode(true));
		}

		function prepareNode(id) {
			if (node != null) {
				if (onComplete != null) {
					onComplete(node.cloneNode(true));
					_this.nodeCache[path] = node;
				}
			}
			else {
				if (onFailure != null) onFailure();
			}
		}

		function parseNode(id, o) {
			if (o.responseText != "") {
				node = A.Node.create(o.responseText);

				A.unsubscribe('io:complete', parseNode);
			};
		}

	}

	this.loadSVG = function(path, onComplete, onFailure) {
		return _this.loadNode(path, function(node) {
			var svgNode = node.one('svg'),
				attributeList = svgNode.get('attributes');

			attributeList.each(function(thisNode) {
				var name = thisNode.get('name');

				if (name != 'viewBox') svgNode.removeAttribute(name);
			});

			onComplete(svgNode);
		}, onFailure)
	};

	this.loadSVGIcon = function(icon, onComplete) {
		var path = icon.name,
			count = icon.layers,
			layerSet = [],
			idx = 1;

		if (count != null) {
			loadLayer();
		}
		else {
			_this.loadSVG("AetoClient/AETO-2D/assets/svgs/aeto-icon-" + path + ".svg", function(node) {
				onComplete([node]);
			}, function() {
				console.log("[AETO Error] No matching icon can be found.");
			});
		}

		function loadLayer() {
			_this.loadSVG("AetoClient/AETO-2D/assets/svgs/aeto-icon-" + path + "-l" + idx + ".svg", function(node) {
				idx++;
				
				layerSet.push(node);

				if (layerSet.length == count) 
					onComplete(layerSet);
				else 
					loadLayer();
			}, function() {
				console.log("[AETO Error] Missing icon layer.");
			});
		}
	}
}

var Aeto2DUtil = new Aeto2DUtil();