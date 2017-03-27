$('document').ready(function(){
	var c = $(".pentagon").get(0);
	var ctx = c.getContext("2d");
	ctx.lineWidth = 10;
	ctx.strokeStyle= "#444";

	widthRatio = c.offsetWidth / c.width;
	heightRatio = c.offsetHeight / c.height;

	points = [
		[260, 10],
		[10, 191.5],
		[105.5, 475.5],
		[414.5, 475.5],
		[510, 191.5]
	]

	ctx.moveTo(points[0][0], points[0][1]); // go to any point
	ctx.beginPath();
	for (i = 0; i < points.length; i++) {
		ctx.lineTo(points[i][0], points[i][1]);
	}
	ctx.closePath();
	ctx.stroke();

	for (i = 0; i < points.length; i++) {
		ctx.beginPath();
		ctx.moveTo(c.width/2, c.height/2 + 25);
		ctx.lineTo(points[i][0], points[i][1]);
		ctx.stroke();
	}
});