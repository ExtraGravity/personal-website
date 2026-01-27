$("document").ready(function(){
    $(".review-link").on("click", function() {
    	let reviewPage = "articles/" + $(this).attr('internal-href');
        changeContent(reviewPage, true, true);
    })

    $(".anime-games-table").each(function() {
        const rows = $(this).children(".anime-games-table-row");
        rows.removeClass("row-odd row-even");
        rows.each(function(index) {
            $(this).addClass(index % 2 === 0 ? "row-odd" : "row-even");
        });
    });

    $(".clickable-row").on("click", function() {
    	$(this).find(".anime-games-review-blurb").slideToggle();
    	$(this).find('svg').toggleClass('rotate-down');
    });
});
