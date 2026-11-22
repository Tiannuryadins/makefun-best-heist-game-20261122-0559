// Bootstrap + HUD + overlays + deterministic screenshot mode + in-page
// self-test for Midnight Vault. The game loop steps game.js and paints
// render.js; all menus are DOM overlays so they stay readable in shots.

import { createGame, stepGame, nextLevelState, useSmoke, useEmp, detect, guardSeesPlayer, cameraSeesPlayer, playerInShadow, guardCount, cameraCount } from './game.js';
import { drawGame } from './render.js';
import { createInput } from './input.js';
import { LEVELS, levelById, FIELD_W, FIELD_H } from './levels.js';
import * as audio from './audio.js';

const params = new URLSearchParams(location.search);
const shotMode = params.get('shot');
const selftestMode = params.get('selftest') === '1';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const el = (id) => document.getElementById(id);
const hud = {
  level: el('level-name'),
  timer: el('timer-text'),
  score: el('score-text'),
  loot: el('loot-text'),
  alarmFill: el('alarm-fill'),
  alarmText: el('alarm-text'),
  smoke: el('smoke-text'),
  emp: el('emp-text'),
  message: el('message-text'),
  overlay: el('overlay'),
  overlayTitle: el('overlay-title'),
  overlayBody: el('overlay-body'),
  overlayButtons: el('overlay-buttons'),
};

let state = null;
let phase = 'title'; // title | playing | paused | caught | levelComplete | campaignWin
let scoreAtLevelStart = 0;
let campaignScore = 0;
let lastLootTaken = 0;
let lastVaultOpen = false;
let lastAlarmHigh = false;

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function startLevel(levelId, keepScore) {
  const def = levelById(levelId);
  state = createGame(def, 0);
  if (keepScore) state.score = keepScore;
  scoreAtLevelStart = state.score;
  lastLootTaken = 0;
  lastVaultOpen = false;
  lastAlarmHigh = false;
  phase = 'playing';
  hud.overlay.classList.add('hidden');
  audio.startDrone();
}

function showOverlay(title, bodyHtml, buttons) {
  hud.overlayTitle.textContent = title;
  hud.overlayBody.innerHTML = bodyHtml;
  hud.overlayButtons.innerHTML = '';
  for (const b of buttons) {
    const btn = document.createElement('button');
    btn.textContent = b.label;
    btn.addEventListener('click', () => { audio.playClick(); b.onClick(); });
    hud.overlayButtons.appendChild(btn);
  }
  hud.overlay.classList.remove('hidden');
}

function showTitle() {
  phase = 'title';
  state = createGame(levelById(1), 1.6);
  // Dress the title backdrop: thief mid-room, one guard cone sweeping.
  state.player.x = 640; state.player.y = 380;
  state.guards[0].x = 500; state.guards[0].y = 220; state.guards[0].angle = 0.6;
  state.guards[1].x = 950; state.guards[1].y = 430; state.guards[1].angle = -2.2;
  showOverlay(
    'MIDNIGHT VAULT',
    `<p>Bobol Bank Merdeka di tengah malam. Kumpulkan semua tas emas, retas
     brankas, lalu kabur ke van sebelum alarm penuh.</p>
     <p><b>WASD / panah</b> bergerak · <b>klik</b> jalan ke titik ·
     <b>Q</b> bom asap (×2) · <b>E</b> EMP kamera (×2) ·
     <b>M</b> suara · <b>Esc</b> jeda</p>
     <p>Penjaga &amp; kamera punya kerucut pandang. Bayangan gelap
     memperlambat alarm setengahnya. Tiap alat −50 skor.</p>`,
    [{ label: 'MULAI MISI', onClick: () => startLevel(1, 0) }],
  );
}

function showCaught() {
  phase = 'caught';
  audio.stopDrone();
  audio.playCaught();
  showOverlay(
    'KETAHUAN!',
    `<p>${state.message}</p><p>Skor: <b>${state.score}</b> · Jarahan ${state.lootTaken}/${state.loot.length}</p>`,
    [{ label: 'COBA LAGI', onClick: () => startLevel(state.level.id, scoreAtLevelStart) }],
  );
}

