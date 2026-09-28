// Learn tab: chapters and their navigation.
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function vocabCard(kind, item, compact = false) {
  return `<article class="card">${drawingFor(kind, item.id)}<div class="body">
    <div class="name">${item.abbr ? `<span class="abbr">${item.abbr}</span>` : ''}<h4>${esc(item.name)}</h4></div>
    <p>${esc(item.def)}</p>
    <p><b>Use it when.</b> ${esc(item.use)}</p>
    ${item.phone && !compact ? `<p><b>On the phone.</b> ${esc(item.phone)}</p>` : ''}
  </div></article>`;
}
const CHAPTERS = [
  {id:'start', title:'Start here', short:'Start', render:() => `
    <header><h3>Start here</h3><p>Take One teaches the language of shots and helps you plan them. Four questions describe any shot. Five more chapters cover how to capture it well. The Coverage tab turns both into shot lists for real scenes.</p></header>
    <div class="sub">Four questions describe a shot</div>
    <p class="lead">How much of the person do we see? Who is in the frame, and where? Where is the camera compared with the eyes? Does the camera move? The shot list asks you these four for every shot, and shows the drawings while you answer.</p>
    <div class="grid start-grid">
      ${[['sizes','Shot sizes',composition('single','MCU')],['framing','Framing',composition('ots','MCU')],['angles','Camera angles',angleDrawing('low')],['moves','Camera movements',moveDrawing('push')]].map(([id,t,d]) => `<button class="card start-card" data-chapter="${id}">${d}<div class="body"><h4>${t}</h4></div></button>`).join('')}
    </div>
    <div class="sub" style="margin-top:26px">Five chapters on capturing it well</div>
    <p class="lead">A shot is only as good as the lens, the light and the sound behind it, and only useful if it cuts. These chapters are short, and each ends in a habit for the set.</p>
    <div class="grid start-grid">
      ${[['lenses','Lenses',lensDrawing(3)],['cut','Rules of the cut',cutRuleDrawing('thirty')],['exposure','Exposure for video',exposureDrawing('shutter')],['light','Light',lightDrawing('three')],['sound','Sound for dialogue',soundDrawing('boom')]].map(([id,t,d]) => `<button class="card start-card" data-chapter="${id}">${d}<div class="body"><h4>${t}</h4></div></button>`).join('')}
    </div>
    <div class="callout" style="margin-top:22px"><div><h4>Then put them together</h4>
      <p style="font-size:14px;color:var(--muted)">The Coverage tab gives you starting shot sets for ten kinds of scene, from two people talking to the passage of time. Each one drops into your shot list with one click.</p>
      <p style="margin-top:10px"><button class="btn" id="go-coverage">Open coverage recipes</button></p></div>
      ${coverageDrawing()}</div>`},
  {id:'sizes', title:'Shot sizes', short:'Sizes', render:() => `<header><h3>Shot sizes</h3><p>Where the bottom of the frame cuts the body, from the widest to the tightest. Tighter sizes carry more emotion and less information.</p></header>
    <div class="grid">${SIZES.map(s => vocabCard('size', s)).join('')}</div>`},
  {id:'framing', title:'Framing', short:'Framing', render:() => `<header><h3>Framing</h3><p>Who is in the frame, and how the frame is arranged around them.</p></header>
    <div class="grid">${FRAMING.map(f => vocabCard('framing', f)).join('')}</div>
    <div class="sub">Frame rules</div>
    <div class="grid">${RULES.map(r => vocabCard('rule', r, true)).join('')}</div>`},
  {id:'angles', title:'Camera angles', short:'Angles', render:() => `<header><h3>Camera angles</h3><p>The height of the lens compared with the subject’s eyes. Angle is about power.</p></header>
    <div class="grid">${ANGLES.map(a => vocabCard('angle', a)).join('')}</div>`},
  {id:'moves', title:'Camera movements', short:'Moves', render:() => `<header><h3>Camera movements</h3><p>Seen from above unless marked. A move needs a reason: follow, reveal, or feel.</p></header>
    <div class="grid">${MOVES.map(m => vocabCard('move', m)).join('')}</div>`},
  {id:'lenses', title:'Lenses', short:'Lenses', render:() => `<header><h3>Lenses</h3><p>The person stays the same size in all four drawings. Only the lens changes, and with it the background and the shape of the face. To keep the person the same size you move: closer with a wide lens, farther with a long one.</p></header>
    <div class="grid">${LENS_INFO.map(l => vocabCard('lens', l)).join('')}</div>`},
  {id:'cut', title:'Rules of the cut', short:'The cut', render:() => `<header><h3>Rules of the cut</h3><p>Four editing rules that decide what you must shoot. Break any of them on purpose, never by accident.</p></header>
    <div class="grid">${RULES_CUT.map(r => vocabCard('cut', r, true)).join('')}</div>`},
  {id:'exposure', title:'Exposure for video', short:'Exposure', render:() => `<header><h3>Exposure for video</h3><p>In photography the three sides of the exposure triangle trade freely. In video the shutter is locked to the frame rate, and the phone’s aperture cannot change. So you control exposure with light and filters, then lock the camera.</p></header>
    <div class="grid">${EXPOSURE.map(e => vocabCard('exposure', e)).join('')}</div>`},
  {id:'light', title:'Light', short:'Light', render:() => `<header><h3>Light</h3><p>Seen from above unless marked. A phone film looks like a film when the light is placed, not when the camera is expensive. One window, one lamp and one white sheet cover most of this.</p></header>
    <div class="grid">${LIGHT.map(l => vocabCard('light', l)).join('')}</div>`},
  {id:'sound', title:'Sound for dialogue', short:'Sound', render:() => `<header><h3>Sound for dialogue</h3><p>Audiences forgive a soft picture and never forgive bad sound. These six habits are most of what a sound recordist does on a small set.</p></header>
    <div class="grid">${SOUND.map(s => vocabCard('sound', s)).join('')}</div>`},
  {id:'sources', title:'Sources', short:'Sources', render:() => `<header><h3>Sources</h3><p>The vocabulary and the two-person dialogue recipe follow these. The other coverage recipes are arrangements of the same building blocks; check them against Katz.</p></header>
    <div class="sources">
      <div><div class="sub">Vocabulary</div><ul>
        <li><a href="https://www.studiobinder.com/blog/ultimate-guide-to-camera-shots/" target="_blank" rel="noopener">StudioBinder: 50+ types of camera shots, angles and techniques</a> <span>All four categories on one page, with clips and free shot list downloads.</span></li>
        <li><a href="https://www.studiobinder.com/camera-shots/shot-size/" target="_blank" rel="noopener">Shot sizes</a>, <a href="https://www.studiobinder.com/camera-shots/camera-angles/" target="_blank" rel="noopener">camera angles</a>, <a href="https://www.studiobinder.com/camera-shots/camera-movements/" target="_blank" rel="noopener">camera movements</a> <span>One deeper StudioBinder page per category.</span></li>
        <li><a href="https://www.studiobinder.com/blog/shot-list-abbreviations/" target="_blank" rel="noopener">Shot list abbreviations</a> <span>The short codes Take One uses.</span></li>
      </ul></div>
      <div><div class="sub">The line and coverage</div><ul>
        <li><a href="https://www.studiobinder.com/blog/what-is-the-180-degree-rule-film/" target="_blank" rel="noopener">StudioBinder: the 180-degree rule</a> <span>With examples of breaking it on purpose.</span></li>
        <li><a href="https://en.wikipedia.org/wiki/Camera_coverage" target="_blank" rel="noopener">Wikipedia: camera coverage</a> <span>The master scene method, with textbook references.</span></li>
        <li><a href="https://wolfcrow.com/how-to-master-coverage-in-3-awesome-ways/" target="_blank" rel="noopener">Wolfcrow: how to master coverage in 3 ways</a> <span>Hollywood system, BBC system, one take. Seven to ten shots for a two-person scene.</span></li>
        <li><a href="https://www.premiumbeat.com/blog/filmmaking-tips-shooting-dialogue-scene/" target="_blank" rel="noopener">PremiumBeat: shooting a dialogue scene</a> <span>Short and practical.</span></li>
      </ul></div>
      <div><div class="sub">Books</div><ul>
        <li><b>Steven D. Katz, <i>Film Directing: Shot by Shot</i></b> (25th anniversary edition) <span>The standard text on staging and coverage. Read the Workshop chapters first.</span></li>
        <li><b>Blain Brown, <i>Cinematography: Theory and Practice</i></b> (4th edition) <span>Vocabulary, coverage and lenses in depth.</span></li>
        <li><b>Gustavo Mercado, <i>The Filmmaker’s Eye</i></b> <span>One shot type per spread, with a frame and why it works.</span></li>
        <li><b>Judith Weston, <i>Directing Actors</i></b> <span>Not about shots. About the two people in front of the camera.</span></li>
      </ul></div>
    </div>`},
];
function chapterNav(items, current, attr) {
  return `<nav class="side" aria-label="Chapters">${items.map((c, i) => `<button class="side-item ${c.id === current ? 'on' : ''}" data-${attr}="${c.id}" aria-current="${c.id === current ? 'page' : 'false'}"><span class="n">${i + 1}</span><span class="t">${esc(c.title)}</span><span class="s">${esc(c.short || c.title)}</span></button>`).join('')}</nav>`;
}
function prevNext(items, current, attr) {
  const i = items.findIndex(c => c.id === current), prev = items[i - 1], next = items[i + 1];
  return `<div class="prevnext">${prev ? `<button class="btn" data-${attr}="${prev.id}">← ${esc(prev.title)}</button>` : '<span></span>'}${next ? `<button class="btn primary" data-${attr}="${next.id}">${esc(next.title)} →</button>` : '<span></span>'}</div>`;
}
function renderLearn(chapterId) {
  const el = document.getElementById('view-learn');
  const id = CHAPTERS.some(c => c.id === chapterId) ? chapterId : 'start';
  state.chapter = id; LS.set('sgn:chapter', id);
  const ch = CHAPTERS.find(c => c.id === id);
  el.innerHTML = `<div class="layout">${chapterNav(CHAPTERS, id, 'chapter')}<section class="chapter" id="${id}">${ch.render()}${prevNext(CHAPTERS, id, 'chapter')}</section></div>`;
  el.querySelectorAll('[data-chapter]').forEach(b => b.onclick = () => { renderLearn(b.dataset.chapter); scrollToContent(); });
  revealChip(el);
  const go = el.querySelector('#go-coverage'); if (go) go.onclick = () => { showTab('coverage'); window.scrollTo({ top: 0 }); };
}
function scrollToContent() {
  const top = document.querySelector('.chapter, .recipe'); if (!top) return;
  const y = top.getBoundingClientRect().top + window.scrollY - 70;
  if (window.scrollY > y) window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
}
