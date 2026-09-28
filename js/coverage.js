// Coverage tab: recipes and the add-to-scene flow.
function recipeShotCard(s) {
  const shot = { ...s, lens: LENSES[s.lens] };
  return `<div class="rshot"><div class="thumb">${shotThumb(shot)}</div>
    <div class="rmeta"><span class="abbr">${SIZE[s.size].abbr}</span> ${esc(FRAME[s.framing].name)} · ${esc(ANGLE[s.angle].name)} · ${esc(MOVE[s.move].name)}</div>
    <p>${esc(s.description)}</p></div>`;
}
function renderCoverage(recipeId) {
  const el = document.getElementById('view-coverage');
  const film = currentFilm();
  const id = RECIPES.some(r => r.id === recipeId) ? recipeId : (state.recipe || RECIPES[0].id);
  state.recipe = id; LS.set('sgn:recipe', id);
  const r = RECIPES.find(x => x.id === id);
  const items = [{ id: 'about', title: 'What coverage is', short: 'About' }, ...RECIPES.map(x => ({ id: x.id, title: x.name, short: x.name }))];
  const sceneOpts = film ? film.scenes.map((sc, i) => `<option value="${sc.id}">Scene ${i + 1}: ${esc(sc.heading)}</option>`).join('') + '<option value="__new">New scene</option>' : '<option value="">No film open</option>';
  const body = id === 'about' ? `<section class="chapter"><header><h3>Coverage</h3><p>Coverage is the set of shots you take so the editor has choices. Each recipe here is a starting set for one kind of scene. Add it to a scene, then rename, reorder and delete until it fits your script. The recipes lean on static tripod shots and the three real lenses of a phone.</p></header>
      <div class="grid start-grid">${RECIPES.map(x => `<button class="card start-card" data-recipe-nav="${x.id}">${shotThumb({ ...x.shots[1] || x.shots[0], lens: '' })}<div class="body"><h4>${esc(x.name)}</h4><p>${esc(x.when)}</p></div></button>`).join('')}</div>
      ${prevNext(items, 'about', 'recipe-nav')}</section>`
  : `<section class="recipe" id="r-${r.id}">
    <div class="rhead">
      <div><h3>${esc(r.name)}</h3><p class="when">${esc(r.when)}</p></div>
      <div class="radd"><select class="ctl" data-recipe="${r.id}" aria-label="Scene to add to" ${film ? '' : 'disabled'}>${sceneOpts}</select><button class="btn primary" data-add="${r.id}" ${film ? '' : 'disabled'}>Add ${r.shots.length} shots</button></div>
    </div>
    <div class="rbody ${r.diagram ? 'has-diagram' : ''}">
      <div><p class="why">${esc(r.why)}</p><p class="watch"><b>Watch out.</b> ${esc(r.watch)}</p></div>
      ${r.diagram === 'line' ? `<div class="rdiagram">${coverageDrawing()}<span class="cap">The 180-degree line. All cameras stay on one side.</span></div>` : ''}
    </div>
    <div class="rshots">${r.shots.map(recipeShotCard).join('')}</div>
    ${prevNext(items, id, 'recipe-nav')}
  </section>`;
  el.innerHTML = `<div class="layout">${chapterNav(items, id, 'recipe-nav')}${body}</div>`;
  el.querySelectorAll('[data-recipe-nav]').forEach(b => b.onclick = () => { renderCoverage(b.dataset.recipeNav); scrollToContent(); });
  revealChip(el);
  el.querySelectorAll('button[data-add]').forEach(b => b.onclick = () => {
    const sel = el.querySelector(`select[data-recipe="${b.dataset.add}"]`);
    addRecipeToScene(b.dataset.add, sel.value === '__new' ? null : sel.value);
  });
}
function asText(film) {
  const total = film.scenes.reduce((n, sc) => n + sumDur(sc.shots), 0);
  const lines = [film.title.toUpperCase() + (total ? `  (running time ${fmtDur(total)})` : ''), film.logline || '', ''];
  film.scenes.forEach((sc, i) => {
    lines.push(`SC ${i + 1}  ${sc.heading}${sumDur(sc.shots) ? '  (' + fmtDur(sumDur(sc.shots)) + ')' : ''}`); if (sc.description) lines.push(`      ${sc.description}`); if (sceneProps(sc).length) lines.push(`      On set: ${sceneProps(sc).join(', ')}`);
    sc.shots.forEach((s, j) => lines.push(`  ${shotLabel(i, j).padEnd(4)} ${s.done ? '[x]' : '[ ]'} ${SIZE[s.size]?.abbr.padEnd(4)} ${FRAME[s.framing]?.name.padEnd(18)} ${ANGLE[s.angle]?.name.padEnd(12)} ${MOVE[s.move]?.name.padEnd(16)} ${s.lens.padEnd(20)} ${fmtDur(s.dur).padStart(5)}  ${s.description}${s.notes ? '  (' + s.notes + ')' : ''}`));
    lines.push('');
  });
  return lines.join('\n');
}
function asCSV(film) {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['Scene', 'Scene heading', 'Shot', 'Size', 'Framing', 'Angle', 'Movement', 'Lens', 'Length (s)', 'Description', 'Notes', 'Done']];
  film.scenes.forEach((sc, i) => sc.shots.forEach((s, j) => rows.push([i + 1, sc.heading, shotLabel(i, j), SIZE[s.size]?.abbr, FRAME[s.framing]?.name, ANGLE[s.angle]?.name, MOVE[s.move]?.name, s.lens, s.dur || '', s.description, s.notes, s.done ? 'yes' : 'no'])));
  return rows.map(r => r.map(q).join(',')).join('\r\n');
}
