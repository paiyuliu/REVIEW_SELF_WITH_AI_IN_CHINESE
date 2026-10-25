import { formatAiMarkdown, formatJson } from "./format.js";
import { PROMPTS, withPrompt } from "./prompts.js";
import { createReport } from "./report.js";

const $ = (id) => document.getElementById(id);
let currentReport = null;

function table(headers, rows) {
  const el = document.createElement("table");
  const head = el.createTHead().insertRow();
  for (const h of headers) {
    const th = document.createElement("th");
    th.textContent = h;
    head.append(th);
  }
  const body = el.createTBody();
  for (const row of rows) {
    const tr = body.insertRow();
    for (const cell of row) tr.insertCell().textContent = cell;
  }
  const wrap = document.createElement("div");
  wrap.className = "scroll";
  wrap.append(el);
  return wrap;
}

function render(report) {
  const { bazi, ziwei_doushu: ziwei } = report;
  $("bazi").replaceChildren(
    table(["柱", "干支"], bazi.pillars.map((p) => [p.pillar, p.ganzhi])),
  );
  const lunar = bazi.lunar_date;
  $("lunar-date").textContent =
    `農曆日期：${lunar.year} 年 ${Math.abs(lunar.month)} 月 ${lunar.day} 日` +
    (lunar.is_leap_month ? "（閏月）" : "");

  if (ziwei.chart) {
    const chart = ziwei.chart;
    $("ziwei-summary").textContent =
      `${chart.gender_category}｜${chart.five_elements_class}｜命主 ${chart.soul}、身主 ${chart.body}`;
    $("palaces").replaceChildren(
      table(
        ["宮位", "主星", "輔星", "雜曜", "大限", "小限歲數"],
        chart.palaces.map((p) => [
          `${p.heavenly_stem}${p.earthly_branch}【${p.name}】`,
          p.major_stars
            .map((s) => `${s.name}${s.brightness}${s.mutagen ? `化${s.mutagen}` : ""}`)
            .join("、"),
          p.minor_stars.map((s) => s.name).join("、"),
          p.adjective_stars.join("、"),
          `${p.decadal[0]}–${p.decadal[1]}`,
          p.small_limit_ages.join(" "),
        ]),
      ),
    );
    $("annual").replaceChildren(
      ziwei.annual_cycles.length
        ? table(
            ["年份", "虛歲", "大限宮", "大限區間", "小限宮", "流年干支", "流年命宮地支", "流年四化", "八字流年"],
            ziwei.annual_cycles.map((c) => [
              c.gregorian_year,
              c.virtual_age,
              c.ziwei.decadal.palace,
              c.ziwei.decadal.age_range?.join("–") ?? "",
              c.ziwei.small_limit?.palace ?? "",
              c.ziwei.yearly.heavenly_stem + c.ziwei.yearly.earthly_branch,
              c.ziwei.yearly.life_palace_branch,
              c.ziwei.yearly.four_transformations.join("、"),
              c.bazi.ganzhi,
            ]),
          )
        : Object.assign(document.createElement("p"), {
            textContent: "尚未從事件文字中找到西元年份。",
          }),
    );
  } else {
    $("ziwei-summary").textContent = ziwei.note;
    $("palaces").replaceChildren();
    $("annual").replaceChildren();
  }
  refreshOutput();
  $("result").hidden = false;
}

function outputText() {
  return withPrompt($("prompt-kind").value, formatAiMarkdown(currentReport));
}

function refreshOutput() {
  if (currentReport) $("output").value = outputText();
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

async function copyOutput() {
  const text = $("output").value;
  try {
    await navigator.clipboard.writeText(text);
    $("status").textContent = "已複製，可以貼給 AI 了。";
  } catch {
    $("output").select();
    $("status").textContent = "瀏覽器不允許自動複製，已選取文字，請按 Ctrl+C（Mac 為 ⌘C）複製。";
  }
}

async function loadExample() {
  try {
    const response = await fetch("example_history.txt");
    if (response.ok) $("history").value = await response.text();
  } catch {
    // 無法載入範例時保持空白
  }
}

function init() {
  for (const [key, { label }] of Object.entries(PROMPTS)) {
    $("prompt-kind").add(new Option(label, key));
  }
  $("prompt-kind").addEventListener("change", refreshOutput);
  $("copy").addEventListener("click", copyOutput);
  $("download-md").addEventListener("click", () =>
    download("fate-ai-analysis.md", $("output").value, "text/markdown"),
  );
  $("download-json").addEventListener("click", () =>
    download("fate-chart.json", formatJson(currentReport), "application/json"),
  );
  $("chart-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const status = $("status");
    status.className = "";
    status.textContent = "計算中…";
    $("submit").disabled = true;
    // 讓「計算中」先畫出來再進行同步計算
    setTimeout(() => {
      try {
        currentReport = createReport({
          birthDate: $("birth-date").value,
          birthTime: $("birth-time").value,
          birthPlace: $("birth-place").value,
          sex: $("sex").value,
          ziweiChartText: $("reference-text").value,
          history: $("history").value,
        });
        render(currentReport);
        status.textContent = "已完成，結果在下方。";
      } catch (error) {
        status.className = "error";
        status.textContent = `命盤計算失敗：${error.message}`;
      } finally {
        $("submit").disabled = false;
      }
    }, 0);
  });
  loadExample();
}

init();
