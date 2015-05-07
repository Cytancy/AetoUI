"use strict";

AetoUtil.callMeMaybe(AetoBattleMenu);

function AetoBattleMenu(A, GUID, parentNode, parameters) {
	var DEFAULT_START_POINT_X = 0.22,
		DEFAULT_END_POINT_X = 0.78,
		DEFAULT_CP1_X = 0.35,
		DEFAULT_CP2_X = 0.65,
		DEFAULT_MAX_Y = 0.32,
		DEFAULT_MIN_Y = 0.17,
		DEFAULT_DISTANCE_MODIFIER = 1.3,
		DEFAULT_ANGLE_BOOST_RATIO = 0.25,
		DEFAULT_ANGLE_BOOST_MODIFIER = 0.65,
		DEFAULT_ANGLE_MEAN = Math.PI / 25,
		DEFAULT_MIDPOINT_DISTANCE_RATIO = 0.15,
		DEFAULT_CURVE_ANIM_SMOOTHNESS = 8;

	var _this = this,
		errorHeader = "Error (AETO-2D | Battle Menu)[" + GUID + "]",
		initialized = false,
		win, actingBezier,
		battleMenuContainerNode, battleMenuItemNode, battleMenuPulseNode,
		bodyNode, clientWidth, clientHeight, itemProperties;

	this.GUID = GUID;

	this.initialize = function() {
		if (!initialized) {
			initialized = true;
			win = A.one(window);

			Aeto2DUtil.loadNode('AetoClient/AETO-2D/assets/html/AetoBattleMenu.html', function(node) {
				battleMenuContainerNode = node;
				battleMenuContainerNode.addClass(GUID);

				var initialBattleMenuPulseNode = battleMenuContainerNode.one('.aeto-battle-menu-selection-pulse-set');
				battleMenuPulseNode = initialBattleMenuPulseNode.cloneNode(true);
				initialBattleMenuPulseNode.remove();

				parentNode.appendChild(battleMenuContainerNode);

				initializeItemProperties()
				initializeBezier();

				_this.callback('ready', GUID);
			});

			A.augment(_this, A.EventTarget);

		}
		else {
			throw new Error(errorHeader +  ": Battle menu is already initialized, cannot be initialized again.");
		}

		function initializeBezier() {
			var bodyNode = A.one("body"),
				startPointX = DEFAULT_START_POINT_X,
				endPointX = DEFAULT_END_POINT_X,
				cp1X = DEFAULT_CP1_X,
				cp2X = DEFAULT_CP2_X,
				maxY = DEFAULT_MAX_Y,
				minY = DEFAULT_MIN_Y,
				angleBoostRatio = DEFAULT_ANGLE_BOOST_RATIO,
				angleBoostModifier = DEFAULT_ANGLE_BOOST_MODIFIER,
				angleMean = DEFAULT_ANGLE_MEAN,
				distanceModifier = DEFAULT_DISTANCE_MODIFIER,
				midpointDistanceModifier = DEFAULT_MIDPOINT_DISTANCE_RATIO;

			updateBezier();

			win.on('resize', updateBezier);

			function updateBezier() {
				clientWidth = bodyNode.get("winWidth");
				clientHeight = bodyNode.get("winHeight");

				var startPoint = {x: clientWidth / 2, y: clientHeight / 2};

				// var startNode = A.Node.create('<div class="test-object-3"></div');

				// parentNode.appendChild(startNode);
				// startNode.setStyle('left', startPoint.x);
				// startNode.setStyle('bottom', startPoint.y);

				actingBezier = new Aeto2DUtil.Bezier({x: clientWidth * startPointX, y: clientHeight * maxY},
													 {x: clientWidth * cp1X, y: clientHeight * minY},
													 {x: clientWidth * cp2X, y: clientHeight * minY},
													 {x: clientWidth * endPointX, y: clientHeight * maxY});
			}

			function xyToLeftBottom(point) {
				return {left: point.x, bottom: point.y};
			}
		}

		function initializeItemProperties() {
			var initialBattleMenuItemNode = battleMenuContainerNode.one('.aeto-battle-menu-item');
			
			itemProperties = {};

			itemProperties['iconWidth'] = parseInt(initialBattleMenuItemNode.one('.content-icon').getComputedStyle('width'));
			itemProperties['iconHeight'] = parseInt(initialBattleMenuItemNode.one('.content-icon').getComputedStyle('height'));

			battleMenuItemNode = initialBattleMenuItemNode.cloneNode(true);
			initialBattleMenuItemNode.remove();
		}
	}

	this.openMenuList = function(startPoint, rootMenuSet) {
		var bodyNode = A.one("body"),
			startPointX = DEFAULT_START_POINT_X,
			endPointX = DEFAULT_END_POINT_X,
			cp1X = DEFAULT_CP1_X,
			cp2X = DEFAULT_CP2_X,
			maxY = DEFAULT_MAX_Y,
			minY = DEFAULT_MIN_Y,
			angleBoostRatio = DEFAULT_ANGLE_BOOST_RATIO,
			angleBoostModifier = DEFAULT_ANGLE_BOOST_MODIFIER,
			angleMean = DEFAULT_ANGLE_MEAN,
			distanceModifier = DEFAULT_DISTANCE_MODIFIER,
			midpointDistanceModifier = DEFAULT_MIDPOINT_DISTANCE_RATIO,
			curveAnimSmoothness = DEFAULT_CURVE_ANIM_SMOOTHNESS,
			setDelay = 0.1;

		var level = 0;

		// var node = A.Node.create('<div class="test-object2"></div');

		// 	parentNode.appendChild(node);
		// 	node.setStyle('left', initialPoint.x);
		// 	node.setStyle('bottom', initialPoint.y);

		generateItemNodes(startPoint, rootMenuSet);

		
		function generateItemNodes(initialPoint, menuSet) {
			level++;

			var totalTimeline = new TimelineMax({paused: true}),
				isRoot = (menuSet.backReference == null);

			initializePoints(menuSet.set);
		
			win.on('resize', function() {
				initializePoints(menuSet.set);
			});
	
			var setLength = menuSet.set.length;

			for (var idx = 0; idx < setLength; idx++) {
				var indexedItem = menuSet.set[idx],
					itemNode, tabNode,
					itemKey = AetoUISettings.keyboardConfigurations.menuItemKeys[idx];

				setupProperties();
				setupStyle();
				setupAnim();
			}

			totalTimeline.play();
			menuSet.initialized = true;
	
			function setupProperties() {
					console.log(indexedItem.type );

				if (indexedItem.type == BattleMenuItemTypes.RETURN) {
					itemKey = AetoUISettings.keyboardConfigurations.menuItemReturnKey;
				}

				if (indexedItem.win == null) indexedItem.attachWin(win);

				if (indexedItem.node != null) {
					itemNode =  menuSet.set[idx].node;
				}
				else {
					var thisItem = battleMenuItemNode.cloneNode(true);

					itemNode = thisItem;

					battleMenuContainerNode.appendChild(itemNode);
					indexedItem.attachNode(itemNode);
				}

				tabNode = itemNode.one('.shortcut-tab');
			}

			function setupStyle() {
				var keyText = itemKey,
					thisBattleItem = indexedItem,
					thisItem = itemNode;

				if (!isNaN(keyText)) {
					keyText = String.fromCharCode(keyText);
				}
				// Will need to update key numbers on menu item removal
				itemNode.one('.shortcut-value').set('textContent', keyText);

				if (thisBattleItem.icon != null) {
					Aeto2DUtil.loadSVGIcon(thisBattleItem.icon, function(svgNodes) {
						for (var i = 0; i < svgNodes.length; i++) {
							svgNodes[i].setStyle('width', itemProperties['iconWidth']);
							svgNodes[i].setStyle('height', itemProperties['iconHeight']);
							svgNodes[i].setStyle('zIndex', i + 1);

							thisItem.one('.content-icon').appendChild(svgNodes[i]);
						}
					});
				}
			}

			function setupAnim() {
				var itemDom = itemNode.getDOMNode(),
					tabDom = tabNode.getDOMNode(),
					pathDom = itemNode.one('.item-bg-line .path').getDOMNode(),
					gradientDom = itemNode.one('.item-gradient').getDOMNode(),
					itemBgArrowNodes = itemNode.all('.item-bg-arrow'),
					itemBgArrowDoms = [itemBgArrowNodes.item(0).getDOMNode(), itemBgArrowNodes.item(1).getDOMNode()],
					entryTimeline = new TimelineMax(),
					thisItem = indexedItem,
					thisNode = itemNode,
					thisItemKey = itemKey;

				itemNode.addClass(level);

				if (thisItem.width == null) thisItem.width = parseInt(itemNode.getStyle('width'));
				if (thisItem.height == null) thisItem.height = parseInt(itemNode.getStyle('height'));
				if (thisItem.bottom == null) thisItem.bottom = parseInt(tabNode.getStyle('bottom'));

				setupEntry();
				setupInteraction();
				setupResize();

				function setupInteraction() {
					var hoverTimeline = new TimelineMax({paused: true}),
						bottomArrowNodes = itemNode.all('.item-content-arrow'),
						thisIdx = idx,
						thisItemNode = itemNode,
						thisMenuItem = menuSet.set[thisIdx];

					setupHoverTimeline();
					setupInputs();

					function setupInputs() {
						if (!thisMenuItem.handlersAttached()) {
							var hoverOnHandler = function() {
								if (!thisItem.hoverReady) {
									thisItem.setHoverReady(true);

									// TweenMax.killTweensOf(tabDom, {bottom: true});
									// entryTimeline.kill({bottom: true});
									hoverTimeline.play(.45);
								}
								else {
									hoverTimeline.play();
								}
								},
								hoverOffHandler = function() {

									hoverTimeline.reverse();
								},
								selectHandler = function(e) {
									menuSet.detachAll();

									createPulseAt({x: thisMenuItem.dom._gsTransform.x, y: thisMenuItem.dom._gsTransform.y});
									
									TweenMax.delayedCall(.15, function() {
										createPulseAt({x: thisMenuItem.dom._gsTransform.x, y: thisMenuItem.dom._gsTransform.y}, true);
									});

									// console.log(thisMenuItem.dom._gsTransform);

									if (thisMenuItem.childSet != null) {
										if (!thisMenuItem.childSet.initialized) {
											thisMenuItem.childSet.add(new BattleMenuItem({name: "return", type: BattleMenuItemTypes.RETURN}));
										}

										generateSelectionTimeline().play();

										generateItemNodes(thisMenuItem.u, thisMenuItem.childSet);
									}
									else {
										switch (thisMenuItem.type) {
											case BattleMenuItemTypes.RETURN:
												generateExitTimeline().play();
												generateReturnTimeline().play();

												menuSet.parentItem.runReturn();

												break;
										}
									}
								};

							thisMenuItem.attachHandlers(hoverOnHandler, hoverOffHandler, selectHandler, thisItemKey);

							thisMenuItem.onReturn(function() {
								menuSet.reattachAll();
								console.log("???");
								thisMenuItem.hoverOffHandler();
							});
						}
						else {
							thisMenuItem.reattachHandlers();
						}
					}

					function generateExitTimeline() {
						var exitTimeline = new TimelineMax({paused: true});

						for (var jdx = 0; jdx < menuSet.set.length; jdx++) {
							var initialU = menuSet.set[jdx].u,
								uDistance = 1.25 - initialU,
								animSegment = uDistance / (curveAnimSmoothness - 1),
								pointSet = [];

							for (var kdx = 0; kdx < curveAnimSmoothness; kdx++) {
								var uStep = initialU + kdx * animSegment,
									pointStep = invertAndCenter({x: actingBezier.mx(uStep), y: actingBezier.my(uStep)}, thisItem.width, thisItem.height);

								pointSet.push(pointStep);
							}

							TweenMax.killTweensOf(menuSet.set[jdx].dom, {x: true, y: true, autoAlpha: true, opacity: true, visibility: true});

							exitTimeline.fromTo(menuSet.set[jdx].dom, .65, {
								x: pointSet[0].x,
								y: pointSet[0].y
							}, {
								bezier: {
									type:"thru", 
									values: pointSet, 
									curviness: 1.75,
									autoRotate: (uDistance < 0) ? ["x", "y", "rotation", 180, false] : ["x", "y", "rotation", 0, false]
								},
								autoAlpha: 0,
								ease: Power2.easeInOut
							}, 0);
						}

						return exitTimeline;
					}

					function generateReturnTimeline() {
						var returnTimeline = new TimelineMax({paused: true}),
							parentSet = menuSet.backReference.set;

						initializePoints(parentSet);

						for (var jdx = 0; jdx < parentSet.length; jdx++) {
							TweenMax.killTweensOf(parentSet[jdx].dom, {bottom: true, opacity: true, scale: true, visibility: true});

							returnTimeline.fromTo(parentSet[jdx].dom, .55, {
								visibility: 'visible'
							}, {
								bottom: 0,
								opacity: 1,
								scale: 1,
								visibility: 'visible',
								ease: Power2.easeInOut
							}, 0);
						}

						return returnTimeline;
					}

					function generateSelectionTimeline() {
						var selectionTimeline = new TimelineMax({paused: true});

						thisMenuItem.childSet.addBackReference(menuSet);

						for (var jdx = 0; jdx < menuSet.set.length; jdx++) {
							if (jdx != thisIdx) {
								// Make unselectable
								selectionTimeline.fromTo(menuSet.set[jdx].node.getDOMNode(), 1.15, {
									pointerEvents: "none",
									clearProps: "pointerEvents"
								}, {
									pointerEvents: "none",
									bottom: 100,
									autoAlpha: 0,
									ease: Power2.easeOut,
									clearProps: "pointerEvents"
								}, jdx * setDelay);
							}
							else {
								TweenMax.killTweensOf(menuSet.set[jdx].dom, {opacity: true, scale: true});

								selectionTimeline.fromTo(menuSet.set[jdx].dom, 1.15, {
									pointerEvents: "none",
									clearProps: "pointerEvents"
								}, {
									pointerEvents: "none",
									scale: 2,
									autoAlpha: 0,
									ease: Power2.easeInOut,
									clearProps: "pointerEvents"
								}, 0);
							}
						}

						return selectionTimeline;
					}

					function setupHoverTimeline() {
						hoverTimeline.fromTo(tabDom, 0.55, {
							bottom: thisItem.bottom,
						}, {
							bottom: '25%',
							ease: Back.easeInOut.config(2)
						}, 0);

						hoverTimeline.to(itemNode.one('.item-bg-line').getDOMNode(), 0.35, {
							scale: 1.08,
							ease: Power2.easeInOut
						}, 0);

						hoverTimeline.to(bottomArrowNodes.item(0).getDOMNode(), 0.45, {
							rotation: 45,
							transformOrigin:"center top",
							ease: Back.easeInOut.config(1.7)
						}, 0);

						hoverTimeline.to(bottomArrowNodes.item(1).getDOMNode(), 0.45, {
							rotation: -45,
							transformOrigin:"center top",
							ease: Back.easeInOut.config(1.7)
						}, 0);

						hoverTimeline.to(itemBgArrowDoms[0], 0.45, {
							rotation: -45,
							transformOrigin:"center bottom",
							ease: Back.easeInOut.config(1.7)
						}, 0);

						hoverTimeline.to(itemBgArrowDoms[1], 0.45, {
							rotation: 45,
							transformOrigin:"center bottom",
							ease: Back.easeInOut.config(1.7)
						}, 0);

						hoverTimeline.to(gradientDom, 0.45, {
							height: '100%',
							ease: Power2.easeInOut
						}, 0);
					}
				}

				function setupResize() {
					var thisDom = itemDom,
						thisIdx = idx;

					win.on('resize', function() {
						var newPoint = invertAndCenter(menuSet.set[thisIdx].point, thisItem.width, thisItem.height);

						TweenMax.to(thisDom, 1, {
							x: newPoint.x,
							y: newPoint.y,
							delay: AetoUtil.clamp(1.4 - entryTimeline.time(), 0, 10)
						});
					});
				}

				function setupEntry() {
					var itemContentBgDom = itemNode.one('.item-content-bg'),
						inverseIdx = setLength - idx - 1;

					thisItem.setHoverReady(false);

					if (isRoot && menuSet.initialized == false) {
						var angle = Aeto2DUtil.angleBetweenPoints(initialPoint, menuSet.set[idx].point),
				  	 		angleDistance = Math.abs(angle) - Math.PI / 2,
				  	 		vectorDistance = Aeto2DUtil.distanceBetweenPoints(initialPoint, menuSet.set[idx].point) * distanceModifier,
							angleBoost = angleBoostRatio * angleDistance,
							normalizedAngleBoost = Math.pow(angleMean / Math.abs(angleBoost), angleBoostModifier) * angleBoost,
							boostedAngle = angle - normalizedAngleBoost,
							cpMagnitude = {x: vectorDistance * Math.cos(boostedAngle), y: vectorDistance * Math.sin(boostedAngle)},
							cp2 = {x: cpMagnitude.x + initialPoint.x,
								   y: cpMagnitude.y + initialPoint.y},
							cpMidpoint = {x: cpMagnitude.x / 2 + initialPoint.x,  y: cpMagnitude.y / 2 + initialPoint.y},
							newAngle = (angleDistance < 0) ? boostedAngle + Math.PI * 0.5 : boostedAngle - Math.PI * 0.5,
							cp2Distance = Aeto2DUtil.distanceBetweenPoints(initialPoint, cp2) * midpointDistanceModifier,
							cp1 = {x: cpMidpoint.x + Math.cos( newAngle ) * cp2Distance,
							  	   y: cpMidpoint.y + Math.sin(newAngle ) * cp2Distance};

						totalTimeline.add(entryTimeline, idx * setDelay);

						// Bezier Entrance
						entryTimeline.fromTo(itemDom, 2.3, {
								x: initialPoint.x,
								y: -initialPoint.y
							}, {
							bezier: {
								type:"thru", 
								values:[invertAndCenter(initialPoint, thisItem.width, thisItem.height), invertAndCenter(cp1, thisItem.width, thisItem.height), invertAndCenter(cp2, thisItem.width, thisItem.height), invertAndCenter(menuSet.set[idx].point, thisItem.width, thisItem.height)], 
								curviness: 1.75,
								autoRotate:["x", "y", "rotation", 0, false]
							}, 
							ease: Elastic.easeOut.config(1, 0.833)
						}, 0);

						// Item grow and fade in
						entryTimeline.from(itemDom, .4, {opacity: 0, display: "none"}, 0);
						entryTimeline.from(itemDom, .55, {scale: 0.2}, 0);

						// Correct item rotation
						entryTimeline.to(itemDom, 0.71, {
								rotation: (angleDistance < 0) ? '360deg' : '0deg',
								ease: Back.easeInOut.config(2)
						}, 1.6);

						// Rotate Tab Simultaneously
						entryTimeline.to(tabDom, 0.91, {
								rotation: (angleDistance < 0) ? '-360deg' : '360deg',
								ease: Back.easeInOut.config(1)
						}, 1.6);

						// Fade in the content background
						entryTimeline.from(itemNode.one('.item-content-bg').getDOMNode(), .6, {opacity: 0.3}, 1.8);

						// Scale in the frame 
						entryTimeline.from(itemNode.one('.item-bg-set').getDOMNode(), .8, {
							scale: 0.7,
							ease: Back.easeOut.config(1.5)
						}, 1.9);
						
						// Soften the content shadow
						entryTimeline.from(itemNode.one('.item-content').getDOMNode(), .6, {boxShadow: "0 0 3px 3px rgba(0, 0, 0, 0.15)"}, 1.9);

						// Pop out top tab
						entryTimeline.fromTo(tabDom, 0.55, {
							bottom: '15%'
						}, {
							bottom: thisItem.bottom,
							ease: Back.easeInOut.config(2.5),
							onComplete: function() {
								thisItem.setHoverReady(true);
							}
						}, 2.2);

						// Fade in the tab inner dark bg					
						entryTimeline.from(itemNode.one('.inner-bg').getDOMNode(), 0.45, {
							opacity: 0, 
							ease: Power2.easeInOut
						}, 2.5);

						// Fade drop shortcut key					
						entryTimeline.from(itemNode.one('.shortcut-value').getDOMNode(), .4, {
							opacity: 0,
							y: 20,
							ease: Power2.easeInOut
						}, 2.65);

						// Drop in the outer arrows
						entryTimeline.from(itemBgArrowDoms, .4, {
							opacity: 0,
							y: -10,
							ease: Power2.easeInOut
						}, 2.8);

						// Stroke and fade in the outer path

						entryTimeline.from(pathDom, .75, {
							strokeDashoffset: 258,
							ease: Power2.easeInOut
						}, 3.05);

						entryTimeline.from(pathDom, .35, {
							opacity: 0,
							ease: Power2.easeInOut
						}, 3.05);

						// Rotate fade in the mask
						entryTimeline.from(itemNode.one('.item-gradient-set').getDOMNode(), .85, {
							rotation: 180,
							ease: Power2.easeInOut
						}, inverseIdx * setDelay + 3.35);

						entryTimeline.from(gradientDom, .85, {
							opacity: 0,
							ease: Power2.easeInOut
						}, inverseIdx * setDelay + 3.5);
					}
					else {
						var uDistance = menuSet.set[idx].u - initialPoint;

						totalTimeline.add(entryTimeline, idx * setDelay);

						if (uDistance != 0) {
							var animSegment = uDistance / (curveAnimSmoothness - 1),
								pointSet = [];


							for (var jdx = 0; jdx < curveAnimSmoothness; jdx++) {
								var uStep = initialPoint + jdx * animSegment,
									pointStep = invertAndCenter({x: actingBezier.mx(uStep), y: actingBezier.my(uStep)}, thisItem.width, thisItem.height);

								pointSet.push(pointStep);
							}

							entryTimeline.fromTo(itemDom, 0.8, {
									pointerEvents: 'none'
								}, {
									pointerEvents: 'auto'
								}, 0);

							entryTimeline.fromTo(itemDom, 2, {
									x: pointSet[0].x,
									y: pointSet[0].y,
									visibility: 'visible'
								}, {
								bezier: {
									type:"thru", 
									values: pointSet, 
									curviness: 1.75,
									autoRotate: (uDistance < 0) ? ["x", "y", "rotation", 180, false] : ["x", "y", "rotation", 0, false]
								}, 
								visibility: 'visible',
								ease: Elastic.easeOut.config(1.00, 0.833)
							}, 0);
						}
						else {
							var startPoint = invertAndCenter(thisItem.point, thisItem.width, thisItem.height);

							entryTimeline.set(itemDom, 0, {
									rotation: 0,
									x: startPoint.x,
									y: startPoint.y,
									visibility: 'visible'
							});
						}

						// Item grow and fade in
						TweenMax.killTweensOf(itemDom, {opacity:true});

						entryTimeline.fromTo(itemDom, .35, {
							opacity: 0,
						}, {
							opacity: 1, 
						}, 0);

						// TweenMax.killTweensOf(itemDom, {scale: true});
						entryTimeline.fromTo(itemDom, .4, {
							scale: 0.2
						}, {
							scale: 1
						}, 0);

						// Fade in the content background
						entryTimeline.fromTo(itemNode.one('.item-content-bg').getDOMNode(), .4, {
							opacity: 0.3
						}, {
							opacity: 1,
							ease: Power2.easeInOut
						}, .45);

						// Scale in the frame 
						entryTimeline.fromTo(itemNode.one('.item-bg-set').getDOMNode(), .6, {
							scale: 0.7
						}, {
							scale: 1,
							ease: Back.easeOut.config(1.5)
						}, .45);

						// Drop in the outer arrows
						entryTimeline.fromTo(itemBgArrowDoms, .4, {
							opacity: 0,
							y: 10
						}, {
							opacity: 1,
							y: 0,
							ease: Power2.easeInOut
						}, .7);

						// Stroke and fade in the outer path
						entryTimeline.fromTo(pathDom, .65, {
							strokeDashoffset: 258,
						}, {
							strokeDashoffset: -8,
							ease: Power2.easeInOut
						}, .95);

						entryTimeline.fromTo(pathDom, .3, {
							opacity: 0,
						}, {
							opacity: 1,
							ease: Power2.easeInOut
						}, .95);

						// Fade in the mask
						entryTimeline.fromTo(gradientDom, .55, {
							opacity: 0
						}, {
							opacity: 1,
							ease: Power2.easeInOut
						}, inverseIdx * setDelay + .75);

						// Pop out top tab
						TweenMax.killTweensOf(tabDom, {bottom: true});
						entryTimeline.fromTo(tabDom, 0.45, {
							bottom: '15%'
						}, {
							bottom: thisItem.bottom,
							ease: Back.easeInOut.config(2.5),
							onComplete: function() {
								thisItem.setHoverReady(true);
							}
						}, inverseIdx * setDelay + .4);

						entryTimeline.to(itemDom, 0.85, {
								rotation: 0,
								ease: Back.easeInOut.config(2)
						}, inverseIdx * setDelay + 1.15);

						// entryTimeline.to(itemDom, 0.71, {
						// 		rotation: '0deg',
						// 		ease: Back.easeInOut.config(2)
						// }, 1.6);

						// entryTimeline.to(tabDom, 0.91, {
						// 		rotation: (angleDistance < 0) ? '-360deg' : '360deg',
						// 		ease: Back.easeInOut.config(1)
						// }, 1.6);

						// console.log(initialPoint);
						// {x: actingBezier.mx(uVal), y: actingBezier.my(uVal)}
						// console.log(menuSet.set[idx].u);
					}
				}
			}
		}

		function initializePoints(list) {
			var numItems = list.length;

			for (var idx = 0; idx < numItems; idx++) {
				var uVal = idx / (numItems - 1);

				list[idx].attachPoint({x: actingBezier.mx(uVal), y: actingBezier.my(uVal)});
				list[idx].attachU(uVal);

				if (list[idx].childSet != null) {
					initializePoints(list[idx].childSet.set);
				}
			}
		}

		function invertAndCenter(point, width, height) {
			return {x: point.x - width / 2, y: -point.y + height / 2};
		}
	}

	function createPulseAt(point, isSoft) {
		var pulseNode = battleMenuPulseNode.cloneNode(true),
			pulseDom = pulseNode.getDOMNode(),
			whiteDom = pulseNode.one('.pulse.white').getDOMNode(),
			colorDom = pulseNode.one('.pulse.color').getDOMNode(),
			pulseTimeline = new TimelineMax({paused: true});
		
		battleMenuContainerNode.appendChild(pulseNode);

		if (_this.pulseDimensions == null) {
			_this.pulseDimensions = {
				height: parseInt(pulseNode.getStyle('height')),
				width: parseInt(pulseNode.getStyle('width'))
			};
		}

		pulseTimeline.set(pulseDom, {
			x: point.x,
			y: point.y
		});

		pulseTimeline.fromTo(pulseDom, 0.25, {
			opacity: 0
		}, {
			opacity: (isSoft != null && isSoft) ? 0.5 : 0.85
		}, 0);


		pulseTimeline.to(whiteDom, 0.5, {
			opacity: 0,
			ease: Power2.easeOut
		}, 0.35);

		pulseTimeline.fromTo(pulseDom, 1.1, {
			scale: .3
		}, {
			scale: 2.2,
			ease: Power1.easeOut,
			onComplete: function() {
				pulseNode.remove();
			}
		}, 0);

		pulseTimeline.to(colorDom, 0.55, {
			opacity: 0,
			ease: Power2.easeOut
		}, 0.45);

		pulseTimeline.play();
		// pulseTimeline.set(pulseDom)
		// pulseTimeline.

	}
}