function showLevelComplete() {
  campaignScore = state.score;
  audio.stopDrone();
  audio.playWin();
  const isLast = state.level.id >= LEVELS.length;
  const stars = '★'.repeat(state.stars) + '☆'.repeat(3 - state.stars);
  if (isLast) {
    phase = 'campaignWin';
    showOverlay(
      'KAMPANYE SELESAI!',
      `<p class="stars">${stars}</p>
       <p>Semua brankas dibobol. Skor akhir: <b>${state.score}</b></p>
       <p>Bonus waktu +${state.timeBonus}${state.ghost ? ' · Bonus hantu +300 (tak pernah terlihat!)' : ''}</p>`,
      [{ label: 'MAIN LAGI', onClick: () => startLevel(1, 0) }],
    );
    return;
  }
  phase = 'levelComplete';
  showOverlay(
    'LEVEL SELESAI!',
    `<p class="stars">${stars}</p>
     <p>${state.level.name} — Skor: <b>${state.score}</b></p>
     <p>Bonus waktu +${state.timeBonus}${state.ghost ? ' · Bonus hantu +300' : ''}</p>`,
    [{ label: 'LEVEL BERIKUTNYA', onClick: () => startLevel(state.level.id + 1, campaignScore) }],
  );
}

function updateHud() {
  if (!state) return;
  hud.level.textContent = `Level ${state.level.id} · ${state.level.name}`;
  hud.timer.textContent = fmtTime(Math.max(0, state.timeLeft));
  hud.timer.classList.toggle('danger', state.timeLeft < 30);
  hud.score.textContent = String(state.score);
  hud.loot.textContent = `${state.lootTaken}/${state.loot.length}`;
  const alarm = Math.round(state.alarm);
  hud.alarmFill.style.width = `${alarm}%`;
  hud.alarmText.textContent = `ALARM ${alarm}%`;
  hud.alarmFill.classList.toggle('hot', alarm >= 70);
  hud.smoke.textContent = `💨×${state.smokeLeft}`;
  hud.emp.textContent = `⚡×${state.empLeft}`;
  hud.message.textContent = state.now < state.messageUntil ? state.message : '';
}

function frame(nowMs) {
  requestAnimationFrame(frame);
  if (!state) return;
  const dt = 0.016;
  if (phase === 'playing') {
    const before = state.phase;
    stepGame(state, dt, { keys: input.keys, useSmoke: false, useEmp: false });
    if (state.lootTaken > lastLootTaken) { audio.playLoot(); lastLootTaken = state.lootTaken; }
    if (state.vaultOpen && !lastVaultOpen) { audio.playVault(); lastVaultOpen = true; }
    if (state.alarm >= 70 && !lastAlarmHigh) { lastAlarmHigh = true; }
    if (state.alarm < 70) lastAlarmHigh = false;
    if (state.phase === 'caught' && before === 'playing') showCaught();
    if (state.phase === 'levelComplete' && before === 'playing') showLevelComplete();
  }
  drawGame(ctx, state);
  updateHud();
}

const input = createInput(canvas, {
  onSmoke: () => { if (phase === 'playing' && state && useSmoke(state)) audio.playSmoke(); },
  onEmp: () => { if (phase === 'playing' && state && useEmp(state)) audio.playEmp(); },
  onMute: () => { audio.toggleMute(); },
  onPause: () => {
    if (phase === 'playing') {
      phase = 'paused';
      showOverlay('JEDA', '<p>Misi dijeda. Tarik napas, rencanakan langkahmu.</p>', [
        { label: 'LANJUTKAN', onClick: () => { phase = 'playing'; hud.overlay.classList.add('hidden'); } },
        { label: 'ULANG LEVEL', onClick: () => startLevel(state.level.id, scoreAtLevelStart) },
      ]);
    }
  },
  onConfirm: () => {
    if (phase === 'title') startLevel(1, 0);
  },
  onClickMove: (t) => { if (state) state.moveTarget = t; },
});

