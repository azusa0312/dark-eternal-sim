/* =====================================================================
 * 永遠之暗共用機制零件
 *  - 胸前輪盤（青魂／青之連魂的儲存圖示）
 *  - 儲存的範圍攻擊：中間矩形（記外）、兩側矩形（記內）、王身邊圓形（記外）、環形（記內）
 *  - 青之二重波／四重波：從王射出的扇形分攤（二重 = 點雙 T、4 人分攤；四重 = 點 4 名 TH 或 DPS、2 人分攤）
 *  - 青之衝擊（坦克死刑扇形）、暗之死腕、死亡警告、死之恐懼（引導黑手）
 * 站位全部依子言姐姐 7.3 攻略影片的示意圖量測。
 * ===================================================================== */

/* ---------- 胸前輪盤 ---------- */
const KIND_INFO = {
  mid: { safe: 'out', name: '中間矩形', col: 0x6fd6ff },
  side: { safe: 'in', name: '兩側矩形', col: 0x6fd6ff },
  circle: { safe: 'out', name: '王身邊圓形', col: 0x6fd6ff },
  donut: { safe: 'in', name: '環形', col: 0x6fd6ff },
};
const SAFE_TXT = { in: '內', out: '外' };
function iconTexKind(kind, num, lit) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = lit ? 'rgba(90,200,255,.95)' : 'rgba(20,40,70,.85)';
  g.beginPath();
  g.moveTo(64, 4);
  g.lineTo(124, 64);
  g.lineTo(64, 124);
  g.lineTo(4, 64);
  g.closePath();
  g.fill();
  g.strokeStyle = '#bfefff';
  g.lineWidth = 5;
  g.stroke();
  g.fillStyle = lit ? '#0b2236' : '#bfefff';
  if (kind === 'mid') g.fillRect(52, 30, 24, 68);
  if (kind === 'side') {
    g.fillRect(30, 40, 16, 48);
    g.fillRect(82, 40, 16, 48);
  }
  if (kind === 'circle') {
    g.beginPath();
    g.arc(64, 64, 26, 0, 7);
    g.fill();
  }
  if (kind === 'donut') {
    g.lineWidth = 10;
    g.strokeStyle = g.fillStyle;
    g.beginPath();
    g.arc(64, 64, 24, 0, 7);
    g.stroke();
  }
  if (num) {
    g.font = '900 30px system-ui';
    g.fillStyle = '#fff';
    g.textAlign = 'center';
    g.fillText(num, 64, 120);
  }
  return canvasTex(cv);
}
function clearWheel() {
  const w = bossParts.wheel;
  while (w.children.length) w.remove(w.children[0]);
  w.rotation.z = 0;
}
// 在輪盤上放圖示：slots = [{kind, num, lit}]，依序排在下、左、上、右（4 個）或正中（1 個）
function showWheel(slots) {
  clearWheel();
  slots.forEach((s, i) => {
    const sp = new T.Mesh(
      new T.PlaneGeometry(1.5, 1.5),
      new T.MeshBasicMaterial({
        map: iconTexKind(s.kind, s.num, s.lit),
        transparent: true,
        depthWrite: false,
      }),
    );
    if (slots.length > 1) {
      const a = (i / slots.length) * Math.PI * 2;
      sp.position.set(Math.sin(a) * 2.2, -Math.cos(a) * 2.2, 0.1);
    }
    sp.userData.slot = i;
    bossParts.wheel.add(sp);
  });
}

/* ---------- 儲存攻擊：範圍與判定 ---------- */
const MID_HW = 5, // 中間矩形半寬
  SIDE_IN = 8.5, // 兩側矩形從 |x|>8.5 開始
  CIRCLE_R = 14, // 以王為圓心的圓形半徑
  DONUT_IN = 12; // 環形內側安全半徑
