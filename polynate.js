'use strict';

/*
 * Polynate.js - A JavaScript implementation of Low Poly Art
 *
 * Description - Given an image, gradient, or solid color, Polynate generates
 * a low poly form given a series of vertices forming triangles. Currently,
 * the implementation generates these triangles using Delaunay triangulation
 * on a series of points that can be randomly generated or placed in the
 * editor or a combination of the two. The color of each triangle is then
 * determined by averaging the contained pixels. The coloration is not
 * calculated until specified due to it's computationally intense nature. In
 * addition, the triangulation can be set to happen automatically after each
 * vertex is added, or to be manually triggered so as to speed up editing
 * speeds. Users should see no performance hit when the vertex count in under
 * about 200 vertices.
 */

(function(){
	if(!('Worker' in window)){
		return display.error('Warning: this app utilizes Web Workers, which' +
		' are not available in your browser. This will affect performance.');
	}

	var worker = new Worker('use-delaunay.js');
	var cp = [
		new Worker('process-color.js'),
		new Worker('process-color.js'),
		new Worker('process-color.js'),
		new Worker('process-color.js')
	];
	cp[0].postMessage({type:'id',id:0});
	cp[1].postMessage({type:'id',id:1});
	cp[2].postMessage({type:'id',id:2});
	cp[3].postMessage({type:'id',id:3});
	var upToDate = true;
	var processing = 0;
	var triangles = [];
	var colors = null;
	var partition = 0;
	var image = view.surface('image');
	var shader = view.surface('final');

	controller.on('add', function(x, y){
		worker.postMessage({
			type: 'new_point',
			x: x,
			y: y,
			calc: controller.autoRun(),
			cb: 'triangle'
		});
		upToDate = false;
	});

	controller.on('remove', function(x, y){
		worker.postMessage({
			type: 'del_point',
			x: x,
			y: y,
			calc: controller.autoRun(),
			cb: 'triangle'
		});
		upToDate = false;
	});

	controller.on('update', function(oldX, oldY, newX, newY){
		worker.postMessage({
			type: 'move_point',
			oldX: oldX,
			oldY: oldY,
			newX: newX,
			newY: newY,
			calc: controller.autoRun(),
			cb: 'triangle'
		});
		upToDate = false;
	});

	controller.on('calculate', function(){
		worker.postMessage({
			type: 'calc',
			calc: true,
			cb: 'triangle'
		});
	});

	controller.on('clear', function(){
		worker.postMessage({
			type: 'clear',
			calc: true,
			cb: 'triangle'
		});
		upToDate = false;
	});

	controller.on('render', function(){
		if(!upToDate){
			worker.postMessage({
				type: 'calc',
				calc: true,
				cb: 'shade'
			});
		}else{
			process();
		}
	});

	image.onUpdate(function(img){
		cp[0].postMessage({type:'image',img:img});
		cp[1].postMessage({type:'image',img:img});
		cp[2].postMessage({type:'image',img:img});
		cp[3].postMessage({type:'image',img:img});
	});

	function process(){
		processing = 0;
		cp[0].postMessage({type: 'render'});
		cp[1].postMessage({type: 'render'});
		cp[2].postMessage({type: 'render'});
		cp[3].postMessage({type: 'render'});
	}

	worker.onmessage = function(event){
		var data = event.data;
		triangles = data.triangles;
		upToDate = true;
		colors = new Uint32Array(triangles.length);
		partition = Math.ceil(triangles.length/4);
		cp[0].postMessage({
			type:'triangles',
			triangles:triangles.slice(0,partition)
		});
		cp[1].postMessage({
			type:'triangles',
			triangles:triangles.slice(partition,partition*2)
		});
		cp[2].postMessage({
			type:'triangles',
			triangles:triangles.slice(partition*2,partition*3)
		});
		cp[3].postMessage({
			type:'triangles',
			triangles:triangles.slice(partition*3,partition*4)
		});
		if(data.cb == 'shade'){
			process();
		}
	}

	cp[0].onmessage = 
	cp[1].onmessage = 
	cp[2].onmessage = 
	cp[3].onmessage = function(event){
		processing++;
		console.log('worker', event.data.id);
		if(event.data.colors !== null){
			var c = new Uint32Array(event.data.colors);
			colors.set(c, event.data.id*partition);
		}
		if(processing == 4){
			shade();
		}
	}

	function shade(){
		shader.clear();
		var len = triangles.length;
		for(var i = 0; i < len; i++){
			shader.triangle(triangles[i], colors[i]);
		}
		shader.show();
	}
})(view, controller);