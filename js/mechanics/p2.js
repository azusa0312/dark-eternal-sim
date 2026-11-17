/* =====================================================================
 * 第二階段：黑暗巨腕＋引導之翼、青之連魂＋靈魂輪轉、青之環波、群體恐慌、狂暴「永遠之暗」
 * ===================================================================== */

/* ---------- 黑暗巨腕＋引導之翼 ---------- */
// 三排（北／中／南）；巨腕從東西兩側打兩排，剩一排安全
const ROWS = { 1: -10.5, 2: 0, 3: 10.5 };
const ROW_NAME = { 1: '第一排（北）', 2: '第二排（中）', 3: '第三排（南）' };
// 安全排內的分散位置（子言站位總結）：上排 MT D1 … D2 ST、下排 H1 D3 … D4 H2
const SPEC_POS = {
  MT: [-11.3, -2.4],
  D1: [-5.9, -2.4],
  D2: [8.25, -2.4],
  ST: [13.2, -2.4],
  H1: [-13.1, 2.4],
  D3: [-5.9, 2.4],
  D4: [8.25, 2.4],
  H2: [14.4, 2.4],
};
const EMB_R = 2.6;
function specter(next) {
  const row = +variant('rowVar', ['1', '2', '3']);
  const zr = ROWS[row];
  const LEN = 7;
  setCast('黑暗巨腕', '東西兩側巨手放橫向直線，只剩一排安全', LEN);
  advice = `找安全的橫排：${ROW_NAME[row]}。同時被點名引導之翼 → 照圖分散。`;
  const hitRows = [1, 2, 3].filter((r) => r !== row);
  const rowMesh = (r, op) => rectMesh(-HX, HX, ROWS[r] - 5.25, ROWS[r] + 5.25, 0xff9a3d, op);
  const omens = hitRows.map((r) => omen(rowMesh(r, 0.3), LEN));
  hitRows.forEach((r, i) => {
    const s = i ? 1 : -1;
    addFx(placeHand(handModel(4), { x: s * (HX + 3), z: ROWS[r] }, { x: -s, z: 0 }), LEN + 0.5, false);
  });
  at(t + 1.5, () => {
    setCast('引導之翼', '全員點名圓形', LEN - 1.5);
    members.forEach((m) => {
      const c = circleMesh(0, 0, EMB_R, 0xd070ff, 0.2, 0.09);
      m.obj.add(c);
      m._spread = c;
    });
  });
  setPlan((m) => P(SPEC_POS[m.id][0], zr + SPEC_POS[m.id][1]), 0.5);
  at(t + LEN, () => {
    omens.forEach(removeFx);
    hitRows.forEach((r) => strongFlash(rowMesh(r, 0.5)));
    const drops = members.map((m) => {
      m.obj.remove(m._spread);
      strongFlash(circleMesh(m.x, m.z, EMB_R, 0xd070ff, 0.4));
      return { id: m.id, x: m.x, z: m.z };
    });
    if (
      !judge('黑暗巨腕', (m) =>
        Math.abs(m.z - zr) > 5.25
          ? `${who(m)} 不在安全排（${ROW_NAME[row]}），被巨腕的橫向直線抓進異空間。`
          : '',
      )
    )
      return;
    if (
      !judge('引導之翼', (m) => {
        const o = members.filter((o) => o !== m && dist(o, m) < EMB_R);
        return o.length
          ? `${who(m)} 的圓形和 ${o.map(who).join('、')} 重疊。照圖在安全排分成上下兩排散開。`
          : '';
      })
    )
      return;
    // 小黑手原地長出 → 到黑手中間集合引導 → 範圍出現後閃
    const hands = drops.map((d) => ({ ...d, h: addFx(handModel(1.2), 6, false) }));
    hands.forEach((h) => h.h.position.set(h.x, 0, h.z));
    const gather = { x: 1, z: zr };
    setCast('壓潰', '在黑手中間集合，等直線出現再閃', 2.2);
    advice = '到這排的正中間集合（引導小黑手），直線出現後再走開。';
    setPlan((m) => ({ x: gather.x + (ROLE_INFO[m.id].grp === 'S' ? -0.4 : 0.4), z: gather.z }), 0.2);
    let lines = [];
    at(t + 2.2, () => {
      lines = hands.map((h) => {
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
        placeHand(h.h, h, d);
        return { o: h, d, mesh: omen(lineMesh(h, d, 40, 1.6, 0xff7a3d, 0.32), 2.6) };
      });
      setCast('壓潰', '直線出現 → 走開', 2.6);
      advice = '直線出現了：往南或往北走出所有直線。';
      const dz = zr > 0 ? -1 : 1; // 往場中方向閃
      setPlan((m) => {
        const want = {
          x: gather.x + (ROLE_INFO[m.id].grp === 'S' ? -1 : 1) * (1 + (m.id.charCodeAt(1) % 2)),
          z: zr + dz * 5.5,
        };
        return nearestOk(
          want,
          (p) =>
            inRect(p, -HX + 1, HX - 1, -HZ + 1, HZ - 1) && !lines.some((l) => inLine(p, l.o, l.d, 40, 2.1)),
        );
      }, 0.15);
      at(t + 2.6, () => {
        lines.forEach((l) => {
          removeFx(l.mesh);
          strongFlash(lineMesh(l.o, l.d, 40, 1.6, 0xff7a3d, 0.5));
        });
        if (
          !judge('引導之翼（小黑手）', (m) =>
            lines.some((l) => inLine(m, l.o, l.d, 40, 1.6)) ? `${who(m)} 沒閃開小黑手的直線。` : '',
          )
        )
          return;
        at(t + 0.6, () => coldGrip(next, { len: 4.5 }));
      });
    });
  });
}

