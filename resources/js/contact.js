$("document").ready(function(){
    $(".contact-submit").on("click", function() {
        contactSubmit();
    })
});


function contactSubmit() {
    var goodInput = true;
    var inputs = [
        $(".contact-form input[name='name']"),
        $(".contact-form input[name='email']"),
        $(".contact-form textarea[name='message']")
    ];

    //Check honeypot
    if($(".contact-form input[name=LeaveBlank]").val() !== "") {
        goodInput = false;
    }

    // Check blank fields
    for(var i = 0; i < inputs.length; ++i) {
        if(inputs[i].val() === "") {
            inputs[i].css("background-color", "#FCC");
            $('.contact-error').fadeOut("fast", function() {
                $('.contact-error').html('Fill in all fields').fadeIn("fast");
            });
            goodInput = false;
        } else {
            inputs[i].css("background-color", "white");
        }
    }

    // Check valid email
    if(goodInput) {
        if(!validateEmail(inputs[1].val())) {
            inputs[1].css("background-color", "#FCC");
            $('.contact-error').fadeOut("fast", function() {
                $('.contact-error').html('Invalid email address').fadeIn("fast");
            });
            goodInput = false;
        } else {
            inputs[1].css("background-color", "white");
        }
    }

    if(goodInput) {
        
        grecaptcha.execute();
    }
}

function recaptchaCallback() {
    // Check captcha filled out
    var captchaResponse = grecaptcha.getResponse()
    console.log(captchaResponse)
    if(captchaResponse.length == 0) {
        $('.contact-error').fadeOut("fast", function() {
            $('.contact-error').html('Captcha not completed').fadeIn("fast");
        });
        return;
    }

    // Input is good
    var inputs = [
        $(".contact-form input[name='name']"),
        $(".contact-form input[name='email']"),
        $(".contact-form textarea[name='message']")
    ];
    
    for(i = 0; i < inputs.length; ++i) {
        inputs[i].prop('disabled', true);
        inputs[i].css('background-color', '#EEE');
        inputs[i].css('color', '#888');
    }
    $.post('/api/contact', {
        name: $(".contact-form input[name='name']").val(),
        email: $(".contact-form input[name='email']").val(),
        message: $(".contact-form textarea[name='message']").val(),
        captcha: captchaResponse
    });

    $('.contact-submit-div').fadeOut("fast", function() {
        $('.contact-sent').fadeIn("fast");
    });
    return false;
}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}