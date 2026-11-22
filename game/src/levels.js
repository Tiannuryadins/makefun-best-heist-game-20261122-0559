// Level layouts for Midnight Vault. The play field is 1280 x 656 (the
// canvas below the HUD bar). Every level: walls block movement and sight,
// shadow zones halve detection, loot is worth +150, the vault is +500 and
// must be cracked after all loot is taken, and the getaway van only opens
// once the vault is cracked. Guards patrol waypoint loops; cameras sweep
// a fixed arc from a wall mount.

export const FIELD_W = 1280;
export const FIELD_H = 656;

function borderWalls() {
  return [
    { x: 0, y: 0, w: 1280, h: 14 },
    { x: 0, y: 642, w: 1280, h: 14 },
    { x: 0, y: 0, w: 14, h: 656 },
    { x: 1266, y: 0, w: 14, h: 656 },
  ];
}

export const LEVELS = [
  {
    id: 1,
    name: 'Lobi Bank Merdeka',
    timeLimit: 150,
    start: { x: 96, y: 590 },
    vault: { x: 1130, y: 34, w: 116, h: 78 },
    exit: { x: 30, y: 540, w: 130, h: 88 },
    walls: [
      ...borderWalls(),
      { x: 300, y: 110, w: 64, h: 190 }, // marble pillar
      { x: 700, y: 330, w: 64, h: 190 }, // marble pillar
      { x: 150, y: 440, w: 260, h: 42 }, // teller counter
      { x: 860, y: 96, w: 210, h: 38 }, // planter wall
      { x: 520, y: 90, w: 38, h: 150 }, // partition
    ],
    shadows: [
      { x: 46, y: 300, w: 190, h: 120, label: 'BAYANGAN' },
      { x: 1000, y: 420, w: 200, h: 150, label: 'BAYANGAN' },
    ],
    loot: [
      { x: 640, y: 120 },
      { x: 1180, y: 210 },
      { x: 430, y: 570 },
    ],
    guards: [
      {
        waypoints: [[400, 210], [400, 520], [920, 520], [920, 210]],
        speed: 58, range: 240, fov: 1.15,
      },
      {
        waypoints: [[1020, 300], [600, 300]],
        speed: 64, range: 230, fov: 1.15,
      },
    ],
    cameras: [
      { x: 640, y: 16, baseAngle: Math.PI / 2, sweep: 0.85, speed: 0.55, range: 300, fov: 0.62 },
    ],
  },
  {
    id: 2,
    name: 'Koridor Brankas',
    timeLimit: 180,
    start: { x: 96, y: 590 },
    vault: { x: 1130, y: 34, w: 116, h: 78 },
    exit: { x: 30, y: 540, w: 130, h: 88 },
    walls: [
      ...borderWalls(),
      { x: 240, y: 90, w: 200, h: 36 }, // archive shelf
      { x: 240, y: 300, w: 36, h: 220 }, // shelf column
      { x: 560, y: 160, w: 36, h: 240 }, // strongroom wall
      { x: 620, y: 470, w: 260, h: 40 }, // deposit counter
      { x: 900, y: 120, w: 36, h: 200 }, // vault ante-wall
      { x: 1020, y: 400, w: 180, h: 36 }, // planter wall
    ],
    shadows: [
      { x: 46, y: 120, w: 170, h: 130, label: 'BAYANGAN' },
      { x: 420, y: 480, w: 180, h: 120, label: 'BAYANGAN' },
      { x: 1040, y: 180, w: 180, h: 140, label: 'BAYANGAN' },
    ],
    loot: [
      { x: 350, y: 200 },
      { x: 760, y: 120 },
      { x: 1180, y: 300 },
      { x: 500, y: 580 },
    ],
    guards: [
      {
        waypoints: [[330, 150], [330, 560], [700, 560], [700, 150]],
        speed: 62, range: 245, fov: 1.15,
      },
      {
        waypoints: [[980, 180], [980, 540], [500, 540]],
        speed: 66, range: 235, fov: 1.15,
      },
      {
        waypoints: [[820, 300], [1120, 300], [1120, 480]],
        speed: 60, range: 230, fov: 1.15,
      },
    ],
    cameras: [
      { x: 460, y: 16, baseAngle: Math.PI / 2, sweep: 0.8, speed: 0.6, range: 300, fov: 0.62 },
      { x: 1080, y: 16, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.5, range: 300, fov: 0.62 },
    ],
  },
  {
    id: 3,
    name: 'Ruang Brankas Utama',
    timeLimit: 210,
    start: { x: 96, y: 590 },
    vault: { x: 1120, y: 30, w: 130, h: 86 },
    exit: { x: 30, y: 540, w: 130, h: 88 },
    walls: [
      ...borderWalls(),
      { x: 200, y: 100, w: 40, h: 200 }, // vault pillar
      { x: 200, y: 420, w: 220, h: 38 }, // gold counter
      { x: 500, y: 80, w: 220, h: 38 }, // display case
      { x: 500, y: 330, w: 40, h: 220 }, // pillar
      { x: 780, y: 120, w: 40, h: 200 }, // pillar
      { x: 820, y: 460, w: 240, h: 40 }, // cash desk
      { x: 1080, y: 220, w: 36, h: 180 }, // ante-wall
    ],
    shadows: [
      { x: 46, y: 180, w: 170, h: 130, label: 'BAYANGAN' },
      { x: 300, y: 500, w: 180, h: 110, label: 'BAYANGAN' },
      { x: 620, y: 200, w: 170, h: 130, label: 'BAYANGAN' },
      { x: 1060, y: 480, w: 170, h: 120, label: 'BAYANGAN' },
    ],
    loot: [
      { x: 330, y: 160 },
      { x: 640, y: 200 },
      { x: 940, y: 120 },
      { x: 1180, y: 380 },
      { x: 660, y: 580 },
    ],
    guards: [
      {
        waypoints: [[300, 160], [300, 560], [620, 560], [620, 160]],
        speed: 66, range: 250, fov: 1.15,
      },
      {
        waypoints: [[900, 200], [900, 560], [1150, 560]],
        speed: 68, range: 240, fov: 1.15,
      },
      {
        waypoints: [[700, 400], [1050, 400], [1050, 200], [700, 200]],
        speed: 62, range: 235, fov: 1.15,
      },
      {
        waypoints: [[420, 320], [420, 90], [760, 90]],
        speed: 64, range: 240, fov: 1.15,
      },
    ],
    cameras: [
      { x: 380, y: 16, baseAngle: Math.PI / 2, sweep: 0.85, speed: 0.6, range: 310, fov: 0.62 },
      { x: 760, y: 16, baseAngle: Math.PI / 2, sweep: 0.75, speed: 0.7, range: 310, fov: 0.62 },
      { x: 1150, y: 16, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.55, range: 310, fov: 0.62 },
    ],
  },
];

export function levelById(id) {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0];
}
