// Home hero: a curly-haired boy draws the practice diagram (Product design,
// UX, UI, Branding) on the chalkboard, stop-motion style. Every part is
// re-placed with a little jitter on each 12 fps frame and the chalk texture
// is swapped every other frame, so the drawing "boils" like redrawn frames.
// The markup it fills lives in the hero of index.html.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var FPS = 12, DT = 1 / FPS;
  var CHALK = '#F3F0E6';
  var FLOOR = 885;

  var svg   = document.querySelector('.chalk-scene');
  var art   = svg.querySelector('.chalk-art');
  var ledge = svg.querySelector('.chalk-ledge');
  var boyG  = svg.querySelector('.chalk-boy');
  var dustG = svg.querySelector('.chalk-dust');

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function jit(a) { return (Math.random() * 2 - 1) * a; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function f(n) { return Math.round(n * 10) / 10; }

  // Fixed shapes are generated from a seeded random, so the hand-drawn
  // wobble is the same on every visit.
  var seed = 11;
  function srand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  // ── The diagram ────────────────────────────────────────────────────────────
  var NODES = {
    pd: { cx: 470,  cy: 590, r: 165, label: 'Product design', size: 52 },
    ux: { cx: 1200, cy: 470, r: 100, label: 'UX',             size: 68 },
    ui: { cx: 1060, cy: 720, r: 92,  label: 'UI',             size: 64 },
    br: { cx: 790,  cy: 752, r: 78,  label: 'Branding',       size: 36 }
  };
  var LINKS = [['pd', 'ux'], ['pd', 'ui'], ['ux', 'ui'], ['pd', 'br'], ['ui', 'br']];

  function chalkPath(d, width) {
    var p = el('path', {
      d: d, fill: 'none', stroke: CHALK, 'stroke-width': width || 6,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.92
    }, art);
    p.len = p.getTotalLength();
    p.setAttribute('stroke-dasharray', p.len + ' ' + p.len);
    p.setAttribute('stroke-dashoffset', p.len);
    return p;
  }

  // A circle drawn by hand: starts upper-left, goes round clockwise and
  // overshoots its own start a little.
  function circleD(n) {
    var a0 = -2.4, sweep = Math.PI * 2 + 0.38, steps = 72;
    var ph = srand() * 6, pts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, a = a0 + sweep * t;
      var r = n.r * (1 + 0.022 * Math.sin(3 * a + ph) - 0.045 * t);
      pts.push(f(n.cx + Math.cos(a) * r) + ',' + f(n.cy + Math.sin(a) * r));
    }
    return 'M' + pts.join(' L');
  }

  function linkD(a, b) {
    var dx = b.cx - a.cx, dy = b.cy - a.cy, d = Math.hypot(dx, dy);
    var ux = dx / d, uy = dy / d;
    var sx = a.cx + ux * (a.r + 16), sy = a.cy + uy * (a.r + 16);
    var ex = b.cx - ux * (b.r + 16), ey = b.cy - uy * (b.r + 16);
    var bend = (srand() < 0.5 ? -1 : 1) * d * 0.04;
    var mx = (sx + ex) / 2 - uy * bend, my = (sy + ey) / 2 + ux * bend;
    return 'M' + f(sx) + ',' + f(sy) + ' Q' + f(mx) + ',' + f(my) + ' ' + f(ex) + ',' + f(ey);
  }

  var clipN = 0;
  function chalkLabel(n) {
    var id = 'lbl' + (clipN++);
    var cp = el('clipPath', { id: id }, svg.querySelector('defs'));
    var rect = el('rect', { x: 0, y: 0, width: 0, height: 0 }, cp);
    var t = el('text', {
      x: n.cx, y: n.cy + n.size * 0.32, 'text-anchor': 'middle',
      'font-family': 'Caveat, cursive', 'font-weight': 700, 'font-size': n.size,
      fill: CHALK, 'clip-path': 'url(#' + id + ')'
    }, art);
    t.textContent = n.label;
    return { text: t, rect: rect, box: null };
  }

  Object.keys(NODES).forEach(function (k) {
    var n = NODES[k];
    n.circle = chalkPath(circleD(n), 6);
    n.lbl = chalkLabel(n);
  });
  var linkPaths = LINKS.map(function (l) { return chalkPath(linkD(NODES[l[0]], NODES[l[1]]), 5); });

  // Little chalk sparkles for the finale.
  var sparkles = [[1360, 430, 1], [1580, 420, 0.8], [1575, 600, 0.65], [1365, 650, 0.55]].map(function (s) {
    var g = el('g', { transform: 'translate(' + s[0] + ',' + s[1] + ') scale(0)' }, art);
    el('path', { d: 'M0,-22 Q3,-3 22,0 Q3,3 0,22 Q-3,3 -22,0 Q-3,-3 0,-22Z', fill: CHALK, opacity: 0.9 }, g);
    return { g: g, x: s[0], y: s[1], s: s[2], on: false, age: 0 };
  });

  // The ledge runs far past the viewBox so it spans any screen width.
  el('rect', { x: -3000, y: 846, width: 7600, height: 26, fill: '#3A3B39' }, ledge);
  el('rect', { x: -3000, y: 846, width: 7600, height: 5, fill: '#5A5B58' }, ledge);
  el('rect', { x: -3000, y: 872, width: 7600, height: 40, fill: '#121312' }, ledge);
  // An eraser and two spare sticks of chalk on the ledge.
  el('rect', { x: 120, y: 820, width: 92, height: 28, rx: 4, fill: '#4A4B49' }, ledge);
  el('rect', { x: 120, y: 836, width: 92, height: 12, rx: 3, fill: '#CFCDC6' }, ledge);
  el('rect', { x: 236, y: 838, width: 46, height: 9, rx: 4, fill: CHALK }, ledge);
  el('rect', { x: 290, y: 836, width: 34, height: 9, rx: 4, fill: '#BDBBB4', transform: 'rotate(-6 307 840)' }, ledge);

  // ── The boy, in a few simple chalk strokes ─────────────────────────────────
  // One line per limb, an outlined body and head, and the curls as a single
  // looping stroke. No hatching, no double outlines.
  var BOARD = '#262726';
  var W = 5.5;
  function line(w, parent) {
    return el('path', { fill: 'none', stroke: CHALK, 'stroke-width': w || W, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  }
  function shape(tag, extra, parent) {
    var a = { fill: BOARD, stroke: CHALK, 'stroke-width': W, 'stroke-linejoin': 'round' };
    for (var x in extra) a[x] = extra[x];
    return el(tag, a, parent);
  }
  function hidden(tag) { return el(tag, { display: 'none' }, boyG); }

  var legR = line(W, boyG), legL = line(W, boyG);
  var shoeR = shape('path', {}, boyG);
  var shoeL = shape('path', {}, boyG);
  var neck  = hidden('rect');
  var torso = shape('path', {}, boyG);
  var hem   = hidden('path');
  var collar = line(4, boyG);
  var star  = hidden('path');

  var head = el('g', {}, boyG);
  var earL = shape('circle', { r: 12 }, head);
  var earR = shape('circle', { r: 12 }, head);
  shape('circle', { cx: 0, cy: 0, r: 60 }, head);
  var hairBack = el('g', {}, head);
  var hair = [];
  // Curls: a small circle rolling along an arc over the head (a trochoid),
  // which draws a row of loops in one go, the way you'd scribble curly hair.
  function curlRow(from, to, R, r, loops, dy) {
    var pts = [], n = loops * 14;
    for (var i = 0; i <= n; i++) {
      var t = i / n, a = from + (to - from) * t, s = t * loops * Math.PI * 2;
      var cx = Math.cos(a) * R, cy = Math.sin(a) * R + dy;
      pts.push(f(cx + Math.cos(a) * r * Math.cos(s) - Math.sin(a) * r * 0.9 * Math.sin(s)) + ',' +
               f(cy + Math.sin(a) * r * Math.cos(s) + Math.cos(a) * r * 0.9 * Math.sin(s)));
    }
    return 'M' + pts.join(' L');
  }
  shape('path', { d: curlRow(-Math.PI - 0.15, 0.15, 60, 13, 11, -6), 'stroke-width': 4.5 }, hairBack);
  shape('path', { d: curlRow(-2.75, -0.4, 40, 12, 6, -34), 'stroke-width': 4.5 }, hairBack);

  var face = el('g', {}, head);
  var browL = line(4, face), browR = line(4, face);
  var eyeL = el('ellipse', { rx: 5, ry: 7, fill: CHALK }, face);
  var eyeR = el('ellipse', { rx: 5, ry: 7, fill: CHALK }, face);
  var glintL = el('circle', { display: 'none' }, face);
  var glintR = el('circle', { display: 'none' }, face);
  var blushL = el('ellipse', { display: 'none' }, face);
  var blushR = el('ellipse', { display: 'none' }, face);
  var nose  = line(3.5, face);
  var mouth = shape('path', { 'stroke-width': 4.5 }, face);
  var tongue = el('ellipse', { display: 'none' }, face);

  function makeArm(withChalk) {
    var g = el('g', {}, boyG);
    var a = { upper: line(W, g), fore: line(W, g), sleeve: el('path', { display: 'none' }, g) };
    if (withChalk) a.chalk = el('path', { fill: 'none', stroke: CHALK, 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
    a.hand = shape('circle', { r: 11, 'stroke-width': 4.5 }, g);
    a.thumb = el('circle', { display: 'none' }, g);
    return a;
  }
  var armL = makeArm(false);   // his left: screen right
  var armR = makeArm(true);    // his right: screen left, holds the chalk

  // ── Dust ──────────────────────────────────────────────────────────────────
  var dust = [];
  for (var di = 0; di < 70; di++) dust.push({ el: el('circle', { r: 2, fill: CHALK, opacity: 0 }, dustG), life: 0 });
  function puff(x, y, n, spread) {
    for (var i = 0, c = 0; i < dust.length && c < n; i++) {
      var p = dust[i];
      if (p.life > 0) continue;
      p.x = x + jit(4); p.y = y + jit(4);
      p.vx = jit(spread || 40); p.vy = -Math.random() * (spread || 40) * 0.6;
      p.r = 1.5 + Math.random() * 2.2; p.life = 0.8 + Math.random() * 0.6; p.max = p.life;
      c++;
    }
  }

  // ── Puppet state and the arm solver ───────────────────────────────────────
  var L1 = 100, L2 = 96, REACH = L1 + L2;
  var S, C;

  function reset() {
    S = { bx: 1760, lift: 0, bob: 0, phase: 0, walking: 0, face: -14, look: { x: 0, y: 0 }, prevBx: 1760, blink: 0, t: 0 };
    C = { desiredBx: 1760, target: null, cheer: false, idle: false, armR: 'rest', armL: 'swing', extraLift: 0, faceOverride: null, wave: 0 };
    Object.keys(NODES).forEach(function (k) {
      var n = NODES[k];
      n.circle.setAttribute('stroke-dashoffset', n.circle.len);
      n.lbl.rect.setAttribute('width', 0);
    });
    linkPaths.forEach(function (p) { p.setAttribute('stroke-dashoffset', p.len); });
    sparkles.forEach(function (s) { s.on = false; s.age = 0; s.g.setAttribute('transform', 'translate(' + s.x + ',' + s.y + ') scale(0)'); });
    dust.forEach(function (p) { p.life = 0; p.el.setAttribute('opacity', 0); });
  }

  function bodyY() { return FLOOR - S.lift - S.bob; }
  function shoulderR() { return { x: S.bx - 56, y: bodyY() - 312 }; }
  function shoulderL() { return { x: S.bx + 56, y: bodyY() - 312 }; }

  // Two-bone IK. elbowSide picks which of the two solutions to keep.
  function solve(sh, t, elbowSide) {
    var dx = t.x - sh.x, dy = t.y - sh.y, d = Math.hypot(dx, dy) || 1;
    var dd = Math.min(d, REACH - 0.5);
    var hx = sh.x + dx / d * dd, hy = sh.y + dy / d * dd;
    var base = Math.atan2(dy, dx);
    var cosA = clamp((L1 * L1 + dd * dd - L2 * L2) / (2 * L1 * dd), -1, 1);
    var A = Math.acos(cosA);
    var e1 = { x: sh.x + Math.cos(base + A) * L1, y: sh.y + Math.sin(base + A) * L1 };
    var e2 = { x: sh.x + Math.cos(base - A) * L1, y: sh.y + Math.sin(base - A) * L1 };
    var e = elbowSide(e1, e2);
    return { e: e, h: { x: hx, y: hy } };
  }
  var elbowDown = function (a, b) { return a.y > b.y ? a : b; };
  var elbowOutL = function (a, b) { return a.x > b.x ? a : b; };
  var elbowOutR = function (a, b) { return a.x < b.x ? a : b; };

  function armTarget(side) {
    var sh = side === 'R' ? shoulderR() : shoulderL();
    var mode = side === 'R' ? C.armR : C.armL;
    var dir = side === 'R' ? -1 : 1;
    var swing = Math.sin(S.phase) * 26 * (side === 'R' ? 1 : -1) * S.walking;
    if (mode === 'target' && C.target) return C.target;
    if (mode === 'up')   return { x: sh.x + dir * 55, y: sh.y - 175 };
    if (mode === 'hip')  return { x: sh.x + dir * 20, y: sh.y + 125 };
    if (mode === 'wave') return { x: sh.x + dir * (70 + Math.sin(C.wave) * 38), y: sh.y - 150 };
    return { x: sh.x + dir * 28 + swing, y: sh.y + 186 };
  }

  // ── Physics, one stop-motion frame at a time ──────────────────────────────
  function step() {
    S.t += DT;

    // Walk toward where the action wants him.
    var maxStep = 42;
    S.bx += clamp(C.desiredBx - S.bx, -maxStep, maxStep);

    // Never let the chalk hand be out of reach sideways: shuffle over.
    if (C.armR === 'target' && C.target) {
      var dx = C.target.x - (S.bx - 56), lim = REACH * 0.86;
      if (dx < -lim) S.bx += dx + lim;
      if (dx > lim)  S.bx += dx - lim;
    }

    var moved = S.bx - S.prevBx;
    S.prevBx = S.bx;
    S.walking = clamp(Math.abs(moved) / 12, 0, 1);
    if (Math.abs(moved) > 0.5) S.phase += Math.abs(moved) / 34;
    S.bob = S.walking ? Math.abs(Math.sin(S.phase)) * 9 : (C.idle ? Math.max(0, Math.sin(S.t * 5)) * 4 : 0);

    // Too high to reach? Up on his toes, then a jump.
    var need = 0;
    if (C.armR === 'target' && C.target) {
      var shx = S.bx - 56, shy = FLOOR - 312;
      var hx = C.target.x - shx, r = REACH * 0.94;
      var up = shy - C.target.y - Math.sqrt(Math.max(r * r - hx * hx, 0));
      need = Math.max(0, up);
    }
    S.lift = lerp(S.lift, Math.min(need, 18), 0.65);  // tiptoes at most, never a jump
    if (S.lift < 0.5) S.lift = 0;

    // Where he looks: at the chalk while drawing, ahead while walking, at you otherwise.
    var hc = { x: S.bx, y: bodyY() - 398 };
    var look = C.armR === 'target' && C.target ? C.target
             : S.walking > 0.3 ? { x: S.bx + Math.sign(moved) * 300, y: hc.y + 40 }
             : { x: hc.x, y: hc.y + 300 };
    var lx = look.x - hc.x, ly = look.y - hc.y, ld = Math.hypot(lx, ly) || 1;
    S.look = { x: lx / ld, y: ly / ld };
    var faceGoal = C.faceOverride != null ? C.faceOverride : clamp(S.look.x * 22, -15, 15);
    S.face = lerp(S.face, faceGoal, 0.5);

    if (S.blink > 0) S.blink--;
    else if (Math.random() < 0.03) S.blink = 2;

    dust.forEach(function (p) {
      if (p.life <= 0) return;
      p.life -= DT; p.vy += 220 * DT; p.x += p.vx * DT; p.y += p.vy * DT;
    });
    sparkles.forEach(function (s) { if (s.on) s.age += DT; });
  }

  // ── Render: every part re-placed with a bit of hand jitter ────────────────
  var frame = 0;
  function render() {
    frame++;
    if (frame % 2 === 0) {
      art.setAttribute('filter', 'url(#chalk' + ((frame / 2) % 3) + ')');
      boyG.setAttribute('filter', 'url(#chalk' + ((frame / 2 + 1) % 3) + ')');
    }

    var J = 1.4;
    var by = bodyY(), bx = S.bx;
    var tuck = Math.min(S.lift * 0.4, 46);

    // Legs, with a knee that pops out when the leg is shortened by a jump.
    function leg(path, shoe, side, phaseOff) {
      var s = Math.sin(S.phase + phaseOff);
      var hip = { x: bx + side * 26 + jit(J), y: by - 172 + jit(J) };
      var footLift = S.walking ? Math.max(0, Math.cos(S.phase + phaseOff)) * 16 : 0;
      var foot = { x: bx + side * 38 + s * 24 * S.walking + jit(J), y: FLOOR - S.lift + tuck - footLift + jit(J) };
      if (S.lift > 0) foot.y = by - tuck + jit(J);
      var len = Math.hypot(foot.x - hip.x, foot.y - hip.y);
      var bend = Math.max(0, 172 - len) * 0.8 + 3;
      var knee = { x: (hip.x + foot.x) / 2 + side * bend, y: (hip.y + foot.y) / 2 };
      path.setAttribute('d', 'M' + f(hip.x) + ',' + f(hip.y) + ' L' + f(knee.x) + ',' + f(knee.y) + ' L' + f(foot.x) + ',' + f(foot.y));
      var fx = foot.x + side * 10, fy = foot.y + 12;
      shoe.setAttribute('d', 'M' + f(fx - 26) + ',' + f(fy) + ' Q' + f(fx - 24) + ',' + f(fy - 22) + ' ' + f(fx + side * 4) + ',' + f(fy - 20) +
        ' Q' + f(fx + side * 30) + ',' + f(fy - 14) + ' ' + f(fx + 26) + ',' + f(fy) + ' Z');
    }
    leg(legR, shoeR, -1, 0);
    leg(legL, shoeL, 1, Math.PI);

    neck.setAttribute('x', f(bx - 13 + jit(0.8)));
    neck.setAttribute('y', f(by - 352));

    var tj = function () { return jit(J); };
    torso.setAttribute('d',
      'M' + f(bx - 54 + tj()) + ',' + f(by - 318 + tj()) +
      ' Q' + f(bx) + ',' + f(by - 340 + tj()) + ' ' + f(bx + 54 + tj()) + ',' + f(by - 318 + tj()) +
      ' L' + f(bx + 48 + tj()) + ',' + f(by - 168 + tj()) +
      ' Q' + f(bx) + ',' + f(by - 158) + ' ' + f(bx - 48 + tj()) + ',' + f(by - 168 + tj()) + ' Z');
    hem.setAttribute('d', 'M' + f(bx - 44) + ',' + f(by - 172) + ' Q' + f(bx) + ',' + f(by - 164) + ' ' + f(bx + 44) + ',' + f(by - 172));
    collar.setAttribute('d', 'M' + f(bx - 18) + ',' + f(by - 330) + ' Q' + f(bx + S.face * 0.4) + ',' + f(by - 312) + ' ' + f(bx + 18) + ',' + f(by - 330));
    star.setAttribute('transform', 'translate(' + f(bx + 20 + S.face * 0.6 + jit(1)) + ',' + f(by - 268 + jit(1)) + ') rotate(' + f(jit(5)) + ')');

    // Head and face. A negative face value turns him three-quarters toward the board.
    var tilt = clamp(S.look.x * 8, -9, 9) + jit(1.5);
    head.setAttribute('transform', 'translate(' + f(bx + S.face * 0.3 + jit(1)) + ',' + f(by - 398 + jit(1)) + ') rotate(' + f(tilt) + ')');
    var fs = S.face, squeeze = 1 - Math.abs(fs) / 70;
    earL.setAttribute('cx', f(-58 - fs * 0.5)); earL.setAttribute('cy', 6);
    earR.setAttribute('cx', f(58 - fs * 0.5));  earR.setAttribute('cy', 6);
    earL.setAttribute('opacity', fs < -8 ? 0 : 1);
    earR.setAttribute('opacity', fs > 8 ? 0 : 1);
    hair.forEach(function (h) {
      var x = h.x + jit(1.1) - fs * 0.15, y = h.y + jit(1.1);
      h.c.setAttribute('cx', f(x)); h.c.setAttribute('cy', f(y));
      if (h.hlEl) h.hlEl.setAttribute('d', 'M' + f(x - h.r * 0.45) + ',' + f(y + h.r * 0.1) + ' a' + f(h.r * 0.45) + ',' + f(h.r * 0.45) + ' 0 1 1 ' + f(h.r * 0.5) + ',' + f(h.r * 0.35));
    });
    var ex = 21 * squeeze, gx = S.look.x * 3, gy = S.look.y * 3;
    var eyeY = 4 + gy;
    var ry = S.blink > 0 ? 1.5 : 9;
    [[eyeL, glintL, blushL, browL, -1], [eyeR, glintR, blushR, browR, 1]].forEach(function (p) {
      var x = fs + p[4] * ex + gx;
      p[0].setAttribute('cx', f(x)); p[0].setAttribute('cy', f(eyeY)); p[0].setAttribute('ry', ry);
      p[1].setAttribute('cx', f(x + 2)); p[1].setAttribute('cy', f(eyeY - 3)); p[1].setAttribute('opacity', S.blink > 0 ? 0 : 1);
      p[2].setAttribute('cx', f(fs + p[4] * (ex + 10))); p[2].setAttribute('cy', 26);
      p[3].setAttribute('d', 'M' + f(x - 9) + ',' + f(-14 + jit(1)) + ' Q' + f(x) + ',' + f(-24 + jit(1.5)) + ' ' + f(x + 9) + ',' + f(-15 + jit(1)));
    });
    nose.setAttribute('d', 'M' + f(fs * 1.25 - 3) + ',14 q4,5 8,0');
    var open = C.cheer ? 16 : 10;
    mouth.setAttribute('d', 'M' + f(fs - 20) + ',' + f(28 + jit(0.8)) + ' Q' + f(fs) + ',' + f(28 + open * 3) + ' ' + f(fs + 20) + ',' + f(28 + jit(0.8)) + ' Z');
    tongue.setAttribute('cx', f(fs + 2)); tongue.setAttribute('cy', f(28 + open * 1.7));

    // Arms.
    function arm(a, sh, t, side) {
      var s = solve({ x: sh.x + jit(1), y: sh.y + jit(1) }, t, side);
      var e = s.e, h = s.h;
      var ux = h.x - e.x, uy = h.y - e.y, ud = Math.hypot(ux, uy) || 1;
      ux /= ud; uy /= ud;
      var hand = a.chalk ? { x: h.x - ux * 13, y: h.y - uy * 13 } : h;
      a.upper.setAttribute('d', 'M' + f(sh.x) + ',' + f(sh.y) + ' L' + f(e.x) + ',' + f(e.y));
      a.sleeve.setAttribute('d', 'M' + f(sh.x) + ',' + f(sh.y) + ' L' + f(lerp(sh.x, e.x, 0.42)) + ',' + f(lerp(sh.y, e.y, 0.42)));
      a.fore.setAttribute('d', 'M' + f(e.x) + ',' + f(e.y) + ' L' + f(hand.x) + ',' + f(hand.y));
      a.hand.setAttribute('cx', f(hand.x)); a.hand.setAttribute('cy', f(hand.y));
      a.thumb.setAttribute('cx', f(hand.x - uy * 9)); a.thumb.setAttribute('cy', f(hand.y + ux * 9));
      if (a.chalk) a.chalk.setAttribute('d', 'M' + f(hand.x) + ',' + f(hand.y) + ' L' + f(h.x) + ',' + f(h.y));
    }
    arm(armR, shoulderR(), armTarget('R'), C.armR === 'target' ? elbowDown : elbowOutR);
    arm(armL, shoulderL(), armTarget('L'), elbowOutL);

    dust.forEach(function (p) {
      if (p.life <= 0) { p.el.setAttribute('opacity', 0); return; }
      p.el.setAttribute('cx', f(p.x)); p.el.setAttribute('cy', f(p.y)); p.el.setAttribute('r', f(p.r));
      p.el.setAttribute('opacity', f(0.8 * p.life / p.max));
    });
    sparkles.forEach(function (s) {
      if (!s.on) return;
      var k = s.age < 0.1 ? 0.5 : s.age < 0.2 ? 1.3 : 1 + (Math.floor(s.age * FPS) % 6 === 0 ? 0.15 : 0);
      s.g.setAttribute('transform', 'translate(' + s.x + ',' + s.y + ') scale(' + f(k * s.s) + ') rotate(' + f(jit(6)) + ')');
    });
  }

  // ── The script of the scene ───────────────────────────────────────────────
  function ease(p) { var s = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; return p * 0.55 + s * 0.45; }

  function wait(d) { return { dur: d }; }
  function walkTo(getX) {
    return {
      start: function () {
        var x = typeof getX === 'function' ? getX() : getX;
        C.desiredBx = x; C.armR = 'rest'; C.armL = 'swing'; C.target = null;
        this.dur = Math.max(0.3, Math.abs(x - S.bx) / 504);
      }
    };
  }
  function startOf(p) { var pt = p.getPointAtLength(0); return pt.x + 86; }
  function draw(p, d) {
    return {
      dur: d,
      start: function () { C.armR = 'target'; C.armL = 'hip'; },
      update: function (t) {
        var e = ease(t), at = p.len * e;
        p.setAttribute('stroke-dashoffset', f(p.len - at));
        var pt = p.getPointAtLength(at);
        C.target = { x: pt.x, y: pt.y };
        C.desiredBx = pt.x + 86;
        if (t < 1) puff(pt.x, pt.y, 2, 30);
      }
    };
  }
  function write(n, d) {
    return {
      dur: d,
      start: function () { C.armR = 'target'; C.armL = 'hip'; },
      update: function (t) {
        var b = n.lbl.box, w = b.width * t;
        n.lbl.rect.setAttribute('x', f(b.x - 6)); n.lbl.rect.setAttribute('y', f(b.y - 10));
        n.lbl.rect.setAttribute('height', f(b.height + 20)); n.lbl.rect.setAttribute('width', f(w + 6));
        var x = b.x + w, y = b.y + b.height * 0.55 + Math.sin(t * 38) * b.height * 0.22;
        C.target = { x: x, y: y };
        C.desiredBx = x + 86;
        if (t < 1) puff(x, y, 1, 24);
      }
    };
  }
  function hop(d, h) {
    return {
      dur: d,
      start: function () { C.armR = 'up'; C.armL = 'up'; C.target = null; C.cheer = true; },
      update: function () {},
      end: function () { C.extraLift = 0; C.armR = 'rest'; C.armL = 'swing'; C.cheer = false; }
    };
  }
  function call(fn) { return { dur: 0, start: fn }; }

  var actions = [];
  function build() {
    var n = NODES;
    actions = [
      wait(0.2),
      walkTo(function () { return startOf(n.pd.circle); }),
      draw(n.pd.circle, 1.6),
      write(n.pd, 1.1),
      hop(0.5, 60),
      walkTo(function () { return startOf(n.ux.circle); }),
      draw(n.ux.circle, 1.2),
      write(n.ux, 0.5),
      walkTo(function () { return startOf(n.ui.circle); }),
      draw(n.ui.circle, 1.0),
      write(n.ui, 0.5),
      walkTo(function () { return startOf(n.br.circle); }),
      draw(n.br.circle, 0.9),
      write(n.br, 0.7),
      hop(0.5, 60)
    ];
    linkPaths.forEach(function (p) {
      actions.push(walkTo(function () { return startOf(p); }));
      actions.push(draw(p, 0.45));
    });
    actions.push(
      walkTo(1470),
      { dur: 0.5, start: function () { C.faceOverride = 0; } },
      call(function () { puff(1470, 560, 26, 160); }),
      hop(0.55, 95),
      call(function () { sparkles[0].on = true; sparkles[1].on = true; puff(1470, 520, 20, 140); }),
      hop(0.55, 95),
      call(function () { sparkles[2].on = true; sparkles[3].on = true; }),
      {
        dur: Infinity,
        start: function () { C.idle = true; C.armL = 'hip'; },
        update: function (p, t) {
          var cyc = t % 7;
          if (cyc < 2.2) { C.armR = 'wave'; C.wave = t * 9; }
          else C.armR = 'rest';
        }
      }
    );
  }

  var ai = 0, at = 0, timer = null, playing = false;

  function tick() {
    var a = actions[ai];
    if (a) {
      if (at === 0 && a.start) a.start();
      at += DT;
      var p = a.dur === Infinity ? 0 : a.dur ? Math.min(at / a.dur, 1) : 1;
      if (a.update) a.update(p, at);
      if (a.dur !== Infinity && at >= a.dur) {
        if (a.end) a.end();
        ai++; at = 0;
      }
    }
    step();
  }

  function play() {
    if (timer) return;
    playing = true;
    timer = setInterval(function () { tick(); render(); }, 1000 / FPS);
    pauseBtn.textContent = 'Pause';
  }
  function pause() {
    clearInterval(timer); timer = null; playing = false;
    pauseBtn.textContent = 'Play';
  }

  var pauseBtn = document.querySelector('.chalk-pause');
  var replayBtn = document.querySelector('.chalk-replay');
  pauseBtn.addEventListener('click', function () { playing ? pause() : play(); });
  replayBtn.addEventListener('click', function () { reset(); build(); ai = 0; at = 0; play(); });

  // Reduced motion: skip straight to the finished board, still.
  function fastForward() {
    var guard = 0;
    while (actions[ai] && actions[ai].dur !== Infinity && guard++ < 5000) tick();
    for (var i = 0; i < 12; i++) step();
    C.armR = 'rest';
    dust.forEach(function (p) { p.life = 0; });
    sparkles.forEach(function (s) { s.age = 1; });
    render();
  }

  // Labels can only be measured once the chalk font is in.
  var fontReady = document.fonts && document.fonts.load ? document.fonts.load('700 52px Caveat') : Promise.resolve();
  fontReady.catch(function () {}).then(function () {
    Object.keys(NODES).forEach(function (k) { NODES[k].lbl.box = NODES[k].lbl.text.getBBox(); });
    reset(); build();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      fastForward(); pauseBtn.hidden = true; replayBtn.hidden = true;
    } else {
      render(); play();
    }
  });
})();
