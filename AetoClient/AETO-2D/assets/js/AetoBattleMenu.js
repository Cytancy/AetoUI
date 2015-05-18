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
		DEFAULT_CURVE_ANIM_SMOOTHNESS = 8,
		DEFAULT_COLOR = "#FFFFFF",
		DEFAULT_ITEM_EXIT_DISTANCE = 320,
		DEFAULT_ICON_OFFSET = {x: 20, y: 185};

	var _this = this,
		errorHeader = "Error (AETO-2D | Battle Menu)[" + GUID + "]",
		initialized = false,
		win, actingBezier,
		battleMenuContainerNode, battleMenuItemNode, battleMenuPulseNode,
		bodyNode, clientWidth, clientHeight, itemProperties,
		color, activeMenuList;

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

			if (color == null) {
				color = DEFAULT_COLOR;
			}
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

		activeMenuList = rootMenuSet;

		generateItemNodes(startPoint, rootMenuSet);
		
		function generateItemNodes(initialPoint, menuSet) {
			var nodeResources = {length: 0};

			loadNodeResources(createNodes);

			function loadNodeResources(exec) {
				var iconsToLoad = 0,
					iconsLoaded = 0;

				for (var idx = 0; idx < menuSet.set.length; idx++) {
					var menuItem = menuSet.set[idx];

					nodeResources[idx] = {};

					nodeResources.length++;

					loadIcon(menuItem.icon, idx)
				}

				if (iconsToLoad == 0) exec();

				function loadIcon(icon, index) {
					if (icon != null) {
						iconsToLoad++;

						Aeto2DUtil.loadSVGIcon(icon, function(svgNodes) {
							iconsLoaded++;

							nodeResources[index].iconNodes = svgNodes;

							if (iconsLoaded == iconsToLoad) {
								exec();
							}
						});
					}
				}
			}

			function createNodes() {
				var totalTimeline = new TimelineMax({paused: true}),
					isRoot = (menuSet.backReference == null),
					setLength;

				level++;

				initializePoints(menuSet.set);
			
				win.on('resize', function() {
					initializePoints(menuSet.set);
				});
		
				setLength = menuSet.set.length;

				for (var idx = 0; idx < setLength; idx++) {
					var item = menuSet.set[idx];

					item.setKey(AetoUISettings.keyboardConfigurations.menuItemKeys[idx]);

					setupProperties(item);
					setupStyle(item);
					setupAnim(item);
				}

				totalTimeline.play();
				menuSet.initialized = true;
		
				function setupProperties(indexedItem) {
					if (indexedItem.type == BattleMenuItemTypes.RETURN) {
						indexedItem.setKey(AetoUISettings.keyboardConfigurations.menuItemReturnKey);
					}

					if (indexedItem.win == null) indexedItem.attachWin(win);

					if (indexedItem.node == null) {
						var thisItem = battleMenuItemNode.cloneNode(true);

						battleMenuContainerNode.appendChild(thisItem);
						indexedItem.attachNode(thisItem);
					}
				}

				function setupStyle(indexedItem) {
					var keyText = indexedItem.key,
						nodeResource, iconNodes;

					if (!isNaN(keyText)) {
						keyText = String.fromCharCode(keyText);
					}

					// Will need to update key numbers on menu item removal
					indexedItem.node.one('.shortcut-value').set('textContent', keyText);

					// Setup loaded resources
					nodeResource = nodeResources[indexedItem.index],
					iconNodes = nodeResource.iconNodes;

					if (iconNodes != null) {
						var layerCount = iconNodes.length;

						for (var i = 0; i < layerCount; i++) {
							iconNodes[i].setStyle('width', itemProperties['iconWidth']);
							iconNodes[i].setStyle('height', itemProperties['iconHeight']);
							iconNodes[i].setStyle('zIndex', i + 1);

							iconNodes[i].setStyle('opacity', .85 - .25 * (layerCount - i - 1));
							iconNodes[i].one('path').setStyle('fill', color);

							indexedItem.node.one('.content-icon').appendChild(iconNodes[i]);
						}
					}

					// Coloring
					indexedItem.node.one('.item-gradient .fill').setStyle('backgroundColor', color);
					indexedItem.node.all('.item-content-arrow').each(function(thisNode) {
						thisNode.setStyle('borderColor', color);
					});
				}

				function setupAnim(indexedItem) {
					var tabDom = indexedItem.tabNode.getDOMNode(),
						pathDom = indexedItem.node.one('.item-bg-line .path').getDOMNode(),
						gradientDom = indexedItem.node.one('.item-gradient').getDOMNode(),
						itemBgArrowNodes = indexedItem.node.all('.item-bg-arrow'),
						itemBgArrowDoms = [itemBgArrowNodes.item(0).getDOMNode(), itemBgArrowNodes.item(1).getDOMNode()],
						entryTimeline = new TimelineMax();

					if (!indexedItem.node.hasClass(level)) indexedItem.node.addClass(level);

					if (!indexedItem.isDisabled()) {
						if (indexedItem.width == null) indexedItem.width = parseInt(indexedItem.node.getStyle('width'));
						if (indexedItem.height == null) indexedItem.height = parseInt(indexedItem.node.getStyle('height'));
						if (indexedItem.bottom == null) indexedItem.bottom = parseInt(indexedItem.tabNode.getStyle('bottom'));

						setupEntry(indexedItem);
						setupInteraction(indexedItem);
						setupResize(indexedItem);
					}
					else {
						indexedItem.node.setStyle('display', 'none');
					}

					function setupInteraction(indexedItem) {
						var	hoverTimeline = new TimelineMax({paused: true}),
							bottomArrowNodes = indexedItem.node.all('.item-content-arrow');

						if (!indexedItem.isDisabled()) {
							setupHoverTimeline();
							setupInputs(indexedItem);
						}

						function setupInputs(indexedItem) {
							if (!indexedItem.handlersAttached()) {
								var hoverOnHandler = function() {
										if (!indexedItem.hoverReady) {
											indexedItem.waitingForHover = true;
										}
										else {
											indexedItem.waitingForHover = false;
											hoverTimeline.play();
											indexedItem.hovered = true;
										}
									},
									hoverOffHandler = function() {
										if (indexedItem.hoverReady && indexedItem.hovered) {
											hoverTimeline.reverse();

											indexedItem.hovered = false;
											indexedItem.waitingForHover = false;
										}
									},
									selectHandler = function(e) {
										_this.callback('itemSelected', indexedItem);
										
										menuSet.detachAll();
										
										createPulseAt({x: indexedItem.dom._gsTransform.x, y: indexedItem.dom._gsTransform.y});
										
										TweenMax.delayedCall(.15, function() {
											createPulseAt({x: indexedItem.dom._gsTransform.x, y: indexedItem.dom._gsTransform.y}, true);
										});

										if (indexedItem.childSet != null) {
											if (!indexedItem.childSet.initialized) {
												indexedItem.childSet.add(new BattleMenuItem({name: "return", type: BattleMenuItemTypes.RETURN}));
											}

											indexedItem.childSet.addBackReference(menuSet);

											generateSelectionTimeline().play();

											generateItemNodes(indexedItem.u, indexedItem.childSet);
										}
										else {
											switch (indexedItem.type) {
												case BattleMenuItemTypes.SELECT:
													var actionSelectionTimeline = generateActionSelectionTimeline(), actionHoverTimeline = generateActionHoverHookTimeline(),
														turnbarNode = A.one('.aeto-ui-turnbar-container'),
														turnbarHoverOn = function() {
															actionHoverTimeline.play();
														},
														turnbarHoverOff = function() {
															actionHoverTimeline.reverse();
														};
													;

													indexedItem.hookTo('hover', turnbarNode, turnbarHoverOn, turnbarHoverOff);

													indexedItem.attachActionSelectionHandlers(function() {
														actionSelectionTimeline.play();
														generateActionExitTimeline().play();

													},
													function() {
														actionSelectionTimeline.kill();

														console.log(indexedItem.index);

														indexedItem.removeActionSelectionHandlers();

														generateActionUnselectionTimeline(indexedItem).play();

														generateActionUnexitTimeline(indexedItem).play();

														menuSet.reattachAll();

														setupHoverTimeline();

														indexedItem.unhook('hover', turnbarNode, turnbarHoverOn);
														indexedItem.unhook('hover', turnbarNode, turnbarHoverOff);

													}, AetoUISettings.keyboardConfigurations.menuItemReturnKey);
													
													indexedItem.actionSelect();

													break;
												case BattleMenuItemTypes.RETURN:
													var parentMenu = menuSet.backReference,
														parentItems = parentMenu.set;

													// menuSet.parentItem.runReturn();

													parentMenu.unhoverAll();
													parentMenu.detachAll();

													initializePoints(parentItems);

													for (var idx = 0; idx < parentItems.length; idx++) {
														var item = parentItems[idx];

														setupInteraction(item);
													}

													generateExitTimeline().play();
													generateReturnTimeline().play();

													break;
											}
										}
									};

								indexedItem.attachHandlers(hoverOnHandler, hoverOffHandler, selectHandler);

							// 	indexedItem.onReturn(function() {

							// 		// Redo the menu in case the menu was changed, shifted, modified, etc.
							// 		// Changes are only necessary upon returning from a menu
							// 		menuSet.unhoverAll();
							// 		menuSet.detachAll();

							// 		var menuSetItems = menuSet.set;

							// 		for (var idx = 0; idx < menuSetItems.length; idx++) {
							// 			var menuItem = menuSetItems[idx];

							// 			setupAnim(menuItem);
							// 		}
							// 	});
							}
							else {
								indexedItem.reattachHandlers();
							}

							// function refactor() {
							// 	var rootSet = menuSet;

							// 	while (rootSet.backReference != null) {
							// 		rootSet = rootSet.backReference;
							// 	}

							// 	refactorSet(rootSet);

							// 	function refactorSet(set) {
							// 		var items = set.set;

							// 		for (var idx = 0; idx < items.length; idx++) {
							// 			var item = items[idx];
							// 		}
							// 	}
							// }
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
										pointStep = invertAndCenter({x: actingBezier.mx(uStep), y: actingBezier.my(uStep)}, indexedItem.width, indexedItem.height);

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

						function generateActionExitTimeline() {
							var actionExitTimeline = new TimelineMax({paused: true}),
								center = {x: win.get("winWidth") / 2, y: win.get("winHeight") / 2};

							for (var idx = 0; idx < menuSet.set.length; idx++) {
								if (idx != indexedItem.index) {
									var item = menuSet.set[idx],
										angle = (Aeto2DUtil.angleBetweenPoints(item.point, center) - Math.PI / 2) * -1,
										angleInDegrees = Aeto2DUtil.radiansToDegrees(angle),
										adjustedAngle = Math.PI * 1.5 - angle,
										distance = DEFAULT_ITEM_EXIT_DISTANCE,
										newPoint = {
											x: item.point.x + Math.cos(adjustedAngle) * distance,
											y: item.point.y + Math.sin(adjustedAngle) * distance
										};

									TweenMax.killTweensOf(item.dom, {scale: true, x: true, y: true, autoAlpha: true, opacity: true, visibility: true, rotation: true});

									newPoint = invertAndCenter(newPoint, item.width, item.height);

									actionExitTimeline.to(item.dom, .35, {
										rotation: String(angleInDegrees)+"_short",
										ease: Power2.easeInOut
									}, 0);

									actionExitTimeline.to(item.dom, .95, {
										x: newPoint.x,
										y: newPoint.y,
										scale: .5,
										ease: Back.easeInOut.config(1.75)
									}, 0);

									actionExitTimeline.to(item.dom, .4, {
										autoAlpha: 0,
										ease: Power2.easeInOut
									}, .35)
								}
							}

							return actionExitTimeline;
						}

						function generateActionUnexitTimeline(indexedItem) {
							var actionUnexitTimeline = new TimelineMax({paused: true});

							var center = {x: win.get("winWidth") / 2, y: win.get("winHeight") / 2};

							for (var idx = 0; idx < menuSet.set.length; idx++) {
								if (idx != indexedItem.index) {
									var item = menuSet.set[idx],
										originalPoint = invertAndCenter(item.point, item.width, item.height);

									TweenMax.killTweensOf(item.dom, {scale: true, x: true, y: true, autoAlpha: true, opacity: true, visibility: true, rotation: true});

									actionUnexitTimeline.to(item.dom, .45, {
										rotation: "0_short",
										ease: Power2.easeInOut
									}, 2);

									actionUnexitTimeline.to(item.dom, .45, {
										rotation: "0_short",
										ease: Power2.easeInOut
									}, .7);

									actionUnexitTimeline.to(item.dom, .95, {
										x: originalPoint.x,
										y: originalPoint.y,
										scale: 1,
										ease: Back.easeInOut.config(1.75)
									}, 0);

									actionUnexitTimeline.to(item.dom, .4, {
										autoAlpha: 1,
										ease: Power2.easeInOut,
									}, .0);
								}
							}

							return actionUnexitTimeline;
						}

						function generateReturnTimeline() {
							var returnTimeline = new TimelineMax({paused: true}),
								parentSet = menuSet.backReference.set;

							initializePoints(parentSet);

							for (var jdx = 0; jdx < parentSet.length; jdx++) {
								var parentItem = parentSet[jdx];

								if (!parentItem.isDisabled()) {
									var newPoint = invertAndCenter(parentItem.point, parentItem.width, parentItem.height);

									TweenMax.killTweensOf(parentItem.dom, {bottom: true, opacity: true, scale: true, visibility: true});

									returnTimeline.to(parentItem.dom, .55, {
										bottom: 0,
										autoAlpha: 1,
										scale: 1,
										ease: Power2.easeInOut
									}, 0);

									returnTimeline.to(parentItem.dom, .65, {
										x: newPoint.x,
										y: newPoint.y,
										ease: Power2.easeInOut
									}, 0);
								}
							}

							return returnTimeline;
						}

						function generateActionHoverHookTimeline() {
							var actionHoverTimeline = new TimelineMax({paused: true});

							actionHoverTimeline.fromTo(indexedItem.dom, .45, {
								bottom: 0
							}, {
								bottom: -15,
								ease: Power2.easeInOut
							});
						
							return actionHoverTimeline;
						}

						function generateActionSelectionTimeline() {
							var actionSelectionTimeline = new TimelineMax({paused: true}),
								circlePathDom = indexedItem.node.one(".item-bg-line .path").getDOMNode(),
								innerCirclePathDom = indexedItem.node.one(".item-content-bg-line .path").getDOMNode(),
								innerArrowNodes = indexedItem.node.all('.item-content-arrow'),
								outerArrowNodes = indexedItem.node.all('.item-bg-arrow'),
								iconNode = indexedItem.node.one(".content-icon "),
								svgLayers = iconNode.all("svg path"),
								screenWidth = win.get("winWidth"),
								screenHeight = win.get("winHeight"),
								targetPoint = {
									x: DEFAULT_ICON_OFFSET.x,
									y: DEFAULT_ICON_OFFSET.y - screenHeight
								},
								distanceToTarget = Aeto2DUtil.distanceBetweenPoints(indexedItem.point, targetPoint),
								angleToTarget = Aeto2DUtil.angleBetweenPoints(indexedItem.point, targetPoint),
								angleNormalToTarget = Math.PI - angleToTarget,
								midPoint = {
									x: targetPoint.x - (targetPoint.x - indexedItem.point.x) / 2,
									y: targetPoint.y - (targetPoint.y - indexedItem.point.y) / 2
								},
								curvePoint = {
									x: midPoint.x - 100 * Math.cos(angleNormalToTarget),
									y: midPoint.y + 100 * Math.sin(angleNormalToTarget)
								}, 
								baseTime = .7;

							TweenMax.killTweensOf(indexedItem.tabDom, {bottom: true, rotation: true, autoAlpha: true, opacity: true});

							if (indexedItem.waitingForHover != null && indexedItem.waitingForHover) {
								indexedItem.hoverReady = true;

								indexedItem.hoverOnHandler();
							}

							actionSelectionTimeline.to(indexedItem.dom, .1, {
								cursor: "default"
							}, 1);

							actionSelectionTimeline.to(indexedItem.tabDom, .55, {
								bottom: "100%",
								autoAlpha: 0,
								ease: Back.easeIn.config(1.7)
							}, 0);

							TweenMax.killTweensOf(circlePathDom, {strokeDasharray: true, strokeDashoffset: true});

							actionSelectionTimeline.to(circlePathDom, .35, {
								strokeDasharray: 282,
								strokeDashoffset: 0,
								stroke: color,
								ease: Power2.easeInOut
							}, 0);

							actionSelectionTimeline.to(innerCirclePathDom, .35, {
								strokeDasharray: 190,
								strokeDashoffset: 0,
								ease: Power2.easeInOut
							}, 0);

							actionSelectionTimeline.to(indexedItem.node.one(".item-bg").getDOMNode(), .35, {
								opacity: .65,
								ease: Power2.easeInOut
							}, 0);

							actionSelectionTimeline.to(indexedItem.node.one(".item-gradient-set").getDOMNode(), .35, {
								autoAlpha: 0,
								scale: 0,
								ease: Power2.easeInOut
							}, 0);

							actionSelectionTimeline.to(indexedItem.node.one(".item-content-bg").getDOMNode(), .35, {
								backgroundColor: color,
								opacity: .75,
								ease: Power2.easeInOut
							}, 0);

							actionSelectionTimeline.to(innerArrowNodes.item(0).getDOMNode(), .45, {
								rotation: 90,
								borderColor: "#FFFFFF",
								ease: Power2.easeInOut
							}, 0);

							actionSelectionTimeline.to(innerArrowNodes.item(1).getDOMNode(), .45, {
								rotation: -90,
								borderColor: "#FFFFFF",
								ease: Power2.easeInOut
							}, 0);

							actionSelectionTimeline.to(outerArrowNodes.item(0).getDOMNode(), .45, {
								rotation: 90,
								borderColor: color,
								ease: Power2.easeInOut
							}, 0);

							actionSelectionTimeline.to(outerArrowNodes.item(1).getDOMNode(), .45, {
								rotation: -90,
								borderColor: color,
								ease: Power2.easeInOut
							}, 0);

							actionSelectionTimeline.to(iconNode.getDOMNode(), .3, {
								scale: 0.75,
								y: 4
							}, .15);

							svgLayers.each(function(thisLayer) {
								actionSelectionTimeline.to(thisLayer.getDOMNode(), .45, {
									fill: "#FFFFFF"
								}, 0);
							});

							actionSelectionTimeline.to(indexedItem.dom, baseTime, {
								bezier: {
									type:"thru", 
									values:[
										curvePoint,
										targetPoint], 
									curviness: 1.75
								}, 
								ease: Power2.easeInOut
							} ,.4);

							actionSelectionTimeline.to(indexedItem.node.one(".item-bg").getDOMNode(), .45, {
								autoAlpha: 0,
								scale: 1.6,
								ease: Power2.easeInOut
							}, baseTime + .5);

							actionSelectionTimeline.to(indexedItem.node.one(".item-bg-set").getDOMNode(), .45, {
								color: "rgba(0, 0, 0, 0)",
								ease: Power2.easeInOut
							}, baseTime + .5);

							actionSelectionTimeline.to(circlePathDom, .45, {
								stroke: "#FFFFFF",
								ease: Power2.easeInOut
							}, baseTime + .5);
							
							actionSelectionTimeline.to(outerArrowNodes.item(0).getDOMNode(), .45, {
								borderColor: "#FFFFFF",
								ease: Power2.easeInOut
							}, baseTime + .5);

							actionSelectionTimeline.to(outerArrowNodes.item(1).getDOMNode(), .45, {
								borderColor: "#FFFFFF",
								ease: Power2.easeInOut
							}, baseTime + .5);

							actionSelectionTimeline.to(indexedItem.node.one(".item-bg-line").getDOMNode(), .35, {
								scale: 1.05,
								ease: Power0.easeNone
							}, baseTime + .5);

							actionSelectionTimeline.to(indexedItem.node.one(".item-content").getDOMNode(), .35, {
								boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)",
								ease: Power0.easeNone
							}, baseTime + .5);

							actionSelectionTimeline.to(indexedItem.node.one(".item-content-bg").getDOMNode(), .35, {
								autoAlpha: 0,
								ease: Power2.easeInOut
							}, baseTime + .5);
							
							actionSelectionTimeline.to(circlePathDom, .45, {
								strokeDashoffset: -106,
								strokeDasharray: 70,
								stroke: "rgba(255, 255, 255, .7)",
								ease: Power2.easeInOut
							}, baseTime + .65);

							actionSelectionTimeline.to([outerArrowNodes.item(0).getDOMNode(), outerArrowNodes.item(1).getDOMNode()], .45, {
								borderColor: "rgba(255, 255, 255, .7)"
							}, baseTime + .65);

							actionSelectionTimeline.to(innerCirclePathDom, .45, {
								strokeDashoffset: 0,
								strokeDasharray: 2,
								ease: Power2.easeInOut
							}, baseTime + .65);

							actionSelectionTimeline.to(indexedItem.node.one(".item-content-bg-line").getDOMNode(), .6, {
								scale: 1.25,
								ease: Back.easeInOut.config(1.7)
							}, baseTime + .5);

							actionSelectionTimeline.to(innerArrowNodes.item(0).getDOMNode(), .4, {
								x: 25,
								autoAlpha: 0,
								ease: Power2.easeInOut
							}, baseTime + .85);

							actionSelectionTimeline.to(innerArrowNodes.item(1).getDOMNode(), .4, {
								x: -25,
								autoAlpha: 0,
								ease: Power2.easeInOut
							}, baseTime + .85);

							actionSelectionTimeline.to(iconNode.getDOMNode(), .55, {
								scale: 1,
								ease: Back.easeInOut.config(1.7)
							}, baseTime + .85);

							actionSelectionTimeline.to(outerArrowNodes.item(0).getDOMNode(), 5, {
								rotation: 450,
								repeat: -1,
								ease: Power0.easeNone
							}, baseTime + .85);

							actionSelectionTimeline.to(outerArrowNodes.item(1).getDOMNode(), 5, {
								rotation: 270,
								repeat: -1,
								ease: Power0.easeNone
							}, baseTime + .75);

							actionSelectionTimeline.to(indexedItem.node.one(".item-content-bg-line").getDOMNode(), 5, {
								rotation: "360_ccw",
								repeat: -1,
								ease: Power0.easeNone
							}, baseTime + .75);

							// kill on start for relevant elements

							// hook to this later aeto-ui-turnbar-container

							// actionSelectionTimeline.to(indexedItem.tabDom, .55, {
							// 	bottom: "100%",
							// 	autoAlpha: 0,
							// 	ease: Back.easeIn.config(1.7)
							// }, .35);

							// 20 -835
							// 185

							return actionSelectionTimeline;
						}

						function generateActionUnselectionTimeline(indexedItem) {
							var actionUnselectionTimeline = new TimelineMax({paused: true}),
								circlePathDom = indexedItem.node.one(".item-bg-line .path").getDOMNode(),
								innerCirclePathDom = indexedItem.node.one(".item-content-bg-line .path").getDOMNode(),
								innerArrowNodes = indexedItem.node.all('.item-content-arrow'),
								outerArrowNodes = indexedItem.node.all('.item-bg-arrow'),
								iconNode = indexedItem.node.one(".content-icon "),
								svgLayers = iconNode.all("svg path"),
								screenWidth = win.get("winWidth"),
								screenHeight = win.get("winHeight"),
								targetPoint = {
									x: DEFAULT_ICON_OFFSET.x,
									y: DEFAULT_ICON_OFFSET.y - screenHeight
								},
								distanceToTarget = Aeto2DUtil.distanceBetweenPoints(indexedItem.point, targetPoint),
								angleToTarget = Aeto2DUtil.angleBetweenPoints(indexedItem.point, targetPoint),
								angleNormalToTarget = Math.PI - angleToTarget,
								midPoint = {
									x: targetPoint.x - (targetPoint.x - indexedItem.point.x) / 2,
									y: targetPoint.y - (targetPoint.y - indexedItem.point.y) / 2
								},
								curvePoint = {
									x: midPoint.x - 100 * Math.cos(angleNormalToTarget),
									y: midPoint.y + 100 * Math.sin(angleNormalToTarget)
								}, 
								baseTime = .7;

							actionUnselectionTimeline.to(indexedItem.dom, .1, {
								cursor: "pointer"
							}, 1);

							actionUnselectionTimeline.to(indexedItem.tabDom, 0, {
								rotation: 720,
							}, 0);

							actionUnselectionTimeline.to(indexedItem.tabDom, .45, {
								bottom: indexedItem.bottom,
								autoAlpha: 1
							}, baseTime + .65);

							// Magic numbers, too tired to code for robustness by getting and setting from css
							// This entire section is magic numbers based off original CSS
							actionUnselectionTimeline.to(circlePathDom, .55, {
								strokeDasharray: 266,
								strokeDashoffset: -8,
								stroke: "#FFFFFF",
								ease: Power2.easeInOut
							}, 0);


							actionUnselectionTimeline.to(innerCirclePathDom, .55, {
								strokeDasharray: 171,
								strokeDashoffset: -8,
								ease: Power2.easeInOut
							}, 0);

							actionUnselectionTimeline.to(indexedItem.node.one(".item-bg").getDOMNode(), .55, {
								autoAlpha: 0.3,
								scale: 1,
								ease: Power2.easeInOut
							}, 0);

							actionUnselectionTimeline.to(indexedItem.node.one(".item-gradient-set").getDOMNode(), .15, {
								scale: 1,
								ease: Power2.easeInOut
							}, 0);

							actionUnselectionTimeline.to(indexedItem.node.one(".item-gradient-set").getDOMNode(), .55, {
								autoAlpha: 1,
								ease: Power2.easeInOut
							}, 0);

							actionUnselectionTimeline.to(indexedItem.node.one(".item-content-bg").getDOMNode(), .35, {
								backgroundColor: "#FAFAFA",
								autoAlpha: 1,
								ease: Power2.easeInOut
							}, 0);

							actionUnselectionTimeline.to([innerArrowNodes.item(0).getDOMNode(), innerArrowNodes.item(1).getDOMNode()], .45, {
								rotation: 0,
								borderColor: color,
								ease: Power2.easeInOut
							}, 0);

							actionUnselectionTimeline.to([outerArrowNodes.item(0).getDOMNode(), outerArrowNodes.item(1).getDOMNode()], .45, {
								rotation: 0,
								borderColor: "#FAFAFA",
								ease: Power2.easeInOut
							}, 0);

							actionUnselectionTimeline.to(iconNode.getDOMNode(), .3, {
								y: 0
							}, .15);

							svgLayers.each(function(thisLayer) {
								actionUnselectionTimeline.to(thisLayer.getDOMNode(), .45, {
									fill: color
								}, 0);
							});

							actionUnselectionTimeline.to(indexedItem.dom, baseTime, {
								bezier: {
									type:"thru", 
									values:[
										curvePoint,
										invertAndCenter(indexedItem.point, indexedItem.width, indexedItem.height)], 
									curviness: 1.75
								}, 
								ease: Power2.easeInOut
							} , .4);

							actionUnselectionTimeline.to(indexedItem.node.one(".item-bg-set").getDOMNode(), .4, {
								color: "rgba(0, 0, 0, 0.14)",
								ease: Power2.easeInOut
							}, baseTime + .4);

							actionUnselectionTimeline.to(indexedItem.node.one(".item-bg-line").getDOMNode(), .35, {
								scale: 1.0,
								ease: Power0.easeNone
							}, baseTime + .4);

							actionUnselectionTimeline.to(indexedItem.node.one(".item-content").getDOMNode(), .35, {
								boxShadow: "rgba(0, 0, 0, 0.15) 0px 0px 3px 3px",
								ease: Power0.easeNone
							}, baseTime + .5);
							
							actionUnselectionTimeline.to(indexedItem.node.one(".item-content-bg-line").getDOMNode(), .6, {
								scale: 1,
								rotation: 0
							}, baseTime + .5);

							actionUnselectionTimeline.to([innerArrowNodes.item(0).getDOMNode(), innerArrowNodes.item(1).getDOMNode()], .4, {
								x: 0,
								autoAlpha: 1,
								ease: Power2.easeInOut
							}, baseTime + .85);

							actionUnselectionTimeline.to(indexedItem.node.one(".content-icon").getDOMNode(), .55, {
								scale: 1,
							}, baseTime + .85);

					
							// actionUnselectionTimeline.play();

							// actionUnselectionTimeline.play();

							return actionUnselectionTimeline;
						}

						function generateSelectionTimeline() {
							var selectionTimeline = new TimelineMax({paused: true});

							for (var jdx = 0; jdx < menuSet.set.length; jdx++) {
								if (jdx != indexedItem.index) {
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
							var iconNode = indexedItem.node.one(".content-icon"),
								iconLayers = iconNode.all('svg'),
								iconLayer1 = iconLayers.item(0),
								iconLayer2 = iconLayers.item(1);

							hoverTimeline.fromTo(indexedItem.tabDom, 0.55, {
								bottom: indexedItem.bottom,
							}, {
								bottom: '25%',
								ease: Back.easeInOut.config(2)
							}, 0);

							hoverTimeline.to(indexedItem.node.one('.item-bg-line').getDOMNode(), 0.35, {
								scale: 1.08,
								ease: Power2.easeInOut
							}, 0);

							hoverTimeline.fromTo(bottomArrowNodes.item(0).getDOMNode(), 0.45, {
								rotation: 0
							}, {
								rotation: 45,
								transformOrigin:"center top",
								ease: Back.easeInOut.config(1.7)
							}, 0);

							hoverTimeline.fromTo(bottomArrowNodes.item(1).getDOMNode(), 0.45, {
								rotation: 0
							}, {
								rotation: -45,
								transformOrigin:"center top",
								ease: Back.easeInOut.config(1.7)
							}, 0);

							hoverTimeline.fromTo(itemBgArrowDoms[0], 0.45, {
								rotation: 0,
							}, {
								rotation: -45,
								transformOrigin:"center bottom",
								ease: Back.easeInOut.config(1.7)
							}, 0);

							hoverTimeline.fromTo(itemBgArrowDoms[1], 0.45, {
								rotation: 0,
							}, {
								rotation: 45,
								transformOrigin:"center bottom",
								ease: Back.easeInOut.config(1.7)
							}, 0);

							hoverTimeline.to(gradientDom, 0.45, {
								height: '100%',
								ease: Power2.easeInOut
							}, 0);

							hoverTimeline.to(indexedItem.node.one(".item-gradient .fill-cover").getDOMNode(), 0.45, {
								opacity: .8,
								ease: Power0.easeNone
							}, 0);

							hoverTimeline.to(indexedItem.node.one(".item-gradient .fill-cover").getDOMNode(), 0.45, {
								opacity: .8,
								ease: Power0.easeNone
							}, 0);

							hoverTimeline.to(iconNode.getDOMNode(), 0.45, {
								scale: .8,
								ease: Back.easeInOut.config(1.7)
							}, 0);

							if (iconLayer1) {
								hoverTimeline.to(iconLayer1.getDOMNode(), 0.4, {
									opacity: .35,
									ease: Power0.easeNone
								}, 0);
							}

							if (iconLayer2) {
								hoverTimeline.to(iconLayer2.getDOMNode(), 0.4, {
									opacity: .95,
									ease: Power0.easeNone
								}, 0);
							}
						}
					}

					function setupResize() {
						win.on('resize', function() {
							var newPoint = invertAndCenter(indexedItem.point, indexedItem.width, indexedItem.height);

							TweenMax.to(indexedItem.dom, 1, {
								x: newPoint.x,
								y: newPoint.y,
								delay: AetoUtil.clamp(1.4 - entryTimeline.time(), 0, 10)
							});
						});
					}

					function setupEntry() {
						var itemContentBgDom = indexedItem.node.one('.item-content-bg'),
							inverseIdx = setLength - indexedItem.index - 1;

						indexedItem.setHoverReady(false);

						if (isRoot && menuSet.initialized == false) {
							var angle = Aeto2DUtil.angleBetweenPoints(initialPoint, indexedItem.point),
					  	 		angleDistance = Math.abs(angle) - Math.PI / 2,
					  	 		vectorDistance = Aeto2DUtil.distanceBetweenPoints(initialPoint, indexedItem.point) * distanceModifier,
								angleBoost = angleBoostRatio * angleDistance,
								normalizedAngleBoost = Math.pow(angleMean / Math.abs(angleBoost), angleBoostModifier) * angleBoost,
								boostedAngle = angle - normalizedAngleBoost,
								cpMagnitude = {x: vectorDistance * Math.cos(boostedAngle), y: vectorDistance * Math.sin(boostedAngle)},
								cp2 = {x: cpMagnitude.x + initialPoint.x,
									   y: cpMagnitude.y + initialPoint.y},
								cpMidpoint = {x: cpMagnitude.x / 2 + initialPoint.x,  y: cpMagnitude.y / 2 + initialPoint.y},
								newAngle = (angleDistance < 0) ? boostedAngle + Math.PI * 0.5 : boostedAngle - Math.PI * 0.5,
								cp2Distance = Aeto2DUtil.distanceBetweenPoints(initialPoint, cp2) * midpointDistanceModifier,
								cp1 = {x: cpMidpoint.x + Math.cos(newAngle) * cp2Distance,
								  	   y: cpMidpoint.y + Math.sin(newAngle) * cp2Distance},
								baseTime = 2;

							totalTimeline.add(entryTimeline, indexedItem.index * setDelay);

							// Bezier Entrance
							entryTimeline.fromTo(indexedItem.dom, baseTime, {
									x: initialPoint.x,
									y: -initialPoint.y
								}, {
								bezier: {
									type:"thru", 
									values:[invertAndCenter(initialPoint, indexedItem.width, indexedItem.height), invertAndCenter(cp1, indexedItem.width, indexedItem.height), invertAndCenter(cp2, indexedItem.width, indexedItem.height), invertAndCenter(indexedItem.point, indexedItem.width, indexedItem.height)], 
									curviness: 1.75,
									autoRotate:["x", "y", "rotation", 0, false]
								}, 
								ease: Elastic.easeOut.config(1, 0.833)
							}, 0);

							// Item grow and fade in
							entryTimeline.from(indexedItem.dom, .4, {autoAlpha: 0, display: "none"}, 0);
							entryTimeline.from(indexedItem.dom, .55, {scale: 0.2}, 0);

							// Correct item rotation
							entryTimeline.to(indexedItem.dom, 0.71, {
									rotation: "0_short",
									ease: Back.easeInOut.config(2)
							}, baseTime - .7);

							// Rotate Tab Simultaneously
							entryTimeline.to(indexedItem.tabDom, 0.91, {
									rotation: (angleDistance < 0) ? '-720deg' : '720deg',
									ease: Back.easeInOut.config(1)
							}, baseTime - .7);

							// Fade in the content background
							entryTimeline.from(itemContentBgDom, .6, {
								opacity: 0.3
							},baseTime - .5);

							// Scale in the frame 
							entryTimeline.from(indexedItem.node.one('.item-bg-set').getDOMNode(), .8, {
								scale: 0.7,
								ease: Back.easeOut.config(1.5)
							}, baseTime - .4);
							
							// Soften the content shadow
							entryTimeline.from(indexedItem.node.one('.item-content').getDOMNode(), .6, {boxShadow: "0 0 3px 3px rgba(0, 0, 0, 0.15)"
							}, baseTime - .4);

							// Pop out top tab
							entryTimeline.fromTo(indexedItem.tabDom, 0.55, {
								bottom: '15%'
							}, {
								bottom: indexedItem.bottom,
								ease: Back.easeInOut.config(2.5),
								onComplete: function() {
									indexedItem.setHoverReady(true);

									if (indexedItem.waitingForHover != null && indexedItem.waitingForHover) {
										indexedItem.hoverOnHandler();
									}
								}
							}, baseTime - .1);

							// Fade in the tab inner dark bg					
							entryTimeline.from(indexedItem.node.one('.inner-bg').getDOMNode(), 0.45, {
								opacity: 0, 
								ease: Power2.easeInOut
							}, baseTime + .2);

							// Fade drop shortcut key					
							entryTimeline.from(indexedItem.node.one('.shortcut-value').getDOMNode(), .4, {
								opacity: 0,
								y: 20,
								ease: Power2.easeInOut
							}, baseTime + .35);

							// Drop in the outer arrows
							entryTimeline.from(itemBgArrowDoms, .4, {
								opacity: 0,
								y: -10,
								ease: Power2.easeInOut
							}, baseTime + .5);

							// Stroke and fade in the outer path

							entryTimeline.from(pathDom, .75, {
								strokeDashoffset: 258,
								ease: Power2.easeInOut
							}, baseTime + .75);

							entryTimeline.from(pathDom, .35, {
								opacity: 0,
								ease: Power2.easeInOut
							}, baseTime + .75);

							// Rotate fade in the mask
							entryTimeline.from(indexedItem.node.one('.item-gradient-set').getDOMNode(), .85, {
								rotation: 180,
								ease: Power2.easeInOut
							}, inverseIdx * setDelay + baseTime + 1.05);

							entryTimeline.from(gradientDom, .85, {
								opacity: 0,
								ease: Power2.easeInOut
							}, inverseIdx * setDelay + baseTime + 1.2);
						}
						else {
							var uDistance = indexedItem.u - initialPoint;

							totalTimeline.add(entryTimeline, indexedItem.index * setDelay);

							if (uDistance != 0) {
								var animSegment = uDistance / (curveAnimSmoothness - 1),
									pointSet = [];

								for (var jdx = 0; jdx < curveAnimSmoothness; jdx++) {
									var uStep = initialPoint + jdx * animSegment,
										pointStep = invertAndCenter({x: actingBezier.mx(uStep), y: actingBezier.my(uStep)}, indexedItem.width, indexedItem.height);

									pointSet.push(pointStep);
								}

								entryTimeline.fromTo(indexedItem.dom, 0.8, {
									pointerEvents: 'none'
								}, {
									pointerEvents: 'auto'
								}, 0);

								entryTimeline.fromTo(indexedItem.dom, 2, {
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
								var startPoint = invertAndCenter(indexedItem.point, indexedItem.width, indexedItem.height);

								entryTimeline.to(indexedItem.dom, 0, {
										rotation: 0,
										x: startPoint.x,
										y: startPoint.y,
										visibility: 'visible'
								}, 0);
							}

							// Item grow and fade in
							TweenMax.killTweensOf(indexedItem.dom, {opacity:true});

							entryTimeline.fromTo(indexedItem.dom, .35, {
								autoAlpha: 0,
							}, {
								autoAlpha: 1, 
							}, 0);

							// TweenMax.killTweensOf(itemDom, {scale: true});
							entryTimeline.fromTo(indexedItem.dom, .4, {
								scale: 0.2
							}, {
								scale: 1
							}, 0);

							// Fade in the content background
							entryTimeline.fromTo(itemContentBgDom, .4, {
								opacity: 0.3
							}, {
								autoAlpha: 1,
								ease: Power2.easeInOut
							}, .45);

							// Scale in the frame 
							entryTimeline.fromTo(indexedItem.node.one('.item-bg-set').getDOMNode(), .6, {
								scale: 0.7
							}, {
								scale: 1,
								ease: Back.easeOut.config(1.5)
							}, .45);

							// Drop in the outer arrows
							entryTimeline.fromTo(itemBgArrowDoms, .4, {
								autoAlpha: 0,
								y: 10
							}, {
								autoAlpha: 1,
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
								autoAlpha: 0,
							}, {
								autoAlpha: 1,
								ease: Power2.easeInOut
							}, .95);

							// Fade in the mask
							entryTimeline.fromTo(gradientDom, .55, {
								autoAlpha: 0
							}, {
								autoAlpha: 1,
								ease: Power2.easeInOut
							}, inverseIdx * setDelay + .75);

							// Pop out top tab
							TweenMax.killTweensOf(indexedItem.tabDom, {bottom: true});

							entryTimeline.fromTo(indexedItem.tabDom, 0.45, {
								bottom: '15%'
							}, {
								bottom: indexedItem.bottom,
								ease: Back.easeInOut.config(2.5),
								onComplete: function() {
									indexedItem.setHoverReady(true);
								}
							}, inverseIdx * setDelay + .4);

							entryTimeline.to(indexedItem.dom, 0.85, {
									rotation: "0_short",
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
		}

		function initializePoints(list) {
			var numItems = list.length,
				reductionCount = 0,
				enabledItems = [];

			for (var idx = 0; idx < numItems; idx++) {
				var item = list[idx];

				if (!item.isDisabled()) enabledItems.push(item);
			}

			for (var idx = 0; idx < enabledItems.length; idx++) {
				var uVal = idx / (enabledItems.length - 1),
					item = enabledItems[idx];

				item.attachPoint({x: actingBezier.mx(uVal), y: actingBezier.my(uVal)});
				item.attachU(uVal);

				if (item.childSet != null) {
					initializePoints(item.childSet.set);
				}
			}
		}

		function invertAndCenter(point, width, height) {
			return {x: point.x - width / 2, y: -point.y + height / 2};
		}
	}

	this.setColor = function(newColor) {
		color = newColor;
	}

	this.disableItem = function(name, optionalList) {
		var list = (optionalList == null) ? activeMenuList : optionalList;

		if (list != null) {
			for (var idx = 0; idx < list.set.length; idx++) {
				if (list.set[idx].name == name) {
					list.set[idx].disabled = true;
				}

				if (list.set[idx].childSet != null) {
					_this.disableItem(name, list.set[idx].childSet);
				}
			}
		}
		else {
			throw new Error(errorHeader +  ": Cannot disable item, there is no active menu list.");
		}
	}


	this.enableItem = function(name, optionalList) {
		var list = (optionalList == null) ? activeMenuList : optionalList;

		if (list != null) {
			for (var idx = 0; idx < list.set.length; idx++) {
				if (list.set[idx].name == name) {
					list.set[idx].disabled = false;
				}

				if (list.set[idx].childSet != null) {
					_this.enableItem(name, list.set[idx].childSet);
				}
			}
		}
		else {
			throw new Error(errorHeader +  ": Cannot enable item, there is no active menu list.");
		}
	}

	function createPulseAt(point, isSoft) {
		var pulseNode = battleMenuPulseNode.cloneNode(true),
			pulseDom = pulseNode.getDOMNode(),
			whiteDom = pulseNode.one('.pulse.white').getDOMNode(),
			colorNode = pulseNode.one('.pulse.color'),
			colorDom = colorNode.getDOMNode(),
			pulseTimeline = new TimelineMax({paused: true});
		
		battleMenuContainerNode.appendChild(pulseNode);

		colorNode.setStyle('color', color);

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
			autoAlpha: 0
		}, {
			autoAlpha: (isSoft != null && isSoft) ? 0.5 : 0.85
		}, 0);


		pulseTimeline.to(whiteDom, 0.5, {
			autoAlpha: 0,
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
			autoAlpha: 0,
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
			this.set[idx].index = idx;
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
	item.index = this.set.length;

	this.set.push(item);
}

BattleMenuSet.prototype.detachAll = function() {
	for (var idx = 0; idx < this.set.length; idx++) {
		this.set[idx].detachHandlers();
	}
}

BattleMenuSet.prototype.unhoverAll = function() {
	for (var idx = 0; idx < this.set.length; idx++) {
		if (this.set[idx].hoverOffHandler) this.set[idx].hoverOffHandler();
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
	this.hovered = false;

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

BattleMenuItem.prototype.attachNode = function(node) {
	this.node = node;
	this.tabNode = node.one('.shortcut-tab');
	this.dom = node.getDOMNode();
	this.tabDom = this.tabNode.getDOMNode();
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

BattleMenuItem.prototype.attachHandlers = function(hoverOnHandler, hoverOffHandler, selectHandler) {
	if (this.detached == false) this.detachHandlers();

	this.hoverOnHandler = hoverOnHandler;
	this.hoverOffHandler = hoverOffHandler;
	this.selectHandler = selectHandler;

	this.reattachHandlers();
}

BattleMenuItem.prototype.actionSelect = function() {
	this.actionSelectHandler();
}

BattleMenuItem.prototype.attachActionSelectionHandlers = function(selectHandler, unselectHandler, key) {
	var _this = this;

	_this.removeActionSelectionHandlers();

	this.actionSelectHandler = selectHandler;
	this.actionUnselectHandler = unselectHandler;
	this.actionUnselectKey = key;

	this.win.on('key', this.actionUnselectHandler, this.actionUnselectKey);
}

BattleMenuItem.prototype.removeActionSelectionHandlers = function() {
	var _this = this;

	if (_this.actionUnselectKey != null) {
		// console.log(this.actionSelectHandler);
		console.log(this.win.detach('key', this.actionUnselectHandler, this.actionUnselectKey));
		// console.log(this.win.detach('key', this.actionUnselectHandler, this.actionUnselectKey));

		// console.log(this.win.detach('key', this.actionSelectHandler, this.actionUnselectKey));

		// console.log(this.win.detach('key', this.actionSelectHandler, this.actionUnselectKey));


		this.actionSelectHandler = null;
		this.actionUnselectHandler = null;
		this.actionUnselectKey = null;
	}
	console.log(this.index);
}

BattleMenuItem.prototype.detachHandlers = function() {
	var _this = this;

	this.detached = true;

	this.node.detach('hover', _this.hoverOnHandler);
	this.node.detach('hover', _this.hoverOffHandler);
	this.node.detach('click', _this.selectHandler);
	this.win.detach('key', _this.hoverOnHandler, _this.key);
	this.win.detach('key', _this.selectHandler, _this.key);
}

BattleMenuItem.prototype.reattachHandlers = function() {
	var _this = this;

	this.detached = false;

	this.node.on('hover',  _this.hoverOnHandler,  _this.hoverOffHandler);
	this.node.on('click',  _this.selectHandler);
	this.win.on('key',  _this.hoverOnHandler,  _this.key);
	this.win.on('key',  _this.selectHandler,  _this.key);
}

BattleMenuItem.prototype.handlersAttached = function() {
	return (this.detached != null);
}

BattleMenuItem.prototype.attachIndex = function(index) {
	this.index = index;
}

BattleMenuItem.prototype.getIndex = function() {
	return this.index;
}

BattleMenuItem.prototype.isDisabled = function() {
	return (this.disabled != null && this.disabled == true);
}

BattleMenuItem.prototype.setKey = function(key) {
	this.key = key;
}

BattleMenuItem.prototype.getKey = function() {
	return this.key;
}

BattleMenuItem.prototype.hookTo = function(event, node, callbackA, callbackB) {
	node.on(event, callbackA, callbackB);
}

BattleMenuItem.prototype.unhook = function(event, node, callback) {
	node.detach(event, callback);
}

var BattleMenuItemTypes = {
	SELECT: 0,
	CONCLUDE: 1,
	SELECT_CONFIRM: 2,
	CONFIRM: 3,
	RETURN: 4
}

