var MOBILE = false;

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    MOBILE = true;
}

$("document").ready(function(){
    // Initial timeout 1000ms to wait for load
    // Then total 1100ms for final load in
    setTimeout(function() {
        easeInHeader();
        $(".signature").delay(800).fadeIn(300);
        setTimeout(function() { // fade in .main-content
            $(".main-content-wrapper").hide().css("opacity", "1").fadeIn(300);
        }, 800);
        setTimeout(fadeInFooter, 800);
        setTimeout(fillPlaceholder, 900);
        setupNavbarEvents();
        setupSearch();
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
}

function fillPlaceholder(){
    var str = "start exploring";

    if(MOBILE){
        $(".nav-bar input").attr("placeholder", str);
    } else {
        var i = 0;

        (function type() {
            $(".nav-bar input").attr("placeholder", str.slice(0, ++i));
            if ($(".nav-bar input").attr("placeholder") === str) {
                return;
            }
            setTimeout(type, 150);
        }());
    }
}

function fadeInFooter() {
    $("footer div").fadeIn(300);
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
        var container = $(".navigation-container");

        if (!container.is(e.target) // if the target of the click isn"t the container...
            && container.has(e.target).length === 0) // ... nor a descendant of the container
        {
            closeNavigation();
            $(".search-results").html("");
            $(".search-bar").val("");
        }
    });

    var pages = [
        "about",
        "portfolio",
        "contact",
        "articles",
        "resume"
    ];

    for (var i = 0; i < pages.length; i += 1)
    {
        $("." + pages[i]).click(handleNavClick(pages[i]));
    }
}

function closeNavigation() {
    $(".navigation-icon").fadeOut(300);
    $(".navigation-background").delay(200).slideUp(300);
}

function handleNavClick(pageToReq) {
    return function(e) {
        var navCloseDelay = 250;
        if(MOBILE) {
            navCloseDelay = 700;
        }    

        setTimeout(function() {
            closeNavigation()
            removeContent(function() {
                $.get("/api", { page: pageToReq }, function(response) {
                    console.log("nav click get");
                    $(".main-content").html(response);
                    insertContent();
                    console.log(pageToReq);
                    window.history.pushState(null, null, "/" + pageToReq);
                });
            });
        }, navCloseDelay);
    };
}

function removeContent(callback) {
    $( ".main-content-wrapper" ).css({
        "opacity": "0.4",
        "-webkit-filter": "blur(5px)",
        "-moz-filter": "blur(5px)",
        "-o-filter": "blur(5px)",
        "-ms-filter": "blur(5px)",
        "filter": "blur(5px)",
        "transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
        "-webkit-transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
        "-moz-transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
        "-o-transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
    });
    $( ".main-content" ).css({
        "opacity": "0",
        "transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
        "-webkit-transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
        "-moz-transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
        "-o-transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
    });
    setTimeout(callback, 1000);
}

function insertContent() {
    $(".main-content-wrapper").css({
        "opacity": "1",
        "-webkit-filter": "blur(0)",
        "-moz-filter": "blur(0)",
        "-o-filter": "blur(0)",
        "-ms-filter": "blur(0)",
        "filter": "blur(0)",
        "transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
        "-webkit-transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
        "-moz-transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
        "-o-transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
    });
    
    $(".main-content").css({
        "opacity": "0",
        "opacity": "1",
        "transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
        "-webkit-transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
        "-moz-transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
        "-o-transition":"filter 0.5s ease-out, opacity 0.5s ease-out",
    });
}