/* ---------- 青之連魂＋靈魂輪轉 ---------- */
function relentless(next) {
  // 4 個儲存：內內外外 的某個旋轉（只會有 4 種）
  const base0 = ['in', 'in', 'out', 'out'];
  const r0 = rand(4);
  const base = base0.map((_, i) => base0[(i + r0) % 4]);
  const kinds = base.map((s) => pick(s === 'in' ? ['side', 'donut'] : ['mid', 'circle']));
  const forced = window.__force_relStart;
  const startIdx = forced !== undefined ? forced : rand(4);
  const order = [0, 1, 2, 3].map((i) => (startIdx + i) % 4);
  const LEN = 8;
  setCast('青之連魂', '連續儲存 4 種範圍攻擊（1→4）', LEN);
  advice = '依 1→4 記住每一個是「內」還是「外」。';
  const shown = [];
  kinds.forEach((k, i) =>
    at(t + 0.6 + i * 1.8, () => {
      shown.push({ kind: k, num: String(i + 1) });
      showWheel(shown.concat(Array(4 - shown.length).fill({ kind: '', num: '' })));
      omen(storedMesh(k, 0.22), 1.5);
      advice =
        '記住：' +
        base
          .slice(0, i + 1)
          .map((s, j) => `${j + 1}${SAFE_TXT[s]}`)
          .join(' ');
    }),
  );
  at(t + LEN, () => {
    setCast('靈魂輪轉', '輪盤轉動，停下後從「最下方」的圖示開始依序放出', 4);
    const w = bossParts.wheel;
    const target = (startIdx * Math.PI) / 2; // 讓第 startIdx 個圖示轉到最下方
    const t0 = t;
    tick(() => {
      const k = Math.min(1, (t - t0) / 3.2);
      w.rotation.z = -(target + Math.PI * 4) * (1 - Math.pow(1 - k, 3)) * (k < 1 ? 1 : 1);
      return k >= 1;
    });
    at(t + 3.4, () => {
      showWheel(kinds.map((k, i) => ({ kind: k, num: String(i + 1), lit: i === startIdx })));
      w.rotation.z = -target;
      advice =
        `從 ${startIdx + 1} 開始：` + order.map((i) => SAFE_TXT[base[i]]).join(' ') + '（最後一下同時分攤）';
    });
    at(t + 4, () => {
      const type = variant('waveVar', ['two', 'four']);
      const targets = waveTargets(type);
      setCast(WAVE_NAME[type] + '潮', type === 'two' ? '儲存 4 人分攤（雙 T）' : '儲存 2 人分攤', 3);
      markWave(type, targets);
      const seq = order.map((i) => ({ kind: kinds[i], safe: base[i] }));
      let k = 0;
      setPlan((m) => stackSpot(m, type, seq[Math.min(k, 3)].safe), 0.3);
      const hit = () => {
        const s = seq[k];
        strongFlash(storedMesh(s.kind, 0.45));
        const reasons = [];
        members.forEach((m) => {
          if (storedHit(s.kind, m))
            reasons.push(
              `第 ${k + 1} 下：${who(m)} 被${storedWhy(s.kind)}打到。順序是 ${seq.map((x) => SAFE_TXT[x.safe]).join(' ')}。`,
            );
        });
        if (k === 3) reasons.push(...resolveWave(type, targets));
        if (reasons.length) return fail('青之連魂', reasons);
        k++;
        if (k < 4) {
          setCast('青之連魂', `第 ${k + 1} / 4 下：${cfg.hintMe ? SAFE_TXT[seq[k].safe] : '？'}`, 3);
          members.forEach((m) => (m.reactAt = t + 0.1 + Math.random() * 0.2));
          at(t + 3, hit);
        } else {
          clearWheel();
          cast = null;
          next();
        }
      };
      at(t + 3, () => {
        setCast('青之連魂', `第 1 / 4 下：${cfg.hintMe ? SAFE_TXT[seq[0].safe] : '？'}`, 2);
        at(t + 2, hit);
      });
    });
  });
}

