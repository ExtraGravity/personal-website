$("document").ready(function(){
    $(".portfolio-header").each(function() {
        $(this).on("click", function() {
            $(this).siblings("p").slideToggle();
            $(this).find('svg').toggleClass('rotate-down');
        })
    })
	
	$(".portfolio-item a img").on("load", function() {
		$(this).css("opacity", 1);
	}).each(function(){
		if(this.complete) {
			$(this).trigger('load');
		}
	});
});

