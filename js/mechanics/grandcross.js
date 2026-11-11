/* =====================================================================
 * 大十字：場地縮成圓形，四人兩兩分區（MT/D1 左上、ST/D2 右上、H1/D3 左下、H2/D4 右下）
 *  1. 讀條大十字 → 全員到場中集合（圓外 = 直接掉下去）
 *  2. 黃圈兩波（腳下圓形追人）→ 邊放邊走到自己的區域
 *  3. 兩輪：旋轉直線（倒數 3-2-1 後判定）＋每區一座塔＋4 人（全 TH 或全 DPS）點名圓形
 *     點名的人在自己區域遠離塔放圓形，搭檔踩塔；第二輪換另一組被點名
 *  4. 場中集合 → 再兩波黃圈 → 到四個斜角處理十字距離衰減 → 中子環，場地恢復
 * ===================================================================== */

const GC_ZONE = { MT: 315, D1: 315, ST: 45, D2: 45, H1: 225, D3: 225, H2: 135, D4: 135 };
const GC_ZONE_NAME = { 315: '左上（西北）', 45: '右上（東北）', 225: '左下（西南）', 135: '右下（東南）' };
const GC_TOWER_R = 6.5,
  GC_TOWER_RAD = 2.2,
  GC_LINE_HW = 1.5,
  GC_MARK_R = 3,
  GC_YELLOW_R = 2.5;
let gcLines = []; // 目前預兆中的直線（角度），NPC 要避開

const onGcLine = (p, ang, margin = 0.35) => {
  const d = dirOf(ang);
  return Math.abs(p.x * -d.z + p.z * d.x) < GC_LINE_HW + margin;
};
// 在 pref 附近找一個符合 ok(p) 的點（螺旋搜尋）
function nearestOk(pref, ok) {
  if (ok(pref)) return pref;
  for (let r = 0.2; r < 10; r += 0.2)
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * 360;
      const p = posAt(a, r, pref);
      if (ok(p)) return p;
    }
  return pref;
}
const inZone = (p, za, tol = 38) => dist(p, { x: 0, z: 0 }) > 1 && angDiff(angOfPt(p), za) < tol;

function grandCross(next) {
  const LEN = 5;
  setCast('大十字', '全體傷害，場地縮成圓形', LEN);
  advice = '到場中集合（場地會變成圓形，站在圓外會直接掉下去）。';
  const off = (m) => (ROLE_INFO[m.id].grp === 'S' ? -10 : 10);
  setPlan((m) => posAt(GC_ZONE[m.id] + off(m), 1.6), 0.4);
  const ring = omen(ringMesh(0, 0, GC_R - 0.15, GC_R + 0.1, 0x7fe0ff, 0.9), LEN);
  at(t + LEN, () => {
    removeFx(ring);
    screenFlash();
    setArena('circle');
    if (!judge('大十字', (m) => (dist(m, { x: 0, z: 0 }) > GC_R ? `${who(m)} 在圓形場地外，掉下去了。` : '')))
      return;
    gcYellow(
      [1.6, 5.5],
      [5.5, 9],
      () => gcRound(0, () => gcRound(1, () => gcGather(next))),
      '放黃圈，邊放邊走到自己的區域',
    );
  });
}

// 黃圈兩波：每波在每個人腳下放圓形，1.6 秒後判定；r0 → r1 是每波前後該站的半徑
function gcYellow(rA, rB, next, txt) {
  setCast('黃圈', txt, 1.6);
  const off = (m) => (ROLE_INFO[m.id].grp === 'S' ? -12 : 12);
  const wave = (k, after) => {
    const drops = members.map((m) => ({ id: m.id, x: m.x, z: m.z }));
    const meshes = drops.map((d) => omen(circleMesh(d.x, d.z, GC_YELLOW_R, 0xffd34a, 0.4), 1.6));
    setPlan((m) => posAt(GC_ZONE[m.id] + off(m), k ? rB[1] : rA[1]), 0.15);
    at(t + 1.6, () => {
      meshes.forEach(removeFx);
      drops.forEach((d) => strongFlash(circleMesh(d.x, d.z, GC_YELLOW_R, 0xffd34a, 0.5)));
      if (
        !judge('大十字（黃圈）', (m) => {
          const d = drops.find((d) => dist(d, m) < GC_YELLOW_R);
          return d
            ? `${who(m)} 被${d.id === m.id ? '自己' : ' ' + d.id + ' '}腳下的黃圈打到。黃圈會在腳下出現，要立刻走開。`
            : '';
        })
      )
        return;
      after();
    });
  };
  setPlan((m) => posAt(GC_ZONE[m.id] + off(m), rA[0]), 0.1);
  wave(0, () => {
    setCast('黃圈', '第二波', 1.6);
    wave(1, next);
  });
}

