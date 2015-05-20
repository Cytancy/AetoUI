AetoUtil.callMeMaybe(AetoCombatInterface);

function AetoCombatInterface(A, parentNode) {
	var _this = this,
		teamColors = {},
		activeTeam = "cytan";

	teamColors["cytan"] = "#37a4ff";

	// setTimeout(function() {
	// 	// _this.callback('everything', "yayeverything");
	// 	// _this.callback('something', "yaysomething");
	// 	_this.callback({cond1: "to", cond2: "ae"}, "yayaeto");
	// 	_this.callback({cond1: "to", cond2: "ae"}, "yayaeto");
	// 	_this.callback({cond1: "to", cond2: "ae"}, "yayaeto");
		
	// 	// _this.callback({egg: "ostrich"}, "omelette");

	// 	_this.callback({cond1: "super", cond2: "knitting"}, "yayknitting");
	// 	_this.callback({cond1: "ultra", cond2: "sleeping"}, "yaysleeping");
	// 	_this.callback({cond1: "this", cond2: "do"}, "yaydoing");
	// }, 100);

	var hudbar = new AetoHudbar(A, AetoUtil.generateRandomIdOfLength(3), parentNode);
	var hudbar2 = new AetoHudbar(A, AetoUtil.generateRandomIdOfLength(3), parentNode);

	hudbar.initialize();
	hudbar2.initialize();

	hudbar.on('ready', function(e) {
		hudbar.enter(false);
		hudbar.setMaxTP(100, false);
		hudbar.setMaxHP(2400, false);
		hudbar.setMaxEP(80, false);

		setTimeout(function(){hudbar.setTP(100, true); hudbar.setHP(2400, true); hudbar.setEP(80, true);
			setTimeout(function(){hudbar.setTP(50, true); hudbar.setHP(1400, true); hudbar.setEP(20, true);
				setTimeout(function(){hudbar.setTP(20, true); hudbar.setHP(300, true); hudbar.setEP(60, true);
					setTimeout(function(){hudbar.setTP(80, true)}, 2000); hudbar.setHP(1800, true); hudbar.setEP(80, true);
				
					setTimeout(function(){
						hudbar.cycleTP();
						hudbar.cycleEP();
						hudbar.cycleHP();
					}, 4000);
				}, 2000);

			}, 2000);
		}, 1000);


		// setTimeout(function() {
		// 	// hudbar.setEPR(150, true);
		// 	// hudbar.setHPR(299, true);
		// 	hudbar.setTP(100, true);
		// 	setTimeout(function() {
		// 		hudbar.setHP(2400, true);
		// 		setTimeout(function() {
		// 			hudbar.setEP(80, true);
		// 			// hudbar.cyclePortrait();
					
		// 			setTimeout(function() {
		//     			setTimeout(function() {
		// 	    			hudbar.addEffectItem("1", true);
		// 	    			hudbar.addEffectItem("2", true);
		// 	    			hudbar.addEffectItem("3", true);
		// 	    			hudbar.addEffectItem("4", true);
		// 	    			hudbar.addEffectItem("5", true);
		// 	    			hudbar.addEffectItem("6", true);
		// 	    			hudbar.addEffectItem("7", true);
		// 	    			hudbar.addEffectItem("8", true);

		// 	    			setTimeout(function() {
		// 	    				hudbar.removeEffectItem("3", true);
		// 	    				hudbar.addEffectItem("5", true);
		// 	    				hudbar.removeEffectItem("7", true);
		// 	    			}, 1000)
		// 	    		}, 100)
		// 			}, 2000);
		// 		}, 500);
		// 	}, 500);
		// }, 3500);
	    
	    hudbar.setAlliance("player");
		// console.log(e);
	});

	// hudbar2.on('ready', function(e) {
	// 	hudbar2.setAlignmentRight();
	// 	hudbar2.enter(false);
	// 	hudbar2.setTPR(10, false);
	// 	hudbar2.setEPR(10, false);
	// 	hudbar2.setHPR(10, false);
	// });

	// hudbar.setHP(1.0);
	// hudbar.setEP(1.0);

	

	// hudbar.hideForAnim();
	// hudbar.animateEntry();

    // 	hudbar.on("entryAnimationComplete", function() {
    // 		setTimeout(function() {

				// // hudbar.cycleTP();

				// // hudbar.cycleHP();
		  // //   	hudbar.cycleEP();

    // 			hudbar.setTP(100, true);

    // 			// setTimeout(function() {
		  //   	// 	hudbar.setTP(30, true);
		  //   	// 	setTimeout(function() {
		  //   	// 	}, 2500);

		  //   	// 	setTimeout(function() {
		  //   	// 		hudbar.setTP(80, true);

		  //   	// 		setTimeout(function() {
		  //   	// 			hudbar.setTP(20, true);
		  //   	// 		},1200);
		  //   	// 	},1500);
		  //   	// },1500);

    // 			setTimeout(function() {
    // 				hudbar.setHP(2400, true);

    // 				setTimeout(function() {
    // 					hudbar.setEP(80, true);
	   //  			}, 350);
	   //  		}, 350);
    // 		}, 0);




    	// hudbar.setTP(100, false);
    	// hudbar.setHP(2400, false);
    	// hudbar.setEP(80, false);


  //   	hudbar.cycleTP();
		// hudbar.cycleHP();
  //   	hudbar.cycleEP();
  //   	hudbar.cyclePortrait();

		// setTimeout(function() {
  //   			hudbar.setTP(100, true);

  //   			// setTimeout(function() {
		//     	// 	hudbar.setTP(30, true);
		//     	// 	setTimeout(function() {
		//     	// 	}, 2500);

		//     	// 	setTimeout(function() {
		//     	// 		hudbar.setTP(80, true);

		//     	// 		setTimeout(function() {
		//     	// 			hudbar.setTP(20, true);
		//     	// 		},1200);
		//     	// 	},1500);
		//     	// },1500);

  //   			setTimeout(function() {
  //   				hudbar.setHP(2400, true);

  //   				setTimeout(function() {
  //   					hudbar.setEP(80, true);
	 //    			}, 350);
	 //    		}, 350);
  //   		}, 0);

    	// hudbar.setTP(100, false);
    	


  //   	setTimeout(function() {
  //   		// hudbar.uncycleHP();

  //   		hudbar.setHP(2000, true);
  //   		setTimeout(function() {
  //   			hudbar.setHP(10, true);

  //   			setTimeout(function() {
	 //    			hudbar.setHP(2300, true);

	 //    		},1400);
  //   		},600);
  //   	},1200);

    	// hudbar.setTPR(40, true);

    	// setTimeout(function() {
    	// 	hudbar.setSpeed(-40, true);
    	// }, 1000);


    	// setTimeout(function() {
    	// 	hudbar.setHP(2300, true);
    	// 	setTimeout(function() {
	    // 		hudbar.setHP(2250, true);

	    // 		setTimeout(function() {
		   //  		hudbar.setHP(2200, true);

		   //  		setTimeout(function() {
			  //   		hudbar.setHP(1050, true);

			  //   		setTimeout(function() {
				 //    		hudbar.setHP(2100, true);

				 //    		setTimeout(function() {
					//     		hudbar.setHP(2150, true);

					//     		setTimeout(function() {
					// 	    		hudbar.setHP(2200, true);
					//     		}, 300);


					//     		setTimeout(function() {
					//     		// hudbar.setHP(1000, true);
					//     		}, 2000);
					//     	}, 300);
				 //    	}, 300);
			  //   	}, 300);
		   //  	}, 300);
	    // 	}, 300);

    	// }, 300);

    	// hudbar.setEP(0, false);

    	// hudbar.setEP(80, false);

    	// setTimeout(function() {
    	// 	hudbar.setEP(20, true);

    	// 	setTimeout(function() {
    	// 		hudbar.setEP(40, true);

    	// 		setTimeout(function() {
	    // 			// hudbar.setHP(2300, true);
	    // 		},1400);
    	// 	},600);
    	// },1200);

	var turnbar = new AetoTurnbar(A, AetoUtil.generateRandomIdOfLength(3), parentNode);
	
	turnbar.on('ready', function(e) {
		turnbar.enter(true);
			turnbar.runTimer(30500);

		turnbar.on('entered', function(e) {
			turnbar.test();
		});
	});

	turnbar.initialize();


	var battleMenu = new AetoBattleMenu(A, AetoUtil.generateRandomIdOfLength(3), parentNode);

	battleMenu.initialize();

	battleMenu.setColor(teamColors[activeTeam]);
	
	battleMenu.on('ready', function(e) {
		var subsubmenu1 = new BattleMenuSet([new BattleMenuItem({name: "1", type: BattleMenuItemTypes.SELECT}),
			                        	  new BattleMenuItem({name: "2", type: BattleMenuItemTypes.SELECT}),
			                        	  new BattleMenuItem({name: "3", type: BattleMenuItemTypes.SELECT}),
			                        	  new BattleMenuItem({name: "deepTest", type: BattleMenuItemTypes.SELECT}),
			                        	  new BattleMenuItem({name: "5", type: BattleMenuItemTypes.SELECT})
		                        		]),
			submenu1 = new BattleMenuSet([new BattleMenuItem({name: "1", type: BattleMenuItemTypes.SELECT}),
			                        	  new BattleMenuItem({name: "1", type: BattleMenuItemTypes.SELECT}),
			                        	  new BattleMenuItem({name: "1", type: BattleMenuItemTypes.SELECT}),
			                        	  new BattleMenuItem({name: "1", type: BattleMenuItemTypes.SELECT, childSet: subsubmenu1}),
			                        	  new BattleMenuItem({name: "1", type: BattleMenuItemTypes.SELECT}),
			                        	  new BattleMenuItem({name: "1", type: BattleMenuItemTypes.SELECT}),
			                        	  new BattleMenuItem({name: "1", type: BattleMenuItemTypes.SELECT}),
			                        	  new BattleMenuItem({name: "1", type: BattleMenuItemTypes.SELECT})
		                        		]);

		// Disabled param not yet supported
		battleMenu.openMenuList({x: 800, y: 600}, 
		                        new BattleMenuSet([
		                        	new BattleMenuItem({name: "1", type: BattleMenuItemTypes.SELECT, icon: {name: "sword-attack", layers: 2}}),
		                        	new BattleMenuItem({name: "1", type: BattleMenuItemTypes.SELECT, icon: {name: "crystal", layers: 2}}),
		                        	new BattleMenuItem({name: "inventory", type: BattleMenuItemTypes.SELECT, icon: {name: "pack", layers: 2}}),
		                        	new BattleMenuItem({name: "4", type: BattleMenuItemTypes.SELECT, icon: {name: "move", layers: 2}, childSet: submenu1}),
		                        	new BattleMenuItem({name: "1", type: BattleMenuItemTypes.SELECT, icon: {name: "guard", layers: 2}}),
		                        	new BattleMenuItem({name: "1", type: BattleMenuItemTypes.SELECT, icon: {name: "wait", layers: 2}}),
		                        ]));


		var blah = 0;
		battleMenu.on('itemSelected', function(e) {
			var item = e.eventObject;

			// if (item.name == "4") {
			// 	if (blah == 0) {
			// 		battleMenu.disableItem("inventory");
			// 		battleMenu.disableItem("deepTest");

			// 		blah = 1;
			// 	}
			// 	else {
			// 		battleMenu.enableItem("inventory");
			// 		battleMenu.enableItem("deepTest");

			// 		blah = 0;
			// 	}
				
			// }
		}, {isContinuous: true});
	});
}