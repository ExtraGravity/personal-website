$("document").ready(function(){
    easeInHeader();
    insertContent();
    setTimeout(fadeInFooter, 900);
    setTimeout(fillPlaceholder, 1500);
    setupNavbarEvents();
});

function easeInHeader() {
     var filterVal = "filter(0)";
    $( ".header-bg" ).css({
        "opacity":"1",
        "transition":"opacity 0.8s ease-out",
        "-webkit-transition":"opacity 0.8s ease-out",
        "-moz-transition":"opacity 0.8s ease-out",
        "-o-transition":"opacity 0.8s ease-out"
    });

    $(".signature").delay(900).fadeIn("fast");
}

function insertContent() {
    $(".content").hide().fadeIn("slow");
}

function fillPlaceholder(){
    var str = "start exploring";
    var i = 0;

    (function type() {
        $(".nav-bar input").attr("placeholder", str.slice(0, ++i)); 
        if ($(".nav-bar input").attr("placeholder") === str) return;
        setTimeout(type, 150);
    }());
}

function fadeInFooter() {
    $("footer div").fadeIn("fast");
}

function setupNavbarEvents() {
    $(".nav-bar input").click(function(){
        if (!$(".navigation-icon").is(":visible")) {
            $(".navigation-background").slideDown(300);
            $(".navigation-icon").css("display", "flex").hide().delay(300).fadeIn(400);
        }
    });    

    $(document).mouseup(function (e)
    {
        var container = $(".navigation-icon");

        console.log(e.target);
        console.log(container);
        if (!container.is(e.target) // if the target of the click isn"t the container...
            && container.has(e.target).length === 0) // ... nor a descendant of the container
        {
            $(".navigation-icon").fadeOut(300);
            $(".navigation-background").delay(200).slideUp(300);
        }
    });    
}