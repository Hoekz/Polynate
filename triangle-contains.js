function contains(bounds, px, py){
	var ax = bounds.x[2], ay = bounds.y[2];
	var bx = bounds.x[1], by = bounds.y[1];
	var cx = bounds.x[0], cy = bounds.y[0];
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