(function() {
  'use strict';
  var subtitle = document.getElementById('subtitle');
  if (!subtitle) return;
  var fullText = subtitle.getAttribute('data-typed-text') || subtitle.innerText || '';
  var index = 0;
  var speed = 70;
  var cursor = '_';
  subtitle.innerText = '';
  subtitle.style.visibility = 'visible';

  function typeChar() {
    if (index < fullText.length) {
      subtitle.innerText = fullText.substring(0, index + 1) + cursor;
      index++;
      setTimeout(typeChar, speed);
    } else {
      var show = true;
      setInterval(function() {
        subtitle.innerText = fullText + (show ? cursor : ' ');
        show = !show;
      }, 530);
    }
  }
  typeChar();
})();
