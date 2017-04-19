$("document").ready(function(){
    $(".portfolio-item h2").each(function() {
    	$(this).on("click", function() {
    		$(this).siblings("p").slideToggle();
    	})
    })
});
