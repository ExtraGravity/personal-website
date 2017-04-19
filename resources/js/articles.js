$("document").ready(function(){
    $(".articles-list a").each(function() {
    	$(this).on("click", function() {
    		var pageToReq = $(this).attr("url");
            changeContent(pageToReq)
    	})
    })
});