// ---- Deterministic screenshot mode ---------------------------------------
// ?shot=lobby|corridor|vault|win — frozen clock, fixed positions, so every
// capture of the same shot is pixel-identical.
function applyShot(name) {
  const frozen = { lobby: 1.6, corridor: 2.2, vault: 2.8, win: 1.6 }[name] ?? 1.6;
  if (name === 'win') {
    state = createGame(levelById(1), frozen);
    state.phase = 'levelComplete';
    state.loot.forEach((l) => { l.taken = true; });
    state.lootTaken = 3;
    state.vaultOpen = true;
    state.exitOpen = true;
    state.score = 1420;
    state.timeLeft = 75;
    state.stars = 3;
    state.timeBonus = 375;
    state.ghost = true;
    phase = 'levelComplete';
    showOverlay('LEVEL SELESAI!', '<p class="stars">★★★</p><p>Lobi Bank Merdeka — Skor: <b>1420</b></p><p>Bonus waktu +375 · Bonus hantu +300</p>', []);
    drawGame(ctx, state);
    updateHud();
    window.__shotReady = true;
    return;
  }
  const levelId = { lobby: 1, corridor: 2, vault: 3 }[name] ?? 1;
  state = createGame(levelById(levelId), frozen);
  phase = 'playing';
  hud.overlay.classList.add('hidden');
  const setups = {
    lobby: () => {
      state.player.x = 140; state.player.y = 360; // inside a shadow zone
      state.loot[0].taken = true; state.lootTaken = 1; state.score = 150;
      state.alarm = 45;
      state.guards[0].x = 420; state.guards[0].y = 260; state.guards[0].angle = 0.5;
      state.guards[1].x = 880; state.guards[1].y = 320; state.guards[1].angle = Math.PI;
    },
    corridor: () => {
      state.player.x = 500; state.player.y = 540;
      state.loot[0].taken = true; state.loot[1].taken = true; state.lootTaken = 2; state.score = 300;
      state.alarm = 62;
      state.guards[0].x = 420; state.guards[0].y = 300; state.guards[0].angle = -0.4;
      state.guards[1].x = 900; state.guards[1].y = 420; state.guards[1].angle = 2.6;
      state.guards[2].x = 1050; state.guards[2].y = 330; state.guards[2].angle = Math.PI / 2;
    },
    vault: () => {
      state.player.x = 1050; state.player.y = 110; // creeping up on the vault
      state.loot[0].taken = true; state.loot[1].taken = true; state.loot[2].taken = true;
      state.lootTaken = 3; state.score = 450;
      state.alarm = 78;
      state.vaultProgress = 0.9;
      state.guards[0].x = 420; state.guards[0].y = 320; state.guards[0].angle = 0.9;
      state.guards[1].x = 1000; state.guards[1].y = 480; state.guards[1].angle = -1.2;
      state.guards[2].x = 850; state.guards[2].y = 280; state.guards[2].angle = 2.4;
      state.guards[3].x = 560; state.guards[3].y = 160; state.guards[3].angle = 0.2;
    },
  };
  setups[name]?.();
  // Advance cameras to their frozen angles without moving the clock.
  state.cameras.forEach((c) => { c.angle = c.baseAngle + Math.sin(frozen * c.speed) * c.sweep; });
  drawGame(ctx, state);
  updateHud();
  window.__shotReady = true;
}

