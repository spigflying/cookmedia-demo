/* 庫客行銷 Cookmedia — 改版 Demo 動畫
 * 使用 GSAP + ScrollTrigger。所有滾動動畫集中於此。 */

gsap.registerPlugin(ScrollTrigger);

// 透過 matchMedia 同時處理「減少動態」的無障礙偏好
const mm = gsap.matchMedia();

mm.add(
  {
    // base 為恆真條件,確保 callback 一定執行(否則未開啟減少動態時整段不會跑)
    base: "(min-width: 0px)",
    // 桌機與行動共用,差別只在減少動態時關閉動畫
    reduceMotion: "(prefers-reduced-motion: reduce)",
  },
  (ctx) => {
    const { reduceMotion } = ctx.conditions;
    const d = reduceMotion ? 0 : 1; // 動畫時間倍率:減少動態時直接歸零

    /* ---------- 1. 載入動畫 ---------- */
    const loader = document.getElementById("loader");
    const intro = gsap.timeline();
    intro
      .to(".loader__bar span", { width: "100%", duration: 0.9 * d, ease: "power2.inOut" })
      .to(".loader__mark", { y: -10, autoAlpha: 0, duration: 0.4 * d }, "+=0.1")
      .to(loader, {
        autoAlpha: 0,
        duration: 0.5 * d,
        onComplete: () => (loader.style.display = "none"),
      })
      // 載入結束後接著播 Hero 進場
      .add(() => heroIn());

    /* ---------- 2. Hero 進場 ---------- */
    function heroIn() {
      gsap.from('[data-anim="hero"]', {
        y: 40,
        autoAlpha: 0,
        duration: 0.9 * d,
        ease: "power3.out",
        stagger: 0.12,
      });
    }

    /* ---------- 3. 導覽列捲動變色 ---------- */
    ScrollTrigger.create({
      start: "top -80",
      end: 99999,
      onUpdate: (self) =>
        document.getElementById("nav").classList.toggle("scrolled", self.scroll() > 80),
    });

    /* ---------- 4. 區段標題進場 ---------- */
    gsap.utils.toArray(".section-head").forEach((el) => {
      gsap.from(el, {
        y: 40,
        autoAlpha: 0,
        duration: 0.8 * d,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });

    /* ---------- 5. 數據卡片 + 數字滾動 ---------- */
    gsap.utils.toArray("[data-stat]").forEach((stat, i) => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: stat, start: "top 88%" },
      });
      tl.from(stat, { y: 50, autoAlpha: 0, duration: 0.7 * d, ease: "power3.out", delay: i * 0.08 });

      // 數字由 0 跑到目標值
      const numEl = stat.querySelector(".count");
      const target = +numEl.dataset.to;
      const obj = { v: 0 };
      tl.to(
        obj,
        {
          v: target,
          duration: 1.4 * d,
          ease: "power2.out",
          onUpdate: () => (numEl.textContent = Math.round(obj.v)),
        },
        "<0.1"
      );
    });

    /* ---------- 6. 服務卡片交錯進場 ---------- */
    ScrollTrigger.batch("[data-card]", {
      start: "top 85%",
      onEnter: (els) =>
        gsap.from(els, {
          y: 60,
          autoAlpha: 0,
          duration: 0.8 * d,
          ease: "power3.out",
          stagger: 0.12,
          overwrite: true,
        }),
    });

    /* ---------- 7. 投放流程:進度線隨捲動推進 ---------- */
    const steps = gsap.utils.toArray("[data-step]");
    const flowTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".flow__track",
        start: "top 70%",
        end: "bottom 70%",
        scrub: 0.6,
      },
    });
    flowTl.to(".flow__progress", { width: "100%", ease: "none" });

    // 進度線經過時點亮節點
    steps.forEach((step, i) => {
      ScrollTrigger.create({
        trigger: step,
        start: "top 75%",
        onEnter: () => step.classList.add("active"),
        onLeaveBack: () => step.classList.remove("active"),
      });
      gsap.from(step, {
        y: 40,
        autoAlpha: 0,
        duration: 0.6 * d,
        ease: "power3.out",
        scrollTrigger: { trigger: step, start: "top 85%" },
        delay: i * 0.05,
      });
    });

    /* ---------- 8. 核心理念大字 ---------- */
    gsap.from("[data-words] span", {
      yPercent: 120,
      autoAlpha: 0,
      duration: 0.9 * d,
      ease: "power4.out",
      stagger: 0.1,
      scrollTrigger: { trigger: "[data-words]", start: "top 80%" },
    });

    /* ---------- 9. 通用「往上淡入」 ---------- */
    gsap.utils.toArray('[data-anim="up"]').forEach((el) => {
      gsap.from(el, {
        y: 40,
        autoAlpha: 0,
        duration: 0.8 * d,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    return () => {}; // matchMedia 會自動清理本區塊建立的所有動畫與 ScrollTrigger
  }
);

/* ---------- 背景粒子(輕量 canvas,非 GSAP) ---------- */
(function particles() {
  const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduce) return;

  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");
  let w, h, pts;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.min(70, Math.floor(w / 22));
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.4,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(91,140,255,0.55)";
      ctx.fill();

      // 連線
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j];
        const dist = Math.hypot(p.x - q.x, p.y - q.y);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(139,91,255,${0.12 * (1 - dist / 120)})`;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
})();
