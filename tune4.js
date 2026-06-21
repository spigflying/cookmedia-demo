/* 庫客行銷 Cookmedia — index4 色調調整滑桿
 * 用途:讓使用者拖一支滑桿,在「橘 → 紅 → 深紅」之間即時改變整站紅色調,
 *       確定後複製色號(hex)回傳。只在網址帶 ?tune 或 #tune 時出現,
 *       正式訪客看不到,不影響線上網站。 */
(function () {
  "use strict";
  // 只在偵錯模式啟用
  if (!/tune/.test(location.search) && !/tune/.test(location.hash)) return;

  /* ---------- 色彩工具 ---------- */
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (r, g, b) =>
    "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("");
  const hexToRgb = (h) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpRgb = (c1, c2, t) => [
    lerp(c1[0], c2[0], t),
    lerp(c1[1], c2[1], t),
    lerp(c1[2], c2[2], t),
  ];
  const mixWhite = (rgb, t) => lerpRgb(rgb, [255, 255, 255], t);
  const mixBlack = (rgb, t) => lerpRgb(rgb, [0, 0, 0], t);
  const rgbStr = (rgb, a) => `rgba(${clamp(rgb[0])},${clamp(rgb[1])},${clamp(rgb[2])},${a})`;

  /* ---------- 色帶:橘 → 朱橘紅(目前) → 正紅 → 深紅 → 暗酒紅 ---------- */
  const STOPS = ["#f5853a", "#eb5f43", "#e23b2e", "#b11f2a", "#8a1a2a"].map(hexToRgb);
  const START = 25; // 初始滑桿值(對應目前的 #eb5f43)

  // slider 0..100 → 沿色帶內插出主色 rgb
  function colorAt(v) {
    const segs = STOPS.length - 1;
    const pos = (v / 100) * segs;
    const i = Math.min(segs - 1, Math.floor(pos));
    return lerpRgb(STOPS[i], STOPS[i + 1], pos - i);
  }

  /* ---------- 套用到整站 ---------- */
  let overrideEl;
  function apply(rgb) {
    const main = toHex(...rgb);
    const deepRgb = mixBlack(rgb, 0.28);
    const roseRgb = mixWhite(rgb, 0.38);
    const deep = toHex(...deepRgb);
    const rose = toHex(...roseRgb);
    const light = toHex(...mixWhite(rgb, 0.62));
    const root = document.documentElement.style;
    root.setProperty("--red", main);
    root.setProperty("--red-deep", deep);
    root.setProperty("--rose", rose);
    root.setProperty("--grad", `linear-gradient(135deg, ${light} 0%, ${rose} 50%, ${main} 100%)`);
    root.setProperty("--grad-2", `linear-gradient(135deg, ${rose} 0%, ${main} 55%, ${deep} 100%)`);
    // 服務卡 3、4 與 LIVE 脈動環是寫死的,用注入樣式跟著走
    if (!overrideEl) {
      overrideEl = document.createElement("style");
      document.head.appendChild(overrideEl);
    }
    overrideEl.textContent =
      `.feature:nth-child(3) .feature__mock{background:var(--grad)!important}` +
      `.feature:nth-child(4) .feature__mock{background:var(--grad-2)!important}` +
      `.stat__live .dot{box-shadow:0 0 0 0 ${rgbStr(rgb, 0.5)}!important}` +
      `@keyframes livePulse{0%{box-shadow:0 0 0 0 ${rgbStr(rgb, 0.5)}}` +
      `70%{box-shadow:0 0 0 8px ${rgbStr(rgb, 0)}}100%{box-shadow:0 0 0 0 ${rgbStr(rgb, 0)}}}`;
    return { main, deep, rose };
  }

  /* ---------- 建立面板 UI ---------- */
  const trackGrad =
    "linear-gradient(90deg," + ["#f5853a", "#eb5f43", "#e23b2e", "#b11f2a", "#8a1a2a"].join(",") + ")";

  const panel = document.createElement("div");
  panel.setAttribute("role", "group");
  panel.setAttribute("aria-label", "色調調整");
  panel.style.cssText = [
    "position:fixed", "left:50%", "bottom:16px", "transform:translateX(-50%)",
    "width:min(460px,calc(100vw - 24px))", "z-index:9999",
    "background:#fff", "border:1px solid rgba(20,17,15,0.12)", "border-radius:16px",
    "box-shadow:0 18px 50px rgba(20,17,15,0.18)", "padding:16px 18px",
    'font-family:"JetBrains Mono","Noto Sans TC",monospace', "color:#14110f",
  ].join(";");

  panel.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<span style="font-size:0.7rem;letter-spacing:0.16em;text-transform:uppercase;color:#6c645f">色調調整 · TONE</span>' +
      '<button id="tuneClose" aria-label="關閉" style="border:none;background:none;font-size:1rem;cursor:pointer;color:#6c645f;line-height:1">✕</button>' +
    '</div>' +
    '<input id="tuneRange" type="range" min="0" max="100" value="' + START + '" ' +
      'style="width:100%;height:14px;-webkit-appearance:none;appearance:none;border-radius:8px;outline:none;cursor:pointer;background:' + trackGrad + '" />' +
    '<div style="display:flex;justify-content:space-between;font-size:0.62rem;letter-spacing:0.1em;color:#aaa;margin-top:4px">' +
      '<span>橘 ORANGE</span><span>紅 RED</span><span>深紅 DEEP</span>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:12px;margin-top:14px">' +
      '<span id="tuneSwatch" style="width:46px;height:46px;border-radius:10px;flex:none;border:1px solid rgba(0,0,0,0.1)"></span>' +
      '<div style="flex:1">' +
        '<div id="tuneHex" style="font-size:1.5rem;font-weight:700;letter-spacing:0.02em">#EB5F43</div>' +
        '<div id="tuneSub" style="font-size:0.66rem;color:#6c645f;margin-top:2px">深 #000 · 亮 #000</div>' +
      '</div>' +
      '<button id="tuneCopy" style="border:none;background:#14110f;color:#fff;font-family:inherit;font-size:0.8rem;padding:0.7rem 1.1rem;border-radius:10px;cursor:pointer;white-space:nowrap">複製色號</button>' +
    '</div>';
  document.body.appendChild(panel);

  // slider 把手樣式(白底圓鈕)
  const knob = document.createElement("style");
  knob.textContent =
    "#tuneRange::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#fff;border:3px solid #14110f;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.3)}" +
    "#tuneRange::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid #14110f;cursor:pointer}";
  document.head.appendChild(knob);

  const range = panel.querySelector("#tuneRange");
  const hexEl = panel.querySelector("#tuneHex");
  const subEl = panel.querySelector("#tuneSub");
  const swatch = panel.querySelector("#tuneSwatch");
  const copyBtn = panel.querySelector("#tuneCopy");
  let current = "#eb5f43";

  function update() {
    const { main, deep, rose } = apply(colorAt(+range.value));
    current = main;
    hexEl.textContent = main.toUpperCase();
    subEl.textContent = "深 " + deep.toUpperCase() + " · 亮 " + rose.toUpperCase();
    swatch.style.background = main;
  }
  range.addEventListener("input", update);
  update();

  copyBtn.addEventListener("click", async () => {
    const text = current.toUpperCase();
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    const old = copyBtn.textContent;
    copyBtn.textContent = "已複製 " + text;
    setTimeout(() => (copyBtn.textContent = old), 1400);
  });

  panel.querySelector("#tuneClose").addEventListener("click", () => panel.remove());
})();