// ---- In-page self-test ----------------------------------------------------
// ?selftest=1 — 12 pure-logic checks, no rendering needed.
function runSelfTest() {
  const results = [];
  const check = (name, fn) => {
    try {
      const ok = fn();
      results.push({ name, ok: ok === true });
    } catch (e) {
      results.push({ name, ok: false, error: String(e) });
    }
  };
  const emptyKeys = new Set();
  const idle = { keys: emptyKeys, useSmoke: false, useEmp: false };

  check('guard sees player inside cone', () => {
    const s = createGame(levelById(1));
    const g = s.guards[0];
    g.x = 400; g.y = 300; g.angle = 0;
    s.player.x = 500; s.player.y = 300;
    return guardSeesPlayer(g, s.player, []) === true;
  });
  check('wall blocks guard sight', () => {
    const s = createGame(levelById(1));
    const g = s.guards[0];
    g.x = 400; g.y = 300; g.angle = 0;
    s.player.x = 500; s.player.y = 300;
    return guardSeesPlayer(g, s.player, [{ x: 440, y: 280, w: 20, h: 40 }]) === false;
  });
  check('guard blind behind', () => {
    const s = createGame(levelById(1));
    const g = s.guards[0];
    g.x = 400; g.y = 300; g.angle = 0;
    s.player.x = 300; s.player.y = 300;
    return guardSeesPlayer(g, s.player, []) === false;
  });
  check('camera sees player in sweep cone', () => {
    const s = createGame(levelById(1));
    const c = s.cameras[0];
    c.angle = Math.PI / 2;
    s.player.x = c.x; s.player.y = c.y + 150;
    return cameraSeesPlayer(c, s.player, []) === true;
  });
  check('EMP disables camera detection', () => {
    const s = createGame(levelById(1));
    const c = s.cameras[0];
    c.angle = Math.PI / 2;
    s.player.x = c.x; s.player.y = c.y + 150;
    s.empUntil = 10; s.now = 1;
    return detect(s).seenBy === null;
  });
  check('smoke blinds nearby guard', () => {
    const s = createGame(levelById(1));
    const g = s.guards[0];
    g.x = 400; g.y = 300; g.angle = 0;
    s.player.x = 500; s.player.y = 300;
    s.smokeUntil = 10; s.now = 1; s.smokeX = 450; s.smokeY = 300;
    return detect(s).seenBy === null;
  });
  check('alarm full means caught', () => {
    const s = createGame(levelById(1));
    const g = s.guards[0];
    g.x = 400; g.y = 300; g.angle = 0;
    g.waypoints = [[400, 300]]; g.wpIndex = 0; // hold still, facing the player
    s.player.x = 500; s.player.y = 300;
    s.alarm = 99;
    stepGame(s, 0.5, idle);
    return s.phase === 'caught';
  });
  check('loot pickup scores +150', () => {
    const s = createGame(levelById(1));
    s.player.x = s.loot[0].x; s.player.y = s.loot[0].y;
    stepGame(s, 0.1, idle);
    return s.lootTaken === 1 && s.score === 150;
  });
  check('shadow halves alarm rate', () => {
    const s = createGame(levelById(1));
    const g = s.guards[0];
    g.x = 100; g.y = 300; g.angle = Math.atan2(60, 50); // facing the player
    s.player.x = 150; s.player.y = 360; // inside L1 shadow (46,300,190,120)
    const inSh = playerInShadow(s);
    const rate = detect(s).rate;
    return inSh === true && Math.abs(rate - 21) < 0.01;
  });
  check('vault stays shut until all loot taken', () => {
    const s = createGame(levelById(1));
    const v = s.level.vault;
    s.player.x = v.x + v.w / 2; s.player.y = v.y + v.h / 2 + 60;
    stepGame(s, 2, idle);
    return s.vaultOpen === false;
  });
  check('vault opens with all loot, exit completes level', () => {
    const s = createGame(levelById(1));
    s.loot.forEach((l) => { l.taken = true; });
    s.lootTaken = s.loot.length;
    const v = s.level.vault;
    s.player.x = v.x + v.w / 2; s.player.y = v.y + v.h / 2 + 60;
    stepGame(s, 2, idle);
    if (!s.vaultOpen) return false;
    s.player.x = s.level.exit.x + 40; s.player.y = s.level.exit.y + 40;
    stepGame(s, 0.1, idle);
    return s.phase === 'levelComplete' && s.stars >= 1;
  });
  check('levels 2 and 3 have 3/4 guards and 2/3 cameras', () => {
    return guardCount(levelById(2)) === 3 && cameraCount(levelById(2)) === 2
      && guardCount(levelById(3)) === 4 && cameraCount(levelById(3)) === 3;
  });

  const passed = results.filter((r) => r.ok).length;
  const summary = { passed, total: results.length, results };
  window.__selftest = summary;
  document.title = `SELFTEST ${passed}/${results.length}`;
  const pre = document.createElement('pre');
  pre.id = 'selftest-results';
  pre.textContent = JSON.stringify(summary, null, 2);
  document.body.appendChild(pre);
  return summary;
}

// ---- Boot ----------------------------------------------------------------
window.__midnightVault = {
  get phase() { return phase; },
  get state() { return state; },
  startLevel,
  showTitle,
};

if (selftestMode) {
  state = createGame(levelById(1), 0);
  phase = 'playing';
  const summary = runSelfTest();
  drawGame(ctx, state);
  updateHud();
  window.__shotReady = true;
  console.log(`SELFTEST ${summary.passed}/${summary.total}`);
} else if (shotMode) {
  applyShot(shotMode);
} else {
  showTitle();
  requestAnimationFrame(frame);
}
