// Stage: people and props placed per shot, rendered into frames; framing detection.
const CAST_COLORS = ['#C0392B', '#2E86C1', '#27AE60', '#8E44AD', '#D68910', '#16A085', '#7F8C8D', '#C2185B'];
const PROPS = [
  {id:'door', name:'Door'}, {id:'window', name:'Window'}, {id:'table', name:'Table'}, {id:'desk', name:'Desk + laptop'},
  {id:'chair', name:'Chair'}, {id:'sofa', name:'Sofa'}, {id:'lamp', name:'Floor lamp'}, {id:'plant', name:'Plant'},
];
const DEPTH = [{ name: 'Front' }, { name: 'Middle' }, { name: 'Back' }];
const Z_MAX = 3, WALL_Z = 3.4;
// The stage is a pinhole view. An item at depth z shrinks by 0.8 per step, and its floor point sits
// between the front floor line (y 100) and the horizon. cam is the camera height in figure units
// (0 the top of a standing head, 100 the floor). sy squashes figures seen from above.
// taper widens whatever is nearer the camera: the feet from below, the head from above.
// Items at the front keep their size and place at every angle, so shot-size crops still fit.
const CAMS = {
  eye: { cam: 8, sy: 1, taper: 0 }, high: { cam: -45, sy: .92, taper: -.16 }, low: { cam: 50, sy: 1.04, taper: .12 },
  worms: { cam: 97, sy: 1.08, taper: .28 }, dutch: { cam: 8, sy: 1, taper: 0, roll: -12 },
};
// SVG has no perspective transform, so the taper is drawn as thin bands, each scaled a little wider or narrower.
const TAPER_BANDS = 10;
function taperDefs() {
  const h = 112 / TAPER_BANDS;
  return `<defs>${Array.from({ length: TAPER_BANDS }, (_, i) => `<clipPath id="tb${i}"><rect x="-80" y="${(-6 + i * h - .2).toFixed(2)}" width="160" height="${(h + .4).toFixed(2)}"/></clipPath>`).join('')}</defs>`;
}
function taper(body, t) {
  if (!t) return body;
  const h = 112 / TAPER_BANDS;
  return Array.from({ length: TAPER_BANDS }, (_, i) => { const mid = -6 + (i + .5) * h, k = 1 + t * (mid - 50) / 50; return `<g clip-path="url(#tb${i})"><g transform="scale(${k.toFixed(3)} 1)">${body}</g></g>`; }).join('');
}
function camFor(angle) { return CAMS[angle] || CAMS.eye; }
function depthScale(z) { return Math.pow(.8, z || 0); }
function projY(y, z, c) { const s = depthScale(z); return c.cam + ((y - 8) * c.sy + 8 - c.cam) * s; }
function itemTransform(it, c) {
  const s = depthScale(it.z), ty = c.cam + (8 - 8 * c.sy - c.cam) * s;
  return `translate(${(it.x * s).toFixed(1)} ${ty.toFixed(1)}) scale(${s.toFixed(3)} ${(s * c.sy).toFixed(3)})`;
}
function propSVG(kind) {
  const soft = 'var(--surface-2)';
  switch (kind) {
    case 'door': return `<rect x="-13" y="28" width="26" height="72" fill="${soft}" stroke="${L}" stroke-width=".8"/><rect x="-10" y="32" width="20" height="30" fill="none" stroke="${L}" stroke-width=".5"/><circle cx="8" cy="64" r="1.3" fill="${INK}"/>`;
    case 'window': return `<rect x="-16" y="14" width="32" height="26" fill="var(--accent-soft)" opacity=".7" stroke="${L}" stroke-width=".8"/><line x1="0" y1="14" x2="0" y2="40" stroke="${L}" stroke-width=".7"/><line x1="-16" y1="27" x2="16" y2="27" stroke="${L}" stroke-width=".7"/>`;
    case 'table': return `<rect x="-22" y="60" width="44" height="3.5" fill="${F2}"/><rect x="-19" y="63" width="3" height="37" fill="${F2}"/><rect x="16" y="63" width="3" height="37" fill="${F2}"/>`;
    case 'desk': return `<rect x="-22" y="60" width="44" height="3.5" fill="${F2}"/><rect x="-19" y="63" width="3" height="37" fill="${F2}"/><rect x="16" y="63" width="3" height="37" fill="${F2}"/><path d="M-8 60 L-7 47 L9 47 L8 60 Z" fill="${INK}"/><rect x="-9" y="59" width="18" height="1.6" fill="${INK}"/>`;
    case 'chair': return `<rect x="-9" y="44" width="18" height="22" rx="2" fill="${F2}" opacity=".75"/><rect x="-10" y="66" width="20" height="3.5" fill="${F2}"/><rect x="-8" y="69" width="2.5" height="31" fill="${F2}"/><rect x="5.5" y="69" width="2.5" height="31" fill="${F2}"/>`;
    case 'sofa': return `<rect x="-28" y="56" width="56" height="18" rx="3" fill="${F2}" opacity=".8"/><rect x="-32" y="72" width="64" height="20" rx="3" fill="${F2}"/><rect x="-33" y="62" width="7" height="30" rx="3" fill="${F2}"/><rect x="26" y="62" width="7" height="30" rx="3" fill="${F2}"/><rect x="-28" y="92" width="4" height="8" fill="${F2}"/><rect x="24" y="92" width="4" height="8" fill="${F2}"/>`;
    case 'lamp': return `<ellipse cx="0" cy="99" rx="7" ry="1.8" fill="${F2}"/><line x1="0" y1="44" x2="0" y2="99" stroke="${F2}" stroke-width="1.4"/><circle cx="0" cy="40" r="9" fill="${ACC}" opacity=".18"/><path d="M-9 44 L-6 30 L6 30 L9 44 Z" fill="${INK}"/>`;
    case 'plant': return `<path d="M-6 100 L-8 84 L8 84 L6 100 Z" fill="${F2}"/><circle cx="0" cy="74" r="9" fill="var(--done)" opacity=".55"/><circle cx="-7" cy="80" r="6" fill="var(--done)" opacity=".55"/><circle cx="7" cy="80" r="6" fill="var(--done)" opacity=".55"/>`;
  }
  return '';
}
function stageItems(shot) { return (shot.stage && Array.isArray(shot.stage.items)) ? shot.stage.items : []; }
function castOf(film, id) { return (film && film.cast || []).find(c => c.id === id); }
// Back wall, ceiling line and floor boards that run toward the horizon, so the angle reads.
function roomPlain(c) {
  const sw = depthScale(WALL_Z), floor = projY(100, WALL_Z, c), ceil = projY(-70, WALL_Z, c), front = projY(100, 0, c);
  const boards = [-360, -270, -180, -90, 0, 90, 180, 270, 360].map(x => `<line x1="${x}" y1="${front}" x2="${(x * sw).toFixed(1)}" y2="${floor.toFixed(1)}"/>`).join('');
  return `<g stroke="${L}" stroke-width=".6" fill="none">
    <path d="M-900 ${front} L900 ${front} L900 ${floor.toFixed(1)} L-900 ${floor.toFixed(1)} Z" fill="${L}" opacity=".1" stroke="none"/>
    <g opacity=".45">${boards}</g>
    <line x1="-900" y1="${floor.toFixed(1)}" x2="900" y2="${floor.toFixed(1)}"/>
    <line x1="-900" y1="${ceil.toFixed(1)}" x2="900" y2="${ceil.toFixed(1)}" stroke-dasharray="1 3"/></g>`;
}
function stageInner(shot, film, selectedId, c = camFor(shot.angle)) {
  const items = stageItems(shot).slice().sort((a, b) => (b.z || 0) - (a.z || 0));
  return (c.taper ? taperDefs() : '') + roomPlain(c) + items.map(it => {
    let body = '';
    if (it.kind === 'cast') {
      const c = castOf(film, it.ref); if (!c) return '';
      const face = it.face === 'left' ? -1 : it.face === 'right' ? 1 : it.face === 'away' ? 'away' : 0;
      body = figure(0, { fill: c.color, initial: c.name.trim().charAt(0).toUpperCase(), face, pose: it.pose });
    } else body = propSVG(it.ref);
    const sel = it.id === selectedId ? `<rect x="-18" y="-2" width="36" height="104" fill="none" stroke="${ACC}" stroke-width="1.2" stroke-dasharray="3 2" vector-effect="non-scaling-stroke"/>` : '';
    return `<g class="stage-item" data-item="${it.id}" transform="${itemTransform(it, c)}" style="cursor:grab">${taper(body, c.taper)}${sel}</g>`;
  }).join('');
}
function stageCenter(shot) {
  const items = stageItems(shot); const cast = items.filter(i => i.kind === 'cast');
  const sx = i => i.x * depthScale(i.z), mean = arr => arr.reduce((n, i) => n + sx(i), 0) / arr.length;
  const subj = cast.filter(i => i.face !== 'away'), away = cast.filter(i => i.face === 'away');
  if (subj.length && away.length) return mean(subj) * .6 + mean(away) * .4;  // keep the foreground shoulder in an over-the-shoulder
  const pick = subj.length ? subj : cast.length ? cast : items;
  return pick.length ? mean(pick) : 0;
}
function stageFrame(shot, film) {
  if (shot.angle === 'birds') return planFrame(shot, film);
  const c = camFor(shot.angle);
  return frame(stageCrop(shot, film, c), stageInner(shot, film, null, c), { rotate: c.roll || 0 });
}
function stageCrop(shot, film, c) {
  const crop = { ...(SIZE[shot.size] || SIZE.MS).crop, cx: stageCenter(shot) };
  // the size is measured on the people the shot is about, at their depth
  const cast = stageItems(shot).filter(i => i.kind === 'cast' && castOf(film, i.ref)), subj = cast.filter(i => i.face !== 'away');
  const on = subj.length ? subj : cast;
  if (on.length && shot.size !== 'EST') {
    const mean = f => on.reduce((n, i) => n + f(i), 0) / on.length;
    crop.cy = mean(i => projY(crop.cy, i.z, c)); crop.h *= mean(i => depthScale(i.z));
  }
  return crop;
}
// Bird's eye: the stage seen from straight above. The camera side is at the bottom of the frame.
const PLAN_ROW = 40;
function planProp(kind) {
  const s = `fill="${F2}"`;
  switch (kind) {
    case 'door': return `<line x1="-13" y1="0" x2="13" y2="0" stroke="${L}" stroke-width="2"/><path d="M-13 0 L-13 24 A26 26 0 0 0 13 0" fill="none" stroke="${L}" stroke-width=".6" stroke-dasharray="2 2"/>`;
    case 'window': return `<rect x="-16" y="-2" width="32" height="4" fill="var(--accent-soft)" stroke="${L}" stroke-width=".7"/>`;
    case 'table': return `<rect x="-22" y="-12" width="44" height="24" rx="1.5" ${s}/>`;
    case 'desk': return `<rect x="-22" y="-12" width="44" height="24" rx="1.5" ${s}/><rect x="-8" y="-4" width="16" height="10" fill="${INK}"/>`;
    case 'chair': return `<rect x="-9" y="-9" width="18" height="18" rx="2" ${s}/><rect x="-9" y="-12" width="18" height="4" fill="${INK}" opacity=".5"/>`;
    case 'sofa': return `<rect x="-32" y="-12" width="64" height="24" rx="3" ${s}/><rect x="-32" y="-12" width="64" height="7" fill="${INK}" opacity=".35"/>`;
    case 'lamp': return `<circle r="14" fill="${ACC}" opacity=".15"/><circle r="6" fill="${INK}"/>`;
    case 'plant': return `<circle r="10" fill="var(--done)" opacity=".55"/><circle cx="-5" cy="-4" r="6" fill="var(--done)" opacity=".55"/><circle cx="5" cy="4" r="6" fill="var(--done)" opacity=".55"/>`;
  }
  return '';
}
function planPerson(c, face) {
  // shoulders across the body, head on top, nose toward the way the person faces
  const rot = face === 'left' ? 90 : face === 'right' ? -90 : face === 'away' ? 180 : 0;
  return `<g transform="rotate(${rot})"><ellipse rx="13" ry="6.5" fill="${c.color}"/><circle r="6.6" fill="${c.color}" stroke="${INK}" stroke-opacity=".35" stroke-width=".6"/><path d="M-2.6 5.8 L0 10 L2.6 5.8 Z" fill="${INK}"/></g>
    <text y="3" font-size="7" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="700" fill="var(--bg)">${esc(c.name.trim().charAt(0).toUpperCase())}</text>`;
}
function planFrame(shot, film) {
  const items = stageItems(shot), cast = items.filter(i => i.kind === 'cast' && castOf(film, i.ref));
  const pick = cast.length ? cast : items, mean = f => pick.length ? pick.reduce((n, i) => n + f(i), 0) / pick.length : 0;
  const crop = { cy: mean(i => -(i.z || 0) * PLAN_ROW), cx: mean(i => i.x), h: Math.max(70, (SIZE[shot.size] || SIZE.MS).crop.h * .8) };
  const floor = `<g stroke="${L}" stroke-width=".5" opacity=".5">${[-2, -1, 0, 1, 2, 3].map(r => `<line x1="-900" y1="${-r * PLAN_ROW + PLAN_ROW / 2}" x2="900" y2="${-r * PLAN_ROW + PLAN_ROW / 2}" stroke-dasharray="1 3"/>`).join('')}</g>`;
  const body = items.map(it => {
    const at = `translate(${it.x.toFixed(1)} ${(-(it.z || 0) * PLAN_ROW).toFixed(1)})`;
    if (it.kind === 'cast') { const c = castOf(film, it.ref); return c ? `<g transform="${at}">${planPerson(c, it.face)}</g>` : ''; }
    return `<g transform="${at}">${planProp(it.ref)}</g>`;
  });
  // people over props
  return frame(crop, floor + body.filter((_, i) => items[i].kind !== 'cast').join('') + body.filter((_, i) => items[i].kind === 'cast').join(''));
}
function detectFraming(shot) {
  const cast = stageItems(shot).filter(i => i.kind === 'cast');
  if (!cast.length) return null;
  if (cast.some(i => i.face === 'away' && (i.z || 0) < .5) && cast.length > 1) return 'ots';
  return cast.length === 1 ? 'single' : cast.length === 2 ? 'two' : 'group';
}
function stagePanel(shot, film) {
  const sel = state.stageSel && stageItems(shot).find(i => i.id === state.stageSel) ? state.stageSel : null;
  const it = sel ? stageItems(shot).find(i => i.id === sel) : null;
  const cast = film.cast || [];
  const crop = stageCrop(shot, film, CAMS.eye), w = crop.h * 16 / 9, cx = crop.cx;
  const overlay = shot.size === 'EST' ? '' : `<rect x="${cx - w / 2}" y="${crop.cy - crop.h / 2}" width="${w}" height="${crop.h}" fill="none" stroke="${ACC}" stroke-width="1" stroke-dasharray="3 2" vector-effect="non-scaling-stroke" pointer-events="none"/>`;
  const view = frame({ cy: 50, h: 120, cx: 0 }, stageInner(shot, film, sel, CAMS.eye), { overlay });
  return `<div class="stage-panel">
    <div class="stage-view" id="stage-${shot.id}">${view}<p class="hint">Drag people and props. Up moves them further back, down brings them closer. The dashed box is what the ${esc(SIZE[shot.size]?.abbr || '')} frame sees at eye level. Tap an item to change it.</p></div>
    <div class="stage-tools">
      <div><label class="lbl">Cast</label><div class="chiprow">${cast.length ? cast.map(c => `<button class="btn small" data-stage-add="cast" data-ref="${c.id}"><i class="dot" style="background:${c.color}"></i>${esc(c.name)}</button>`).join('') : '<span class="muted">Add characters at the top of the film first.</span>'}</div></div>
      <div><label class="lbl">Props</label><div class="chiprow">${PROPS.map(pr => `<button class="btn small" data-stage-add="prop" data-ref="${pr.id}">${esc(pr.name)}</button>`).join('')}</div></div>
      ${it ? `<div class="stage-sel"><label class="lbl">Selected: ${esc(it.kind === 'cast' ? (castOf(film, it.ref) || {}).name || 'Person' : (PROPS.find(p => p.id === it.ref) || {}).name || 'Prop')}</label>
        <div class="chiprow">
          ${it.kind === 'cast' ? `<span class="chip"><span class="k">Faces</span><select data-stage-f="face">${['camera', 'left', 'right', 'away'].map(v => `<option value="${v}" ${(it.face || 'camera') === v ? 'selected' : ''}>${v}</option>`).join('')}</select></span>
          <span class="chip"><span class="k">Pose</span><select data-stage-f="pose">${['stand', 'sit'].map(v => `<option value="${v}" ${(it.pose || 'stand') === v ? 'selected' : ''}>${v}</option>`).join('')}</select></span>` : ''}
          <span class="chip"><span class="k">Depth</span><select data-stage-f="z">${DEPTH.map((d, i) => `<option value="${i}" ${Math.min(2, Math.round(it.z || 0)) === i ? 'selected' : ''}>${d.name}</option>`).join('')}</select></span>
          <button class="btn small ghost danger" data-stage-remove="${it.id}">Remove</button>
        </div></div>` : '<p class="muted" style="font-size:13px">Nothing selected. Tap a person or prop on the stage.</p>'}
      ${stageItems(shot).length ? `<p class="muted" style="font-size:13px">Framing reads as <b>${esc((FRAME[detectFraming(shot) || shot.framing] || {}).name || '')}</b> from the stage.</p>` : ''}
    </div>
  </div>`;
}
function wireStage(panel, film, sc, shot) {
  const view = panel.querySelector('.stage-view');
  const svg = () => view.querySelector('svg');
  const toWorld = e => { const el = svg(); const r = el.getBoundingClientRect(); const vb = el.viewBox.baseVal; return [vb.x + (e.clientX - r.left) / r.width * vb.width, vb.y + (e.clientY - r.top) / r.height * vb.height]; };
  const c = CAMS.eye, feetY = z => projY(100, z, c);
  let drag = null;
  view.addEventListener('pointerdown', e => {
    const g = e.target.closest('.stage-item'); if (!g) return;
    const it = stageItems(shot).find(i => i.id === g.dataset.item); if (!it) return;
    state.stageSel = it.id;
    const [px, py] = toWorld(e);
    drag = { it, px, py, sx: it.x * depthScale(it.z), fy: feetY(it.z), moved: false };
    g.setPointerCapture?.(e.pointerId); e.preventDefault();
  });
  view.addEventListener('pointermove', e => {
    if (!drag) return;
    const [px, py] = toWorld(e), dx = px - drag.px, dy = py - drag.py;
    if (Math.abs(dx) + Math.abs(dy) > .8) drag.moved = true;
    // the feet follow the pointer: height on screen sets the depth, then x keeps its screen place
    const s = Math.max(depthScale(Z_MAX), Math.min(1, (drag.fy + dy - c.cam) / (100 - c.cam)));
    const z = Math.log(s) / Math.log(.8), it = drag.it;
    it.z = z < .08 ? 0 : Math.round(z * 100) / 100;
    it.x = Math.round(Math.max(-100, Math.min(100, drag.sx + dx)) / depthScale(it.z) * 10) / 10; // keep it on the stage
    const inner = svg().querySelector('g.stage-item[data-item="' + it.id + '"]'); if (inner) inner.setAttribute('transform', itemTransform(it, c));
  });
  const end = () => {
    if (!drag) return; const moved = drag.moved; drag = null;
    if (moved) { const fr = detectFraming(shot); if (fr) shot.framing = fr; save(film); }
    rerenderShot(film, sc, shot);
  };
  view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
  panel.querySelectorAll('[data-stage-add]').forEach(b => b.onclick = () => {
    shot.stage = shot.stage || { items: [] };
    const kind = b.dataset.stageAdd, n = shot.stage.items.length;
    const item = { id: uid(), kind, ref: b.dataset.ref, x: kind === 'cast' ? (n % 2 ? 22 : -22) + (n > 1 ? n * 6 : 0) : (n % 2 ? 60 : -60), z: kind === 'prop' ? 1 : 0, face: 'camera', pose: 'stand' };
    shot.stage.items.push(item); state.stageSel = item.id;
    const f = detectFraming(shot); if (f) shot.framing = f;
    save(film); rerenderShot(film, sc, shot);
  });
  panel.querySelectorAll('[data-stage-f]').forEach(sel => sel.onchange = () => {
    const it = stageItems(shot).find(i => i.id === state.stageSel); if (!it) return;
    const f = sel.dataset.stageF; it[f] = f === 'z' ? +sel.value : sel.value;
    const fr = detectFraming(shot); if (fr) shot.framing = fr;
    save(film); rerenderShot(film, sc, shot);
  });
  panel.querySelectorAll('[data-stage-remove]').forEach(b => b.onclick = () => {
    shot.stage.items = shot.stage.items.filter(i => i.id !== b.dataset.stageRemove); state.stageSel = null;
    const fr = detectFraming(shot); if (fr) shot.framing = fr;
    save(film); rerenderShot(film, sc, shot);
  });
}
function shotThumb(shot, film) {
  if (film && stageItems(shot).length && shot.size !== 'EST') return stageFrame(shot, film);
  const rot = camFor(shot.angle).roll || 0;
  const svg = composition(shot.framing, shot.size);
  if (!rot) return svg;
  // rotate the scene inside the frame: wrap inner group
  return svg.replace(/(<rect[^>]*fill="var\(--frame-bg\)"\/>)/, `$1<g transform="rotate(${rot})">`).replace('</svg>', '</g></svg>');
}
