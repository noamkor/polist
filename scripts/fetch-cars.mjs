const manufacturers = [
  {id:1,title:"אאודי"},{id:53,title:"אבארט"},{id:338,title:"אווטאר"},
  {id:96,title:"אוטוביאנקי"},{id:369,title:"אומודה"},{id:2,title:"אופל"},
  {id:224,title:"אורה"},{id:323,title:"אי.וי איזי"},{id:288,title:"איוויס"},
  {id:85,title:"איווקו"},{id:379,title:"איון"},{id:374,title:"איי אם"},
  {id:310,title:"אינאוס"},{id:3,title:"אינפיניטי"},{id:4,title:"איסוזו"},
  {id:299,title:"אל.אי.וי.סי"},{id:77,title:"אל.טי.איי"},{id:5,title:"אלפא רומיאו"},
  {id:115,title:"אלפין"},{id:6,title:"אם ג'י"},{id:345,title:"אס דאבל יו אמ"},
  {id:54,title:"אסטון מרטין"},{id:111,title:"אקורה"},{id:335,title:"אקס אי וי"},
  {id:349,title:"אקסיד"},{id:290,title:"אקספנג"},{id:117,title:"ארקפוקס"},
  {id:7,title:"ב מ וו"},{id:126,title:"באייק"},{id:193,title:"בי.איי.דאבליו"},
  {id:141,title:"בי.ווי.די"},{id:8,title:"ביואיק"},{id:55,title:"בנטלי"},
  {id:355,title:"ג'אקו"},{id:99,title:"ג'י.איי.סי"},{id:9,title:"ג'י.אם.סי"},
  {id:10,title:"ג'יפ"},{id:93,title:"ג'נסיס"},{id:319,title:"גופיל"},
  {id:346,title:"גיאיוואן"},{id:11,title:"גרייט וול"},{id:200,title:"ג׳יי.איי.סי"},
  {id:177,title:"ג׳ילי"},{id:329,title:"דאבל יו אם מוטורס"},{id:360,title:"דאיון"},
  {id:12,title:"דאצ'יה"},{id:13,title:"דודג'"},{id:88,title:"דונגפנג"},
  {id:14,title:"די.אס"},{id:60,title:"דייהו"},{id:15,title:"דייהטסו"},
  {id:362,title:"דיפאל"},{id:16,title:"האמר"},{id:301,title:"הונגצ'י"},
  {id:17,title:"הונדה"},{id:322,title:"וויה"},{id:18,title:"וולוו"},
  {id:284,title:"ויי"},{id:333,title:"זיקר"},{id:87,title:"טאטא"},
  {id:19,title:"טויוטה"},{id:62,title:"טסלה"},{id:20,title:"יגואר"},
  {id:357,title:"יודו"},{id:21,title:"יונדאי"},{id:80,title:"לאדה"},
  {id:22,title:"לוטוס"},{id:321,title:"לינק אנד קו"},{id:23,title:"לינקולן"},
  {id:363,title:"לינקסיס"},{id:320,title:"ליפמוטור"},{id:63,title:"למבורגיני"},
  {id:24,title:"לנד רובר"},{id:25,title:"לנצ'יה"},{id:26,title:"לקסוס"},
  {id:27,title:"מאזדה"},{id:86,title:"מאן"},{id:219,title:"מורגן"},
  {id:28,title:"מזראטי"},{id:29,title:"מיני"},{id:30,title:"מיצובישי"},
  {id:73,title:"מקלארן"},{id:89,title:"מקסוס"},{id:31,title:"מרצדס-בנץ"},
  {id:348,title:"נטע"},{id:289,title:"ניאו"},{id:32,title:"ניסאן"},
  {id:78,title:"ננג'ינג"},{id:33,title:"סאאב"},{id:34,title:"סאנגיונג"},
  {id:56,title:"סאנשיין"},{id:35,title:"סובארו"},{id:36,title:"סוזוקי"},
  {id:37,title:"סיאט"},{id:38,title:"סיטרואן"},{id:39,title:"סמארט"},
  {id:97,title:"סנטרו"},{id:40,title:"סקודה"},{id:300,title:"סקייוול"},
  {id:287,title:"סרס"},{id:364,title:"פאריזון"},{id:352,title:"פוטון"},
  {id:231,title:"פולסטאר"},{id:41,title:"פולקסווגן"},{id:42,title:"פונטיאק"},
  {id:43,title:"פורד"},{id:44,title:"פורשה"},{id:334,title:"פורתינג"},
  {id:90,title:"פיאג'ו"},{id:45,title:"פיאט"},{id:46,title:"פיג'ו"},
  {id:57,title:"פרארי"},{id:147,title:"צ׳רי"},{id:47,title:"קאדילק"},
  {id:203,title:"קארמה"},{id:92,title:"קופרה"},{id:48,title:"קיה"},
  {id:344,title:"קיי גי אם"},{id:49,title:"קרייזלר"},{id:91,title:"ראם"},
  {id:50,title:"רובר"},{id:58,title:"רולס רויס"},{id:361,title:"ריהיי"},
  {id:51,title:"רנו"},{id:52,title:"שברולט"},{id:59,title:"תעשיות רכב"},
];

async function fetchModels(m) {
  try {
    const res = await fetch(`https://gw.yad2.co.il/vehicles-cars-catalog/?manufacturer=${m.id}`);
    const json = await res.json();
    const models = (json?.data?.model || []).map(x => (x.title || "").trim()).filter(Boolean);
    return { title: m.title.trim(), models };
  } catch (e) {
    return { title: m.title.trim(), models: [], error: e.message };
  }
}

async function main() {
  const result = {};
  const batchSize = 10;
  for (let i = 0; i < manufacturers.length; i += batchSize) {
    const batch = manufacturers.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(fetchModels));
    for (const r of results) {
      result[r.title] = r.models;
    }
    process.stderr.write(`${Math.min(i + batchSize, manufacturers.length)}/${manufacturers.length}\n`);
  }
  console.log(JSON.stringify(result, null, 2));
}
main();
