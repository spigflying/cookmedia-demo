/* 庫客行銷 Cookmedia — 改版 Demo 動畫(等寬科技 / Fintech 淺色風)
 * 風格參考 Squarefi。使用 GSAP + ScrollTrigger。
 * 招牌互動:服務區左側 sticky 清單會隨右側捲動切換 active。 */

gsap.registerPlugin(ScrollTrigger);

/* ---------- Hero 馬賽克方塊:生成 cell(永遠渲染,動畫另外處理)---------- */
function buildMosaic() {
  const m = document.getElementById("mosaic");
  if (!m) return [];
  const N = 40; // 8 欄 → 5 列(桌機);4 欄 → 10 列(手機)
  const frag = document.createDocumentFragment();
  const cells = [];
  for (let i = 0; i < N; i++) {
    const c = document.createElement("div");
    c.className = "cell";
    // 統一酒紅同色系,低 alpha 形成靜態深淺底紋
    const a = (0.03 + Math.random() * 0.12).toFixed(3);
    c.style.background = `rgba(142,27,35,${a})`;
    frag.appendChild(c);
    cells.push(c);
  }
  m.appendChild(frag);
  return cells;
}
const mosaicCells = buildMosaic();

const mm = gsap.matchMedia();

mm.add(
  {
    // base 為恆真條件,確保 callback 一定執行(否則未開啟減少動態時整段不會跑)
    base: "(min-width: 0px)",
    reduceMotion: "(prefers-reduced-motion: reduce)",
  },
  (ctx) => {
    const { reduceMotion } = ctx.conditions;
    const d = reduceMotion ? 0 : 1; // 動畫時間倍率:減少動態時歸零

    // 在 loader 還蓋著時就先把 hero 元素與馬賽克設為隱藏,
    // 避免 loader 淡出瞬間先閃出完整內容、再被動畫設成透明的「閃一下」。
    gsap.set(".hero [data-reveal]", { autoAlpha: 0, y: 32 });
    gsap.set(mosaicCells, { autoAlpha: 0 });

    /* ---------- 1. 載入動畫 ---------- */
    const loader = document.getElementById("loader");
    gsap
      .timeline()
      .to(loader, {
        autoAlpha: 0,
        duration: 0.5 * d,
        delay: 0.7 * d,
        onComplete: () => (loader.style.display = "none"),
      })
      .add(() => heroIn());

    /* ---------- 2. Hero 進場 + 馬賽克閃動 ---------- */
    function heroIn() {
      // 從已隱藏狀態淡入(初始狀態已在前面用 gsap.set 設好)
      gsap.to(".hero [data-reveal]", {
        y: 0,
        autoAlpha: 1,
        duration: 0.9 * d,
        ease: "power3.out",
        stagger: 0.12,
      });
      // 馬賽克方塊隨機錯位浮現
      gsap.to(mosaicCells, {
        autoAlpha: 1,
        duration: 0.6 * d,
        ease: "power1.out",
        stagger: { each: 0.015, from: "random" },
      });
      // 只挑約四成方塊,在同色系「灰玫瑰 ↔ 勃根地」間緩慢來回變色,
      // 營造低調、不規律的閃爍感(其餘維持靜態;減少動態時整段跳過)
      if (!reduceMotion) {
        const lightC = "rgba(192,89,94,0.05)";
        const deepC = "rgba(107,20,32,0.30)";
        mosaicCells.forEach((c) => {
          if (Math.random() > 0.4) return;
          gsap.fromTo(
            c,
            { backgroundColor: lightC },
            {
              backgroundColor: deepC,
              duration: 4 + Math.random() * 5, // 4~9 秒,緩慢
              delay: Math.random() * 4,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
            }
          );
        });
      }
    }

    /* ---------- 3. 導覽列捲動變色 ---------- */
    ScrollTrigger.create({
      start: "top -80",
      end: 99999,
      onUpdate: (self) =>
        document.getElementById("nav").classList.toggle("scrolled", self.scroll() > 80),
    });

    /* ---------- 4. 通用區塊淡入(排除 hero,hero 由載入後接手)---------- */
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      if (el.closest(".hero")) return;
      gsap.from(el, {
        y: 40,
        autoAlpha: 0,
        duration: 0.8 * d,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    /* ---------- 5. 數據:數字滾動 ---------- */
    gsap.utils.toArray("[data-stat]").forEach((stat, i) => {
      const numEl = stat.querySelector(".count");
      const target = +numEl.dataset.to;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 2.4 * d,           // 放慢數字滾動,更有質感
        ease: "power3.out",          // 尾段更緩,數字優雅停下
        delay: i * 0.15,             // 四格依序錯開,節奏更明顯
        scrollTrigger: { trigger: stat, start: "top 88%" },
        onUpdate: () => (numEl.textContent = Math.round(obj.v)),
      });
    });

    /* ---------- 6. 服務:左 sticky 清單隨右側捲動切換 active ---------- */
    const feats = gsap.utils.toArray("[data-feature]");
    const listItems = gsap.utils.toArray("#featList li");
    const cnEl = document.getElementById("featCn");

    function setActive(i) {
      listItems.forEach((li) => li.classList.toggle("active", +li.dataset.i === i));
      // 更新左側中文說明(配合切換淡入)
      const cn = feats[i].dataset.cn;
      if (cnEl.textContent !== cn) {
        gsap.fromTo(cnEl, { autoAlpha: 0.2, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.4 * d });
        cnEl.textContent = cn;
      }
    }

    feats.forEach((feat, i) => {
      // 每張 feature 通過畫面中央時設為 active
      ScrollTrigger.create({
        trigger: feat,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => self.isActive && setActive(i),
      });
      // mockup 與文字進場
      gsap.from(feat.querySelectorAll(".feature__mock, h3, p, .feature__no"), {
        y: 36,
        autoAlpha: 0,
        duration: 0.7 * d,
        ease: "power3.out",
        stagger: 0.06,
        scrollTrigger: { trigger: feat, start: "top 80%" },
      });
    });

    /* ---------- 7. HOW IT WORKS 交錯進場 ---------- */
    ScrollTrigger.batch(".how__step", {
      start: "top 85%",
      onEnter: (els) =>
        gsap.from(els, {
          y: 40,
          autoAlpha: 0,
          duration: 0.7 * d,
          ease: "power3.out",
          stagger: 0.1,
          overwrite: true,
        }),
    });

    return () => {};
  }
);
