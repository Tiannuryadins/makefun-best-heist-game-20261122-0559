// Geometry helpers for Midnight Vault: line-of-sight, movement collision
// and vision-cone tests. Walls are axis-aligned rectangles; everything
// else is a point or a circle.

// Does segment (x1,y1)-(x2,y2) cross rectangle r? (slab method)
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

// True when no wall blocks the sight line between two points.
export function hasLineOfSight(x1, y1, x2, y2, walls) {
  for (const w of walls) {
    if (segmentHitsRect(x1, y1, x2, y2, w)) return false;
  }
  return true;
}

// Circle (cx,cy,r) against rectangle: push the circle out and report hit.
export function circleRectResolve(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return null;
  if (d2 < 1e-9) return { x: cx, y: rect.y - r };
  const d = Math.sqrt(d2);
  return { x: nx + (dx / d) * r, y: ny + (dy / d) * r };
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

// Smallest absolute difference between two angles, in radians.
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// Is target inside the watcher's vision cone (range + half-angle + LOS)?
export function inVisionCone(watcher, target, range, halfAngle, walls) {
  const d = dist(watcher.x, watcher.y, target.x, target.y);
  if (d > range) return false;
  if (d < 1e-6) return true;
  const ang = Math.atan2(target.y - watcher.y, target.x - watcher.x);
  if (angleDiff(ang, watcher.angle) > halfAngle) return false;
  return hasLineOfSight(watcher.x, watcher.y, target.x, target.y, walls);
}
