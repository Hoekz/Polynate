'use strict';

var view = (function(){
	var $ = function(query, el){
		if(query.startsWith('#') && query.split(' ').length == 1){
			return (el || document).querySelector(query);
		}else{
			return Array.prototype.slice.apply((el || document).querySelectorAll(query));
		}
	};

	var hide = function(el){
		el.classList.add('hide');
	};

	var show = function(el){
		el.classList.remove('hide');
	};

	var mode = 'edit';
	var stage = new PIXI.Container();
	var image = new PIXI.Container();
	var points = new PIXI.Container();
	var mesh = new PIXI.Container();
	var meshTriangles = new PIXI.Graphics();
	var final = new PIXI.Container();
	var finalGraphics = new PIXI.Graphics();
	var scale = {
		max: 4,
		min: 0.5
	};
	var statuses = {
		edit: 'Add and move points',
		erase: 'Remove points',
		navigate: 'Adjust and zoom view',
		render: 'Rendering...'
	};
	var status = statuses[mode];

	stage.addChild(image);
	stage.addChild(mesh);
	stage.addChild(points);
	stage.addChild(final);
	final.addChild(finalGraphics);

	var background = null;
	var realImage = document.createElement('canvas');
	var realCtx = realImage.getContext('2d');
	var onImg = [];
	var pointTexture = new PIXI.Texture.fromImage('point.png');
	var pointRect = new PIXI.Sprite();
	var mouse = {
		x: 0,
		y: 0,
		toString: function(){
			return '(' + this.x.toFixed(2) + ', ' + this.y.toFixed(2) + ')';
		}
	};
	var time = {
		start: 0,
		end: 0,
		toString: function(){return (this.end - this.start)/1000}
	};
	var pCount = 0;
	points.addChild(pointRect);

	function updateFooter(){
		$('#status').innerHTML = 'Status: ' + status;
		$('#position').innerHTML = 'Pos: ' + mouse;
		$('#point-count').innerHTML = 'Points: ' + pCount;
	}

	function scaleImage(){
		stage.scale.set(Math.max(scale.min, Math.min(stage.scale.x, scale.max)));
		stage.x = (width - stage.scale.x * pointRect.width) / 2;
		stage.y = (height - stage.scale.x * pointRect.height) / 2;
		console.log(stage.scale.x);
	}

	function useImage(file){
		var fr = new FileReader();

		fr.onload = function(){
			if(background){
				image.removeChild(background);
			}
			background = new PIXI.Sprite.fromImage(this.result);
			var img = new Image();
			img.onload = function(){
				pointRect.width = realImage.width = img.naturalWidth;
				pointRect.height = realImage.height = img.naturalHeight;
				scale.min = Math.min(width / pointRect.width, height / pointRect.height);
				scaleImage();
				realCtx.drawImage(img,0,0);
				var data = realCtx.getImageData(0,0,realImage.width,realImage.height);
				onImg.forEach(function(f){f(data)});
			}
			img.src = this.result;
			image.addChild(background);
		};

		fr.readAsDataURL(file);
	}

	function addPoint(X, Y){
		var point = new PIXI.Sprite(pointTexture);
		point.width = point.height = 8;
		point.anchor.set(0.5);
		point.x = X;
		point.y = Y;
		point.interactive = true;
		point.buttonMode = true;
		point.on('mousedown', dragStartPoint);
		point.on('touchstart', dragStartPoint);
		point.on('mouseup', dragEndPoint);
		point.on('touchend', dragEndPoint);
		point.on('mouseupoutside', dragEndPoint);
		point.on('touchendoutside', dragEndPoint);
		point.on('mousemove', dragMovePoint);
		point.on('touchmove', dragMovePoint);
		points.addChild(point);
		controller.trigger('add', [X, Y]);
		pCount++;
	}

	function dragStartPoint(event){
		if(mode == 'erase'){
			removePoint.call(this);
		}else if(mode == 'edit'){
			this.data = event.data;
			this.data.x = this.x;
			this.data.y = this.y;
			this.dragging = true;
		}
	}

	function dragMovePoint(){
		if(this.dragging){
			var newPosition = this.data.getLocalPosition(this.parent);
        	this.position.x = newPosition.x;
        	this.position.y = newPosition.y;
		}
	}

	function dragEndPoint(){
		if(this.dragging){
			controller.trigger('update', [
				this.data.x, 
				this.data.y, 
				this.position.x, 
				this.position.y
			]);
			this.dragging = false;
			this.data = null;
		}
	}

	function removePoint(){
		controller.trigger('remove', [this.position.x, this.position.y]);
		points.removeChild(this);
		this.destroy();
		pCount--;
	}

	function changeMode(){
		$('#' + mode).classList.remove('active');
		this.classList.add('active');
		mode = this.id;
		status = statuses[mode];
		if(mode == 'render'){
			points.visible = false;
			time.start = new Date();
			controller.trigger('render');
		}else{
			final.visible = false;
			points.visible = true;
		}
	}

	final.visible = false;
	$('#edit').addEventListener('click', changeMode);
	$('#erase').addEventListener('click', changeMode);
	$('#navigate').addEventListener('click', changeMode);
	$('#render').addEventListener('click', changeMode);

	$('#image-choice').addEventListener('change', function(){
		useImage(this.files[0]);
	});

	$('#choose').onclick = $('#image-choice').click.bind($('#image-choice'));

	pointRect.interactive = true;
	pointRect.on('mousedown', function(event){
		if(mode == 'edit'){
			var p = event.data.getLocalPosition(this.parent);
			addPoint(p.x, p.y);
			mouse.x = p.x;
			mouse.y = p.y;
		}else if(mode == 'navigate'){
			//move and scale stage
		}
	});
	pointRect.on('mousemove', function(event){
		var p = event.data.getLocalPosition(this.parent);
		mouse.x = p.x;
		mouse.y = p.y;
	});
	
	var visible = true;
	show($('#control'));

	function contains(px,py,ax,ay,bx,by,cx,cy){
		if(px>ax&&px>bx&&px>cx)return 0;
		if(px<ax&&px<bx&&px<cx)return 0;
		if(py>ay&&py>by&&py>cy)return 0;
		if(py<ay&&py<by&&py<cy)return 0;
		var v0 = [cx-ax,cy-ay];
		var v1 = [bx-ax,by-ay];
		var v2 = [px-ax,py-ay];
		var dot00 = (v0[0]*v0[0])+(v0[1]*v0[1]);
		var dot01 = (v0[0]*v1[0])+(v0[1]*v1[1]);
		var dot02 = (v0[0]*v2[0])+(v0[1]*v2[1]);
		var dot11 = (v1[0]*v1[0])+(v1[1]*v1[1]);
		var dot12 = (v1[0]*v2[0])+(v1[1]*v2[1]);

		var invDenom = 1/(dot00*dot11-dot01*dot01);

		var u = (dot11*dot02-dot01*dot12)*invDenom;
		var v = (dot00*dot12-dot01*dot02)*invDenom;

		return ((u>=0)&&(v>=0)&&(u+v<1));
	}

	function rgbToInt(r,g,b,s){
		return (Math.floor(r/s)<<16)+(Math.floor(g/s)<<8)+Math.floor(b/s);
	}

	var imageWrap = {
		onUpdate: function(f){
			onImg.push(f);
		}
	};

	var meshWrap = {
		clear: function(){
			meshTriangles.clear();
		},
		triangle: function(bounds){
			meshTriangles.lineStyle(1, 0xFFFFFF);
			meshTriangles.moveTo(bounds.x[0], bounds.y[0]);
			meshTriangles.lineTo(bounds.x[1], bounds.y[1]);
			meshTriangles.lineTo(bounds.x[2], bounds.y[2]);
			meshTriangles.lineTo(bounds.x[0], bounds.y[0]);
			meshTriangles.endFill();
		}
	};

	var finalWrap = {
		clear: function(){
			finalGraphics.clear();
		},
		triangle: function(bounds, color){
			finalGraphics.beginFill(color);
			finalGraphics.moveTo(bounds[0][0], bounds[0][1]);
			finalGraphics.lineTo(bounds[1][0], bounds[1][1]);
			finalGraphics.lineTo(bounds[2][0], bounds[2][1]);
			finalGraphics.endFill();
		},
		show: function(){
			time.end = new Date();
			status = 'Render complete - ' + time + 's';
			final.visible = true;
		},
		hide: function(){
			final.visible = false;
		}
	};

	var scene = $('#scene');
	var width = scene.getBoundingClientRect().width;
	var height = scene.getBoundingClientRect().height;

	window.addEventListener('resize', function(){
		var width = scene.getBoundingClientRect().width;
		var height = scene.getBoundingClientRect().height;
		renderer.view.width = width;
		renderer.view.height = height;
		renderer.resize(width, height);
		stage.x = (width - pointRect.width) / 2;
		stage.y = (height - pointRect.height) / 2;
	});

	var renderer = PIXI.autoDetectRenderer(width, height,{
		backgroundColor : 0x555555,
		preserveDrawingBuffer:true
	});
	scene.appendChild(renderer.view);

	var wheel = function(e){
		var d = e.wheelDelta || e.detail;
		stage.scale.set(stage.scale.x + (Math.abs(d) / d) * 0.05);
		scaleImage();
	};

	renderer.view.addEventListener('mousewheel', wheel);
	renderer.view.addEventListener('DOMMouseScroll', wheel);

	function animate(){		
		renderer.render(stage);
		updateFooter();
		requestAnimationFrame(animate);
	}

	animate();

	return {
		surface: function(id){
			switch(id){
				case 'image': return imageWrap;
				case 'mesh': return meshWrap;
				case 'final': return finalWrap;
			}
			return null;
		},
		add: addPoint
	};
})(controller);