// SVG drawings: the figure, rooms, compositions, angle and movement diagrams, chapter illustrations.
const F = 'var(--fig)', F2 = 'var(--fig-2)', INK = 'var(--ink)', L = 'var(--frame-line)', SIL = 'var(--silhouette)', ACC = 'var(--accent)';

function figure(x, o = {}) {
  const fill = o.fill || F, s = o.scale || 1, face = o.face || 0; // face: -1 left, 0 camera, 1 right, 'away' back to camera
  const away = face === 'away';
  const ex = face === 0 ? [-2.3, 2.3] : face < 0 ? [-3.4, 0.6] : [-0.6, 3.4];
  const legs = o.pose === 'sit'
    ? `<rect x="-12" y="46" width="24" height="10" rx="2" fill="${fill}"/><rect x="-11" y="55" width="7" height="27" fill="${fill}"/><rect x="4" y="55" width="7" height="27" fill="${fill}"/><ellipse cx="-7.5" cy="83" rx="5" ry="1.6" fill="${fill}"/><ellipse cx="7.5" cy="83" rx="5" ry="1.6" fill="${fill}"/>`
    : `<rect x="-8.6" y="46" width="7.6" height="52" fill="${fill}"/><rect x="1" y="46" width="7.6" height="52" fill="${fill}"/><ellipse cx="-5" cy="99" rx="5" ry="1.6" fill="${fill}"/><ellipse cx="5" cy="99" rx="5" ry="1.6" fill="${fill}"/>`;
  return `<g transform="translate(${x} 0) scale(${s})">
    <rect x="-1.6" y="13" width="3.2" height="5" fill="${fill}"/>
    <path d="M-11 18 H11 L9.2 47 H-9.2 Z" fill="${fill}"/>
    <path d="M-11.5 18 L-13.5 46" stroke="${fill}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M11.5 18 L13.5 46" stroke="${fill}" stroke-width="3.6" stroke-linecap="round"/>
    ${legs}
    <circle cx="0" cy="8" r="6.6" fill="${fill}"/>
    ${away ? `<path d="M-6.6 8 A6.6 6.6 0 0 1 6.6 8 L6.6 10 Q0 13 -6.6 10 Z" fill="${INK}" opacity=".45"/>` : ''}
    ${o.noFace || away ? '' : `<circle cx="${ex[0]}" cy="7.2" r=".75" fill="${INK}"/><circle cx="${ex[1]}" cy="7.2" r=".75" fill="${INK}"/><path d="M-1.6 11 Q0 12 1.6 11" stroke="${INK}" stroke-width=".5" fill="none"/>`}
    ${o.initial ? `<text x="0" y="33" font-size="9" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="700" fill="var(--bg)" opacity=".9">${esc(o.initial)}</text>` : ''}
  </g>`;
}
function room() {
  return `<g stroke="${L}" stroke-width=".6" fill="none">
    <line x1="-400" y1="100" x2="400" y2="100"/>
    <rect x="42" y="28" width="26" height="72"/><line x1="46" y1="64" x2="50" y2="64"/>
    <rect x="-70" y="22" width="22" height="16"/>
    <line x1="-400" y1="-20" x2="400" y2="-20" stroke-dasharray="1 3"/>
  </g>`;
}
function frame(crop, inner, opts = {}) {
  const h = crop.h, w = h * 16 / 9, x = (crop.cx || 0) - w / 2, y = crop.cy - h / 2;
  return `<svg class="frame" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <rect x="${x - 1}" y="${y - 1}" width="${w + 2}" height="${h + 2}" fill="var(--frame-bg)"/>
    ${opts.rotate ? `<g transform="rotate(${opts.rotate} ${x + w / 2} ${y + h / 2})">` : ''}${inner}${opts.rotate ? '</g>' : ''}
    ${opts.overlay || ''}
  </svg>`;
}
// compositions for framings, drawn in figure space, cropped by size
function composition(framingId, sizeId) {
  const crop = { ...(SIZE[sizeId] || SIZE.MS).crop };
  if (sizeId === 'EST') framingId = 'establishing';
  switch (framingId) {
    case 'two': {
      const c = { ...crop, h: crop.h * 1.15 };
      return frame(c, room() + figure(-16, { face: 1 }) + figure(16, { face: -1 }));
    }
    case 'group': {
      const c = { ...crop, h: Math.max(crop.h, 60) * 1.2 };
      return frame(c, room() + figure(-26, { face: 1, scale: .95 }) + figure(0) + figure(26, { face: -1, scale: .95 }));
    }
    case 'ots': {
      const c = { ...crop, cx: 8 };
      // foreground person, back to camera: a large head, an ear, and a shoulder line that runs off the left edge
      // head seen from behind, then a neck, then a shoulder that runs off the left edge of the frame
      const sil = `<g fill="${SIL}" stroke="${L}" stroke-width=".7" stroke-linejoin="round">
        <path d="M-90 46 Q-60 33 -30 32 Q-12 32 -2 40 L1 60 L1 220 L-90 220 Z"/>
        <rect x="-17" y="24" width="9" height="10"/>
        <circle cx="-12.5" cy="13" r="13.5"/>
        <path d="M-26 7 Q-20 -3 -8 -0.5 Q2 2 0.5 10" fill="none" stroke="${F2}" stroke-width=".8"/>
      </g>
      <ellipse cx="0" cy="14" rx="2.4" ry="3.8" fill="${SIL}" stroke="${F2}" stroke-width=".9"/>
      <path d="M-.6 12 Q1.2 14 -.6 16" fill="none" stroke="${F2}" stroke-width=".6"/>`;
      return frame(c, room() + figure(17, { face: -1, scale: .88 }) + sil);
    }
    case 'establishing': {
      const c = { cy: 52, h: 130 };
      const bld = `<g stroke="${L}" stroke-width=".8" fill="none">
        <rect x="-64" y="22" width="128" height="78"/>
        ${[0, 1, 2, 3].map(i => [0, 1].map(j => `<rect x="${-54 + i * 32}" y="${30 + j * 26}" width="14" height="14" fill="${F2}" opacity=".45"/>`).join('')).join('')}
        <rect x="-8" y="76" width="16" height="24"/>
        <line x1="-400" y1="100" x2="400" y2="100"/>
        <path d="M-120 100 L-120 70 Q-134 66 -130 54 Q-124 44 -114 50 Q-104 44 -106 58 Q-100 68 -120 70" fill="${F2}" opacity=".5"/>
        <circle cx="90" cy="-8" r="6" fill="${F2}" opacity=".6"/></g>`;
      return frame(c, bld + figure(0, { scale: .24, noFace: true }).replace('scale(0.24)', 'translate(0 76) scale(0.24)'));
    }
    case 'pov': {
      const c = { cy: 40, h: 54 };
      const floor = `<line x1="-400" y1="100" x2="400" y2="100" stroke="${L}" stroke-width=".6"/>`;
      const door = `<g stroke="${L}" stroke-width=".8" fill="none"><rect x="-22" y="0" width="44" height="100"/><circle cx="14" cy="52" r="2.2"/></g>`;
      const hand = `<path d="M10 70 Q12 58 17 54 Q19 52 20 55 L19 62 Q22 60 23 63 L20 68 Q24 72 26 80 L28 100 L6 100 Q4 84 10 70 Z" fill="${F}"/>`;
      return frame(c, floor + door + hand);
    }
    case 'insert': {
      const c = { cy: 50, h: 58 };
      const phone = `<g><rect x="-18" y="27" width="36" height="46" rx="3.5" fill="${INK}"/><rect x="-15.5" y="30" width="31" height="40" rx="1.5" fill="var(--frame-bg)"/>
        <text x="0" y="53" font-size="7.5" text-anchor="middle" font-family="Courier Prime, monospace" fill="${INK}" textLength="22" lengthAdjust="spacingAndGlyphs">11:58</text>
        <text x="0" y="61" font-size="3.2" text-anchor="middle" font-family="Barlow Condensed, sans-serif" fill="${F2}" letter-spacing=".3">TUESDAY</text></g>`;
      const hand = `<path d="M-40 100 L-40 60 Q-40 44 -28 46 L-21 58 L-21 100 Z" fill="${F}"/><path d="M21 100 L21 58 L28 46 Q40 44 40 60 L40 100 Z" fill="${F}"/>`;
      return frame(c, hand + phone);
    }
    default:
      return frame(crop, room() + figure(0));
  }
}
function ruleDrawing(id) {
  const crop = SIZE.MS.crop;
  if (id === 'thirds') {
    const h = crop.h, w = h * 16 / 9;
    // place the eyes (y 7.2) on the upper third line and the figure on the left vertical line
    const c = { cy: 7.2 + h / 6, cx: w / 6, h };
    const x = c.cx - w / 2, y = c.cy - h / 2;
    const ov = `<g stroke="${ACC}" stroke-width=".7" fill="none" stroke-dasharray="2 2">
      <line x1="${x + w / 3}" y1="${y}" x2="${x + w / 3}" y2="${y + h}"/><line x1="${x + 2 * w / 3}" y1="${y}" x2="${x + 2 * w / 3}" y2="${y + h}"/>
      <line x1="${x}" y1="${y + h / 3}" x2="${x + w}" y2="${y + h / 3}"/><line x1="${x}" y1="${y + 2 * h / 3}" x2="${x + w}" y2="${y + 2 * h / 3}"/></g>
      <circle cx="${x + w / 3}" cy="${y + h / 3}" r="2.4" fill="none" stroke="${ACC}" stroke-width="1"/>`;
    return frame(c, room() + figure(0, { face: 1 }), { overlay: ov });
  }
  if (id === 'headroom') {
    const h = crop.h, w = h * 16 / 9, c = { cy: 24, h }, y = c.cy - h / 2;
    const ov = `<g stroke="${ACC}" stroke-width=".8" fill="none"><line x1="20" y1="${y + 1}" x2="20" y2="1.4"/><line x1="17" y1="${y + 1}" x2="23" y2="${y + 1}"/><line x1="17" y1="1.4" x2="23" y2="1.4"/></g>`;
    return frame(c, room() + figure(0), { overlay: ov });
  }
  const h = crop.h, w = h * 16 / 9, c = { cy: 24, cx: -w / 4 + 4, h };
  const ov = `<g stroke="${ACC}" stroke-width=".8" fill="none"><path d="M-12 30 H${c.cx + w / 2 - 6}" marker-end="url(#ar)"/></g><defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${ACC}"/></marker></defs>`;
  return frame(c, room() + figure(0, { face: 1 }), { overlay: ov });
}
// side-view camera facing right, origin at lens centre
function camSide(x, y, rot = 0, ghost = false) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})" fill="${ghost ? F2 : INK}" opacity="${ghost ? '.55' : '1'}"><rect x="-19" y="-5" width="14" height="10" rx="1.2"/><rect x="-5" y="-2.5" width="5" height="5"/><rect x="-17" y="-8" width="6" height="3"/></g>`;
}
function tripod(x, yTop, yFloor) {
  return `<g stroke="${INK}" stroke-width="1" fill="none"><line x1="${x}" y1="${yTop}" x2="${x}" y2="${yTop + (yFloor - yTop) * .35}"/><line x1="${x}" y1="${yTop + (yFloor - yTop) * .35}" x2="${x - 7}" y2="${yFloor}"/><line x1="${x}" y1="${yTop + (yFloor - yTop) * .35}" x2="${x + 7}" y2="${yFloor}"/></g>`;
}
function sideFigure(x, headY, floorY) {
  return `<g fill="${F}"><circle cx="${x}" cy="${headY}" r="6"/><path d="M${x - 4} ${headY + 7} H${x + 4} L${x + 3} ${headY + 34} H${x - 3} Z"/><line x1="${x - 1}" y1="${headY + 34}" x2="${x - 4}" y2="${floorY}" stroke="${F}" stroke-width="3.2"/><line x1="${x + 1}" y1="${headY + 34}" x2="${x + 4}" y2="${floorY}" stroke="${F}" stroke-width="3.2"/></g>`;
}
function sight(x1, y1, x2, y2) { return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ACC}" stroke-width=".9" stroke-dasharray="2 2"/>`; }
function svgBox(inner) { return `<svg class="frame" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><rect width="160" height="90" fill="var(--frame-bg)"/>${inner}</svg>`; }
function angleDrawing(id) {
  const floor = `<line x1="0" y1="80" x2="160" y2="80" stroke="${L}" stroke-width=".8"/>`;
  const fig = sideFigure(112, 30, 80);
  switch (id) {
    case 'eye': return svgBox(floor + fig + camSide(40, 30) + tripod(28, 35, 80) + sight(40, 30, 106, 30));
    case 'low': return svgBox(floor + fig + camSide(40, 66, -28) + tripod(30, 70, 80) + sight(42, 65, 106, 31));
    case 'high': return svgBox(floor + fig + camSide(40, 8, 24) + tripod(28, 12, 80) + sight(42, 9, 106, 29));
    case 'birds': return svgBox(floor + fig + camSide(112, 6, 90) + sight(112, 10, 112, 23));
    case 'worms': return svgBox(floor + fig + camSide(60, 76, -90) + sight(60, 71, 108, 34));
    case 'dutch': {
      const inner = `<g transform="rotate(-14 80 45)"><line x1="-40" y1="70" x2="200" y2="70" stroke="${L}" stroke-width=".8"/><rect x="100" y="22" width="18" height="48" fill="none" stroke="${L}" stroke-width=".6"/><g transform="translate(70 12) scale(.62)">${figure(0)}</g></g><line x1="0" y1="70" x2="160" y2="70" stroke="${ACC}" stroke-width=".7" stroke-dasharray="2 2"/>`;
      return svgBox(inner);
    }
  }
}
// top-down camera facing right, origin at lens centre
function camTop(x, y, rot = 0, ghost = false) {
  const fill = ghost ? F2 : INK, op = ghost ? '.55' : '1';
  return `<g transform="translate(${x} ${y}) rotate(${rot})" fill="${fill}" opacity="${op}"><rect x="-21" y="-6" width="16" height="12" rx="1.2"/><rect x="-5" y="-3" width="5" height="6"/></g>`;
}
function subjectTop(x, y) { return `<g fill="${F}"><circle cx="${x}" cy="${y}" r="8"/><path d="M${x - 8} ${y - 3} L${x - 12} ${y} L${x - 8} ${y + 3} Z"/></g>`; }
const ARROW = `<defs><marker id="am" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${ACC}"/></marker></defs>`;
function arrow(d) { return `<path d="${d}" fill="none" stroke="${ACC}" stroke-width="1.4" marker-end="url(#am)"/>`; }
function moveDrawing(id) {
  const subj = subjectTop(122, 45);
  switch (id) {
    case 'static': return svgBox(ARROW + subj + camTop(50, 45) + `<g stroke="${INK}" stroke-width="1"><line x1="37" y1="51" x2="30" y2="66"/><line x1="37" y1="51" x2="44" y2="66"/><line x1="37" y1="51" x2="37" y2="64"/></g>`);
    case 'pan': return svgBox(ARROW + subj + camTop(50, 45) + arrow('M60 26 A26 26 0 0 1 60 64') + `<circle cx="37" cy="45" r="1.6" fill="${ACC}"/>`);
    case 'tilt': return svgBox(ARROW + `<line x1="0" y1="80" x2="160" y2="80" stroke="${L}" stroke-width=".8"/>` + sideFigure(120, 30, 80) + camSide(48, 42) + tripod(36, 47, 80) + arrow('M64 24 A24 24 0 0 1 64 60') + `<circle cx="42" cy="42" r="1.6" fill="${ACC}"/>`);
    case 'push': return svgBox(ARROW + subj + camTop(34, 45, 0, true) + camTop(64, 45) + arrow('M70 60 H96'));
    case 'pull': return svgBox(ARROW + subj + camTop(70, 45, 0, true) + camTop(40, 45) + arrow('M60 60 H30'));
    case 'truck': return svgBox(ARROW + subjectTop(122, 24) + `<path d="M122 24 V70" stroke="${F2}" stroke-width="1" stroke-dasharray="2 2"/>` + camTop(50, 20, 0, true) + camTop(50, 45) + arrow('M28 30 V70') + arrow('M134 30 V70'));
    case 'arc': return svgBox(ARROW + subjectTop(96, 45) + `<circle cx="96" cy="45" r="34" fill="none" stroke="${F2}" stroke-width="1" stroke-dasharray="2 3"/>` + camTop(62, 45) + camTop(72, 72, -55, true) + arrow('M56 60 A40 40 0 0 0 78 80'));
    case 'pedestal': return svgBox(ARROW + `<line x1="0" y1="80" x2="160" y2="80" stroke="${L}" stroke-width=".8"/>` + sideFigure(120, 30, 80) + camSide(48, 58, 0) + camSide(48, 28, 0, true) + tripod(36, 63, 80) + arrow('M20 66 V20'));
    case 'zoom': return svgBox(ARROW + subj + camTop(44, 45) + `<path d="M44 45 L150 6 M44 45 L150 84" stroke="${F2}" stroke-width=".8"/><path d="M44 45 L150 30 M44 45 L150 60" stroke="${ACC}" stroke-width="1"/>` + arrow('M120 14 V26') + arrow('M120 76 V64'));
    case 'handheld': return svgBox(ARROW + subj + camTop(56, 45, -4) + `<path d="M6 48 Q14 40 22 47 T38 46" stroke="${ACC}" stroke-width="1.4" fill="none"/><path d="M50 30 l2 -3 M56 29 l0 -4 M62 30 l-2 -3" stroke="${ACC}" stroke-width="1" fill="none"/>`);
    case 'whip': return svgBox(ARROW + subj + camTop(50, 45, -30) + arrow('M52 14 A34 34 0 0 1 74 66') + `<g stroke="${ACC}" stroke-width=".8" opacity=".6"><path d="M60 20 A30 30 0 0 1 80 60"/><path d="M68 26 A26 26 0 0 1 84 54"/></g>`);
  }
}
function coverageDrawing() {
  const inner = `${ARROW}<line x1="16" y1="45" x2="144" y2="45" stroke="${ACC}" stroke-width="1" stroke-dasharray="3 3"/>
    <g fill="${F}"><circle cx="58" cy="45" r="8"/><path d="M66 42 L70 45 L66 48 Z"/></g>
    <g fill="${F}"><circle cx="102" cy="45" r="8"/><path d="M94 42 L90 45 L94 48 Z"/></g>
    <text x="58" y="48" font-size="7" text-anchor="middle" font-family="Barlow Condensed, sans-serif" fill="var(--bg)">A</text>
    <text x="102" y="48" font-size="7" text-anchor="middle" font-family="Barlow Condensed, sans-serif" fill="var(--bg)">B</text>
    ${camTop(80, 82, -90)}${camTop(40, 74, -50)}${camTop(120, 74, -130)}
    <path d="M20 45 A60 60 0 0 0 140 45" fill="none" stroke="${L}" stroke-width=".8"/>
    <text x="80" y="20" font-size="7" text-anchor="middle" font-family="Barlow Condensed, sans-serif" fill="var(--muted)" letter-spacing=".5">NO CAMERA ON THIS SIDE</text>`;
  return svgBox(inner);
}
function lensDrawing(idx) {
  const li = LENS_INFO[idx], crop = SIZE.MS.crop, s = li.bg, op = [1, .9, .6, .4][idx];
  // the person stays the same size. The wall behind scales about the horizon (eye level), so a long lens pulls it
  // forward and drops the floor out of frame; a wide lens pushes it back and shows more floor. It also softens.
  const panels = []; for (let x = -240; x <= 240; x += 14) panels.push(`<line x1="${x}" y1="-60" x2="${x}" y2="100"/>`);
  const bg = `<g transform="translate(0 8) scale(${s}) translate(0 -8)" stroke="${L}" stroke-width="${(.7 / s).toFixed(2)}" fill="none" opacity="${op}">
    ${panels.join('')}
    <line x1="-400" y1="100" x2="400" y2="100" stroke-width="${(1 / s).toFixed(2)}"/>
    <rect x="-46" y="16" width="20" height="24" fill="var(--frame-bg)"/><line x1="-36" y1="16" x2="-36" y2="40"/>
    <rect x="22" y="22" width="14" height="78" fill="var(--frame-bg)"/><circle cx="33" cy="62" r="1.2"/></g>`;
  const fig = `<g transform="scale(${li.stretch} 1)">${figure(0)}</g>`;
  return frame(crop, bg + fig);
}
function cutRuleDrawing(id) {
  if (id === 'line') return coverageDrawing();
  if (id === 'thirty') {
    return svgBox(ARROW + subjectTop(110, 45) + `<circle cx="110" cy="45" r="60" fill="none" stroke="${F2}" stroke-width=".8" stroke-dasharray="2 3"/>` +
      `<path d="M110 45 L50 45 M110 45 L58 15" stroke="${ACC}" stroke-width=".8" stroke-dasharray="2 2"/>` + camTop(56, 45) + camTop(64, 17, 30) +
      `<path d="M72 45 A38 38 0 0 1 77 26" fill="none" stroke="${ACC}" stroke-width="1.2"/><text x="82" y="40" font-size="8" font-family="Barlow Condensed, sans-serif" fill="${ACC}" font-weight="700">30°+</text>`);
  }
  if (id === 'eyeline') {
    const f = (x, face) => `<g transform="translate(${x} 10) scale(.5)">${figure(0, { face })}</g>`;
    return svgBox(`<rect x="6" y="14" width="68" height="62" fill="none" stroke="${L}" stroke-width=".8"/><rect x="86" y="14" width="68" height="62" fill="none" stroke="${L}" stroke-width=".8"/>` +
      f(46, -1) + f(114, 1) + `<path d="M34 24 H16" stroke="${ACC}" stroke-width="1.2" marker-end="url(#am)"/><path d="M126 24 H144" stroke="${ACC}" stroke-width="1.2" marker-end="url(#am)"/>` + ARROW +
      `<text x="40" y="84" font-size="7" text-anchor="middle" font-family="Barlow Condensed, sans-serif" fill="var(--muted)" letter-spacing=".5">A LOOKS LEFT</text><text x="120" y="84" font-size="7" text-anchor="middle" font-family="Barlow Condensed, sans-serif" fill="var(--muted)" letter-spacing=".5">B LOOKS RIGHT</text>`);
  }
  // cut on action: same door, two sizes, the hand mid-reach in both
  const door = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="${L}" stroke-width="${(1 / s).toFixed(2)}" fill="none"><rect x="0" y="0" width="40" height="60"/><circle cx="32" cy="32" r="2.5"/></g>`;
  const hand = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 30 Q4 22 10 20 Q14 19 15 22 L14 26 Q17 25 17 28 L15 31 Q18 34 19 40 L19 60 L2 60 Q-2 46 0 30 Z" fill="${F}"/>`;
  return svgBox(`<defs><clipPath id="cA"><rect x="6" y="14" width="68" height="62"/></clipPath><clipPath id="cB"><rect x="86" y="14" width="68" height="62"/></clipPath></defs>` +
    `<rect x="6" y="14" width="68" height="62" fill="none" stroke="${L}" stroke-width=".8"/><rect x="86" y="14" width="68" height="62" fill="none" stroke="${L}" stroke-width=".8"/>` +
    `<g clip-path="url(#cA)">${door(24, 18, .9)}${hand(30, 22, .9)}</g>` +
    `<g clip-path="url(#cB)">${door(60, -40, 2.2)}${hand(92, 2, 1.7)}</g>` +
    `<path d="M76 45 H84" stroke="${ACC}" stroke-width="1.2" marker-end="url(#am)"/>` + ARROW +
    `<text x="40" y="84" font-size="7" text-anchor="middle" font-family="Barlow Condensed, sans-serif" fill="var(--muted)" letter-spacing=".5">WIDE, MID-REACH</text><text x="120" y="84" font-size="7" text-anchor="middle" font-family="Barlow Condensed, sans-serif" fill="var(--muted)" letter-spacing=".5">CLOSE, SAME MOMENT</text>`);
}
function exposureDrawing(id) {
  const lbl = (x, y, t, anchor = 'middle') => `<text x="${x}" y="${y}" font-size="7" text-anchor="${anchor}" font-family="Barlow Condensed, sans-serif" fill="var(--muted)" letter-spacing=".5">${t}</text>`;
  const smallFig = (x, y, s = .5, extra = '') => `<g transform="translate(${x} ${y}) scale(${s})">${figure(0, { noFace: true })}${extra}</g>`;
  const twoFrames = `<rect x="6" y="14" width="68" height="62" fill="none" stroke="${L}" stroke-width=".8"/><rect x="86" y="14" width="68" height="62" fill="none" stroke="${L}" stroke-width=".8"/>`;
  switch (id) {
    case 'shutter': {
      // a rotary shutter: half the disc open (180 degrees), plus the frame rate arithmetic
      return svgBox(`<circle cx="46" cy="45" r="28" fill="${F2}" opacity=".35"/><path d="M46 45 L46 17 A28 28 0 0 1 46 73 Z" fill="${INK}"/>
        <circle cx="46" cy="45" r="28" fill="none" stroke="${INK}" stroke-width="1"/><circle cx="46" cy="45" r="2" fill="${ACC}"/>
        <path d="M46 45 L46 17 M46 45 L46 73" stroke="${ACC}" stroke-width="1"/>
        <text x="92" y="36" font-size="13" font-family="Barlow Condensed, sans-serif" font-weight="700" fill="${INK}">24 fps</text>
        <text x="92" y="54" font-size="13" font-family="Barlow Condensed, sans-serif" font-weight="700" fill="${ACC}">1/48 s</text>
        ${lbl(92, 68, 'SHUTTER = 2 × FPS', 'start')}${lbl(46, 84, '180° OPEN')}`);
    }
    case 'iso': {
      let dots = ''; let seed = 7;
      const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (let i = 0; i < 260; i++) dots += `<circle cx="${(86 + rnd() * 68).toFixed(1)}" cy="${(14 + rnd() * 62).toFixed(1)}" r=".7" fill="${rnd() > .5 ? INK : 'var(--bg)'}" opacity=".8"/>`;
      return svgBox(twoFrames + `<rect x="86" y="14" width="68" height="62" fill="${INK}" opacity=".18"/>` + smallFig(40, 18, .55) + smallFig(120, 18, .55) + dots + lbl(40, 84, 'ISO 100, CLEAN') + lbl(120, 84, 'ISO 1600, NOISE'));
    }
    case 'nd': {
      const rays = (x1, n, op) => Array.from({ length: n }, (_, i) => `<line x1="${x1}" y1="${18 + i * 9}" x2="${x1 + 34}" y2="${18 + i * 9}" stroke="${ACC}" stroke-width="1.2" opacity="${op}"/>`).join('');
      return svgBox(`<circle cx="22" cy="45" r="11" fill="${ACC}"/>` + rays(40, 7, 1) + `<rect x="78" y="10" width="8" height="70" rx="2" fill="${INK}" opacity=".75"/>` + rays(92, 7, .3) +
        `<g transform="translate(134 45) rotate(180)">${camTop(0, 0)}</g>` + lbl(82, 7, 'ND FILTER') + lbl(22, 68, 'DAYLIGHT') + lbl(109, 88, 'LESS LIGHT, SAME SHUTTER'));
    }
    case 'wb': {
      return svgBox(twoFrames + `<rect x="6" y="14" width="68" height="62" fill="#E0962A" opacity=".28"/><rect x="86" y="14" width="68" height="62" fill="#3B7BD9" opacity=".28"/>` +
        smallFig(40, 18, .55) + smallFig(120, 18, .55) + lbl(40, 84, 'LAMP: ORANGE') + lbl(120, 84, 'WINDOW: BLUE'));
    }
    case 'lock': {
      const bar = (y, t, v) => `<rect x="72" y="${y}" width="50" height="4" rx="2" fill="${F2}" opacity=".5"/><rect x="72" y="${y}" width="${v}" height="4" rx="2" fill="${ACC}"/>${lbl(68, y + 4.5, t, 'end')}<path d="M126 ${y - 1} h4 v6 h-4 z M127 ${y - 1} v-2 a1 1 0 0 1 2 0 v2" fill="${INK}" stroke="${INK}" stroke-width=".6"/>`;
      return svgBox(`<rect x="20" y="8" width="120" height="74" rx="6" fill="none" stroke="${INK}" stroke-width="1.2"/>` + bar(26, 'SHUTTER 1/50', 30) + bar(40, 'ISO 200', 18) + bar(54, 'WB 3200K', 40) + bar(68, 'FOCUS', 44));
    }
  }
}
function lamp(x, y, r, op = .9) { return `<circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="${ACC}" opacity=".12"/><circle cx="${x}" cy="${y}" r="${r}" fill="${ACC}" opacity="${op}"/>`; }
function cone(x, y, tx, ty, w, op = .18) {
  const dx = tx - x, dy = ty - y, len = Math.hypot(dx, dy), nx = -dy / len * w, ny = dx / len * w;
  return `<path d="M${x} ${y} L${tx + nx} ${ty + ny} L${tx - nx} ${ty - ny} Z" fill="${ACC}" opacity="${op}"/>`;
}
function lightDrawing(id) {
  const lbl = (x, y, t, anchor = 'middle') => `<text x="${x}" y="${y}" font-size="7" text-anchor="${anchor}" font-family="Barlow Condensed, sans-serif" fill="var(--muted)" letter-spacing=".5">${t}</text>`;
  const twoFrames = `<rect x="6" y="14" width="68" height="62" fill="none" stroke="${L}" stroke-width=".8"/><rect x="86" y="14" width="68" height="62" fill="none" stroke="${L}" stroke-width=".8"/>`;
  const head = (cx, cy, r, shadowOp) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${F}"/><path d="M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r} Z" fill="${INK}" opacity="${shadowOp}"/>`;
  switch (id) {
    case 'window':
      return svgBox(`<line x1="0" y1="12" x2="160" y2="12" stroke="${L}" stroke-width="1.2"/><rect x="18" y="9" width="40" height="6" fill="${ACC}" opacity=".9"/>` +
        cone(38, 12, 100, 48, 30, .14) + subjectTop(100, 48) + camTop(100, 84, -90) + lbl(38, 24, 'WINDOW') + lbl(126, 60, '45° TO ONE SIDE'));
    case 'three':
      return svgBox(subjectTop(84, 44) + cone(40, 78, 84, 44, 14, .16) + lamp(40, 78, 5) + cone(132, 74, 84, 44, 10, .07) + lamp(132, 74, 3.5, .5) + cone(120, 14, 84, 44, 8, .1) + lamp(120, 14, 3.5, .8) +
        camTop(84, 86, -90) + lbl(40, 70, 'KEY') + lbl(132, 66, 'FILL') + lbl(120, 8, 'BACK'));
    case 'soft':
      return svgBox(twoFrames + `<defs><radialGradient id="sg"><stop offset="0" stop-color="${INK}" stop-opacity=".5"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient></defs>` +
        `<ellipse cx="46" cy="60" rx="18" ry="5" fill="${INK}" opacity=".55"/><circle cx="40" cy="42" r="14" fill="${F}"/><path d="M40 28 A14 14 0 0 1 40 56 Z" fill="${INK}" opacity=".5"/>` +
        `<ellipse cx="126" cy="60" rx="26" ry="8" fill="url(#sg)"/><circle cx="120" cy="42" r="14" fill="${F}"/><path d="M120 28 A14 14 0 0 1 120 56 Z" fill="${INK}" opacity=".18"/>` +
        lamp(14, 20, 2.5) + `<rect x="96" y="12" width="40" height="4" fill="${ACC}" opacity=".7"/>` + lbl(40, 84, 'SMALL LIGHT: HARD') + lbl(120, 84, 'BIG LIGHT: SOFT'));
    case 'practical': {
      const fig = `<g transform="translate(100 12) scale(.62)">${figure(0)}<path d="M-6.6 1.4 A6.6 6.6 0 0 0 -6.6 14.6 L-1 14.6 L-1 1.4 Z" fill="var(--bg)" opacity=".35"/></g>`;
      return svgBox(`<rect x="6" y="6" width="148" height="78" fill="none" stroke="${L}" stroke-width=".8"/><line x1="6" y1="74" x2="154" y2="74" stroke="${L}" stroke-width=".8"/>` +
        `<path d="M36 74 V40 M28 40 H44" stroke="${INK}" stroke-width="1.4"/><path d="M22 40 L30 22 H46 L52 40 Z" fill="${INK}"/>` + lamp(37, 40, 6, .6) + fig + lbl(36, 82, 'LAMP IN SHOT'));
    }
    case 'ratio':
      return svgBox(twoFrames + head(40, 45, 18, .22) + head(120, 45, 18, .78) + lbl(40, 84, 'LOW RATIO, 2:1') + lbl(120, 84, 'HIGH RATIO, 8:1'));
    case 'two':
      return svgBox(`<line x1="16" y1="45" x2="144" y2="45" stroke="${ACC}" stroke-width="1" stroke-dasharray="3 3"/>` +
        `<g fill="${F}"><circle cx="58" cy="45" r="8"/><path d="M66 42 L70 45 L66 48 Z"/><circle cx="102" cy="45" r="8"/><path d="M94 42 L90 45 L94 48 Z"/></g>` +
        cone(80, 14, 58, 45, 8, .1) + cone(80, 14, 102, 45, 8, .1) + lamp(80, 14, 5) + camTop(80, 84, -90) + camTop(42, 76, -50) + camTop(118, 76, -130) +
        lbl(80, 8, 'KEY, ACROSS THE LINE') + lbl(80, 66, 'CAMERAS THIS SIDE'));
  }
}
function soundDrawing(id) {
  const lbl = (x, y, t, anchor = 'middle') => `<text x="${x}" y="${y}" font-size="7" text-anchor="${anchor}" font-family="Barlow Condensed, sans-serif" fill="var(--muted)" letter-spacing=".5">${t}</text>`;
  const mic = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-3" y="-8" width="6" height="12" rx="3" fill="${INK}"/><path d="M-5 0 A5 5 0 0 0 5 0 M0 5 V9" fill="none" stroke="${INK}" stroke-width="1.2"/></g>`;
  const arcs = (x, y, n, op) => Array.from({ length: n }, (_, i) => `<path d="M${x + 10 + i * 7} ${y - 8 - i * 4} A${10 + i * 6} ${10 + i * 6} 0 0 1 ${x + 10 + i * 7} ${y + 8 + i * 4}" fill="none" stroke="${ACC}" stroke-width="1.2" opacity="${op}"/>`).join('');
  const wave = (x, y, w, amp, seedInit = 3) => { let seed = seedInit, d = `M${x} ${y}`; for (let i = 1; i <= w; i += 2) { seed = (seed * 9301 + 49297) % 233280; d += ` L${x + i} ${(y + (seed / 233280 - .5) * amp).toFixed(1)}`; } return `<path d="${d}" fill="none" stroke="${INK}" stroke-width=".8"/>`; };
  switch (id) {
    case 'distance': {
      const fig = `<g transform="translate(30 6) scale(.8)">${figure(0)}</g>`;
      return svgBox(fig + arcs(34, 14, 3, 1) + mic(78, 14, .9) + `<path d="M62 22 H72" stroke="${ACC}" stroke-width="1"/>` + arcs(64, 40, 4, .25) + mic(146, 40, .9) +
        wave(88, 14, 50, 22, 5) + wave(96, 60, 40, 5, 9) + lbl(112, 32, '30 CM: CLEAN') + lbl(112, 72, '2 M: THIN'));
    }
    case 'lav': {
      const fig = `<g transform="translate(80 8) scale(.82)">${figure(0)}</g>`;
      return svgBox(fig + `<circle cx="78" cy="34" r="2.6" fill="${ACC}"/><path d="M78 36 Q84 42 78 46 Q72 50 76 58" fill="none" stroke="${ACC}" stroke-width=".9"/>` +
        `<path d="M62 34 H74" stroke="${ACC}" stroke-width=".8" stroke-dasharray="2 2"/>` + lbl(80, 88, 'A HAND BELOW THE CHIN, CABLE LOOPED'));
    }
    case 'boom': {
      const fig = `<g transform="translate(80 30) scale(.7)">${figure(0)}</g>`;
      return svgBox(`<rect x="30" y="26" width="100" height="52" fill="none" stroke="${L}" stroke-width=".8"/>` + fig +
        `<path d="M8 2 L70 18" stroke="${INK}" stroke-width="2"/><g transform="translate(74 19) rotate(60)"><rect x="-3" y="-9" width="6" height="14" rx="3" fill="${INK}"/></g>` +
        lbl(132, 22, 'JUST ABOVE THE FRAME', 'end') + lbl(80, 87, 'POINTED AT THE MOUTH'));
    }
    case 'tone':
      return svgBox(wave(14, 45, 132, 4, 11) + `<line x1="14" y1="45" x2="146" y2="45" stroke="${L}" stroke-width=".5"/>` + lbl(80, 30, '30 SECONDS, NOBODY SPEAKS') + lbl(80, 68, 'SAME MIC, SAME SPOT'));
    case 'noise': {
      const x = (cx, cy) => `<path d="M${cx - 9} ${cy - 9} L${cx + 9} ${cy + 9} M${cx + 9} ${cy - 9} L${cx - 9} ${cy + 9}" stroke="var(--danger)" stroke-width="2"/>`;
      const fan = `<g transform="translate(36 42)"><circle r="14" fill="none" stroke="${INK}" stroke-width="1"/><path d="M0 0 L0 -12 A12 12 0 0 1 8 -9 Z M0 0 L10 6 A12 12 0 0 1 2 12 Z M0 0 L-10 6 A12 12 0 0 1 -9 -8 Z" fill="${F}"/></g>`;
      const ac = `<g transform="translate(80 42)"><rect x="-16" y="-9" width="32" height="18" rx="2" fill="none" stroke="${INK}" stroke-width="1"/><line x1="-12" y1="4" x2="12" y2="4" stroke="${INK}"/><line x1="-12" y1="0" x2="12" y2="0" stroke="${INK}"/></g>`;
      const fridge = `<g transform="translate(124 42)"><rect x="-9" y="-16" width="18" height="32" rx="1" fill="none" stroke="${INK}" stroke-width="1"/><line x1="-9" y1="-4" x2="9" y2="-4" stroke="${INK}"/><line x1="6" y1="-12" x2="6" y2="-8" stroke="${INK}"/></g>`;
      return svgBox(fan + ac + fridge + x(36, 42) + x(80, 42) + x(124, 42) + lbl(36, 70, 'FAN') + lbl(80, 70, 'AC') + lbl(124, 70, 'FRIDGE') + lbl(80, 84, 'OFF FOR THE TAKE, ON BETWEEN'));
    }
    case 'sync':
      return svgBox(`<g transform="translate(20 22)"><rect x="0" y="10" width="46" height="34" rx="2" fill="${INK}"/><g transform="rotate(-18 0 10)"><rect x="0" y="2" width="46" height="8" fill="${INK}"/><path d="M4 2 l6 8 M16 2 l6 8 M28 2 l6 8 M40 2 l6 8" stroke="var(--bg)" stroke-width="3"/></g>` +
        `<text x="23" y="32" font-size="8" text-anchor="middle" font-family="Courier Prime, monospace" fill="var(--bg)">SC 2 · 2B</text></g>` +
        wave(84, 50, 30, 3, 13) + `<path d="M114 50 L116 20 L118 78 L120 50" fill="none" stroke="${ACC}" stroke-width="1.2"/>` + wave(120, 50, 26, 3, 17) + lbl(104, 88, 'ONE SPIKE TO LINE UP'));
  }
}
function drawingFor(kind, id) {
  if (kind === 'light') return lightDrawing(id);
  if (kind === 'sound') return soundDrawing(id);
  if (kind === 'exposure') return exposureDrawing(id);
  if (kind === 'lens') return lensDrawing(id);
  if (kind === 'cut') return cutRuleDrawing(id);
  if (kind === 'size') return composition('single', id);
  if (kind === 'framing') return composition(id, id === 'two' || id === 'group' ? 'MWS' : id === 'ots' ? 'MCU' : 'MS');
  if (kind === 'angle') return angleDrawing(id);
  if (kind === 'move') return moveDrawing(id);
  if (kind === 'rule') return ruleDrawing(id);
  return '';
}
