$("document").ready(function(){
    $(".articles-list a").each(function() {
    	$(this).on("click", function() {
    		$(this).css("color", "#DDD");
    		$(this).css("background", "#444");
    		var delay = 0;
    		if(MOBILE) {
    			delay = 400;
    		}
    		var pageToReq = $(this).attr("url");
    		
    		setTimeout(function() {
            	changeContent(pageToReq);
    		}, delay);
    	})
    })
});
