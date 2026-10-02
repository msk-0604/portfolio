// スクロールに合わせた表示・進捗バー・ナビの現在地表示。
// JS が動かない環境でも、すべての内容は通常どおり表示される（html.js のときだけ非表示から始める）。
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // グループ内の子要素に順番の遅延を付ける
  document.querySelectorAll(".reveal-group").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty("--d", i);
    });
  });

  var targets = document.querySelectorAll(".reveal, .reveal-group, .work, .hub, .diagram");

  function showAll() {
    targets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  }

  // 印刷時はすべて表示
  window.addEventListener("beforeprint", showAll);

  // 進捗バーとヘッダーの影
  var bar = document.querySelector(".progress__bar");
  var header = document.querySelector(".site-header");
  var ticking = false;

  function onScroll() {
    var max = root.scrollHeight - root.clientHeight;
    var ratio = max > 0 ? window.scrollY / max : 0;
    if (bar) bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  // ナビの現在地
  var links = document.querySelectorAll(".site-nav a");
  if ("IntersectionObserver" in window && links.length) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(function (a) { a.removeAttribute("aria-current"); });
          link.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) navIo.observe(section);
    });
  }
})();