function storedMesh(kind, op = 0.4) {
  const c = KIND_INFO[kind].col;
  if (kind === 'mid') return rectMesh(-MID_HW, MID_HW, -HZ, HZ, c, op);
  if (kind === 'side') {
    const g = new T.Group();
    g.add(rectMesh(-HX, -SIDE_IN, -HZ, HZ, c, op), rectMesh(SIDE_IN, HX, -HZ, HZ, c, op));
    g.material = g.children[0].material;
    return g;
  }
  if (kind === 'circle') {
    const m = circleMesh(BOSS.x, BOSS.z, CIRCLE_R, c, op);
    return m;
  }
  return ringMesh(BOSS.x, BOSS.z, DONUT_IN, 40, c, op);
}
function storedHit(kind, p) {
  if (kind === 'mid') return Math.abs(p.x) < MID_HW;
  if (kind === 'side') return Math.abs(p.x) > SIDE_IN;
  if (kind === 'circle') return dist(p, BOSS) < CIRCLE_R;
  return dist(p, BOSS) > DONUT_IN;
}
function storedWhy(kind) {
  return {
    mid: '中間矩形（儲存的是「打中間」→ 要站外側）',
    side: '兩側矩形（儲存的是「打兩側」→ 要站內側）',
    circle: '王身邊的圓形（儲存的是圓形 → 要離王遠，站外）',
    donut: '環形（儲存的是環形 → 要靠近王，站內）',
  }[kind];
}

/* ---------- 青之二重波／四重波 分攤站位 ---------- */
const STACK_POS = {
  four: {
    out: { MT: 'A', D1: 'A', ST: 'B', D2: 'B', H1: 'C', D3: 'C', H2: 'D', D4: 'D' },
    in: { MT: '1', D1: '1', ST: '2', D2: '2', H1: '3', D3: '3', H2: '4', D4: '4' },
  },
  two: {
    out: { W: { x: -9.5, z: -3 }, E: { x: 9.5, z: -3 } },
    in: { W: { x: -3.1, z: -9.3 }, E: { x: 3.1, z: -9.3 } },
  },
};
const WAVE_NAME = { two: '青之二重波', four: '青之四重波' };
function stackSpot(m, type, safe) {
  if (type === 'two') {
    const b = STACK_POS.two[safe][SIDE[m.id]];
    const k = ['MT', 'ST', 'H1', 'H2', 'D1', 'D2', 'D3', 'D4'].indexOf(m.id) >> 1;
    return { x: b.x + (k % 2 ? 0.35 : -0.35), z: b.z + (k > 1 ? 0.35 : -0.35) };
  }
  const w = WAYMARKS[STACK_POS.four[safe][m.id]];
  return { x: w.x + (ROLE_INFO[m.id].grp === 'S' ? -0.3 : 0.3), z: w.z };
}
function stackSpotName(m, type, safe) {
  if (type === 'two')
    return `${SIDE[m.id] === 'W' ? '西' : '東'}側${safe === 'in' ? '數字點 3／4 附近' : 'A／C 或 B／D 之間'}（四人一組）`;
  return `場標 ${STACK_POS.four[safe][m.id]}（和 ${PARTNER[m.id]} 兩人一組）`;
}
const WAVE_HALF = 9; // 扇形半角
// 讀條期間在被點名的人頭上標記
function waveTargets(type) {
  if (type === 'two') return ['MT', 'ST'];
  return Math.random() < 0.5 ? ['MT', 'ST', 'H1', 'H2'] : ['D1', 'D2', 'D3', 'D4'];
}
function markWave(type, targets) {
  members.forEach((m) =>
    setTag(m, targets.includes(m.id) ? (type === 'two' ? '4人分攤' : '2人分攤') : '', '#7fe0ff'),
  );
}
// 判定分攤扇形；回傳失敗原因陣列
function resolveWave(type, targets) {
  const need = type === 'two' ? 4 : 2;
  const reasons = [];
  const cones = targets.map((id) => {
    const tm = byId(id);
    const a = angOfPt(tm, BOSS);
    const mesh = coneMesh(BOSS, a, WAVE_HALF, 50, 0x7fe0ff, 0.55, 0.1);
    strongFlash(mesh);
    return { id, a, inside: members.filter((m) => inCone(m, BOSS, a, WAVE_HALF)) };
  });
  cones.forEach((c) => {
    if (c.inside.length < need)
      reasons.push(
        `${who(byId(c.id))} 的${WAVE_NAME[type]}只有 ${c.inside.length} 人分攤（需要 ${need} 人）。`,
      );
  });
  members.forEach((m) => {
    const n = cones.filter((c) => c.inside.includes(m)).length;
    if (n > 1) reasons.push(`${who(m)} 同時被 ${n} 道${WAVE_NAME[type]}打到（每人只能吃一道）。`);
  });
  members.forEach((m) => setTag(m, ''));
  return reasons;
}

