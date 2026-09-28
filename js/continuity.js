// Continuity across the shots of a scene, read from the stage: the 180-degree line and eyelines.
// The stage camera always sits in front, so a person's left or right on screen tells which side of the line the shot is on.
const SIDE_GAP = 6; // closer than this on screen and nobody is clearly left or right
function screenX(it) { return it.x * depthScale(it.z); }
function stageCast(shot, film) { return stageItems(shot).filter(i => i.kind === 'cast' && castOf(film, i.ref)); }
function lookSide(it) { return it.face === 'left' ? -1 : it.face === 'right' ? 1 : 0; }
function sideWord(sign) { return sign < 0 ? 'left' : 'right'; }
// Returns a Map of shot id to a list of warnings.
function sceneContinuity(film, sc) {
  const out = new Map(), add = (id, m) => { if (!out.has(id)) out.set(id, []); out.get(id).push(m); };
  const name = ref => castOf(film, ref).name, label = j => shotLabel(film.scenes.indexOf(sc), j);
  const order = new Map(); // "a|b" -> { sign: +1 when a is left of b, j: a shot that shows it }
  const pairOf = (a, b) => a < b ? [a + '|' + b, 1] : [b + '|' + a, -1];
  // 1. The line: two people keep the same sides in every shot. Most shots set the sides (the earliest wins a tie);
  // the shots that disagree are the ones flagged.
  const seen = new Map(); // "a|b" -> [{ sign, j, a, b }]
  sc.shots.forEach((shot, j) => {
    const cast = stageCast(shot, film);
    cast.forEach(a => cast.forEach(b => {
      if (a.ref >= b.ref) return;
      const d = screenX(b) - screenX(a); if (Math.abs(d) < SIDE_GAP) return;
      const key = a.ref + '|' + b.ref; if (!seen.has(key)) seen.set(key, []);
      seen.get(key).push({ sign: Math.sign(d), j, a, b });
    }));
  });
  seen.forEach((list, key) => {
    const votes = list.reduce((n, x) => n + x.sign, 0), sign = votes ? Math.sign(votes) : list[0].sign;
    const ref = list.find(x => x.sign === sign); order.set(key, { sign, j: ref.j });
    list.filter(x => x.sign !== sign).forEach(x => {
      const [l, r] = x.sign > 0 ? [x.a, x.b] : [x.b, x.a]; // l is on the left here
      add(sc.shots[x.j].id, `Crosses the line. In ${label(ref.j)} ${name(l.ref)} is right of ${name(r.ref)}. Here ${name(l.ref)} is on the left. Keep the camera on one side of the two.`);
    });
  });
  // Where is b relative to a, on the sides most shots agree on? -1 left, +1 right, null when never placed together.
  const sideOf = (a, b) => { const [key, flip] = pairOf(a, b), o = order.get(key); return o ? { side: o.sign * flip, j: o.j } : null; };
  // 2. Eyelines.
  let prevSingle = null;
  sc.shots.forEach((shot, j) => {
    const cast = stageCast(shot, film);
    cast.forEach(a => {
      const look = lookSide(a); if (!look) return;
      const others = cast.filter(b => b.ref !== a.ref && Math.abs(screenX(b) - screenX(a)) >= SIDE_GAP);
      if (others.length === 1) {
        const b = others[0], side = Math.sign(screenX(b) - screenX(a));
        if (side !== look) add(shot.id, `${name(a.ref)} looks ${sideWord(look)}, away from ${name(b.ref)}. If they are talking, turn ${name(a.ref)} to face ${sideWord(side)}.`);
        return;
      }
      if (cast.length > 1) return;
      // a single: look toward the partner placed earlier (or later) in the scene
      const partner = film.cast.map(c => c.id).filter(id => id !== a.ref).map(id => ({ id, s: sideOf(a.ref, id) })).find(p => p.s);
      if (partner && partner.s.side !== look) add(shot.id, `${name(a.ref)} looks ${sideWord(look)} here, but ${name(partner.id)} is on ${name(a.ref)}’s ${sideWord(partner.s.side)} in ${label(partner.s.j)}. Turn ${name(a.ref)} to look ${sideWord(partner.s.side)} so the eyelines meet.`);
    });
    // two singles in a row, looking the same way
    const single = cast.length === 1 && lookSide(cast[0]) ? { ref: cast[0].ref, look: lookSide(cast[0]), j } : null;
    if (single && prevSingle && prevSingle.j === j - 1 && prevSingle.ref !== single.ref && prevSingle.look === single.look && !sideOf(single.ref, prevSingle.ref))
      add(shot.id, `${name(prevSingle.ref)} in ${label(prevSingle.j)} and ${name(single.ref)} here both look ${sideWord(single.look)}. For their eyes to meet across the cut, one should look ${sideWord(-single.look)}.`);
    prevSingle = single;
  });
  return out;
}
