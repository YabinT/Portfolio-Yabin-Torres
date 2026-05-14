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
      // getBoundingClientRect reflects the CSS scale transform on hero-network.
      // With scale:0.5, rect.width = cw*0.5. We use this to compute the minimum
      // layout-space margin that prevents the visual bubble from clipping the hero edge.
      var rect = network.getBoundingClientRect();
      var sx = (cw > 0 && rect.width  > 0) ? rect.width  / cw : 1;
      var sy = (ch > 0 && rect.height > 0) ? rect.height / ch : 1;
      bubbles.forEach(function (b) {
        if (!b.el) return;
        b.rpx   = Math.max(b.el.offsetWidth, b.el.offsetHeight) / 2;
        b.rxPct = Math.max((b.rpx - cw * (1 - sx) / (2 * sx)) / cw * 100, 1);
        b.ryPct = Math.max((b.rpx - ch * (1 - sy) / (2 * sy)) / ch * 100, 1);
      });
    }

    measureRadii();
    window.addEventListener('resize', measureRadii);

    var baseSpeed  = isMobile ? 0.026 : 0.04;
    var speedRange = isMobile ? 0.012 : 0.02;

    bubbles.forEach(function (b) {
      if (!b.el) return;
      b.el.style.animation = 'none';
      var speed = baseSpeed + Math.random() * speedRange;
      var angle = Math.random() * Math.PI * 2;
      b.vx           = Math.cos(angle) * speed;
      b.vy           = Math.sin(angle) * speed;
      b.naturalSpeed = speed;
      b.frozen        = false;
      b.dragging      = false;

      if (isMobile) {
        b.el.style.cursor = 'default';
        b.el.addEventListener('touchstart',  function () { b.frozen = true; },  { passive: true });
        b.el.addEventListener('touchend',    function () { b.frozen = false; });
        b.el.addEventListener('touchcancel', function () { b.frozen = false; });
      } else {
        b.el.style.cursor = 'grab';
      }
    });

    // ── Cursor tracking ──────────────────────────────────────────────────────
    var cursor = { x: -9999, y: -9999, active: false };
    if (!isMobile) {
      network.addEventListener('mousemove', function (e) {
        var rect   = network.getBoundingClientRect();
        cursor.x   = (e.clientX - rect.left) / rect.width  * 100;
        cursor.y   = (e.clientY - rect.top)  / rect.height * 100;
        cursor.active = true;
      });
      network.addEventListener('mouseleave', function () { cursor.active = false; });
    }

    // ── Drag-to-throw ────────────────────────────────────────────────────────
    var drag = {
      bubble: null,
      throwVx: 0, throwVy: 0,
      prevX: 0,   prevY: 0,
      startX: 0,  startY: 0,
      didMove: false
    };

    if (!isMobile) {
      bubbles.forEach(function (b) {
        if (!b.el) return;

        b.el.addEventListener('mousedown', function (e) {
          e.preventDefault();
          drag.bubble  = b;
          drag.throwVx = 0; drag.throwVy = 0;
          drag.prevX   = b.x; drag.prevY = b.y;
          drag.startX  = b.x; drag.startY = b.y;
          drag.didMove = false;
          b.dragging   = true;
          b.el.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';
        });

        // Suppress click-to-navigate if the user actually dragged
        b.el.addEventListener('click', function (e) {
          if (drag.didMove) {
            e.stopImmediatePropagation();
            drag.didMove = false;
          }
        });
      });

      document.addEventListener('mousemove', function (e) {
        if (!drag.bubble) return;
        var b    = drag.bubble;
        var rect = network.getBoundingClientRect();
        var rx   = b.rxPct || 5, ry = b.ryPct || 5;
        var nx   = (e.clientX - rect.left) / rect.width  * 100;
        var ny   = (e.clientY - rect.top)  / rect.height * 100;
        nx = Math.max(rx, Math.min(100 - rx, nx));
        ny = Math.max(ry, Math.min(100 - ry, ny));
        b.x = nx; b.y = ny;
        b.el.style.left = nx + '%';
        b.el.style.top  = ny + '%';

        // Flag as a real drag if moved more than 2%
        if (!drag.didMove) {
          var ddx = nx - drag.startX, ddy = ny - drag.startY;
          if (Math.sqrt(ddx * ddx + ddy * ddy) > 2) drag.didMove = true;
        }
      });

      document.addEventListener('mouseup', function () {
        if (!drag.bubble) return;
        var b   = drag.bubble;
        var spd = Math.sqrt(drag.throwVx * drag.throwVx + drag.throwVy * drag.throwVy);
        var MAX_THROW = 0.28;
        b.vx = drag.throwVx;
        b.vy = drag.throwVy;
        if (spd > MAX_THROW) { b.vx = b.vx / spd * MAX_THROW; b.vy = b.vy / spd * MAX_THROW; }
        b.dragging = false;
        drag.bubble = null;
        b.el.style.cursor = 'grab';
        document.body.style.userSelect = '';
      });
    }

    // ── SVG lines ────────────────────────────────────────────────────────────
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

    // ── Physics tick ─────────────────────────────────────────────────────────
    function tick() {
      var cw = network.offsetWidth, ch = network.offsetHeight;

      // Accumulate throw velocity per animation frame (smoothed delta)
      if (drag.bubble) {
        var db     = drag.bubble;
        drag.throwVx = drag.throwVx * 0.6 + (db.x - drag.prevX) * 0.4;
        drag.throwVy = drag.throwVy * 0.6 + (db.y - drag.prevY) * 0.4;
        drag.prevX = db.x;
        drag.prevY = db.y;
      }

      // Move bubbles + wall bounce
      bubbles.forEach(function (b) {
        if (b.frozen || b.dragging) return;
        b.x += b.vx; b.y += b.vy;
        var rx = b.rxPct || 5, ry = b.ryPct || 5;
        if (b.x < rx)       { b.x = rx;       b.vx =  Math.abs(b.vx); }
        if (b.x > 100 - rx) { b.x = 100 - rx; b.vx = -Math.abs(b.vx); }
        if (b.y < ry)       { b.y = ry;        b.vy =  Math.abs(b.vy); }
        if (b.y > 100 - ry) { b.y = 100 - ry;  b.vy = -Math.abs(b.vy); }
      });

      // Cursor repulsion
      if (!isMobile && cursor.active) {
        var REPEL_R   = 20;     // radius as % of container width
        var REPEL_F   = 0.007;
        var REPEL_MAX = 0.24;
        var rPx       = REPEL_R / 100 * cw;
        bubbles.forEach(function (b) {
          if (b.frozen || b.dragging) return;
          var dx   = b.x - cursor.x,   dy   = b.y - cursor.y;
          var dxPx = dx / 100 * cw,    dyPx = dy / 100 * ch;
          var dist = Math.sqrt(dxPx * dxPx + dyPx * dyPx);
          if (dist < rPx && dist > 0.1) {
            var force = (1 - dist / rPx) * REPEL_F;
            b.vx += (dxPx / dist) * force;
            b.vy += (dyPx / dist) * force;
            var spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            if (spd > REPEL_MAX) { b.vx = b.vx / spd * REPEL_MAX; b.vy = b.vy / spd * REPEL_MAX; }
          }
        });
      }

      // Speed damping: decay excess speed back toward natural drift
      if (!isMobile) {
        bubbles.forEach(function (b) {
          if (b.frozen || b.dragging) return;
          var spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          if (spd > b.naturalSpeed) {
            b.vx *= 0.985; b.vy *= 0.985;
          } else if (spd < b.naturalSpeed * 0.8 && spd > 0.001) {
            var boost = b.naturalSpeed * 0.008;
            b.vx += (b.vx / spd) * boost;
            b.vy += (b.vy / spd) * boost;
          }
        });
      }

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

      // Bubble-bubble collisions
      for (var i = 0; i < bubbles.length; i++) {
        for (var j = i + 1; j < bubbles.length; j++) {
          var a = bubbles[i], bb = bubbles[j];
          var aFixed = a.frozen || a.dragging;
          var bFixed = bb.frozen || bb.dragging;
          if (aFixed && bFixed) continue;

          var ax = a.x / 100 * cw, ay = a.y / 100 * ch;
          var bx = bb.x / 100 * cw, by = bb.y / 100 * ch;
          var dx = bx - ax, dy = by - ay;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var minDist = (a.rpx || 40) + (bb.rpx || 40);

          if (dist < minDist && dist > 0.1) {
            var nx = dx / dist, ny = dy / dist;
            var overlap, dot, damp;
            if (aFixed) {
              overlap = minDist - dist;
              bb.x += nx * overlap / cw * 100; bb.y += ny * overlap / ch * 100;
              dot = bb.vx * nx + bb.vy * ny;
              if (dot < 0) { bb.vx -= nx * dot * 0.88; bb.vy -= ny * dot * 0.88; }
            } else if (bFixed) {
              overlap = minDist - dist;
              a.x -= nx * overlap / cw * 100; a.y -= ny * overlap / ch * 100;
              dot = a.vx * nx + a.vy * ny;
              if (dot > 0) { a.vx -= nx * dot * 0.88; a.vy -= ny * dot * 0.88; }
            } else {
              overlap = (minDist - dist) * 0.5;
              a.x  -= nx * overlap / cw * 100; a.y  -= ny * overlap / ch * 100;
              bb.x += nx * overlap / cw * 100; bb.y += ny * overlap / ch * 100;
              var dvx = bb.vx - a.vx, dvy = bb.vy - a.vy;
              dot = dvx * nx + dvy * ny;
              if (dot < 0) {
                damp = 0.88;
                a.vx  += nx * dot * damp; a.vy  += ny * dot * damp;
                bb.vx -= nx * dot * damp; bb.vy -= ny * dot * damp;
              }
            }
          }
        }
      }

      // Apply positions (skip dragged bubble — already updated by mousemove)
      bubbles.forEach(function (b) {
        if (!b.el || b.dragging) return;
        b.el.style.left = b.x + '%';
        b.el.style.top  = b.y + '%';
      });

      updateLines();
      requestAnimationFrame(tick);
    }

    tick();
  }

  // Reads device orientation and feeds mobileGravity for the tick loop.
  // On iOS 13+, requestPermission() must be called from a click handler —
  // the .tilt-prompt button is shown and triggers it explicitly.
  // Beta is self-calibrated: first reading becomes the neutral position.
  function initGyroscope() {
    if (!window.DeviceOrientationEvent || prefersReducedMotion()) return;
    if (window.innerWidth > 600) return;

    var betaRef = null;

    function handleOrientation(e) {
      var gamma = e.gamma != null ? e.gamma : 0;
      var beta  = e.beta  != null ? e.beta  : null;

      if (betaRef === null && beta !== null) betaRef = beta;

      var gx = gamma / 90;
      var gy = betaRef !== null ? (beta - betaRef) / 90 : 0;

      var dz = 0.11;
      if (Math.abs(gx) < dz) gx = 0;
      if (Math.abs(gy) < dz) gy = 0;

      mobileGravity.x =  gx * 0.003;
      mobileGravity.y = -gy * 0.003;
    }

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      var btn = document.querySelector('.tilt-prompt');
      if (btn) {
        btn.classList.add('visible');
        btn.addEventListener('click', function () {
          DeviceOrientationEvent.requestPermission()
            .then(function (state) {
              if (state === 'granted') {
                window.addEventListener('deviceorientation', handleOrientation);
              }
              btn.classList.remove('visible');
            })
            .catch(function () {
              btn.classList.remove('visible');
            });
        });
      }
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
