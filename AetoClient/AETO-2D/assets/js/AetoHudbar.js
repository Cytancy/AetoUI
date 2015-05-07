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
		maxSegmentCounts = {}, currentValueAppearances = {},
		regenNodes = {}, effectNodes = {}, effectInfo = {}, isCycling = {},
		segmentNodes = {}, updateValueAppearance = {},
		initialMargin, initialBottom;

	this.GUID = GUID;
	initialized = false;

	this.initialize = function() {
		if (!initialized) {
			initialized = true;

		    var requestId = A.io('AetoClient/AETO-2D/assets/html/AetoHudbar.html').id;

		    A.on('io:complete', setup);
		}
		else {
			throw new Error(errorHeader +  ": Hudbar is already initialized, cannot be initialized again.");
		}

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
			var segmentNode = hudbarNode.one("." + type + "-frame .segment-container"),	
				timelineValues = {},
				lastUnremovedNode;

			setupSegmentValues();
			setupBackSegments();
			setupTimelineValues();
			setupGeneralSegments();

			function setupSegmentValues() {
				barContainerNodes[type] = segmentNode.one(".segment-measurer");
				barWidths[type] = parseInt(hudbarNode.one("." + type + "-frame").getComputedStyle("width")) - parseInt(segmentNode.getStyle("left"));
				barFrames[type] = hudbarNode.one("." + type + "-frame .bar-subframe");
				barAfterFxBars[type] = hudbarNode.one("." + type + "-frame .bar-after-fx-bg");
				barFrameOffsets[type] = parseInt(barFrames[type].getStyle("left"));
				numberNodes[type] = hudbarNode.one(".bar-value." + type + " .bar-val.first");
				maxNumberNodes[type] = hudbarNode.one(".bar-value." + type + " .bar-val.second");
				currentFrameWidths[type] = 0, currentValues[type] = 0, 
				currentValueAppearances[type] = {val: 0},
				barSegmentSets[type] = [];

				barContainerNodes[type].get("children").each(function(thisNode) {
					barSegmentSets[type].push(thisNode.cloneNode(true));

					thisNode.remove();
				});
			}

			function setupBackSegments() {
				segmentCounts[type] = 0;
				barAnimationOffsets[type]  = 0;

				// Set up back segments for cycling
				for (var i = 0; i < barSegmentSets[type].length * 3; i++) {
					var newSegment = barSegmentSets[type][i % barSegmentSets[type].length].cloneNode(true);
					
					barContainerNodes[type].appendChild(newSegment);
					newSegment.setStyle("left", barAnimationOffsets[type] );
					barAnimationOffsets[type] += parseInt(newSegment.getComputedStyle("width"));
				}

				barContainerNodes[type].setStyle("left", -barAnimationOffsets[type]);
			}

			function setupGeneralSegments() {
				segmentNodes[type] = [];

				while (currentFrameWidths[type] < (barWidths[type] - barFrameOffsets[type])) {
					var newSegment = (barSegmentSets[type][segmentCounts[type] % barSegmentSets[type].length]).clone(true);
					
					newSegment.setStyle("left", barAnimationOffsets[type] + currentFrameWidths[type]);
					
					lastUnremovedNode.insert(newSegment, "after");
					lastUnremovedNode = newSegment;

					var attribSegmentNode = new PointSegmentAttributeNode(newSegment);

					currentFrameWidths[type] += parseInt(attribSegmentNode.width);

					setupTimelineForNode(attribSegmentNode);

					segmentCounts[type]++;
					segmentNodes[type].push(attribSegmentNode);
				}

				maxSegmentCounts[type] = segmentCounts[type];
				segmentCounts[type] = 0;
				currentFrameWidths[type] = 0;
			}

			function setupTimelineValues() {
				lastUnremovedNode = barContainerNodes[type].get('children').slice(-1).item(0);

				timelineValues[type] = {};

				switch(type) {
					case "tp":
						timelineValues[type]['fillHeight'] = parseInt(lastUnremovedNode.one('.segment-fill').getComputedStyle('height'));
						break;
					case "hp":
						// _this.setHP(currentValues[type], doAnimate);
						break;
					case "ep":
						// _this.setEP(currentValues[type], doAnimate);
						break;
				}
			}

			function setupTimelineForNode(attribNode) {
				var entryTimeline = new TimelineMax({paused: true});

				entryTimeline.fromTo(attribNode.dom, .01, {
					visibility: 'hidden'
				}, {
					visibility: 'visible'
				}, 0);

				switch(type) {
					case "tp":
						var fillDom = attribNode.node.one('.segment-fill').getDOMNode(),
							cubeDom = attribNode.node.one('.cube').getDOMNode(),
							isDark = attribNode.node.hasClass('dark');

						
						entryTimeline.from(fillDom, .65, {
							y: ((isDark) ? -1 : 1 ) * (timelineValues[type]['fillHeight'] + 6),
							ease: Back.easeOut.config(1.5)
						}, 0);

						entryTimeline.from(cubeDom, .55, {
							rotationY: ((isDark) ? -1 : 1 ) * 90,
							ease: Power2.easeInOut
						}, .45);
						break;
					case "hp":
						var chevronNodes = attribNode.node.all('.chevron-segment'),
							chevronDom = [chevronNodes.item(0).getDOMNode(), chevronNodes.item(1).getDOMNode()];

						entryTimeline.from(chevronDom[0], .65, {
							x: '-60%',
							y: '150%',
							ease: Back.easeOut.config(1.5)
						}, 0);

						entryTimeline.from(chevronDom[1], .65, {
							x: '-60%',
							y: '-150%',
							ease: Back.easeOut.config(1.5)
						}, .5);

						entryTimeline.from(chevronDom[0], .45, {
							skewX: 65,
							ease: Back.easeOut.config(1.5)
						}, 1.15);

						entryTimeline.from(chevronDom[1], .45, {
							skewX: -65,
							ease: Back.easeOut.config(1.5)
						}, 1.15);
						
						break;
					case "ep":
						var slantDom = attribNode.node.one('.slant-segment').getDOMNode(),
							isDark = attribNode.node.hasClass('dark');

						entryTimeline.from(slantDom, 1.55, {
							rotation: 40,
							x: (isDark) ? '-355%' : '355%', 
							y: (isDark) ? '50%' : '-50%',
							ease: Back.easeOut.config(6)
						}, 0);

						entryTimeline.from(slantDom, .25, {
							scaleX: .7,
							ease: Power2.easeInOut
						}, 1.45);

						break;
				}

				attribNode.attachTimeline(entryTimeline);
			}
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
				segmentDelay = .08, i, isAddition = false,
				barSpeed = .85,
				barDelay,
				changeIndex = 0;

			currentValues[type] = value;

			if (currentFrameWidths[type] < targetWidth) {
				while (currentFrameWidths[type] < targetWidth) {
					var newNode = segmentNodes[type][segmentCounts[type]];

					TweenMax.killDelayedCallsTo(newNode.enter);
					TweenMax.killDelayedCallsTo(newNode.exit);

					if (doAnimate) {
						TweenMax.delayedCall(changeIndex * segmentDelay, newNode.enter, [doAnimate]);
					}
					else {
						newNode.enter();
					}

					currentFrameWidths[type] += newNode.width;

					changeIndex++;

					segmentCounts[type]++;

					if (barDelay == null) barDelay = newNode.timelineTime;
				}

				isAddition = true;
			}
			else if (currentFrameWidths[type] > targetWidth) {
				while (currentFrameWidths[type] > targetWidth) {
					var nodeToRemove = segmentNodes[type][segmentCounts[type] - 1];

					if ((currentFrameWidths[type] - nodeToRemove.width) > targetWidth) {
						TweenMax.killDelayedCallsTo(nodeToRemove.enter);
						TweenMax.killDelayedCallsTo(nodeToRemove.exit);

						if (doAnimate) {
							TweenMax.delayedCall(changeIndex * segmentDelay, nodeToRemove.exit, [doAnimate]);
						}
						else {
							nodeToRemove.exit();
						}

						currentFrameWidths[type] -= nodeToRemove.width;

						changeIndex++;

						segmentCounts[type]--;

						if (barDelay == null) barDelay = nodeToRemove.timelineTime;
					}
					else {
						break;
					}
				}
			}

			var barAnimateDistance = (barWidths[type] - barFrameOffsets[type]) * (1 - percent);

			if (doAnimate && changeIndex > 0) {
				var postSegmentDelay =  changeIndex * segmentDelay + barDelay * .75;

				TweenMax.killTweensOf(barFrames[type].getDOMNode(), {x: true});
				TweenMax.killTweensOf(barContainerNodes[type].getDOMNode(), {x: true});
				TweenMax.killTweensOf(barAfterFxBars[type].getDOMNode(), {x: true});
				TweenMax.killTweensOf(currentValueAppearances[type], {val: true});

				TweenMax.to(barFrames[type].getDOMNode(), barSpeed, {
					x: -barAnimateDistance,
					ease: Back.easeOut.config(2),
					delay: (isAddition) ? 0 : postSegmentDelay
				});

				TweenMax.to(barContainerNodes[type].getDOMNode(), barSpeed, {
					x: barAnimateDistance,
					ease: Back.easeOut.config(2),
					delay: (isAddition) ? 0 : postSegmentDelay
				});

				TweenMax.to(barAfterFxBars[type].getDOMNode(), barSpeed, {
					x: -barAnimateDistance,
					ease: Back.easeOut.config(2),
					delay: (isAddition) ? 0 : postSegmentDelay
				});

				if (isAddition) {
					barAfterFxBars[type].addClass("light");
					barAfterFxBars[type].removeClass("dark");
				}
				else {
					barAfterFxBars[type].addClass("dark");
					barAfterFxBars[type].removeClass("light");
				}

				// Aeto2DUtil.animateNodeNumber(numberNodes[type], value, i * segmentDelay, true, false);

				// Add shaking
				TweenMax.to(currentValueAppearances[type], postSegmentDelay + barSpeed, {
					val: value,
					roundProps: 'val',
					ease: Linear.easeNone,
					onUpdate: function() {
						numberNodes[type].set('textContent', currentValueAppearances[type].val);
					}
				});
			}
			else {
				TweenMax.set(barFrames[type].getDOMNode(), {
					x: -barAnimateDistance,
				});

				TweenMax.set(barContainerNodes[type].getDOMNode(), {
					x: barAnimateDistance,
				});

				TweenMax.set(barAfterFxBars[type].getDOMNode(), {
					x: -barAnimateDistance,
				});

				numberNodes[type].set("textContent", value);
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

function PointSegmentAttributeNode(node) {
	this.node = node;
	this.dom = this.node.getDOMNode();
	this.width = parseInt(this.node.getComputedStyle('width'));
	this.onComplete = null;
	// this.contentDom = this.node.one('.turn-segment-content').getDOMNode();
	// this.dividerDomLeft = this.node.one('.segment-divider.left').getDOMNode();
	// this.dividerDomRight = this.node.one('.segment-divider.left').getDOMNode();
}

PointSegmentAttributeNode.prototype.attachTimeline = function(timeline) {
	var _this = this;

	this.entryTimeline = timeline;
	this.timelineTime = timeline.totalDuration();

	this.enter = function(doAnimate) {
		if (doAnimate) {
			_this.entryTimeline.play();
		}
		else {
			_this.entryTimeline.play(this.timelineTime);
		}
	}

	this.exit = function(doAnimate) {
		if (doAnimate) {
			_this.entryTimeline.reverse();
		}
		else {
			_this.entryTimeline.reverse(-this.timelineTime);
		}
	}
}