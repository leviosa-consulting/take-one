// Stage: people and props placed per shot, rendered into frames; framing detection.
const CAST_COLORS = ['#C0392B', '#2E86C1', '#27AE60', '#8E44AD', '#D68910', '#16A085', '#7F8C8D', '#C2185B'];
const PROPS = [
  {id:'door', name:'Door'}, {id:'window', name:'Window'}, {id:'table', name:'Table'}, {id:'desk', name:'Desk + laptop'},
  {id:'chair', name:'Chair'}, {id:'sofa', name:'Sofa'}, {id:'lamp', name:'Floor lamp'}, {id:'plant', name:'Plant'},
];
const DEPTH = [{ s: 1, feet: 100, name: 'Front' }, { s: .8, feet: 91, name: 'Middle' }, { s: .64, feet: 84, name: 'Back' }];
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
function roomPlain() {
  return `<g stroke="${L}" stroke-width=".6" fill="none"><line x1="-400" y1="80" x2="400" y2="80"/><line x1="-400" y1="-20" x2="400" y2="-20" stroke-dasharray="1 3"/></g>`;
}
function stageInner(shot, film, selectedId) {
  const items = stageItems(shot).slice().sort((a, b) => (b.z || 0) - (a.z || 0));
  return roomPlain() + items.map(it => {
    const d = DEPTH[it.z || 0], sx = it.x * d.s, ty = d.feet - 100 * d.s;
    let body = '';
    if (it.kind === 'cast') {
      const c = castOf(film, it.ref); if (!c) return '';
      const face = it.face === 'left' ? -1 : it.face === 'right' ? 1 : it.face === 'away' ? 'away' : 0;
      body = figure(0, { fill: c.color, initial: c.name.trim().charAt(0).toUpperCase(), face, pose: it.pose });
    } else body = propSVG(it.ref);
    const sel = it.id === selectedId ? `<rect x="-18" y="-2" width="36" height="104" fill="none" stroke="${ACC}" stroke-width="1.2" stroke-dasharray="3 2" vector-effect="non-scaling-stroke"/>` : '';
    return `<g class="stage-item" data-item="${it.id}" transform="translate(${sx.toFixed(1)} ${ty.toFixed(1)}) scale(${d.s})" style="cursor:grab">${body}${sel}</g>`;
  }).join('');
}
function stageCenter(shot) {
  const items = stageItems(shot); const cast = items.filter(i => i.kind === 'cast');
  const sx = i => i.x * DEPTH[i.z || 0].s, mean = arr => arr.reduce((n, i) => n + sx(i), 0) / arr.length;
  const subj = cast.filter(i => i.face !== 'away'), away = cast.filter(i => i.face === 'away');
  if (subj.length && away.length) return mean(subj) * .6 + mean(away) * .4;  // keep the foreground shoulder in an over-the-shoulder
  const pick = subj.length ? subj : cast.length ? cast : items;
  return pick.length ? mean(pick) : 0;
}
function stageFrame(shot, film) {
  const crop = { ...(SIZE[shot.size] || SIZE.MS).crop, cx: stageCenter(shot) };
  return frame(crop, stageInner(shot, film), { rotate: shot.angle === 'dutch' ? -12 : 0 });
}
function detectFraming(shot) {
  const cast = stageItems(shot).filter(i => i.kind === 'cast');
  if (!cast.length) return null;
  if (cast.some(i => i.face === 'away' && (i.z || 0) === 0) && cast.length > 1) return 'ots';
  return cast.length === 1 ? 'single' : cast.length === 2 ? 'two' : 'group';
}
function stagePanel(shot, film) {
  const sel = state.stageSel && stageItems(shot).find(i => i.id === state.stageSel) ? state.stageSel : null;
  const it = sel ? stageItems(shot).find(i => i.id === sel) : null;
  const cast = film.cast || [];
  const crop = SIZE[shot.size] ? SIZE[shot.size].crop : SIZE.MS.crop; const w = crop.h * 16 / 9, cx = stageCenter(shot);
  const overlay = shot.size === 'EST' ? '' : `<rect x="${cx - w / 2}" y="${crop.cy - crop.h / 2}" width="${w}" height="${crop.h}" fill="none" stroke="${ACC}" stroke-width="1" stroke-dasharray="3 2" vector-effect="non-scaling-stroke" pointer-events="none"/>`;
  const view = frame({ cy: 50, h: 120, cx: 0 }, stageInner(shot, film, sel), { overlay });
  return `<div class="stage-panel">
    <div class="stage-view" id="stage-${shot.id}">${view}<p class="hint">Drag people and props sideways. The dashed box is what the ${esc(SIZE[shot.size]?.abbr || '')} frame sees. Tap an item to change it.</p></div>
    <div class="stage-tools">
      <div><label class="lbl">Cast</label><div class="chiprow">${cast.length ? cast.map(c => `<button class="btn small" data-stage-add="cast" data-ref="${c.id}"><i class="dot" style="background:${c.color}"></i>${esc(c.name)}</button>`).join('') : '<span class="muted">Add characters at the top of the film first.</span>'}</div></div>
      <div><label class="lbl">Props</label><div class="chiprow">${PROPS.map(pr => `<button class="btn small" data-stage-add="prop" data-ref="${pr.id}">${esc(pr.name)}</button>`).join('')}</div></div>
      ${it ? `<div class="stage-sel"><label class="lbl">Selected: ${esc(it.kind === 'cast' ? (castOf(film, it.ref) || {}).name || 'Person' : (PROPS.find(p => p.id === it.ref) || {}).name || 'Prop')}</label>
        <div class="chiprow">
          ${it.kind === 'cast' ? `<span class="chip"><span class="k">Faces</span><select data-stage-f="face">${['camera', 'left', 'right', 'away'].map(v => `<option value="${v}" ${(it.face || 'camera') === v ? 'selected' : ''}>${v}</option>`).join('')}</select></span>
          <span class="chip"><span class="k">Pose</span><select data-stage-f="pose">${['stand', 'sit'].map(v => `<option value="${v}" ${(it.pose || 'stand') === v ? 'selected' : ''}>${v}</option>`).join('')}</select></span>` : ''}
          <span class="chip"><span class="k">Depth</span><select data-stage-f="z">${DEPTH.map((d, i) => `<option value="${i}" ${(it.z || 0) === i ? 'selected' : ''}>${d.name}</option>`).join('')}</select></span>
          <button class="btn small ghost danger" data-stage-remove="${it.id}">Remove</button>
        </div></div>` : '<p class="muted" style="font-size:13px">Nothing selected. Tap a person or prop on the stage.</p>'}
      ${stageItems(shot).length ? `<p class="muted" style="font-size:13px">Framing reads as <b>${esc((FRAME[detectFraming(shot) || shot.framing] || {}).name || '')}</b> from the stage.</p>` : ''}
    </div>
  </div>`;
}
function wireStage(panel, film, sc, shot) {
  const view = panel.querySelector('.stage-view');
  const svg = () => view.querySelector('svg');
  const toWorld = (clientX) => { const el = svg(); const r = el.getBoundingClientRect(); const vb = el.viewBox.baseVal; return vb.x + (clientX - r.left) / r.width * vb.width; };
  let drag = null;
  view.addEventListener('pointerdown', e => {
    const g = e.target.closest('.stage-item'); if (!g) return;
    const it = stageItems(shot).find(i => i.id === g.dataset.item); if (!it) return;
    state.stageSel = it.id;
    drag = { it, startX: toWorld(e.clientX), origX: it.x, moved: false };
    g.setPointerCapture?.(e.pointerId); e.preventDefault();
  });
  view.addEventListener('pointermove', e => {
    if (!drag) return;
    const d = DEPTH[drag.it.z || 0]; const dx = (toWorld(e.clientX) - drag.startX) / d.s;
    if (Math.abs(dx) > .5) drag.moved = true;
    drag.it.x = Math.max(-150, Math.min(150, drag.origX + dx));
    const el = svg(); const inner = el.querySelector('g.stage-item[data-item="' + drag.it.id + '"]'); if (inner) { const dd = DEPTH[drag.it.z || 0]; inner.setAttribute('transform', `translate(${(drag.it.x * dd.s).toFixed(1)} ${(dd.feet - 100 * dd.s).toFixed(1)}) scale(${dd.s})`); }
  });
  const end = () => { if (!drag) return; const moved = drag.moved; drag = null; if (moved) save(film); rerenderShot(film, sc, shot); };
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
  const rot = shot.angle === 'dutch' ? -12 : 0;
  const svg = composition(shot.framing, shot.size);
  if (!rot) return svg;
  // rotate the scene inside the frame: wrap inner group
  return svg.replace(/(<rect[^>]*fill="var\(--frame-bg\)"\/>)/, `$1<g transform="rotate(${rot})">`).replace('</svg>', '</g></svg>');
}
