/* Gym Buddy — plain JS, no dependencies. Data lives in localStorage ("gymbuddy.v1"). */
(function () {
'use strict';

/* ------------------------------------------------------------------ data */
const IMG = id => 'images/' + id + '.png';

const EX = {
  'hip-flexor-stretch': { name: 'Half-kneeling hip flexor stretch', cat: 'Warm-up & cool-down',
    cues: ['Tuck the tailbone under and squeeze the glute of the kneeling leg.', 'Stay tall with ribs down, no leaning back.', 'Feel the stretch at the front of the hip, not the low back.'],
    mistake: 'Arching the low back to “go deeper” — that feeds the anterior tilt.' },
  'hip-flexor-overhead': { name: 'Half-kneeling hip flexor stretch (arm overhead)', cat: 'Warm-up & cool-down',
    cues: ['Same-side arm (as the kneeling knee) reaches overhead.', 'Tuck the tailbone and squeeze that glute; stay tall.', 'Lean only slightly away from the kneeling side.'],
    mistake: 'Arching the low back as the arm goes up.' },
  'glute-bridge': { name: 'Glute bridge', cat: 'Warm-up & cool-down',
    cues: ['Feet hip-width, heels close to your hips.', 'Tuck the tailbone, then squeeze glutes to lift.', 'Stop when hips line up with knees and shoulders.'],
    mistake: 'Over-arching the low back at the top instead of using the glutes.' },
  'band-lateral-walk': { name: 'Band lateral walk', cat: 'Warm-up & cool-down',
    cues: ['Band just above the knees, small quarter-squat.', 'Toes forward, small steps, keep band tension.', 'Chest up, ribs down.'],
    mistake: 'Knees caving in or leaning the torso side to side.' },
  'bird-dog': { name: 'Bird dog', cat: 'Warm-up & cool-down',
    cues: ['Flat back, ribs down, hips square to the floor.', 'Reach long — hand and heel — rather than lifting high.', 'Move slowly, pause one second at the end.'],
    mistake: 'Rotating the hips or arching the back as the leg rises.' },
  'cat-cow': { name: 'Cat-cow', cat: 'Warm-up & cool-down',
    cues: ['Wrists under shoulders, knees under hips.', 'Move with your breath, gently and pain-free.', 'Small range is fine; tuck the tailbone on the “cat”.'],
    mistake: 'Forcing the end range or sagging hard into the low back.' },
  'figure-4-stretch': { name: 'Figure-4 stretch (glute / piriformis)', cat: 'Warm-up & cool-down',
    cues: ['Lie on your back, cross one ankle over the opposite thigh.', 'Pull the lower thigh gently toward your chest.', 'Head stays down, breathe slowly.'],
    mistake: 'Pulling hard or holding through sharp pain or tingling down the leg.' },
  'quad-stretch': { name: 'Standing quad stretch', cat: 'Warm-up & cool-down',
    cues: ['Squeeze the glute of the stretching leg to tuck the pelvis.', 'Knees stay close together, torso upright.', 'Hold a wall for balance if needed.'],
    mistake: 'Arching the low back or letting the knee drift forward.' },
  'nerve-glide': { name: 'Seated sciatic nerve glide', cat: 'Warm-up & cool-down',
    cues: ['Sit tall. As the knee straightens, lift your chin.', 'As the knee bends, lower your chin. Slow, rhythmic.', 'Stay gentle — it should never be painful.'],
    mistake: 'Pushing into pain, tingling or numbness (that is “stop”, not “stretch”).' },
  'childs-pose': { name: "Child's pose", cat: 'Warm-up & cool-down',
    cues: ['Sit hips back toward heels, reach arms long.', 'Rest forehead down and breathe into your low back.', 'Knees can go wide if more comfortable.'],
    mistake: 'Forcing the hips down when they are not ready to reach the heels.' },

  'hip-thrust': { name: 'DB hip thrust (upper back on bench)', cat: 'Lower body',
    cues: ['Upper back on the bench edge, chin tucked, dumbbell on hips.', 'Shins vertical at the top; hips level with knees and shoulders.', 'Ribs down, tuck the tailbone, squeeze glutes hard.'],
    mistake: 'Flaring the ribs and over-arching the low back at the top.' },
  'rdl': { name: 'DB Romanian deadlift', cat: 'Lower body', flare: true,
    cues: ['Soft knees, push hips straight back.', 'Flat back, dumbbells slide down your thighs.', 'Stop where hamstrings stretch, then drive hips forward.'],
    mistake: 'Rounding the back or reaching the weights too low.' },
  'goblet-squat': { name: 'Goblet squat to bench', cat: 'Lower body',
    cues: ['Dumbbell at chest, elbows in, chest tall.', 'Sit back and down until you lightly touch the bench.', 'Drive through the whole foot to stand.'],
    mistake: 'Dropping onto the bench, or tucking the pelvis under at the bottom.' },
  'bulgarian-split-squat': { name: 'Bulgarian split squat', cat: 'Lower body', flare: true,
    cues: ['Rear foot on the bench, long stride forward.', 'Torso tall, front knee tracks over mid-foot.', 'Lower straight down, drive through the front heel.'],
    mistake: 'Too short a stride (knee jams forward) or leaning the torso.' },
  'single-leg-bridge': { name: 'Single-leg glute bridge', cat: 'Lower body',
    cues: ['Tuck the tailbone, drive through the planted heel.', 'Keep hips level — don’t let the lifted side drop.', 'Hold the top for a second, squeeze glute.'],
    mistake: 'Rotating the hips or arching the low back to get higher.' },
  'step-up': { name: 'Bench step-ups', cat: 'Lower body',
    cues: ['Whole foot on the bench, hips level.', 'Drive up through the heel of the top leg.', 'Lower slowly; don’t push off the floor foot.'],
    mistake: 'Pushing off the back foot instead of the working leg.' },
  'clamshell': { name: 'Banded clamshell', cat: 'Lower body',
    cues: ['Lie on your side, hips stacked, band above the knees.', 'Lift the top knee, feet stay together.', 'Pelvis stays still — move only at the hip.'],
    mistake: 'Rolling the pelvis backward to lift the knee higher.' },
  'bridge-march': { name: 'Glute bridge march', cat: 'Lower body',
    cues: ['Bridge up, ribs down, hips level.', 'Lift one knee toward the chest without hips dropping.', 'Alternate sides slowly with control.'],
    mistake: 'Hips rotating or sagging as the foot lifts.' },

  'one-arm-row': { name: 'One-arm DB row', cat: 'Upper body',
    cues: ['Hand and knee on the bench, back flat.', 'Pull the elbow toward your hip, not straight up.', 'Squeeze the shoulder blade, lower slowly.'],
    mistake: 'Twisting the torso to heave the weight up.' },
  'bench-press': { name: 'DB bench press', cat: 'Upper body',
    cues: ['Shoulder blades back and down, feet planted.', 'Wrists stacked over elbows, lower to chest level.', 'Ribs down; keep a small natural arch only.'],
    mistake: 'Big low-back arch with the ribs flared up.' },
  'half-kneeling-press': { name: 'Half-kneeling DB overhead press', cat: 'Upper body',
    cues: ['Squeeze the glute of the kneeling leg, tuck the tailbone.', 'Press straight up, ribs down.', 'Biceps by the ear at the top, no lean.'],
    mistake: 'Leaning back and arching the low back to finish the press.' },
  'face-pull': { name: 'Band face pull', cat: 'Upper body',
    cues: ['Band at about head height, step back for tension.', 'Pull toward the face, elbows high and wide.', 'Squeeze the shoulder blades together.'],
    mistake: 'Shrugging the shoulders toward the ears.' },

  'dead-bug': { name: 'Dead bug', cat: 'Core',
    caption: 'Top: start (both arms up, hips and knees at 90°). Bottom: extend opposite arm and leg.',
    cues: ['Low back stays flat on the floor, ribs down.', 'Extend the opposite arm and leg slowly.', 'Exhale as you reach, return with control.'],
    mistake: 'Low back arching off the floor as the leg lowers.' },
  'pallof-press': { name: 'Band Pallof press', cat: 'Core',
    cues: ['Stand side-on to the band, feet shoulder-width.', 'Press straight out and resist the twist.', 'Ribs down, glutes squeezed.'],
    mistake: 'Letting the torso rotate toward the anchor.' },
  'side-plank': { name: 'Side plank', cat: 'Core',
    cues: ['Elbow under shoulder, feet stacked.', 'Hips high — head to heels in a straight line.', 'Breathe steadily.'],
    mistake: 'Hips sagging toward the floor.' },
  'plank': { name: 'Plank with pelvis tucked', cat: 'Core',
    cues: ['Elbows under shoulders, body in one line.', 'Tuck the tailbone and squeeze glutes.', 'Ribs down, neck neutral.'],
    mistake: 'Low back sagging into an arch (anterior tilt).' },
  'suitcase-carry': { name: 'Suitcase carry', cat: 'Core',
    cues: ['One dumbbell at your side, stand tall.', 'Shoulders level, ribs down, glutes on.', 'Walk slowly without leaning.'],
    mistake: 'Leaning toward the weight or hiking the shoulder.' },

  'curved-treadmill': { name: 'Curved treadmill intervals', cat: 'Conditioning',
    cues: ['Hard bursts: lean slightly, drive the knees.', 'Recovery: walk tall, let breathing settle.', 'Don’t grab rails (if any) — the belt is self-powered.'],
    mistake: 'Overstriding or leaning back, which tilts the pelvis.' },
  'rower': { name: 'Rower intervals', cat: 'Conditioning', flare: true,
    caption: 'Finish: handle to lower ribs, elbows past body.',
    cues: ['Legs push first, then lean back, then arms.', 'Tall chest, ribs down at the finish.', 'Return arms, body, then legs, in that order.'],
    mistake: 'Yanking with the back or over-leaning at the finish.' },
  'air-bike': { name: 'Air bike intervals', cat: 'Conditioning',
    cues: ['Seat at a height with a slight knee bend at the bottom.', 'Sit tall, push and pull the handles.', 'Ribs down, stay smooth in the easy phase.'],
    mistake: 'Seat too low or rounding the back while grinding hard.' },
  'easy-walk': { name: 'Easy walk', cat: 'Conditioning',
    cues: ['Walk tall, ribs down, glutes engaged.', 'Easy pace — you can talk comfortably.', 'Relaxed arms, eyes forward.'],
    mistake: 'Slouching forward or over-striding.' }
};
const exName = id => (EX[id] && EX[id].name) || id;

const WARM = [
  { id: 'hip-flexor-stretch', name: 'Half-kneeling hip flexor stretch w/ glute squeeze', dose: '30s/side', secs: 30 },
  { id: 'glute-bridge', dose: '× 10' },
  { id: 'band-lateral-walk', dose: '10 steps each way' },
  { id: 'bird-dog', dose: '5/side, slow' },
  { id: 'cat-cow', dose: '× 8, gentle' }
];
const COOL = [
  { id: 'hip-flexor-overhead', name: 'Half-kneeling hip flexor stretch (arm overhead)', dose: '45s/side', secs: 45 },
  { id: 'figure-4-stretch', name: 'Figure-4 glute / piriformis stretch (lying)', dose: '45s/side', secs: 45 },
  { id: 'quad-stretch', name: 'Standing quad stretch w/ glute squeezed', dose: '30s/side', secs: 30 },
  { id: 'nerve-glide', dose: '10 slow reps/side' },
  { id: 'childs-pose', dose: '30s', secs: 30 }
];

const DAYS = {
  A: { title: 'Glute Day ✦ · Glutes & Hamstrings', blocks: [{ title: 'Main event', items: [
    { id: 'hip-thrust', tag: '1a', sets: 3, rmin: 12, rmax: 12, weighted: true },
    { id: 'dead-bug', tag: '1b', sets: 3, rmin: 8, rmax: 8, per: '/side' },
    { id: 'rdl', tag: '2a', sets: 3, rmin: 10, rmax: 10, weighted: true },
    { id: 'clamshell', tag: '2b', sets: 3, rmin: 15, rmax: 15, per: '/side' },
    { id: 'goblet-squat', tag: '3', sets: 2, rmin: 10, rmax: 10, weighted: true }
  ] }] },
  B: { title: 'Strong Arms Day · Upper + Core', blocks: [{ title: 'Main block', items: [
    { id: 'one-arm-row', tag: '1a', sets: 3, rmin: 10, rmax: 10, per: '/side', weighted: true },
    { id: 'bench-press', tag: '1b', sets: 3, rmin: 10, rmax: 10, weighted: true },
    { id: 'half-kneeling-press', tag: '2a', sets: 3, rmin: 8, rmax: 8, per: '/side', weighted: true },
    { id: 'face-pull', tag: '2b', sets: 3, rmin: 15, rmax: 15 },
    { id: 'pallof-press', tag: '3a', sets: 2, rmin: 10, rmax: 10, per: '/side' },
    { id: 'side-plank', tag: '3b', sets: 2, rmin: 20, rmax: 30, per: '/side', secs: true }
  ] }] },
  C: { title: 'Balance Day · Single-Leg + Stability', blocks: [{ title: 'Main block', items: [
    { id: 'bulgarian-split-squat', tag: '1a', sets: 3, rmin: 8, rmax: 8, per: '/side', weighted: true },
    { id: 'single-leg-bridge', tag: '1b', sets: 3, rmin: 10, rmax: 10, per: '/side' },
    { id: 'step-up', tag: '2a', sets: 3, rmin: 8, rmax: 8, per: '/side', weighted: true },
    { id: 'plank', tag: '2b', name: 'Plank with pelvis tucked', sets: 3, rmin: 20, rmax: 40, secs: true },
    { id: 'suitcase-carry', tag: '3', sets: 3, rmin: 30, rmax: 30, per: '/side', secs: true, weighted: true }
  ] }] },
  D: { title: 'Sweat Day · Conditioning + Core', blocks: [
    { title: 'Sweaty intervals — 15 min, pick one', cardio: true, items: [] },
    { title: 'Core circuit — 2 rounds', items: [
      { id: 'dead-bug', sets: 2, checkOnly: true, dose: '8/side' },
      { id: 'bird-dog', sets: 2, checkOnly: true, dose: '8/side' },
      { id: 'bridge-march', sets: 2, checkOnly: true, dose: '10/side' },
      { id: 'side-plank', sets: 2, checkOnly: true, dose: '20s/side', hold: 20 }
    ] }
  ] },
  E: { title: 'Easy Glow Day ✦ · Light full-body (optional)', blocks: [
    { title: 'Easy cardio', items: [
      { id: 'easy-walk', name: '10 min easy walk (or row)', sets: 1, checkOnly: true, dose: '10 min easy', altImg: 'rower', walkOnlyName: '10 min easy walk' }
    ] },
    { title: 'Light circuit — 2 rounds', items: [
      { id: 'hip-thrust', sets: 2, rmin: 12, rmax: 12, weighted: true },
      { id: 'one-arm-row', sets: 2, rmin: 10, rmax: 10, per: '/side', weighted: true },
      { id: 'goblet-squat', sets: 2, rmin: 10, rmax: 10, weighted: true },
      { id: 'dead-bug', sets: 2, rmin: 8, rmax: 8, per: '/side' }
    ] },
    { title: 'Extra stretching — 5 min', items: [
      { id: 'childs-pose', name: '5 min extra stretching (hip flexors, figure-4, child’s pose)', sets: 1, checkOnly: true, dose: '5 min' }
    ] }
  ] }
};

const PRESETS = {
  treadmill: { name: 'Curved treadmill', img: 'curved-treadmill', work: 30, rest: 90, rounds: 7, wl: 'HARD', rl: 'WALK', tip: '30s hard / 90s walk × 6–7' },
  rower: { name: 'Rower', img: 'rower', work: 60, rest: 60, rounds: 7, wl: 'STRONG', rl: 'EASY', tip: '1 min strong / 1 min easy × 7' },
  bike: { name: 'Bike', img: 'air-bike', work: 40, rest: 80, rounds: 7, wl: 'HARD', rl: 'EASY', tip: '40s hard / 80s easy × 7' }
};

/* flare-up substitutions */
function flareBlocks(day, blocks) {
  return blocks.map(b => {
    if (b.cardio) return { title: 'Easy walk — 15 min (flare day: no rower / intervals)', items: [
      { id: 'easy-walk', name: '15 min easy walk, curved treadmill', sets: 1, checkOnly: true, dose: '15 min easy', flareSwap: true }] };
    return Object.assign({}, b, { items: b.items.map(it => {
      if (it.id === 'rdl') return { id: 'glute-bridge', tag: it.tag, name: 'Glute bridge (flare swap for RDL)', sets: 3, rmin: 12, rmax: 12, flareSwap: true };
      if (it.id === 'bulgarian-split-squat') return { id: 'bird-dog', tag: it.tag, name: 'Bird dog (flare swap for split squat)', sets: 3, rmin: 8, rmax: 8, per: '/side', flareSwap: true };
      if (it.walkOnlyName) return Object.assign({}, it, { name: it.walkOnlyName, flareSwap: true });
      return it;
    }) });
  });
}

/* ------------------------------------------------------------------ state */
const KEY = 'gymbuddy.v1';
const DEFAULTS = { unit: 'lb', daysPerWeek: 4, flare: false, restSecs: 60, autoRest: true };
function normalize(d) {
  d = d || {};
  return { settings: Object.assign({}, DEFAULTS, d.settings || {}), sessions: Array.isArray(d.sessions) ? d.sessions : [], draft: d.draft || null };
}
function load() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && typeof d === 'object') return normalize(d); } catch (e) { /* ignore */ } return normalize({}); }
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save (storage full?)'); } }

