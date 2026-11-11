/* Gym Buddy — social layer (Google sign-in, squads, live strip, leaderboard, feed).
   Optional: if this module fails to load, or you never sign in, the app works exactly as before (solo, localStorage).
   Privacy: pain, notes and weights only ever go to users/{uid}/sessions (owner-only). Squads see names, photos,
   day/exercise/set progress, counts, streak, finish events and cheers. */
import { initializeApp } from './vendor/firebase-app.js';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from './vendor/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  writeBatch, onSnapshot, query, orderBy, limit, serverTimestamp, deleteField } from './vendor/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const G = window.__gb;
if (!G) throw new Error('Gym Buddy core not loaded');

const LIVE_URL = 'https://ybhat-sys.github.io/gym-buddy/';
const BASE = location.hostname.endsWith('github.io') ? location.origin + location.pathname : LIVE_URL;
const PENDING = 'gymbuddy.pendingJoin';
const LIVE_TTL = 15 * 60 * 1000;
const esc = G.esc;
const $ = (s, r) => (r || document).querySelector(s);

let app, auth, db;
try {
  const cfg = Object.assign({}, firebaseConfig);
  app = initializeApp(cfg);
  auth = getAuth(app);
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }), ignoreUndefinedProperties: true });
} catch (e) { console.warn('Social features unavailable', e); }

let user = null;          // firebase user
let profile = null;       // users/{uid} doc data
let ready = false;        // auth state known
let group = null, members = {}, feed = [], groupErr = null;
let unsubs = { profile: null, sessions: null, group: [] };
let watchedGid = null;
let boardSort = 'week';

/* ------------------------------------------------------------ helpers */
const myName = () => (profile && profile.displayName) || (user && user.displayName) || 'Me';
const myPhoto = () => (user && user.photoURL) || null;
const groups = () => (profile && profile.groups) || {};
const activeGid = () => { const g = groups(); const a = profile && profile.activeGroup; return a && g[a] ? a : (Object.keys(g)[0] || null); };
function initials(n) { return String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'; }
function avatar(name, url, cls) {
  const ini = '<span class="av-ini">' + esc(initials(name)) + '</span>';
  return '<span class="av ' + (cls || '') + '">' + (url ? '<img src="' + esc(url) + '" alt="" referrerpolicy="no-referrer" onerror="this.remove()">' : '') + ini + '</span>';
}
function ago(ms) {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' h ago'; const d = Math.floor(s / 86400); return d === 1 ? 'yesterday' : d + ' days ago';
}
const tsMs = t => (t && typeof t.toMillis === 'function') ? t.toMillis() : (typeof t === 'number' ? t : 0);
function genCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const r = new Uint8Array(8); crypto.getRandomValues(r);
  return Array.from(r, x => A[x % A.length]).join('');
}
function stable(v) {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}
const online = () => navigator.onLine !== false;
function weekDiff(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / (7 * 864e5)); }

/* ------------------------------------------------------------ auth */
/* Sign-in: popup first, redirect only as a fallback.
   The auth helper lives on gym-buddy-369d8.firebaseapp.com, a different site from github.io. Browsers now partition
   third-party storage, so a cross-site redirect sign-in can come back with no result; a popup hands the result back
   to this page directly and works in Chrome on Android, including the installed app. */
async function signIn() {
  if (!auth) return G.toast('Sign-in is unavailable right now');
  if (!online()) return G.toast('You’re offline — sign in once you’re connected');
  const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
  try { await signInWithPopup(auth, p); }
  catch (e) {
    const c = e && e.code || '';
    if (/popup-blocked|operation-not-supported|web-storage-unsupported/.test(c)) {
      try { await signInWithRedirect(auth, p); } catch (e2) { console.warn(e2); G.toast('Could not sign in — please try again'); }
    } else if (!/popup-closed|cancelled-popup/.test(c)) { console.warn(e); G.toast('Could not sign in — please try again'); }
  }
}
async function doSignOut() {
  if (!confirm('Sign out? Your workouts stay on this phone, and your squad stops seeing your progress until you sign back in.')) return;
  await endLive();
  try { await signOut(auth); } catch (e) { /* ignore */ }
}

if (auth) {
  getRedirectResult(auth).catch(e => { console.warn(e); if (e && e.code && !/no-auth-event|redirect-cancelled/.test(e.code)) G.toast('Could not finish signing in — please try again'); });
  onAuthStateChanged(auth, u => {
    ready = true;
    stopAll();
    user = u; profile = null; group = null; members = {}; feed = [];
    if (u) startUser(u);
    paint();
  });
}