// === [Battle Menu Set] =============================================================

function BattleMenuSet(list) {
	this.initialized = false;

	if (list != null && Array.isArray(list)) {
		this.set = list;

		for (var idx = 0; idx < this.set.length; idx++) {
			this.set[idx].key = String(idx);
		}
	}
	else {
		throw new Error(errorHeader +  ": Invalid battle menu set parameters.");
	}
}

BattleMenuSet.prototype.addBackReference = function(set) {
	this.backReference = set;
}

BattleMenuSet.prototype.add = function(item) {
	this.set.push(item);
}

BattleMenuSet.prototype.detachAll = function() {
	for (var idx = 0; idx < this.set.length; idx++) {
		this.set[idx].detachHandlers();
	}
}

BattleMenuSet.prototype.reattachAll = function() {
	for (var idx = 0; idx < this.set.length; idx++) {
		this.set[idx].reattachHandlers();
	}
}

// === [Battle Menu Item] =============================================================

function BattleMenuItem(params) {
	this.hoverReady = false;

	for (var key in params) {
		if (params.hasOwnProperty(key)) {
			this[key] = params[key];
		}
	}

	// console.log(this.name);
	// if (name != null && description != null && imageUrl != null && color != null && type != null) {
	// 	this.name = name;
	// 	this.description = description;
	// 	this.imageUrl = imageUrl;
	// 	this.color = color;
	// 	this.type = type;

	if (this["childSet"] != null) {
		this["childSet"].parentItem = this;
	}
	// else {
	// 	throw new Error(errorHeader +  ": Invalid battle menu item parameters.");
	// }
}

