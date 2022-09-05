$("document").ready(function(){
    $(".review-link").on("click", function() {
    	let reviewPage = "articles/" + $(this).attr('internal-href');
        changeContent(reviewPage, true);
    })

    $(".clickable-row").on("click", function() {
    	$(this).find(".anime-review-blurb").slideToggle();
    	$(this).find('svg').toggleClass('rotate-down');
    });
});
