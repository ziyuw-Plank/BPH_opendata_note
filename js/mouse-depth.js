(function () {
  'use strict';

  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var MAX_TILT = 3.2;
  var LERP = 0.12;
  var targets = [];
  var heroArt = null;
  var heroX = 0, heroY = 0, heroGX = 0, heroGY = 0;

  function collect() {
    var els = document.querySelectorAll('.index-card:not([data-rk-tilt]), #banner .banner-text:not([data-rk-tilt])');
    els.forEach(function (el) {
      el.dataset.rkTilt = '1';
      var spot = document.createElement('div');
      spot.className = 'rk-spot';
      el.appendChild(spot);
      targets.push({ el: el, spot: spot, rx: 0, ry: 0, grx: 0, gry: 0, tx: 0, gtx: 0, my: 50, gmy: 50, mx: 50, gmx: 50, hover: false });

      el.addEventListener('pointermove', function (e) {
        var t = findByEl(el);
        if (!t) return;
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        t.grx = -py * MAX_TILT;
        t.gry = px * MAX_TILT;
        t.gtx = 4;
        t.gmx = (px + 0.5) * 100;
        t.gmy = (py + 0.5) * 100;
        t.hover = true;
      });

      el.addEventListener('pointerleave', function () {
        var t = findByEl(el);
        if (!t) return;
        t.grx = 0; t.gry = 0; t.gtx = 0; t.hover = false;
      });
    });

    var hero = document.querySelector('.rk-art-hero');
    var banner = document.getElementById('banner');
    if (hero && banner && !hero.dataset.rkParallax) {
      hero.dataset.rkParallax = '1';
      heroArt = hero;
      banner.addEventListener('pointermove', function (e) {
        var r = banner.getBoundingClientRect();
        heroGX = ((e.clientX - r.left) / r.width - 0.5) * -26;
        heroGY = ((e.clientY - r.top) / r.height - 0.5) * -18;
      });
      banner.addEventListener('pointerleave', function () {
        heroGX = 0; heroGY = 0;
      });
    }
  }

  function findByEl(el) {
    for (var i = 0; i < targets.length; i++) {
      if (targets[i].el === el) return targets[i];
    }
    return null;
  }

  function loop() {
    for (var i = 0; i < targets.length; i++) {
      var t = targets[i];
      t.rx += (t.grx - t.rx) * LERP;
      t.ry += (t.gry - t.ry) * LERP;
      t.tx += (t.gtx - t.tx) * LERP;
      t.mx += (t.gmx - t.mx) * LERP;
      t.my += (t.gmy - t.my) * LERP;
      t.el.style.transform =
        'perspective(900px) translateX(' + t.tx.toFixed(2) + 'px)' +
        ' rotateX(' + t.rx.toFixed(3) + 'deg) rotateY(' + t.ry.toFixed(3) + 'deg)';
      t.el.style.setProperty('--mx', t.mx.toFixed(2) + '%');
      t.el.style.setProperty('--my', t.my.toFixed(2) + '%');
      if (t.hover) { t.el.classList.add('rk-tilt-active'); }
      else if (Math.abs(t.rx) < 0.02 && Math.abs(t.ry) < 0.02 && Math.abs(t.tx) < 0.05) {
        t.el.classList.remove('rk-tilt-active');
        t.el.style.transform = '';
      }
    }

    if (heroArt) {
      heroX += (heroGX - heroX) * 0.07;
      heroY += (heroGY - heroY) * 0.07;
      heroArt.style.transform =
        'translate3d(' + heroX.toFixed(2) + 'px,' + heroY.toFixed(2) + 'px,0)';
    }

    requestAnimationFrame(loop);
  }

  function init() {
    collect();
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.setTimeout(collect, 1200);
})();