function stopAll() {
  if (unsubs.profile) unsubs.profile(); if (unsubs.sessions) unsubs.sessions();
  unsubs.group.forEach(f => f()); unsubs = { profile: null, sessions: null, group: [] }; watchedGid = null;
}

function startUser(u) {
  const ref = doc(db, 'users', u.uid);
  unsubs.profile = onSnapshot(ref, snap => {
    if (!snap.exists()) {
      if (!snap.metadata.fromCache) setDoc(ref, { displayName: u.displayName || 'Gym buddy', groups: {}, activeGroup: null, createdAt: serverTimestamp() }, { merge: true }).catch(warn);
      profile = profile || { displayName: u.displayName, groups: {} };
    } else profile = snap.data();
    watchGroup(); paint(); pushStats(); maybePendingJoin();
  }, warn);
  startSessionSync(u.uid);
}
const warn = e => console.warn('[social]', e && e.code, e && e.message);

/* ------------------------------------------------------------ private session sync (owner-only) */
function cleanRemote(r) { const o = Object.assign({}, r); delete o.deleted; delete o.syncedAt; return o; }
function putSession(s) { if (!user) return; return setDoc(doc(db, 'users', user.uid, 'sessions', s.id), Object.assign({}, s, { syncedAt: serverTimestamp() })).catch(warn); }
function startSessionSync(uid) {
  let first = true;
  unsubs.sessions = onSnapshot(collection(db, 'users', uid, 'sessions'), { includeMetadataChanges: true }, snap => {
    const S = G.S; let changed = false;
    if (first) {
      if (snap.metadata.fromCache && online()) return; // wait for the server view before merging
      first = false;
      const remote = new Map(); snap.forEach(d => remote.set(d.id, d.data()));
      const keep = [];
      S.sessions.forEach(s => {
        const r = remote.get(s.id);
        if (r && r.deleted) { changed = true; return; }           // deleted on another device
        if (!r || stable(cleanRemote(r)) !== stable(s)) putSession(s); // first sign-in migration / local edits
        keep.push(s);
      });
      const have = new Set(keep.map(s => s.id));
      remote.forEach((r, id) => { if (!r.deleted && !have.has(id) && r.date && r.day) { keep.push(cleanRemote(r)); changed = true; } });
      S.sessions = keep;
    } else {
      snap.docChanges().forEach(ch => {
        if (ch.doc.metadata.hasPendingWrites) return;
        const r = ch.doc.data(), id = ch.doc.id; const i = S.sessions.findIndex(s => s.id === id);
        if (ch.type === 'removed' || r.deleted) { if (i >= 0) { S.sessions.splice(i, 1); changed = true; } return; }
        const c = cleanRemote(r);
        if (i >= 0) { if (stable(S.sessions[i]) !== stable(c)) { S.sessions[i] = c; changed = true; } }
        else if (c.date && c.day) { S.sessions.push(c); changed = true; }
      });
    }
    if (changed) { G.save(); if (G.tab !== 'workout') G.render(); pushStats(); }
  }, warn);
}
window.addEventListener('gb:session-saved', e => { putSession(e.detail.session); pushStats(); });
window.addEventListener('gb:session-deleted', e => {
  if (user) setDoc(doc(db, 'users', user.uid, 'sessions', e.detail.id), { deleted: true, syncedAt: serverTimestamp() }).catch(warn);
  pushStats();
});
window.addEventListener('gb:sessions-changed', () => { if (user) G.S.sessions.forEach(putSession); pushStats(); });

