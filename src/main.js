import "@fontsource-variable/newsreader/standard.css";
import "@fontsource-variable/newsreader/standard-italic.css";
import "@fontsource-variable/archivo/standard.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./styles.css";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const animate = root.classList.contains("anim") && !reduceMotion;
const isSmall = () => window.innerWidth <= 900;
const fmt = new Intl.NumberFormat("vi-VN");

window.__storyReady = true;

/* --------------------------------------------------------------------------
   Cuộn mượt (Lenis) đồng bộ với ScrollTrigger
   -------------------------------------------------------------------------- */
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.4,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis; // tiện cho kiểm thử tự động
}
const onScrollFrame = (fn) => (lenis ? lenis.on("scroll", fn) : window.addEventListener("scroll", fn, { passive: true }));

const header = $("#siteHeader");
const headerH = () => header.offsetHeight;

function scrollToTarget(target) {
  const offset = target.id === "top" ? 0 : -headerH() + 1;
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.6 });
  else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + offset, behavior: reduceMotion ? "auto" : "smooth" });
}

document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute("href").slice(1);
  const target = id ? document.getElementById(id) : null;
  if (!target) return;
  e.preventDefault();
  closeMenu(false);
  scrollToTarget(target);
  history.replaceState(null, "", "#" + id);
});

/* --------------------------------------------------------------------------
   Header: trạng thái cuộn, ẩn khi cuộn xuống, đổi tông theo nền bên dưới
   -------------------------------------------------------------------------- */
const readBar = $("#readBar");
const toneEls = $$("[data-tone]");
let lastY = window.scrollY;

function refreshTone() {
  const probe = headerH() / 2;
  const el = toneEls.filter((s) => {
    const r = s.getBoundingClientRect();
    return r.top <= probe && r.bottom > probe;
  }).pop();
  const tone = el ? el.dataset.tone : "paper";
  header.classList.toggle("on-moss", tone === "moss");
  header.classList.toggle("on-forest", tone === "forest");
}

function onScroll() {
  const y = window.scrollY;
  header.classList.toggle("scrolled", y > 24);
  if (!root.classList.contains("menu-open")) {
    if (y > lastY + 4 && y > window.innerHeight) header.classList.add("is-hidden");
    if (y < lastY - 4) header.classList.remove("is-hidden");
  }
  lastY = y;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  readBar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  refreshTone();
}
onScrollFrame(onScroll);
onScroll();

/* Chương đang đọc: hiện trên header và đánh dấu trong mục lục */
const nowEl = $(".header-now");
const nowNum = $("#nowNum");
const nowLabel = $("#nowLabel");
const menuLinks = $$(".menu-list a");
function setCurrent(sec) {
  nowEl.classList.toggle("is-visible", !!sec);
  menuLinks.forEach((a) => {
    const on = !!sec && a.dataset.nav === sec.id;
    a.classList.toggle("active", on);
    on ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current");
  });
  if (!sec) return;
  nowNum.textContent = sec.dataset.num;
  nowLabel.textContent = sec.dataset.label;
}
$$("[data-chapter]").forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec,
    start: "top 50%",
    end: "bottom 50%",
    onToggle: (self) => self.isActive && setCurrent(sec),
  });
});
ScrollTrigger.create({ trigger: "#mo-dau", start: "top 50%", onLeaveBack: () => setCurrent(null) });

/* --------------------------------------------------------------------------
   Mục lục toàn màn hình
   -------------------------------------------------------------------------- */
const menu = $("#menu");
const menuBtn = $("#menuBtn");
let menuTimer;
menuLinks.forEach((a, i) => a.parentElement.style.setProperty("--d", i));