BattleMenuItem.prototype.attachWin = function(win) {
	this.win = win;
}

BattleMenuItem.prototype.setHoverReady = function(cond) {
	this.hoverReady = cond;
}

BattleMenuItem.prototype.onReturn = function(func) {
	this.returnFunc = func;
}

BattleMenuItem.prototype.runReturn = function() {
	this.returnFunc();
}

BattleMenuItem.prototype.attachNode = function(node) {
	this.node = node;
	this.dom = node.getDOMNode();
}

BattleMenuItem.prototype.attachExitTimeline = function(timeline) {
	this.exitTimeline = timeline;
}

BattleMenuItem.prototype.attachPoint = function(point) {
	this.x = point.x;
	this.y = point.y;
	this.point = point;
}

BattleMenuItem.prototype.attachU = function(u) {
	this.u = u;
}

BattleMenuItem.prototype.attachHandlers = function(hoverOnHandler, hoverOffHandler, selectHandler, key, wipe) {
	if (this.detached == false) this.detachHandlers();

	this.hoverOnHandler = hoverOnHandler;
	this.hoverOffHandler = hoverOffHandler;
	this.selectHandler = selectHandler;
	this.key = key;

	this.reattachHandlers();
}

BattleMenuItem.prototype.detachHandlers = function() {
	this.detached = true;

	this.node.detach('hover', this.hoverOnHandler);
	this.node.detach('hover', this.hoverOffHandler);
	this.node.detach('click', this.selectHandler);
	this.win.detach('key', this.hoverOnHandler, this.key);
	this.win.detach('key', this.selectHandler, this.key);
}

BattleMenuItem.prototype.reattachHandlers = function() {
	this.detached = false;

	this.node.on('hover', this.hoverOnHandler, this.hoverOffHandler);
	this.node.on('click', this.selectHandler);
	this.win.on('key', this.hoverOnHandler, this.key);
	this.win.on('key', this.selectHandler, this.key);
}

BattleMenuItem.prototype.handlersAttached = function() {
	return (this.detached != null);
}

var BattleMenuItemTypes = {
	SELECT: 0,
	CONCLUDE: 1,
	SELECT_CONFIRM: 2,
	CONFIRM: 3,
	RETURN: 4
}