/* ------------------------------------------------------------ shared: stats + live + feed */
function memberRef(gid) { return doc(db, 'groups', gid, 'members', user.uid); }
function forEachGroup(fn) { if (!user || !profile) return []; return Object.keys(groups()).map(gid => fn(gid).catch(err => onGroupWriteError(gid, err))); }
function onGroupWriteError(gid, err) {
  warn(err);
  if (err && err.code === 'permission-denied') dropGroup(gid, 'You’re no longer in ' + (groups()[gid] || 'that squad'));
}
let statsT = null;
function pushStats() {
  clearTimeout(statsT);
  statsT = setTimeout(() => {
    const st = G.socialStats();
    forEachGroup(gid => setDoc(memberRef(gid), { displayName: myName(), photoURL: myPhoto(), updatedAt: serverTimestamp(),
      stats: { weekKey: st.weekKey, workoutsThisWeek: st.workoutsThisWeek, setsThisWeek: st.setsThisWeek, streak: st.streak, total: st.total, goal: st.goal } }, { merge: true }));
  }, 1200);
}
let liveT = null, liveLast = 0, livePending = null;
function writeLive(info) {
  forEachGroup(gid => setDoc(memberRef(gid), { live: info ? Object.assign({}, info, { updatedAt: serverTimestamp() }) : null, updatedAt: serverTimestamp() }, { merge: true }));
}
window.addEventListener('gb:live', e => {
  if (!user) return;
  const d = e.detail; livePending = { day: d.day, dayTitle: d.dayTitle, exercise: d.exercise || '', setNo: d.setNo || null, setOf: d.setOf || null, setsDone: d.setsDone, setsTotal: d.setsTotal };
  const wait = Math.max(0, 2500 - (Date.now() - liveLast));
  clearTimeout(liveT); liveT = setTimeout(() => { liveLast = Date.now(); writeLive(livePending); livePending = null; }, wait);
});
async function endLive() { clearTimeout(liveT); livePending = null; if (user) await Promise.all(forEachGroup(gid => setDoc(memberRef(gid), { live: null }, { merge: true }))); }
window.addEventListener('gb:live-end', () => { endLive(); });
window.addEventListener('gb:finish', e => {
  if (!user) return;
  const s = e.detail.session; endLive();
  const sets = G.setsInSession(s);
  forEachGroup(gid => setDoc(doc(db, 'groups', gid, 'feed', user.uid + '_' + s.id), {
    uid: user.uid, displayName: myName(), photoURL: myPhoto(), day: String(s.day), dayTitle: G.shortTitle(s.day) || ('Day ' + s.day),
    setsDone: sets, finishedAt: serverTimestamp(), cheers: {} }));
  pushStats();
});

/* ------------------------------------------------------------ active group listeners */
function watchGroup() {
  const gid = activeGid();
  if (gid === watchedGid) return;
  unsubs.group.forEach(f => f()); unsubs.group = []; watchedGid = gid; group = null; members = {}; feed = []; groupErr = null;
  if (!gid) return;
  const onErr = err => { warn(err); if (err && err.code === 'permission-denied') dropGroup(gid, 'You’re no longer in ' + (groups()[gid] || 'that squad')); };
  unsubs.group.push(onSnapshot(doc(db, 'groups', gid), s => { group = s.exists() ? Object.assign({ id: gid }, s.data()) : null; if (!s.exists() && !s.metadata.fromCache) dropGroup(gid, 'That squad was deleted'); paint(); }, onErr));
  unsubs.group.push(onSnapshot(collection(db, 'groups', gid, 'members'), s => {
    members = {}; s.forEach(d => { members[d.id] = d.data({ serverTimestamps: 'estimate' }); });
    if (!s.metadata.fromCache && user && !members[user.uid]) { dropGroup(gid, 'You were removed from ' + (groups()[gid] || 'the squad')); return; }
    paint();
  }, onErr));
  unsubs.group.push(onSnapshot(query(collection(db, 'groups', gid, 'feed'), orderBy('finishedAt', 'desc'), limit(25)), s => {
    feed = []; s.forEach(d => feed.push(Object.assign({ id: d.id }, d.data({ serverTimestamps: 'estimate' })))); paint();
  }, onErr));
}
async function saveProfile(patch) { if (!user) return; const d = Object.assign({ updatedAt: serverTimestamp() }, patch); await setDoc(doc(db, 'users', user.uid), d, { mergeFields: Object.keys(d) }); }
async function dropGroup(gid, msg) {
  if (!profile || !groups()[gid]) return;
  const g = Object.assign({}, groups()); delete g[gid];
  profile = Object.assign({}, profile, { groups: g, activeGroup: profile.activeGroup === gid ? (Object.keys(g)[0] || null) : profile.activeGroup });
  watchGroup(); paint(); if (msg) G.toast(msg);
  try { await saveProfile({ groups: g, activeGroup: profile.activeGroup }); } catch (e) { warn(e); }
}

