// 紫微斗數排盤：移植自 ziwei_engine.mjs。iztro 以 <script> 載入為全域 `iztro`（Node 測試則由載入器注入）。

const HOROSCOPE_BASIS = "每年 7 月 1 日，代表立春後流年；不是事件日期的精確節氣換年判斷";

export function calculateZiwei({ birthDate, birthTime, sex, years }) {
  if (sex !== "男" && sex !== "女") {
    return {
      status: "needs_gender",
      chart: null,
      annual_cycles: [],
      reference_text: "",
      note: "紫微排盤需要性別，請在出生資料中選擇男或女。",
    };
  }
  const { astro } = globalThis.iztro;
  const hour = Number(birthTime.slice(0, 2));
  const timeIndex = Math.floor((hour + 1) / 2);
  const chart = astro.bySolar(birthDate, timeIndex, sex, true, "zh-TW");

  const palaces = chart.palaces.map((palace) => {
    const value = palace.toJSON();
    const star = (s) => ({ name: s.name, brightness: s.brightness, mutagen: s.mutagen });
    return {
      name: value.name,
      heavenly_stem: value.heavenlyStem,
      earthly_branch: value.earthlyBranch,
      is_body_palace: value.isBodyPalace,
      is_original_palace: value.isOriginalPalace,
      major_stars: value.majorStars.map(star),
      minor_stars: value.minorStars.map(star),
      adjective_stars: value.adjectiveStars.map((s) => s.name),
      changsheng: value.changsheng12,
      boshi: value.boshi12,
      jiangqian: value.jiangqian12,
      suiqian: value.suiqian12,
      decadal: value.decadal.range,
      small_limit_ages: value.ages,
    };
  });

  const yearStem = chart.chineseDate.split(" ")[0][0];
  const yinYear = "乙丁己辛癸".includes(yearStem);
  const genderCategory =
    sex === "男" ? (yinYear ? "陰男" : "陽男") : yinYear ? "陽女" : "陰女";

  const fourTransformations = [];
  for (const palace of palaces) {
    for (const star of palace.major_stars) {
      if (star.mutagen) {
        fourTransformations.push({
          transformation: star.mutagen,
          star: star.name,
          palace: palace.name,
        });
      }
    }
  }

  const annualCycles = years.map((year) => {
    const horoscope = chart.horoscope(`${year}-07-01`, timeIndex);
    const decadePalace = palaces.find(
      (p) => p.earthly_branch === horoscope.decadal.earthlyBranch,
    );
    const smallLimit = horoscope.agePalace()?.toJSON();
    return {
      gregorian_year: year,
      virtual_age: horoscope.age.nominalAge,
      ziwei: {
        decadal: {
          palace: decadePalace?.name ?? null,
          age_range: decadePalace?.decadal ?? null,
          heavenly_stem: horoscope.decadal.heavenlyStem,
          earthly_branch: horoscope.decadal.earthlyBranch,
        },
        small_limit: smallLimit
          ? {
              palace: smallLimit.name,
              heavenly_stem: smallLimit.heavenlyStem,
              earthly_branch: smallLimit.earthlyBranch,
            }
          : null,
        yearly: {
          heavenly_stem: horoscope.yearly.heavenlyStem,
          earthly_branch: horoscope.yearly.earthlyBranch,
          life_palace_branch: chart.palaces[horoscope.yearly.index]?.earthlyBranch ?? null,
          four_transformations: horoscope.yearly.mutagen,
          palaces: chart.palaces.map((palace, index) => ({
            name: horoscope.yearly.palaceNames[index],
            heavenly_stem: palace.heavenlyStem,
            earthly_branch: palace.earthlyBranch,
            stars: (horoscope.yearly.stars?.[index] ?? []).map((s) => s.name),
          })),
        },
      },
    };
  });

  // 與原 Node 引擎經 JSON 輸出一致：丟掉 undefined 欄位
  return JSON.parse(JSON.stringify({
    status: "calculated",
    chart: {
      engine: "iztro",
      engine_version: "2.6.3",
      gender: chart.gender,
      gender_category: genderCategory,
      solar_date: chart.solarDate,
      lunar_date: chart.lunarDate,
      birth_pillars: chart.chineseDate.split(" "),
      time: chart.time,
      time_range: chart.timeRange,
      zodiac: chart.zodiac,
      life_palace_branch: chart.earthlyBranchOfSoulPalace,
      body_palace_branch: chart.earthlyBranchOfBodyPalace,
      soul: chart.soul,
      body: chart.body,
      five_elements_class: chart.fiveElementsClass,
      four_transformations: fourTransformations,
      palaces,
      calculation_settings: {
        type: "solar",
        fix_leap_month: true,
        language: "zh-TW",
        chart_type: "heaven",
        horoscope_date_basis: HOROSCOPE_BASIS,
      },
    },
    annual_cycles: annualCycles,
    reference_text: "",
    note: "",
  }));
}
