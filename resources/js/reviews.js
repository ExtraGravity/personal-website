$("document").ready(function(){
    $(".review-link").on("click", function() {
    	let reviewPage = "articles/" + $(this).attr('internal-href');
        changeContent(reviewPage, true);
    })
});
