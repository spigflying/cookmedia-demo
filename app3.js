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
    const violet = Math.random() < 0.5;        // 一半偏紫、一半偏白
    const a = Math.random() * 0.18;            // 低透明度,維持隱約感
    c.style.background = violet
      ? `rgba(120,108,210,${a.toFixed(3)})`
      : `rgba(255,255,255,${(a * 1.4).toFixed(3)})`;
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
      gsap.from(".hero [data-reveal]", {
        y: 32,
        autoAlpha: 0,
        duration: 0.9 * d,
        ease: "power3.out",
        stagger: 0.12,
      });
      // 馬賽克方塊隨機錯位浮現
      gsap.from(mosaicCells, {
        autoAlpha: 0,
        duration: 0.6 * d,
        ease: "power1.out",
        stagger: { each: 0.015, from: "random" },
      });
      // 浮現後持續微微閃動(減少動態時 d=0,跳過)
      if (!reduceMotion) {
        gsap.to(mosaicCells, {
          opacity: () => 0.4 + Math.random() * 0.6,
          duration: () => 2 + Math.random() * 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 0.6,
          stagger: { each: 0.05, from: "random" },
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
        duration: 1.4 * d,
        ease: "power2.out",
        delay: i * 0.08,
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
