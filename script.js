/* =========================================================
   Para Helô — script.js
   Jornada romântica interativa
========================================================= */
"use strict";

/* ---------------- Helpers ---------------- */
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const rand = (a, b) => Math.random() * (b - a) + a;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------------- Scene routing ---------------- */
const scenes = ["intro", "hero", "game1", "game2", "game3", "game4", "transition", "letter"];
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
  }, 700 + delay);
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-go]");
  if (t) goTo(t.dataset.go);
});

/* ---------------- Audio (HTML5 Audio + WebAudio SFX) ---------------- */
const Audio = (() => {
  let ctx, master, ambGain, audioSource, playing = false, started = false;
  
  // Caminho do seu arquivo de música (mude o nome se necessário)
  const musica = new window.Audio('mp3/YTDown_YouTube_This-I-Love_Media_aOkiG53ituQ_008_128k.mp3'); 
  musica.loop = true;
  musica.crossOrigin = "anonymous";

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.45; // Controle do volume global (Música + SFX)
    master.connect(ctx.destination);
    
    ambGain = ctx.createGain();
    ambGain.gain.value = 0;
    ambGain.connect(master);

    // Conecta a tag de áudio ao WebAudio para permitir o Fade-in dinâmico
    audioSource = ctx.createMediaElementSource(musica);
    audioSource.connect(ambGain);
  }

  function startAmbient() {
    init();
    if (started) return;
    started = true;
    
    musica.play().catch(e => console.log("Aguardando interação para áudio."));
    
    // Efeito suave de Fade-In ao entrar no site
    ambGain.gain.cancelScheduledValues(ctx.currentTime);
    ambGain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 2.5);
    playing = true;
  }

  function toggle() {
    init();
    if (!started) { startAmbient(); return true; }
    
    playing = !playing;
    ambGain.gain.cancelScheduledValues(ctx.currentTime);
    
    if (playing) {
      musica.play();
      ambGain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.6);
    } else {
      // Efeito suave de Fade-Out ao pausar a música
      ambGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      setTimeout(() => { if(!playing) musica.pause(); }, 600);
    }
    return playing;
  }

  function blip(freq = 880, dur = 0.18, type = "sine", vol = 0.15) {
    init();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = 0;
    o.connect(g).connect(master);
    const t = ctx.currentTime;
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function chime() {
    blip(880, 0.4, "triangle", 0.18);
    setTimeout(() => blip(1320, 0.5, "sine", 0.15), 120);
    setTimeout(() => blip(1760, 0.6, "sine", 0.12), 260);
  }

  return { startAmbient, toggle, blip, chime, isPlaying: () => playing };
})();

const musicBtn = $("#music-toggle");
if (musicBtn) {
  musicBtn.addEventListener("click", () => {
    const playing = Audio.toggle();
    musicBtn.classList.toggle("muted", !playing);
  });
}

/* primeira interação inicia áudio */
function firstInteractionAudio() {
  Audio.startAmbient();
  window.removeEventListener("pointerdown", firstInteractionAudio);
  window.removeEventListener("keydown", firstInteractionAudio);
}
window.addEventListener("pointerdown", firstInteractionAudio);
window.addEventListener("keydown", firstInteractionAudio);

/* ---------------- Particles BG ---------------- */
(() => {
  const cvs = $("#particles-bg");
  const ctx = cvs.getContext("2d");
  let w, h, parts = [];
  function resize() {
    w = cvs.width = innerWidth * devicePixelRatio;
    h = cvs.height = innerHeight * devicePixelRatio;
    cvs.style.width = innerWidth + "px";
    cvs.style.height = innerHeight + "px";
    const count = Math.min(120, Math.floor((innerWidth * innerHeight) / 14000));
    parts = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: rand(0.5, 2.2) * devicePixelRatio,
      vx: rand(-0.15, 0.15), vy: rand(-0.25, -0.05),
      a: rand(0.2, 0.8), tw: rand(0.005, 0.02)
    }));
  }
  function loop() {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
      p.a += p.tw; const alpha = 0.3 + Math.abs(Math.sin(p.a)) * 0.7;
      ctx.beginPath();
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
      g.addColorStop(0, `rgba(180,255,220,${alpha})`);
      g.addColorStop(1, "rgba(110,247,183,0)");
      ctx.fillStyle = g;
      ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  addEventListener("resize", resize);
  resize(); loop();
})();

