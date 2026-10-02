// 画面の動き：ヘッダー・メニュー・ナビの現在地・進捗バー・スクロール表示・図の自動再生。
// 方針：内容が隠れたままにならないこと。JS が動かない／動きを減らす設定／印刷では、すべて最初から表示する。
(function () {
  "use strict";

  var root = document.documentElement;
  var header = document.getElementById("site-header");
  var menuBtn = document.querySelector(".menu-btn");
  var hasIO = "IntersectionObserver" in window;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var motion = hasIO && !reduce;

  if (motion) root.classList.add("anim");
  window.__motionReady = true;

  /* ---------- 経歴：線の伸び・通過したポイント・年号のゆるやかな視差 ---------- */
  var timeline = document.getElementById("timeline");
  var tlFill = timeline ? timeline.querySelector(".timeline__fill") : null;
  var tlItems = timeline ? Array.prototype.slice.call(timeline.querySelectorAll(".tl")) : [];
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var wideMq = window.matchMedia("(min-width: 768px)");

  function updateCareer() {
    if (!timeline || !motion) return;
    var vh = window.innerHeight;
    var center = vh * 0.55;
    var rect = timeline.getBoundingClientRect();
    var progress = rect.height > 0 ? (center - rect.top) / rect.height : 0;
    progress = Math.max(0, Math.min(1, progress));
    if (tlFill) tlFill.style.transform = "scaleY(" + progress.toFixed(4) + ")";
    tlItems.forEach(function (item) {
      item.classList.toggle("is-active", item.getBoundingClientRect().top < center);
    });
    if (wideMq.matches) {
      parallaxEls.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        var offset = (r.top + r.height / 2 - vh / 2) * -0.06;
        offset = Math.max(-28, Math.min(28, offset));
        el.style.transform = "translateY(" + offset.toFixed(1) + "px)";
      });
    } else {
      parallaxEls.forEach(function (el) { el.style.transform = ""; });
    }
  }

  /* ---------- ヘッダーの状態と進捗バー ---------- */
  var bar = document.querySelector(".progress__bar");
  var ticking = false;

  function onScroll() {
    ticking = false;
    updateCareer();
    header.classList.toggle("is-scrolled", window.scrollY > 24);
    if (bar) {
      var max = root.scrollHeight - root.clientHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4) + ")";
    }
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
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
  if (hasIO && navLinks.length) {
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
    ["top"].concat(Object.keys(byId)).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) navIo.observe(el);
    });
  }

  /* ---------- スクロールで現れる表示 ---------- */
  var revealTargets = Array.prototype.slice.call(document.querySelectorAll("[data-anim], [data-anim-group]"));

  // 表示し終えたら属性を外し、ホバーなど本来の動きに戻す
  function finish(el, ms) {
    setTimeout(function () {
      el.removeAttribute("data-anim");
      el.removeAttribute("data-anim-group");
      el.classList.remove("is-shown");
      el.style.removeProperty("--delay");
    }, ms);
  }

  function show(el) {
    if (el.hasAttribute("data-anim-group")) {
      var kids = Array.prototype.slice.call(el.children);
      kids.forEach(function (kid, i) {
        kid.style.setProperty("--delay", (i * 0.1) + "s");
        kid.classList.add("is-shown");
      });
      // グループの属性を外した後で、子の印を片付ける（途中で外すと一瞬消えるため）
      var ms = 1300 + kids.length * 100;
      finish(el, ms);
      kids.forEach(function (kid) { finish(kid, ms + 50); });
    } else {
      el.classList.add("is-shown");
      finish(el, 1200);
    }
  }

  function showAll() {
    revealTargets.forEach(function (el) {
      if (el.hasAttribute("data-anim") || el.hasAttribute("data-anim-group")) show(el);
    });
  }

  if (motion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        // 画面に入った、または既に通り過ぎた（ページ内リンクで飛んだ）要素を表示
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          io.unobserve(entry.target);
          show(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0 });
    revealTargets.forEach(function (el) { io.observe(el); });

    // 保険：何らかの理由で表示されない要素が残らないよう、画面内と上側のものを定期的に確認
    setInterval(function () {
      revealTargets.forEach(function (el) {
        if (!el.hasAttribute("data-anim") && !el.hasAttribute("data-anim-group")) return;
        if (el.classList.contains("is-shown")) return;
        if (el.getBoundingClientRect().top < window.innerHeight) show(el);
      });
    }, 1500);
  }

  var statement = document.getElementById("statement");
  if (statement) {
    if (motion) {
      var stIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            statement.classList.add("is-in");
            stIo.disconnect();
          }
        });
      }, { rootMargin: "0px 0px -15% 0px", threshold: 0 });
      stIo.observe(statement);
      setInterval(function () {
        if (statement.getBoundingClientRect().top < window.innerHeight * 0.9) statement.classList.add("is-in");
      }, 1500);
    }
    window.addEventListener("beforeprint", function () { statement.classList.add("is-in"); });
  }

  window.addEventListener("beforeprint", showAll);

  /* ---------- 画面に入っている間だけ動かす仕組み ---------- */
  function whileVisible(el, onEnter, onLeave) {
    if (!el || !hasIO) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) onEnter();
        else onLeave();
      });
    }, { threshold: 0.2 }).observe(el);
  }

  /* ---------- ヒーロー：相談から仕組みづくりまでの流れ ---------- */
  var processEl = document.getElementById("hero-process");
  if (processEl && motion) {
    var seq = ["1", "2", "3", "done", "done"];
    var pos = 0;
    var timer = null;
    var stateText = processEl.querySelector(".process__state-text");

    var tick = function () {
      var step = seq[pos % seq.length];
      processEl.setAttribute("data-step", step);
      if (stateText) stateText.textContent = step === "done" ? "形になりました" : "進行中";
      pos++;
    };

    var start = function () {
      if (timer) return;
      tick();
      timer = setInterval(tick, 1500);
    };
    var stop = function () {
      clearInterval(timer);
      timer = null;
    };

    processEl.setAttribute("data-step", "1");
    // 読み込みの動きが落ち着いてから開始
    setTimeout(function () { whileVisible(processEl, start, stop); }, 900);
  }

  /* ---------- KENBEI の図：自動で切り替え、ボタンでも選べる ---------- */
  var stage = document.getElementById("kenbei-stage");
  if (stage) {
    var buttons = stage.querySelectorAll(".stage-ctrl__btn");
    var interval = 3200;
    var autoTimer = null;
    var userChose = false;
    stage.style.setProperty("--stage-interval", interval + "ms");

    var setState = function (n) {
      stage.setAttribute("data-state", String(n));
      buttons.forEach(function (b) {
        var on = b.getAttribute("data-go") === String(n);
        b.setAttribute("aria-pressed", String(on));
        // 下線の時間表示をやり直す
        if (on) {
          b.style.animation = "none";
          void b.offsetWidth;
          b.style.animation = "";
        }
      });
    };

    var next = function () {
      var n = Number(stage.getAttribute("data-state")) % 4 + 1;
      setState(n);
    };

    var startAuto = function () {
      if (userChose || !motion || autoTimer) return;
      stage.classList.add("is-auto");
      setState(1);
      autoTimer = setInterval(next, interval);
    };
    var stopAuto = function () {
      clearInterval(autoTimer);
      autoTimer = null;
      stage.classList.remove("is-auto");
    };

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        userChose = true;
        stopAuto();
        setState(Number(b.getAttribute("data-go")));
      });
    });

    // マウスを重ねている間・キーボード操作中は止める
    stage.addEventListener("mouseenter", stopAuto);
    stage.addEventListener("mouseleave", function () { if (isStageVisible) startAuto(); });
    stage.addEventListener("focusin", stopAuto);

    var isStageVisible = false;
    whileVisible(stage, function () { isStageVisible = true; startAuto(); }, function () { isStageVisible = false; stopAuto(); });

    window.addEventListener("beforeprint", function () { stopAuto(); setState(2); });
  }

  /* ---------- ホームページの図：表示中だけ動かす ---------- */
  var siteVisual = document.querySelector(".site-visual");
  whileVisible(siteVisual, function () { siteVisual.classList.add("is-playing"); }, function () { siteVisual.classList.remove("is-playing"); });

  /* ---------- 管工事の図：表示中だけ動かす ---------- */
  var caseVisual = document.querySelector(".case-visual");
  whileVisible(caseVisual, function () { caseVisual.classList.add("is-playing"); }, function () { caseVisual.classList.remove("is-playing"); });
})();
