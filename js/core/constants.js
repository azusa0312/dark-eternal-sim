/* =====================================================================
 * 常數、職能、場標與小工具
 * 座標：x 往東為正、z 往南為正（北 = -z）。長方形場地 |x|≤HX、|z|≤HZ。
 * 永遠之暗站在場地北邊外側（BOSS_Z），面向南方。
 * 角度一律「由北起順時針」的度數。
 * ===================================================================== */

const $ = (id) => document.getElementById(id);
const T = THREE;

const HX = 18,
  HZ = 15, // 長方形場地半寬（東西）、半深（南北），比例取自子言影片示意圖
  GC_R = 12, // 大十字時縮成的圓形場地半徑
  BOSS_Z = -19, // 王的位置（北側場外）
  SPEED = 6;
const GROUP_NAME = { S: '支援組', D: 'DPS 組' };
const ROLE_INFO = {
  MT: { grp: 'S', col: 0x4f8dff, tank: 1 },
  ST: { grp: 'S', col: 0x4f8dff, tank: 1 },
  H1: { grp: 'S', col: 0x47c27a },
  H2: { grp: 'S', col: 0x47c27a },
  D1: { grp: 'D', col: 0xe0565b },
  D2: { grp: 'D', col: 0xe0565b },
  D3: { grp: 'D', col: 0xe0565b },
  D4: { grp: 'D', col: 0xe0565b },
};
const ROLE_IDS = Object.keys(ROLE_INFO);
// 固定搭檔（四重波兩人分攤、大十字分區都用這組）
const PARTNER = { MT: 'D1', D1: 'MT', ST: 'D2', D2: 'ST', H1: 'D3', D3: 'H1', H2: 'D4', D4: 'H2' };
// 左右兩組（二重波四人分攤、場地左右分組）
const SIDE = { MT: 'W', H1: 'W', D1: 'W', D3: 'W', ST: 'E', H2: 'E', D2: 'E', D4: 'E' };

// 場標：依子言影片「场地标点」量出的位置（全部集中在北半場）
const WAYMARKS = {
  1: { x: -4.5, z: -13.8, col: '#ff5a5a', sq: 1 },
  2: { x: 4.5, z: -13.8, col: '#ffd84a', sq: 1 },
  3: { x: -2.9, z: -9.8, col: '#4ab4ff', sq: 1 },
  4: { x: 2.9, z: -9.8, col: '#c77dff', sq: 1 },
  A: { x: -13.7, z: -5, col: '#ff5a5a', sq: 0 },
  B: { x: 13.7, z: -5, col: '#ffd84a', sq: 0 },
  C: { x: -9.9, z: -2.4, col: '#4ab4ff', sq: 0 },
  D: { x: 9.9, z: -2.4, col: '#c77dff', sq: 0 },
};
// 開場／待機站位：王前方散開
const IDLE = {
  MT: { x: -2, z: -9 },
  ST: { x: 2, z: -9 },
  H1: { x: -5, z: 2 },
  H2: { x: 5, z: 2 },
  D1: { x: -3, z: -4 },
  D2: { x: 3, z: -4 },
  D3: { x: -3, z: 5 },
  D4: { x: 3, z: 5 },
};

const P = (x, z) => ({ x, z });
const dirOf = (a) => {
  const r = (a * Math.PI) / 180;
  return { x: Math.sin(r), z: -Math.cos(r) };
};
const posAt = (a, r, c = { x: 0, z: 0 }) => {
  const d = dirOf(a);
  return { x: c.x + d.x * r, z: c.z + d.z * r };
};
const angOfPt = (p, c = { x: 0, z: 0 }) => {
  const a = (Math.atan2(p.x - c.x, -(p.z - c.z)) * 180) / Math.PI;
  return (a + 360) % 360;
};
const angDiff = (a, b) => {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return d > 180 ? 360 - d : d;
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const who = (m) => (m.isPlayer ? m.id + '（你）' : m.id);
const BOSS = { x: 0, z: BOSS_Z };

// 方位文字（給失敗訊息用）
function where(p) {
  const ns = p.z < -HZ / 3 ? '北' : p.z > HZ / 3 ? '南' : '';
  const ew = p.x < -HX / 3 ? '西' : p.x > HX / 3 ? '東' : '';
  return ns + ew || '中央';
}

/* ---------- 幾何判定 ---------- */
// 線段型（矩形）範圍：起點 o、方向 d（單位向量）、長 len、半寬 hw
function inLine(p, o, d, len, hw) {
  const vx = p.x - o.x,
    vz = p.z - o.z;
  const along = vx * d.x + vz * d.z;
  const side = Math.abs(vx * -d.z + vz * d.x);
  return along >= -0.3 && along <= len && side <= hw;
}
// 扇形：頂點 o、朝向角 a（度）、半角 half（度）
function inCone(p, o, a, half, len = 60) {
  if (dist(p, o) > len) return false;
  return angDiff(angOfPt(p, o), a) <= half;
}
// 軸對齊矩形
const inRect = (p, x0, x1, z0, z1) => p.x >= x0 && p.x <= x1 && p.z >= z0 && p.z <= z1;
const norm = (v) => {
  const l = Math.hypot(v.x, v.z) || 1;
  return { x: v.x / l, z: v.z / l };
};