let tab = 'workout';
let viewDay = null;
let calMonth = new Date(); calMonth.setDate(1);
let progEx = null;
let CUR = { items: {} };

/* ------------------------------------------------------------------ helpers */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const dkey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function weekStart(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
const fmtDate = (iso, opts) => new Date(iso).toLocaleDateString(undefined, opts || { weekday: 'short', month: 'short', day: 'numeric' });
const mmss = s => { s = Math.max(0, Math.ceil(s)); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); };
const LB = 2.20462;
const unit = () => S.settings.unit;
const toDisp = lb => { const v = unit() === 'kg' ? lb / LB : lb; return Math.round(v * 2) / 2; };
const fromDisp = v => unit() === 'kg' ? v * LB : v;
const wFmt = lb => (lb === '' || lb == null || isNaN(lb)) ? '' : String(toDisp(+lb));
const sessionsSorted = () => S.sessions.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
const seq = () => S.settings.daysPerWeek === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];

function nextDay() {
  const s = sessionsSorted(); if (!s.length) return 'A';
  const q = seq(); const i = q.indexOf(s[s.length - 1].day);
  return i < 0 ? 'A' : q[(i + 1) % q.length];
}

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 2200);
}

/* dialog */
const dlg = $('#dlg');
function openDlg(html, bind) {
  dlg.innerHTML = html;
  dlg.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => dlg.close()));
  if (bind) bind(dlg);
  if (!dlg.open) dlg.showModal();
}
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
function zoom(id) {
  openDlg('<div class="zoom"><img src="' + IMG(id) + '" alt="' + esc(exName(id)) + '"><h3 style="margin:10px 0 6px">' + esc(exName(id)) + '</h3>' +
    '<button class="btn block" data-close>Close</button></div>');
}

