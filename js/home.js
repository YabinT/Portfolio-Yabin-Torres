(function () {
  var storageKey = 'intro-done';

  function storageGet(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      // Ignore storage restrictions; the intro can safely replay.
    }
  }

  function storageRemove(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      // Ignore storage restrictions; the intro can safely replay.
    }
  }

  function shouldReplayIntro() {
    var params = new URLSearchParams(window.location.search);
    var intro = params.get('intro');
    return intro === '1' || intro === 'replay';
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  if (shouldReplayIntro()) {
    storageRemove(storageKey);
  }

  if (!prefersReducedMotion() && !storageGet(storageKey)) {
    document.documentElement.classList.add('intro-pending');
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

    var index = 0;

    function typeChar() {
      if (index < fullText.length) {
        el.insertBefore(document.createTextNode(fullText[index]), cursor);
        index++;
        window.setTimeout(typeChar, 45);
        return;
      }

      cursor.remove();
      revealNav();
      storageSet(storageKey, '1');
      document.documentElement.classList.remove('intro-pending');
    }

    function revealNav() {
      nav.style.transform = 'translateY(-8px)';
      nav.style.transition = 'none';
      nav.offsetHeight;
      nav.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      nav.style.opacity = '1';
      nav.style.transform = 'translateY(0)';
    }

    window.setTimeout(typeChar, 800);
  }
}());