/* ---------------- Burst FX ---------------- */
function burst(x, y, n = 40, color = "#6ef7b7") {
  for (let i = 0; i < n; i++) {
    const el = document.createElement("div");
    el.className = "burst";
    el.style.left = x + "px"; el.style.top = y + "px";
    el.style.background = color; el.style.boxShadow = `0 0 14px ${color}`;
    document.body.appendChild(el);
    const ang = Math.random() * Math.PI * 2;
    const dist = rand(60, 220);
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
    el.animate(
      [
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: 0 }
      ],
      { duration: 900 + Math.random() * 600, easing: "cubic-bezier(.2,.7,.2,1)" }
    ).onfinish = () => el.remove();
  }
}

/* ---------------- Overlay ---------------- */
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

/* ---------------- INTRO ---------------- */
function runIntro() {
  const lines = $$("#intro .intro-line");
  lines.forEach((l, i) => setTimeout(() => l.classList.add("show"), 400 + i * 1100));
  setTimeout(() => goTo("hero"), 6200);
}

/* ---------------- Scene init dispatcher ---------------- */
const inited = new Set();
function onSceneEnter(id) {
  if (id === "game1" && !inited.has(id)) { initMaze(); inited.add(id); }
  if (id === "game2" && !inited.has(id)) { initMemory(); inited.add(id); }
  if (id === "game3" && !inited.has(id)) { initPuzzle(); inited.add(id); }
  if (id === "game4" && !inited.has(id)) { initConstellation(); inited.add(id); }
  if (id === "transition") runTransition();
  if (id === "letter") runLetter();
}

