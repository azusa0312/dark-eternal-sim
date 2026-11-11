/* =====================================================================
 * 場景：渲染器、相機、燈光、長方形地板、場標、永遠之暗（王）
 * 王在北側場外，有黑白兩翼（死亡警告）、左右兩隻巨手（暗之死腕）、
 * 胸前輪盤（青魂／青之連魂的圖示）。
 * ===================================================================== */

let renderer;
try {
  renderer = new T.WebGLRenderer({ antialias: true });
} catch (e) {
  window.__fatal('無法建立 WebGL，請開啟瀏覽器硬體加速。');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
$('stage').appendChild(renderer.domElement);

const scene = new T.Scene();
scene.background = new T.Color(0x0b0812);
scene.fog = new T.Fog(0x0b0812, 32, 80);
const camera = new T.PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 180);
scene.add(new T.HemisphereLight(0xe6e0ff, 0x140c1c, 0.9));
const sun = new T.DirectionalLight(0xf3ecff, 1.3);
sun.position.set(-10, 28, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 80 });
scene.add(sun);

function canvasTex(cv) {
  const t = new T.CanvasTexture(cv);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ---------- 地板：石質長方形，中央圓形紋路 ---------- */
function floorTexture() {
  const W = 1152,
    H = 960,
    k = W / (HX * 2),
    cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  const bg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
  bg.addColorStop(0, '#6f6656');
  bg.addColorStop(1, '#4a4440');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,240,220' : '20,15,25'},${Math.random() * 0.06})`;
    g.fillRect(Math.random() * W, Math.random() * H, Math.random() * 6 + 1, Math.random() * 6 + 1);
  }
  g.strokeStyle = 'rgba(30,22,26,.35)';
  g.lineWidth = 3;
  for (let r = 2; r <= 13; r += 1.6) {
    g.beginPath();
    g.arc(W / 2, H / 2, r * k, 0, 7);
    g.stroke();
  }
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    g.beginPath();
    g.moveTo(W / 2 + Math.cos(a) * 2 * k, H / 2 + Math.sin(a) * 2 * k);
    g.lineTo(W / 2 + Math.cos(a) * 12 * k, H / 2 + Math.sin(a) * 12 * k);
    g.stroke();
  }
  g.fillStyle = 'rgba(35,28,30,.55)';
  g.beginPath();
  g.arc(W / 2, H / 2, 1.8 * k, 0, 7);
  g.fill();
  // 輔助格線（三等分），方便判斷「左中右」「第一二三排」
  g.strokeStyle = 'rgba(255,240,210,.10)';
  g.lineWidth = 2;
  [1, 2].forEach((i) => {
    g.beginPath();
    g.moveTo((W * i) / 3, 0);
    g.lineTo((W * i) / 3, H);
    g.moveTo(0, (H * i) / 3);
    g.lineTo(W, (H * i) / 3);
    g.stroke();
  });
  g.strokeStyle = 'rgba(220,205,255,.9)';
  g.lineWidth = 8;
  g.strokeRect(4, 4, W - 8, H - 8);
  return canvasTex(cv);
}
const floor = new T.Mesh(
  new T.PlaneGeometry(HX * 2, HZ * 2).rotateX(-Math.PI / 2),
  new T.MeshStandardMaterial({ map: floorTexture(), roughness: 0.92 }),
);
floor.receiveShadow = true;
scene.add(floor);
const abyss = new T.Mesh(
  new T.PlaneGeometry(200, 200).rotateX(-Math.PI / 2),
  new T.MeshStandardMaterial({ color: 0x170d24, roughness: 1 }),
);
abyss.position.y = -0.6;
scene.add(abyss);
// 大十字：圓形場地外的區域變成虛空（用遮罩表示）
const gcMask = new T.Mesh(
  new T.RingGeometry(GC_R, 40, 96).rotateX(-Math.PI / 2),
  new T.MeshBasicMaterial({ color: 0x05030a, transparent: true, opacity: 0.88, depthWrite: false }),
);
gcMask.position.y = 0.03;
gcMask.renderOrder = 2;
gcMask.visible = false;
scene.add(gcMask);
const gcEdge = new T.Mesh(
  new T.RingGeometry(GC_R - 0.12, GC_R + 0.05, 128).rotateX(-Math.PI / 2),
  new T.MeshBasicMaterial({ color: 0x7fe0ff, transparent: true, opacity: 0.9, depthWrite: false }),
);
gcEdge.position.y = 0.04;
gcEdge.renderOrder = 2;
gcEdge.visible = false;
scene.add(gcEdge);
let arenaMode = 'rect';
function setArena(mode) {
  arenaMode = mode;
  gcMask.visible = gcEdge.visible = mode === 'circle';
}

