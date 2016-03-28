'use strict';

var triangles = null;
var img = null;
var w = 0;
var h = 0;
var d = null;
var id = 0;

onmessage = function(event){
	switch(event.data.type){
		case 'id':
			id = event.data.id;
			break;
		case 'triangles':
			triangles = event.data.triangles;
			break;
		case 'image':
			img = event.data.img;
			w = img.width;
			h = img.height;
			d = img.data;
			break;
		case 'render':
			var len = triangles.length;
			if(!len){
				return postMessage({
					id: id,
					colors: null
				});
			}
			var colors = new Uint32Array(len);
			for(var i=0;i<len;i++){
				colors[i]=average(triangles[i]);
			}
			postMessage({
				id: id,
				colors: colors.buffer
			},[colors.buffer]);
			break;
	}
}

function average(triangle){
	var r=0,g=0,b=0,s=0;
	var ax = triangle[0][0];
	var bx = triangle[1][0];
	var cx = triangle[2][0];
	var ay = triangle[0][1];
	var by = triangle[1][1];
	var cy = triangle[2][1];
	var xMax = Math.round(Math.max(ax,bx,cx));
	var yMax = Math.round(Math.max(ay,by,cy));
	var xMin = Math.round(Math.min(ax,bx,cx));
	var yMin = Math.round(Math.min(ay,by,cy));

	function contains(px,py){
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

	for(var x=xMin;x<=xMax;x++){
		for(var y=yMin;y<=yMax;y++){
			if(contains(x,y)){
				var p=(x+y*w)*4;
				r+=d[p];
				g+=d[p+1];
				b+=d[p+2];
				s++;
			}
		}
	}

	return rgbToInt(r,g,b,s);
}

function rgbToInt(r,g,b,s){
	return (Math.floor(r/s)<<16)+(Math.floor(g/s)<<8)+Math.floor(b/s);
}