/* =========================================================
   MINIGAME 1 — LABIRINTO DAS LUZES
========================================================= */
function initMaze() {
  const cvs = $("#maze");
  const ctx = cvs.getContext("2d");
  const COLS = 15, ROWS = 15;
  let cell, W, H;

  function fit() {
    const rect = cvs.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    W = cvs.width = size * devicePixelRatio;
    H = cvs.height = size * devicePixelRatio;
    cell = W / COLS;
  }

  // Gerador (DFS)
  function genMaze() {
    const grid = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ n: 1, e: 1, s: 1, w: 1, v: false }))
    );
    const stack = [[0, 0]];
    grid[0][0].v = true;
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const opts = [];
      if (y > 0 && !grid[y - 1][x].v) opts.push(["n", 0, -1, "s"]);
      if (x < COLS - 1 && !grid[y][x + 1].v) opts.push(["e", 1, 0, "w"]);
      if (y < ROWS - 1 && !grid[y + 1][x].v) opts.push(["s", 0, 1, "n"]);
      if (x > 0 && !grid[y][x - 1].v) opts.push(["w", -1, 0, "e"]);
      if (!opts.length) { stack.pop(); continue; }
      const [d, dx, dy, od] = opts[Math.floor(Math.random() * opts.length)];
      grid[y][x][d] = 0;
      grid[y + dy][x + dx][od] = 0;
      grid[y + dy][x + dx].v = true;
      stack.push([x + dx, y + dy]);
    }
    return grid;
  }

  const grid = genMaze();
  const player = { x: 0.5, y: 0.5, r: 0.28, tx: 0.5, ty: 0.5 };
  const heart = { x: COLS - 0.5, y: ROWS - 0.5 };
  let won = false;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // fundo
    const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 1.2);
    bg.addColorStop(0, "#06352a"); bg.addColorStop(1, "#021510");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // paredes neon
    ctx.lineWidth = Math.max(2, cell * 0.08);
    ctx.strokeStyle = "rgba(110,247,183,0.85)";
    ctx.shadowColor = "#6ef7b7"; ctx.shadowBlur = 16;
    ctx.lineCap = "round";
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = grid[y][x];
        const px = x * cell, py = y * cell;
        ctx.beginPath();
        if (c.n) { ctx.moveTo(px, py); ctx.lineTo(px + cell, py); }
        if (c.w) { ctx.moveTo(px, py); ctx.lineTo(px, py + cell); }
        if (y === ROWS - 1 && c.s) { ctx.moveTo(px, py + cell); ctx.lineTo(px + cell, py + cell); }
        if (x === COLS - 1 && c.e) { ctx.moveTo(px + cell, py); ctx.lineTo(px + cell, py + cell); }
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;

    // coração
    const hx = heart.x * cell, hy = heart.y * cell;
    const pulse = 0.8 + Math.sin(performance.now() / 300) * 0.15;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.scale(cell * 0.018 * pulse, cell * 0.018 * pulse);
    ctx.fillStyle = "#ff8fb8";
    ctx.shadowColor = "#ff8fb8"; ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(0, -3, -10, -3, -10, 4);
    ctx.bezierCurveTo(-10, 12, 0, 18, 0, 22);
    ctx.bezierCurveTo(0, 18, 10, 12, 10, 4);
    ctx.bezierCurveTo(10, -3, 0, -3, 0, 6);
    ctx.fill();
    ctx.restore();

    // player (luz)
    player.x += (player.tx - player.x) * 0.22;
    player.y += (player.ty - player.y) * 0.22;
    const ppx = player.x * cell, ppy = player.y * cell;
    const pr = cell * player.r;
    const grd = ctx.createRadialGradient(ppx, ppy, 0, ppx, ppy, pr * 5);
    grd.addColorStop(0, "rgba(180,255,220,1)");
    grd.addColorStop(0.4, "rgba(110,247,183,0.6)");
    grd.addColorStop(1, "rgba(110,247,183,0)");
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(ppx, ppy, pr * 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#eaffe9";
    ctx.beginPath(); ctx.arc(ppx, ppy, pr * 0.7, 0, Math.PI * 2); ctx.fill();

    requestAnimationFrame(draw);
  }

  function tryMove(dx, dy) {
    if (won) return;
    const cx = Math.round(player.tx - 0.5), cy = Math.round(player.ty - 0.5);
    if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return;
    const c = grid[cy][cx];
    if (dx === 1 && !c.e) player.tx += 1;
    else if (dx === -1 && !c.w) player.tx -= 1;
    else if (dy === 1 && !c.s) player.ty += 1;
    else if (dy === -1 && !c.n) player.ty -= 1;
    else { Audio.blip(180, 0.08, "square", 0.05); return; }
    Audio.blip(520 + Math.random() * 200, 0.08, "triangle", 0.07);
    checkWin();
  }

  function checkWin() {
    if (Math.round(player.tx - 0.5) === COLS - 1 && Math.round(player.ty - 0.5) === ROWS - 1) {
      won = true;
      const rect = cvs.getBoundingClientRect();
      burst(rect.right - 40, rect.bottom - 40, 80, "#ff8fb8");
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 60, "#6ef7b7");
      setTimeout(() => showOverlay(
        "você me encontrou 🤍",
        "essa luz no labirinto era eu, procurando você há um tempo.",
        () => goTo("game2")
      ), 700);
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
  $$("#touchpad button").forEach(b => {
    b.addEventListener("click", () => {
      const d = b.dataset.dir;
      tryMove(d === "left" ? -1 : d === "right" ? 1 : 0, d === "up" ? -1 : d === "down" ? 1 : 0);
    });
  });

  // swipe
  let sx = 0, sy = 0;
  cvs.addEventListener("touchstart", (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
  cvs.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0]; const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) tryMove(dx > 0 ? 1 : -1, 0);
    else tryMove(0, dy > 0 ? 1 : -1);
  });

  addEventListener("resize", fit);
  fit(); draw();
}

