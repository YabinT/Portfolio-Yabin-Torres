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
    initFloatingBubbles();
    initNodeLinks();
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
    var el = document.querySelector('.hero-network');
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

  function initFloatingBubbles() {
    if (prefersReducedMotion()) return;

    var network = document.querySelector('.hero-network');
    if (!network) return;

    var bubbles = [
      { el: document.querySelector('.network-node-industrial'), x: 22, y: 44 },
      { el: document.querySelector('.network-node-research'),   x: 74, y: 18 },
      { el: document.querySelector('.network-node-interface'),  x: 66, y: 74 },
      { el: document.querySelector('.network-node-branding'),   x: 46, y: 84 }
    ];

    // Measure each bubble's pixel radius from its actual rendered size
    function measureRadii() {
      var cw = network.offsetWidth, ch = network.offsetHeight;
      bubbles.forEach(function (b) {
        if (!b.el) return;
        b.rpx = Math.max(b.el.offsetWidth, b.el.offsetHeight) / 2;
        b.rxPct = b.rpx / cw * 100;
        b.ryPct = b.rpx / ch * 100;
      });
    }

    measureRadii();
    window.addEventListener('resize', measureRadii);

    // Disable CSS float animation; set random velocities (% per frame)
    bubbles.forEach(function (b) {
      if (!b.el) return;
      b.el.style.animation = 'none';
      var speed = 0.08 + Math.random() * 0.05;
      var angle = Math.random() * Math.PI * 2;
      b.vx = Math.cos(angle) * speed;
      b.vy = Math.sin(angle) * speed;
    });

    var lineConns = [
      { id: 'line-ir', a: 0, b: 1 }, { id: 'line-ib', a: 0, b: 2 },
      { id: 'line-rb', a: 1, b: 2 }, { id: 'line-bi', a: 0, b: 3 },
      { id: 'line-bb', a: 2, b: 3 }
    ];

    function updateLines() {
      lineConns.forEach(function (lc) {
        var el = document.getElementById(lc.id);
        if (!el) return;
        var a = bubbles[lc.a], b = bubbles[lc.b];
        el.setAttribute('x1', a.x.toFixed(2)); el.setAttribute('y1', a.y.toFixed(2));
        el.setAttribute('x2', b.x.toFixed(2)); el.setAttribute('y2', b.y.toFixed(2));
      });
    }

    function tick() {
      var cw = network.offsetWidth, ch = network.offsetHeight;

      // Move
      bubbles.forEach(function (b) {
        b.x += b.vx;
        b.y += b.vy;
        // Wall bouncing using actual pixel radius converted to %
        var rx = b.rxPct || 5, ry = b.ryPct || 5;
        if (b.x < rx)        { b.x = rx;        b.vx =  Math.abs(b.vx); }
        if (b.x > 100 - rx)  { b.x = 100 - rx;  b.vx = -Math.abs(b.vx); }
        if (b.y < ry)        { b.y = ry;        b.vy =  Math.abs(b.vy); }
        if (b.y > 100 - ry)  { b.y = 100 - ry;  b.vy = -Math.abs(b.vy); }
      });

      // Bubble collision — work in pixel space for accuracy
      for (var i = 0; i < bubbles.length; i++) {
        for (var j = i + 1; j < bubbles.length; j++) {
          var a = bubbles[i], b = bubbles[j];
          var ax = a.x / 100 * cw, ay = a.y / 100 * ch;
          var bx = b.x / 100 * cw, by = b.y / 100 * ch;
          var dx = bx - ax, dy = by - ay;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var minDist = (a.rpx || 40) + (b.rpx || 40);
          if (dist < minDist && dist > 0.1) {
            var nx = dx / dist, ny = dy / dist;
            var overlap = (minDist - dist) * 0.5;
            // Push apart in pixel space, convert back to %
            a.x -= nx * overlap / cw * 100; a.y -= ny * overlap / ch * 100;
            b.x += nx * overlap / cw * 100; b.y += ny * overlap / ch * 100;
            // Exchange velocities along normal
            var dvx = b.vx - a.vx, dvy = b.vy - a.vy;
            var dot = dvx * nx + dvy * ny;
            if (dot < 0) {
              var damp = 0.88;
              a.vx += nx * dot * damp; a.vy += ny * dot * damp;
              b.vx -= nx * dot * damp; b.vy -= ny * dot * damp;
            }
          }
        }
      }

      bubbles.forEach(function (b) {
        if (!b.el) return;
        b.el.style.left = b.x + '%';
        b.el.style.top  = b.y + '%';
      });

      updateLines();
      requestAnimationFrame(tick);
    }

    tick();
  }

  function initNodeLinks() {
    document.querySelectorAll('.network-node').forEach(function (node) {
      node.addEventListener('click', function () {
        document.getElementById('work').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

}());
