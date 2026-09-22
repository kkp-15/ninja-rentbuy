// 手計算の答えで固定するテスト（各ページの CALC_START〜CALC_END を取り出して実行）
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
function load(rel) {
  const html = readFileSync(new URL(rel, import.meta.url), 'utf8');
  const data = html.split('// DATA_START')[1].replace(/^[^\n]*\n/, '').split('// DATA_END')[0];
  const src = html.split('// CALC_START')[1].split('// CALC_END')[0];
  return new Function(data + src + '; return { judge: judge, rentOnce: (typeof rentOnce==="function"?rentOnce:null), SIZES: (typeof SIZES!=="undefined"?SIZES:null) };')();
}

// ===== スーツケース（トップ）=====
{
  const { judge, rentOnce, SIZES } = load('../index.html');
  // 料金（2026-09-22 ゲオ公式で確認）
  assert.deepEqual(SIZES.map(s => [s.id, s.fee]), [['s', 2490], ['m', 2790], ['l', 3290], ['ll', 3490]]);
  // 1回の料金: 旅行の泊数＋前後1泊、2泊を超えた分は1日220円
  assert.equal(rentOnce(2490, 2, 1), 2710);   // S 2泊 → 3泊4日 = 2,490 + 220
  assert.equal(rentOnce(2790, 4, 1), 3450);   // M 4泊 → 5泊6日 = 2,790 + 660
  assert.equal(rentOnce(3290, 6, 1), 4390);   // L 6泊 → 7泊8日 = 3,290 + 1,100
  assert.equal(rentOnce(3490, 9, 1), 5250);   // LL 9泊 → 10泊11日 = 3,490 + 1,760
  assert.equal(rentOnce(2490, 1, 1), 2490);   // 1泊 → 2泊3日 = 基本料金のみ
  assert.equal(rentOnce(2490, 1, 0), 2490);   // ゆとり0でも最低期間の料金
  // 損益分岐（買う値段3万円・3年・売却0）
  assert.equal(judge(2710, 30000, 0, 3, 1).maxRent, 3);   // S: 8,130/年 → 年3回まで
  assert.equal(judge(3450, 30000, 0, 3, 1).maxRent, 2);   // M: 10,350/年 → 年2回まで
  assert.deepEqual(judge(3450, 30000, 0, 3, 3), { rent: 31050, buy: 30000, maxRent: 2, choice: 'buy' });
  assert.equal(judge(4390, 30000, 0, 3, 1).maxRent, 2);   // L
  assert.equal(judge(5250, 30000, 0, 3, 1).maxRent, 1);   // LL
  // 8万円のブランド品: M 年5回でも3年で 51,750 < 80,000
  assert.deepEqual(judge(3450, 80000, 0, 3, 5).choice, 'rent');
  // 2万円: M 年2回で 20,700 > 20,000 → 買う
  assert.equal(judge(3450, 20000, 0, 3, 2).choice, 'buy');
  console.log('suitcase ok');
}

// ===== カメラ（/camera/）=====
{
  const { judge } = load('../camera/index.html');
  // R100: 6,490円×5回×3年=97,350 ／ 133,100 ／ 133,100÷19,470=6.84 → 年6回まで
  assert.deepEqual(judge(6490, 133100, 0, 3, 5), { rent: 97350, buy: 133100, maxRent: 6, choice: 'rent' });
  assert.equal(judge(6490, 133100, 0, 3, 10).choice, 'buy');
  assert.equal(judge(5990, 125400, 0, 3, 5).maxRent, 6);
  assert.deepEqual(judge(3990, 50600, 0, 3, 5), { rent: 59850, buy: 50600, maxRent: 4, choice: 'buy' });
  assert.equal(judge(3990, 50600, 0, 3, 3).choice, 'rent');
  assert.equal(judge(6490, 133100, 40000, 3, 5).maxRent, 4);
  assert.deepEqual(judge(1000, 6000, 0, 3, 2), { rent: 6000, buy: 6000, maxRent: 1, choice: 'buy' });
  assert.equal(judge(1000, 5000, 9000, 3, 3).buy, 0);
  console.log('calc ok');
  const HAYAMI = { r100:[6490,133100,'借りる','借りる','買う','買う',6], zv1m2:[5990,125400,'借りる','借りる','買う','買う',6], oa5p:[3990,50600,'借りる','買う','買う','買う',4] };
  for (const [id, [fee, price, a3, a5, a10, a20, be]] of Object.entries(HAYAMI)) {
    const cell = n => judge(fee, price, 0, 3, n).choice === 'rent' ? '借りる' : '買う';
    assert.deepEqual([cell(3), cell(5), cell(10), cell(20)], [a3, a5, a10, a20], id);
    assert.equal(judge(fee, price, 0, 3, 1).maxRent, be, id + ' maxRent');
  }
  console.log('hayami ok');
}
