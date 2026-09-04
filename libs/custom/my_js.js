$(document).ready(function() {

  // Variables
  var $codeSnippets = $('.code-example-body'),
      $nav = $('.navbar'),
      $body = $('body'),
      $window = $(window),
      $popoverLink = $('[data-popover]'),
      navOffsetTop = $nav.offset().top,
      $document = $(document),
      entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
      }

  function init() {
    $window.on('scroll', onScroll)
    $window.on('resize', resize)
    $popoverLink.on('click', openPopover)
    $document.on('click', closePopover)
    $('a[href^="#"]').on('click', smoothScroll)
    buildSnippets();
  }

  function smoothScroll(e) {
    e.preventDefault();
    $(document).off("scroll");
    var target = this.hash,
        menu = target;
    $target = $(target);
    $('html, body').stop().animate({
        'scrollTop': $target.offset().top-40
    }, 0, 'swing', function () {
        window.location.hash = target;
        $(document).on("scroll", onScroll);
    });
  }

  function openPopover(e) {
    e.preventDefault()
    closePopover();
    var popover = $($(this).data('popover'));
    popover.toggleClass('open')
    e.stopImmediatePropagation();
  }

  function closePopover(e) {
    if($('.popover.open').length > 0) {
      $('.popover').removeClass('open')
    }
  }

  function resize() {
    $body.removeClass('has-docked-nav')
    navOffsetTop = $nav.offset().top
    onScroll()
  }

  function onScroll() {
    if(navOffsetTop < $window.scrollTop() && !$body.hasClass('has-docked-nav')) {
      $body.addClass('has-docked-nav')
    }
    if(navOffsetTop > $window.scrollTop() && $body.hasClass('has-docked-nav')) {
      $body.removeClass('has-docked-nav')
    }
  }

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  function buildSnippets() {
    $codeSnippets.each(function() {
      var newContent = escapeHtml($(this).html())
      $(this).html(newContent)
    })
  }


  init();

});


/* ================ Light / dark theme toggle ================
   The stored preference is applied by an inline script in <head> so the page
   never flashes the wrong theme. This only wires up the button. */
document.addEventListener('DOMContentLoaded', function () {
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;

  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    var forced = document.documentElement.getAttribute('data-theme');
    if (forced === 'dark' || forced === 'light') return forced;
    return mq.matches ? 'dark' : 'light';
  }

  function paint() {
    var isDark = currentTheme() === 'dark';
    var label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    btn.innerHTML = '<i class="fa ' + (isDark ? 'fa-sun-o' : 'fa-moon-o') + '" aria-hidden="true"></i>';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  }

  btn.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    paint();
  });

  // Follow the OS while the visitor has not made an explicit choice.
  if (mq.addEventListener) mq.addEventListener('change', paint);
  else if (mq.addListener) mq.addListener(paint);

  paint();
});


/* ================ Scrollspy + same-page smooth scrolling ================ */
document.addEventListener('DOMContentLoaded', function () {
  var nav = document.querySelector('.navbar');
  if (!nav) return;

  var links = Array.prototype.slice.call(nav.querySelectorAll('.navbar-link'));
  var sections = links.map(function (link) {
    var hash = link.getAttribute('href').split('#')[1];
    return hash ? document.getElementById(hash) : null;
  });
  if (!sections.some(Boolean)) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // "/foo/index.html" and "/foo/" address the same document.
  function normalize(path) {
    return path.replace(/index\.html$/, '');
  }

  function documentTop(el) {
    return el.getBoundingClientRect().top + window.pageYOffset;
  }

  function setActive(index) {
    links.forEach(function (link, i) {
      if (i === index) link.classList.add('active');
      else link.classList.remove('active');
    });
  }

  function update() {
    var probe = window.pageYOffset + nav.offsetHeight + 24;
    var current = -1;

    for (var i = 0; i < sections.length; i++) {
      if (sections[i] && documentTop(sections[i]) <= probe) current = i;
    }

    // At the very bottom, always highlight the last real section: short trailing
    // sections can never reach the probe line on their own.
    if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 2) {
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
  window.addEventListener('resize', onScroll);
  update();
});