function openMenu() {
  clearTimeout(menuTimer);
  menu.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add("is-open")));
  root.classList.add("menu-open");
  header.classList.remove("is-hidden");
  menuBtn.setAttribute("aria-expanded", "true");
  $(".menu-btn-label").textContent = "Đóng";
  lenis && lenis.stop();
  setTimeout(() => (menuLinks.find((a) => a.classList.contains("active")) || menuLinks[0]).focus({ preventScroll: true }), 300);
}
function closeMenu(returnFocus = true) {
  if (!root.classList.contains("menu-open")) return;
  menu.classList.remove("is-open");
  root.classList.remove("menu-open");
  menuBtn.setAttribute("aria-expanded", "false");
  $(".menu-btn-label").textContent = "Mục lục";
  lenis && lenis.start();
  menuTimer = setTimeout(() => (menu.hidden = true), reduceMotion ? 0 : 800);
  if (returnFocus) menuBtn.focus({ preventScroll: true });
}
menuBtn.addEventListener("click", () => (root.classList.contains("menu-open") ? closeMenu() : openMenu()));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
  // Giữ tiêu điểm bàn phím trong mục lục khi đang mở
  if (e.key === "Tab" && root.classList.contains("menu-open")) {
    const items = [menuBtn, ...$$("a", menu)];
    const i = items.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
  }
});

/* ==========================================================================
   Video: điền link vào data-video của từng .video-slot
   Hỗ trợ YouTube, Vimeo, Google Drive, Facebook hoặc file .mp4/.webm
   ========================================================================== */
