var defaultColor = "#444";
var highlightColor = "#F20";

$('document').ready(function(){
	var c = $(".pentagon").get(0);
	var ctx = c.getContext("2d");
	
	ctx.lineWidth = 10.5;
	ctx.strokeStyle= defaultColor;
	ctx.translate(0.5, 0.5);
	widthRatio = c.offsetWidth / c.width;
	heightRatio = c.offsetHeight / c.height;

	points = [
		[260, 10],
		[10, 191.5],
		[105.5, 475.5],
		[414.5, 475.5],
		[510, 191.5]
	]

	var center = [c.width/2, c.height/2 + 25];

	ctx.moveTo(points[0][0], points[0][1]); // go to any point
	ctx.beginPath();
	for (i = 0; i < points.length; i++) {
		ctx.lineTo(points[i][0], points[i][1]);
	}
	ctx.closePath();
	ctx.stroke();

	for (i = 0; i < points.length; i++) {
		drawLine(ctx, center, points[i], defaultColor);
		ctx.beginPath();
		ctx.moveTo(c.width/2, c.height/2 + 25);
		ctx.lineTo(points[i][0], points[i][1]);
		ctx.stroke();
	}


	$('.about a').hover(function(){
		drawAnimatedLine(ctx, points[4], points[0], highlightColor);
		drawAnimatedLine(ctx, center, points[0], highlightColor);
		drawAnimatedLine(ctx, points[1], points[0], highlightColor);
	}, function() {
		drawAnimatedLine(ctx, points[4], points[0], defaultColor);
		drawAnimatedLine(ctx, center, points[0], defaultColor);
		drawAnimatedLine(ctx, points[1], points[0], defaultColor);
	});

	$('.portfolio a').hover(function(){
		drawAnimatedLine(ctx, points[0], points[1], highlightColor);
		drawAnimatedLine(ctx, center, points[1], highlightColor);
		drawAnimatedLine(ctx, points[2], points[1], highlightColor);
	}, function() {
		drawAnimatedLine(ctx, points[0], points[1], defaultColor);
		drawAnimatedLine(ctx, center, points[1], defaultColor);
		drawAnimatedLine(ctx, points[2], points[1], defaultColor);
	});

	$('.contact a').hover(function(){
		drawAnimatedLine(ctx, points[1], points[2], highlightColor);
		drawAnimatedLine(ctx, center, points[2], highlightColor);
		drawAnimatedLine(ctx, points[3], points[2], highlightColor);
	}, function() {
		drawAnimatedLine(ctx, points[1], points[2], defaultColor);
		drawAnimatedLine(ctx, center, points[2], defaultColor);
		drawAnimatedLine(ctx, points[3], points[2], defaultColor);
	});

	$('.resume a').hover(function(){
		drawAnimatedLine(ctx, points[2], points[3], highlightColor);
		drawAnimatedLine(ctx, center, points[3], highlightColor);
		drawAnimatedLine(ctx, points[4], points[3], highlightColor);
	}, function() {
		drawAnimatedLine(ctx, points[2], points[3], defaultColor);
		drawAnimatedLine(ctx, center, points[3], defaultColor);
		drawAnimatedLine(ctx, points[4], points[3], defaultColor);
	});

	$('.articles a').hover(function(){
		drawAnimatedLine(ctx, points[3], points[4], highlightColor);
		drawAnimatedLine(ctx, center, points[4], highlightColor);
		drawAnimatedLine(ctx, points[0], points[4], highlightColor);
	}, function() {
		drawAnimatedLine(ctx, points[3], points[4], defaultColor);
		drawAnimatedLine(ctx, center, points[4], defaultColor);
		drawAnimatedLine(ctx, points[0], points[4], defaultColor);
	});

});

function drawLine(ctx, p1, p2, color) {
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.moveTo(p1[0], p1[1]);
	ctx.lineTo(p2[0], p2[1]);
	ctx.stroke();			
}

function drawAnimatedLine(ctx, p1, p2, color) {
	var amount = 0;

	var inter = setInterval(function() {
	    amount += 0.025; // change to alter duration
	    if (amount > 1){
	    	amount = 1;
	    	clearInterval(inter);
	    };
		ctx.strokeStyle = color;
		ctx.beginPath();
		ctx.lineCap = "round";
	    ctx.moveTo(p1[0], p1[1]);
	    // lerp : a  + (b - a) * f
	    ctx.lineTo(p1[0] + (p2[0] - p1[0]) * amount, 
	             p1[1] + (p2[1] - p1[1]) * amount);
	    ctx.stroke();
	}, 10);
}
