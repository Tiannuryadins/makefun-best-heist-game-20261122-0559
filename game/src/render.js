// Canvas rendering for Midnight Vault: every visual is drawn procedurally
// at run time — no image files. The frame must read at a glance: gold loot,
// yellow guard cones, red camera cones, the steel vault, the green getaway
// van and the thief in black.

import { FIELD_W, FIELD_H } from './levels.js';

function conePath(ctx, x, y, angle, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, halfAngle, range, color) {
  const grad = ctx.createRadialGradient(x, y, 10, x, y, range);
  grad.addColorStop(0, color.replace('A', '0.34'));
  grad.addColorStop(1, color.replace('A', '0.05'));
  ctx.fillStyle = grad;
  conePath(ctx, x, y, angle, halfAngle, range);
  ctx.fill();
  ctx.strokeStyle = color.replace('A', '0.28');
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawGame(ctx, state) {
  const L = state.level;
  // Floor: dark bank marble with tile grid.
  ctx.fillStyle = '#171d2b';
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= FIELD_W; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FIELD_H); ctx.stroke();
  }
  for (let y = 0; y <= FIELD_H; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(FIELD_W, y); ctx.stroke();
  }
  // Carpet runner down the middle of each room.
  ctx.fillStyle = 'rgba(122,32,48,0.35)';
  ctx.fillRect(0, 300, FIELD_W, 56);

  // Shadow zones (dark cover that halves detection).
  for (const s of L.shadows) {
    ctx.fillStyle = 'rgba(6,10,18,0.72)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(120,200,255,0.25)';
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(150,210,255,0.55)';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.label, s.x + s.w / 2, s.y + s.h / 2 + 5);
  }

  // Getaway van (exit).
  const e = L.exit;
  const vanOpen = state.exitOpen;
  ctx.save();
  ctx.fillStyle = vanOpen ? 'rgba(34,197,94,0.20)' : 'rgba(148,163,184,0.14)';
  ctx.fillRect(e.x - 6, e.y - 6, e.w + 12, e.h + 12);
  ctx.fillStyle = vanOpen ? '#22c55e' : '#64748b';
  roundRect(ctx, e.x + 6, e.y + 16, e.w - 12, 44, 8);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(e.x + e.w - 34, e.y + 24, 22, 28); // cab window
  ctx.fillStyle = '#0f172a';
  ctx.beginPath(); ctx.arc(e.x + 28, e.y + 66, 11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(e.x + e.w - 28, e.y + 66, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = vanOpen ? '#dcfce7' : '#e2e8f0';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(vanOpen ? 'KABUR!' : 'GETAWAY', e.x + e.w / 2, e.y + 12);
  ctx.restore();

  // Vault: steel door with a dial; gold glow when cracked open.
  const v = L.vault;
  ctx.save();
  if (state.vaultOpen) {
    const glow = ctx.createRadialGradient(v.x + v.w / 2, v.y + v.h / 2, 6, v.x + v.w / 2, v.y + v.h / 2, 120);
    glow.addColorStop(0, 'rgba(250,204,21,0.5)');
    glow.addColorStop(1, 'rgba(250,204,21,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(v.x - 60, v.y - 60, v.w + 120, v.h + 120);
  }
  ctx.fillStyle = state.vaultOpen ? '#713f12' : '#475569';
  roundRect(ctx, v.x, v.y, v.w, v.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = state.vaultOpen ? '#facc15' : '#94a3b8';
  ctx.beginPath(); ctx.arc(v.x + v.w / 2, v.y + v.h / 2, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath(); ctx.arc(v.x + v.w / 2, v.y + v.h / 2, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.vaultOpen ? 'TERBUKA' : 'BRANKAS', v.x + v.w / 2, v.y + v.h - 8);
  if (!state.vaultOpen && state.vaultProgress > 0) {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(v.x, v.y - 10, v.w * (state.vaultProgress / 1.5), 6);
  }
  ctx.restore();

  // Loot bags.
  for (const item of state.loot) {
    if (item.taken) continue;
    const pulse = 1 + Math.sin(state.now * 3 + item.x) * 0.08;
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.scale(pulse, pulse);
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
    glow.addColorStop(0, 'rgba(250,204,21,0.55)');
    glow.addColorStop(1, 'rgba(250,204,21,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(0, -12); ctx.lineTo(10, -2); ctx.lineTo(8, 10); ctx.lineTo(-8, 10); ctx.lineTo(-10, -2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#713f12';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', 0, 8);
    ctx.restore();
  }

  // Walls.
  for (const w of L.walls) {
    ctx.fillStyle = '#2b3548';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(w.x, w.y, w.w, 3);
  }

  // Camera cones (red) + mounts.
  for (const c of state.cameras) {
    const disabled = state.now < state.empUntil;
    if (!disabled) drawCone(ctx, c.x, c.y, c.angle, c.fov / 2, c.range, 'rgba(239,68,68,A)');
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.fillStyle = disabled ? '#475569' : '#ef4444';
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(c.angle);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, -4, 18, 8);
    ctx.restore();
    if (disabled) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EMP', c.x, c.y + 26);
    }
  }

  // Guard cones (yellow) + guards.
  for (const g of state.guards) {
    const blind = state.now < state.smokeUntil
      && Math.hypot(g.x - state.smokeX, g.y - state.smokeY) < 175;
    if (!blind) drawCone(ctx, g.x, g.y, g.angle, g.fov / 2, g.range, 'rgba(250,204,21,A)');
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.fillStyle = g.alerted ? '#dc2626' : '#1d4ed8';
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#dbeafe';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Cap + facing tick.
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-9, -17, 18, 7);
    ctx.strokeStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(g.angle) * 20, Math.sin(g.angle) * 20);
    ctx.stroke();
    ctx.restore();
    if (g.alerted) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 24);
    }
  }

  // Smoke cloud.
  if (state.now < state.smokeUntil) {
    ctx.save();
    const grad = ctx.createRadialGradient(state.smokeX, state.smokeY, 10, state.smokeX, state.smokeY, 90);
    grad.addColorStop(0, 'rgba(226,232,240,0.75)');
    grad.addColorStop(1, 'rgba(226,232,240,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(state.smokeX, state.smokeY, 90, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // The thief: black hood, gold mask stripe, direction tick.
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  const inShadow = L.shadows.some((s) => p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 10, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = inShadow ? '#334155' : '#0f172a';
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-9, -4, 18, 5); // mask stripe
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(p.angle) * 19, Math.sin(p.angle) * 19);
  ctx.stroke();
  ctx.restore();

  // Click-to-move marker.
  if (state.moveTarget) {
    ctx.strokeStyle = 'rgba(250,204,21,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(state.moveTarget.x, state.moveTarget.y, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(state.moveTarget.x - 12, state.moveTarget.y);
    ctx.lineTo(state.moveTarget.x + 12, state.moveTarget.y);
    ctx.moveTo(state.moveTarget.x, state.moveTarget.y - 12);
    ctx.lineTo(state.moveTarget.x, state.moveTarget.y + 12);
    ctx.stroke();
  }

  // Alarm flash on the frame edge when the meter is high.
  if (state.alarm > 55) {
    ctx.strokeStyle = `rgba(239,68,68,${0.25 + 0.45 * (state.alarm / 100)})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, FIELD_W - 10, FIELD_H - 10);
  }
}
