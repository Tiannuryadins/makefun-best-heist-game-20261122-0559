// Game state and rules for Midnight Vault: movement, guard patrols,
// camera sweeps, vision-cone detection, the alarm meter, loot, the vault
// crack, tools (smoke bomb + EMP) and the getaway. Pure logic — no DOM,
// no canvas — so the in-page self-test can exercise it directly.

import { hasLineOfSight, circleRectResolve, pointInRect, dist, angleDiff, inVisionCone } from './geom.js';
import { levelById } from './levels.js';

export const PLAYER_SPEED = 195;
export const PLAYER_RADIUS = 14;
export const LOOT_SCORE = 150;
export const VAULT_SCORE = 500;
export const GHOST_BONUS = 300;
export const TIME_BONUS_PER_SEC = 5;
export const TOOL_COST = 50;
export const SMOKE_DURATION = 3;
export const EMP_DURATION = 6;
export const VAULT_CRACK_TIME = 1.5;
export const ALARM_GUARD_RATE = 42;
export const ALARM_CAMERA_RATE = 34;
export const ALARM_DECAY = 14;
export const SMOKE_RADIUS = 175;

export function createGame(levelDef, now = 0) {
  return {
    level: levelDef,
    phase: 'playing',
    now,
    timeLeft: levelDef.timeLimit,
    score: 0,
    lootTaken: 0,
    vaultOpen: false,
    vaultProgress: 0,
    exitOpen: false,
    alarm: 0,
    everSeen: false,
    spotted: false,
    smokeLeft: 2,
    empLeft: 2,
    smokeUntil: -1,
    smokeX: 0,
    smokeY: 0,
    empUntil: -1,
    message: '',
    messageUntil: 0,
    stars: 0,
    player: { x: levelDef.start.x, y: levelDef.start.y, angle: -Math.PI / 2 },
    moveTarget: null,
    guards: levelDef.guards.map((g) => ({
      x: g.waypoints[0][0],
      y: g.waypoints[0][1],
      angle: 0,
      wpIndex: 1 % g.waypoints.length,
      speed: g.speed,
      range: g.range,
      fov: g.fov,
      waypoints: g.waypoints,
      alerted: false,
    })),
    cameras: levelDef.cameras.map((c) => ({
      x: c.x, y: c.y, baseAngle: c.baseAngle, sweep: c.sweep,
      speed: c.speed, range: c.range, fov: c.fov, angle: c.baseAngle,
    })),
    loot: levelDef.loot.map((l) => ({ x: l.x, y: l.y, taken: false })),
  };
}

export function playerInShadow(state) {
  return state.level.shadows.some((s) => pointInRect(state.player.x, state.player.y, s));
}

export function guardSeesPlayer(guard, player, walls) {
  return inVisionCone(guard, player, guard.range, guard.fov / 2, walls);
}

export function cameraSeesPlayer(camera, player, walls) {
  return inVisionCone(camera, player, camera.range, camera.fov / 2, walls);
}

function smokeBlocks(state, watcher) {
  if (state.now >= state.smokeUntil) return false;
  return dist(watcher.x, watcher.y, state.smokeX, state.smokeY) < SMOKE_RADIUS;
}

// Who currently sees the thief, and at what alarm rate (per second)?
export function detect(state) {
  const p = state.player;
  const shadow = playerInShadow(state);
  const factor = shadow ? 0.5 : 1;
  let best = null;
  let rate = 0;
  for (const g of state.guards) {
    if (smokeBlocks(state, g)) continue;
    if (guardSeesPlayer(g, p, state.level.walls)) {
      if (ALARM_GUARD_RATE * factor > rate) { best = 'guard'; rate = ALARM_GUARD_RATE * factor; }
    }
  }
  for (const c of state.cameras) {
    if (state.now < state.empUntil) continue;
    if (smokeBlocks(state, c)) continue;
    if (cameraSeesPlayer(c, p, state.level.walls)) {
      if (ALARM_CAMERA_RATE * factor > rate) { best = 'camera'; rate = ALARM_CAMERA_RATE * factor; }
    }
  }
  return { seenBy: best, rate, inShadow: shadow };
}

function movePlayer(state, dt, input) {
  const p = state.player;
  let dx = 0;
  let dy = 0;
  if (input.keys.has('arrowup') || input.keys.has('w')) dy -= 1;
  if (input.keys.has('arrowdown') || input.keys.has('s')) dy += 1;
  if (input.keys.has('arrowleft') || input.keys.has('a')) dx -= 1;
  if (input.keys.has('arrowright') || input.keys.has('d')) dx += 1;
  if (dx !== 0 || dy !== 0) {
    state.moveTarget = null;
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
  } else if (state.moveTarget) {
    const d = dist(p.x, p.y, state.moveTarget.x, state.moveTarget.y);
    if (d < 6) {
      state.moveTarget = null;
    } else {
      dx = (state.moveTarget.x - p.x) / d;
      dy = (state.moveTarget.y - p.y) / d;
    }
  }
  if (dx !== 0 || dy !== 0) {
    p.angle = Math.atan2(dy, dx);
    p.x += dx * PLAYER_SPEED * dt;
    p.y += dy * PLAYER_SPEED * dt;
    for (const w of state.level.walls) {
      const fixed = circleRectResolve(p.x, p.y, PLAYER_RADIUS, w);
      if (fixed) { p.x = fixed.x; p.y = fixed.y; }
    }
    p.x = Math.max(14 + PLAYER_RADIUS, Math.min(1280 - 14 - PLAYER_RADIUS, p.x));
    p.y = Math.max(14 + PLAYER_RADIUS, Math.min(656 - 14 - PLAYER_RADIUS, p.y));
  }
}

