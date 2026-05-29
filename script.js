/* =========================================================
   Para Helô — script.js OTIMIZADO
   Mantém a mesma lógica original
========================================================= */

"use strict";

/* ---------------- Helpers ---------------- */

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const rand = (a, b) => Math.random() * (b - a) + a;

const MOBILE = innerWidth < 640;
const DPR = Math.min(window.devicePixelRatio || 1, MOBILE ? 1.2 : 1.5);

/* ---------------- Scene routing ---------------- */

const scenes = [
  "intro",
  "hero",
  "game1",
  "game2",
  "game3",
  "game4",
  "transition",
  "letter"
];

let current = "intro";

function goTo(id, delay = 0) {

  if (id === current) return;

  const from = $("#" + current);
  const to = $("#" + id);

  from.classList.add("leaving");

  setTimeout(() => {

    from.classList.remove("active", "leaving");
    to.classList.add("active");

    current = id;

    window.scrollTo(0, 0);

    onSceneEnter(id);

  }, MOBILE ? 350 : 700 + delay);
}

document.addEventListener("click", (e) => {

  const t = e.target.closest("[data-go]");

  if (t) {
    goTo(t.dataset.go);
  }

});

/* =========================================================
   AUDIO
========================================================= */

const Audio = (() => {

  let ctx;
  let master;
  let ambGain;
  let audioSource;

  let playing = false;
  let started = false;

  const musica = new window.Audio(
    "mp3/YTDown_YouTube_This-I-Love_Media_aOkiG53ituQ_008_128k.mp3"
  );

  musica.loop = true;
  musica.preload = "auto";

  function init() {

    if (ctx) return;

    ctx = new (window.AudioContext || window.webkitAudioContext)();

    master = ctx.createGain();
    master.gain.value = MOBILE ? 0.35 : 0.45;
    master.connect(ctx.destination);

    ambGain = ctx.createGain();
    ambGain.gain.value = 0;
    ambGain.connect(master);

    audioSource = ctx.createMediaElementSource(musica);
    audioSource.connect(ambGain);
  }

  function startAmbient() {

    init();

    if (started) return;

    started = true;

    musica.play().catch(() => {});

    ambGain.gain.cancelScheduledValues(ctx.currentTime);

    ambGain.gain.linearRampToValueAtTime(
      0.8,
      ctx.currentTime + 1.8
    );

    playing = true;
  }

  function toggle() {

    init();

    if (!started) {
      startAmbient();
      return true;
    }

    playing = !playing;

    ambGain.gain.cancelScheduledValues(ctx.currentTime);

    if (playing) {

      musica.play();

      ambGain.gain.linearRampToValueAtTime(
        0.8,
        ctx.currentTime + 0.4
      );

    } else {

      ambGain.gain.linearRampToValueAtTime(
        0,
        ctx.currentTime + 0.4
      );

      setTimeout(() => {

        if (!playing) musica.pause();

      }, 400);

    }

    return playing;
  }

  function blip(freq = 880, dur = 0.18, type = "sine", vol = 0.15) {

    if (MOBILE && Math.random() < 0.45) return;

    init();

    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = type;
    o.frequency.value = freq;

    g.gain.value = 0;

    o.connect(g).connect(master);

    const t = ctx.currentTime;

    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function chime() {

    blip(880, 0.4, "triangle", 0.18);

    setTimeout(() => {
      blip(1320, 0.5, "sine", 0.15);
    }, 120);

    setTimeout(() => {
      blip(1760, 0.6, "sine", 0.12);
    }, 260);
  }

  return {
    startAmbient,
    toggle,
    blip,
    chime,
    isPlaying: () => playing
  };

})();

const musicBtn = $("#music-toggle");

if (musicBtn) {

  musicBtn.addEventListener("click", () => {

    const playing = Audio.toggle();

    musicBtn.classList.toggle("muted", !playing);

  });

}

function firstInteractionAudio() {

  Audio.startAmbient();

  window.removeEventListener("pointerdown", firstInteractionAudio);
  window.removeEventListener("keydown", firstInteractionAudio);
}

window.addEventListener("pointerdown", firstInteractionAudio);
window.addEventListener("keydown", firstInteractionAudio);

/* =========================================================
   PARTICLES
========================================================= */

(() => {

  if (MOBILE) return;

  const cvs = $("#particles-bg");

  if (!cvs) return;

  const ctx = cvs.getContext("2d");

  let w;
  let h;

  let parts = [];

  function resize() {

    w = cvs.width = innerWidth * DPR;
    h = cvs.height = innerHeight * DPR;

    cvs.style.width = innerWidth + "px";
    cvs.style.height = innerHeight + "px";

    const count = 40;

    parts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: rand(0.5, 1.4) * DPR,
      vx: rand(-0.08, 0.08),
      vy: rand(-0.12, -0.03),
      a: rand(0.2, 0.8),
      tw: rand(0.003, 0.008)
    }));

  }

  function loop() {

    if (document.hidden) {
      requestAnimationFrame(loop);
      return;
    }

    ctx.clearRect(0, 0, w, h);

    for (const p of parts) {

      p.x += p.vx;
      p.y += p.vy;

      if (p.y < -10) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }

      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      p.a += p.tw;

      const alpha = 0.2 + Math.abs(Math.sin(p.a)) * 0.4;

      ctx.fillStyle = `rgba(180,255,220,${alpha})`;

      ctx.beginPath();

      ctx.arc(p.x, p.y, p.r * 2.4, 0, Math.PI * 2);

      ctx.fill();
    }

    requestAnimationFrame(loop);
  }

  addEventListener("resize", resize);

  resize();

  loop();

})();