/* ------------------------------------------------------------------ audio / timers */
let audioCtx = null;
function beep(n, freq) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    for (let i = 0; i < (n || 1); i++) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = freq || 880; o.connect(g); g.connect(audioCtx.destination);
      const t = audioCtx.currentTime + i * 0.22; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.start(t); o.stop(t + 0.2);
    }
  } catch (e) { /* audio unavailable */ }
  try { if (navigator.vibrate) navigator.vibrate(n > 1 ? [150, 80, 150] : 120); } catch (e) { /* ignore */ }
}
let wake = null;
async function keepAwake() { try { if (navigator.wakeLock && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) { /* ignore */ } }

/* rest / hold countdown */
let CD = null;
function startCountdown(label, secs) {
  stopCountdown(true); keepAwake();
  CD = { label, total: secs, end: Date.now() + secs * 1000, ring: false };
  CD.iv = setInterval(tickCD, 200); beep(1, 660); renderBar();
}
function stopCountdown(silent) { if (CD) { clearInterval(CD.iv); CD = null; } if (!silent) renderBar(); }
function tickCD() {
  if (!CD) return;
  const left = (CD.end - Date.now()) / 1000;
  if (left <= 0 && !CD.ring) { CD.ring = true; clearInterval(CD.iv); beep(3, 880); renderBar(); setTimeout(() => { if (CD && CD.ring) stopCountdown(); }, 4000); return; }
  const big = $('#cd-big'); if (big) big.textContent = mmss(left);
}
function renderBar() {
  const bar = $('#timerbar');
  if (CD) {
    const left = Math.max(0, (CD.end - Date.now()) / 1000);
    bar.hidden = false; bar.className = 'timerbar' + (CD.ring ? ' ring' : '');
    bar.innerHTML = '<span class="lbl">' + esc(CD.ring ? (CD.label === 'Rest' ? 'Rest over — back at it' : CD.label + ' done — nice hold') : CD.label) + '</span>' +
      '<span class="big" id="cd-big">' + mmss(left) + '</span>' +
      (CD.ring ? '' : '<button data-cd="add">+15s</button>') + '<button data-cd="stop">' + (CD.ring ? 'OK' : 'Stop') + '</button>';
  } else if (tab === 'workout') {
    bar.hidden = false; bar.className = 'timerbar';
    bar.innerHTML = '<span class="lbl">⏱ Rest up</span><button data-cd="rest45">45s</button><button data-cd="rest60">60s</button>';
  } else { bar.hidden = true; }
}
$('#timerbar').addEventListener('click', e => {
  const b = e.target.closest('[data-cd]'); if (!b) return;
  const a = b.dataset.cd;
  if (a === 'stop') stopCountdown();
  else if (a === 'add' && CD) { CD.end += 15000; CD.total += 15; tickCD(); }
  else if (a === 'rest45') startCountdown('Rest', 45);
  else if (a === 'rest60') startCountdown('Rest', 60);
});

/* interval timer (Day D) */
const IT = { preset: 'treadmill', work: 30, rest: 90, rounds: 7, phase: 'idle', round: 1, end: 0, remain: 0, running: false, iv: null };
function itPreset(p) { Object.assign(IT, { preset: p, work: PRESETS[p].work, rest: PRESETS[p].rest, rounds: PRESETS[p].rounds }); itReset(); }
function itReset() { clearInterval(IT.iv); IT.iv = null; IT.running = false; IT.phase = 'idle'; IT.round = 1; IT.remain = 0; renderIT(); }
function itStart() {
  keepAwake(); beep(1, 660);
  if (IT.phase === 'idle' || IT.phase === 'done') { IT.phase = 'ready'; IT.round = 1; IT.remain = 5; }
  IT.running = true; IT.end = Date.now() + IT.remain * 1000;
  clearInterval(IT.iv); IT.iv = setInterval(itTick, 200); itTick();
}
function itPause() { if (!IT.running) return; IT.remain = (IT.end - Date.now()) / 1000; IT.running = false; clearInterval(IT.iv); renderIT(); }
function itTick() {
  if (!IT.running) return;
  let left = (IT.end - Date.now()) / 1000;
  while (left <= 0 && IT.running) {
    const over = -left;
    if (IT.phase === 'ready') { IT.phase = 'work'; beep(2, 990); IT.end = Date.now() + IT.work * 1000 - over * 1000; }
    else if (IT.phase === 'work') {
      if (IT.round >= IT.rounds) { IT.phase = 'done'; IT.running = false; clearInterval(IT.iv); beep(4, 880); break; }
      IT.phase = 'rest'; beep(1, 520); IT.end = Date.now() + IT.rest * 1000 - over * 1000;
    } else if (IT.phase === 'rest') { IT.round++; IT.phase = 'work'; beep(2, 990); IT.end = Date.now() + IT.work * 1000 - over * 1000; }
    left = (IT.end - Date.now()) / 1000;
  }
  if (IT.running) IT.remain = left;
  renderIT();
}
function renderIT() {
  const box = $('#it'); if (!box) return;
  const P = PRESETS[IT.preset];
  const ph = { idle: 'READY WHEN YOU ARE', ready: 'GET READY', work: P.wl, rest: P.rl, done: 'DONE — NICE WORK ✦' }[IT.phase];
  const t = IT.phase === 'idle' ? IT.work : (IT.phase === 'done' ? 0 : IT.remain);
  box.className = 'interval ' + (IT.phase === 'work' ? 'work' : IT.phase === 'rest' ? 'rest' : IT.phase === 'ready' ? 'ready' : '');
  $('#it-ph').textContent = ph; $('#it-t').textContent = mmss(t);
  $('#it-round').textContent = 'Round ' + Math.min(IT.round, IT.rounds) + ' / ' + IT.rounds + ' · ' + IT.work + 's ' + P.wl.toLowerCase() + ' / ' + IT.rest + 's ' + P.rl.toLowerCase();
  const go = $('#it-go'); go.textContent = IT.running ? '⏸ Pause' : (IT.phase === 'idle' || IT.phase === 'done' ? '▶ Start' : '▶ Resume'); go.dataset.it = IT.running ? 'pause' : 'start';
  $('#it-rounds-n').textContent = IT.rounds;
}

/* ------------------------------------------------------------------ progression helpers */
function lastEntry(ex) {
  const s = sessionsSorted();
  for (let i = s.length - 1; i >= 0; i--) {
    const e = (s[i].entries || []).find(x => x.ex === ex && (x.sets || []).some(z => z.done));
    if (e) return e;
  }
  return null;
}
function lastWeight(ex) {
  const e = lastEntry(ex); if (!e) return '';
  const ds = e.sets.filter(s => s.done && s.w > 0); return ds.length ? ds[ds.length - 1].w : '';
}
function readyToAdd(ex) {
  const e = lastEntry(ex); if (!e || !e.weighted || !e.rmax) return false;
  const d = e.sets.filter(s => s.done);
  return d.length >= (e.planSets || 1) && d.every(s => +s.r >= e.rmax);
}

/* ------------------------------------------------------------------ draft */
function hasActivity(d) {
  if (!d) return false;
  if (d.startTs) return true;
  if (Object.values(d.checks || {}).some(Boolean)) return true;
  return Object.values(d.sets || {}).some(arr => arr.some(s => s.done || s.r !== ''));
}
function ensureDraft(day) {
  if (!S.draft || S.draft.day !== day) S.draft = { day, startTs: null, sets: {}, checks: {}, cardio: 'treadmill' };
  return S.draft;
}
function startIfNeeded() { if (S.draft && !S.draft.startTs) { S.draft.startTs = Date.now(); updateElapsed(); } }
function elapsedSec() { return S.draft && S.draft.startTs ? Math.round((Date.now() - S.draft.startTs) / 1000) : 0; }
function updateElapsed() {
  const el = $('#elapsed'); if (!el) return;
  el.textContent = S.draft && S.draft.startTs ? '⏱ ' + mmss(elapsedSec()) : 'Not started yet';
  const b = $('#startbtn'); if (b) b.hidden = !!(S.draft && S.draft.startTs);
}
setInterval(updateElapsed, 1000);

/* ------------------------------------------------------------------ views */
function render() {
  $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const v = $('#view');
  if (tab === 'workout') renderWorkout(v);
  else if (tab === 'progress') renderProgress(v);
  else if (tab === 'library') renderLibrary(v);
  else renderSettings(v);
  renderBar();
  window.scrollTo(0, 0);
}

function doseText(it) {
  if (it.dose) return it.dose;
  const r = it.rmin === it.rmax ? it.rmax : it.rmin + '–' + it.rmax;
  return it.sets + ' × ' + r + (it.secs ? 's' : '') + (it.per || '');
}

function exerciseCard(it, uidKey, section, d) {
  const ex = EX[it.id] || { name: it.id, cues: [], mistake: '' };
  const name = it.name || ex.name;
  const key = uidKey;
  CUR.items[key] = it;
  const tips = '<details class="tips"><summary>Form cues ✦</summary>' + (ex.caption ? '<div class="small muted" style="margin-top:4px"><i>' + esc(ex.caption) + '</i></div>' : '') + '<ul class="cues">' + ex.cues.map(c => '<li>' + esc(c) + '</li>').join('') + '</ul>' +
    '<div class="mistake">⚠ Common mistake: ' + esc(ex.mistake) + '</div></details>';
  const thumb = '<button class="thumb" data-zoom="' + it.id + '" aria-label="Enlarge picture of ' + esc(name) + '"><img src="' + IMG(it.id) + '" alt="' + esc(name) + ' form" loading="lazy"></button>';
  const hold = it.secs && section !== 'main' ? '<button class="btn small" data-hold="' + (it.secs) + '" data-label="' + esc(name) + '">⏱ ' + it.secs + 's</button>' : (it.hold ? '<button class="btn small" data-hold="' + it.hold + '" data-label="' + esc(name) + '">⏱ ' + it.hold + 's</button>' : '');
  const flare = it.flareSwap ? '<span class="badge warn">Flare swap</span> ' : '';
  const upBadge = it.weighted && readyToAdd(it.id) ? ' <span class="badge up">Ready to level up ↑</span>' : '';

  /* checklist style: warm-up, cool-down and check-only blocks */
  if (section !== 'main' || it.checkOnly) {
    const cnt = it.checkOnly && it.sets > 1;
    let boxes;
    if (cnt) {
      boxes = '<div class="row wrap" style="margin-top:6px">' + Array.from({ length: it.sets }, (_, i) => {
        const k = key + '#' + i;
        return '<label class="checkrow"><input type="checkbox" class="cnt" data-chk="' + k + '"' + (d.checks[k] ? ' checked' : '') + '> Round ' + (i + 1) + '</label>';
      }).join('') + '</div>';
    }
    const single = !cnt ? '<input type="checkbox" class="cnt" data-chk="' + key + '"' + (d.checks[key] ? ' checked' : '') + ' aria-label="Done: ' + esc(name) + '">' : '';
    return '<div class="card ex compact' + (!cnt && d.checks[key] ? ' done' : '') + '" data-card="' + key + '">' + thumb +
      '<div class="body"><div class="row"><div class="grow"><h3>' + (it.tag ? '<span class="tag">' + it.tag + '</span>' : '') + esc(name) + '</h3>' +
      '<div class="dose">' + esc(doseText(it)) + '</div></div>' + single + '</div>' + flare + (hold ? '<div style="margin-top:6px">' + hold + '</div>' : '') + (boxes || '') + tips + '</div></div>';
  }

  /* strength card with set inputs */
  const sets = d.sets[key] || (d.sets[key] = Array.from({ length: it.sets }, () => ({ w: it.weighted ? lastWeight(it.id) : '', r: '', done: false })));
  const unitLbl = unit();
  const lw = it.weighted ? lastWeight(it.id) : '';
  let rows = '<div class="sets' + (it.weighted ? '' : ' noweight') + '"><span class="hd">Set</span>' + (it.weighted ? '<span class="hd">Weight (' + unitLbl + ')</span>' : '') + '<span class="hd">' + (it.secs ? 'Secs' : 'Reps') + (it.per ? ' per side' : '') + '</span><span class="hd">✓</span>';
  sets.forEach((s, i) => {
    rows += '<span class="n">' + (i + 1) + '</span>' +
      (it.weighted ? '<input type="number" inputmode="decimal" step="0.5" min="0" class="setw" data-key="' + key + '" data-i="' + i + '" value="' + wFmt(s.w) + '" placeholder="' + unitLbl + '" aria-label="Set ' + (i + 1) + ' weight">' : '') +
      '<input type="number" inputmode="numeric" min="0" class="setr" data-key="' + key + '" data-i="' + i + '" value="' + (s.r === '' ? '' : s.r) + '" placeholder="' + it.rmax + '" aria-label="Set ' + (i + 1) + ' reps">' +
      '<input type="checkbox" class="cnt setdone" data-key="' + key + '" data-i="' + i + '"' + (s.done ? ' checked' : '') + ' aria-label="Set ' + (i + 1) + ' done">';
  });
  rows += '</div>';
  const last = it.weighted && lw ? '<div class="small muted">Last time: ' + wFmt(lw) + ' ' + unitLbl + '</div>' : '';
  return '<div class="card" data-card="' + key + '"><div class="ex">' + thumb + '<div class="body"><h3>' + (it.tag ? '<span class="tag">' + it.tag + '</span>' : '') + esc(name) + '</h3>' +
    '<div class="dose">' + esc(doseText(it)) + '</div>' + upBadge + last + (hold ? '<div style="margin-top:6px">' + hold + '</div>' : '') + '</div></div>' + rows + tips + '</div>';
}

function cardioBlock(d) {
  const p = d.cardio || 'treadmill';
  if (IT.preset !== p) Object.assign(IT, { preset: p, work: PRESETS[p].work, rest: PRESETS[p].rest, rounds: PRESETS[p].rounds });
  const chips = Object.keys(PRESETS).map(k => '<button class="chip' + (k === p ? ' sel' : '') + '" data-preset="' + k + '">' + PRESETS[k].name + '<small>' + PRESETS[k].tip + '</small></button>').join('');
  const P = PRESETS[p];
  return '<div class="card"><div class="chips">' + chips + '</div>' +
    '<div class="ex compact"><button class="thumb" data-zoom="' + P.img + '" aria-label="Enlarge picture"><img src="' + IMG(P.img) + '" alt="' + P.name + '"></button>' +
    '<div class="body"><h3>' + P.name + ' — ' + P.tip + '</h3>' +
    (EX[P.img].caption ? '<div class="small muted"><i>' + esc(EX[P.img].caption) + '</i></div>' : '') + '<ul class="cues">' + EX[P.img].cues.map(c => '<li>' + esc(c) + '</li>').join('') + '</ul></div></div>' +
    '<div class="mistake">⚠ Common mistake: ' + esc(EX[P.img].mistake) + '</div>' +
    '<div id="it" class="interval"><div class="ph" id="it-ph"></div><div class="t" id="it-t">00:00</div><div class="small muted" id="it-round"></div></div>' +
    '<div class="row wrap" style="margin-top:8px"><button id="it-go" class="btn primary grow" data-it="start">▶ Start</button><button class="btn" data-it="reset">Reset</button>' +
    '<span class="stepper"><button data-it="rounds-" aria-label="Fewer rounds">−</button><b id="it-rounds-n">7</b><button data-it="rounds+" aria-label="More rounds">+</button><span class="small muted">rounds</span></span></div>' +
    '<label class="checkrow" style="margin-top:10px"><input type="checkbox" class="cnt" data-chk="cardio"' + (d.checks.cardio ? ' checked' : '') + '> Intervals complete</label></div>';
}

function renderWorkout(v) {
  const q = seq(); const nd = nextDay();
  if (!viewDay || (!DAYS[viewDay])) viewDay = (S.draft && S.draft.day) || nd;
  const d = ensureDraft(viewDay);
  d.flare = S.settings.flare;
  const day = DAYS[viewDay];
  const blocks = S.settings.flare ? flareBlocks(viewDay, day.blocks) : day.blocks;
  CUR = { items: {}, day: viewDay, blocks };

  const wkStart = weekStart(new Date()).getTime();
  const doneThisWeek = new Set(S.sessions.filter(s => new Date(s.date) >= wkStart).map(s => s.day));
  const strip = (S.settings.daysPerWeek === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'R', 'C', 'D', 'E']).map(k => {
    if (k === 'R') return '<button class="chip rest" disabled>Rest<small>day</small></button>';
    const opt = k === 'E' && S.settings.daysPerWeek === 4;
    return '<button class="chip' + (k === viewDay ? ' sel' : '') + (doneThisWeek.has(k) ? ' done' : '') + '" data-day="' + k + '">' + k + '<small>' + (k === nd ? 'NEXT' : opt ? 'optional' : '&nbsp;') + '</small></button>';
  }).join('');

  let html = '<div class="chips" role="tablist" aria-label="Pick workout day">' + strip + '</div>' +
    '<div class="sec-title"><h2 style="margin:4px 0">Day ' + viewDay + ' · ' + esc(day.title) + '</h2></div>' +
    '<div class="card"><div class="switch"><label for="flare"><b>Flare-up day</b><div class="small muted">Swaps RDL, rower &amp; split squat for gentler moves</div></label>' +
    '<input type="checkbox" id="flare"' + (S.settings.flare ? ' checked' : '') + '></div></div>' +
    (S.settings.flare ? '<div class="banner flare"><b>Flare-up day is on.</b> Skipping RDL, rower &amp; Bulgarian split squat. Today is gentle walking, bridges, bird dogs, dead bugs and nerve glides — be kind to your body.</div>' : '') +
    '<div class="banner warn"><b>Sciatica safety:</b> stop if pain shoots down your leg or you feel numbness or tingling — no heroics today.</div>' +
    '<div class="card row"><span id="elapsed" class="grow"><b>Not started</b></span><button id="startbtn" class="btn primary small" data-act="start">Let’s go ✦</button></div>';

  html += '<div data-sec="warm"><div class="sec-title"><h2>Warm-up · 5 min</h2><span class="badge" id="cnt-warm"></span></div>' +
    WARM.map((it, i) => exerciseCard(it, 'w' + i + ':' + it.id, 'warm', d)).join('') + '</div>';

  blocks.forEach((b, bi) => {
    html += '<div data-sec="main' + bi + '" class="mainsec"><div class="sec-title"><h2>' + esc(b.title) + '</h2><span class="badge" id="cnt-main' + bi + '"></span></div>';
    if (b.cardio) html += cardioBlock(d);
    b.items.forEach((it, i) => { html += exerciseCard(it, 'm' + bi + '.' + i + ':' + it.id, 'main', d); });
    html += '</div>';
  });

  const cool = COOL.slice(); if (S.settings.flare) cool.push({ id: 'nerve-glide', name: 'Extra nerve glides (flare-day bonus round)', dose: '10 slow reps/side', flareSwap: true });
  html += '<div data-sec="cool"><div class="sec-title"><h2>Cool-down · 5 min</h2><span class="badge" id="cnt-cool"></span></div>' +
    cool.map((it, i) => exerciseCard(it, 'c' + i + ':' + it.id, 'cool', d)).join('') + '</div>';

  html += '<div class="banner info"><b>Level-up rule:</b> Hit the top of the rep range on all sets with good form → add weight next time. Ticking a set pre-fills the target reps (shown in italics) — tap the box and type to change it if you did fewer.</div>' +
    '<button class="btn primary block" data-act="finish" style="margin-top:12px">Done &amp; dusted!</button>' +
    '<p class="footer-note">Ribs down, tailbone tucked, glutes squeezed. This plan is not a substitute for a physical therapist.</p>';
  v.innerHTML = html;
  save(); updateCounts(); updateElapsed(); renderIT();
}

