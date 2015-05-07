"use strict";

AetoUtil.callMeMaybe(AetoTurnbar);

function AetoTurnbar(A, GUID, parentNode, parameters) {
	var QUICK_DRAG_SPEED = .15,
		DRAG_SPEED = .3,
		DEFAULT_ONSCREEN_SEGMENT_COUNT = 10,
		DEFAULT_MAX_SEGMENT_COUNT = 80,
		DEFAULT_SEGMENT_HISTORY_COUNT = 5;

	var _this = this,
		errorHeader = "Error (AETO-2D | Turn Bar)[" + GUID + "]",
		turnbarContainerNode, turnbarSegmentNodes, segmentContainerNode, segmentIndex,
		segmentMaxCount, segmentHistoryCount, turnbarNode, isHovered, isDragging, segmentsOnScreen,
		initialized, win, bodyNode = A.one('body');

	this.GUID = GUID;
	initialized = false;

	this.initialize = function() {
		if (!initialized) {
			initialized = true;

		    var requestId = A.io('AetoClient/AETO-2D/assets/html/AetoTurnbar.html').id;
		    
		    win = A.one(window);

		    A.on('io:complete', setup);
		}
		else {
			throw new Error(errorHeader +  ": Hudbar is already initialized, cannot be initialized again.");
		}

		function setup(id, o) {
	    	if (id == requestId) {
		    	turnbarContainerNode = A.Node.create(o.responseText);
		    	turnbarContainerNode.addClass(GUID);
				parentNode.appendChild(turnbarContainerNode);

				TweenMax.set(turnbarContainerNode.getDOMNode(), {
					visibility: 'hidden'
				});

				turnbarNode = turnbarContainerNode.one('.aeto-ui-turnbar');

				segmentMaxCount = DEFAULT_MAX_SEGMENT_COUNT;
				segmentHistoryCount = DEFAULT_SEGMENT_HISTORY_COUNT;
				segmentsOnScreen = DEFAULT_ONSCREEN_SEGMENT_COUNT;

				setupHoverExpand();
				setupSegments();
				setupTimer();
				
				A.augment(_this, A.EventTarget);
	    		A.unsubscribe('io:complete', setup);

				_this.callback('ready', GUID);
			};
	    };

		function setupHoverExpand() {
			var turnbarHoverTimline = generateTurnbarHoverTimeline();

			isHovered = false;

			turnbarNode.on('hover', function(e) {
				// turnbarContainerNode.addClass('extended');
				isHovered = true;

				turnbarHoverTimline.play();
			}, 
			function(e) {
				_this.unexpand();
			});

			_this.unexpand = function() {
				isHovered = false;

				if (!isDragging) {
					// turnbarContainerNode.removeClass('extended');

					turnbarHoverTimline.reverse();
				}
			}

			function generateTurnbarHoverTimeline() {
				var turnbarHoverTimline = new TimelineMax({paused: true});

				turnbarHoverTimline.to(turnbarNode.getDOMNode(), .35, {
					y: 10,
					ease: Power2.easeInOut
				});

				turnbarHoverTimline.to(turnbarContainerNode.one('.scroll-bar-bg').getDOMNode(), .35, {
					opacity: .24,
					y: -10,
					scaleY: 1,
					ease: Power2.easeInOut
				}, 0);

				turnbarHoverTimline.to(turnbarContainerNode.one('.point-flags-container').getDOMNode(), .35, {
					y: -6,
					ease: Power2.easeInOut
				}, 0);

				turnbarHoverTimline.to(turnbarContainerNode.one('.turn-scroll-handle-container').getDOMNode(), .35, {
					cursor: 'ew-resize',
					y: -5,
					ease: Power2.easeInOut
				}, 0);

				turnbarHoverTimline.to(turnbarContainerNode.one('.handle-bg').getDOMNode(), .35, {
					y: 1,
					ease: Power2.easeInOut
				}, 0);

				turnbarHoverTimline.to(turnbarContainerNode.one('.handle-midsection').getDOMNode(), .35, {
					scaleX: 10,
					borderRadius: 0,
					x: 5,
					height: '100%',
					transformOrigin: "center left",
					ease: Power2.easeInOut
				}, 0);
				
				turnbarHoverTimline.to(turnbarContainerNode.one('.handle-bg .border-triangle.left').getDOMNode(), .2, {
					scaleX: 1,
					autoAlpha: 1,
					transformOrigin: "center right",
					ease: Power2.easeInOut
				}, .1);

				turnbarHoverTimline.to(turnbarContainerNode.one('.handle-bg .border-triangle.right').getDOMNode(), .2, {
					scaleX: 1,
					autoAlpha: 1,
					transformOrigin: "center left",
					ease: Power2.easeInOut
				}, .22);

				turnbarHoverTimline.to(turnbarContainerNode.one('.handle-bg-frame').getDOMNode(), .5, {
					y: 0,
					autoAlpha: 1,
					ease: Back.easeInOut.config(1.4),
				}, 0);

				turnbarHoverTimline.to(turnbarContainerNode.one('.handle-frame-group').getDOMNode(), .5, {
					y: 0,
					autoAlpha: 1,
					ease: Back.easeInOut.config(1.4),
				}, .15);

				// turnbarHoverTimline.from(turnbarContainerNode.one('.handle-frame-content').getDOMNode(), .35, {
				// 	scaleX: 0,
				// 	autoAlpha: 0,
				// 	ease: Power2.easeInOut
				// }, .1);
				
				return turnbarHoverTimline;
			}
		}

		function setupSegments() {
			var speedTransition = false,
				segmentTemplateNode, scrollbarWidths, scrollbarOffsets,
				segmentValues, segmentModifiers, initialSegmentNode;

			turnbarSegmentNodes = [];

			intializeSegment();
			initializeSegmentValues();
			initializeSegmentControls();

			function intializeSegment() {
				initialSegmentNode = turnbarContainerNode.one('.turn-segment');

				segmentContainerNode = initialSegmentNode.ancestor();
				segmentTemplateNode = initialSegmentNode.cloneNode(true);

				initialSegmentNode.setStyle('display', 'none');
			}

			function initializeSegmentValues() {
				var initialContentNode = initialSegmentNode.one('.turn-segment-content'),
					initialDividerNode = initialSegmentNode.one('.segment-divider'),
					moveTime = .35,
					speedTime = .2;

				segmentValues = {};

				updateSegmentValues();

				segmentModifiers = {
					'hidden': function(attribNode, noAnim) {
						TweenMax.killTweensOf(attribNode.dom, {
							y: true,
							autoAlpha: true,
						});

						if (!speedTransition) {
							TweenMax.to(attribNode.dom, (noAnim) ? 0 : moveTime, {
								y: 350,
								autoAlpha: 0,
								ease: Power2.easeOut
							});
						}
						else {
							attribNode.sped = true;

							TweenMax.to(attribNode.dom, (noAnim) ? 0 : speedTime, {
								autoAlpha: 0,
								ease: Power2.easeOut
							});
						}

						attribNode.hidden = true;
					},
					'unhidden': function(attribNode, noAnim) {
						TweenMax.killTweensOf(attribNode.dom, {
							y: true,
							autoAlpha: true,
						});

						if (!speedTransition) {
							if (attribNode.sped) {
								attribNode.sped = false;

								TweenMax.set(attribNode.dom, {
									y: 350
								});
							}

							TweenMax.to(attribNode.dom, (noAnim) ? 0 : moveTime, {
								y: 0,
								autoAlpha: 1,
								ease: Power2.easeOut
							});
						}
						else {
							TweenMax.set(attribNode.dom, {
								y: 0
							});

							TweenMax.to(attribNode.dom, (noAnim) ? 0 : speedTime, {
								autoAlpha: 1,
								ease: Power2.easeOut
							});
						}

						attribNode.hidden = false;
					},
					'value': function(attribNode, num, noAnim) {
						attribNode.num = num;

						TweenMax.killTweensOf(attribNode.dom, {
							x: true
						});

						TweenMax.to(attribNode.dom, (noAnim != null && noAnim) ? 0 : moveTime, {
							x: num * segmentValues['segmentWidth'],
							ease: Power2.easeInOut
						});

						attribNode.hidden = false;

						if (num == 0) {
							TweenMax.killTweensOf(attribNode.contentDom, {
								left: true, width: true
							});

							TweenMax.to(attribNode.contentDom, (noAnim != null && noAnim) ? 0 : moveTime, {
								left: segmentValues['borderThickness'],
								width: segmentValues['segmentWidth'] - segmentValues['borderThickness'],
								ease: Power2.easeInOut
							});

							TweenMax.killTweensOf(attribNode.dividerDomLeft, {
								opacity: true
							});

							TweenMax.to(attribNode.dividerDomLeft, 0, {
								opacity: 0,
								ease: Power2.easeInOut
							});

							attribNode.sided = true;
						}
						else if (num == (segmentsOnScreen - 1)) {
							TweenMax.killTweensOf(attribNode.contentDom, {
								width: true
							});

							TweenMax.to(attribNode.contentDom, (noAnim != null && noAnim) ? 0 : moveTime, {
								width: segmentValues['segmentWidth'] - segmentValues['borderThickness'],
								ease: Power2.easeInOut
							});

							TweenMax.killTweensOf(attribNode.dividerDomRight, {
								opacity: true
							});

							TweenMax.to(attribNode.dividerDomRight, 0, {
								opacity: 0,
								ease: Power2.easeInOut
							});

							attribNode.sided = true;							
						}
						else if (attribNode.sided) {
							TweenMax.killTweensOf(attribNode.contentDom, {
								left: true, width: true
							});

							TweenMax.to(attribNode.contentDom, (noAnim != null && noAnim) ? 0 : moveTime, {
								left: 0,
								width: segmentValues['segmentWidth'],
								ease: Power2.easeInOut
							});

							TweenMax.killTweensOf(attribNode.dividerDomLeft, {
								opacity: true
							});

							TweenMax.killTweensOf(attribNode.dividerDomRight, {
								opacity: true
							});

							TweenMax.to([attribNode.dividerDomLeft, attribNode.dividerDomRight], 0, {
								opacity: segmentValues['dividerOpacity'],
								ease: Power2.easeInOut
							});

							attribNode.sided = false;							
						}
					},
				};

				for (var idx = 0; idx < segmentMaxCount; idx++) {
					var newAttribNode = new SegmentAttributeNode(segmentTemplateNode);

					segmentContainerNode.appendChild(newAttribNode.node);
					turnbarSegmentNodes.push(newAttribNode);

					if (idx < segmentsOnScreen) {
						segmentModifiers['value'](newAttribNode, idx, true);
					}
					else {
						segmentModifiers['value'](newAttribNode, segmentsOnScreen - 1, true);
						segmentModifiers['hidden'](newAttribNode, true);
					}
				}

				segmentIndex = 0;

				updateSegmentAppearance();

				win.on('resize', A.debounce(function(e) {
					updateSegmentValues(e);
					updateSegmentAppearance();
				}));

				function updateSegmentValues(e) {
					var winWidth = parseInt(bodyNode.getComputedStyle('width'));

					if (winWidth <= 500) {
						segmentsOnScreen = DEFAULT_ONSCREEN_SEGMENT_COUNT - 7;
					}
					else if(winWidth <= 700) {
						segmentsOnScreen = DEFAULT_ONSCREEN_SEGMENT_COUNT - 6;
					}
					else if(winWidth <= 900) {
						segmentsOnScreen = DEFAULT_ONSCREEN_SEGMENT_COUNT - 5;
					}
					else if(winWidth <= 1100) {
						segmentsOnScreen = DEFAULT_ONSCREEN_SEGMENT_COUNT - 4;
					}
					else if(winWidth <= 1300) {
						segmentsOnScreen = DEFAULT_ONSCREEN_SEGMENT_COUNT - 3;
					}
					else if(winWidth <= 1500) {
						segmentsOnScreen = DEFAULT_ONSCREEN_SEGMENT_COUNT - 2;
					}
					else if(winWidth <= 1700) {
						segmentsOnScreen = DEFAULT_ONSCREEN_SEGMENT_COUNT - 1;
					}
					else {
						segmentsOnScreen = DEFAULT_ONSCREEN_SEGMENT_COUNT;
					}

					segmentValues['segmentContainerWidth'] = parseInt(turnbarContainerNode.one('.turn-segments-container').getComputedStyle('width'));
					segmentValues['segmentWidth'] = Math.round(segmentValues['segmentContainerWidth'] / segmentsOnScreen); // This is the cause of the turnbar right border bug, cannot be fixed since browser rounds with values to px, percents cannot be utilized by GSAP
					segmentValues['borderThickness'] = parseInt(initialContentNode.getStyle('top'));
					segmentValues['dividerOpacity'] = parseInt(initialDividerNode.getStyle('opacity'));
				}

				function updateSegmentAppearance() {
					for (var idx = 0; idx < turnbarSegmentNodes.length; idx++) {
						var thisSegment = turnbarSegmentNodes[idx];

						TweenMax.set(turnbarSegmentNodes[idx].dom, {
							width: segmentValues['segmentWidth']
						});

						segmentModifiers['value'](thisSegment, turnbarSegmentNodes[idx].num, true);
					
						if (idx < segmentIndex) {
							segmentModifiers['value'](thisSegment, 0);
							segmentModifiers['hidden'](thisSegment, true);
						}
						else if (idx >= segmentIndex + segmentsOnScreen) {
							segmentModifiers['value'](thisSegment, segmentsOnScreen - 1, true);
							segmentModifiers['hidden'](thisSegment, true);
						}
						else {
							thisSegment.sided = true;
							segmentModifiers['value'](thisSegment, idx - segmentIndex, true);
							segmentModifiers['unhidden'](thisSegment, true);
						}
					}
				}
			}

			function initializeSegmentControls() {
				var handleNode = turnbarContainerNode.one('.turn-scroll-handle-container'),
					handleDom = handleNode.getDOMNode(), 
					scrollbarNode = turnbarNode.one('.turn-scroll-bar'),
					directionTimer, doms = {}, targetIndex, 
					chevronValues = {}, scrollMode;

				setupScrollWheel();
				setupScrollHandle();
				setupScrollChevronAnim();

				function setupScrollWheel() {
					turnbarNode.on('mousewheel', function(e) {
						var scrollValue = e.wheelDelta;

						if (isHovered) {
							if (scrollValue > 0) {
								scrollLeft();
							}
							else if (scrollValue < 0) {
								scrollRight();
							}
						}
					});
				}
				
				function setupScrollHandle() {
					var intialLeftHandleMargin = parseInt(scrollbarNode.getComputedStyle('left'));

					isDragging = false;

					setupHandleDragging();
					setupHandleValues();
					setupHandleClicking();
					setupHandleHoverUpdate();
					
					function setupHandleDragging() {
						var rotatorDom = handleNode.one('.handle-center-point .center-rotator').getDOMNode(),
							focusTimeline = generateFocusModeTimeline();
						
						handleNode.on('hover', function() {
							handleNode.addClass('focused-mode');

							focusTimeline.play();
						}, function() {
							handleNode.removeClass('focused-mode');

							if (!isDragging) focusTimeline.reverse();
						});

						handleNode.on('mousedown', dragStart);

						function dragStart(e) {
							var initialX = e.pageX;

							isDragging = true;
							speedTransition = true;

							win.on('mouseup', dragComplete);
							win.on('mousemove', mouseToPoint, e, intialLeftHandleMargin);
							win.on('mousemove', rotateSubcircles, e, initialX);

							A.one('body').addClass('hori-scrolling-cursor');
						}

						function dragComplete() {
							isDragging = false;

							win.detach('mouseup', dragComplete);
							win.detach('mousemove', mouseToPoint);
							win.detach('mousemove', rotateSubcircles);

							TweenMax.killTweensOf(rotatorDom, {
								rotation: true
							});

							TweenMax.to(rotatorDom, 0.55, {
								rotation: 0,
								ease: Power2.easeInOut
							});

							updateScrollHandle();

							if (isHovered == false) _this.unexpand();

							A.one('body').removeClass('hori-scrolling-cursor');
						}

						function rotateSubcircles(e, initialX) {
							A.debounce(function() {
								var distance = e.pageX - initialX;

								TweenMax.killTweensOf(rotatorDom, {
									rotation: true
								});

								TweenMax.to(rotatorDom, 0.7, {
									rotation: distance * 2.5,
									ease: Power2.easeInOut
								});
							}, 100)();
						}

						function generateFocusModeTimeline() {
							var focusTimeline = new TimelineMax({paused: true});

							focusTimeline.to(handleNode.one('.handle-bg-frame').getDOMNode(), .25, {
								scaleY: 1.08,
								ease: Power2.easeOut
							}, 0);

							focusTimeline.to(handleNode.one('.handle-center-point').getDOMNode(), .35, {
								borderRadius: '50%',
								boxShadow: 'inset 0 0 0 2px rgb(166, 166, 166)',
								rotation: 0,
								opacity: 1,
								ease: Power2.easeInOut
							}, 0);

							focusTimeline.to(handleNode.one('.sub-center-point.left').getDOMNode(), .35, {
								x: -6,
								ease: Power2.easeOut
							}, 0);

							focusTimeline.to(handleNode.one('.sub-center-point.right').getDOMNode(), .35, {
								x: 6,
								ease: Power2.easeOut
							}, 0);

							focusTimeline.to(handleNode.one('.aeto-chevron.left').getDOMNode(), .25, {
								x: 5,
								ease: Power2.easeInOut
							}, 0);

							focusTimeline.to(handleNode.one('.aeto-chevron.right').getDOMNode(), .25, {
								x: -5,
								ease: Power2.easeInOut
							}, 0);

							return focusTimeline;
						}
					}

					function setupHandleValues() {
						scrollbarWidths = {};
						scrollbarOffsets = {};

						scrollbarOffsets['extended'] = parseInt(handleNode.getStyle('width')) / 2 + intialLeftHandleMargin;
						scrollbarOffsets['unextended'] = parseInt(turnbarNode.one('.handle-bg .handle-midsection').getStyle('width')) / 2 + intialLeftHandleMargin;

						updateScrollWidths();

						win.on('resize', A.debounce(updateScrollWidths, 50));

						function updateScrollWidths() {
							var scrollWidth = parseInt(scrollbarNode.getComputedStyle('width')),
								scrollbarHandleWidth = parseInt(handleNode.getComputedStyle("width")),
								scrollbarEdgeOffsets = parseInt(turnbarNode.one('.border-triangle.left').getStyle("left"));

							scrollbarWidths['unextended'] =  scrollWidth + scrollbarEdgeOffsets ;//b 
							scrollbarWidths['extended'] = scrollWidth - scrollbarHandleWidth;

							updateScrollHandle();
						}
					}

					function setupHandleClicking() {
						var scrollbarBgNode = turnbarNode.one('.scroll-bar-bg'),
							pointsFlagsNode = turnbarNode.one('.point-flags-container'),
							hoverFlagNode = pointsFlagsNode.one('.hover-flag-container'),
							hoverFlagDom = hoverFlagNode.getDOMNode(),
							hoverFlagOffset = parseInt(hoverFlagNode.one('.hover-flag').getStyle('width')) / 2 + intialLeftHandleMargin,
							hoverTimeline = generateHoverTimline(),
							fadeTween = TweenMax.to(hoverFlagDom, .35, {
								autoAlpha: 0.7,
								paused: true,
								ease: Power2.easeInOut
							});
						
						scrollbarBgNode.on('click', function(e) {
							mouseToPoint(e);
						});

						scrollbarBgNode.on('hover', function(e) {
							hoverTimeline.play();
							fadeTween.play();

							shiftHoverPointLocation(e);

							scrollbarBgNode.on('mousemove', shiftHoverPointLocation);
						}, function() {
							hoverTimeline.pause();
							fadeTween.reverse();

							scrollbarBgNode.detach('mousemove', shiftHoverPointLocation);
						});

						function shiftHoverPointLocation(e) {
							TweenMax.set(hoverFlagDom, {
								x: e.pageX - hoverFlagOffset
							});
						}

						function generateHoverTimline() {
							var hoverTimeline = new TimelineMax({
									paused: true,
									repeat: -1
								}),
								flagDom = hoverFlagNode.one('.hover-flag').getDOMNode(),
								origBoxShadow = hoverFlagNode.one('.hover-flag').getStyle('boxShadow'),
								duration = 1.6,
								shadowSpeed = .45;

							hoverTimeline.fromTo(flagDom, duration / 2, {
								rotation: 45,
								scale: 0.8
							}, {
								rotation: 225,
								scale: 1,
								ease: Power1.easeOut
							}, 0);

							hoverTimeline.to(flagDom, duration / 2, {
								rotation: 405,
								scale: 0.8,
								ease: Power1.easeIn
							}, duration / 2);

							hoverTimeline.to(flagDom, shadowSpeed, {
								boxShadow: "inset 0 0 0 2px #FFF",
								ease: Power2.easeOut
							}, 0);

							hoverTimeline.to(flagDom, shadowSpeed, {
								boxShadow: origBoxShadow,
								ease: Power2.easeIn
							}, duration - shadowSpeed);

							return hoverTimeline;
						}
					}

					function setupHandleHoverUpdate() {
						turnbarNode.on('hover', function(e) {
							updateScrollHandle();
						}, 
						function(e) {
							if (!isDragging) {
								updateScrollHandle();
							}
						});
					}
				}

				function setupScrollChevronAnim() {
					var leftChevronNode = handleNode.one('.aeto-chevron.left'),
						leftChevronDom = leftChevronNode.getDOMNode(),
						leftChevronSegmentNodes = leftChevronNode.all('.component'),
						leftChevronSegmentDoms = [leftChevronSegmentNodes.item(0).getDOMNode(), leftChevronSegmentNodes.item(1).getDOMNode()],
						rightChevronNode = handleNode.one('.aeto-chevron.right'),
						rightChevronDom = rightChevronNode.getDOMNode(),
						rightChevronSegmentNodes = rightChevronNode.all('.component'),
						rightChevronSegmentDoms = [rightChevronSegmentNodes.item(0).getDOMNode(), rightChevronSegmentNodes.item(1).getDOMNode()];

					doms['leftChevron'] = leftChevronDom;
					doms['rightChevron'] = rightChevronDom;
					doms['leftChevronSegments'] = leftChevronSegmentDoms;
					doms['rightChevronSegments'] = rightChevronSegmentDoms;

					chevronValues['angle'] = -55;
					chevronValues['opacity'] = leftChevronNode.getStyle('opacity');


					scrollMode = "none";
				}

				function scrollLeft() {
					if (segmentIndex > 0) {
						segmentIndex--;

						segmentModifiers['hidden'](turnbarSegmentNodes[segmentIndex + segmentsOnScreen]);
						segmentModifiers['unhidden'](turnbarSegmentNodes[segmentIndex]);
						
						updateScrollSegments();
						updateScrollHandle();

						if (scrollMode != "left") {
							var leftModeTimeline = new TimelineMax({paused: true});

							scrollMode = "left";

							TweenMax.killTweensOf(doms['leftChevron'], {opacity: true});

							leftModeTimeline.to(doms['leftChevron'], .35, {
								opacity: .3
							}, 0);

							TweenMax.killTweensOf(doms['rightChevron'], {opacity: true});

							leftModeTimeline.to(doms['rightChevron'], .35, {
								opacity: .1
							}, 0);

							TweenMax.killTweensOf(doms['rightChevronSegments'][0], {skewX: true});

							leftModeTimeline.to(doms['rightChevronSegments'][0], .35, {
								skewX: chevronValues['angle']
							}, 0);

							TweenMax.killTweensOf(doms['rightChevronSegments'][1], {skewX: true});

							leftModeTimeline.to(doms['rightChevronSegments'][1], .35, {
								skewX: -chevronValues['angle']
							}, 0);

							TweenMax.killTweensOf(doms['leftChevronSegments'][0], {skewX: true});

							leftModeTimeline.to(doms['leftChevronSegments'][0], .35, {
								skewX: chevronValues['angle']
							}, 0);

							TweenMax.killTweensOf(doms['leftChevronSegments'][1], {skewX: true});

							leftModeTimeline.to(doms['leftChevronSegments'][1], .35, {
								skewX: -chevronValues['angle']
							}, 0);

							leftModeTimeline.play();

							handleDirectionTimeout();
						}

						return true;		
					}
					else {
						return false;
					}	
				}

				function scrollRight() {
					if ((segmentIndex + segmentsOnScreen) < segmentMaxCount) {
						segmentModifiers['hidden'](turnbarSegmentNodes[segmentIndex]);

						segmentModifiers['unhidden'](turnbarSegmentNodes[segmentIndex + segmentsOnScreen]);

						segmentIndex++;

						updateScrollSegments();
						updateScrollHandle();

						if (scrollMode != "right") {
							var rightModeTimeline = new TimelineMax({paused: true});

							scrollMode = "right";

							TweenMax.killTweensOf(doms['rightChevron'], {opacity: true});

							rightModeTimeline.to(doms['rightChevron'], .35, {
								opacity: .3
							}, 0);

							TweenMax.killTweensOf(doms['leftChevron'], {opacity: true});

							rightModeTimeline.to(doms['leftChevron'], .35, {
								opacity: .1
							}, 0);

							TweenMax.killTweensOf(doms['rightChevronSegments'][0], {skewX: true});

							rightModeTimeline.to(doms['rightChevronSegments'][0], .35, {
								skewX: -chevronValues['angle']
							}, 0);

							TweenMax.killTweensOf(doms['rightChevronSegments'][1], {skewX: true});

							rightModeTimeline.to(doms['rightChevronSegments'][1], .35, {
								skewX: chevronValues['angle']
							}, 0);

							TweenMax.killTweensOf(doms['leftChevronSegments'][0], {skewX: true});

							rightModeTimeline.to(doms['leftChevronSegments'][0], .35, {
								skewX: -chevronValues['angle']
							}, 0);

							TweenMax.killTweensOf(doms['leftChevronSegments'][1], {skewX: true});

							rightModeTimeline.to(doms['leftChevronSegments'][1], .35, {
								skewX: chevronValues['angle']
							}, 0);

							rightModeTimeline.play();

							handleDirectionTimeout();
						}

						return true;
					}
					else {
						return false;
					}
				}

				function handleDirectionTimeout() {
					if (directionTimer == null || directionTimer == 0) {
						directionTimer = 1;

						selfTimerLoop();
					}
					else {
						directionTimer = 2;
					}
					
					function selfTimerLoop() {
						TweenMax.delayedCall(.55, function() {
							if (directionTimer == 1) {
								directionTimer = 0;
								
								if (scrollMode != "none") {
									var noneModeTimeline = new TimelineMax({paused: true});

									scrollMode = "none";

									TweenMax.killTweensOf(doms['leftChevron'], {opacity: true});
									TweenMax.killTweensOf(doms['rightChevron'], {opacity: true});

									noneModeTimeline.to([doms['leftChevron'], doms['rightChevron']], .35, {
										opacity: chevronValues['opacity']
									}, 0);


									TweenMax.killTweensOf(doms['rightChevronSegments'][0], {skewX: true});

									noneModeTimeline.to(doms['rightChevronSegments'][0], .35, {
										skewX: -chevronValues['angle']
									}, 0);

									TweenMax.killTweensOf(doms['rightChevronSegments'][1], {skewX: true});

									noneModeTimeline.to(doms['rightChevronSegments'][1], .35, {
										skewX: chevronValues['angle']
									}, 0);

									TweenMax.killTweensOf(doms['leftChevronSegments'][0], {skewX: true});

									noneModeTimeline.to(doms['leftChevronSegments'][0], .35, {
										skewX: chevronValues['angle']
									}, 0);

									TweenMax.killTweensOf(doms['leftChevronSegments'][1], {skewX: true});

									noneModeTimeline.to(doms['leftChevronSegments'][1], .35, {
										skewX: -chevronValues['angle']
									}, 0);

									noneModeTimeline.play();
								}
							}
							else {
								 directionTimer = 1;
								 selfTimerLoop();
							}
						});
					}
				}

				function updateScrollSegments() {
					for (var idx = 0; idx < segmentsOnScreen; idx++) {
						segmentModifiers['value'](turnbarSegmentNodes[segmentIndex + idx], idx);
					}
				}

				function mouseToPoint(e) {
					var scrollWidth, location;

					if (isHovered || isDragging) {
						scrollWidth = scrollbarWidths['extended'];

						location = e.pageX - scrollbarOffsets['extended'];
					}
					else {
						scrollWidth = scrollbarWidths['unextended'];

						location = e.pageX - scrollbarOffsets['unextended'];
					}

					if (location < 0) location = 0;

					var newPoint = Math.round(location / scrollWidth * (segmentMaxCount - segmentsOnScreen));

					if (newPoint != segmentIndex) {
						speedTransition = true;
						scrollToIndex(newPoint);
						speedTransition = false;
					}
				}

				function scrollToIndex(index, onCoplete) {
					var indexDistance = index - segmentIndex,
						direction = 1;

					targetIndex = index;

					if (indexDistance < 0) {
						indexDistance = Math.abs(indexDistance);
						direction = -1;
					}

					for (var idx = 0; idx < indexDistance; idx++) {
						if (targetIndex > segmentIndex && direction > 0) {
							scrollRight();
						}
						else if (targetIndex < segmentIndex && direction < 0) {
							scrollLeft();
						}
					}
				}

				function updateScrollHandle() {
					var scrollWidth = (isHovered || isDragging) ? scrollbarWidths['extended'] : scrollbarWidths['unextended'],
						newX = Math.round(segmentIndex / (segmentMaxCount - segmentsOnScreen) * scrollWidth);

					TweenMax.killTweensOf(handleDom, {
						x: true
					});

					TweenMax.to(handleDom, (speedTransition ? QUICK_DRAG_SPEED : DRAG_SPEED), {
						x: newX,
						ease: (speedTransition ? Power0.easeNone : Power2.easeInOut)
					});
				}
			}
		}

		function setupTimer() {
			var timerNodes, timerDoms, timelines = {};

			timerNodes = {};

			timerNodes['bar'] = turnbarNode.one('.timer-bar');
			timerNodes['bar-container'] = turnbarNode.one('.timer-bar-container');
			timerNodes['container'] = turnbarNode.one('.timer-container');
			timerNodes['sec'] = timerNodes['container'].one('.timer-seconds');
			timerNodes['csec'] = timerNodes['container'].one('.timer-centiseconds');
			timerNodes['shortHand'] = timerNodes['container'].one('.clock-hand.short');
			timerNodes['longHand'] = timerNodes['container'].one('.clock-hand.long');

			timerDoms = {};

			for (var key in timerNodes) {
				if (timerNodes.hasOwnProperty(key)) {
					timerDoms[key] = timerNodes[key].getDOMNode();
				}
			}

		 	timelines['timerEnter'] = new TimelineMax({paused: true});

		 	var darkDom = timerNodes['container'].one('.dark').getDOMNode(),
		 		lightDom = timerNodes['container'].one('.light').getDOMNode(),
		 		clockCircleDom = timerNodes['container'].one('.clock-circle').getDOMNode(),
		 		apostropheDom = timerNodes['container'].one('.timer-apostrophe').getDOMNode();

		 	timelines['timerEnter'].fromTo(timerDoms['container'], 0.01, {
		 		visibility: 'hidden'
		 	}, {
		 		visibility: 'visible'
		 	}, 0);

		 	timelines['timerEnter'].from(darkDom, .45, {
		 		y: -35,
		 		ease: Back.easeOut.config(2)
		 	}, 0);

		 	timelines['timerEnter'].from(lightDom, .55, {
		 		y: -35,
		 		ease: Back.easeOut.config(2)
		 	}, .15);

		 	timelines['timerEnter'].from(darkDom, .5, {
		 		opacity: 0
		 	}, 0);

		 	timelines['timerEnter'].from(lightDom,.5, {
		 		opacity: 0
		 	}, .15);

		 	timelines['timerEnter'].from(clockCircleDom, .45, {
		 		opacity: 0,
		 		scale: 1.5,
		 		ease: Power2.easeInOut
		 	}, .2);

		 	timelines['timerEnter'].from(timerDoms['longHand'], .45, {
		 		scaleY: 0,
				opacity: 0,
				transformOrigin: "bottom center",
		 		ease: Power2.easeIn
		 	}, .2);

		 	timelines['timerEnter'].from(timerDoms['shortHand'], .45, {
				scaleY: 0,
				opacity: 0,
				transformOrigin: "bottom center",
		 		ease: Power2.easeIn
		 	}, .35);

		 	timelines['timerEnter'].from(timerDoms['sec'], .4, {
				x: -30,
				opacity: 0,
		 		ease: Power2.easeInOut
		 	}, .55);

		 	timelines['timerEnter'].from(timerDoms['csec'], .4, {
				x: 30,
				opacity: 0,
		 		ease: Power2.easeInOut
		 	}, .55);

		 	timelines['timerEnter'].from(apostropheDom, .4, {
				y: -20,
				opacity: 0,
		 		ease: Power2.easeInOut
		 	}, .7);

		 	_this.runTimer = function(duration) {
				var seconds = Math.trunc(duration / 1000),
					cenSeconds = (duration % 1000) / 1000,
					clockInterval = duration / 12,
					degreeInterval = 30,
					clockCounter = 0,
					animCounter = 0,
					secTimer = {sec: seconds},
					csecTimer = {csec: 0},
					textActive = false,
					textTimeout;

				timelines['timerEnter'].play();

				operateTimer();
				operateClock();

				function operateTimer() {
					if (cenSeconds != 0) {
						var initialTimeline = new TimelineMax({paused: true,
							onComplete: function() {
								updateSec();
								cycleTimer();
							}
						});

						secTimer.sec += 2;
						updateSec();

						initialTimeline.fromTo(csecTimer, cenSeconds, {
							csec: parseInt(cenSeconds * 100),
						}, {
							csec: 0,
							roundProps: 'csec',
							ease: Linear.easeNone,
							onUpdate: updateCsec
						}, 0);

						initialTimeline.play();
					}
					else {
						cycleTimer();
					}

					function cycleTimer() {
						var timerTimeline = new TimelineMax({paused: true, repeat: seconds - 1});
						
						timerTimeline.fromTo(csecTimer, 1, {
							csec: 99,
						}, {
							csec: 0,
							roundProps: 'csec',
							ease: Linear.easeNone,
							onUpdate: updateCsec
						}, 0);

						timerTimeline.to(secTimer, 1, {
							ease: Linear.easeNone,
							onStart: updateSec
						}, 0);

						timerTimeline.play();
					}

					function updateSec() {
						secTimer.sec--;

						if (secTimer.sec < 10) secTimer.sec = '0' + secTimer.sec;

						timerNodes['sec'].set('textContent', secTimer.sec);
					}

					function updateCsec() {
						if (!textActive) {
							if (csecTimer.csec < 10) csecTimer.csec = '0' + csecTimer.csec;
							timerNodes['csec'].set('textContent', csecTimer.csec);

							textActive = true;
							clearTimeout(textTimeout);
							textTimeout = setTimeout(function() { textActive = false; }, 30);
						}
					}
				}
					
				function operateClock() {
					var clockTimeline = new TimelineMax({paused: true, repeat: 11, onComplete: closeTimer});

					TweenMax.set(timerDoms["longHand"], {rotation: 0, transformOrigin: "bottom center"});

					clockTimeline.fromTo(timerDoms["shortHand"], clockInterval / 1000, {
						rotation: 0,
					}, {
						rotation: 360,
						transformOrigin: "bottom center",
						ease: Power0.easeNone,
						onComplete: rotateLongHand
					}, 0);

					function rotateLongHand() {
						TweenMax.to(timerDoms["longHand"], .1, {
							rotation: '+=' + degreeInterval,
							transformOrigin: "bottom center",
							ease: Power2.easeInOut
						});
					}

					clockTimeline.play();
				}

				function closeTimer() {
					timelines['timerEnter'].reverse();
				}
			}
		}
	}

	this.enter = function(doAnimate) {
		if (doAnimate) {
			var animCounter = 0,
				entryTimeline = new TimelineMax({paused: true, delay: 1});

			entryTimeline.from(turnbarContainerNode.one('.dark-bg').getDOMNode(), .45, {
				y: '-100%',
				ease: Back.easeOut.config(1.3)
			}, 0);

			entryTimeline.from(turnbarContainerNode.one('.dark-back-bg').getDOMNode(), .45, {
				y: '-100%',
				ease: Back.easeOut.config(1.3)
			}, .15);

			entryTimeline.from(turnbarContainerNode.one('.scroll-bar-bg').getDOMNode(), .75, {
				scaleX: 0,
				opacity: .2,
				ease: Power2.easeInOut
			}, .3);

			entryTimeline.from(turnbarContainerNode.one('.turn-scroll-handle-container').getDOMNode(), .45, {
				x: 30,
				opacity: 0,
				ease: Back.easeOut.config(1.3)
			}, .85);

			entryTimeline.from(turnbarContainerNode.one('.turn-segments-container').getDOMNode(), .55, {
				y: 30,
				opacity: 0,
				ease: Back.easeOut.config(1.3)
			}, .6);

			var allianceBarRate = .08;

			for (var idx = 0; idx < segmentsOnScreen; idx++) {
				var itemTimeline = new TimelineMax();

				itemTimeline.from(turnbarSegmentNodes[segmentIndex + idx].node.one('.turn-segment-background').getDOMNode(), .3, {
					opacity: 0
				}, 0);

				itemTimeline.from(turnbarSegmentNodes[segmentIndex + idx].node.one('.turn-segment-content').getDOMNode(), .45, {
					opacity: 0,
					skewY: .3
				}, .25);

				itemTimeline.from(turnbarSegmentNodes[segmentIndex + idx].node.one('.turn-segment-content').getDOMNode(), .45, {
					y: '150%',
					ease: Power2.easeOut
				}, .25);

				itemTimeline.from(turnbarSegmentNodes[segmentIndex + idx].node.one('.framework-icon').getDOMNode(), .4, {
					y: -40,
					ease: Back.easeOut.config(1.3)
				}, .45);

				itemTimeline.from(turnbarSegmentNodes[segmentIndex + idx].node.one('.character-icon').getDOMNode(), .4, {
					y: 40,
					ease: Back.easeOut.config(1.3)
				}, .6);

				itemTimeline.from(turnbarSegmentNodes[segmentIndex + idx].node.one('.character-name').getDOMNode(), .4, {
					x: -40,
					opacity: 0,
					ease: Back.easeOut.config(1.3)
				}, .75);

				itemTimeline.from(turnbarSegmentNodes[segmentIndex + idx].node.one('.turn-number-text').getDOMNode(), .4, {
					y: -30,
					ease: Back.easeOut.config(1.3)
				}, .85);

				itemTimeline.from(turnbarSegmentNodes[segmentIndex + idx].node.one('.turn-number').getDOMNode(), .4, {
					y: 30,
					ease: Back.easeOut.config(1.3)
				}, .95);

				entryTimeline.add(itemTimeline, 1 + idx * .1);

				entryTimeline.from([turnbarSegmentNodes[segmentIndex + idx].node.one('.segment-divider.left').getDOMNode(), turnbarSegmentNodes[segmentIndex + idx].node.one('.segment-divider.right').getDOMNode()], .35, {
					opacity: 0
				}, 2.4);

				entryTimeline.from(turnbarSegmentNodes[segmentIndex + idx].node.one('.alliance-bar').getDOMNode(), allianceBarRate, {
					scaleX: 0,
					transformOrigin: "center left",
					ease: Power0.easeNone
				}, 2.2 + allianceBarRate * idx);

				entryTimeline.from(turnbarSegmentNodes[segmentIndex + idx].node.one('.alliance-bar').getDOMNode(), allianceBarRate * segmentsOnScreen + .55, {
					opacity: .3
				}, 2.2);

				entryTimeline.from(turnbarSegmentNodes[segmentIndex + idx].node.one('.alliance-bar').getDOMNode(), allianceBarRate * segmentsOnScreen, {
					scaleY: .2
				}, 2.2);
			}

			TweenMax.set(turnbarContainerNode.getDOMNode(), {
				visibility: 'visible'
			});

			entryTimeline.play();

			// function handler(e) {
			// 	animCounter++;
				
			// 	if (animCounter >= 500) {
			// 		Aeto2DUtil.removeAnimationEndListener(turnbarContainerNode, handler);

			// 		turnbarContainerNode.removeClass("anim-enter");
			// 		turnbarContainerNode.removeClass("marked-for-anim-enter");
			// 		_this.callback('entered', GUID);
			// 	}
			// }

			// turnbarContainerNode.addClass("marked-for-anim-enter");

			// Aeto2DUtil.addAnimationEndListener(turnbarContainerNode, handler);

			// Aeto2DUtil.unhideNode(turnbarContainerNode);
			// turnbarContainerNode.addClass("anim-enter");
		}
		else {
			Aeto2DUtil.unhideNode(turnbarContainerNode);
		}
	}

	this.test = function() {
		// trans-hidden is the class to update info (e.g hides the values so they can be changed)

		turnbarNode.one('.turn-segment').addClass('history');
		setTimeout(function() {
			turnbarNode.one('.turn-segment.two').addClass('history');
			turnbarNode.one('.turn-segment.four').addClass('active-segment');
		}, 300);
	}
}

// Support object classes

function SegmentAttributeNode(templateNode) {
	this.node = templateNode.cloneNode(true);
	this.dom = this.node.getDOMNode()
	this.contentDom = this.node.one('.turn-segment-content').getDOMNode();
	this.dividerDomLeft = this.node.one('.segment-divider.left').getDOMNode();
	this.dividerDomRight = this.node.one('.segment-divider.left').getDOMNode();
}