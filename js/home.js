(function () {
  function shouldSkipIntro() {
    var params = new URLSearchParams(window.location.search);
    var intro = params.get('intro');
    return intro === 'skip';
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  if (prefersReducedMotion() || shouldSkipIntro()) {
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

    var fullText = el.textContent.replace(/\s+/g, ' ').trim();
    el.textContent = '';

    var cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    el.appendChild(cursor);
    document.documentElement.classList.add('intro-active');

    var index = 0;

    function nextTypeDelay(char) {
      if (char === ' ') return 45;
      if (char === '.' || char === ':' || char === ';') return 520;
      if (char === ',' || char === '—') return 340;
      return 105;
    }

    function typeChar() {
      if (index < fullText.length) {
        var char = fullText[index];
        el.insertBefore(document.createTextNode(char), cursor);
        index++;
        window.setTimeout(typeChar, nextTypeDelay(char));
        return;
      }

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

    function revealNav() {
      // No transform reset — nav has no CSS transform, and setting one would
      // create an unnecessary compositing layer that can interfere with the
      // opacity transition in Chrome.
      nav.style.transition = 'none';
      nav.offsetHeight;
      nav.style.transition = 'opacity 2.8s ease';
      nav.style.opacity = '1';
    }

    // Wait for BOTH the initial pause AND web fonts before typing.
    // On Chrome/Windows, Google Fonts (display=swap) can take longer than
    // 1700 ms, causing a mid-typing font swap (FOUT) that reflows the text.
    // document.fonts.ready resolves once all fonts are loaded/decided.
    var fontReady = (document.fonts && document.fonts.ready) || Promise.resolve();
    var timerReady = new Promise(function (resolve) {
      window.setTimeout(resolve, 1700);
    });
    Promise.all([fontReady, timerReady]).then(typeChar);
  }
}());
