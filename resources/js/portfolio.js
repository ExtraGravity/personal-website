$("document").ready(function(){
    $(".portfolio-header").each(function() {
    	$(this).on("click", function() {
    		$(this).siblings("p").slideToggle();
    	})
    })
});