/* ---------- 青之衝擊：坦克死刑扇形（90°） ---------- */
const SHOCK_HALF = 45;
const TANK_CORNER = { MT: { x: -16.8, z: -13.8 }, ST: { x: 16.8, z: -13.8 } };
// 對 tankId 打一次；回傳失敗原因
function shockHit(tankId) {
  const tm = byId(tankId);
  const a = angOfPt(tm, BOSS);
  strongFlash(coneMesh(BOSS, a, SHOCK_HALF, 60, 0xff3355, 0.5, 0.11));
  screenFlash();
  const r = [];
  members.forEach((m) => {
    if (m === tm || !inCone(m, BOSS, a, SHOCK_HALF)) return;
    r.push(
      m.tank
        ? `${who(m)} 被 ${tankId} 的青之衝擊打到（坦克也不能吃兩下，要錯開）。`
        : `${who(m)} 被 ${tankId} 的青之衝擊（90° 扇形）打到。${tankId} 要站${tankId === 'MT' ? '左上（西北）' : '右上（東北）'}角落把扇形引開。`,
    );
  });
  if (hasVuln(tm)) r.push(`${who(tm)} 身上還有易傷就吃了青之衝擊。`);
  giveVuln(tm, 4);
  return r;
}
// 坦克頭上的死刑標記
function shockMark(id) {
  setTag(byId(id), '死刑', '#ff6688');
}

/* ---------- 暗之死腕：先打兩側（中間安全），再用發光的手打 2/3 場 ---------- */
const GRIP_MID = 6;
function coldGrip(next, opt = {}) {
  const glow = variant('gripVar', ['E', 'W']);
  const safeX = glow === 'E' ? -12 : 12;
  const LEN = opt.len || 6;
  setCast('暗之死腕', `王${glow === 'E' ? '東（右）' : '西（左）'}側的手在發光`, LEN);
  setArmGlow(glow);
  advice = '先站中間（兩側先被打），再到「沒發光的手」那一側。';
  const sides = new T.Group();
  sides.add(rectMesh(-HX, -GRIP_MID, -HZ, HZ, 0xb050ff, 0.3), rectMesh(GRIP_MID, HX, -HZ, HZ, 0xb050ff, 0.3));
  sides.material = sides.children[0].material;
  omen(sides, LEN);
  setPlan((m) => ({ x: Math.max(-4.5, Math.min(4.5, m.x * 0.3)), z: m.z }), 0.4);
  at(t + LEN, () => {
    removeFx(sides);
    const s2 = new T.Group();
    s2.add(rectMesh(-HX, -GRIP_MID, -HZ, HZ, 0xb050ff, 0.5), rectMesh(GRIP_MID, HX, -HZ, HZ, 0xb050ff, 0.5));
    strongFlash(s2);
    if (
      !judge('暗之死腕', (m) =>
        Math.abs(m.x) > GRIP_MID
          ? `${who(m)} 站在${m.x < 0 ? '西' : '東'}側，被第一段（兩側矩形）打到。第一段要站中間。`
          : '',
      )
    )
      return;
    const big =
      glow === 'E'
        ? rectMesh(-GRIP_MID, HX, -HZ, HZ, 0x9b3bff, 0.32)
        : rectMesh(-HX, GRIP_MID, -HZ, HZ, 0x9b3bff, 0.32);
    omen(big, 2.6);
    setPlan((m) => ({ x: safeX + (m.x > 0 ? 1.5 : -1.5) * 0, z: m.z }), 0.1);
    at(t + 2.6, () => {
      removeFx(big);
      strongFlash(
        glow === 'E'
          ? rectMesh(-GRIP_MID, HX, -HZ, HZ, 0x9b3bff, 0.5)
          : rectMesh(-HX, GRIP_MID, -HZ, HZ, 0x9b3bff, 0.5),
      );
      setArmGlow(null);
      if (
        !judge('暗之死腕', (m) =>
          (glow === 'E' ? m.x > -GRIP_MID : m.x < GRIP_MID)
            ? `${who(m)} 被發光的手（${glow === 'E' ? '東' : '西'}側）打到。第二段要到沒發光那側：${glow === 'E' ? '西' : '東'}側外三分之一。`
            : '',
        )
      )
        return;
      cast = null;
      next();
    });
  });
}