/* ------------------------------------------------------------ squad actions */
function memberBase(code) {
  const st = G.socialStats();
  return { displayName: myName(), photoURL: myPhoto(), code, joinedAt: serverTimestamp(), updatedAt: serverTimestamp(), live: null,
    stats: { weekKey: st.weekKey, workoutsThisWeek: st.workoutsThisWeek, setsThisWeek: st.setsThisWeek, streak: st.streak, total: st.total, goal: st.goal } };
}
async function createGroup(name) {
  const gref = doc(collection(db, 'groups')); const code = genCode();
  const b = writeBatch(db);
  b.set(gref, { name, ownerUid: user.uid, code, createdAt: serverTimestamp() });
  b.set(doc(db, 'invites', code), { groupId: gref.id, name, ownerUid: user.uid });
  b.set(doc(db, 'groups', gref.id, 'members', user.uid), memberBase(code));
  await b.commit();
  const g = Object.assign({}, groups(), { [gref.id]: name });
  profile = Object.assign({}, profile, { groups: g, activeGroup: gref.id });
  await saveProfile({ groups: g, activeGroup: gref.id });
  watchGroup(); paint();
  return { id: gref.id, name, code };
}
async function lookupCode(code) {
  const s = await getDoc(doc(db, 'invites', code));
  return s.exists() ? s.data() : null;
}
async function joinGroup(code, inv) {
  await setDoc(doc(db, 'groups', inv.groupId, 'members', user.uid), memberBase(code));
  const g = Object.assign({}, groups(), { [inv.groupId]: inv.name });
  profile = Object.assign({}, profile, { groups: g, activeGroup: inv.groupId });
  await saveProfile({ groups: g, activeGroup: inv.groupId });
  watchGroup(); paint();
}
async function regenCode() {
  if (!group || group.ownerUid !== user.uid) return;
  const code = genCode(); const b = writeBatch(db);
  b.update(doc(db, 'groups', group.id), { code });
  b.set(doc(db, 'invites', code), { groupId: group.id, name: group.name, ownerUid: user.uid });
  if (group.code) b.delete(doc(db, 'invites', group.code));
  await b.commit();
}
async function leaveGroup(gid) {
  await deleteDoc(doc(db, 'groups', gid, 'members', user.uid));
  await dropGroup(gid, 'Left the squad');
}
async function deleteGroup() {
  const gid = group.id; const code = group.code;
  const [ms, fs] = await Promise.all([getDocs(collection(db, 'groups', gid, 'members')), getDocs(collection(db, 'groups', gid, 'feed'))]);
  const b = writeBatch(db);
  fs.forEach(d => b.delete(d.ref)); ms.forEach(d => { if (d.id !== user.uid) b.delete(d.ref); });
  if (code) b.delete(doc(db, 'invites', code));
  b.delete(doc(db, 'groups', gid));
  b.delete(doc(db, 'groups', gid, 'members', user.uid)); // last: owner keeps access until the end of the batch
  await b.commit();
  await dropGroup(gid, 'Squad deleted');
}

