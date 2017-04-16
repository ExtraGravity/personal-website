$("document").ready(function(){
    $(".articles-list a").each(function() {
    	$(this).on("click", function() {
    		var pageToReq = $(this).attr("url");
    		removeContent(function() {
                $.get("/api", { page: pageToReq }, function(response) {
                    console.log("article link get");
                    $(".main-content").html(response);
                    insertContent();
                    window.history.pushState(null, null, pageToReq);
                });
    		});
    	})
    })
});