/* ---------- 青之環波：5 個光圈依序放環形（站進那個光圈裡躲），中途巨手橫掃一排 ----------
 * 順序（依攻略）：第 1 個是角落 → 第 2 個一定在第 1 個的正北或正南 → 第 3 個是第 2 個的東西隔壁
 *  → 第 4 個是第 3 個的正北或正南 → 最後中間。下一個要爆的光圈會先變綠、變大。
 * 第 3 下前出現巨手：橫掃中間排或第 4 個光圈那排 → 在第 3 個角落等巨手打完再跑。 */
const ORBS = {
  TL: { x: -12.6, z: -10.4 },
  TR: { x: 12.6, z: -10.4 },
  BL: { x: -12.6, z: 10.4 },
  BR: { x: 12.6, z: 10.4 },
  C: { x: 0, z: 0 },
};
const ORB_NAME = { TL: '左上', TR: '右上', BL: '左下', BR: '右下', C: '中間' };
const ORB_SAFE = 3;
const VERT = { TL: 'BL', BL: 'TL', TR: 'BR', BR: 'TR' };
const HORI = { TL: 'TR', TR: 'TL', BL: 'BR', BR: 'BL' };
function ringWave(next, opt = {}) {
  const o1 = window.__force_orb || pick(['TL', 'TR', 'BL', 'BR']);
  const o2 = VERT[o1],
    o3 = HORI[o2],
    o4 = VERT[o3];
  const seq = [o1, o2, o3, o4, 'C'];
  // 巨手掃的排：中間排，或第 4 個光圈所在的排
  const band = window.__force_band || pick(['mid', 'far']);
  const bandZ = band === 'mid' ? [-5, 5] : ORBS[o4].z < 0 ? [-HZ, -5] : [5, HZ];
  const bandName = band === 'mid' ? '中間排' : ORBS[o4].z < 0 ? '第一排（北）' : '第三排（南）';
  const orbMeshes = {};
  Object.entries(ORBS).forEach(([k, p]) => {
    const g = new T.Group();
    const mat = new T.MeshStandardMaterial({ color: 0x8fe6ff, emissive: 0x2bb6ff, emissiveIntensity: 1.2 });
    const s = new T.Mesh(new T.SphereGeometry(0.8, 16, 12), mat);
    s.position.y = 1.2;
    g.add(s, ringMesh(0, 0, ORB_SAFE - 0.15, ORB_SAFE, 0x8fe6ff, 0.8));
    g.position.set(p.x, 0, p.z);
    g.userData.mat = mat;
    omen(g, 60);
    orbMeshes[k] = g;
  });
  // 變綠＝下一個要放環形
  const glow = (k, on) => {
    const g = orbMeshes[k];
    g.scale.setScalar(on ? 1.3 : 1);
    g.userData.mat.color.setHex(on ? 0x7dff9a : 0x8fe6ff);
    g.userData.mat.emissive.setHex(on ? 0x22c85a : 0x2bb6ff);
  };
  const off = (m) => ({
    x: (ROLE_IDS.indexOf(m.id) % 4) * 0.7 - 1.05,
    z: ROLE_IDS.indexOf(m.id) < 4 ? -0.5 : 0.5,
  });
  const at2 = (k, m) => ({ x: ORBS[k].x + off(m).x, z: ORBS[k].z + off(m).z });
  // 每一下：光圈變綠 → len 秒後以它為中心放環形（只有光圈內安全）
  const GAPS = [7, 5, 5.5, 6, 4.5];
  let hand = null,
    bandMesh = null,
    swept = false,
    kind = null;
  const step = (i) => {
    const k = seq[i];
    glow(k, true);
    const donut = omen(ringMesh(ORBS[k].x, ORBS[k].z, ORB_SAFE, 45, 0x55c8ff, 0.18), GAPS[i]);
    setCast('青之環波', `第 ${i + 1} / 5 下：${ORB_NAME[k]}的光圈（變綠的那個）`, GAPS[i]);
    advice =
      i === 0
        ? `${ORB_NAME[k]}的光圈先變綠 → 進去躲環形。順序：${seq.map((x) => ORB_NAME[x]).join(' → ')}`
        : i === 3
          ? `巨手掃${bandName}：先待在${ORB_NAME[seq[2]]}，等巨手打完再跑去${ORB_NAME[k]}。`
          : `下一個：${ORB_NAME[k]}。`;
    if (i === 3)
      setPlan((m) => (swept ? at2(k, m) : at2(seq[2], m)), 0.15);
    else setPlan((m) => at2(k, m), i === 0 ? 0.4 : 0.15);
    // 第 3 下前巨手出現（西側），第 3 下打完 1.5 秒後橫掃
    if (i === 2) {
      hand = addFx(placeHand(handModel(4), { x: -HX - 3, z: (bandZ[0] + bandZ[1]) / 2 }, { x: 1, z: 0 }), 20, false);
      bandMesh = omen(rectMesh(-HX, HX, bandZ[0], bandZ[1], 0xff9a3d, 0.28), GAPS[2] + 1.5);
      advice = `巨手出現（掃${bandName}）：第 3 下躲完先別動。下一個：${ORB_NAME[k]}。`;
    }
    // 最後一下（中間）時王讀青魂存一個
    if (i === 4) {
      const safe = variant('soulVar', ['in', 'out']);
      kind = pick(['mid', 'side', 'circle', 'donut'].filter((x) => KIND_INFO[x].safe === safe));
      showWheel([{ kind, lit: true }]);
      omen(storedMesh(kind, 0.2), GAPS[4]);
      advice = `最後是中間。同時青魂：記住「${SAFE_TXT[safe]}」。`;
    }
    at(t + GAPS[i], () => {
      if (state !== 'running') return;
      removeFx(donut);
      glow(k, false);
      strongFlash(ringMesh(ORBS[k].x, ORBS[k].z, ORB_SAFE, 45, 0x55c8ff, 0.45));
      if (
        !judge(`青之環波（第 ${i + 1} 下）`, (m) =>
          dist(m, ORBS[k]) > ORB_SAFE ? `${who(m)} 沒有站進${ORB_NAME[k]}的光圈，被環形打到。` : '',
        )
      )
        return;
      if (i === 2)
        at(t + 1.5, () => {
          if (state !== 'running') return;
          removeFx(bandMesh);
          strongFlash(rectMesh(-HX, HX, bandZ[0], bandZ[1], 0xff9a3d, 0.5));
          swept = true;
          judge('黑暗巨腕（青之環波）', (m) =>
            m.z > bandZ[0] && m.z < bandZ[1]
              ? `${who(m)} 在巨手掃的${bandName}，被抓進異空間。等巨手打完再從${ORB_NAME[seq[2]]}出發。`
              : '',
          );
        });
      if (i < 4) return step(i + 1);
      Object.values(orbMeshes).forEach(removeFx);
      if (hand) removeFx(hand);
      clearWheel();
      at(t + 0.5, () => waveRelease([kind], next, '青之環波後的青魂'));
    });
  };
  step(0);
}

