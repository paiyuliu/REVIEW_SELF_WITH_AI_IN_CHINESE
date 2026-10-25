// 對照測試：新版 JS 輸出必須與 Python 版黃金資料完全一致。
// 執行：node --test tests/web/
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

// 與瀏覽器的 <script> 載入方式相同：在帶有 self 的全域環境執行 UMD 檔。
const sandbox = { self: {} };
vm.runInNewContext(
  readFileSync(new URL("../vendor/iztro.min.js", import.meta.url), "utf8"),
  sandbox,
);
globalThis.iztro = sandbox.self.iztro;

const { createReport, extractYears } = await import("../js/report.js");
const { formatAiMarkdown, formatJson } = await import("../js/format.js");

const goldenDir = new URL("./golden/", import.meta.url);
const files = readdirSync(goldenDir).filter((name) => name.endsWith(".json"));

test("有黃金資料", () => assert.ok(files.length >= 8));

for (const file of files) {
  test(`與 Python 輸出一致：${file}`, () => {
    const golden = JSON.parse(readFileSync(new URL(file, goldenDir), "utf8"));
    const input = golden.input;
    const report = createReport({
      birthDate: input.birth_date,
      birthTime: input.birth_time,
      birthPlace: input.birth_place,
      sex: input.sex,
      ziweiChartText: input.ziwei_chart_text,
      history: input.history,
    });
    assert.deepStrictEqual(report, golden.report);
    assert.equal(formatAiMarkdown(report), golden.markdown);
    assert.equal(formatJson(report), golden.json);
  });
}

test("主要案例的已知值", () => {
  const golden = JSON.parse(readFileSync(new URL("main_1983_male.json", goldenDir), "utf8"));
  const input = golden.input;
  const report = createReport({
    birthDate: input.birth_date,
    birthTime: input.birth_time,
    birthPlace: input.birth_place,
    sex: input.sex,
    ziweiChartText: "",
    history: input.history,
  });
  const chart = report.ziwei_doushu.chart;
  assert.equal(chart.gender_category, "陰男");
  assert.equal(chart.five_elements_class, "土五局");
  assert.equal(chart.life_palace_branch, "辰");
  const cycle2025 = report.ziwei_doushu.annual_cycles.find((c) => c.gregorian_year === 2025);
  assert.equal(cycle2025.ziwei.decadal.palace, "子女");
  assert.deepEqual(cycle2025.ziwei.decadal.age_range, [35, 44]);
});

test("extractYears 去重、排序並略過出生年", () => {
  assert.deepEqual(extractYears("2011 2025 年；2011 年；出生 1983 年", 1983), [2011, 2025]);
});
