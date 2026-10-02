// 画面の動き（ヘッダー・メニュー・スクロールで現れる表示・実績の図の切り替え）。
// JS が動かない場合や「視差効果を減らす」設定では、すべての内容が最初から表示される。
(function () {
  "use strict";

  var root = document.documentElement;
  var motion = root.classList.contains("motion");
  var header = document.getElementById("site-header");
  var menuBtn = document.querySelector(".menu-btn");

  /* ---------- ヘッダー：スクロール状態 ---------- */
  var ticking = false;
  var bar = document.querySelector(".progress__bar");
  var cssProgress = window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()");

  function onScroll() {
    ticking = false;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
    if (bar && !cssProgress) {
      var max = root.scrollHeight - root.clientHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0).toFixed(4) + ")";
    }
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- スマホのメニュー ---------- */
  function setMenu(open) {
    header.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.querySelector(".menu-btn__label").textContent = open ? "閉じる" : "メニュー";
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });
    document.querySelectorAll(".site-nav a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-open")) {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------- ナビ：現在のセクション ---------- */
  var navLinks = document.querySelectorAll(".site-nav a");
  if ("IntersectionObserver" in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
        var link = byId[entry.target.id];
        if (link) link.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    navIo.observe(document.getElementById("top"));
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) navIo.observe(el);
    });
  }

  /* ---------- スクロールで現れる表示（Web Animations API） ---------- */
  var EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

  // 内容に合わせて動きを変える
  var KEYFRAMES = {
    fade: [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "none" }],
    rise: [{ opacity: 0, transform: "translateY(40px)" }, { opacity: 1, transform: "none" }],
    mask: [{ transform: "translateY(105%)" }, { transform: "none" }],
    slide: [{ opacity: 0, transform: "translateX(28px)" }, { opacity: 1, transform: "none" }],
    pop: [{ opacity: 0, transform: "translateY(16px) scale(0.96)" }, { opacity: 1, transform: "none" }],
    clip: [{ opacity: 1, clipPath: "inset(12% 8% 12% 8% round 24px)", transform: "scale(0.96)" },
      { opacity: 1, clipPath: "inset(0% 0% 0% 0% round 16px)", transform: "none" }],
    draw: [{ opacity: 0 }, { opacity: 1 }]
  };

  var DURATION = { fade: 900, rise: 1000, mask: 1050, slide: 800, pop: 750, clip: 1200, draw: 700 };

  function play(el, type, delay) {
    var anim = el.animate(KEYFRAMES[type], {
      duration: DURATION[type],
      delay: delay || 0,
      easing: EASE,
      fill: "both"
    });
    // 終わったら最終状態をクラスで保持し、アニメーションは破棄する
    anim.finished.then(function () {
      el.classList.add("is-in");
      anim.cancel();
    }).catch(function () {});
    if (type === "draw" || type === "clip") el.classList.add("is-in");
  }

  function reveal(target) {
    var type = target.getAttribute("data-reveal");
    if (type) {
      play(target, type, 0);
      return;
    }
    var groupType = target.getAttribute("data-reveal-group");
    Array.prototype.forEach.call(target.children, function (child, i) {
      play(child, groupType, i * 110);
    });
  }

  var targets = document.querySelectorAll("[data-reveal], [data-reveal-group]");

  function showAll() {
    targets.forEach(function (t) {
      t.classList.add("is-in");
      Array.prototype.forEach.call(t.children, function (c) {
        if (t.hasAttribute("data-reveal-group")) c.classList.add("is-in");
      });
    });
  }

  if (motion) {
    // マスク表示の要素は、隠れている本体ではなく外枠（.line）を監視する
    var watchOf = function (t) {
      return t.getAttribute("data-reveal") === "mask" ? (t.closest(".line") || t) : t;
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        reveal(entry.target.__revealTarget || entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
    targets.forEach(function (t) {
      var w = watchOf(t);
      w.__revealTarget = t;
      io.observe(w);
    });
  }

  // 印刷時は動きを待たずに全文を表示
  window.addEventListener("beforeprint", showAll);

  /* ---------- KENBEI：スクロールに合わせて図を切り替える（PC のみ） ---------- */
  var story = document.querySelector(".story");
  var stage = document.getElementById("kenbei-stage");
  var steps = story ? story.querySelectorAll(".story__step") : [];
  var wide = window.matchMedia("(min-width: 1000px)");
  var storyIo = null;

  function setStep(step) {
    steps.forEach(function (s) { s.classList.toggle("is-active", s === step); });
    stage.setAttribute("data-state", step.getAttribute("data-step"));
  }

  function setupStory() {
    if (storyIo) {
      storyIo.disconnect();
      storyIo = null;
    }
    if (!stage || !steps.length) return;
    if (!wide.matches || !("IntersectionObserver" in window)) {
      // スマホ：通常の配置。図は「ひとつにまとまった」状態で固定
      story.classList.remove("is-live");
      stage.setAttribute("data-state", "2");
      return;
    }
    story.classList.add("is-live");
    setStep(steps[0]);
    storyIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setStep(entry.target);
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach(function (s) { storyIo.observe(s); });
  }

  setupStory();
  if (wide.addEventListener) wide.addEventListener("change", setupStory);

  window.addEventListener("beforeprint", function () {
    if (story) story.classList.remove("is-live");
    if (stage) stage.setAttribute("data-state", "2");
  });
  window.addEventListener("afterprint", setupStory);
})();
