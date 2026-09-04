/* Site behaviour: theme toggle, docked navbar, scrollspy, email un-obfuscation.
   No jQuery — this file is the only script the site loads. */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function documentTop(el) {
    return el.getBoundingClientRect().top + window.pageYOffset;
  }

  /* ---------------- Light / dark theme ----------------
     The stored preference is applied by an inline script in <head> so the page
     never flashes the wrong theme. This only wires up the button. */
  function initTheme() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    var mq = window.matchMedia('(prefers-color-scheme: dark)');

    function current() {
      var forced = document.documentElement.getAttribute('data-theme');
      if (forced === 'dark' || forced === 'light') return forced;
      return mq.matches ? 'dark' : 'light';
    }

    function paint() {
      var isDark = current() === 'dark';
      var label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      btn.innerHTML = '<i class="fa ' + (isDark ? 'fa-sun-o' : 'fa-moon-o') + '" aria-hidden="true"></i>';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    }

    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      paint();
    });

    // Follow the OS while the visitor has not made an explicit choice.
    if (mq.addEventListener) mq.addEventListener('change', paint);
    else if (mq.addListener) mq.addListener(paint);

    paint();
  }

  /* ---------------- Docked navbar + scrollspy ---------------- */
  function initNav() {
    var nav = document.querySelector('.navbar');
    if (!nav) return;

    var body = document.body;
    var links = Array.prototype.slice.call(nav.querySelectorAll('.navbar-link'));
    var sections = links.map(function (link) {
      var hash = link.getAttribute('href').split('#')[1];
      return hash ? document.getElementById(hash) : null;
    });

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var navOffsetTop = 0;

    // Measured with the navbar undocked, otherwise it reads 0 and the bar can
    // never come loose again.
    function measure() {
      body.classList.remove('has-docked-nav');
      navOffsetTop = documentTop(nav);
    }

    function setActive(index) {
      links.forEach(function (link, i) {
        if (i === index) link.classList.add('active');
        else link.classList.remove('active');
      });
    }

    function update() {
      var y = window.pageYOffset;
      body.classList.toggle('has-docked-nav', y > navOffsetTop);

      var probe = y + nav.offsetHeight + 24;
      var current = -1;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i] && documentTop(sections[i]) <= probe) current = i;
      }
      // At the very bottom, highlight the last section: a short trailing
      // section can never reach the probe line on its own.
      if (window.innerHeight + y >= document.documentElement.scrollHeight - 2) {
        for (var j = sections.length - 1; j >= 0; j--) {
          if (sections[j]) { current = j; break; }
        }
      }
      setActive(current);
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        update();
      });
    }

    // "/foo/index.html" and "/foo/" address the same document.
    function normalize(path) {
      return path.replace(/index\.html$/, '');
    }

    links.forEach(function (link, i) {
      link.addEventListener('click', function (e) {
        var target = sections[i];
        if (!target) return;
        // Let links pointing at another document navigate normally.
        if (normalize(link.pathname) !== normalize(window.location.pathname)) return;

        e.preventDefault();
        window.scrollTo({
          top: documentTop(target) - nav.offsetHeight - 8,
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
        history.replaceState(null, '', '#' + target.id);
        setActive(i);
      });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); update(); });
    window.addEventListener('load', function () { measure(); update(); });

    measure();
    update();
  }

  /* ---------------- Email ----------------
     The address stays obfuscated in the markup for scrapers; the mailto link is
     assembled at runtime. */
  function initEmail() {
    var el = document.getElementById('email');
    if (!el) return;
    var address = (el.getAttribute('data-email') || el.textContent)
      .replace(/\s*\[\s*at\s*\]\s*/i, '@')
      .replace(/\s*\[\s*dot\s*\]\s*/gi, '.')
      .trim();
    if (address.indexOf('@') === -1) return;

    var link = document.createElement('a');
    link.href = 'mailto:' + address;
    link.textContent = el.textContent;
    link.className = 'email-link';
    link.title = 'Send an email';
    el.parentNode.replaceChild(link, el);
  }

  ready(function () {
    initTheme();
    initNav();
    initEmail();
  });
})();
