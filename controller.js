'use strict';

var controller = (function(){
	var events = {
		add: [],
		remove: [],
		update: [],
		calculate: [],
		clear: [],
		render: []
	};
	var auto = false;

	function on(event, listener){
		if(event in events){
			events[event].push(listener);
		}
	}

	function remove(event, listener){
		if(event in events){
			var index = events[event].indexOf(listener);
			if(index > -1){
			    events[event].splice(index, 1);
			}
		}
	}

	function trigger(event, data){
		if(event in events){
			for(var i = 0; i < events[event].length; i++){
				events[event][i].apply(null, data);
			}
		}
	}

	function autoRun(run){
		if(typeof run === 'boolean'){
			auto = run;
		}
		return auto;
	}

	return {
		on: on,
		trigger: trigger,
		autoRun: autoRun
	};
})();