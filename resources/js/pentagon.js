var defaultColor = "#444";
var highlightColor = "#F20";
var lineAnimTime = 500;

$('document').ready(function(){
    var topPt = [260.0, 10.0];
    var topLeftPt = [10.0, 191.5];
    var botLeftPt = [105.5, 475.5];
    var botRightPt = [414.5, 475.5];
    var topRightPt = [510.0, 191.5];
    var centerPt = [260.0, 272.5];

    var newLines = [];

    handleNavLinkHover($(".about a"), "about-lines", topPt,
        [
            topLeftPt,
            centerPt,
            topRightPt
        ]
    );

    handleNavLinkHover($(".portfolio a"), "portfolio-lines", topLeftPt,
        [
            botLeftPt,
            centerPt,
            topPt
        ]
    );

    handleNavLinkHover($(".contact a"), "contact-lines", botLeftPt,
        [
            botRightPt,
            centerPt,
            topLeftPt
        ]
    );

    handleNavLinkHover($(".resume a"), "resume-lines", botRightPt,
        [
            topRightPt,
            centerPt,
            botLeftPt
        ]
    );

    handleNavLinkHover($(".articles a"), "articles-lines", topRightPt,
        [
            topPt,
            centerPt,
            botRightPt
        ]
    );
});

function handleNavLinkHover(navLink, lineClass, endPt, beginPts) {
    navLink.hover(function() {

        for (var i = 0; i < beginPts.length; i++) {
            var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
            newLine.setAttribute("class", "penta-red " + lineClass);
            newLine.setAttribute("x1", beginPts[i][0]);
            newLine.setAttribute("y1", beginPts[i][1]);
            newLine.setAttribute("x2", beginPts[i][0]);
            newLine.setAttribute("y2", beginPts[i][1]);
            $(".pentagon").append(newLine);

            $(newLine).velocity({
                x2: endPt[0],
                y2: endPt[1]
            }, lineAnimTime);
        }
    }, function() {
        $("." + lineClass).each(function() {
            $(this).velocity({
                x1: endPt[0],
                y1: endPt[1]
            }, {
                duration: lineAnimTime,
                queue: false,
                complete: function() {
                    $(this).remove();
                }
            });
        });
    });
}
