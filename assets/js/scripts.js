$(function () {

    "use strict";

    var wind = $(window);

    /* ========== Smooth scroll nav ========== */

    $.scrollIt({
        easing: 'swing',
        scrollTime: 600,
        activeClass: 'active',
        topOffset: -80
    });

    /* ========== Navbar ========== */

    $(".navbar").on("click", ".navbar-toggler", function () {
        $(".navbar .navbar-collapse").toggleClass("show");
    });

    wind.on("scroll", function () {
        $(".navbar").toggleClass("nav-scroll", wind.scrollTop() > 300);
    });

    /* ========== Sticky author card ========== */

    $("#sticky_item").stick_in_parent();

    /* ========== Cursor, hover parallax and rolling text ========== */

    (function () {
        const link = document.querySelectorAll('.hover-this');
        const cursor = document.querySelector('.cursor');
        const animateit = function (e) {
            const hoverAnim = this.querySelector('.hover-anim');
            const { offsetX: x, offsetY: y } = e,
                { offsetWidth: width, offsetHeight: height } = this,
                move = 25,
                xMove = x / width * (move * 2) - move,
                yMove = y / height * (move * 2) - move;
            hoverAnim.style.transform = `translate(${xMove}px, ${yMove}px)`;
            if (e.type === 'mouseleave') hoverAnim.style.transform = '';
        };
        const editCursor = e => {
            const { clientX: x, clientY: y } = e;
            cursor.style.left = x + 'px';
            cursor.style.top = y + 'px';
        };
        link.forEach(b => b.addEventListener('mousemove', animateit));
        link.forEach(b => b.addEventListener('mouseleave', animateit));
        window.addEventListener('mousemove', editCursor);

        $("a, .cursor-pointer").hover(
            function () {
                $(".cursor").addClass("cursor-active");
            }, function () {
                $(".cursor").removeClass("cursor-active");
            }
        );

        let elements = document.querySelectorAll(".rolling-text");

        elements.forEach((element) => {
            let innerText = element.innerText;
            element.innerHTML = "";

            let textContainer = document.createElement("div");
            textContainer.classList.add("block");

            for (let letter of innerText) {
                let span = document.createElement("span");
                span.innerText = letter.trim() === "" ? "\xa0" : letter;
                span.classList.add("letter");
                textContainer.appendChild(span);
            }

            element.appendChild(textContainer);
            element.appendChild(textContainer.cloneNode(true));
        });

        elements.forEach((element) => {
            element.addEventListener("mouseover", () => {
                element.classList.remove("play");
            });
        });
    })();
});


$(window).on("load", function () {

    var body = $('body');
    body.addClass('loaded');
    setTimeout(function () {
        body.removeClass('loaded');
    }, 1500);

});


/* ========== Scroll progress button ========== */

$(document).ready(function () {

    "use strict";

    var progressPath = document.querySelector('.progress-wrap path');
    var pathLength = progressPath.getTotalLength();
    progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
    progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
    progressPath.style.strokeDashoffset = pathLength;
    progressPath.getBoundingClientRect();
    progressPath.style.transition = progressPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';
    var updateProgress = function () {
        var scroll = $(window).scrollTop();
        var height = $(document).height() - $(window).height();
        var progress = pathLength - (scroll * pathLength / height);
        progressPath.style.strokeDashoffset = progress;
    }
    updateProgress();
    $(window).scroll(updateProgress);
    var offset = 150;
    var duration = 550;
    jQuery(window).on('scroll', function () {
        if (jQuery(this).scrollTop() > offset) {
            jQuery('.progress-wrap').addClass('active-progress');
        } else {
            jQuery('.progress-wrap').removeClass('active-progress');
        }
    });
    jQuery('.progress-wrap').on('click', function (event) {
        event.preventDefault();
        jQuery('html, body').animate({ scrollTop: 0 }, duration);
        return false;
    })

});


/* ========== Preloader ========== */

$(function () {

    "use strict";

    const svg = document.getElementById("svg");
    const tl = gsap.timeline();
    const curve = "M0 502S175 272 500 272s500 230 500 230V0H0Z";
    const flat = "M0 2S175 1 500 1s500 1 500 1V0H0Z";

    tl.to(".loader-wrap-heading .load-text , .loader-wrap-heading .cont", {
        delay: 1.5,
        y: -100,
        opacity: 0,
    });
    tl.to(svg, {
        duration: 0.5,
        attr: { d: curve },
        ease: "power2.easeIn",
    }).to(svg, {
        duration: 0.5,
        attr: { d: flat },
        ease: "power2.easeOut",
    });
    tl.to(".loader-wrap", {
        y: -1500,
    });
    tl.to(".loader-wrap", {
        zIndex: -1,
        display: "none",
    });
    if (document.querySelector("header")) {
        tl.from("header", { y: 200 }, "-=1.5");
        tl.from("header .container", { y: 40, opacity: 0, delay: 0.3 }, "-=1.5");
    }

});