function updateCounts() {
  $$('[data-sec]').forEach(sec => {
    const boxes = $$('input.cnt', sec); const n = boxes.filter(b => b.checked).length;
    const badge = $('.badge', sec); if (badge) badge.textContent = n + '/' + boxes.length;
  });
}

/* ------------------------------------------------------------------ workout events */
document.addEventListener('click', e => {
  const t = e.target;
  const z = t.closest('[data-zoom]'); if (z) return zoom(z.dataset.zoom);
  const dayBtn = t.closest('[data-day]');
  if (dayBtn) {
    const nd = dayBtn.dataset.day; if (nd === viewDay) return;
    if (hasActivity(S.draft) && S.draft.day !== nd && !confirm('Switch day and discard the workout in progress?')) return;
    if (S.draft && S.draft.day !== nd) S.draft = null;
    viewDay = nd; itReset(); return render();
  }
  const pr = t.closest('[data-preset]'); if (pr) { ensureDraft(viewDay).cardio = pr.dataset.preset; itPreset(pr.dataset.preset); save(); return render(); }
  const it = t.closest('[data-it]');
  if (it) {
    const a = it.dataset.it;
    if (a === 'start') itStart(); else if (a === 'pause') itPause(); else if (a === 'reset') itReset();
    else if (a === 'rounds+') { IT.rounds = Math.min(15, IT.rounds + 1); renderIT(); } else if (a === 'rounds-') { IT.rounds = Math.max(1, IT.rounds - 1); renderIT(); }
    return;
  }
  const hold = t.closest('[data-hold]'); if (hold) return startCountdown(hold.dataset.label, +hold.dataset.hold);
  const act = t.closest('[data-act]');
  if (act) {
    if (act.dataset.act === 'start') { startIfNeeded(); save(); }
    else if (act.dataset.act === 'finish') finishDialog();
  }
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'flare') { S.settings.flare = t.checked; save(); return render(); }
  if (!S.draft) return;
  if (t.dataset && t.dataset.chk) {
    S.draft.checks[t.dataset.chk] = t.checked; startIfNeeded();
    const card = t.closest('.card.compact'); if (card && !t.closest('.row.wrap')) card.classList.toggle('done', t.checked);
    save(); updateCounts(); return;
  }
  if (t.classList.contains('setdone')) {
    const arr = S.draft.sets[t.dataset.key]; if (!arr) return; const s = arr[+t.dataset.i]; const it = CUR.items[t.dataset.key];
    s.done = t.checked; startIfNeeded();
    if (t.checked && (s.r === '' || s.r == null) && it) { s.r = it.secs && it.rmin !== it.rmax ? it.rmin : it.rmax; const ri = $('.setr[data-key="' + t.dataset.key + '"][data-i="' + t.dataset.i + '"]'); if (ri) { ri.value = s.r; ri.classList.add('auto'); } }
    if (t.checked) toast('Nailed it ✓');
    if (t.checked && S.settings.autoRest) startCountdown('Rest', S.settings.restSecs);
    save(); updateCounts(); return;
  }
});
document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('setr')) setTimeout(() => e.target.select && e.target.select(), 0); });
document.addEventListener('input', e => {
  const t = e.target; if (!S.draft || !t.dataset || t.dataset.i === undefined) return;
  const arr = S.draft.sets[t.dataset.key]; if (!arr) return; const s = arr[+t.dataset.i];
  if (t.classList.contains('setw')) s.w = t.value === '' ? '' : fromDisp(parseFloat(t.value));
  else if (t.classList.contains('setr')) { t.classList.remove('auto'); s.r = t.value === '' ? '' : parseFloat(t.value); if (t.value !== '') startIfNeeded(); }
  save();
});

