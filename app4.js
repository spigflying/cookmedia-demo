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

    /* ---------- 5. 數據:四格依序進場 + 各自的動畫 ----------
     * 用單一 master timeline(只掛一個 ScrollTrigger),四格以較大間隔依序登場,
     * 慢到看得到進場動畫。其中:
     *   data-spin → 大數字繞 Y 軸 3D 水平旋轉一圈
     *   data-live → 數字滾完後持續往上跳動,像即時數據 */
    const stats = gsap.utils.toArray("#stats [data-stat]");
    const statsTl = gsap.timeline({
      scrollTrigger: { trigger: "#stats", start: "top 72%" },
    });

    // live:數字滾到目標後,每 1.6 秒 +1 並做一次心跳縮放
    function startLive(numEl, from) {
      let v = from;
      const numWrap = numEl.parentElement;   // .stat__num(block,可套用 transform)
      const tick = () => {
        v += 1;
        numEl.textContent = v;
        gsap.fromTo(numWrap, { scale: 1.1 }, { scale: 1, duration: 0.45, ease: "power2.out" });
        gsap.delayedCall(1.6, tick);
      };
      gsap.delayedCall(1.6, tick);
    }

    stats.forEach((stat, i) => {
      const at = i * 0.55 * d;        // 依序間隔放大,一格一格欣賞
      const numWrap = stat.querySelector(".stat__num");
      const numEl = stat.querySelector(".count");
      const target = +numEl.dataset.to;

      // (a) 整格淡入上移
      statsTl.from(
        stat,
        { autoAlpha: 0, y: 56, duration: 1.0 * d, ease: "power3.out" },
        at
      );

      // (b) data-spin:大數字 3D 360° 水平旋轉(與淡入同時)
      if (stat.hasAttribute("data-spin")) {
        statsTl.from(
          numWrap,
          {
            rotationY: 360,
            transformPerspective: 800,
            transformOrigin: "50% 50%",
            duration: 1.7 * d,
            ease: "power2.out",
          },
          at
        );
      }

      // (c) 數字滾動(放慢);live 格滾完後接續即時跳動
      const obj = { v: 0 };
      statsTl.to(
        obj,
        {
          v: target,
          duration: 2.4 * d,
          ease: "power3.out",
          onUpdate: () => (numEl.textContent = Math.round(obj.v)),
          onComplete: () => {
            if (stat.hasAttribute("data-live") && !reduceMotion) startLive(numEl, target);
          },
        },
        at + 0.25            // 淡入後一點點才開始跳數字
      );
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
