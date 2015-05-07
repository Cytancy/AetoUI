"use strict";

YUI().ready(
    'aui-node', 'event-custom', 'io-base', 'event','dd',
	function AetoClientMasterController(A) {
		Aeto2DUtil.loadAUI(A);

		var _this = this,
			uiController = new AetoUIController(_this),
			viewController2D = new Aeto2DController(_this, A);

		uiController.initialize();
		viewController2D.initialize();
	}
);