var MOBILE = false

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    MOBILE = true;
}

$("document").ready(function(){
    setTimeout(function() {
        easeInHeader();
        setTimeout(insertContent, 800);
        setTimeout(fadeInFooter, 900);
        setTimeout(fillPlaceholder, 1500);
        setupNavbarEvents();
    }, 1000);
});

function easeInHeader() {
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
    $(".content-wrapper").hide().css("opacity", "1").fadeIn("slow");
}

function fillPlaceholder(){
    var str = "start exploring";

    if(MOBILE){
        $(".nav-bar input").attr("placeholder", str);
    } else {    
        var i = 0;

        (function type() {
            $(".nav-bar input").attr("placeholder", str.slice(0, ++i)); 
            if ($(".nav-bar input").attr("placeholder") === str) return;
            setTimeout(type, 150);
        }());
    }
}

function fadeInFooter() {
    $("footer div").fadeIn("fast");
}

function closeNavigation() {
    $(".navigation-icon").fadeOut(300);
    $(".navigation-background").delay(200).slideUp(300);
}

function setupNavbarEvents() {
    if(MOBILE) {
        $(".nav-bar input").attr("readonly", "true");
    }

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
            closeNavigation();
        }
    });    

    var navCloseDelay = 250;
    if(MOBILE) {
        navCloseDelay = 700;
    }

    $(".about").click(function() {
        setTimeout(closeNavigation, navCloseDelay);
        removeContent();
    });

    $(".portfolio").click(function() {
        setTimeout(closeNavigation, navCloseDelay);
        removeContent();
    });

    $(".contact").click(function() {
        setTimeout(closeNavigation, navCloseDelay);
        removeContent();
    });

    $(".articles").click(function() {
        setTimeout(closeNavigation, navCloseDelay);
        removeContent();
    });

    $(".resume").click(function() {
        setTimeout(closeNavigation, navCloseDelay);
        removeContent();
    });
}


function removeContent() {
    $( ".content" ).css({
        "opacity": "0",
        "-webkit-filter": "blur(5px)",
        "-moz-filter": "blur(5px)",
        "-o-filter": "blur(5px)",
        "-ms-filter": "blur(5px)",
        "filter": "blur(5px)",
        "transition":"filter 1s linear, opacity 1s linear",
        "-webkit-transition":"filter 1s linear, opacity 1s linear",
        "-moz-transition":"filter 1s linear, opacity 1s linear",
        "-o-transition":"filter 1s linear, opacity 1s linear",
    });
}