// 一輪：旋轉直線 ×2 次判定＋塔＋點名圓形
function gcRound(k, next) {
  const markGrp = k === 0 ? (Math.random() < 0.5 ? 'S' : 'D') : gcRound.firstGrp === 'S' ? 'D' : 'S';
  if (k === 0) gcRound.firstGrp = markGrp;
  const marked = members.filter((m) => m.grp === markGrp);
  setCast('大十字', `第 ${k + 1} 輪：踩塔＋放圓形＋躲旋轉直線`, 7.5);
  advice =
    (player.grp === markGrp
      ? '你被點名圓形：在自己區域遠離塔放（不能踩塔）。'
      : '你沒被點名：去踩自己區域的塔。') + '旋轉直線倒數到 0 前離開。';
  marked.forEach((m) => {
    setTag(m, '圓形', '#ffb35c');
    const c = circleMesh(0, 0, GC_MARK_R, 0xffb35c, 0.18, 0.09);
    m.obj.add(c);
    m._spread = c;
  });
  const towers = [315, 45, 225, 135].map((a) => {
    const p = posAt(a, GC_TOWER_R);
    const g = new T.Group();
    const cyl = new T.Mesh(
      new T.CylinderGeometry(GC_TOWER_RAD, GC_TOWER_RAD, 2.4, 40, 1, true),
      new T.MeshBasicMaterial({
        color: 0x9fe8ff,
        transparent: true,
        opacity: 0.16,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    cyl.position.y = 1.2;
    g.add(cyl, ringMesh(0, 0, GC_TOWER_RAD - 0.15, GC_TOWER_RAD, 0xdff8ff, 0.9));
    g.position.set(p.x, 0, p.z);
    omen(g, 7.5);
    return { a, x: p.x, z: p.z, g };
  });
  // NPC：踩塔的人站塔內、放圓形的人站區域外緣遠離塔，都要避開正在預兆的直線
  setPlan((m) => {
    const za = GC_ZONE[m.id];
    const tw = towers.find((x) => x.a === za);
    if (m.grp !== markGrp)
      return nearestOk(
        tw,
        (p) => dist(p, tw) < GC_TOWER_RAD - 0.12 && !gcLines.some((a) => onGcLine(p, a, 0.15)),
      );
    const sideA = za + (m.grp === 'S' ? -34 : 34);
    return nearestOk(posAt(sideA, 10), (p) => {
      return (
        dist(p, tw) > 5.6 &&
        dist(p, { x: 0, z: 0 }) < GC_R - 0.9 &&
        inZone(p, za, 44) &&
        !gcLines.some((a) => onGcLine(p, a))
      );
    });
  }, 0.3);
  // 旋轉直線：兩條直徑，各自以不同速度轉；倒數 3 秒判定，共兩次
  const a0 = rand(12) * 15,
    b0 = a0 + 50 + rand(4) * 10;
  const lineStep = (i, after) => {
    const angs = i === 0 ? [a0, b0] : [a0 + 30, b0 + 75]; // 兩條線轉速不同，但夾角保持 55° 以上（塔才踩得到）
    gcLines = angs;
    const meshes = angs.map((a) => {
      const d = dirOf(a);
      return omen(lineMesh({ x: -d.x * GC_R, z: -d.z * GC_R }, d, GC_R * 2, GC_LINE_HW, 0x55c8ff, 0.3), 3);
    });
    const cnt = [3, 2, 1].map((n, j) => {
      const l = floatLabel(String(n), '#9fe8ff', 0, 0, 3.2, 1.4);
      at(t + j, () => addFx(l, 0.95, false));
    });
    at(t + 3, () => {
      meshes.forEach(removeFx);
      angs.forEach((a) => {
        const d = dirOf(a);
        strongFlash(lineMesh({ x: -d.x * GC_R, z: -d.z * GC_R }, d, GC_R * 2, GC_LINE_HW, 0x55c8ff, 0.5));
      });
      gcLines = [];
      if (
        !judge('大十字（旋轉直線）', (m) =>
          angs.some((a) => onGcLine(m, a) && Math.abs(m.x * -dirOf(a).z + m.z * dirOf(a).x) < GC_LINE_HW)
            ? `${who(m)} 被旋轉的直線打到（倒數到 0 時要離開直線）。`
            : '',
        )
      )
        return;
      after();
    });
  };
  lineStep(0, () => at(t + 0.6, () => lineStep(1, () => {})));
  at(t + 7.5, () => {
    if (state !== 'running') return;
    marked.forEach((m) => {
      m.obj.remove(m._spread);
      setTag(m, '');
      strongFlash(circleMesh(m.x, m.z, GC_MARK_R, 0xffb35c, 0.45));
    });
    towers.forEach((tw) => strongFlash(circleMesh(tw.x, tw.z, GC_TOWER_RAD, 0xbff4ff, 0.6)));
    const reasons = [];
    towers.forEach((tw) => {
      const inT = members.filter((m) => dist(m, tw) < GC_TOWER_RAD);
      if (!inT.length) reasons.push(`${GC_ZONE_NAME[tw.a]}的塔沒人踩（漏塔 = 全體傷害＋流血）。`);
      inT
        .filter((m) => m.grp === markGrp)
        .forEach((m) => reasons.push(`${who(m)} 被點名圓形還去踩塔（兩個都會給易傷，必死）。`));
    });
    marked.forEach((m) => {
      const o = members.filter((o) => o !== m && dist(o, m) < GC_MARK_R);
      if (o.length)
        reasons.push(`${who(m)} 的圓形打到 ${o.map(who).join('、')}。要在自己區域遠離塔、遠離別人放。`);
    });
    if (reasons.length) return fail('大十字（第 ' + (k + 1) + ' 輪）', reasons);
    cast = null;
    next();
  });
}

// 收尾：場中集合 → 兩波黃圈 → 四個斜角 → 中子環
function gcGather(next) {
  setCast('大十字', '場中集合', 2.4);
  advice = '回場中集合，準備再放兩波黃圈。';
  const off = (m) => (ROLE_INFO[m.id].grp === 'S' ? -10 : 10);
  setPlan((m) => posAt(GC_ZONE[m.id] + off(m), 1.6), 0.2);
  at(t + 2.4, () =>
    gcYellow(
      [1.6, 5],
      [5, 9],
      () => {
        setCast('大十字', '十字距離衰減：到四個斜角', 4);
        advice = '到自己區域的斜角最遠處（左上／右上／左下／右下），十字直線離越遠傷害越低。';
        setPlan((m) => posAt(GC_ZONE[m.id] + (ROLE_INFO[m.id].grp === 'S' ? -6 : 6), 10), 0.2);
        const plus = new T.Group();
        plus.add(
          rectMesh(-2.5, 2.5, -GC_R, GC_R, 0x55c8ff, 0.25),
          rectMesh(-GC_R, GC_R, -2.5, 2.5, 0x55c8ff, 0.25),
        );
        plus.material = plus.children[0].material;
        omen(plus, 4);
        at(t + 4, () => {
          removeFx(plus);
          const p2 = new T.Group();
          p2.add(
            rectMesh(-2.5, 2.5, -GC_R, GC_R, 0x55c8ff, 0.5),
            rectMesh(-GC_R, GC_R, -2.5, 2.5, 0x55c8ff, 0.5),
          );
          strongFlash(p2);
          if (
            !judge('大十字（十字衰減）', (m) =>
              Math.abs(m.x) < 4.5 || Math.abs(m.z) < 4.5
                ? `${who(m)} 離十字直線太近（${where(m)}），要到斜角遠處。`
                : '',
            )
          )
            return;
          setCast('中子環', '全體傷害，場地恢復', 3);
          advice = '';
          at(t + 3, () => {
            screenFlash();
            setArena('rect');
            cast = null;
            next();
          });
        });
      },
      '再放兩波黃圈',
    ),
  );
}
