(function() {
  'use strict';
  var subtitle = document.getElementById('subtitle');
  if (!subtitle) return;

  var fullText;
  var slogansEl = document.getElementById('slogans-data');
  if (slogansEl) {
    try {
      var slogans = JSON.parse(slogansEl.textContent);
      if (slogans.length > 0) {
        fullText = slogans[Math.floor(Math.random() * slogans.length)];
      }
    } catch (e) {}
  }
  if (!fullText) {
    fullText = subtitle.getAttribute('data-typed-text') || subtitle.innerText || '';
  }

  var speed = 70;
  var cursor = '_';
  subtitle.innerText = '';
  subtitle.style.visibility = 'visible';
  subtitle.style.opacity = '1';

  var bannerText = document.querySelector('#banner .banner-text');
  if (bannerText) {
    bannerText.style.transition = 'opacity 0.4s ease, transform 0.5s cubic-bezier(.22,1,.36,1)';
    bannerText.style.opacity = '0';
    bannerText.style.transform = 'scale(0.96)';
    requestAnimationFrame(function() {
      bannerText.style.opacity = '1';
      bannerText.style.transform = 'scale(1)';
    });
  }

  var index = 0;
  function typeNext() {
    if (index < fullText.length) {
      subtitle.innerText = fullText.substring(0, index + 1) + cursor;
      index++;
      setTimeout(typeNext, speed);
    } else {
      subtitle.innerText = fullText;
    }
  }
  setTimeout(typeNext, 350);
})();