/* ---------- 群體恐慌：踩塔（塔上幾個圈就要幾個人）＋死亡警告＋青之衝擊 ---------- */
const MM_TOWERS = {
  Wu: { x: -14.9, z: -2.8, n: 2, ids: ['D3', 'D4'], name: '西側上' },
  Wd: { x: -14.9, z: 3.3, n: 2, ids: ['MT', 'H1'], name: '西側下' },
  Eu: { x: 14.9, z: -2.8, n: 2, ids: ['D1', 'D2'], name: '東側上' },
  Ed: { x: 14.9, z: 3.3, n: 2, ids: ['ST', 'H2'], name: '東側下' },
  NW: { x: -9.2, z: -12, n: 3, name: '左上' },
  NE: { x: 9.2, z: -12, n: 3, name: '右上' },
  SW: { x: -9.2, z: 12, n: 3, name: '左下' },
  SE: { x: 9.2, z: 12, n: 3, name: '右下' },
};
const MM_TR = 3;
function towerMesh(tw, lit) {
  const g = new T.Group();
  const cyl = new T.Mesh(
    new T.CylinderGeometry(MM_TR, MM_TR, 2.4, 40, 1, true),
    new T.MeshBasicMaterial({
      color: 0xff7ad0,
      transparent: true,
      opacity: lit ? 0.2 : 0.06,
      side: T.DoubleSide,
      depthWrite: false,
    }),
  );
  cyl.position.y = 1.2;
  g.add(cyl, ringMesh(0, 0, MM_TR - 0.18, MM_TR, 0xff9ae0, lit ? 0.95 : 0.3));
  for (let i = 0; i < tw.n; i++) {
    const s = ringMesh((i - (tw.n - 1) / 2) * 0.9, 0, 0.25, 0.38, 0xffd0f0, lit ? 0.95 : 0.3, 0.1);
    g.add(s);
  }
  g.position.set(tw.x, 0, tw.z);
  return g;
}
function soakTowers(keys, label) {
  const reasons = [];
  keys.forEach((k) => {
    const tw = MM_TOWERS[k];
    strongFlash(circleMesh(tw.x, tw.z, MM_TR, 0xff9ae0, 0.5));
    const inT = members.filter((m) => dist(m, tw) < MM_TR);
    if (inT.length < tw.n)
      reasons.push(
        `${label}${tw.name}的塔需要 ${tw.n} 人，只有 ${inT.length} 人（${inT.map(who).join('、') || '沒人'}）。`,
      );
    inT.forEach((m) => {
      if (hasVuln(m)) reasons.push(`${who(m)} 身上的易傷還沒消失就踩塔（4 秒內連踩兩座塔會死）。`);
      giveVuln(m, 4);
    });
  });
  return reasons;
}
function macabre(next) {
  const LEN = 7;
  setCast('群體恐慌', '塔上幾個圈就要幾個人踩；同時死亡警告', LEN);
  advice = '先分成兩邊踩 2 人塔（無視黑白翅膀），中間會被死亡警告打。';
  setWings(pick(['W', 'E']));
  const all = Object.fromEntries(
    Object.entries(MM_TOWERS).map(([k, tw]) => [
      k,
      omen(towerMesh(tw, k.length === 2 && 'WuWdEuEd'.includes(k)), 30),
    ]),
  );
  const strip = omen(rectMesh(-MM_MUD, MM_MUD, -HZ, HZ, 0x8a2bff, 0.3), LEN);
  const t2 = ['Wu', 'Wd', 'Eu', 'Ed'];
  const spotOf = (m) => {
    const k = t2.find((k) => MM_TOWERS[k].ids.includes(m.id));
    const tw = MM_TOWERS[k];
    return { x: tw.x + (tw.ids[0] === m.id ? -0.5 : 0.5), z: tw.z };
  };
  setPlan(spotOf, 0.4);
  at(t + LEN, () => {
    removeFx(strip);
    setWings(null);
    strongFlash(rectMesh(-MM_MUD, MM_MUD, -HZ, HZ, 0x8a2bff, 0.5));
    let r = members.filter((m) => Math.abs(m.x) < MM_MUD).map((m) => `${who(m)} 站在中間，被死亡警告打到。`);
    r = r.concat(soakTowers(t2, '第一輪：'));
    t2.forEach((k) => removeFx(all[k]));
    if (r.length) return fail('群體恐慌', r);
    // 黑泥 4 秒
    const mud = addFx(rectMesh(-MM_MUD, MM_MUD, -HZ, HZ, 0x2a0a48, 0.75, 0.05), 4, false);
    mud.renderOrder = 2;
    const mudEnd = t + 4;
    tick(() => {
      if (t > mudEnd) return true;
      const bad = members.find((m) => Math.abs(m.x) < MM_MUD - 0.3);
      if (bad) {
        fail('群體恐慌', [`${who(bad)} 踩到中間的黑泥（流血）。等黑泥消失再穿過中間。`]);
        return true;
      }
    });
    // 第二輪：青之衝擊（MT）＋右上、左下 3 人塔
    const g1 = ['H2', 'D1', 'D2'],
      g2 = ['H1', 'D3', 'D4'];
    const lit = (ks) =>
      ks.forEach((k) => {
        removeFx(all[k]);
        all[k] = omen(towerMesh(MM_TOWERS[k], true), 12);
      });
    lit(['NE', 'SW']);
    setCast('青之衝擊', 'MT 去左上角；其他人等易傷消失後踩 3 人塔', 5);
    shockMark('MT');
    advice = 'MT 左上角吃死刑；H2 D1 D2 踩右上塔、H1 D3 D4 踩左下塔（扇形會蓋到左下塔的西半邊 → 站塔的東側）。';
    // 下方的 3 人塔有一半在青之衝擊扇形裡：站靠場地中線的那一側（s = -1 左下塔、+1 右下塔）
    const LOW_SPOT = [
      [7.0, 11.4],
      [6.9, 12.6],
      [7.6, 13.4],
    ];
    const p3 = (m, a, b) => {
      const tw = MM_TOWERS[g1.includes(m.id) ? a : b];
      const i = (g1.includes(m.id) ? g1 : g2).indexOf(m.id);
      if (tw.z > 0) {
        const s = Math.sign(tw.x);
        return { x: s * LOW_SPOT[i][0], z: LOW_SPOT[i][1] };
      }
      return { x: tw.x + 0.9 + (i - 1) * 0.6, z: tw.z + (i === 1 ? 0.5 : 0) };
    };
    setPlan((m) => (m.tank ? TANK_CORNER[m.id] : p3(m, 'NE', 'SW')), 0.3);
    at(t + 5, () => {
      let r2 = shockHit('MT');
      setTag(byId('MT'), '');
      r2 = r2.concat(soakTowers(['NE', 'SW'], '第二輪：'));
      ['NE', 'SW'].forEach((k) => removeFx(all[k]));
      if (r2.length) return fail('群體恐慌（第二輪）', r2);
      // 第三輪：青之衝擊（ST）＋左上、右下 3 人塔
      lit(['NW', 'SE']);
      setCast('青之衝擊', 'ST 去右上角吃第二下；換左上、右下的塔', 5);
      shockMark('ST');
      advice = 'ST 必須在最右上角；H2 D1 D2 換到左上塔、H1 D3 D4 換到右下塔（扇形會蓋到右下塔的東半邊 → 站塔的西側）。';
      setPlan((m) => (m.tank ? TANK_CORNER[m.id] : p3(m, 'NW', 'SE')), 0.3);
      at(t + 5, () => {
        let r3 = shockHit('ST');
        setTag(byId('ST'), '');
        r3 = r3.concat(soakTowers(['NW', 'SE'], '第三輪：'));
        ['NW', 'SE'].forEach((k) => removeFx(all[k]));
        if (r3.length) return fail('群體恐慌（第三輪）', r3);
        at(t + 0.8, () => coldGrip(next));
      });
    });
  });
}

/* ---------- 狂暴 ---------- */
function enrage(next) {
  setCast('永遠之暗', '狂暴（在讀條結束前擊殺）', 8);
  advice = '輸出檢查：讀條結束前把王打倒。';
  setPlan((m) => IDLE[m.id], 0.3);
  at(t + 8, () => {
    screenFlash();
    finishNote = '練習場到此結束：實戰要在永遠之暗讀完前擊殺王。';
    cast = null;
    next();
  });
}
