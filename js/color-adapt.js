(function() {
  'use strict';

  var BANNER_ID = 'banner';
  var STEP = 64;
  var DARK_LUM_CUTOFF = 0.35;
  var LIGHT_LUM_CUTOFF = 0.65;
  var SATURATION_WEIGHT = 0.35;
  var BG_WARMTH = 0.9;

  /* ---------- helpers ---------- */

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h, s: s, l: l };
  }

  function hslToRgb(h, s, l) {
    var r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }

  function luminance(r, g, b) {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---------- sample pixels from canvas ---------- */

  function sampleImage(img) {
    var canvas = document.createElement('canvas');
    canvas.width = STEP;
    canvas.height = STEP;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, STEP, STEP);
    var data = ctx.getImageData(0, 0, STEP, STEP).data;

    var totalR = 0, totalG = 0, totalB = 0, count = 0;
    var rSum = 0, gSum = 0, bSum = 0;

    for (var i = 0; i < data.length; i += 4) {
      var r = data[i], g = data[i + 1], b = data[i + 2];
      totalR += r; totalG += g; totalB += b;
      count++;
    }

    var avgR = totalR / count, avgG = totalG / count, avgB = totalB / count;

    /* Weighted: more weight on pixels near the average */
    var wR = 0, wG = 0, wB = 0, wTotal = 0;
    for (var j = 0; j < data.length; j += 4) {
      var rr = data[j], gg = data[j + 1], bb = data[j + 2];
      var dr = rr - avgR, dg = gg - avgG, db = bb - avgB;
      var dist = Math.sqrt(dr * dr + dg * dg + db * db);
      var weight = 1 / (1 + dist / 60);
      wR += rr * weight; wG += gg * weight; wB += bb * weight;
      wTotal += weight;
    }

    return {
      r: Math.round(wR / wTotal),
      g: Math.round(wG / wTotal),
      b: Math.round(wB / wTotal)
    };
  }

  /* ---------- derive palette from dominant colour ---------- */

  function derivePalette(r, g, b) {
    var hsl = rgbToHsl(r, g, b);
    var avgLum = luminance(r, g, b);
    var isDark = avgLum < DARK_LUM_CUTOFF;
    var isLight = avgLum > LIGHT_LUM_CUTOFF;

    /* Warm up the background hue slightly */
    var bgHue = hsl.h;
    var bgSat = clamp(hsl.s * 0.35, 0.03, 0.18);

    var bgLight, bgLight2;
    if (isDark) {
      bgLight = clamp(hsl.l * 0.28, 0.06, 0.13);
      bgLight2 = clamp(hsl.l * 0.38, 0.09, 0.18);
    } else if (isLight) {
      bgLight = clamp(0.94 + hsl.l * 0.04, 0.91, 0.97);
      bgLight2 = clamp(0.88 + hsl.l * 0.04, 0.84, 0.93);
    } else {
      /* Mid-tone image: blend toward warm paper */
      bgLight = clamp(hsl.l * 0.45 + 0.48, 0.88, 0.97);
      bgLight2 = clamp(hsl.l * 0.40 + 0.44, 0.82, 0.93);
    }

    var textLight = isDark ? 0.89 : clamp(0.08 + hsl.l * 0.02, 0.06, 0.16);

    var bg1 = hslToRgb(bgHue, bgSat, bgLight);
    var bg2 = hslToRgb(bgHue, bgSat * 1.3, bgLight2);
    var bg3 = hslToRgb(bgHue, bgSat * 0.8, clamp(bgLight2 - 0.04, 0, 1));

    /* Text: warm greys derived from the dominant hue */
    var textHue = bgHue;
    var textSat = clamp(hsl.s * 0.06, 0, 0.04);
    var textPri = hslToRgb(textHue, textSat, textLight);
    var textSec = hslToRgb(textHue, textSat * 1.5, isDark ? 0.58 : 0.40);
    var textTer = hslToRgb(textHue, textSat * 1.2, isDark ? 0.38 : 0.60);

    var borderAlpha = isDark ? '0.07' : '0.06';

    function rgbStr(c) { return c.r + ',' + c.g + ',' + c.b; }

    var root = document.documentElement;
    root.style.setProperty('--bg-primary',   '#' + toHex(bg1));
    root.style.setProperty('--bg-secondary', '#' + toHex(bg2));
    root.style.setProperty('--bg-tertiary',  '#' + toHex(bg3));
    root.style.setProperty('--text-primary',  '#' + toHex(textPri));
    root.style.setProperty('--text-secondary','#' + toHex(textSec));
    root.style.setProperty('--text-tertiary', '#' + toHex(textTer));
    root.style.setProperty('--body-bg-color', '#' + toHex(bg1));
    root.style.setProperty('--board-bg-color', '#' + toHex(bg1));
    root.style.setProperty('--text-color',     '#' + toHex(textPri));
    root.style.setProperty('--sec-text-color', '#' + toHex(textSec));
    root.style.setProperty('--post-text-color', '#' + toHex(textPri));
    root.style.setProperty('--post-heading-color', '#' + toHex(textPri));
    root.style.setProperty('--post-link-color', '#' + toHex(textPri));
    root.style.setProperty('--subtitle-color', '#' + toHex(textSec));
    root.style.setProperty('--navbar-text-color', '#' + toHex(textSec));
    root.style.setProperty('--line-color', 'rgba(' + rgbStr(textPri) + ',' + borderAlpha + ')');

    console.log('[color-adapt] Palette derived from banner image — bg: #' + toHex(bg1) +
                ' text: #' + toHex(textPri) + ' light:' + isLight + ' dark:' + isDark);
  }

  function toHex(c) {
    var hex = function(v) { var h = v.toString(16); return h.length === 1 ? '0' + h : h; };
    return hex(c.r) + hex(c.g) + hex(c.b);
  }

  /* ---------- entry ---------- */

  function extractAndApply() {
    var banner = document.getElementById(BANNER_ID);
    if (!banner) return;

    /* Get the background-image URL */
    var bgStyle = banner.style.backgroundImage || getComputedStyle(banner).backgroundImage;
    var match = bgStyle.match(/url\(["']?([^"')]+)["']?\)/);
    if (!match) return;

    var imgUrl = match[1];
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      var dominant = sampleImage(img);
      derivePalette(dominant.r, dominant.g, dominant.b);
    };
    img.onerror = function() {
      console.log('[color-adapt] Could not load banner image for colour extraction');
    };
    img.src = imgUrl;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', extractAndApply);
  } else {
    extractAndApply();
  }

})();
