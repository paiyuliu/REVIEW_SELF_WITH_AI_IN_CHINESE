const json = (value) => JSON.stringify(value, null, 2);

export function formatAiMarkdown(report) {
  const profile = report.profile;
  const pillars = report.bazi.pillars.map((p) => `${p.pillar} ${p.ganzhi}`).join("、");
  const lines = [
    "# 命盤與人生事件資料（供 AI 輔助整理）",
    "",
    "請以尊重、審慎、不宿命論的方式分析。清楚區分命理傳統的象徵性解讀與可由人生紀錄確認的事實；",
    "不要把相關性說成因果，也不要對健康、投資或重大人生決策作確定性預言。",
    "",
    "## 出生資料",
    `- 陽曆：${profile.solar_birth}`,
    `- 出生地：${profile.birth_place || "未提供"}`,
    `- 時區／時間基準：${profile.timezone}；${profile.time_basis}`,
    `- 性別：${profile.sex}`,
    `- 八字四柱：${pillars}`,
    "",
  ];
  const ziwei = report.ziwei_doushu;
  lines.push("## 紫微斗數本命盤");
  if (ziwei.chart) {
    const chart = ziwei.chart;
    lines.push(
      `- 排盤引擎：${chart.engine} ${chart.engine_version}`,
      `- 陰陽性別：${chart.gender_category}`,
      `- 農曆：${chart.lunar_date}；時辰：${chart.time}`,
      `- 五行局：${chart.five_elements_class}`,
      `- 命宮地支：${chart.life_palace_branch}；身宮地支：${chart.body_palace_branch}`,
      `- 命主：${chart.soul}；身主：${chart.body}`,
      "",
      "```json",
      json(chart),
      "```",
    );
  } else {
    lines.push(ziwei.note);
  }
  if (ziwei.reference_text) {
    lines.push("", "### 其他排盤參考原文", ziwei.reference_text);
  }

  lines.push("", "## 紫微流年、大限與小限索引");
  if (ziwei.annual_cycles.length) {
    lines.push("```json", json(ziwei.annual_cycles), "```");
  } else {
    lines.push("人生事件中沒有可供建立流年索引的西元年份。");
  }

  lines.push("", "## 八字流年索引");
  const timeline = report.historical_context.timeline_years;
  if (timeline.length) {
    lines.push(
      ...timeline.map(
        (item) =>
          `- ${item.gregorian_year} 年／虛歲 ${item.virtual_age}／流年干支 ${item.ganzhi}`,
      ),
    );
  } else {
    lines.push("- 未從人生紀錄中找到西元年份。");
  }
  lines.push(
    "",
    "## 人生事件原文",
    report.historical_context.raw_text || "尚未提供人生事件紀錄。",
    "",
    "## 計算與解讀限制",
    ...report.calculation_notes.map((note) => `- ${note}`),
  );
  return lines.join("\n");
}

export function formatJson(report) {
  return json(report);
}