/* finish */
function painPicker(val) {
  let h = '<div class="row wrap pp" style="gap:6px">';
  for (let i = 0; i <= 10; i++) h += '<button type="button" class="btn small' + (val === i ? ' primary' : '') + '" data-p="' + i + '" style="min-width:44px">' + i + '</button>';
  return h + '</div><div class="small muted">0 = none, 10 = worst. Tap again to clear.</div>';
}
function bindPain(root, init) {
  let cur = init == null ? null : init;
  root.querySelectorAll('.pp button').forEach(b => b.addEventListener('click', () => {
    const p = +b.dataset.p; cur = cur === p ? null : p;
    root.querySelectorAll('.pp button').forEach(x => x.classList.toggle('primary', +x.dataset.p === cur));
  }));
  return () => cur;
}

function finishDialog() {
  if (!S.draft) return;
  const entries = buildEntries();
  if (!entries.length && !Object.values(S.draft.checks).some(Boolean) && !confirm('Nothing is ticked yet. Save an empty session anyway?')) return;
  const mins = Math.max(1, Math.round(elapsedSec() / 60));
  openDlg('<h2 style="margin-top:0">Finish Day ' + S.draft.day + '</h2>' +
    '<label class="f">Duration (minutes)</label><input type="number" class="plain" id="f-min" min="0" inputmode="numeric" value="' + mins + '">' +
    '<label class="f">Pain level during / after (optional)</label>' + painPicker(null) +
    '<div class="banner warn small">Pain shooting down your leg, numbness or tingling? Stop and consider seeing your physical therapist.</div>' +
    '<label class="f">Notes (optional)</label><textarea id="f-notes" placeholder="How did it feel? Any tweaks?"></textarea>' +
    '<div class="row" style="margin-top:12px"><button class="btn grow" data-close>Back</button><button class="btn primary grow" id="f-save">Save workout</button></div>',
  root => {
    const getPain = bindPain(root, null);
    $('#f-save', root).addEventListener('click', () => {
      const d = S.draft;
      const sess = { id: uid(), date: new Date().toISOString(), day: d.day, flare: !!S.settings.flare, durationSec: Math.round((parseFloat($('#f-min', root).value) || 0) * 60),
        pain: getPain(), notes: $('#f-notes', root).value.trim(), entries };
      if (d.day === 'D' && d.checks.cardio && !S.settings.flare) sess.cardio = { type: d.cardio || IT.preset, work: IT.work, rest: IT.rest, rounds: IT.rounds };
      sess.warmDone = $$('[data-sec="warm"] input.cnt:checked').length; sess.coolDone = $$('[data-sec="cool"] input.cnt:checked').length;
      S.sessions.push(sess); S.draft = null; viewDay = null; save(); dlg.close(); itReset(); stopCountdown();
      toast('Workout saved — nicely done ✦'); tab = 'progress'; render();
    });
  });
}
function buildEntries() {
  const d = S.draft; const out = [];
  (CUR.blocks || []).forEach((b, bi) => b.items.forEach((it, i) => {
    const key = 'm' + bi + '.' + i + ':' + it.id;
    if (it.checkOnly) {
      let n = 0; if (it.sets > 1) for (let k = 0; k < it.sets; k++) { if (d.checks[key + '#' + k]) n++; } else if (d.checks[key]) n = 1;
      if (n) out.push({ ex: it.id, planSets: it.sets, checkOnly: true, sets: Array.from({ length: n }, () => ({ done: true })) });
      return;
    }
    const arr = d.sets[key]; if (!arr) return;
    const keep = arr.filter(s => s.done || (s.r !== '' && s.r != null));
    if (!keep.length) return;
    out.push({ ex: it.id, planSets: it.sets, rmax: it.rmax, weighted: !!it.weighted, secs: !!it.secs,
      sets: keep.map(s => ({ w: it.weighted && s.w !== '' && s.w != null ? +(+s.w).toFixed(2) : null, r: s.r === '' ? null : +s.r, done: !!s.done })) });
  }));
  return out;
}

