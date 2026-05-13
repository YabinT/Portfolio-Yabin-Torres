(function () {
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Shared gravity vector updated by gyroscope handler
  var mobileGravity = { x: 0, y: 0 };

  document.addEventListener('DOMContentLoaded', function () {
    initFloatingBubbles();
    initNodeLinks();
    initGyroscope();
    initMobileWorks();
  });

  function initFloatingBubbles() {
    if (prefersReducedMotion()) return;

    var network = document.querySelector('.hero-network');
    if (!network) return;

    var isMobile = window.innerWidth <= 600;

    var bubbles = isMobile ? [
      { el: document.querySelector('.network-node-industrial'), x: 22, y: 34 },
      { el: document.querySelector('.network-node-research'),   x: 76, y: 20 },
      { el: document.querySelector('.network-node-interface'),  x: 70, y: 66 },
      { el: document.querySelector('.network-node-branding'),   x: 28, y: 74 }
    ] : [
      { el: document.querySelector('.network-node-industrial'), x: 22, y: 44 },
      { el: document.querySelector('.network-node-research'),   x: 74, y: 18 },
      { el: document.querySelector('.network-node-interface'),  x: 66, y: 74 },
      { el: document.querySelector('.network-node-branding'),   x: 46, y: 84 }
    ];

    function measureRadii() {
      var cw = network.offsetWidth, ch = network.offsetHeight;
      bubbles.forEach(function (b) {
        if (!b.el) return;
        b.rpx  = Math.max(b.el.offsetWidth, b.el.offsetHeight) / 2;
        b.rxPct = b.rpx / cw * 100;
        b.ryPct = b.rpx / ch * 100;
      });
    }

    measureRadii();
    window.addEventListener('resize', measureRadii);

    var baseSpeed = isMobile ? 0.026 : 0.04;
    var speedRange = isMobile ? 0.012 : 0.02;

    bubbles.forEach(function (b) {
      if (!b.el) return;
      b.el.style.animation = 'none';
      b.el.style.cursor = 'default';
      var speed = baseSpeed + Math.random() * speedRange;
      var angle = Math.random() * Math.PI * 2;
      b.vx = Math.cos(angle) * speed;
      b.vy = Math.sin(angle) * speed;
      b.frozen = false;
      b.el.addEventListener('mouseenter', function () { b.frozen = true; });
      b.el.addEventListener('mouseleave', function () { b.frozen = false; });
      b.el.addEventListener('touchstart',  function () { b.frozen = true; },  { passive: true });
      b.el.addEventListener('touchend',    function () { b.frozen = false; });
      b.el.addEventListener('touchcancel', function () { b.frozen = false; });
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

      // Move all bubbles
      bubbles.forEach(function (b) {
        if (b.frozen) return;
        b.x += b.vx; b.y += b.vy;
        var rx = b.rxPct || 5, ry = b.ryPct || 5;
        if (b.x < rx)       { b.x = rx;       b.vx =  Math.abs(b.vx); }
        if (b.x > 100 - rx) { b.x = 100 - rx; b.vx = -Math.abs(b.vx); }
        if (b.y < ry)       { b.y = ry;       b.vy =  Math.abs(b.vy); }
        if (b.y > 100 - ry) { b.y = 100 - ry; b.vy = -Math.abs(b.vy); }
      });

      // Gyroscope gravity (mobile only)
      if (isMobile) {
        var MAX_SPEED = 0.18;
        bubbles.forEach(function (b) {
          if (b.frozen) return;
          b.vx += mobileGravity.x;
          b.vy += mobileGravity.y;
          var spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          if (spd > MAX_SPEED) { b.vx = b.vx / spd * MAX_SPEED; b.vy = b.vy / spd * MAX_SPEED; }
        });
      }

      // Bubble collision
      for (var i = 0; i < bubbles.length; i++) {
        for (var j = i + 1; j < bubbles.length; j++) {
          var a = bubbles[i], b = bubbles[j];
          if (a.frozen && b.frozen) continue;
          var ax = a.x / 100 * cw, ay = a.y / 100 * ch;
          var bx = b.x / 100 * cw, by = b.y / 100 * ch;
          var dx = bx - ax, dy = by - ay;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var minDist = (a.rpx || 40) + (b.rpx || 40);
          if (dist < minDist && dist > 0.1) {
            var nx = dx / dist, ny = dy / dist;
            if (a.frozen) {
              var overlap = minDist - dist;
              b.x += nx * overlap / cw * 100; b.y += ny * overlap / ch * 100;
              var dot = b.vx * nx + b.vy * ny;
              if (dot < 0) { b.vx -= nx * dot * 0.88; b.vy -= ny * dot * 0.88; }
            } else if (b.frozen) {
              var overlap = minDist - dist;
              a.x -= nx * overlap / cw * 100; a.y -= ny * overlap / ch * 100;
              var dot = a.vx * nx + a.vy * ny;
              if (dot > 0) { a.vx -= nx * dot * 0.88; a.vy -= ny * dot * 0.88; }
            } else {
              var overlap = (minDist - dist) * 0.5;
              a.x -= nx * overlap / cw * 100; a.y -= ny * overlap / ch * 100;
              b.x += nx * overlap / cw * 100; b.y += ny * overlap / ch * 100;
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

  // Reads device orientation and feeds mobileGravity for the tick loop.
  // On iOS 13+ DeviceOrientationEvent.requestPermission() is required —
  // we ask on the first touchstart so the permission dialog is user-triggered.
  function initGyroscope() {
    if (!window.DeviceOrientationEvent || prefersReducedMotion()) return;
    if (window.innerWidth > 600) return;

    function handleOrientation(e) {
      // gamma: left/right tilt (-90..90), beta: front/back tilt (-180..180).
      // Normalize gamma to -1..1; center beta around 90° (phone held upright).
      mobileGravity.x = (e.gamma || 0) / 90 * 0.004;
      mobileGravity.y = ((e.beta || 90) - 90) / 90 * 0.003;
    }

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+: permission must follow a user gesture
      document.addEventListener('touchstart', function askPermission() {
        DeviceOrientationEvent.requestPermission()
          .then(function (state) {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            }
          })
          .catch(function () {});
        document.removeEventListener('touchstart', askPermission);
      }, { once: true });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }

  function initMobileWorks() {
    if (window.innerWidth > 600) return;

    var cta = document.querySelector('.hero-tap-cta');
    if (!cta) return;

    cta.addEventListener('click', function () {
      var hero = document.querySelector('.hero');
      if (hero) {
        hero.style.transition = 'opacity 0.25s ease';
        hero.style.opacity = '0';
      }
      setTimeout(function () {
        document.body.classList.add('works-active');
        window.scrollTo(0, 0);
      }, 240);
    });
  }

  function initNodeLinks() {
    document.querySelectorAll('.network-node').forEach(function (node) {
      node.addEventListener('click', function () {
        if (window.innerWidth <= 600) {
          var hero = document.querySelector('.hero');
          if (hero) {
            hero.style.transition = 'opacity 0.25s ease';
            hero.style.opacity = '0';
          }
          setTimeout(function () {
            document.body.classList.add('works-active');
            window.scrollTo(0, 0);
          }, 240);
        } else {
          document.getElementById('work').scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

}());
