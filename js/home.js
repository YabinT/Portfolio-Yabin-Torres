(function () {
  var INTRO_DELAY = 800;
  var FONT_WAIT_TIMEOUT = 1200;
  var INTRO_REVEAL_DURATION = 2600;
  var INTRO_FAILSAFE_TIMEOUT = 5000;

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
    initProjectReveal();
    initCinematicIntro();
  });

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

    var introFinished = false;
    var failsafe = window.setTimeout(showFinalIntroState, INTRO_FAILSAFE_TIMEOUT);

    function startIntroReveal() {
      if (introFinished) return;
      document.documentElement.classList.add('intro-active');
      window.setTimeout(finishIntroReveal, INTRO_REVEAL_DURATION);
    }

    function finishIntroReveal() {
      if (introFinished) return;

      introFinished = true;
      window.clearTimeout(failsafe);
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      el.style.backgroundPosition = '0% 50%';
      el.style.animation = 'none';
      revealNav();
      document.documentElement.classList.remove('intro-pending');
      document.documentElement.classList.remove('intro-active');
    }

    function showFinalIntroState() {
      if (introFinished) return;

      introFinished = true;
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      el.style.backgroundPosition = '0% 50%';
      el.style.animation = 'none';
      revealNav();
      document.documentElement.classList.remove('intro-pending');
      document.documentElement.classList.remove('intro-active');
    }

    function revealNav() {
      nav.style.transition = 'none';
      nav.offsetHeight;
      nav.style.transition = 'opacity 2.2s ease';
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

    var timerReady = new Promise(function (resolve) {
      window.setTimeout(resolve, INTRO_DELAY);
    });
    Promise.all([waitForIntroFont(), timerReady]).then(startIntroReveal);
  }
}());