/* ---------- 死亡警告：中間直線＋留下黑泥、黑翼側 4 隻手、白翼側 1 隻手、最後黑暗一擊分散 ---------- */
const MM_MUD = 5.5;
const MM_HAND_Z = { black: [-12.3, -7.2, -1.5, 8.8], white: [4.4] };
// 黑翼在西時的最終位置（黑翼在東時整體平移，不鏡像）
const MM_POS_W = {
  MT: { x: -16.2, z: 5.9 },
  ST: { x: -7.0, z: 2.9 },
  D1: { x: 6.5, z: -13.5 },
  D2: { x: 15.4, z: -13.5 },
  H1: { x: 6.5, z: -0.9 },
  H2: { x: 15.4, z: -0.9 },
  D3: { x: 6.5, z: 11.6 },
  D4: { x: 15.4, z: 11.6 },
};
function mmPos(m, black) {
  const p = MM_POS_W[m.id];
  if (black === 'W') return p;
  return { x: m.tank ? p.x + 23.2 : p.x - 21.9, z: p.z };
}
const SPREAD_R = 5.5;
function mementoMori(next) {
  const black = variant('wingVar', ['W', 'E']);
  const LEN = 6;
  setCast('死亡警告', `${black === 'W' ? '西（左）' : '東（右）'}翼是黑色`, LEN);
  setWings(black);
  advice = '雙 T 去黑翼那側、其他 6 人去白翼那側；中間會被打並留下黑泥。';
  const strip = omen(rectMesh(-MM_MUD, MM_MUD, -HZ, HZ, 0x8a2bff, 0.3), LEN);
  setPlan((m) => {
    const p = mmPos(m, black);
    return { x: p.x, z: p.z };
  }, 0.5);
  at(t + LEN, () => {
    removeFx(strip);
    strongFlash(rectMesh(-MM_MUD, MM_MUD, -HZ, HZ, 0x8a2bff, 0.5));
    if (
      !judge('死亡警告', (m) => (Math.abs(m.x) < MM_MUD ? `${who(m)} 站在中間，被死亡警告的直線打到。` : ''))
    )
      return;
    const mud = addFx(rectMesh(-MM_MUD, MM_MUD, -HZ, HZ, 0x2a0a48, 0.75, 0.05), 6.2, false);
    mud.renderOrder = 2;
    // 黑泥：之後踩進去就失敗
    const mudEnd = t + 6.1;
    tick(() => {
      if (t > mudEnd) return true;
      const bad = members.find((m) => Math.abs(m.x) < MM_MUD - 0.3);
      if (bad) {
        fail('死亡警告', [`${who(bad)} 踩到中間的黑泥（會附加 15 秒流血）。黑泥消失前不要進中間。`]);
        return true;
      }
    });
    // 手：黑翼側 4 隻朝外、白翼側 1 隻朝外
    const lines = [];
    const addHands = (side, zs) =>
      zs.forEach((z) => {
        const sx = side === 'W' ? -1 : 1;
        const o = { x: sx * MM_MUD, z };
        const d = { x: sx, z: 0 };
        addFx(placeHand(handModel(1.3), o, d), 4, false);
        lines.push({ o, d, mesh: omen(lineMesh(o, d, 14, 1.7, 0xff7a3d, 0.32), 3.2) });
      });
    addHands(black, MM_HAND_Z.black);
    addHands(black === 'W' ? 'E' : 'W', MM_HAND_Z.white);
    at(t + 3.2, () => {
      lines.forEach((l) => {
        removeFx(l.mesh);
        strongFlash(lineMesh(l.o, l.d, 14, 1.7, 0xff7a3d, 0.5));
      });
      if (
        !judge('死亡警告', (m) => {
          const l = lines.find((l) => inLine(m, l.o, l.d, 14, 1.7));
          return l
            ? `${who(m)} 被${l.o.x < 0 ? '西' : '東'}側黑手的直線打到（z=${l.o.z.toFixed(0)} 那排）。照圖站在手與手的縫隙中。`
            : '';
        })
      )
        return;
      // 黑暗一擊：全員圓形分散
      setCast('黑暗一擊', '全員點名圓形，不能重疊', 3);
      advice = '黑暗一擊：照圖站在手與手的縫隙，彼此保持距離（黑泥還在，別進中間）。';
      members.forEach((m) => {
        const c = circleMesh(0, 0, SPREAD_R, 0xd070ff, 0.18, 0.09);
        m.obj.add(c);
        c.position.set(0, 0.09, 0);
        m._spread = c;
      });
      at(t + 3, () => {
        members.forEach((m) => {
          m.obj.remove(m._spread);
          strongFlash(circleMesh(m.x, m.z, SPREAD_R, 0xd070ff, 0.35));
        });
        setWings(null);
        if (
          !judge('黑暗一擊', (m) => {
            const o = members.filter((o) => o !== m && dist(o, m) < SPREAD_R);
            return o.length
              ? `${who(m)} 和 ${o.map(who).join('、')} 的黑暗一擊重疊（距離小於 ${SPREAD_R}）。`
              : '';
          })
        )
          return;
        cast = null;
        next();
      });
    });
  });
}