/* ------------------------------------------------------------------ progress */
function niceTicks(lo, hi, n) {
  const range = (hi - lo) || 1; const raw = range / n; const mag = Math.pow(10, Math.floor(Math.log10(raw))); const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out = []; for (let v = Math.floor(lo / step) * step; v <= Math.ceil(hi / step) * step + 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}
function lineChart(pts, o) {
  if (!pts.length) return '<p class="muted small">No data yet — finish a workout and your progress shows up here.</p>';
  const W = 640, H = 250, L = 46, R = 22, T = 22, B = 34;
  let t0 = pts[0].t, t1 = pts[pts.length - 1].t; if (t0 === t1) { t0 -= 864e5; t1 += 864e5; }
  let lo = o.yMin != null ? o.yMin : Math.min.apply(null, pts.map(p => p.y)), hi = o.yMax != null ? o.yMax : Math.max.apply(null, pts.map(p => p.y));
  if (o.yMin == null) { const pd = (hi - lo) || Math.max(1, hi * 0.2); lo = Math.max(0, lo - pd * 0.25); hi = hi + pd * 0.25; }
  const ticks = niceTicks(lo, hi, 4); lo = ticks[0]; hi = ticks[ticks.length - 1]; if (hi === lo) hi = lo + 1;
  const x = t => L + (t - t0) / (t1 - t0) * (W - L - R), y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label) + '">';
  ticks.forEach(tk => { s += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(tk) + '" y2="' + y(tk) + '"/><text x="' + (L - 6) + '" y="' + (y(tk) + 4) + '" text-anchor="end">' + tk + '</text>'; });
  const idxs = pts.length <= 5 ? pts.map((_, i) => i) : [0, 1, 2, 3, 4].map(k => Math.round(k * (pts.length - 1) / 4));
  Array.from(new Set(idxs)).forEach(i => { const dt = new Date(pts[i].t); s += '<text x="' + x(pts[i].t) + '" y="' + (H - 10) + '" text-anchor="middle">' + (dt.getMonth() + 1) + '/' + dt.getDate() + '</text>'; });
  const c = o.c2 ? ' c2' : '';
  s += '<polyline class="line' + c + '" points="' + pts.map(p => x(p.t).toFixed(1) + ',' + y(p.y).toFixed(1)).join(' ') + '"/>';
  pts.forEach((p, i) => { s += '<circle class="pt' + c + '" cx="' + x(p.t).toFixed(1) + '" cy="' + y(p.y).toFixed(1) + '" r="4.5"><title>' + esc(p.tip) + '</title></circle>'; });
  const lp = pts[pts.length - 1]; s += '<text class="lastlbl" x="' + Math.min(W - R, x(lp.t)) + '" y="' + (y(lp.y) - 10) + '" text-anchor="' + (x(lp.t) > W - 50 ? 'end' : 'middle') + '">' + lp.lbl + '</text>';
  return s + '</svg>';
}

function weekCount(d) { const ws = weekStart(d).getTime(), we = ws + 7 * 864e5; return S.sessions.filter(s => { const t = new Date(s.date).getTime(); return t >= ws && t < we; }).length; }
function weekStreak() {
  const goal = S.settings.daysPerWeek; let w = weekStart(new Date()); let n = 0;
  if (weekCount(w) < goal) w.setDate(w.getDate() - 7);
  while (weekCount(w) >= goal) { n++; w.setDate(w.getDate() - 7); }
  return n;
}