/* =========================================================
   BURST FX
========================================================= */

function burst(x, y, n = 40, color = "#6ef7b7") {

  if (MOBILE) {
    n = Math.min(n, 12);
  }

  for (let i = 0; i < n; i++) {

    const el = document.createElement("div");

    el.className = "burst";

    el.style.left = x + "px";
    el.style.top = y + "px";

    el.style.background = color;

    document.body.appendChild(el);

    const ang = Math.random() * Math.PI * 2;

    const dist = rand(
      MOBILE ? 40 : 60,
      MOBILE ? 120 : 220
    );

    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist;

    el.animate(
      [
        {
          transform: "translate(-50%,-50%) scale(1)",
          opacity: 1
        },
        {
          transform: `translate(${dx}px, ${dy}px) scale(0)`,
          opacity: 0
        }
      ],
      {
        duration: MOBILE ? 500 : 900,
        easing: "ease-out"
      }
    ).onfinish = () => el.remove();

  }

}

/* =========================================================
   OVERLAY
========================================================= */

const overlay = $("#overlay");
const overlayTitle = $("#overlay-title");
const overlayText = $("#overlay-text");
const overlayNext = $("#overlay-next");

let overlayCb = null;

function showOverlay(title, text, cb) {

  overlayTitle.textContent = title;
  overlayText.textContent = text;

  overlayCb = cb;

  overlay.classList.add("active");

  Audio.chime();
}

overlayNext.addEventListener("click", () => {

  overlay.classList.remove("active");

  if (overlayCb) overlayCb();

});

/* =========================================================
   INTRO
========================================================= */

function runIntro() {

  const lines = $$("#intro .intro-line");

  lines.forEach((l, i) => {

    setTimeout(() => {

      l.classList.add("show");

    }, 250 + i * (MOBILE ? 500 : 1100));

  });

  setTimeout(() => {

    goTo("hero");

  }, MOBILE ? 2800 : 6200);

}

/* =========================================================
   SCENE INIT
========================================================= */

const inited = new Set();

function onSceneEnter(id) {

  if (id === "game1" && !inited.has(id)) {
    initMaze();
    inited.add(id);
  }

  if (id === "game2" && !inited.has(id)) {
    initMemory();
    inited.add(id);
  }

  if (id === "game3" && !inited.has(id)) {
    initPuzzle();
    inited.add(id);
  }

  if (id === "game4" && !inited.has(id)) {
    initConstellation();
    inited.add(id);
  }

  if (id === "transition") {
    runTransition();
  }

  if (id === "letter") {
    runLetter();
  }

}

/* =========================================================
   MAZE
========================================================= */

