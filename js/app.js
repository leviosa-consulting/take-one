// Tabs and boot.
const smallScreen = window.matchMedia('(max-width: 760px)');
const topRight = document.querySelector('.top-right');
function placeTopRight() {
  const tr = topRight; if (!tr) return;
  if (smallScreen.matches) { const list = document.getElementById('view-list'); if (tr.parentElement !== list) list.prepend(tr); tr.classList.add('in-list'); }
  else { const head = document.querySelector('.top-in'); if (tr.parentElement !== head) head.appendChild(tr); tr.classList.remove('in-list'); }
}
smallScreen.addEventListener('change', placeTopRight);
function revealChip(root) { if (smallScreen.matches) root.querySelector('.side-item.on')?.scrollIntoView({ block: 'nearest', inline: 'center' }); }
function showTab(name) {
  state.tab = name;
  ['learn', 'coverage', 'list'].forEach(t => {
    document.getElementById('view-' + t).hidden = name !== t;
    document.getElementById('tab-' + t).setAttribute('aria-selected', name === t);
  });
  if (name === 'list') document.querySelectorAll('#view-list textarea.desc').forEach(autosize);
  if (name === 'coverage') renderCoverage();
  if (name === 'learn') revealChip(document.getElementById('view-learn'));
  LS.set('sgn:tab', name);
}
document.getElementById('tab-learn').onclick = () => showTab('learn');
document.getElementById('tab-coverage').onclick = () => showTab('coverage');
document.getElementById('tab-list').onclick = () => showTab('list');
document.getElementById('film-select').addEventListener('change', e => { state.currentId = e.target.value; LS.set('sgn:current', state.currentId); renderList(); showTab('list'); });
document.getElementById('new-film').onclick = () => { addFilm(newFilm()); showTab('list'); setTimeout(() => document.getElementById('film-title')?.select(), 50); };
document.addEventListener('click', e => { const a = e.target.closest('.toc a'); if (a) { e.preventDefault(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });

const hash = location.hash.slice(1);
state.recipe = LS.get('sgn:recipe', RECIPES[0].id);
state.board = !!LS.get('sgn:board', false);
renderLearn(CHAPTERS.some(c => c.id === hash) ? hash : LS.get('sgn:chapter', 'start'));
renderList();
const startTab = ['list', 'learn', 'coverage'].includes(hash) ? hash : CHAPTERS.some(c => c.id === hash) ? 'learn' : LS.get('sgn:tab', 'learn');
showTab(startTab);
initStorage();