/* ------------------------------------------------------------ dialogs */
function shareInvite(name, code) {
  const url = BASE + '?join=' + code;
  const text = 'Join my squad “' + name + '” on Gym Buddy so we can see each other’s workouts. Code: ' + code;
  if (navigator.share) navigator.share({ title: 'Gym Buddy squad', text, url }).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(text + '\n' + url).then(() => G.toast('Invite link copied'), () => G.toast(url));
  else G.toast(url);
}
function needOnline() { if (!online()) { G.toast('You’re offline — try again once you’re connected'); return true; } return false; }
function createDialog() {
  if (needOnline()) return;
  G.openDlg('<h2 style="margin-top:0">Start a squad</h2><p class="small muted">Give it a name your friends will recognise. You’ll get a code to share.</p>' +
    '<label class="f">Squad name</label><input type="text" id="sq-name" maxlength="40" placeholder="Lunch Lifters">' +
    '<div class="row" style="margin-top:12px"><button class="btn grow" data-close>Cancel</button><button class="btn primary grow" id="sq-go">Create</button></div>', root => {
    const go = $('#sq-go', root);
    go.addEventListener('click', async () => {
      const name = $('#sq-name', root).value.trim().slice(0, 40); if (!name) return $('#sq-name', root).focus();
      go.disabled = true; go.textContent = 'Creating…';
      try { const g = await createGroup(name); G.closeDlg(); inviteDialog(g.name, g.code); }
      catch (e) { warn(e); go.disabled = false; go.textContent = 'Create'; G.toast('Could not create the squad — try again'); }
    });
    setTimeout(() => $('#sq-name', root).focus(), 50);
  });
}
function inviteDialog(name, code) {
  G.openDlg('<h2 style="margin-top:0">Invite friends</h2><p class="small muted">Share the link — or they can type the code in Settings → Squad → Join.</p>' +
    '<div class="code-box">' + esc(code) + '</div><div class="small muted" style="text-align:center;word-break:break-all">' + esc(BASE + '?join=' + code) + '</div>' +
    '<div class="row" style="margin-top:12px"><button class="btn grow" data-close>Done</button><button class="btn primary grow" id="inv-share">Share invite</button></div>', root => {
    $('#inv-share', root).addEventListener('click', () => shareInvite(name, code));
  });
}
function joinDialog(prefill) {
  if (needOnline()) return;
  G.openDlg('<h2 style="margin-top:0">Join a squad</h2><p class="small muted">Enter the code a friend shared with you.</p>' +
    '<label class="f">Squad code</label><input type="text" id="jn-code" maxlength="12" autocapitalize="characters" autocomplete="off" placeholder="ABCD2345" value="' + esc(prefill || '') + '" style="text-transform:uppercase;letter-spacing:.15em">' +
    '<div id="jn-msg" class="small" style="margin-top:8px"></div>' +
    '<div class="row" style="margin-top:12px"><button class="btn grow" data-close>Cancel</button><button class="btn primary grow" id="jn-go">Find squad</button></div>', root => {
    const go = $('#jn-go', root), msg = $('#jn-msg', root); let found = null, fcode = '';
    go.addEventListener('click', async () => {
      const code = $('#jn-code', root).value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (found && code === fcode) {
        go.disabled = true; go.textContent = 'Joining…';
        try { await joinGroup(code, found); G.closeDlg(); G.toast('Welcome to ' + found.name + ' ✦'); if (G.tab !== 'progress') G.setTab('progress'); }
        catch (e) { warn(e); go.disabled = false; go.textContent = 'Join'; msg.textContent = 'That code no longer works — ask for a fresh one.'; found = null; }
        return;
      }
      if (code.length < 6) { msg.textContent = 'Codes are 8 letters/numbers.'; return; }
      go.disabled = true; msg.textContent = 'Looking…';
      try {
        const inv = await lookupCode(code);
        if (!inv) { msg.textContent = 'No squad found with that code.'; found = null; }
        else if (groups()[inv.groupId]) { msg.textContent = 'You’re already in ' + inv.name + '.'; found = null; }
        else { found = inv; fcode = code; msg.innerHTML = 'Found <b>' + esc(inv.name) + '</b>.'; go.textContent = 'Join ' + inv.name.slice(0, 18); }
      } catch (e) { warn(e); msg.textContent = 'Could not check that code — try again.'; }
      go.disabled = false;
    });
    if (prefill) setTimeout(() => go.click(), 50);
  });
}
function signInDialog(reason) {
  G.openDlg('<h2 style="margin-top:0">Sign in</h2><p>' + esc(reason) + '</p>' +
    '<div class="row" style="margin-top:12px"><button class="btn grow" data-close>Not now</button><button class="btn primary grow" id="si-go">Sign in with Google</button></div>', root => {
    $('#si-go', root).addEventListener('click', () => { G.closeDlg(); signIn(); });
  });
}
function nameDialog() {
  G.openDlg('<h2 style="margin-top:0">Your name</h2><p class="small muted">This is what your squad sees.</p><input type="text" id="nm" maxlength="40" value="' + esc(myName()) + '">' +
    '<div class="row" style="margin-top:12px"><button class="btn grow" data-close>Cancel</button><button class="btn primary grow" id="nm-go">Save</button></div>', root => {
    $('#nm-go', root).addEventListener('click', async () => {
      const n = $('#nm', root).value.trim().slice(0, 40); if (!n) return;
      profile = Object.assign({}, profile, { displayName: n }); G.closeDlg(); paint();
      try { await saveProfile({ displayName: n }); pushStats(); } catch (e) { warn(e); }
    });
  });
}
function maybePendingJoin() {
  let code = null; try { code = localStorage.getItem(PENDING); } catch (e) { /* ignore */ }
  if (!code || !user || !profile) return;
  try { localStorage.removeItem(PENDING); } catch (e) { /* ignore */ }
  setTimeout(() => joinDialog(code), 300);
}
(function captureJoinParam() {
  const p = new URLSearchParams(location.search); const code = (p.get('join') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!code) return;
  try { localStorage.setItem(PENDING, code); } catch (e) { /* ignore */ }
  p.delete('join'); history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '') + location.hash);
  setTimeout(() => { if (!user && ready) signInDialog('A friend invited you to their squad. Sign in with Google to join — your workouts stay private, only progress is shared.'); }, 600);
})();

