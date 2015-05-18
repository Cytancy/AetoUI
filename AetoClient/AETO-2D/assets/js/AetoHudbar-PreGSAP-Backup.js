"use strict";

AetoUtil.callMeMaybe(AetoHudbar);

function AetoHudbar(A, GUID, parentNode, parameters) {
	var _this = this,
		errorHeader = "Error (AETO-2D)[" + GUID + "]",
		win, hudbarNode, initialized, alignment,
		barWidths = {}, barContainerNodes = {}, 
		barAnimationOffsets = {}, maxPointValues = {}, barFrameOffsets = {}, 
		barFrames = {}, currentFrameWidths = {}, animationFlatQueue = {}, 
		barSegmentSets = {}, segmentCounts = {}, barAfterFxBars = {},
		numberNodes = {}, maxNumberNodes = {}, currentValues = {},
		regenNodes = {}, effectNodes = {}, effectInfo = {}, isCycling = {},
		initialMargin, initialBottom;

	this.GUID = GUID;
	initialized = false;

	this.initialize = function() {
		if (!initialized) {
			initialized = true;

		    var requestId = A.io('AetoClient/AETO-2D/assets/html/AetoHudbar.html').id;

		    function setup(id, o) {
		    	win = A.one(window);

		    	if (id == requestId) {
			    	hudbarNode = A.Node.create(o.responseText);
			    	hudbarNode.addClass(GUID);
			    	Aeto2DUtil.hideNode(hudbarNode);
					parentNode.appendChild(hudbarNode);

			    	var headerContentNode = hudbarNode.one(".frame-header-content"),
						headerBgNode = hudbarNode.one(".frame-header-bg");

					headerBgNode.setStyle("height", parseInt(headerContentNode.getComputedStyle("height")));
					headerBgNode.setStyle("width", parseInt(headerContentNode.getComputedStyle("width")) - 10);

					initializeParameters(parameters);
					initializeSegments("tp");
					initializeSegments("hp");
					initializeSegments("ep");
					initializeEffects();
					initializeResizeResponse();

					A.augment(_this, A.EventTarget);
		    		A.unsubscribe('io:complete', setup);

					_this.callback('ready', GUID);
				};
		    };

		    A.on('io:complete', setup);
		}
		else {
			throw new Error(errorHeader +  ": Hudbar is already initialized, cannot be initialized again.");
		}

		function initializeParameters(params) {
			alignment = "left";

			if (params != null) {
				if (params['alignment'] != null) {
					if (params['alignment'] == "left" || params['align'] == "right") {
						alignment = params['align'];
					}
					else {
						throw new Error(errorHeader +  ": Invalid alignment parameter \""+ params['align'] + "\" passed.");
					}
				}
			}
		}

		function initializeSegments(type) {
			var segmentNode = hudbarNode.one("." + type + "-frame .segment-container");

			barContainerNodes[type] = segmentNode.one(".segment-measurer");
			barWidths[type] = parseInt(hudbarNode.one("." + type + "-frame").getComputedStyle("width")) - parseInt(segmentNode.getStyle("left"));
			barFrames[type] = hudbarNode.one("." + type + "-frame .bar-subframe");
			barAfterFxBars[type] = hudbarNode.one("." + type + "-frame .bar-after-fx-bg");
			barFrameOffsets[type] = parseInt(barFrames[type].getStyle("left"));
			numberNodes[type] = hudbarNode.one(".bar-value." + type + " .bar-val.first");
			maxNumberNodes[type] = hudbarNode.one(".bar-value." + type + " .bar-val.second");
			currentFrameWidths[type] = 0, currentValues[type] = 0;

			barSegmentSets[type] = [];

			barContainerNodes[type].get("children").each(function(thisNode) {
				barSegmentSets[type].push(thisNode.cloneNode(true));

				thisNode.remove();
			});

			segmentCounts[type] = 0;
			barAnimationOffsets[type]  = 0;

			for (var i = 0; i < barSegmentSets[type].length * 3; i++) {
				var newSegment = barSegmentSets[type][i % barSegmentSets[type].length].cloneNode(true);
				
				barContainerNodes[type].appendChild(newSegment);
				newSegment.setStyle("left", barAnimationOffsets[type] );
				barAnimationOffsets[type] += parseInt(newSegment.getComputedStyle("width"));
			}

			barContainerNodes[type].setStyle("left", -barAnimationOffsets[type]);
		}

		function initializeEffects() {
			effectNodes["containerNode"] = hudbarNode.one(".effects-item-container");
			
			var childNodes = effectNodes["containerNode"].get("children");

			effectInfo["marginWidth"] = parseInt(childNodes.item(0).getStyle("marginRight"));
			effectNodes["effectNode"] = childNodes.item(0).cloneNode(true);
			childNodes.remove();

			effectInfo["count"] = 0;
			effectInfo["totalWidth"] = 0;
			effectNodes["barFrame"] = hudbarNode.one(".effects-bar-frame");
		}

		function initializeResizeResponse() {
			initialMargin = parseInt(hudbarNode.getStyle('left')),
			initialBottom = parseInt(hudbarNode.getStyle('bottom'));

			win.on('resize',  A.debounce(resizeResponse, 50));

			resizeResponse();
		}
	}

	function resizeResponse() {
		var scaleRatio = parseInt(A.one("body").get("winWidth")) / 1920;

		scaleRatio = AetoUtil.clamp(scaleRatio, 0.5, 1);

		hudbarNode.setStyle('transform', 'scale(' + scaleRatio + ')');

		if (alignment == "left") {
			hudbarNode.setStyle('left', scaleRatio * initialMargin);
			hudbarNode.setStyle('right', 'auto');
		}
		else if (alignment == "right") {
			hudbarNode.setStyle('right', scaleRatio * initialMargin);
			hudbarNode.setStyle('left', 'auto');
		}

		hudbarNode.setStyle('bottom', scaleRatio * initialBottom);
	}

	this.enter = function(doAnimate) {
		if (doAnimate) {
			var animCounter = 0,
				handler = function(e) {
					animCounter++;

					if (animCounter >= 96) {
						Aeto2DUtil.removeAnimationEndListener(hudbarNode, handler);

						hudbarNode.removeClass("anim-enter");
						hudbarNode.removeClass("marked-for-anim-enter");
						_this.fire("entryAnimationComplete");
					}
				};

			hudbarNode.addClass("marked-for-anim-enter");
			Aeto2DUtil.addAnimationEndListener(hudbarNode, handler);

			Aeto2DUtil.unhideNode(hudbarNode);
			hudbarNode.addClass("anim-enter");
		}

		Aeto2DUtil.unhideNode(hudbarNode);
	}

	this.setName = function(name) {
		hudbarNode.one('.frame-header-name').set('textContent', name);
	}

	this.setFramework = function(frameworkName) {
		hudbarNode.one('.frame-header-framework-name').set('textContent', name);
	}

	this.setDEF = function(defense, doAnimate) {
		setStateValue(defense, 'def-value', doAnimate);
	}

	this.setMDEF = function(magicDefense, doAnimate) {
		setStateValue(magicDefense, 'mdef-value', doAnimate);
	}

	this.setATK = function(attack, doAnimate) {
		setStateValue(attack, 'atk-value', doAnimate);
	}

	this.setMATK = function(magicAttack, doAnimate) {
		setStateValue(magicAttack, 'matk-value', doAnimate);
	}

	function setStatValue(newValue, className, doAnimate) {
		hudbarNode.all(className).each(function(thisNode) {
			if (doAnimate) {
				Aeto2DUtil.animateNodeNumber(thisNode, newValue, 350, true, false);
			}
			else {
				thisNode.set('textContent', newValue);
			}
		});
	}

	this.setAlignmentRight = function() {
		alignment = "right";

		hudbarNode.addClass('right-align');

		resizeResponse();
	}

	this.setAlignmentLeft = function() {
		alignment = "left";

		hudbarNode.addClass('left-align');

		resizeResponse();
	}

	this.setMaxTP = function(maxTP, doAnimate) {
		maxPointValues["tp"] = maxTP;
		setMaxPointOfType("tp", maxTP, doAnimate);
	}

	this.setMaxHP = function(maxHP, doAnimate) {
		maxPointValues["hp"] = maxHP;
		setMaxPointOfType("hp", maxHP, doAnimate);
	}

	this.setMaxEP = function(maxEP, doAnimate) {
		maxPointValues["ep"] = maxEP;
		setMaxPointOfType("ep", maxEP, doAnimate);
	}

	function setMaxPointOfType(type, value, doAnimate) {
		var valueNode = hudbarNode.one(".bar-value." + type + " .second");
			
		if (doAnimate) {
			Aeto2DUtil.animateNodeNumber(valueNode, value, 1000, true, false);
		}
		else {
			valueNode.set("textContent", value);
		}

		switch(type) {
			case "tp":
				_this.setTP(currentValues[type], doAnimate);
				break;
			case "hp":
				_this.setHP(currentValues[type], doAnimate);
				break;
			case "ep":
				_this.setEP(currentValues[type], doAnimate);
				break;
		}
	}

	this.setHPR = function(hpr, doAnimate) {
		setRegenOfType("hp", hpr, doAnimate);
	}

	this.setEPR = function(epr, doAnimate) {
		setRegenOfType("ep", epr, doAnimate);
	}

	this.setTPR = function(tpr, doAnimate) {
		setRegenOfType("tp", tpr, doAnimate);
	}
	
	this.setSpeed = this.setTPR;

	function setRegenOfType(type, value, doAnimate) {
		if (regenNodes[type] == null) {
			regenNodes[type] = hudbarNode.one(".bar-value." + type + " .bar-regen-val");
		}

		if (doAnimate) {
			Aeto2DUtil.animateNodeNumber(regenNodes[type], value, 750, false, true);
		}
		else {
			if (value >= 0) {
				value = "<span>+</span>" + value;
			}

			regenNodes[type].set("innerHTML", value);
		}
	}

	this.cycleTP = function() {
		cyclePointOfType("tp");
	}
	this.cycleHP = function() {
		cyclePointOfType("hp");
	}

	this.cycleEP = function() {
		cyclePointOfType("ep");
	}

	this.uncycleTP = function() {
		uncyclePointOfType("tp");

		isCycling["tp"] = false;
	}

	this.uncycleHP = function() {
		uncyclePointOfType("hp");

		isCycling["hp"] = false;
	}

	this.uncycleEP = function() {
		uncyclePointOfType("ep");

		isCycling["ep"] = false;
	}

	function cyclePointOfType(type) {
		barFrames[type].addClass("anim-cycle");
		isCycling[type] = true;
	}

	function uncyclePointOfType(type) {
		if (barFrames[type].hasClass("anim-cycle")) {
			var animEvent = Aeto2DUtil.animationEventIterated(),
				handler = function(e) {
					barFrames[type].getDOMNode().removeEventListener(animEvent, handler);
					barFrames[type].removeClass("anim-cycle");
					barFrames[type].removeClass("marked-for-uncycle");
				};

			barFrames[type].addClass("marked-for-uncycle");
			animEvent && barFrames[type].getDOMNode().addEventListener(animEvent, handler);
		}
	}

	this.setTP = function(value, doAnimate) {
		setPointOfType(value, "tp", doAnimate, 2);
	}

	this.setHP = function(value, doAnimate) {
		setPointOfType(value, "hp", doAnimate, 5);
	}

	this.setEP = function(value, doAnimate) {
		setPointOfType(value, "ep", doAnimate, 2);
	}

	function setPointOfType(value, type, doAnimate, frameCount) {
		if (!initialized) {
			throw new Error(errorHeader + ": Hudbar is not yet initialized, its functions cannot be called.");
		}
		else if (value != currentValues[type]) {
			var	percent = value / maxPointValues[type],
			 	targetWidth = (barWidths[type] - barFrameOffsets[type]) * percent,
				containerNode = barContainerNodes[type],
				segmentDelay = 80, i, isAddition = false;

			currentValues[type] = value;

			for (i = 0; i < 500; i++) { // Cap at 500 iterations
				var lastUnremovedInfo = getLastChildNodeWithoutClass(containerNode, 'marked-for-anim-exit');

				if (currentFrameWidths[type] < targetWidth) {
					var lastUnremovedNode = lastUnremovedInfo.node;
					var newSegment = barSegmentSets[type][segmentCounts[type] % barSegmentSets[type].length].cloneNode(true);
					
					newSegment.setStyle("left", barAnimationOffsets[type] + currentFrameWidths[type]);

					if (doAnimate) {
						Aeto2DUtil.hideAndDelayAnimClass(newSegment, "anim-enter", frameCount, i * segmentDelay)
					}
					
					lastUnremovedNode.insert(newSegment, "after");

					currentFrameWidths[type] += parseInt(newSegment.getComputedStyle("width"));
					segmentCounts[type]++;

					if (currentFrameWidths[type] >= targetWidth) {
						isAddition = true;
						
						if (i > 0) queueBarAnimation(newSegment);

						break;
					}
				}
				else if (currentFrameWidths[type] > targetWidth) {
					var removedNode = lastUnremovedInfo.node,
						removalIdx = lastUnremovedInfo.idx,
						newWidth = currentFrameWidths[type] - parseInt(removedNode.getComputedStyle("width"));

					if (newWidth > targetWidth) {
						currentFrameWidths[type] = newWidth;
						segmentCounts[type]--;

						if (doAnimate) {
							Aeto2DUtil.delayedRemoveNodeAfterAnimation(removedNode, "anim-enter", "anim-exit", frameCount, i * segmentDelay)
						}
						else {
							removedNode.remove();
						}
					}

					var nextRemovedNode = containerNode.get('children').slice(removalIdx - 1).item(0);

					if (currentFrameWidths[type] - parseInt(nextRemovedNode.getComputedStyle("width")) < targetWidth)  {
						if (i > 0) queueBarAnimation(removedNode);

						break;
					}
				}
			}

			var barAnimateDistance = (barWidths[type] - barFrameOffsets[type]) * (1 - percent);

			if (doAnimate) {
				if (i > 1) {
					queueFlatAnimation(barFrames[type], "margin-left", -barAnimateDistance, i * segmentDelay);
					queueFlatAnimation(barContainerNodes[type], "margin-left", barAnimateDistance, i * segmentDelay);
					queueFlatAnimation(barAfterFxBars[type], "margin-left", -barAnimateDistance, i * segmentDelay);
				
					barFrames[type].setStyle("margin-left", 0);
					barContainerNodes[type].setStyle("margin-left", 0);
					Aeto2DUtil.animateNodeNumber(numberNodes[type], value, i * segmentDelay, true, false);

					if (barFrames[type].hasClass("anim-cycle") && !barFrames[type].hasClass("marked-for-uncycle")) {
						uncyclePointOfType(type);
					}
				}
				else {
					barFrames[type].setStyle("margin-left", -barAnimateDistance);
					barContainerNodes[type].setStyle("margin-left", barAnimateDistance);
					barAfterFxBars[type].setStyle("margin-left", -barAnimateDistance);
					
					Aeto2DUtil.animateNodeNumber(numberNodes[type], value, 350, true, false);
				}

				if (isAddition) {
					barAfterFxBars[type].setStyle("margin-left", -barAnimateDistance);
					barAfterFxBars[type].addClass("light");
					barAfterFxBars[type].removeClass("dark");
				}
				else {
					barAfterFxBars[type].addClass("dark");
					barAfterFxBars[type].removeClass("light");
				}


			}
			else {
				barFrames[type].setStyle("margin-left", -barAnimateDistance);
				barContainerNodes[type].setStyle("margin-left", barAnimateDistance);
				barAfterFxBars[type].setStyle("margin-left", -barAnimateDistance);

				numberNodes[type].set("textContent", value);
			}
		}

		function queueBarAnimation(node) {
			if (doAnimate) {
				var animEvent = Aeto2DUtil.animationEventEnd(),
					animCount = 0,
					currentAnimationName = "";


				animEvent && node.getDOMNode().addEventListener(animEvent, function(e) {
					if (e.animationName != currentAnimationName) {
						currentAnimationName = e.animationName;
						animCount++;

						if (animCount == frameCount) {
							animateQueueItem(barFrames[type]);
							animateQueueItem(barContainerNodes[type]);
							
							if (animateQueueItem(barAfterFxBars[type]) && isCycling[type]) {
								cyclePointOfType(type);
							}
						}
					}
				});
			}
		}
	}

	function queueFlatAnimation(node, style, value, time) {
		// Prevents delayed same-node animations from happening non-sequentially
		// and instead only animate the newest node animation at the latest animation time.
		// Since bar animations are intentionally not queued, and all segment logic regarding it can happen in parallel without issues,
		// this ensures that the final bar movement animation does not stack against each other since their non-sequential
		// animation cannot happen in parallel.
		// Very complicated, though not intentionally so; I'm a genius.
		var timeShift = new Date().getTime();

		if (animationFlatQueue[node] == null) {
			animationFlatQueue[node] = {s: style, v: value, t: time, tshift: timeShift, changed: 0};
		}
		else if (animationFlatQueue[node].t + animationFlatQueue[node].tshift > time + timeShift) {
			// If the time delay of the previous item exceeds the current item
			animationFlatQueue[node] = {s: style, v: value, t: animationFlatQueue[node].t, tshift: animationFlatQueue[node].tshift, changed: animationFlatQueue[node].changed};
		}
		else {			
			animationFlatQueue[node] = {s: style, v: value, t: time, tshift: timeShift, changed: animationFlatQueue[node].changed + 1};
		}
	}

	function animateQueueItem(node) {
		if (animationFlatQueue[node] != null) {
			if (animationFlatQueue[node].changed > 0) {
				animationFlatQueue[node].changed--;

				return false;
			}
			else {
				node.setStyle(animationFlatQueue[node].s, animationFlatQueue[node].v);
				animationFlatQueue[node] = null;

				return true;
			}
		}
	}

	this.addEffectItem = function(effect, doAnimate) {
		var lastUnremovedNode = effectNodes["containerNode"].get('children').slice(-1).item(0),
			newEffectNode = effectNodes["effectNode"].cloneNode(true);
		
		newEffectNode.setStyle("left", effectInfo["totalWidth"] + (effectInfo["count"] > 0 ? effectInfo["marginWidth"] * effectInfo["count"] : 0));

		newEffectNode.addClass(effect);
		
		if (doAnimate) {
			var animEvent = Aeto2DUtil.animationEventEnd(),
				handler = function(e) {
					newEffectNode.removeClass("anim-enter");
					newEffectNode.getDOMNode().removeEventListener(animEvent, handler);
				};
			
			animEvent && newEffectNode.getDOMNode().addEventListener(animEvent, handler);

			newEffectNode.addClass("anim-enter");
		}
		
		if (lastUnremovedNode != null)
			lastUnremovedNode.insert(newEffectNode, "after");
		else 
			effectNodes["containerNode"].appendChild(newEffectNode);

		effectInfo["totalWidth"] += parseInt(newEffectNode.getComputedStyle("width"));
		effectInfo["count"]++;

		effectNodes["barFrame"].setStyle("width", effectInfo["totalWidth"] + effectInfo["marginWidth"] * effectInfo["count"] + 10);
	}

	this.removeEffectItem = function(effect, doAnimate) {
		effectNodes["containerNode"].get('children').each(function(thisNode) {
			if (thisNode.hasClass(effect)) {
				if (doAnimate) {
					var animEvent = Aeto2DUtil.animationEventEnd();

					thisNode.addClass("anim-exit");

					animEvent && thisNode.getDOMNode().addEventListener(animEvent, function(e) {
						effectInfo["count"]--;

						thisNode.remove();

						recomputeEffectWidths();
					});
				}
				else {
					thisNode.remove();
				}
			}
		});

		function recomputeEffectWidths() {
			var effectList = effectNodes["containerNode"].get('children');

			effectInfo["totalWidth"] = 0;

			for (var i = 0; i < effectInfo["count"]; i++) {
				effectList.item(i).setStyle("left", effectInfo["totalWidth"] + (i > 0 ? effectInfo["marginWidth"] * i : 0))

				effectInfo["totalWidth"] += parseInt(effectList.item(i).getComputedStyle("width"));
			}

			effectNodes["barFrame"].setStyle("width", effectInfo["totalWidth"] + effectInfo["marginWidth"] * effectInfo["count"] + 10);
		}
	}

	function getLastChildNodeWithoutClass(parentNode, classToCheck) {
		var removalIdx = -1;
		var lastUnremovedNode = parentNode.get('children').slice(removalIdx).item(0);

		if (lastUnremovedNode != null) {
			while (lastUnremovedNode.hasClass(classToCheck)) {
				removalIdx--;
				lastUnremovedNode = parentNode.get('children').slice(removalIdx).item(0);
			}
		}

		return {node: lastUnremovedNode, idx: removalIdx};
	}

	this.setAlliance = function(alliance) {
		hudbarNode.addClass(alliance + "-team");
	}

	this.cyclePortrait = function() {
		hudbarNode.addClass("cycle-portrait")
	}

	this.uncyclePortrait = function () {
		hudbarNode.removeClass("cycle-portrait")
	}
}

// Support Object

function PointSegmentAttributeNode(templateNode) {
	this.node = templateNode.cloneNode(true);
	this.dom = this.node.getDOMNode()
	// this.contentDom = this.node.one('.turn-segment-content').getDOMNode();
	// this.dividerDomLeft = this.node.one('.segment-divider.left').getDOMNode();
	// this.dividerDomRight = this.node.one('.segment-divider.left').getDOMNode();
}