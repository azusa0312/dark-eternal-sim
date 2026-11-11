/* =====================================================================
 * 第一階段：青之衝擊、死之恐懼、暗之死腕、死亡警告、青魂（＋二重／四重波）、
 * 青魂第二輪（死之恐懼＋引導之翼＋青之衝擊插在中間）
 * ===================================================================== */

/* 青之衝擊：MT 到左上角吃第一下，ST 到右上角吃第二下（MT 吃完要挑釁拉回） */
function blueShock(next, opt = {}) {
  const LEN = 5;
  setCast('青之衝擊', '對坦克連續兩次 90° 扇形死刑', LEN);
  advice = 'MT 到左上（西北）角吃第一下、ST 到右上（東北）角吃第二下，其他人在南邊。';
  shockMark('MT');
  const party = { H1: [-3, 7], H2: [3, 7], D1: [-1.5, 4.5], D2: [1.5, 4.5], D3: [-1.5, 9.5], D4: [1.5, 9.5] };
  setPlan((m) => (m.tank ? TANK_CORNER[m.id] : P(party[m.id][0], party[m.id][1])), 0.4);
  at(t + LEN, () => {
    const r = shockHit('MT');
    if (r.length) return fail('青之衝擊（第一下）', r);
    setTag(byId('MT'), '');
    shockMark('ST');
    setCast('青之衝擊', '第二下：ST', 2.6);
    at(t + 2.6, () => {
      const r2 = shockHit('ST');
      setTag(byId('ST'), '');
      if (r2.length) return fail('青之衝擊（第二下）', r2);
      cast = null;
      next();
    });
  });
}

/* 青魂：讀條時王胸前顯示要儲存的範圍（地上淡藍色預覽）。回傳 kind */
function soulStore(kinds, after) {
  const safe = variant('soulVar', ['in', 'out']);
  const kind = pick(kinds.filter((k) => KIND_INFO[k].safe === safe));
  const LEN = 4;
  setCast('青魂', '王胸前顯示攻擊範圍：記住「內」或「外」', LEN);
  advice = `記住：儲存的是${KIND_INFO[kind].name} → 安全在${SAFE_TXT[safe]}`;
  showWheel([{ kind, lit: true }]);
  const pv = omen(storedMesh(kind, 0.22), LEN);
  at(t + LEN, () => {
    removeFx(pv);
    clearWheel();
    cast = null;
    after(kind);
  });
}

/* 二重／四重波＋同時放出儲存的攻擊 */
function waveRelease(kinds, next, title) {
  const type = variant('waveVar', ['two', 'four']);
  const LEN = 5;
  const targets = waveTargets(type);
  const safe = KIND_INFO[kinds[kinds.length - 1]].safe;
  setCast(
    WAVE_NAME[type],
    type === 'two'
      ? '點名雙 T：四人一組分攤＋放出儲存的攻擊'
      : `點名 4 名${targets[0] === 'MT' ? '坦補' : 'DPS'}：兩人一組分攤＋放出儲存的攻擊`,
    LEN,
  );
  markWave(type, targets);
  advice = `安全在${SAFE_TXT[safe]}：到${stackSpotName(player, type, safe)}。（${safe === 'in' ? '數字場標' : '字母場標'}）`;
  setPlan((m) => stackSpot(m, type, safe), 0.4);
  at(t + LEN, () => {
    const kind = kinds[kinds.length - 1];
    strongFlash(storedMesh(kind, 0.45));
    clearWheel();
    const reasons = [];
    members.forEach((m) => {
      if (storedHit(kind, m)) reasons.push(`${who(m)} 被儲存的${storedWhy(kind)}打到（站在${where(m)}）。`);
    });
    reasons.push(...resolveWave(type, targets));
    if (reasons.length) return fail(title || WAVE_NAME[type], reasons);
    cast = null;
    next();
  });
}

/* 青魂第一輪：存一個 → 立刻二重／四重波 */
function soul1(next) {
  soulStore(['mid', 'side'], (kind) => waveRelease([kind], next, '青魂'));
}

/* 青魂第二輪：存一個 → 死之恐懼 → 引導之翼 → 青之衝擊 → 二重／四重波 */
function soul2(next) {
  soulStore(['mid', 'side'], (kind) => {
    at(t + 1, () =>
      fearOfDeath(() => at(t + 1, () => blueShock(() => waveRelease([kind], next, '青魂（第二輪）'))), {
        embrace: true,
      }),
    );
  });
}