function initMaze() {

  const cvs = $("#maze");

  const ctx = cvs.getContext("2d");

  const COLS = 15;
  const ROWS = 15;

  let cell;
  let W;
  let H;

  function fit() {

    const rect = cvs.getBoundingClientRect();

    const size = Math.min(rect.width, rect.height);

    W = cvs.width = size * DPR;
    H = cvs.height = size * DPR;

    cell = W / COLS;
  }

  function genMaze() {

    const grid = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({
        n: 1,
        e: 1,
        s: 1,
        w: 1,
        v: false
      }))
    );

    const stack = [[0, 0]];

    grid[0][0].v = true;

    while (stack.length) {

      const [x, y] = stack[stack.length - 1];

      const opts = [];

      if (y > 0 && !grid[y - 1][x].v)
        opts.push(["n", 0, -1, "s"]);

      if (x < COLS - 1 && !grid[y][x + 1].v)
        opts.push(["e", 1, 0, "w"]);

      if (y < ROWS - 1 && !grid[y + 1][x].v)
        opts.push(["s", 0, 1, "n"]);

      if (x > 0 && !grid[y][x - 1].v)
        opts.push(["w", -1, 0, "e"]);

      if (!opts.length) {
        stack.pop();
        continue;
      }

      const [d, dx, dy, od] =
        opts[Math.floor(Math.random() * opts.length)];

      grid[y][x][d] = 0;
      grid[y + dy][x + dx][od] = 0;

      grid[y + dy][x + dx].v = true;

      stack.push([x + dx, y + dy]);
    }

    return grid;
  }

  const grid = genMaze();

  const player = {
    x: 0.5,
    y: 0.5,
    tx: 0.5,
    ty: 0.5
  };

  const heart = {
    x: COLS - 0.5,
    y: ROWS - 0.5
  };

  let won = false;

  function draw() {

    if (current !== "game1") {
      requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = "#05261f";

    ctx.fillRect(0, 0, W, H);

    ctx.lineWidth = Math.max(2, cell * 0.05);

    ctx.strokeStyle = "rgba(110,247,183,0.8)";

    for (let y = 0; y < ROWS; y++) {

      for (let x = 0; x < COLS; x++) {

        const c = grid[y][x];

        const px = x * cell;
        const py = y * cell;

        ctx.beginPath();

        if (c.n) {
          ctx.moveTo(px, py);
          ctx.lineTo(px + cell, py);
        }

        if (c.w) {
          ctx.moveTo(px, py);
          ctx.lineTo(px, py + cell);
        }

        if (y === ROWS - 1 && c.s) {
          ctx.moveTo(px, py + cell);
          ctx.lineTo(px + cell, py + cell);
        }

        if (x === COLS - 1 && c.e) {
          ctx.moveTo(px + cell, py);
          ctx.lineTo(px + cell, py + cell);
        }

        ctx.stroke();

      }

    }

    const hx = heart.x * cell;
    const hy = heart.y * cell;

    ctx.fillStyle = "#ff8fb8";

    ctx.beginPath();

    ctx.arc(hx, hy, cell * 0.18, 0, Math.PI * 2);

    ctx.fill();

    player.x += (player.tx - player.x) * 0.25;
    player.y += (player.ty - player.y) * 0.25;

    const ppx = player.x * cell;
    const ppy = player.y * cell;

    ctx.fillStyle = "#eaffe9";

    ctx.beginPath();

    ctx.arc(ppx, ppy, cell * 0.16, 0, Math.PI * 2);

    ctx.fill();

    requestAnimationFrame(draw);
  }

  function tryMove(dx, dy) {

    if (won) return;

    const cx = Math.round(player.tx - 0.5);
    const cy = Math.round(player.ty - 0.5);

    const c = grid[cy][cx];

    if (dx === 1 && !c.e) player.tx += 1;
    else if (dx === -1 && !c.w) player.tx -= 1;
    else if (dy === 1 && !c.s) player.ty += 1;
    else if (dy === -1 && !c.n) player.ty -= 1;
    else return;

    Audio.blip(520, 0.06, "triangle", 0.05);

    checkWin();
  }

  function checkWin() {

    if (
      Math.round(player.tx - 0.5) === COLS - 1 &&
      Math.round(player.ty - 0.5) === ROWS - 1
    ) {

      won = true;

      const rect = cvs.getBoundingClientRect();

      burst(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        40
      );

      setTimeout(() => {

        showOverlay(
          "você me encontrou 🤍",
          "essa luz no labirinto era eu.",
          () => goTo("game2")
        );

      }, 400);

    }

  }

  addEventListener("keydown", (e) => {

    if (current !== "game1") return;

    const k = e.key.toLowerCase();

    if (k === "w" || k === "arrowup") tryMove(0, -1);
    else if (k === "s" || k === "arrowdown") tryMove(0, 1);
    else if (k === "a" || k === "arrowleft") tryMove(-1, 0);
    else if (k === "d" || k === "arrowright") tryMove(1, 0);

  });

  fit();

  draw();
}

