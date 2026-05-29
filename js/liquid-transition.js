(function() {
  'use strict';

  var overlay = null;
  var glass = null;
  var transitioning = false;

  function createOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'liquid-transition-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    glass = document.createElement('div');
    glass.className = 'liquid-glass';
    overlay.appendChild(glass);
    document.body.appendChild(overlay);
  }

  function showOverlay() {
    if (!overlay) createOverlay();
    overlay.classList.add('active');
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.remove('active');
  }

  function isInternalLink(link) {
    if (!link.host || link.host === window.location.host) {
      return link.pathname !== window.location.pathname ||
             link.search !== window.location.search;
    }
    return false;
  }

  function isTransitionable(link) {
    if (!link || !link.href) return false;
    if (link.getAttribute('data-toggle')) return false;
    if (link.getAttribute('data-dismiss')) return false;
    if (link.getAttribute('role') === 'button') return false;
    if (link.getAttribute('target') === '_blank') return false;
    if (link.href.startsWith('javascript:')) return false;
    if (link.href.startsWith('#') && link.getAttribute('href') !== '#') return false;
    if (link.href.indexOf('/local-search.xml') !== -1) return false;
    if (link.classList.contains('dropdown-toggle')) return false;
    return isInternalLink(link);
  }

  function navigateTo(url) {
    if (transitioning) return;
    transitioning = true;
    showOverlay();
    setTimeout(function() {
      window.location.href = url;
    }, 500);
  }

  /* Page-load reveal: glass fades out after page is ready */
  function pageLoadReveal() {
    createOverlay();
    showOverlay();
    /* Wait for fonts + images to start loading, then fade out */
    var ready = performance.now();
    var delay = Math.max(0, 600 - ready);
    setTimeout(function() {
      hideOverlay();
      transitioning = false;
    }, delay);
  }

  /* Click handler: intercept internal navigation links */
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    if (!link) return;
    if (!isTransitionable(link)) return;
    e.preventDefault();
    navigateTo(link.href);
  });

  /* Init */
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    pageLoadReveal();
  } else {
    window.addEventListener('DOMContentLoaded', pageLoadReveal);
  }

  /* Handle back/forward navigation */
  window.addEventListener('pageshow', function(e) {
    if (e.persisted) {
      pageLoadReveal();
    }
  });

})();
