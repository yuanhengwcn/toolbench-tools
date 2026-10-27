/* ==========================================================================
   Toolbench — shared runtime
   Theme switching, homepage filtering, clipboard helpers, ad slot bootstrap.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------------- theme */

  var THEME_KEY = 'tb-theme';

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* private mode */ }
  }

  function bindThemeToggle() {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  /* -------------------------------------------------------------- homepage */

  function bindToolFilter() {
    var input = document.getElementById('tool-search');
    if (!input) return;

    var cards = Array.prototype.slice.call(document.querySelectorAll('.tool-card'));
    var groups = Array.prototype.slice.call(document.querySelectorAll('[data-tool-group]'));
    var empty = document.getElementById('tool-empty');

    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      var visible = 0;

      cards.forEach(function (card) {
        var hay = (card.getAttribute('data-keywords') || '') + ' ' + card.textContent.toLowerCase();
        var hit = !q || hay.toLowerCase().indexOf(q) !== -1;
        card.classList.toggle('hidden', !hit);
        if (hit) visible++;
      });

      // Hide a group heading when every card inside it is filtered out.
      groups.forEach(function (group) {
        var any = Array.prototype.some.call(
          group.querySelectorAll('.tool-card'),
          function (c) { return !c.classList.contains('hidden'); }
        );
        group.classList.toggle('hidden', !any);
      });

      if (empty) empty.classList.toggle('hidden', visible !== 0);
    });

    // Keyboard shortcut: "/" focuses search, like GitHub.
    document.addEventListener('keydown', function (e) {
      var tag = (document.activeElement || {}).tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        input.focus();
      }
    });
  }

  /* ------------------------------------------------------------- clipboard */

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for http:// origins.
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  // Any element with data-copy="#target-id" copies that element's value.
  function bindCopyButtons() {
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.querySelector(btn.getAttribute('data-copy'));
        if (!target) return;
        var text = 'value' in target ? target.value : target.textContent;
        copyText(text).then(function () {
          var original = btn.textContent;
          btn.textContent = 'Copied';
          setTimeout(function () { btn.textContent = original; }, 1400);
        });
      });
    });
  }

  /* ------------------------------------------------------------------ ads */

  // Fill this in once AdSense approves the site, e.g. 'ca-pub-1234567890123456'.
  var AD_CLIENT = '';

  function initAdSlots() {
    if (!AD_CLIENT) return; // keep the labelled placeholders while unapproved
    document.querySelectorAll('.ad-slot[data-ad-slot]').forEach(function (el) {
      el.setAttribute('data-live', '1');
      el.textContent = '';
      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', AD_CLIENT);
      ins.setAttribute('data-ad-slot', el.getAttribute('data-ad-slot'));
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      el.appendChild(ins);
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* blocked */ }
    });
  }

  /* ----------------------------------------------------------------- boot */

  function boot() {
    bindThemeToggle();
    bindToolFilter();
    bindCopyButtons();
    initAdSlots();

    // Keep the year in the footer current without editing every page.
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Expose a tiny API for individual tool pages.
  window.TB = {
    copy: copyText,
    setTheme: setTheme
  };
}());
