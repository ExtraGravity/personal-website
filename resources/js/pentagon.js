var c = $(".pentagon").get(0);
var ctx = c.getContext("2d");
var defaultColor = "#444";
var highlightColor = "#F20";

$('document').ready(function(){
	ctx.lineWidth = 10;
	ctx.strokeStyle= defaultColor;
	ctx.translate(0.65, 0.65);
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
		drawLine(center, points[i], defaultColor);
		ctx.beginPath();
		ctx.moveTo(c.width/2, c.height/2 + 25);
		ctx.lineTo(points[i][0], points[i][1]);
		ctx.stroke();
	}


	$('.about a').hover(function(){
		drawAnimatedLine(points[4], points[0], highlightColor);
		drawAnimatedLine(center, points[0], highlightColor);
		drawAnimatedLine(points[1], points[0], highlightColor);
	}, function() {
		drawAnimatedLine(points[4], points[0], defaultColor);
		drawAnimatedLine(center, points[0], defaultColor);
		drawAnimatedLine(points[1], points[0], defaultColor);
	});

	$('.portfolio a').hover(function(){
		drawAnimatedLine(points[0], points[1], highlightColor);
		drawAnimatedLine(center, points[1], highlightColor);
		drawAnimatedLine(points[2], points[1], highlightColor);
	}, function() {
		drawAnimatedLine(points[0], points[1], defaultColor);
		drawAnimatedLine(center, points[1], defaultColor);
		drawAnimatedLine(points[2], points[1], defaultColor);
	});

	$('.contact a').hover(function(){
		drawAnimatedLine(points[1], points[2], highlightColor);
		drawAnimatedLine(center, points[2], highlightColor);
		drawAnimatedLine(points[3], points[2], highlightColor);
	}, function() {
		drawAnimatedLine(points[1], points[2], defaultColor);
		drawAnimatedLine(center, points[2], defaultColor);
		drawAnimatedLine(points[3], points[2], defaultColor);
	});

	$('.resume a').hover(function(){
		drawAnimatedLine(points[2], points[3], highlightColor);
		drawAnimatedLine(center, points[3], highlightColor);
		drawAnimatedLine(points[4], points[3], highlightColor);
	}, function() {
		drawAnimatedLine(points[2], points[3], defaultColor);
		drawAnimatedLine(center, points[3], defaultColor);
		drawAnimatedLine(points[4], points[3], defaultColor);
	});

	$('.articles a').hover(function(){
		drawAnimatedLine(points[3], points[4], highlightColor);
		drawAnimatedLine(center, points[4], highlightColor);
		drawAnimatedLine(points[0], points[4], highlightColor);
	}, function() {
		drawAnimatedLine(points[3], points[4], defaultColor);
		drawAnimatedLine(center, points[4], defaultColor);
		drawAnimatedLine(points[0], points[4], defaultColor);
	});

});

function drawLine(p1, p2, color) {
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.moveTo(p1[0], p1[1]);
	ctx.lineTo(p2[0], p2[1]);
	ctx.stroke();			
}

function drawAnimatedLine(p1, p2, color) {
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