/* =========================================================
   MEMORY
========================================================= */

function initMemory() {

  const board = $("#memory-board");

  const stats = $("#mem-stats");

  const symbols = [
    "✦","✧","☾","✿","❀","♡",
    "❁","✺","❃","✶","❤","❉"
  ];

  const cards = [...symbols, ...symbols]
    .sort(() => Math.random() - 0.5);

  board.innerHTML = "";

  cards.forEach((sym) => {

    const card = document.createElement("div");

    card.className = "card";

    card.dataset.sym = sym;

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-face back"></div>
        <div class="card-face front">${sym}</div>
      </div>
    `;

    board.appendChild(card);

  });

  let flipped = [];
  let lock = false;
  let tries = 0;
  let matched = 0;

  let start = null;

  function fmt(s) {

    const m = Math.floor(s / 60);
    const r = s % 60;

    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function updateStats() {

    const elapsed = start
      ? Math.floor((Date.now() - start) / 1000)
      : 0;

    stats.textContent =
      `tentativas ${tries} · ${fmt(elapsed)}`;
  }

  const timer = setInterval(() => {

    if (current === "game2") {
      updateStats();
    }

  }, 1000);

  board.addEventListener("click", (e) => {

    const c = e.target.closest(".card");

    if (
      !c ||
      lock ||
      c.classList.contains("flipped") ||
      c.classList.contains("matched")
    ) return;

    if (!start) start = Date.now();

    c.classList.add("flipped");

    flipped.push(c);

    Audio.blip(800, 0.06, "sine", 0.05);

    if (flipped.length === 2) {

      lock = true;

      tries++;

      const [a, b] = flipped;

      if (a.dataset.sym === b.dataset.sym) {

        setTimeout(() => {

          a.classList.add("matched");
          b.classList.add("matched");

          matched++;

          flipped = [];
          lock = false;

          if (matched === symbols.length) {

            clearInterval(timer);

            showOverlay(
              "você lembra de tudo 🤍",
              "e eu também.",
              () => goTo("game3")
            );

          }

        }, 250);

      } else {

        setTimeout(() => {

          a.classList.remove("flipped");
          b.classList.remove("flipped");

          flipped = [];
          lock = false;

        }, MOBILE ? 400 : 700);

      }

    }

  });

}

/* =========================================================
   TRANSITION
========================================================= */

function runTransition() {

  const lines = $$("#transition .t-line");

  const btn = $("#transition .btn");

  lines.forEach(l => l.classList.remove("show"));

  btn.classList.remove("show");

  lines.forEach((l, i) => {

    setTimeout(() => {

      l.classList.add("show");

    }, 300 + i * (MOBILE ? 500 : 1400));

  });

  setTimeout(() => {

    btn.classList.add("show");

  }, MOBILE ? 1600 : 5200);

}

/* =========================================================
   LETTER
========================================================= */

const LETTER_TEXT = `Queria dizer que amo você, mas estava pensando numa forma diferente de fazer isso.

Então decidi fazer esses joguinhos.

Você é uma das coisas mais importantes da minha vida.

Eu amo você minha princesa 🤍`;

let letterStarted = false;

function runLetter() {

  if (letterStarted) return;

  letterStarted = true;

  const el = $("#letter-text");

  const actions = $("#letter-actions");

  el.textContent = "";

  let i = 0;

  function type() {

    if (i >= LETTER_TEXT.length) {

      el.classList.add("done");

      actions.style.opacity = "1";

      return;
    }

    el.textContent += LETTER_TEXT[i++];

    requestAnimationFrame(type);
  }

  setTimeout(type, 300);

}

$("#replay").addEventListener("click", () => {

  location.reload();

});

/* =========================================================
   BOOT
========================================================= */

runIntro();
