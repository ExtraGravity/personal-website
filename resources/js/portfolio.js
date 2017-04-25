$("document").ready(function(){
    $(".portfolio-header").each(function() {
        $(this).on("click", function() {
            $(this).siblings("p").slideToggle();
            $(this).find('svg').toggleClass('rotate-down');
        })
    })
});
