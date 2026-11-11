/* =====================================================================
 * 小怪階段（第一階段結尾）：場地滲出黑泥、出現小黑手與大黑手、畫面上有進度條
 *  - 小黑手：放可迴避的直線「壓潰」→ 閃開
 *  - 大黑手：對仇恨目標放直線「擊潰」→ 坦克把直線引導到場外（隊友不要站在大黑手和坦克之間的延長線上）
 *  - 進度條到 100 前要打完（這裡固定在時間內打完）→ 永遠之暗（全體傷害、進入單人異空間）
 * 單人異空間（各職能打小怪、跳平台）不是走位機制，練習場省略。
 * ===================================================================== */

// 小黑手的固定出現位置與朝向（三波）
const ADD_WAVES = [
  [
    { x: -8, z: -8, a: 180 },
    { x: 8, z: 8, a: 0 },
  ],
  [
    { x: -14, z: 3, a: 90 },
    { x: 14, z: -9, a: 270 },
  ],
  [
    { x: -4, z: 12, a: 0 },
    { x: 4, z: -12, a: 180 },
  ],
];
const ADD_HW = 2;
const BIG_HAND = { MT: { x: -6, z: -4 }, ST: { x: 6, z: -4 } };
const ADD_HOME = {
  MT: { x: -15, z: -4 },
  ST: { x: 15, z: -4 },
  H1: { x: -3, z: 6 },
  H2: { x: 3, z: 6 },
  D1: { x: -2, z: 2 },
  D2: { x: 2, z: 2 },
  D3: { x: -2, z: 10 },
  D4: { x: 2, z: 10 },
};
function addsPhase(next) {
  setCast('死之恐懼', '場地滲出黑泥，出現黑手', 3);
  advice = '小黑手的直線要閃；大黑手的直線打坦克 → 坦克站東西兩側把它引到場外。';
  const bar = $('gauge');
  bar.hidden = false;
  let gauge = 0;
  tick(() => {
    gauge = Math.min(100, gauge + dtRun * 3.2);
    $('gaugeFill').style.width = gauge + '%';
    return state !== 'running';
  });
  // 大黑手
  const bigs = Object.entries(BIG_HAND).map(([tank, p]) => {
    const h = addFx(handModel(2.2), 30, false);
    h.position.set(p.x, 0, p.z);
    return { tank, ...p, h };
  });
  // 小黑手線：避開這些
  let lines = [];
  const lineHit = (p, l) => inLine(p, l.o, l.d, 40, l.hw);
  setPlan((m) => {
    const home = ADD_HOME[m.id];
    if (m.tank) return home;
    return nearestOk(
      home,
      (p) => inRect(p, -HX + 1, HX - 1, -HZ + 1, HZ - 1) && !lines.some((l) => lineHit(p, l)),
    );
  }, 0.4);
  const smallWave = (k, after) => {
    const ls = ADD_WAVES[k].map((s) => {
      const o = { x: s.x, z: s.z },
        d = dirOf(s.a);
      const h = addFx(placeHand(handModel(1.2), o, d), 3.6, false);
      return {
        o,
        d,
        hw: ADD_HW,
        name: '小黑手',
        mesh: omen(lineMesh(o, d, 40, ADD_HW, 0xff7a3d, 0.3), 3),
        h,
      };
    });
    // 大黑手對坦克
    bigs.forEach((b) => {
      const tm = byId(b.tank);
      const d = norm({ x: tm.x - b.x, z: tm.z - b.z });
      placeHand(b.h, b, d);
      ls.push({
        o: b,
        d,
        hw: 2.4,
        name: '大黑手',
        big: b.tank,
        mesh: omen(lineMesh(b, d, 40, 2.4, 0xff4060, 0.3), 3),
      });
    });
    lines = ls;
    setCast(k % 2 ? '擊潰／壓潰' : '壓潰／擊潰', `第 ${k + 1} 波黑手`, 3);
    at(t + 3, () => {
      ls.forEach((l) => {
        removeFx(l.mesh);
        // 大黑手的線在判定瞬間重新對準目標
        if (l.big) {
          const tm = byId(l.big);
          l.d = norm({ x: tm.x - l.o.x, z: tm.z - l.o.z });
        }
        strongFlash(lineMesh(l.o, l.d, 40, l.hw, l.big ? 0xff4060 : 0xff7a3d, 0.5));
      });
      lines = [];
      if (
        !judge('小怪階段', (m) => {
          const l = ls.find((l) => lineHit(m, l) && l.big !== m.id);
          if (!l) return '';
          return l.big
            ? `${who(m)} 被 ${l.big} 引導的大黑手直線（擊潰）打到。坦克要站東西兩側邊緣，把線引到場外；其他人別站在延長線上。`
            : `${who(m)} 被小黑手的直線（壓潰）打到（${where(l.o)}的手）。`;
        })
      )
        return;
      after();
    });
  };
  at(t + 3, () =>
    smallWave(0, () => at(t + 1, () => smallWave(1, () => at(t + 1, () => smallWave(2, () => end()))))),
  );
  const end = () => {
    $('gauge').hidden = true;
    setCast('永遠之暗', '全體傷害 → 被吸入異空間（單人階段，練習場略過）', 5);
    advice = '黑手全部擊破。準備吃全體傷害。';
    setPlan((m) => ADD_HOME[m.id], 0.2);
    at(t + 5, () => {
      screenFlash();
      cast = null;
      next();
    });
  };
}