function renderProgress(v) {
  const goal = S.settings.daysPerWeek; const cnt = weekCount(new Date());
  const ss = sessionsSorted();
  const exWith = {}; ss.forEach(s => (s.entries || []).forEach(en => { if (en.weighted && en.sets.some(z => z.done && z.w > 0)) exWith[en.ex] = true; }));
  const exList = Object.keys(exWith); if (!progEx || !exWith[progEx]) progEx = exList[0] || null;

  let h = '<h2 style="margin-top:4px">This week</h2><div class="card"><div class="row"><b class="grow">' + cnt + ' of ' + goal + ' workouts</b><span class="muted small">goal ' + goal + '/week</span></div>' +
    '<div class="bar" style="margin-top:8px"><i style="width:' + Math.min(100, cnt / goal * 100) + '%"></i></div></div>' +
    '<div class="streak">' + (weekStreak() > 0 ? 'You’re on fire 🔥 ' + weekStreak() + (weekStreak() === 1 ? ' week' : ' weeks') + ' in a row' : 'Your streak starts with one workout') + '<small>Hit your ' + goal + ' workouts a week to keep it going</small></div>' +
    '<div class="stats"><div class="stat"><b>' + weekStreak() + '</b><span>week streak</span></div><div class="stat"><b>' + S.sessions.length + '</b><span>total sessions</span></div><div class="stat"><b>' + (ss.length ? fmtDate(ss[ss.length - 1].date, { month: 'short', day: 'numeric' }) : '—') + '</b><span>last workout</span></div></div>';

  /* calendar */
  const y = calMonth.getFullYear(), m = calMonth.getMonth(); const first = new Date(y, m, 1); const lead = (first.getDay() + 6) % 7; const dim = new Date(y, m + 1, 0).getDate();
  const byDay = {}; S.sessions.forEach(s => { const k = dkey(new Date(s.date)); (byDay[k] = byDay[k] || []).push(s.day); });
  h += '<h2>Calendar</h2><div class="card"><div class="row" style="justify-content:space-between"><button class="btn small" data-cal="-1" aria-label="Previous month">‹</button><b>' + calMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) + '</b><button class="btn small" data-cal="1" aria-label="Next month">›</button></div><div class="spacer"></div><div class="cal">' +
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(x => '<div class="dow">' + x + '</div>').join('');
  for (let i = 0; i < lead; i++) h += '<div class="d off"></div>';
  const tk = dkey(new Date());
  for (let d = 1; d <= dim; d++) { const k = y + '-' + pad(m + 1) + '-' + pad(d); const has = byDay[k];
    h += '<div class="d' + (has ? ' has' : '') + (k === tk ? ' today' : '') + '"' + (has ? ' title="Day ' + has.join(', ') + '"' : '') + '>' + d + (has ? '<small>' + has.join('') + '</small>' : '') + '</div>'; }
  h += '</div></div>';

  /* weight chart */
  h += '<h2>Strength progress</h2><div class="card">';
  if (exList.length) {
    h += '<select id="progex" aria-label="Exercise">' + exList.map(id => '<option value="' + id + '"' + (id === progEx ? ' selected' : '') + '>' + esc(exName(id)) + '</option>').join('') + '</select><div class="small muted" style="margin:6px 0">Top set per session, in ' + unit() + '</div>';
    const pts = []; ss.forEach(s => { (s.entries || []).filter(en => en.ex === progEx).forEach(en => { const ws = en.sets.filter(z => z.done && z.w > 0).map(z => toDisp(z.w)); if (ws.length) { const mx = Math.max.apply(null, ws); pts.push({ t: new Date(s.date).getTime(), y: mx, lbl: mx + ' ' + unit(), tip: fmtDate(s.date) + ': ' + mx + ' ' + unit() }); } }); });
    h += lineChart(pts, { label: 'Weight over time for ' + exName(progEx) });
  } else h += '<p class="muted small">Log weighted sets and finish a workout to see this chart.</p>';
  h += '</div>';

  /* pain chart */
  const pp = ss.filter(s => s.pain != null).map(s => ({ t: new Date(s.date).getTime(), y: s.pain, lbl: String(s.pain), tip: fmtDate(s.date) + ': pain ' + s.pain + '/10' }));
  h += '<h2>Pain check-in</h2><div class="card">' + (pp.length ? '<div class="small muted">Pain level (0–10) at the end of each session</div>' : '') + lineChart(pp, { yMin: 0, yMax: 10, c2: true, label: 'Pain level over time' }) + '</div>';

  /* history */
  h += '<h2>History</h2>';
  if (!ss.length) h += '<div class="card muted">Nothing logged yet — your first workout is waiting for you.</div>';
  ss.slice().reverse().forEach(s => {
    const pc = s.pain == null ? '' : '<span class="pain ' + (s.pain <= 2 ? 'p0' : s.pain <= 5 ? 'p1' : 'p2') + '">Pain ' + s.pain + '/10</span>';
    const lines = (s.entries || []).map(en => {
      const nm = esc(exName(en.ex));
      if (en.checkOnly) return '<li>' + nm + ': ✓ ×' + en.sets.length + '</li>';
      const parts = en.sets.map(z => (en.weighted && z.w ? toDisp(z.w) + '×' : '') + (z.r == null ? '–' : z.r) + (z.done ? '' : '?'));
      return '<li>' + nm + ': ' + parts.join(', ') + (en.weighted ? ' <span class="muted">' + unit() + '</span>' : '') + '</li>';
    }).join('');
    h += '<div class="card hist"><div class="top"><div><b>' + fmtDate(s.date) + '</b> · Day ' + esc(s.day) + (s.flare ? ' <span class="badge warn">flare</span>' : '') + '<div class="small muted">' + esc((DAYS[s.day] || {}).title || '') + ' · ' + Math.round((s.durationSec || 0) / 60) + ' min</div></div>' + pc + '</div>' +
      (s.notes ? '<div class="small" style="margin-top:6px">“' + esc(s.notes) + '”</div>' : '') +
      '<details class="tips"><summary>Details</summary><ul class="cues">' + (lines || '<li class="muted">No sets recorded</li>') + '</ul></details>' +
      '<div class="row"><button class="btn small grow" data-edit="' + s.id + '">Edit</button><button class="btn small danger grow" data-del="' + s.id + '">Delete</button></div></div>';
  });
  h += '<p class="footer-note">Export / import backups from the Settings tab.</p>';
  v.innerHTML = h;
}
document.addEventListener('change', e => { if (e.target.id === 'progex') { progEx = e.target.value; render(); } });
document.addEventListener('click', e => {
  const c = e.target.closest('[data-cal]'); if (c) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + +c.dataset.cal, 1); render(); return; }
  const del = e.target.closest('[data-del]');
  if (del) { if (confirm('Delete this workout from your history?')) { S.sessions = S.sessions.filter(s => s.id !== del.dataset.del); save(); render(); toast('Deleted'); } return; }
  const ed = e.target.closest('[data-edit]'); if (ed) editDialog(ed.dataset.edit);
});

function editDialog(id) {
  const s = S.sessions.find(x => x.id === id); if (!s) return;
  const d = new Date(s.date);
  let rows = '';
  (s.entries || []).forEach((en, ei) => {
    if (en.checkOnly) return;
    rows += '<div class="card" style="margin:6px 0"><b>' + esc(exName(en.ex)) + '</b><div class="sets' + (en.weighted ? '' : ' noweight') + '"><span class="hd">Set</span>' + (en.weighted ? '<span class="hd">Weight (' + unit() + ')</span>' : '') + '<span class="hd">' + (en.secs ? 'Secs' : 'Reps') + '</span><span class="hd">✓</span>';
    en.sets.forEach((z, si) => {
      rows += '<span class="n">' + (si + 1) + '</span>' + (en.weighted ? '<input type="number" inputmode="decimal" step="0.5" data-e="' + ei + '.' + si + '.w" data-orig="' + (z.w ? toDisp(z.w) : '') + '" value="' + (z.w ? toDisp(z.w) : '') + '">' : '') +
        '<input type="number" inputmode="numeric" data-e="' + ei + '.' + si + '.r" value="' + (z.r == null ? '' : z.r) + '"><input type="checkbox" data-e="' + ei + '.' + si + '.d"' + (z.done ? ' checked' : '') + '>';
    });
    rows += '</div></div>';
  });
  openDlg('<h2 style="margin-top:0">Edit workout</h2><label class="f">Date</label><input type="date" id="e-date" value="' + dkey(d) + '">' +
    '<label class="f">Day</label><select id="e-day">' + Object.keys(DAYS).map(k => '<option value="' + k + '"' + (k === s.day ? ' selected' : '') + '>Day ' + k + ' — ' + esc(DAYS[k].title) + '</option>').join('') + '</select>' +
    '<label class="f">Duration (minutes)</label><input type="number" class="plain" id="e-min" value="' + Math.round((s.durationSec || 0) / 60) + '">' +
    '<label class="f">Pain level (optional)</label>' + painPicker(s.pain) +
    '<label class="f">Notes</label><textarea id="e-notes">' + esc(s.notes || '') + '</textarea>' +
    (rows ? '<label class="f">Sets</label>' + rows : '') +
    '<div class="row" style="margin-top:12px"><button class="btn grow" data-close>Cancel</button><button class="btn primary grow" id="e-save">Save</button></div>',
  root => {
    const getPain = bindPain(root, s.pain);
    $('#e-save', root).addEventListener('click', () => {
      const dv = $('#e-date', root).value;
      if (dv) { const [yy, mm, dd] = dv.split('-').map(Number); const nd = new Date(s.date); nd.setFullYear(yy, mm - 1, dd); s.date = nd.toISOString(); }
      s.day = $('#e-day', root).value; s.durationSec = Math.round((parseFloat($('#e-min', root).value) || 0) * 60); s.pain = getPain(); s.notes = $('#e-notes', root).value.trim();
      $$('[data-e]', root).forEach(inp => {
        const [ei, si, f] = inp.dataset.e.split('.'); const z = s.entries[+ei].sets[+si];
        if (f === 'd') z.done = inp.checked; else if (f === 'r') z.r = inp.value === '' ? null : +inp.value; else if (inp.value !== inp.dataset.orig) z.w = inp.value === '' ? null : +fromDisp(+inp.value).toFixed(2);
      });
      save(); dlg.close(); render(); toast('Saved ✓');
    });
  });
}