/* ---------- 死之恐懼：8 灘黑泥長出黑手，黑手對最近的人放直線 ---------- */
// 子言示意圖兩種配置；p = 黑泥中心，d = 手臂朝外的方向（人站在 p + d*3.8）
const FEAR_LAYOUT = {
  A: {
    MT: [-10.7, -5.2, -0.72, -0.69],
    D1: [-6.1, -3.2, 0, -1],
    D2: [6.2, -9.7, 0, -1],
    ST: [10.9, -4.7, 0.99, -0.13],
    H1: [-11.7, 3.4, -0.91, 0.4],
    D4: [6.0, 3.4, 0, 1],
    D3: [-5.6, 9.9, -0.48, 0.88],
    H2: [11.1, 9.4, 0.96, 0.29],
  },
  B: {
    MT: [-10.7, -4.7, -0.86, -0.51],
    D1: [-3.6, -8.8, 0, -1],
    D2: [4.5, -4.2, 0, -1],
    ST: [10.9, -9.8, 1, 0],
    H1: [-11.2, 7.5, -0.98, 0.2],
    D3: [-4.6, 3.9, 0, 1],
    D4: [4.5, 8.5, 0.37, 0.93],
    H2: [10.9, 3.4, 0.92, 0.39],
  },
};
const PUDDLE_R = 2.6,
  FEAR_HW = 2.2;
