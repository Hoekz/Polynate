'use strict';

importScripts('delaunay.js');

(function(){
	var vertices = [];
	var triangles = [];
	var upToDate = true;

	var addPoint = function(x, y){
		vertices.push([x,y]);
		return points;
	};

	var removePoint = function(x, y){
		for(var i = 0; i < vertices.length; i++){
			if(vertices[i][0] == x && vertices[i][1] == y){
				vertices.splice(i, 1);
				return points;
			}
		}
		return points;
	};

	var points = {
		add: addPoint,
		remove: removePoint
	};

	onmessage = function(event){
		var data = event.data;
		switch(data.type){
			case 'new_point':
				points
					.add(data.x, data.y);
				break;
			case 'del_point':
				points
					.remove(data.x, data.y);
				break;
			case 'move_point':
				points
					.remove(data.oldX, data.oldY)
					.add(data.newX, data.newY);
				break;
			case 'clear':
				vertices = [];
			case 'calc':
			case 'render':
				break;
		}
		if(data.calc){
			var v = vertices;
			var t = triangles = Delaunay.triangulate(v);
			var real = [];
			for(var i = t.length-1; i >= 0; i-=3){
				real.push([
					v[t[i]],
					v[t[i-1]],
					v[t[i-2]]
				]);
			}
			postMessage({
				cb: data.cb,
				triangles: real
			});
		}
	}
})();