/* ------------------------------------------------------------------ library */
function renderLibrary(v) {
  const cats = []; Object.keys(EX).forEach(id => { const c = EX[id].cat; if (cats.indexOf(c) < 0) cats.push(c); });
  let h = '<h2 style="margin-top:4px">Exercise library</h2><input type="text" id="libq" placeholder="Search exercises…" style="margin-bottom:8px">';
  cats.forEach(c => {
    h += '<h2 data-libcat>' + esc(c) + '</h2>';
    Object.keys(EX).filter(id => EX[id].cat === c).forEach(id => {
      const e = EX[id];
      h += '<div class="card" data-lib="' + esc((e.name + ' ' + c).toLowerCase()) + '"><img class="lib-img" data-zoom="' + id + '" src="' + IMG(id) + '" alt="' + esc(e.name) + ' form" loading="lazy">' +
        '<h3>' + esc(e.name) + (e.flare ? ' <span class="badge warn">Skip on flare days</span>' : '') + '</h3>' + (e.caption ? '<div class="small muted"><i>' + esc(e.caption) + '</i></div>' : '') + '<ul class="cues">' + e.cues.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul><div class="mistake">⚠ Common mistake: ' + esc(e.mistake) + '</div></div>';
    });
  });
  v.innerHTML = h + '<p class="footer-note">Illustrations are AI-generated guides — check against a trusted source or your physical therapist if unsure.</p>';
}
document.addEventListener('input', e => {
  if (e.target.id !== 'libq') return; const q = e.target.value.trim().toLowerCase();
  $$('[data-lib]').forEach(c => { c.hidden = q && c.dataset.lib.indexOf(q) < 0; });
  $$('[data-libcat]').forEach(hd => { let n = hd.nextElementSibling, any = false; while (n && n.hasAttribute('data-lib')) { if (!n.hidden) any = true; n = n.nextElementSibling; } hd.hidden = !any; });
});

/* ------------------------------------------------------------------ settings / backup */
function renderSettings(v) {
  const st = S.settings;
  const seg = (name, opts, val) => '<div class="seg">' + opts.map(o => '<button data-set="' + name + '" data-val="' + o[0] + '" class="' + (String(val) === String(o[0]) ? 'sel' : '') + '">' + o[1] + '</button>').join('') + '</div>';
  v.innerHTML = '<h2 style="margin-top:4px">Settings</h2>' +
    '<div class="card"><label class="f" style="margin-top:0">Weight unit</label>' + seg('unit', [['lb', 'lb'], ['kg', 'kg']], st.unit) +
    '<label class="f">Workout days per week</label>' + seg('daysPerWeek', [[4, '4 days (A B rest C D)'], [5, '5 days (A–E)']], st.daysPerWeek) +
    '<label class="f">Rest timer length</label>' + seg('restSecs', [[45, '45s'], [60, '60s']], st.restSecs) +
    '<div class="switch" style="margin-top:8px"><label for="autorest">Auto-start rest timer when I tick a set</label><input type="checkbox" id="autorest"' + (st.autoRest ? ' checked' : '') + '></div>' +
    '<div class="switch"><label for="flare2">Flare-up day mode</label><input type="checkbox" id="flare2"' + (st.flare ? ' checked' : '') + '></div></div>' +
    '<h2>Backup</h2><div class="card"><p class="small muted" style="margin-top:0">Your data lives only in this browser. Export a backup now and then (or before clearing browser data).</p>' +
    '<div class="row wrap"><button class="btn primary grow" id="exp">Export JSON</button><button class="btn grow" id="imp">Import JSON</button></div>' +
    '<div class="row wrap" style="margin-top:8px"><button class="btn small grow" id="copy">Copy JSON to clipboard</button></div>' +
    '<input type="file" id="impfile" accept="application/json,.json" hidden></div>' +
    '<h2>Reset</h2><div class="card"><button class="btn danger block" id="clear">Clear all data</button></div>' +
    '<div class="banner warn small"><b>Disclaimer:</b> This app is not a substitute for a physical therapist. Stop and seek advice if pain shoots down your leg or you notice numbness or tingling.</div>' +
    '<p class="footer-note">Gym Buddy · data stored locally in this browser (' + S.sessions.length + ' sessions)</p>';
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-set]');
  if (b) { const k = b.dataset.set; let val = b.dataset.val; if (k !== 'unit') val = +val; S.settings[k] = val; save(); if (k === 'daysPerWeek') viewDay = null; render(); return; }
  const id = e.target.id;
  if (id === 'exp') exportJSON();
  else if (id === 'imp') $('#impfile').click();
  else if (id === 'copy') { const txt = JSON.stringify(S, null, 2); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Copied'), () => toast('Copy not available — use Export')); }
  else if (id === 'clear') { if (confirm('Delete ALL workouts and settings? Export a backup first if unsure.') && confirm('Really delete everything?')) { localStorage.removeItem(KEY); S = normalize({}); viewDay = null; progEx = null; toast('All data cleared'); render(); } }
});
document.addEventListener('change', e => {
  if (e.target.id === 'autorest') { S.settings.autoRest = e.target.checked; save(); }
  else if (e.target.id === 'flare2') { S.settings.flare = e.target.checked; save(); }
  else if (e.target.id === 'impfile') {
    const f = e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result); if (!data || !Array.isArray(data.sessions)) throw new Error('bad');
        const clean = data.sessions.filter(s => s && s.date && s.day).map(s => Object.assign({ id: uid(), entries: [] }, s));
        openDlg('<h2 style="margin-top:0">Import backup</h2><p>Found ' + clean.length + ' sessions.</p><div class="row wrap"><button class="btn primary grow" id="i-merge">Merge with current</button><button class="btn danger grow" id="i-replace">Replace everything</button></div><button class="btn block" data-close style="margin-top:8px">Cancel</button>', root => {
          $('#i-merge', root).addEventListener('click', () => { const have = new Set(S.sessions.map(s => s.id)); clean.forEach(s => { if (!have.has(s.id)) S.sessions.push(s); }); save(); dlg.close(); render(); toast('Merged ✓'); });
          $('#i-replace', root).addEventListener('click', () => { S = normalize({ settings: data.settings, sessions: clean }); save(); dlg.close(); viewDay = null; render(); toast('Imported ✓'); });
        });
      } catch (err) { toast('That file is not a valid Gym Buddy backup'); }
      e.target.value = '';
    };
    r.readAsText(f);
  }
});
function exportJSON() {
  const out = { app: 'gym-buddy', version: 1, exportedAt: new Date().toISOString(), settings: S.settings, sessions: S.sessions };
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'gym-buddy-' + dkey(new Date()) + '.json';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('Backup exported');
}

/* ------------------------------------------------------------------ boot */
$$('.tabs button').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
window.__gb = { get S() { return S; }, render };
const MOTTOS = [
  'Every rep is a gift to future you ✦',
  'Strong body, calm back, unstoppable you',
  '30 minutes. Zero excuses. Let\'s go!',
  'Progress, not perfection',
  'You showed up. That\'s the hardest part done',
  'Stronger than yesterday ✦',
  'Small wins add up to big change',
  'Your future self is cheering you on',
  'Move well today, feel amazing tomorrow',
  'Consistency is your superpower'
];
(() => { const m = document.getElementById('motto'); if (m) { const d = new Date(); const day = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5); m.textContent = MOTTOS[day % MOTTOS.length]; } })();
render();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})();
