(function () {
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  document.addEventListener('DOMContentLoaded', function () {
    initFloatingBubbles();
    initNodeLinks();
  });

  var dragJustEnded = false;

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

    // -- Drag state ----------------------------------------------------------
    var drag = { bubble: null, ox: 0, oy: 0, history: [], didMove: false };

    function getEventPos(e) {
      var src = e.touches ? e.touches[0] : e;
      return { x: src.clientX, y: src.clientY };
    }

    bubbles.forEach(function (b) {
      if (!b.el) return;
      b.el.addEventListener('mousedown', onDragStart);
      b.el.addEventListener('touchstart', onDragStart, { passive: true });
    });

    function onDragStart(e) {
      var b = bubbles.filter(function (bub) { return bub.el === e.currentTarget; })[0];
      if (!b) return;
      var pos  = getEventPos(e);
      var rect = network.getBoundingClientRect();
      drag.bubble  = b;
      // Store offset in layout-% space so it stays correct across resizes.
      // rect.width is the visual (scaled) width, which maps 1:1 to layout %.
      drag.oxPct   = (pos.x - rect.left)  / rect.width  * 100 - b.x;
      drag.oyPct   = (pos.y - rect.top)   / rect.height * 100 - b.y;
      drag.history = [{ x: b.x, y: b.y, t: Date.now() }];
      drag.didMove = false;
      b.vx = 0;
      b.vy = 0;
      b.el.style.cursor = 'grabbing';
    }

    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('touchmove', onDragMove, { passive: true });
    window.addEventListener('mouseup',   onDragEnd);
    window.addEventListener('touchend',  onDragEnd);

    function onDragMove(e) {
      if (!drag.bubble) return;
      var b    = drag.bubble;
      var pos  = getEventPos(e);
      var rect = network.getBoundingClientRect();
      var rx   = b.rxPct || 5, ry = b.ryPct || 5;
      var nx   = (pos.x - rect.left)  / rect.width  * 100 - drag.oxPct;
      var ny   = (pos.y - rect.top)   / rect.height * 100 - drag.oyPct;
      b.x = Math.max(rx, Math.min(100 - rx, nx));
      b.y = Math.max(ry, Math.min(100 - ry, ny));
      drag.didMove = true;
      var now = Date.now();
      drag.history.push({ x: b.x, y: b.y, t: now });
      // Keep only the last 100 ms for velocity sampling
      drag.history = drag.history.filter(function (h) { return now - h.t < 100; });
    }

    function onDragEnd() {
      if (!drag.bubble) return;
      var b = drag.bubble;

      if (drag.history.length >= 2) {
        var oldest = drag.history[0];
        var newest = drag.history[drag.history.length - 1];
        var dt = (newest.t - oldest.t) / 16;
        if (dt > 0) {
          b.vx = (newest.x - oldest.x) / dt;
          b.vy = (newest.y - oldest.y) / dt;
          // Cap throw speed
          var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          var maxSpeed = 0.6;
          if (speed > maxSpeed) {
            b.vx = b.vx / speed * maxSpeed;
            b.vy = b.vy / speed * maxSpeed;
          }
        } else {
          b.vx = 0; b.vy = 0;
        }
      }

      b.el.style.cursor = '';
      drag.bubble = null;
      drag.history = [];

      if (drag.didMove) {
        dragJustEnded = true;
        setTimeout(function () { dragJustEnded = false; }, 0);
      }
    }
    // ------------------------------------------------------------------------

    function tick() {
      var cw = network.offsetWidth, ch = network.offsetHeight;

      // Move — skip dragged bubble (drag handler owns its position)
      bubbles.forEach(function (b) {
        if (b === drag.bubble) return;
        b.x += b.vx;
        b.y += b.vy;
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
            // Dragged bubble acts as immovable; push the other fully
            if (a === drag.bubble) {
              b.x += nx * overlap * 2 / cw * 100;
              b.y += ny * overlap * 2 / ch * 100;
            } else if (b === drag.bubble) {
              a.x -= nx * overlap * 2 / cw * 100;
              a.y -= ny * overlap * 2 / ch * 100;
            } else {
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

  function initNodeLinks() {
    document.querySelectorAll('.network-node').forEach(function (node) {
      node.addEventListener('click', function () {
        if (dragJustEnded) return;
        document.getElementById('work').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

}());