function fearSpot(lay, id) {
  const [x, z, dx, dz] = FEAR_LAYOUT[lay][id];
  return { x: x + dx * 3.8, z: z + dz * 3.8 };
}
// opt.embrace：接著「引導之翼」——在黑手原地放圓形，圓形判定後再長出黑手放直線（可迴避）
function fearOfDeath(next, opt = {}) {
  const lay = variant('fearVar', ['A', 'B']);
  const LEN = 5;
  setCast('死之恐懼', '全體傷害＋地上出現 8 灘黑泥', LEN);
  advice = '站到自己那灘黑泥的「外側」旁邊（不要踩泥），讓黑手的直線朝場外放。';
  const puddles = ROLE_IDS.map((id) => {
    const [x, z] = FEAR_LAYOUT[lay][id];
    const mesh = omen(circleMesh(x, z, PUDDLE_R, 0x2a0a48, 0.85, 0.06), LEN + 5);
    mesh.renderOrder = 3;
    return { id, x, z, mesh };
  });
  setPlan((m) => fearSpot(lay, m.id), 0.6);
  at(t + LEN, () => {
    screenFlash();
    puddles.forEach((p) => strongFlash(circleMesh(p.x, p.z, PUDDLE_R, 0x9b3bff, 0.5)));
    if (
      !judge('死之恐懼', (m) => {
        const p = puddles.find((p) => dist(p, m) < PUDDLE_R);
        return p ? `${who(m)} 站在黑泥上（${where(p)}），黑手長出來時被打到。` : '';
      })
    )
      return;
    // 黑手長出，對最近的人放直線（不可迴避）
    setCast('壓潰', '黑手對最近的人放直線', 2.4);
    const hands = puddles.map((p) => {
      const h = addFx(handModel(1.4), 6, false);
      h.position.set(p.x, 0, p.z);
      return { ...p, h };
    });
    at(t + 2.4, () => {
      const reasons = [];
      const hits = new Map();
      hands.forEach((h) => {
        let best = null,
          bd = 1e9;
        members.forEach((m) => {
          const d = dist(m, h);
          if (d < bd) {
            bd = d;
            best = m;
          }
        });
        const d = norm({ x: best.x - h.x, z: best.z - h.z });
        if (best.id !== h.id)
          reasons.push(
            `${who(byId(h.id))} 沒站到自己黑泥（${where(h)}）的外側，那隻黑手改打離它最近的 ${who(best)}。`,
          );
        placeHand(h.h, h, d);
        strongFlash(lineMesh(h, d, 40, FEAR_HW, 0x9b3bff, 0.5));
        members.forEach((m) => {
          if (inLine(m, h, d, 40, FEAR_HW)) hits.set(m, (hits.get(m) || []).concat(h.id));
        });
      });
      members.forEach((m) => {
        const hs = hits.get(m) || [];
        if (hs.length > 1)
          reasons.push(
            `${who(m)} 吃到 ${hs.length} 道黑手直線（${hs.map((i) => i + ' 的手').join('、')}）。要站在自己黑泥的外側，讓直線朝場外。`,
          );
      });
      if (reasons.length) return fail('死之恐懼', reasons);
      puddles.forEach((p) => removeFx(p.mesh));
      if (!opt.embrace) {
        cast = null;
        return next();
      }
      embraceAfterFear(lay, next);
    });
  });
}
// 引導之翼：全員點名圓形，放在剛剛引導黑手的位置；判定後原地長出黑手，對最近的人放直線（可迴避）
function embraceAfterFear(lay, next) {
  const R = 2.8;
  setCast('引導之翼', '全員點名圓形，放在剛剛的位置', 4);
  advice = '原地放圓形（不要靠近別人），圓形判定後會原地長出黑手，等直線出現再閃。';
  members.forEach((m) => {
    const c = circleMesh(0, 0, R, 0xd070ff, 0.2, 0.09);
    m.obj.add(c);
    m._spread = c;
  });
  setPlan((m) => fearSpot(lay, m.id), 0.2);
  at(t + 4, () => {
    const drops = members.map((m) => {
      m.obj.remove(m._spread);
      strongFlash(circleMesh(m.x, m.z, R, 0xd070ff, 0.4));
      return { id: m.id, x: m.x, z: m.z };
    });
    if (
      !judge('引導之翼', (m) => {
        const o = members.filter((o) => o !== m && dist(o, m) < R);
        return o.length ? `${who(m)} 和 ${o.map(who).join('、')} 的圓形重疊。` : '';
      })
    )
      return;
    // 黑手長在放圓形的位置，直線指向最近的人 → 往場內再走 4 步就能閃開（直線朝外）
    setCast('壓潰', '黑手直線出現後走開', 3.2);
    const lines = drops.map((d) => {
      const h = addFx(handModel(1.3), 4, false);
      h.position.set(d.x, 0, d.z);
      return { ...d, h };
    });
    at(t + 0.6, () => {
      lines.forEach((l) => {
        let best = null,
          bd = 1e9;
        members.forEach((m) => {
          const dd = dist(m, l);
          if (dd < bd) {
            bd = dd;
            best = m;
          }
        });
        l.d = norm({ x: best.x - l.x + 1e-3, z: best.z - l.z });
        placeHand(l.h, l, l.d);
        l.mesh = omen(lineMesh(l, l.d, 40, 1.8, 0xff7a3d, 0.32), 2.6);
      });
      // 往場中走開（直線朝外，往內就安全）
      setPlan(
        (m) =>
          nearestOk(
            fearSpot(lay, m.id),
            (p) =>
              inRect(p, -HX + 0.8, HX - 0.8, -HZ + 0.8, HZ - 0.8) &&
              !lines.some((l) => inLine(p, l, l.d, 40, 2.3)),
          ),
        0.15,
      );
      advice = '黑手直線已出現：橫向走開（往旁邊閃）。';
    });
    at(t + 3.2, () => {
      lines.forEach((l) => {
        removeFx(l.mesh);
        strongFlash(lineMesh(l, l.d, 40, 1.8, 0xff7a3d, 0.5));
      });
      if (
        !judge('引導之翼（黑手）', (m) => {
          const l = lines.find((l) => inLine(m, l, l.d, 40, 1.8));
          return l ? `${who(m)} 沒閃開 ${l.id} 位置長出的黑手直線。直線出現後要橫向走開。` : '';
        })
      )
        return;
      cast = null;
      next();
    });
  });
}