/* ------------------------------------------------------------ rendering */
const PRIVACY = 'Your squad sees your name, photo, workout and set progress, counts and streak. Pain, notes and weights stay private to you.';
function liveMembers() {
  const now = Date.now();
  return Object.keys(members).filter(uid => uid !== (user && user.uid)).map(uid => Object.assign({ uid }, members[uid]))
    .filter(m => m.live && now - tsMs(m.live.updatedAt) < LIVE_TTL).sort((a, b) => tsMs(b.live.updatedAt) - tsMs(a.live.updatedAt));
}
function renderLive() {
  const el = $('#social-live'); if (!el) return;
  if (!user || !activeGid()) { el.innerHTML = ''; return; }
  const ms = liveMembers();
  if (!ms.length) { el.innerHTML = '<div class="live-empty small muted"><span class="dot off"></span>No one in ' + esc(groups()[activeGid()] || 'your squad') + ' is mid-workout right now.</div>'; return; }
  el.innerHTML = '<div class="live"><div class="live-hd"><span class="dot"></span>Working out now</div><div class="live-row">' + ms.map(m => {
    const L = m.live; const pct = L.setsTotal ? Math.round(L.setsDone / L.setsTotal * 100) : 0;
    const where = (L.exercise ? esc(L.exercise) : 'Warming up') + (L.setNo && L.setOf ? ' · set ' + L.setNo + '/' + L.setOf : '');
    return '<div class="live-card">' + avatar(m.displayName, m.photoURL) + '<div class="grow"><b>' + esc(m.displayName) + '</b> <span class="muted">· ' + esc(L.dayTitle || ('Day ' + L.day)) + '</span>' +
      '<div class="small">' + where + '</div><div class="bar thin"><i style="width:' + pct + '%"></i></div><div class="tiny muted">' + L.setsDone + '/' + L.setsTotal + ' sets · ' + ago(tsMs(L.updatedAt)) + '</div></div></div>';
  }).join('') + '</div></div>';
}
function boardRows() {
  const cur = G.socialStats(); const curWk = cur.weekKey;
  return Object.keys(members).map(uid => {
    const m = members[uid]; let st = m.stats || {};
    if (user && uid === user.uid) st = cur;
    const fresh = st.weekKey === curWk; const gap = st.weekKey ? weekDiff(st.weekKey, curWk) : 99;
    return { uid, name: (user && uid === user.uid) ? myName() : m.displayName, photo: m.photoURL,
      week: fresh ? (st.workoutsThisWeek || 0) : 0, sets: fresh ? (st.setsThisWeek || 0) : 0, streak: gap <= 1 ? (st.streak || 0) : 0 };
  });
}
function renderBoard() {
  const el = $('#social-board'); if (!el) return;
  if (!auth) { el.innerHTML = ''; return; }
  if (!ready) { el.innerHTML = ''; return; }
  if (!user) {
    el.innerHTML = '<h2>Squad</h2><div class="card soft-lav"><b>Work out together, wherever you are</b><p class="small" style="margin:6px 0 10px">Sign in to start a squad with friends — see who’s mid-workout, cheer each other on and share a weekly leaderboard. Your history stays on this phone either way.</p>' +
      '<button class="btn primary block" data-s="signin">Sign in with Google</button></div>';
    return;
  }
  const gid = activeGid();
  if (!gid) {
    el.innerHTML = '<h2>Squad</h2><div class="card soft-lav"><b>No squad yet</b><p class="small" style="margin:6px 0 10px">Start one and share the code, or join a friend’s.</p>' +
      '<div class="row"><button class="btn primary grow" data-s="create">Start a squad</button><button class="btn grow" data-s="join">Join with code</button></div></div>';
    return;
  }
  const gname = (group && group.name) || groups()[gid];
  const metric = { week: ['week', 'workouts this week'], streak: ['streak', 'week streak'], sets: ['sets', 'sets this week'] }[boardSort];
  const rows = boardRows().sort((a, b) => b[metric[0]] - a[metric[0]] || String(a.name).localeCompare(String(b.name)));
  let rank = 0, prev = null;
  const list = rows.map((r, i) => {
    if (r[metric[0]] !== prev) { rank = i + 1; prev = r[metric[0]]; }
    const me = user && r.uid === user.uid;
    return '<div class="lb-row' + (me ? ' me' : '') + '"><span class="lb-rank">' + rank + '</span>' + avatar(r.name, r.photo) + '<span class="grow lb-name">' + esc(r.name) + (me ? ' <span class="muted small">(you)</span>' : '') + '</span><span class="lb-val">' + r[metric[0]] + '</span></div>';
  }).join('');
  const sw = Object.keys(groups()).length > 1 ? '<select id="sq-switch" aria-label="Active squad">' + Object.keys(groups()).map(k => '<option value="' + k + '"' + (k === gid ? ' selected' : '') + '>' + esc(groups()[k]) + '</option>').join('') + '</select>' : '';
  const seg = '<div class="seg" style="margin:8px 0">' + [['week', 'This week'], ['streak', 'Streak'], ['sets', 'Sets']].map(o => '<button data-sort="' + o[0] + '" class="' + (boardSort === o[0] ? 'sel' : '') + '">' + o[1] + '</button>').join('') + '</div>';
  let h = '<h2>Leaderboard</h2>' + sw + '<div class="card"><div class="row"><b class="grow">' + esc(gname || 'Squad') + '</b><button class="btn small" data-s="invite">Invite</button></div>' + seg +
    '<div class="small muted" style="margin-bottom:4px">Ranked by ' + metric[1] + '</div>' + (list || '<p class="small muted">Just you so far — invite a friend.</p>') + '</div>';
  h += '<h2>Squad feed</h2>';
  if (!feed.length) h += '<div class="card muted small">Finished workouts from your squad will show up here. Go first?</div>';
  else h += feed.map(f => {
    const mine = user && f.cheers && f.cheers[user.uid]; const n = f.cheers ? Object.keys(f.cheers).length : 0;
    return '<div class="card feed-item">' + avatar(f.displayName, f.photoURL) + '<div class="grow"><b>' + esc(user && f.uid === user.uid ? 'You' : f.displayName) + '</b> finished ' + esc(f.dayTitle || ('Day ' + f.day)) +
      '<div class="small muted">' + (f.setsDone || 0) + ' sets · ' + ago(tsMs(f.finishedAt)) + '</div></div>' +
      '<button class="cheer' + (mine ? ' sel' : '') + '" data-cheer="' + esc(f.id) + '" aria-pressed="' + (mine ? 'true' : 'false') + '" aria-label="Cheer">👏<span>' + (n || '') + '</span></button></div>';
  }).join('');
  h += '<p class="footer-note">' + PRIVACY + '</p>';
  el.innerHTML = h;
}
function renderAccount() {
  const el = $('#social-account'); if (!el) return;
  if (!auth) { el.innerHTML = ''; return; }
  let h = '<h2 style="margin-top:4px">Account</h2>';
  if (!user) {
    h += '<div class="card"><p class="small" style="margin-top:0">Signed out — everything stays on this phone. Sign in to back up your history to your own account and work out with a squad.</p>' +
      '<button class="btn primary block" data-s="signin">Sign in with Google</button></div>';
    el.innerHTML = h; return;
  }
  h += '<div class="card"><div class="row">' + avatar(myName(), myPhoto(), 'lg') + '<div class="grow"><b>' + esc(myName()) + '</b><div class="small muted">' + esc(user.email || '') + '</div></div>' +
    '<button class="btn small" data-s="name">Edit name</button></div>' +
    '<p class="small muted">Your full history (including pain, notes and weights) is backed up privately to your account — only you can see it.</p>' +
    '<button class="btn block" data-s="signout">Sign out</button></div>';
  h += '<h2>Squad</h2><div class="card">';
  const gs = groups(); const gid = activeGid();
  if (!gid) h += '<p class="small" style="margin-top:0">You’re not in a squad yet.</p>';
  else {
    if (Object.keys(gs).length > 1) h += '<label class="f" style="margin-top:0">Active squad</label><select id="sq-switch">' + Object.keys(gs).map(k => '<option value="' + k + '"' + (k === gid ? ' selected' : '') + '>' + esc(gs[k]) + '</option>').join('') + '</select>';
    const owner = group && group.ownerUid === user.uid;
    h += '<div class="row" style="margin-top:6px"><b class="grow">' + esc((group && group.name) || gs[gid]) + '</b>' + (owner ? '<span class="badge">owner</span>' : '') + '</div>';
    if (group && group.code) h += '<div class="row" style="margin:8px 0"><span class="code-pill grow">' + esc(group.code) + '</span><button class="btn small primary" data-s="share">Share</button></div>';
    if (owner) h += '<button class="btn small block" data-s="regen" style="margin-bottom:8px">New code (old one stops working)</button>';
    const ids = Object.keys(members).sort((a, b) => (members[a].displayName || '').localeCompare(members[b].displayName || ''));
    h += '<div class="small muted" style="margin:6px 0 2px">Members · ' + ids.length + '</div>' + ids.map(uid => {
      const m = members[uid]; const isMe = uid === user.uid;
      return '<div class="lb-row">' + avatar(m.displayName, m.photoURL) + '<span class="grow lb-name">' + esc(isMe ? myName() : m.displayName) + (isMe ? ' <span class="muted small">(you)</span>' : '') + (group && group.ownerUid === uid ? ' <span class="badge">owner</span>' : '') + '</span>' +
        (owner && !isMe ? '<button class="btn small danger" data-rm="' + esc(uid) + '" data-nm="' + esc(m.displayName) + '">Remove</button>' : '') + '</div>';
    }).join('');
    h += owner ? '<button class="btn small danger block" data-s="delete" style="margin-top:10px">Delete squad</button>' : '<button class="btn small danger block" data-s="leave" style="margin-top:10px">Leave squad</button>';
  }
  h += '<div class="row" style="margin-top:10px"><button class="btn grow" data-s="create">Start a squad</button><button class="btn grow" data-s="join">Join with code</button></div>';
  h += '<p class="small muted" style="margin-bottom:0">' + PRIVACY + '</p></div>';
  el.innerHTML = h;
}
function renderHeader() {
  const b = $('#me-btn'); if (!b) return;
  if (!auth || !ready) { b.hidden = true; return; }
  b.hidden = false;
  b.innerHTML = user ? avatar(myName(), myPhoto(), 'sm') : '<span class="signin-pill">Sign in</span>';
  b.setAttribute('aria-label', user ? 'Account: ' + myName() : 'Sign in');
}
function paint() { renderHeader(); renderLive(); renderBoard(); renderAccount(); }
window.addEventListener('gb:render', () => paint());
setInterval(() => { if (G.tab === 'workout') renderLive(); }, 30000);
window.addEventListener('online', paint); window.addEventListener('offline', paint);

