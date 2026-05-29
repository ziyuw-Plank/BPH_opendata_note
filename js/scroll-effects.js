(function() {
  'use strict';

  var initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;

    initScrollEffects();
    initRevealAnimations();
  }

  /* ============================================================
     Unified Scroll Loop
     Banner fade, nav effect, scroll-top button — all in one RAF
     ============================================================ */

  function initScrollEffects() {
    var banner = document.getElementById('banner');
    var navbar = document.getElementById('navbar');
    var scrollBtn = document.getElementById('scroll-top-button');
    var scrollArrow = document.querySelector('.scroll-down-bar');
    var ticking = false;

    function update() {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;

      /* Banner: fade out entirely as you scroll past it */
      if (banner) {
        var bannerHeight = banner.offsetHeight;
        if (bannerHeight < 100) bannerHeight = window.innerHeight;
        var progress = Math.min(scrollY / (bannerHeight * 0.55), 1);
        var opacity = Math.max(0, 1 - progress);
        banner.style.opacity = opacity.toFixed(2);
      }

      /* Scroll-down arrow: hide when scrolled */
      if (scrollArrow) {
        scrollArrow.style.opacity = scrollY < 100 ? '0.7' : '0';
      }

      /* Navbar: subtle style change on scroll */
      if (navbar) {
        if (scrollY > 30) {
          navbar.classList.add('top-nav-collapse');
        } else {
          navbar.classList.remove('top-nav-collapse');
        }
      }

      /* Scroll-top button: show/hide */
      if (scrollBtn) {
        if (scrollY > 500) {
          scrollBtn.style.opacity = '0.6';
          scrollBtn.style.transform = 'translateY(0)';
          scrollBtn.style.pointerEvents = 'auto';
        } else {
          scrollBtn.style.opacity = '0';
          scrollBtn.style.transform = 'translateY(8px)';
          scrollBtn.style.pointerEvents = 'none';
        }
      }

      ticking = false;
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  /* ============================================================
     Editorial Reveal Animations (IntersectionObserver)
     ============================================================ */

  function initRevealAnimations() {
    if (!window.IntersectionObserver) return;

    /* Elements that fade in gently */
    var revealTargets = document.querySelectorAll(
      '.index-card, .post-content h2, .post-content h3, ' +
      '.post-prevnext, .about-info, .archive-list-item, .category-list-item'
    );

    for (var i = 0; i < revealTargets.length; i++) {
      revealTargets[i].classList.add('fx-reveal');
    }

    var revealObserver = new IntersectionObserver(function(entries) {
      for (var k = 0; k < entries.length; k++) {
        if (entries[k].isIntersecting) {
          entries[k].target.classList.add('fx-visible');
          revealObserver.unobserve(entries[k].target);
        }
      }
    }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

    for (var j = 0; j < revealTargets.length; j++) {
      revealObserver.observe(revealTargets[j]);
    }

    /* Staggered content sections */
    var staggerTargets = document.querySelectorAll(
      '.post-content, .about-info, .category-content, .tag-content'
    );

    for (var m = 0; m < staggerTargets.length; m++) {
      var el = staggerTargets[m];
      el.classList.add('fx-stagger');

      var staggerObs = new IntersectionObserver(function(target) {
        return function(entries) {
          for (var n = 0; n < entries.length; n++) {
            if (entries[n].isIntersecting) {
              target.classList.add('fx-visible');
              staggerObs.unobserve(target);
            }
          }
        };
      }(el), { threshold: 0.04 });

      staggerObs.observe(el);
    }
  }

  /* ============================================================
     Initialization
     ============================================================ */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(init, 30);
    });
  } else {
    setTimeout(init, 30);
  }

})();
