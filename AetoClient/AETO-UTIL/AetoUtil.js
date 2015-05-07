"use strict";

function AetoUtil() {
	this.generateRandomIdOfLength = function(length) {
	    var S4 = function() {
	       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	    };

	    var id = "";

	    for (var i = 0; i < length; i++) {
	    	id = id + S4();
	    }

	    return id;
	}

	this.callMeMaybe = function(objectType) {
		var AetoCallbackPrototype = {
			on: function(cond, func, isContinous) {
				if (this.callbackQueue == null) this.callbackQueue = {};
				if (this.functionHash == null) this.functionHash = {};

				var functionId, 
				callbackQueue = this.callbackQueue,
				functionHash = this.functionHash;
				
				if (isContinous == null) isContinous = false; 

				while (functionId == null || functionHash[functionId] != null) functionId = AetoUtil.generateRandomIdOfLength(2);

				functionHash[functionId] = func;

				if (Array.isArray(cond)) {
					for (var idx = 0; idx < cond.length; idx++) {
						processCondition(cond[idx]);
					}
				}
				else {
					processCondition(cond);
				}

				function processCondition(checkedCond) {
					if (typeof checkedCond == 'string' || checkedCond instanceof String) {
						pushToQueue(checkedCond);
					}
						else if (Array.isArray(checkedCond)) {
						throw new Error("[AetoCallback] Error: Improper callback syntax. A condition array cannot be nested within another condition array.");
					}
					else {
						if (checkedCond.cond1 == null || checkedCond.cond2 == null) {
							pushToQueue(checkedCond);

							if (checkedCond.cond1 != null || checkedCond.cond2 != null) {
								throw new Error("[AetoCallback] Error: Please do not use 'cond1' or 'cond2' as value names for non-conditional objects.");
							}
						}
						else {
							var length = 0;

							for (var key in checkedCond) {
								if (checkedCond.hasOwnProperty(key)) length++;
							}

							if (length > 2) {
								throw new Error("[AetoCallback] Error: Multi-conditions are limited to two conditions (e.g. {cond1: --, cond2: --}.");
							}
							else if (length < 2) {
								throw new Error("[AetoCallback] Error: Only use curly braces for multi-conditions.");
							}
							else {
								var oneIsArray = Array.isArray(checkedCond.cond1),
					                twoIsArray = Array.isArray(checkedCond.cond2);

								if (oneIsArray || twoIsArray) {
									if (oneIsArray) {
										for (var idx = 0; idx < checkedCond.cond1.length; idx++) {
											if (twoIsArray) {
												for (var jdx = 0; jdx < checkedCond.cond2.length; jdx++) {
													pushToQueue({cond1: checkedCond.cond1[idx], cond2: checkedCond.cond2[jdx]});
												}
											}
											else {
												pushToQueue({cond1: checkedCond.cond1[idx], cond2: checkedCond.cond2});
											}
										}
									}
									else if (twoIsArray) {
										for (var idx = 0; idx < checkedCond.cond2.length; idx++) {
											pushToQueue({cond1: checkedCond.cond1, cond2: checkedCond.cond2[idx]});
										}
									}
									else {
										throw new Error("[AetoCallback] Error: Browser does not support array-checking.");
									}
								}
								else {
									pushToQueue(checkedCond);
								}
							}
						}
					}

					function pushToQueue(finalCond) {		
						finalCond = JSON.stringify(finalCond);

						if (callbackQueue[finalCond] == null) callbackQueue[finalCond] = [];

						callbackQueue[finalCond].push({funcId: functionId, isContinous: isContinous});
					}
				} 
			}, 
			callback: function(cond, eventObject) {
				if (this.callbackQueue == null) this.callbackQueue = {};
				if (this.functionHash == null) this.functionHash = {};

				var hasCalledAFunction = false, 
					callbackQueue = this.callbackQueue,
					functionHash = this.functionHash;

				if (Array.isArray(cond)) {
					for (var idx = 0; idx < cond.length; idx++) {
						processCondition(cond[idx]);
					}
				}
				else {
					processCondition(cond);
				}

				return hasCalledAFunction;

				function processCondition(givenCond) {
					if (typeof givenCond == 'string' || givenCond instanceof String) {
						runCallbackForCond(givenCond);				
					}
					else if (Array.isArray(givenCond)) {
						throw new Error("[AetoCallback] Error: Improper callback syntax. A condition array cannot be nested within another condition array.");
					}
					else {
						if (givenCond.cond1 == null && givenCond.cond2 == null) {
							runCallbackForCond(givenCond);
						}
						else {
							var length = 0;

							for (var key in givenCond) {
								if (givenCond.hasOwnProperty(key)) length++;
							}

							if (length > 2) {
								throw new Error("[AetoCallback] Error: Multi-conditions are limited to two conditions (e.g. {cond1: --, cond2: --}.");
							}
							else if (length < 2) {
								throw new Error("[AetoCallback] Error: Only use curly braces for multi-conditions.");
							}
							else {
								runCallbackForCond(givenCond);
								runCallbackForCond(givenCond.cond1);
								runCallbackForCond(givenCond.cond2);
								runCallbackForCond({cond1: givenCond.cond2, cond2: givenCond.cond1});
							}
						}
					}

					function runCallbackForCond(finalCond) {
						var queue = callbackQueue[JSON.stringify(finalCond)];

						if (queue != null) {
							var queueLength = queue.length;

							for (var idx = 0; idx < queueLength; idx++) {
								hasCalledAFunction = true;

								var callbackedFunction = functionHash[queue[idx].funcId];

								if (callbackedFunction != null) callbackedFunction({cond: finalCond, eventObject: eventObject});

								if (!queue[idx].isContinous) {
									functionHash[queue[idx].funcId] = null;

									queue.splice(idx, 1);

									idx--;
									queueLength--;
								}
							}
						}
						
					}
				}
			}
		};

		objectType.prototype = Object.create(AetoCallbackPrototype);
		objectType.prototype.constructor = objectType;

		return objectType;
	}

	this.clamp = function(number, min, max) {
		return Math.max(min, Math.min(number, max));
	}

	this.randomInRangeInt = function(min, max) {
		return Math.floor(Math.random()*(max - min + 1) + min);
	}

	this.randomInRange = function(min, max) {
		return Math.random()*(max - min) + min;
	}
}

AetoUtil = new AetoUtil();