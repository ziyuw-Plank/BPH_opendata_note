(function() {
  'use strict';

  function getDecryptedPost() {
    var post = document.getElementById('hexo-blog-encrypt');
    if (!post || !post.classList.contains('hbe-decrypted-content')) {
      return null;
    }
    return post;
  }

  function refreshFluidWidgets() {
    var post = getDecryptedPost();
    if (!post) return;

    post.classList.add('markdown-body');

    window.setTimeout(function() {
      if (window.Fluid && Fluid.boot && typeof Fluid.boot.refresh === 'function') {
        Fluid.boot.refresh();
        return;
      }

      if (window.tocbot && typeof tocbot.refresh === 'function') {
        tocbot.refresh();
        var toc = document.getElementById('toc');
        if (toc && toc.querySelector('.toc-list-item')) {
          toc.style.visibility = 'visible';
        }
      }
    }, 0);
  }

  window.addEventListener('hexo-blog-decrypt', refreshFluidWidgets);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshFluidWidgets);
  } else {
    refreshFluidWidgets();
  }
})();
