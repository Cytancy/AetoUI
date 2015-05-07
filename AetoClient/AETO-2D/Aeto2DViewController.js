function Aeto2DController(masterController, A) {
	var uiNode = A.one(".aeto-ui"),
		combatUI = new AetoCombatInterface(A, uiNode);

	this.initialize = function() {
		// combatUI.on({cond1: "ae", cond2: "to"}, function(e) {
		// 	console.log(e);
		// }, true);

		// combatUI.on({egg: "ostrich"}, function(e) {
		// 	console.log(e);
		// });

		// combatUI.on({cond1: ["super", "ultra", "mega", "ultimate", "extreme"], cond2: ["sleeping", "knitting", "programming"]}, function(e) {
		// 	console.log(e);
		// }, true);

		// combatUI.on([{cond1: ['wow', 'yes'], cond2: ['you', 'can', 'really']}, {cond1: 'do', cond2: 'this'}], function(e) {
		// 	console.log(e);
		// }, true);
	}
}
 	