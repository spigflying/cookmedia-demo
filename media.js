/* 庫客行銷 Cookmedia — 服務卡3「多元媒體規劃」廣告版位輪播
 * 三個版位(動態消息 / 限時動態 / 側欄橫幅)以 anime.js v4 的 timeline 輪流亮起:
 * 上浮 + 微放大 + 邊框提亮,約 4.4 秒一輪、無縫循環。
 *
 * 版面(寬度自適應、不壓字、不溢出)由 styles.css 的 .adfx-place 負責;
 * 本檔只負責「動效」,且尊重「減少動態」偏好(此時不啟動,保留靜態版位)。 */

import { createTimeline } from "animejs";

const place = document.querySelector(".adfx-place");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (place && !reduceMotion) {
  const devs = [".adfx-place .d1", ".adfx-place .d2", ".adfx-place .d3"];
  const STEP = 1500; // 每個版位起始間隔 → 三個共約 4.4 秒一輪
  const DUR = 1400;  // 單個版位:亮起 → 落下的時長

  // loop:true 讓整條 timeline 無縫循環;defaults 統一緩動,讓三段一致
  const tl = createTimeline({
    loop: true,
    defaults: { ease: "inOutSine" },
  });

  // 以「絕對時間位置」逐一加入,確保三個版位等距輪替(取代原本的 CSS @keyframes devCycle)
  devs.forEach((sel, i) => {
    tl.add(
      sel,
      {
        y: [0, -8, 0],
        scale: [1, 1.05, 1],
        borderColor: [
          "rgba(255,255,255,0.3)",
          "rgba(255,255,255,0.75)",
          "rgba(255,255,255,0.3)",
        ],
        duration: DUR,
      },
      i * STEP
    );
  });
}