/* ------------------------------------------------------------ events */
document.addEventListener('click', async e => {
  const t = e.target;
  if (t.closest('#me-btn')) { G.setTab('settings'); return; }
  const s = t.closest('[data-s]');
  if (s) {
    const a = s.dataset.s;
    if (a === 'signin') signIn();
    else if (a === 'signout') doSignOut();
    else if (a === 'name') nameDialog();
    else if (a === 'create') createDialog();
    else if (a === 'join') joinDialog('');
    else if (a === 'invite' || a === 'share') { if (group) inviteDialog(group.name, group.code); }
    else if (a === 'regen') { if (needOnline()) return; if (confirm('Make a new code? The current link and code will stop working for new people (members stay).')) { try { await regenCode(); G.toast('New code ready'); } catch (err) { warn(err); G.toast('Could not change the code'); } } }
    else if (a === 'leave') { if (needOnline()) return; if (confirm('Leave ' + (group ? group.name : 'this squad') + '?')) { try { await leaveGroup(activeGid()); } catch (err) { warn(err); G.toast('Could not leave — try again'); } } }
    else if (a === 'delete') { if (needOnline()) return; if (confirm('Delete ' + group.name + ' for everyone? This removes the leaderboard and feed.')) { try { await deleteGroup(); } catch (err) { warn(err); G.toast('Could not delete — try again'); } } }
    return;
  }
  const rm = t.closest('[data-rm]');
  if (rm) { if (needOnline()) return; if (confirm('Remove ' + rm.dataset.nm + ' from the squad? Make a new code too if you don’t want them rejoining.')) { try { await deleteDoc(doc(db, 'groups', group.id, 'members', rm.dataset.rm)); } catch (err) { warn(err); G.toast('Could not remove'); } } return; }
  const so = t.closest('[data-sort]'); if (so) { boardSort = so.dataset.sort; renderBoard(); return; }
  const ch = t.closest('[data-cheer]');
  if (ch && user && group) {
    const f = feed.find(x => x.id === ch.dataset.cheer); if (!f) return;
    const mine = f.cheers && f.cheers[user.uid];
    f.cheers = Object.assign({}, f.cheers); if (mine) delete f.cheers[user.uid]; else f.cheers[user.uid] = true; renderBoard();
    updateDoc(doc(db, 'groups', group.id, 'feed', f.id), { ['cheers.' + user.uid]: mine ? deleteField() : true }).catch(warn);
  }
});
document.addEventListener('change', async e => {
  if (e.target.id !== 'sq-switch') return;
  const gid = e.target.value; profile = Object.assign({}, profile, { activeGroup: gid }); watchGroup(); paint();
  try { await saveProfile({ activeGroup: gid }); } catch (err) { warn(err); }
});

window.__gbSocial = { get user() { return user; }, get profile() { return profile; }, get members() { return members; }, get feed() { return feed; }, get group() { return group; }, auth, db };
paint();
