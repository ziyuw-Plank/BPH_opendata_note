(function() {
  'use strict';
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/typed.js@2.0.11/lib/typed.min.js';
  script.onload = function() {
    window.Typed = window.Typed || (typeof Typed !== 'undefined' ? Typed : undefined);
    if (!window.Typed && typeof module !== 'undefined' && module.exports) {
      var s = document.createElement('script');
      s.textContent = 'import Typed from "https://cdn.jsdelivr.net/npm/typed.js@2.0.11/lib/typed.min.js"; window.Typed = Typed;';
      s.type = 'module';
      document.head.appendChild(s);
    }
  };
  document.head.appendChild(script);
})();