function markTex(lbl, col, square) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = col + '55';
  g.strokeStyle = col;
  g.lineWidth = 7;
  if (square) {
    g.fillRect(14, 14, 100, 100);
    g.strokeRect(14, 14, 100, 100);
  } else {
    g.beginPath();
    g.arc(64, 64, 52, 0, 7);
    g.fill();
    g.stroke();
  }
  g.fillStyle = '#fff';
  g.font = '900 64px system-ui,sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(lbl, 64, 68);
  return canvasTex(cv);
}
Object.entries(WAYMARKS).forEach(([l, w]) => {
  const m = new T.Mesh(
    new T.PlaneGeometry(1.5, 1.5).rotateX(-Math.PI / 2),
    new T.MeshBasicMaterial({ map: markTex(l, w.col, w.sq), transparent: true, depthWrite: false }),
  );
  m.position.set(w.x, 0.04, w.z);
  m.renderOrder = 1;
  scene.add(m);
});

/* ---------- 王：永遠之暗 ---------- */
const boss = new T.Group();
const bossParts = {};
{
  const robe = new T.MeshStandardMaterial({ color: 0x1d1530, roughness: 0.55, metalness: 0.2 });
  const bone = new T.MeshStandardMaterial({ color: 0xcfc6e8, roughness: 0.5 });
  const glow = new T.MeshStandardMaterial({ color: 0x5ad8ff, emissive: 0x2bb6ff, emissiveIntensity: 0.8 });
  const body = new T.Mesh(new T.ConeGeometry(3.2, 9, 24, 1, true), robe);
  body.position.y = 4.5;
  body.castShadow = true;
  const torso = new T.Mesh(new T.CylinderGeometry(1.1, 1.6, 3, 20), robe);
  torso.position.y = 9.5;
  const head = new T.Mesh(new T.SphereGeometry(1.0, 20, 16), bone);
  head.position.y = 11.6;
  const halo = new T.Mesh(new T.TorusGeometry(2.6, 0.12, 8, 64), glow);
  halo.position.set(0, 9.8, 1.4);
  // 胸前輪盤
  const wheel = new T.Group();
  wheel.position.set(0, 9.6, 1.9);
  boss.add(body, torso, head, halo, wheel);
  bossParts.wheel = wheel;
  // 翅膀：左右各一，死亡警告時一黑一白
  const mkWing = (s) => {
    const w = new T.Mesh(
      new T.CircleGeometry(5.5, 24, 0, Math.PI * 0.75),
      new T.MeshStandardMaterial({ color: 0x3a3150, side: T.DoubleSide, roughness: 0.6 }),
    );
    w.position.set(s * 1.4, 10.5, -0.6);
    w.rotation.set(0, 0, s > 0 ? -0.35 : Math.PI + 0.35 - Math.PI * 0.75);
    boss.add(w);
    return w;
  };
  bossParts.wingE = mkWing(1);
  bossParts.wingW = mkWing(-1);
  // 巨手：暗之死腕時其中一隻發紫光
  const mkArm = (s) => {
    const g = new T.Group();
    const mat = new T.MeshStandardMaterial({ color: 0x2a2140, roughness: 0.5, emissive: 0x000000 });
    const arm = new T.Mesh(new T.CylinderGeometry(0.55, 0.8, 7, 12), mat);
    arm.rotation.z = s * 1.0;
    arm.position.set(s * 3.6, 7.5, 0.8);
    const palm = new T.Mesh(new T.BoxGeometry(2.2, 0.6, 2.6), mat);
    palm.position.set(s * 6.6, 5.4, 1.4);
    g.add(arm, palm);
    for (let i = 0; i < 4; i++) {
      const f = new T.Mesh(new T.CylinderGeometry(0.16, 0.22, 2.0, 8), mat);
      f.rotation.x = Math.PI / 2;
      f.position.set(s * 6.6 + (i - 1.5) * 0.5, 5.2, 3.3);
      g.add(f);
    }
    boss.add(g);
    return mat;
  };
  bossParts.armE = mkArm(1);
  bossParts.armW = mkArm(-1);
}
boss.position.set(0, 0, BOSS_Z);
boss.scale.setScalar(0.72);
boss.rotation.y = 0; // +z（南）為正面
scene.add(boss);

// 王的翅膀顏色：'E' 黑 = 東翼黑；null = 還原
function setWings(blackSide) {
  const c = (s) => (blackSide ? (s === blackSide ? 0x0a0a0a : 0xf4f4ff) : 0x3a3150);
  bossParts.wingE.material.color.setHex(c('E'));
  bossParts.wingW.material.color.setHex(c('W'));
  bossParts.wingE.material.emissive = new T.Color(blackSide === 'W' ? 0x666677 : 0);
  bossParts.wingW.material.emissive = new T.Color(blackSide === 'E' ? 0x666677 : 0);
}
// 暗之死腕：哪隻手發光（'E'／'W'／null）
function setArmGlow(side) {
  bossParts.armE.emissive.setHex(side === 'E' ? 0x9b3bff : 0);
  bossParts.armW.emissive.setHex(side === 'W' ? 0x9b3bff : 0);
  bossParts.armE.emissiveIntensity = bossParts.armW.emissiveIntensity = 1.6;
}
