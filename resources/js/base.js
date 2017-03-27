$('document').ready(function(){
	$(".nav-bar input").focus();

    $(".nav-bar input").click(function(){
    	if (!$(".navigation-icon").is(":visible")) {
	        $(".navigation-background").slideDown(300);
        	$(".navigation-icon").css("display", "flex").hide().delay(300).fadeIn(400);
    	}
    });

	$(document).mouseup(function (e)
	{
	    var container = $(".navigation-icon");

		console.log(e.target);
		console.log(container);
	    if (!container.is(e.target) // if the target of the click isn't the container...
	        && container.has(e.target).length === 0) // ... nor a descendant of the container
	    {
        	$(".navigation-icon").fadeOut(300);
        	$(".navigation-background").delay(200).slideUp(300);
	    }
	});
});