function stepGuards(state, dt) {
  for (const g of state.guards) {
    const target = g.waypoints[g.wpIndex];
    const d = dist(g.x, g.y, target[0], target[1]);
    const stepLen = g.speed * dt;
    if (d <= Math.max(stepLen, 4)) {
      g.x = target[0]; g.y = target[1];
      g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
    } else {
      const nx = (target[0] - g.x) / d;
      const ny = (target[1] - g.y) / d;
      g.x += nx * stepLen;
      g.y += ny * stepLen;
      const want = Math.atan2(ny, nx);
      let diff = want - g.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      g.angle += Math.max(-6 * dt, Math.min(6 * dt, diff));
    }
  }
}

function stepCameras(state) {
  for (const c of state.cameras) {
    c.angle = c.baseAngle + Math.sin(state.now * c.speed) * c.sweep;
  }
}

export function useSmoke(state) {
  if (state.smokeLeft <= 0 || state.phase !== 'playing') return false;
  state.smokeLeft -= 1;
  state.score = Math.max(0, state.score - TOOL_COST);
  state.smokeUntil = state.now + SMOKE_DURATION;
  state.smokeX = state.player.x;
  state.smokeY = state.player.y;
  return true;
}

export function useEmp(state) {
  if (state.empLeft <= 0 || state.phase !== 'playing') return false;
  state.empLeft -= 1;
  state.score = Math.max(0, state.score - TOOL_COST);
  state.empUntil = state.now + EMP_DURATION;
  return true;
}

export function starsFor(timeLeft, timeLimit) {
  if (timeLeft > timeLimit * 0.5) return 3;
  if (timeLeft > timeLimit * 0.25) return 2;
  return 1;
}

export function stepGame(state, dt, input) {
  if (state.phase !== 'playing') return state;
  state.now += dt;
  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.phase = 'caught';
    state.message = 'WAKTU HABIS — alarm berbunyi!';
    return state;
  }
  if (input.useSmoke) useSmoke(state);
  if (input.useEmp) useEmp(state);
  movePlayer(state, dt, input);
  stepGuards(state, dt);
  stepCameras(state);

  const seen = detect(state);
  if (seen.seenBy) {
    state.everSeen = true;
    state.alarm = Math.min(100, state.alarm + seen.rate * dt);
    for (const g of state.guards) g.alerted = guardSeesPlayer(g, state.player, state.level.walls);
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
    for (const g of state.guards) g.alerted = false;
  }
  if (state.alarm >= 100) {
    state.phase = 'caught';
    state.message = 'KETAHUAN! Alarm meraung — misi gagal.';
    return state;
  }

  // Loot pickup.
  for (const item of state.loot) {
    if (!item.taken && dist(state.player.x, state.player.y, item.x, item.y) < 30) {
      item.taken = true;
      state.lootTaken += 1;
      state.score += LOOT_SCORE;
    }
  }

  // Vault crack: stand by the safe once every loot bag is taken.
  const v = state.level.vault;
  const vcX = v.x + v.w / 2;
  const vcY = v.y + v.h / 2;
  const nearVault = dist(state.player.x, state.player.y, vcX, vcY) < 95;
  if (!state.vaultOpen && state.lootTaken === state.loot.length && nearVault) {
    state.vaultProgress += dt;
    if (state.vaultProgress >= VAULT_CRACK_TIME) {
      state.vaultOpen = true;
      state.exitOpen = true;
      state.score += VAULT_SCORE;
      state.message = 'BRANKAS TERBUKA! Kabur ke van!';
      state.messageUntil = state.now + 3;
    }
  } else if (!state.vaultOpen) {
    state.vaultProgress = Math.max(0, state.vaultProgress - dt * 2);
  }

  // Getaway: reach the van once the vault is open.
  if (state.exitOpen && pointInRect(state.player.x, state.player.y, state.level.exit)) {
    const bonus = Math.round(state.timeLeft) * TIME_BONUS_PER_SEC;
    state.score += bonus;
    if (!state.everSeen) state.score += GHOST_BONUS;
    state.stars = starsFor(state.timeLeft, state.level.timeLimit);
    state.phase = 'levelComplete';
    state.timeBonus = bonus;
    state.ghost = !state.everSeen;
  } else if (!state.exitOpen && pointInRect(state.player.x, state.player.y, state.level.exit)
    && state.now > state.messageUntil) {
    state.message = 'Van belum bisa jalan — bobol brankas dulu!';
    state.messageUntil = state.now + 2.5;
  }
  return state;
}

// Fresh state for the next level, carrying the campaign score forward.
export function nextLevelState(prevState) {
  const next = createGame(levelById(prevState.level.id + 1), prevState.now);
  next.score = prevState.score;
  return next;
}

export function guardCount(levelDef) { return levelDef.guards.length; }
export function cameraCount(levelDef) { return levelDef.cameras.length; }