/* =========================================================
   MINIGAME 2 — MEMÓRIA
========================================================= */
function initMemory() {
  const board = $("#memory-board");
  const stats = $("#mem-stats");
  const symbols = ["✦", "✧", "☾", "✿", "❀", "♡", "❁", "✺", "❃", "✶", "❤", "❉"];
  const cards = [...symbols, ...symbols]
    .sort(() => Math.random() - 0.5);

  board.innerHTML = "";
  cards.forEach((sym, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.sym = sym;
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-face back"></div>
        <div class="card-face front">${sym}</div>
      </div>`;
    board.appendChild(card);
  });

  let flipped = [], lock = false, tries = 0, matched = 0;
  let start = null;

  function fmt(s) { const m = Math.floor(s / 60), r = s % 60; return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`; }
  function updateStats() {
    const elapsed = start ? Math.floor((Date.now() - start) / 1000) : 0;
    stats.textContent = `tentativas ${tries} · ${fmt(elapsed)}`;
  }
  setInterval(() => { if (current === "game2") updateStats(); }, 500);

  board.addEventListener("click", (e) => {
    const c = e.target.closest(".card");
    if (!c || lock || c.classList.contains("flipped") || c.classList.contains("matched")) return;
    if (!start) start = Date.now();
    c.classList.add("flipped");
    Audio.blip(700 + Math.random() * 200, 0.1, "sine", 0.1);
    flipped.push(c);
    if (flipped.length === 2) {
      lock = true; tries++;
      const [a, b] = flipped;
      if (a.dataset.sym === b.dataset.sym) {
        setTimeout(() => {
          a.classList.add("matched"); b.classList.add("matched");
          Audio.blip(1100, 0.2, "triangle", 0.14);
          matched++; flipped = []; lock = false;
          if (matched === symbols.length) onWin();
        }, 350);
      } else {
        setTimeout(() => {
          a.classList.remove("flipped"); b.classList.remove("flipped");
          flipped = []; lock = false;
        }, 800);
      }
    }
  });

  function onWin() {
    const rect = board.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      setTimeout(() => burst(rect.left + rand(0, rect.width), rect.top + rand(0, rect.height), 40), i * 150);
    }
    setTimeout(() => showOverlay(
      "você lembra de tudo 🤍",
      "talvez por isso seja tão fácil guardar você em mim.",
      () => goTo("game3")
    ), 1100);
  }
}

/* =========================================================
   MINIGAME 3 — PUZZLE DE FRASES
========================================================= */
function initPuzzle() {
  const phrases = [
    "eu amo você minha princesa",
    "você é o que tenho de mais importante"
  ];
  const dropLine = $("#drop-line");
  const wordBank = $("#word-bank");
  const counter = $("#phrase-counter");
  const reset = $("#puzzle-reset");
  let idx = 0;

  function load(i) {
    counter.textContent = `frase ${i + 1} de ${phrases.length}`;
    const words = phrases[i].split(" ");
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    dropLine.innerHTML = "";
    wordBank.innerHTML = "";
    dropLine.classList.remove("correct");
    shuffled.forEach(w => {
      const el = document.createElement("div");
      el.className = "word";
      el.textContent = w;
      el.draggable = true;
      attachDrag(el);
      wordBank.appendChild(el);
    });
  }

  function attachDrag(el) {
    el.addEventListener("dragstart", (e) => {
      el.classList.add("dragging");
      e.dataTransfer.setData("text/plain", "x");
    });
    el.addEventListener("dragend", () => el.classList.remove("dragging"));

    // Touch fallback
    let drag = null, offX = 0, offY = 0, clone = null;
    el.addEventListener("touchstart", (e) => {
      const t = e.touches[0]; drag = el;
      const r = el.getBoundingClientRect();
      offX = t.clientX - r.left; offY = t.clientY - r.top;
      clone = el.cloneNode(true);
      clone.style.position = "fixed";
      clone.style.left = r.left + "px"; clone.style.top = r.top + "px";
      clone.style.zIndex = 999; clone.style.pointerEvents = "none";
      clone.style.width = r.width + "px";
      document.body.appendChild(clone);
      el.style.opacity = "0.3";
    }, { passive: true });
    el.addEventListener("touchmove", (e) => {
      if (!clone) return;
      const t = e.touches[0];
      clone.style.left = (t.clientX - offX) + "px";
      clone.style.top = (t.clientY - offY) + "px";
      e.preventDefault();
    }, { passive: false });
    el.addEventListener("touchend", (e) => {
      if (!clone) return;
      const t = e.changedTouches[0];
      const r = dropLine.getBoundingClientRect();
      if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
        placeWord(el);
      }
      clone.remove(); clone = null; el.style.opacity = "1"; drag = null;
    });
  }

  dropLine.addEventListener("dragover", (e) => { e.preventDefault(); dropLine.classList.add("over"); });
  dropLine.addEventListener("dragleave", () => dropLine.classList.remove("over"));
  dropLine.addEventListener("drop", (e) => {
    e.preventDefault();
    dropLine.classList.remove("over");
    const el = $(".word.dragging");
    if (el) placeWord(el);
  });

  function placeWord(el) {
    el.classList.add("placed");
    el.draggable = false;
    dropLine.appendChild(el);
    Audio.blip(900, 0.1, "sine", 0.1);
    checkPhrase();
  }

  function checkPhrase() {
    const placed = $$(".word", dropLine).map(w => w.textContent).join(" ");
    if (placed === phrases[idx]) {
      dropLine.classList.add("correct");
      Audio.chime();
      const r = dropLine.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 50);
      setTimeout(() => {
        idx++;
        if (idx < phrases.length) {
          load(idx);
        } else {
          showOverlay(
            "exatamente isso 🤍",
            "essas frases foram montadas pensando em você.",
            () => goTo("game4")
          );
        }
      }, 1400);
    }
  }

  reset.addEventListener("click", () => load(idx));
  load(0);
}

