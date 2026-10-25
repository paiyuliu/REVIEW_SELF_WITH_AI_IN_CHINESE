import { Solar } from "../vendor/lunar-typescript.mjs";
import { calculateZiwei } from "./ziwei.js";

export function extractYears(history, birthYear) {
  const years = new Set();
  for (const match of history.matchAll(/(?<!\d)(?:19|20)\d{2}(?!\d)/g)) {
    const year = Number(match[0]);
    if (year !== birthYear) years.add(year);
  }
  return [...years].sort((a, b) => a - b);
}

// birthDate: "YYYY-MM-DD"；birthTime: "HH:MM" 或 "HH:MM:SS"
export function createReport({ birthDate, birthTime, birthPlace, sex, ziweiChartText, history }) {
  const [year, month, day] = birthDate.split("-").map(Number);
  const [hour, minute, second = 0] = birthTime.split(":").map(Number);
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, second);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  const pillars = [
    ["年柱", eightChar.getYear()],
    ["月柱", eightChar.getMonth()],
    ["日柱", eightChar.getDay()],
    ["時柱", eightChar.getTime()],
  ].map(([pillar, ganzhi]) => ({ pillar, ganzhi }));

  const years = extractYears(history, year);
  const baziAnnualCycles = years.map((y) => ({
    gregorian_year: y,
    virtual_age: y - year + 1,
    ganzhi: Solar.fromYmd(y, 7, 1).getLunar().getEightChar().getYear(),
    basis: "以該年 7 月 1 日代表立春後的流年干支；不是事件日期的精確節氣換年判斷",
  }));

  const pad = (n) => String(n).padStart(2, "0");
  const timeText = `${pad(hour)}:${pad(minute)}:${pad(second)}`;
  const ziwei = calculateZiwei({
    birthDate,
    birthTime: timeText,
    sex,
    years,
  });
  ziwei.reference_text = ziweiChartText.trim();
  if (ziwei.chart) {
    ziwei.note =
      "本命盤由 iztro 2.6.3 依陽曆、出生時辰及性別排出。" +
      "流年索引以每年 7 月 1 日取值；不同流派或設定可能有差異。";
    const byYear = new Map(baziAnnualCycles.map((item) => [item.gregorian_year, item]));
    for (const item of ziwei.annual_cycles) item.bazi = byYear.get(item.gregorian_year);
  }

  return {
    profile: {
      solar_birth: `${birthDate} ${timeText}`,
      birth_place: birthPlace.trim(),
      timezone: "Asia/Taipei",
      time_basis: "台灣當地民用時間；未校正真太陽時",
      sex,
    },
    bazi: {
      calculation: "lunar-python",
      pillars,
      lunar_date: {
        year: lunar.getYear(),
        month: lunar.getMonth(),
        day: lunar.getDay(),
        is_leap_month: lunar.getMonth() < 0,
      },
    },
    ziwei_doushu: ziwei,
    historical_context: {
      timeline_years: baziAnnualCycles,
      raw_text: history.trim(),
    },
    calculation_notes: [
      "八字依輸入的台灣民用時間計算，未作真太陽時校正；出生時間接近時辰或節氣交界時，請另行核對。",
      "流年干支以每年 7 月 1 日取值，代表立春後干支；僅列出人生紀錄中出現的西元年份。",
      "紫微斗數由 iztro 2.6.3 排盤，採陽曆、天盤、繁體中文及其預設四化／亮度設定；不同流派可能有差異。",
      "命理內容適合作為文化與自我反思素材，不應視為可驗證的因果、醫療、投資或人生決策依據。",
    ],
  };
}