function videoEmbed(raw) {
  const v = (raw || "").trim();
  if (!v) return null;
  let m;
  if ((m = v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/)) || (m = v.match(/^([\w-]{11})$/)))
    return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0&modestbranding=1&playsinline=1` };
  if ((m = v.match(/vimeo\.com\/(?:video\/)?(\d+)/)))
    return { type: "iframe", src: `https://player.vimeo.com/video/${m[1]}?autoplay=1&title=0&byline=0` };
  if ((m = v.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/)))
    return { type: "iframe", src: `https://drive.google.com/file/d/${m[1]}/preview` };
  if (/facebook\.com|fb\.watch/.test(v))
    return { type: "iframe", src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(v)}&show_text=false&autoplay=true` };
  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(v)) return { type: "video", src: v };
  if (/^https?:\/\//.test(v)) return { type: "iframe", src: v };
  return null;
}

$$(".video-slot").forEach((slot) => {
  const frame = $(".video-frame", slot);
  const btn = $(".video-play", slot);
  const embed = videoEmbed(slot.dataset.video);
  // Đổi sang đường dẫn tuyệt đối: url() trong biến CSS được tính theo vị trí file CSS
  if (slot.dataset.poster) frame.style.setProperty("--poster", `url("${new URL(slot.dataset.poster, document.baseURI).href}")`);
  if (slot.dataset.ratio) frame.style.setProperty("--video-ratio", slot.dataset.ratio);
  if (!embed) {
    slot.classList.add("is-pending");
    btn.setAttribute("aria-disabled", "true");
    btn.setAttribute("aria-label", btn.getAttribute("aria-label") + " (video sẽ sớm được cập nhật)");
    return;
  }
  btn.addEventListener("click", () => {
    if (slot.classList.contains("is-playing")) return;
    let el;
    if (embed.type === "video") {
      el = document.createElement("video");
      Object.assign(el, { src: embed.src, controls: true, playsInline: true, autoplay: true });
      el.addEventListener("play", () => $$(".video-frame video").forEach((o) => o !== el && o.pause()));
    } else {
      el = document.createElement("iframe");
      el.src = embed.src;
      el.title = $("h3", slot)?.textContent || "Video";
      el.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      el.allowFullscreen = true;
    }
    frame.appendChild(el);
    slot.classList.add("is-playing");
    el.focus && el.focus();
  });
  // Nút phát "hút" theo con trỏ
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    const ring = $(".play-ring", slot);
    const move = gsap.quickTo(ring, "x", { duration: 0.6, ease: "power3.out" });
    const moveY = gsap.quickTo(ring, "y", { duration: 0.6, ease: "power3.out" });
    frame.addEventListener("pointermove", (e) => {
      const r = frame.getBoundingClientRect();
      move((e.clientX - r.left - r.width / 2) * 0.12);
      moveY((e.clientY - r.top - r.height / 2) * 0.12);
    });
    frame.addEventListener("pointerleave", () => { move(0); moveY(0); });
  }
});

/* --------------------------------------------------------------------------
   Kéo so sánh Giấy ↔ Màn hình
   -------------------------------------------------------------------------- */
const compare = $("#compare");
const range = $("#compareRange");
const setCompare = (v) => compare.style.setProperty("--pos", v + "%");
range.addEventListener("input", () => setCompare(range.value));
range.addEventListener("pointerdown", () => compare.classList.add("is-dragging"));
window.addEventListener("pointerup", () => compare.classList.remove("is-dragging"));
setCompare(range.value);

/* ==========================================================================
   Biểu đồ
   ========================================================================== */
// Số ngẫu nhiên có hạt giống để biểu đồ giống nhau ở mọi lần tải
function seeded(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/* ----- Chồng báo: mỗi tờ = 10 triệu bản ----- */
const stack = $("#stack");
if (stack) {
  const rnd = seeded(7);
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 110; i++) {
    const s = document.createElement("i");
    s.className = "ply" + (i >= 25 ? " is-gone" : "");
    s.style.cssText = `--i:${i};--o:${i >= 25 ? 109 - i : 0};--dx:${((rnd() - 0.5) * 8).toFixed(1)};--rot:${((rnd() - 0.5) * 0.9).toFixed(2)};--fx:${((rnd() - 0.5) * 520).toFixed(0)};--frot:${((rnd() - 0.5) * 70).toFixed(0)}`;
    frag.appendChild(s);
  }
  stack.appendChild(frag);
}
const stackStates = [
  { value: "1,1 tỷ", year: "bản · 2013" },
  { value: "250 triệu", year: "bản · 2022" },
  { value: "250 triệu", year: "bản · 2022" },
];
function updateStack(fig, step) {
  const st = stackStates[step];
  const v = $("#stackValue");
  if (v.textContent === st.value) return;
  gsap.fromTo(v, { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: reduceMotion ? 0 : 0.6, ease: "expo.out" });
  v.textContent = st.value;
  $("#stackYear").textContent = st.year;
}

/* ----- Biểu đồ ô vuông: mỗi ô = một người ----- */
const WAFFLE = {
  readers: {
    total: 156,
    cols: 13,
    steps: [
      { big: 156, note: "người trả lời", groups: [{ label: "1 ô = 1 người", n: 156, c: 0 }] },
      { big: 156, note: "người trả lời", groups: "readers" },
      { big: 124, note: "người vẫn tiếp xúc · 79,5%", groups: "readers", dim: [3, 4] },
    ],
    sets: {
      readers: [
        { label: "Đọc thường xuyên", n: 65, pct: "41,7%", c: 1 },
        { label: "Đọc thỉnh thoảng", n: 49, pct: "31,4%", c: 2 },
        { label: "Hiếm khi đọc", n: 10, pct: "6,4%", c: 3 },
        { label: "Từng đọc, nay không còn", n: 29, pct: "18,6%", c: 4 },
        { label: "Chưa từng đọc", n: 3, pct: "1,9%", c: 5 },
      ],
    },
  },
  youth: {
    total: 132,
    cols: 12,
    titles: ["Bạn đã từng đọc báo giấy chưa?", "Bạn đã từng đọc báo giấy chưa?", "Tần suất bạn đọc báo giấy hiện nay?", "Tần suất bạn đọc báo giấy hiện nay?"],
    steps: [
      { big: 132, note: "người trẻ 15–30 tuổi", groups: [{ label: "1 ô = 1 người", n: 132, c: 0 }] },
      { big: 106, note: "người từng đọc · 80,3%", groups: "exp", dim: [3] },
      { big: 106, note: "người từng đọc", groups: "freq", off: 26 },
      { big: 7, note: "đọc ít nhất vài lần mỗi tuần", groups: "freq", off: 26, dim: [2, 3, 4] },
    ],
    sets: {
      exp: [
        { label: "Thường xuyên", n: 5, pct: "3,8%", c: 1 },
        { label: "Thỉnh thoảng", n: 29, pct: "22%", c: 2 },
        { label: "Chỉ đọc vài lần", n: 72, pct: "54,5%", c: 3 },
        { label: "Chưa từng", n: 26, pct: "19,7%", c: 4 },
      ],
      freq: [
        { label: "Hằng ngày", n: 2, pct: "1,9%", c: 1 },
        { label: "Vài lần mỗi tuần", n: 5, pct: "4,7%", c: 2 },
        { label: "Vài lần mỗi tháng", n: 16, pct: "15,1%", c: 3 },
        { label: "Rất hiếm khi", n: 59, pct: "55,7%", c: 4 },
        { label: "Không còn đọc", n: 24, pct: "22,6%", c: 5 },
      ],
    },
  },
};

function buildWaffle(scrolly) {
  const cfg = WAFFLE[scrolly.dataset.set];
  const grid = $(".waffle", scrolly);
  grid.style.setProperty("--cols", cfg.cols);
  grid.style.setProperty("--rows", Math.ceil(cfg.total / cfg.cols));
  const frag = document.createDocumentFragment();
  for (let i = 0; i < cfg.total; i++) {
    const cell = document.createElement("i");
    cell.style.setProperty("--i", i);
    frag.appendChild(cell);
  }
  grid.appendChild(frag);
}

function updateWaffle(scrolly, step) {
  const cfg = WAFFLE[scrolly.dataset.set];
  const st = cfg.steps[step];
  const groups = typeof st.groups === "string" ? cfg.sets[st.groups] : st.groups;
  const cells = $$(".waffle i", scrolly);
  const shown = cfg.total - (st.off || 0);
  const isDim = (gi) => (st.dim || []).includes(gi);
  let k = 0;
  groups.forEach((g, gi) => {
    const tip = g.c ? `<b>${g.label}</b>${g.n} người${g.pct ? " · " + g.pct : ""}` : "1 người tham gia khảo sát";
    for (let j = 0; j < g.n && k < shown; j++, k++) {
      const cell = cells[k];
      cell.dataset.c = g.c;
      cell.dataset.tip = tip;
      isDim(gi) ? (cell.dataset.s = "dim") : delete cell.dataset.s;
    }
  });
  for (; k < cells.length; k++) {
    cells[k].dataset.s = "off";
    cells[k].dataset.tip = "<b>Chưa từng đọc</b>26 người · không tính trong tần suất";
  }

  const legend = $(".legend", scrolly);
  legend.innerHTML = groups
    .map((g, gi) => `<li${isDim(gi) ? ' data-s="dim"' : ""}><i style="background:var(--c${g.c})"></i><span>${g.label}</span>${g.c ? `<b>${g.n}</b>` : ""}</li>`)
    .join("") + (st.off ? `<li data-s="dim"><i style="background:var(--c0)"></i><span>Chưa từng đọc (ẩn)</span><b>${st.off}</b></li>` : "");

  const big = $("[data-big]", scrolly);
  const from = parseInt(big.textContent, 10) || 0;
  if (from !== st.big) {
    const o = { v: from };
    gsap.to(o, { v: st.big, duration: reduceMotion ? 0 : 0.9, ease: "power3.out", onUpdate: () => (big.textContent = fmt.format(Math.round(o.v))) });
  }
  $("[data-big-note]", scrolly).textContent = st.note;
  const title = $("[data-title]", scrolly);
  if (title && cfg.titles) title.textContent = cfg.titles[step];
}

/* ----- Điều phối các bước cuộn ----- */
$$(".scrolly").forEach((scrolly) => {
  const fig = $(".scrolly-figure", scrolly);
  const steps = $$(".step", scrolly);
  const kind = scrolly.dataset.chart;
  if (kind === "waffle") buildWaffle(scrolly);
  const go = (i) => {
    if (fig.dataset.step === String(i)) return;
    fig.dataset.step = i;
    steps.forEach((s, j) => s.classList.toggle("is-active", j === i));
    if (kind === "stack") updateStack(fig, i);
    else updateWaffle(scrolly, i);
  };
  go(0);
  // Đổi bước khi thẻ chữ của bước đó đi qua vạch đọc (trên điện thoại: ngay khi thẻ hiện ra)
  steps.forEach((step, i) => {
    ScrollTrigger.create({
      trigger: $(".step-card", step),
      start: () => (isSmall() ? "top 82%" : "center 62%"),
      onEnter: () => go(i),
      onLeaveBack: () => go(Math.max(0, i - 1)),
    });
  });
});

/* ----- Tooltip cho ô vuông ----- */
const tip = $("#chartTip");
$$(".waffle").forEach((grid) => {
  grid.addEventListener("pointerover", (e) => {
    const cell = e.target.closest("i");
    if (!cell || !cell.dataset.tip) return;
    const r = cell.getBoundingClientRect();
    tip.innerHTML = cell.dataset.tip;
    tip.style.left = r.left + r.width / 2 + "px";
    tip.style.top = r.top + "px";
    tip.classList.add("is-visible");
  });
  grid.addEventListener("pointerleave", () => tip.classList.remove("is-visible"));
});
onScrollFrame(() => tip.classList.remove("is-visible"));

/* --------------------------------------------------------------------------
   Băng chữ chạy: nhân bản đủ dài để lặp liền mạch
   -------------------------------------------------------------------------- */
$$(".marquee-row, .ticker-row").forEach((row) => {
  const originals = [...row.children];
  const setW = row.scrollWidth;
  let sets = 1;
  while (setW * sets < window.innerWidth * 1.1 && sets < 8) sets++;
  for (let n = 1; n < sets * 2; n++) {
    originals.forEach((li) => {
      const c = li.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      row.appendChild(c);
    });
  }
});

/* Ánh sáng theo con trỏ trên thẻ trụ cột */
$$(".pillar").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", e.clientX - r.left + "px");
    card.style.setProperty("--my", e.clientY - r.top + "px");
  });
});

/* ==========================================================================
   Tiện ích animation
   ========================================================================== */
function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else {
            const s = document.createElement("span");
            s.className = "word";
            s.textContent = part;
            frag.appendChild(s);
          }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== "BR") walk(child);
    });
  };
  walk(el);
  return $$(".word", el);
}

function countUp(el) {
  const end = parseInt(el.dataset.to, 10);
  const o = { v: 0 };
  el.textContent = "0";
  gsap.to(o, {
    v: end,
    duration: 1.8,
    ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 90%", once: true },
    onUpdate: () => (el.textContent = fmt.format(Math.round(o.v))),
  });
}

/* ==========================================================================
   Animation (bỏ qua khi người dùng bật giảm chuyển động)
   ========================================================================== */
if (!animate) {
  $(".journey .hscroll-track")?.style.setProperty("--p", 1);
}

if (animate) {
  /* ----- Hero: trang nhất hiện dần, xấp ảnh in rơi xuống ----- */
  gsap.set(".fp-line > span", { yPercent: 110 });
  gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.1 })
    .from(".fp-top", { autoAlpha: 0, y: -10, duration: 0.8 })
    .from(".fp-rule", { scaleX: 0, duration: 1.2, stagger: 0.12 }, 0.1)
    .to(".fp-line > span", { yPercent: 0, duration: 1.2, stagger: 0.12 }, 0.2)
    .from(".fp-deck", { autoAlpha: 0, y: 24, duration: 1 }, 0.6)
    .from(".print", { autoAlpha: 0, yPercent: 40, scale: 0.92, duration: 1.3, stagger: 0.12 }, 0.45)
    .from(".ticker", { autoAlpha: 0, duration: 0.8 }, 0.9);

  // Khi cuộn: hai dòng tít trượt ngược chiều, ảnh in trôi lệch nhau
  const heroST = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
  gsap.to(".fp-line:not(.fp-line--2) > span", { xPercent: -5, ease: "none", scrollTrigger: heroST });
  gsap.to(".fp-line--2 > span", { xPercent: 5, ease: "none", scrollTrigger: heroST });
  $$(".print").forEach((el, i) => {
    gsap.to(el, { y: [-50, -130, -90][i], rotation: [-10, 5, 12][i], ease: "none", scrollTrigger: heroST });
  });

  /* ----- Tiêu đề: từng chữ hiện lên ----- */
  $$(".split").forEach((el) => {
    const words = splitWords(el);
    if (el.closest(".turn")) return; // tiêu đề đầu chương chạy theo nhịp lật trang
    gsap.from(words, {
      yPercent: 60, autoAlpha: 0, filter: "blur(8px)",
      stagger: 0.035, duration: 1.1, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  /* ----- Đoạn chữ sáng dần theo cuộn ----- */
  $$(".scrub-text").forEach((el) => {
    const words = splitWords(el);
    gsap.fromTo(words, { opacity: 0.14 }, {
      opacity: 1, stagger: 0.1, ease: "none",
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
    });
  });

  /* ----- Hiện dần chung ----- */
  $$(".reveal").forEach((el) => {
    gsap.from(el, {
      y: 50, autoAlpha: 0, duration: 1.2, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true, onEnter: () => el.classList.add("is-in") },
    });
  });

  /* ----- Ảnh mở khung + thu phóng ----- */
  $$(".reveal-img").forEach((fig) => {
    const frame = $(".media-frame", fig);
    const img = $("img", fig);
    const round = fig.classList.contains("media--bleed") ? "0px" : "22px";
    gsap.fromTo(frame, { clipPath: `inset(9% 7% 9% 7% round ${round})` }, {
      clipPath: `inset(0% 0% 0% 0% round ${round})`, ease: "none",
      scrollTrigger: { trigger: fig, start: "top 95%", end: "top 35%", scrub: true },
    });
    gsap.fromTo(img, { scale: 1.18 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  /* ----- Lật trang: tờ báo lùi ra, trang phải lật qua gáy, lộ trang mở chương ----- */
  $$(".turn").forEach((turn) => {
    const spread = $(".turn-spread", turn);
    const leaf = $(".turn-leaf", turn);
    const head = $(".opener, .intro-head", turn);
    const verb = $(".opener-verb", head);
    // Mặt sau của trang lật là bản sao trang mở chương, chỉ nửa trái lộ ra
    // (bọc trong khung rộng bằng cả trang để bản sao căn đúng như bản thật)
    const clone = head.cloneNode(true);
    clone.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
    const cloneWrap = document.createElement("div");
    cloneWrap.className = "leaf-clone";
    cloneWrap.setAttribute("aria-hidden", "true");
    cloneWrap.appendChild(clone);
    $(".leaf-back", turn).appendChild(cloneWrap);

    const prevTone = turn.dataset.tone;
    const ownTone = turn.closest("[data-chapter]").dataset.tone;
    const FLIP_START = 0.1;
    const FLIP_END = 0.8;
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: turn, start: "top top", end: "bottom bottom", scrub: 0.8 },
      onUpdate: () => {
        // ánh sáng, bóng và tông header bám theo góc lật thực tế của trang
        const f = Math.min(1, Math.max(0, -gsap.getProperty(leaf, "rotationY") / 180));
        turn.style.setProperty("--f", f.toFixed(3));
        turn.classList.toggle("is-done", f >= 0.999);
        const t = f < 0.5 ? prevTone : ownTone;
        if (turn.dataset.tone !== t) { turn.dataset.tone = t; refreshTone(); }
      },
    });
    const far = () => (isSmall() ? 0.88 : 0.8);
    tl.to(spread, { scale: far, rotationX: 9, y: () => -window.innerHeight * 0.02, duration: 0.32, ease: "power2.out" }, 0)
      .fromTo(leaf, { rotationY: 0, z: 1 }, { rotationY: -180, z: 1, duration: FLIP_END - FLIP_START, ease: "power2.inOut" }, FLIP_START)
      .to(spread, { scale: 1, rotationX: 0, y: 0, duration: 0.3, ease: "power2.inOut" }, FLIP_END - 0.24);
    if (verb) tl.fromTo(verb, { "--wdth": 62 }, { "--wdth": 112, duration: 1 - FLIP_END - 0.04 }, FLIP_END + 0.04);
  });

  /* ----- Khảo sát: thanh chia nhóm ----- */
  gsap.from(".survey-seg", { scaleX: 0, autoAlpha: 0, stagger: 0.15, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: ".survey-bar", start: "top 88%", once: true } });

  /* ----- Mẩu báo cắt, không gian đọc, trụ cột ----- */
  // Ghi rõ điểm cuối (góc --r của từng mẩu); xong thì trả transform lại cho CSS để hiệu ứng hover chạy
  gsap.fromTo(".clips li", { y: 60, rotation: (i) => (i % 2 ? 14 : -14), autoAlpha: 0 }, {
    y: 0, rotation: (i, el) => parseFloat(el.style.getPropertyValue("--r")) || 0, autoAlpha: 1,
    stagger: 0.08, duration: 1.1, ease: "back.out(1.6)", clearProps: "transform",
    scrollTrigger: { trigger: ".clips", start: "top 88%", once: true },
  });
  gsap.from(".spaces li", { x: -60, autoAlpha: 0, stagger: 0.12, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".spaces", start: "top 85%", once: true } });
  gsap.from(".pillar", { y: 80, rotationX: -18, transformPerspective: 900, transformOrigin: "50% 100%", autoAlpha: 0, stagger: 0.12, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: ".pillars", start: "top 85%", once: true } });
  gsap.from(".marquee", { autoAlpha: 0, y: 30, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".marquee", start: "top 90%", once: true } });
  gsap.from(".compare-handle span", { scale: 0, duration: 1, ease: "back.out(2)", scrollTrigger: { trigger: ".compare", start: "top 75%", once: true } });

  /* ----- Cuộn ngang có ghim ----- */
  $$(".hscroll").forEach((sec) => {
    const track = $(".hscroll-track", sec);
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const isJourney = sec.classList.contains("journey");
    if (isJourney) track.style.setProperty("--p", 0);
    gsap.to(track, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: sec,
        start: "center center",
        end: () => "+=" + dist(),
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        // Tính vị trí khối ghim trước các trigger tạo sớm hơn nhưng nằm phía dưới trang
        refreshPriority: 1,
        onUpdate: (self) => {
          if (isJourney) track.style.setProperty("--p", self.progress.toFixed(4));
        },
      },
    });
  });

  /* ----- Tờ báo gập lại ở phần kết ----- */
  // Không dùng filter ở đây: filter làm phẳng 3D nên mặt sau sẽ lộ chữ ngược
  gsap.fromTo(".fold-half--bottom", { rotationX: 0 }, {
    rotationX: 172, ease: "none",
    scrollTrigger: { trigger: ".fold-stage", start: "top 70%", end: "bottom 25%", scrub: true },
  });

  /* ----- Footer ----- */
  gsap.from(".footer-title", { yPercent: 30, autoAlpha: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".site-footer", start: "top 80%", once: true } });
}

/* Số đếm (chạy cả khi không có animation để định dạng đúng) */
$$(".count").forEach((el) => (animate ? countUp(el) : (el.textContent = fmt.format(parseInt(el.dataset.to, 10)))));

/* Làm mới vị trí sau khi font và ảnh tải xong */
document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
window.addEventListener("load", () => ScrollTrigger.refresh());