/* =========================================================
   MINIGAME 4 — CONSTELAÇÕES
========================================================= */
function initConstellation() {
  const cvs = $("#constellation");
  const ctx = cvs.getContext("2d");
  const progress = $("#const-progress");
  let W, H;

  function fit() {
    const r = cvs.getBoundingClientRect();
    W = cvs.width = r.width * devicePixelRatio;
    H = cvs.height = r.height * devicePixelRatio;
  }

  const constellations = [
    // Coração (8 pontos)
    [[.30,.45],[.22,.32],[.30,.22],[.42,.20],[.50,.32],[.58,.20],[.70,.22],[.78,.32],[.70,.45],[.50,.70]],
    // Estrela (5 pontos)
    [[.50,.20],[.62,.45],[.85,.45],[.66,.60],[.74,.82],[.50,.68],[.26,.82],[.34,.60],[.15,.45],[.38,.45]],
    // Infinito (loop)
    [[.25,.5],[.32,.38],[.45,.38],[.55,.5],[.65,.62],[.75,.62],[.82,.5],[.75,.38],[.65,.38],[.55,.5],[.45,.62],[.32,.62]]
  ];

  let cIdx = 0, points = [], hit = [], stars = [];

  function loadConst(i) {
    progress.textContent = `constelação ${i + 1} de ${constellations.length}`;
    points = constellations[i].map(([x, y]) => ({ x: x * W, y: y * H }));
    hit = [];
    // fundo de estrelas decorativas
    stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: rand(0.4, 1.6) * devicePixelRatio, a: Math.random()
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W);
    bg.addColorStop(0, "#031e18"); bg.addColorStop(1, "#01100c");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // estrelas de fundo
    for (const s of stars) {
      s.a += 0.02;
      const al = 0.3 + Math.abs(Math.sin(s.a)) * 0.7;
      ctx.fillStyle = `rgba(200,255,230,${al * 0.6})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }

    // linhas conectadas
    ctx.strokeStyle = "rgba(110,247,183,0.85)";
    ctx.lineWidth = 2 * devicePixelRatio;
    ctx.shadowColor = "#6ef7b7"; ctx.shadowBlur = 14;
    for (let i = 1; i < hit.length; i++) {
      const a = points[hit[i - 1]], b = points[hit[i]];
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // pontos
    points.forEach((p, i) => {
      const done = hit.includes(i);
      const next = hit.length === i;
      const r = (next ? 10 : 7) * devicePixelRatio;
      const pulse = next ? 1 + Math.sin(performance.now() / 250) * 0.3 : 1;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4 * pulse);
      g.addColorStop(0, done ? "#fff" : next ? "#b6ffe0" : "#9fd9c4");
      g.addColorStop(0.4, done ? "rgba(255,255,255,.5)" : "rgba(110,247,183,.5)");
      g.addColorStop(1, "rgba(110,247,183,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 4 * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = done ? "#fff" : "#eaffe9";
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2); ctx.fill();
      if (!done) {
        ctx.fillStyle = "#03251c";
        ctx.font = `${10 * devicePixelRatio}px Inter`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), p.x, p.y);
      }
    });

    requestAnimationFrame(draw);
  }

  cvs.addEventListener("pointerdown", (e) => {
    const rect = cvs.getBoundingClientRect();
    const x = (e.clientX - rect.left) * devicePixelRatio;
    const y = (e.clientY - rect.top) * devicePixelRatio;
    const next = hit.length;
    if (next >= points.length) return;
    const p = points[next];
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < 40 * devicePixelRatio) {
      hit.push(next);
      Audio.blip(660 + next * 60, 0.12, "sine", 0.12);
      if (hit.length === points.length) {
        burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 80);
        Audio.chime();
        setTimeout(() => {
          cIdx++;
          if (cIdx < constellations.length) loadConst(cIdx);
          else showOverlay(
            "você desenhou o céu 🤍",
            "agora tem uma carta esperando por você.",
            () => goTo("transition")
          );
        }, 1000);
      }
    } else {
      Audio.blip(180, 0.06, "square", 0.04);
    }
  });

  addEventListener("resize", () => { fit(); loadConst(cIdx); });
  fit(); loadConst(0); draw();
}

/* =========================================================
   TRANSIÇÃO
========================================================= */
function runTransition() {
  const lines = $$("#transition .t-line");
  const btn = $("#transition .btn");
  lines.forEach(l => l.classList.remove("show"));
  btn.classList.remove("show");
  lines.forEach((l, i) => setTimeout(() => l.classList.add("show"), 600 + i * 1400));
  setTimeout(() => btn.classList.add("show"), 600 + lines.length * 1400 + 200);
}

/* =========================================================
   CARTA FINAL — efeito de digitação
========================================================= */
const LETTER_TEXT = `Queria dizer que amo você, mas estava pensando numa forma diferente de fazer isso, então decidi fazer esses joguinhos.

Bom, queria dizer o quão importante você é pra minha vida, a luz que você é e sempre será pra mim.

Helô, você é aquilo de melhor que já me aconteceu, você é tudo que eu sempre desejei, você é a garota que ilumina todos os meus dias e eu te amo muito.

Amo seu jeito de ser, seu jeito de falar, sua voz, seus olhos, sua personalidade, eu amo a pessoa por completo que você é.

Eu te amo minha princesa 🤍`;

let letterStarted = false;
function runLetter() {
  if (letterStarted) return;
  letterStarted = true;
  const el = $("#letter-text");
  const actions = $("#letter-actions");
  el.textContent = "";
  el.classList.remove("done");
  let i = 0;
  const baseDelay = 38;
  function type() {
    if (i >= LETTER_TEXT.length) {
      el.classList.add("done");
      actions.style.opacity = "1";
      return;
    }
    const ch = LETTER_TEXT[i++];
    el.textContent += ch;
    if (ch !== " " && ch !== "\n" && Math.random() < 0.35) Audio.blip(1100 + Math.random() * 300, 0.03, "sine", 0.04);
    let d = baseDelay + Math.random() * 30;
    if (ch === "." || ch === "," ) d += 280;
    if (ch === "\n") d += 350;
    setTimeout(type, d);
  }
  setTimeout(type, 600);
}

$("#replay").addEventListener("click", () => location.reload());

/* ---------------- Boot ---------------- */
runIntro();
