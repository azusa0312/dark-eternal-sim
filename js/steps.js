/* =====================================================================
 * 機制清單：全程模式依這個順序執行，也可在「練習範圍」單選（id）或選整段（grp）
 * 新增機制時：在 mechanics/ 加檔案、在這裡加一行、在 index.html 的 #mode 選單加選項。
 * 順序依子言姐姐 7.3 攻略影片的實戰演示。
 * ===================================================================== */

const STEPS = [
  { id: 'shock', grp: 'p1', name: '青之衝擊', fn: (n) => blueShock(n) },
  { id: 'fear', grp: 'p1', name: '死之恐懼（引導黑手）', fn: (n) => fearOfDeath(n) },
  { id: 'grip', grp: 'p1', name: '暗之死腕', fn: (n) => coldGrip(n) },
  { id: 'memento', grp: 'p1', name: '死亡警告＋黑暗一擊', fn: (n) => mementoMori(n) },
  { id: 'soul1', grp: 'p1', name: '青魂＋二重／四重波', fn: (n) => soul1(n) },
  { id: 'soul2', grp: 'p1', name: '青魂＋死之恐懼＋引導之翼＋青之衝擊', fn: (n) => soul2(n) },
  { id: 'gc', grp: 'p1', name: '大十字', fn: (n) => grandCross(n) },
  { id: 'adds', grp: 'p1', name: '小怪階段＋永遠之暗', fn: (n) => addsPhase(n) },
  { id: 'specter', grp: 'p2', name: '黑暗巨腕＋引導之翼＋暗之死腕', fn: (n) => specter(n) },
  { id: 'rel', grp: 'p2', name: '青之連魂＋靈魂輪轉', fn: (n) => relentless(n) },
  { id: 'ring', grp: 'p2', name: '青之環波＋青魂', fn: (n) => ringWave(n) },
  { id: 'macabre', grp: 'p2', name: '群體恐慌＋青之衝擊＋暗之死腕', fn: (n) => macabre(n) },
  { id: 'rel2', grp: 'p2', name: '青之連魂（第二次）', fn: (n) => relentless(n) },
  { id: 'fear2', grp: 'p2', name: '死之恐懼', fn: (n) => fearOfDeath(n) },
  { id: 'ring2', grp: 'p2', name: '青之環波（第二次）', fn: (n) => ringWave(n) },
  {
    id: 'memento2',
    grp: 'p2',
    name: '死亡警告＋暗之死腕',
    fn: (n) => mementoMori(() => at(t + 0.8, () => coldGrip(n))),
  },
  { id: 'gc2', grp: 'p2', name: '大十字（第二次）', fn: (n) => grandCross(n) },
  { id: 'enrage', grp: 'p2', name: '永遠之暗（狂暴）', fn: (n) => enrage(n) },
];
