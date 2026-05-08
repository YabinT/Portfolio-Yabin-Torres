(function () {
  var INTRO_DELAY = 800;
  var FONT_WAIT_TIMEOUT = 1200;
  var INTRO_FAILSAFE_TIMEOUT = 4000;

  function shouldSkipIntro() {
    var params = new URLSearchParams(window.location.search);
    var intro = params.get('intro');
    return intro === 'skip';
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  if (shouldSkipIntro()) {
    document.documentElement.classList.remove('intro-pending');
  }

  document.addEventListener('DOMContentLoaded', function () {
    initProjectFilters();
    initProjectReveal();
    initCinematicIntro();
  });

  function initProjectFilters() {
    var btns = document.querySelectorAll('.filter-btn');
    var items = document.querySelectorAll('.project-item');

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (item) {
          item.classList.remove('active');
        });

        btn.classList.add('active');

        var filter = btn.dataset.filter;
        items.forEach(function (item) {
          var match = filter === 'all' || item.dataset.category === filter;
          item.style.display = match ? 'grid' : 'none';
        });
      });
    });
  }

  function initProjectReveal() {
    var items = document.querySelectorAll('.project-item');

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (item) {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    items.forEach(function (item, index) {
      item.style.opacity = '0';
      item.style.transform = 'translateY(12px)';
      item.style.transition = 'opacity 0.5s ease ' + index * 0.08 + 's, transform 0.5s ease ' + index * 0.08 + 's';
      observer.observe(item);
    });
  }

  function initCinematicIntro() {
    if (!document.documentElement.classList.contains('intro-pending')) return;

    var nav = document.querySelector('nav');
    var el = document.querySelector('.hero-intro');
    if (!nav || !el) return;

    if (prefersReducedMotion()) {
      document.documentElement.classList.remove('intro-pending');
      el.style.opacity = '1';
      el.style.transform = 'none';
      nav.style.opacity = '1';
      return;
    }

    var fullText = el.textContent.replace(/\s+/g, ' ').trim();
    el.textContent = '';

    var index = 0;
    var cursor = null;
    var introFinished = false;
    var failsafe = window.setTimeout(showFinalIntroState, INTRO_FAILSAFE_TIMEOUT);

    function nextTypeDelay(char) {
      if (char === ' ') return 45;
      if (char === '.' || char === ':' || char === ';') return 520;
      if (char === ',' || char === '—') return 340;
      return 105;
    }

    function startTyping() {
      if (introFinished) return;
      cursor = document.createElement('span');
      cursor.className = 'typewriter-cursor';
      el.appendChild(cursor);
      document.documentElement.classList.add('intro-active');
      window.requestAnimationFrame(typeChar);
    }

    function typeChar() {
      if (introFinished) return;
      if (index < fullText.length) {
        var char = fullText[index];
        el.insertBefore(document.createTextNode(char), cursor);
        index++;
        window.setTimeout(typeChar, nextTypeDelay(char));
        return;
      }

      introFinished = true;
      window.clearTimeout(failsafe);
      cursor.remove();
      window.setTimeout(function () {
        // Lock final state inline before removing classes.
        // Without this, Chrome re-fires the base fadeUp animation the moment
        // intro-pending is removed from the cascade (Safari suppresses the
        // restart; Chrome does not), causing the typed text to flash invisible.
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        el.style.animation = 'none';
        revealNav();
        document.documentElement.classList.remove('intro-pending');
        document.documentElement.classList.remove('intro-active');
      }, 900);
    }

    function showFinalIntroState() {
      if (introFinished) return;

      introFinished = true;
      el.textContent = fullText;
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      el.style.animation = 'none';
      revealNav();
      document.documentElement.classList.remove('intro-pending');
      document.documentElement.classList.remove('intro-active');
    }

    function revealNav() {
      // No transform reset — nav has no CSS transform, and setting one would
      // create an unnecessary compositing layer that can interfere with the
      // opacity transition in Chrome.
      nav.style.transition = 'none';
      nav.offsetHeight;
      nav.style.transition = 'opacity 2.8s ease';
      nav.style.opacity = '1';
    }

    function waitForIntroFont() {
      if (!document.fonts || !document.fonts.ready) {
        return Promise.resolve();
      }

      var timeout = new Promise(function (resolve) {
        window.setTimeout(resolve, FONT_WAIT_TIMEOUT);
      });

      return Promise.race([document.fonts.ready, timeout]).catch(function () {});
    }

    // Wait for the initial pause and the exact intro font, with a timeout so
    // Chrome cannot leave the hero blank if a Google Font request is slow.
    var timerReady = new Promise(function (resolve) {
      window.setTimeout(resolve, INTRO_DELAY);
    });
    Promise.all([waitForIntroFont(), timerReady]).then(startTyping);
  }
}());
