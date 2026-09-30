import * as THREE from 'three';

/* ============================================================
   کارخانه بافت رویه‌ای (Procedural) — همه بافت‌ها با Canvas ساخته می‌شوند
   بدون هیچ فایل خارجی و بدون بارگذاری شبکه؛ سبک و قابل کش.
   هدف: حال‌وهوای دفتر کارآگاهی گرم و چوبی مطابق تصویر مرجع.
   ============================================================ */

const _cache = new Map();

function makeCanvas(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function toTexture(canvas, { repeat = [1, 1], srgb = true, aniso = 4 } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = aniso;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function rnd(a, b) {
  return a + Math.random() * (b - a);
}

/* ---- پنل چوبی دیوار (لمبه، رگه‌های عمودی و قاب برجسته) ---- */
function woodPanelCanvas() {
  const s = 512;
  const c = makeCanvas(s);
  const ctx = c.getContext('2d');
  // زمینه چوب
  const grd = ctx.createLinearGradient(0, 0, s, 0);
  grd.addColorStop(0, '#3a2717');
  grd.addColorStop(0.5, '#4a3320');
  grd.addColorStop(1, '#33220f');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, s, s);
  // رگه‌های چوب
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 90; i++) {
    ctx.strokeStyle = Math.random() > 0.5 ? '#2a1a0d' : '#5a3f26';
    ctx.lineWidth = rnd(0.5, 2);
    ctx.beginPath();
    const x = rnd(0, s);
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + rnd(-8, 8), s / 3, x + rnd(-8, 8), (2 * s) / 3, x + rnd(-6, 6), s);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // قاب‌بندی پنل‌ها (دو پنل عمودی با لبه برجسته)
  ctx.strokeStyle = 'rgba(20,12,5,0.9)';
  ctx.lineWidth = 6;
  const drawPanel = (x, y, w, h) => {
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(90,65,40,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
    ctx.strokeStyle = 'rgba(20,12,5,0.9)';
    ctx.lineWidth = 6;
  };
  drawPanel(24, 40, s / 2 - 48, s - 80);
  drawPanel(s / 2 + 24, 40, s / 2 - 48, s - 80);
  return c;
}

/* ---- کف پارکت جناغی (herringbone) ---- */
function parquetCanvas() {
  const s = 512;
  const c = makeCanvas(s);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2a1c0f';
  ctx.fillRect(0, 0, s, s);
  const pw = 34;   // عرض تخته
  const pl = 96;   // طول تخته
  const tones = ['#4a3115', '#3d2810', '#553a1c', '#412c13'];
  ctx.save();
  for (let y = -pl; y < s + pl; y += pw) {
    for (let x = -pl; x < s + pl; x += pl) {
      const flip = ((x / pl + y / pw) | 0) % 2 === 0;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((flip ? 1 : -1) * Math.PI / 4);
      ctx.fillStyle = tones[(Math.random() * tones.length) | 0];
      ctx.fillRect(0, 0, pl, pw - 3);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, pl, pw - 3);
      // رگه
      ctx.strokeStyle = 'rgba(255,220,170,0.05)';
      ctx.beginPath();
      ctx.moveTo(4, pw / 2);
      ctx.lineTo(pl - 4, pw / 2);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
  return c;
}

/* ---- سقف کاست‌دار (coffered) ---- */
function cofferCanvas() {
  const s = 256;
  const c = makeCanvas(s);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2a2016';
  ctx.fillRect(0, 0, s, s);
  // فرورفتگی مرکزی
  const inset = 26;
  const g = ctx.createLinearGradient(0, 0, s, s);
  g.addColorStop(0, '#1c140c');
  g.addColorStop(1, '#332619');
  ctx.fillStyle = g;
  ctx.fillRect(inset, inset, s - inset * 2, s - inset * 2);
  // تیرهای برجسته
  ctx.strokeStyle = '#4a3722';
  ctx.lineWidth = 10;
  ctx.strokeRect(inset / 2, inset / 2, s - inset, s - inset);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 3;
  ctx.strokeRect(inset, inset, s - inset * 2, s - inset * 2);
  return c;
}

/* ---- تخته چوب‌پنبه‌ای شواهد (cork) ---- */
function corkCanvas() {
  const s = 256;
  const c = makeCanvas(s);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b98b4e';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 5000; i++) {
    const t = Math.random();
    ctx.fillStyle = t > 0.6 ? 'rgba(120,80,40,0.4)' : t > 0.3 ? 'rgba(210,170,110,0.4)' : 'rgba(90,60,30,0.3)';
    const x = Math.random() * s;
    const y = Math.random() * s;
    ctx.fillRect(x, y, rnd(1, 3), rnd(1, 3));
  }
  return c;
}

/* ---- نقشه قدیمی داخل قاب (سبک نقشه آمریکا/جهان) ---- */
function mapCanvas() {
  const w = 512, h = 384;
  const c = makeCanvas(2);
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e8dcc0';
  ctx.fillRect(0, 0, w, h);
  // لکه‌های کهنگی
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(150,120,70,${rnd(0.02, 0.08)})`;
    ctx.beginPath();
    ctx.arc(rnd(0, w), rnd(0, h), rnd(10, 60), 0, Math.PI * 2);
    ctx.fill();
  }
  // شبکه خطوط طول/عرض
  ctx.strokeStyle = 'rgba(90,70,40,0.25)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  // خشکی‌ها (اشکال محو رنگی)
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = ['#cbb98a', '#c2b184', '#d0c096', '#b8a67c'][i % 4];
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    let x = rnd(60, w - 60), y = rnd(60, h - 60);
    ctx.moveTo(x, y);
    for (let k = 0; k < 6; k++) ctx.lineTo(x + rnd(-60, 60), y + rnd(-60, 60));
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // خطوط مرزی قرمز کمرنگ
  ctx.strokeStyle = 'rgba(150,60,50,0.35)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.moveTo(rnd(0, w), rnd(0, h));
    for (let k = 0; k < 4; k++) ctx.lineTo(rnd(0, w), rnd(0, h));
    ctx.stroke();
  }
  return c;
}

/* ---- عکس سیاه‌وسفید قدیمی (برای قاب‌های دیوار) ---- */
function photoCanvas(seed = 0) {
  const w = 200, h = 260;
  const c = makeCanvas(2);
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const base = 60 + ((seed * 37) % 40);
  ctx.fillStyle = `rgb(${base},${base - 5},${base - 12})`;
  ctx.fillRect(0, 0, w, h);
  // ساختمان‌های شهری محو
  for (let i = 0; i < 14; i++) {
    const bw = rnd(14, 40);
    const bh = rnd(40, 180);
    const g = 40 + Math.random() * 90;
    ctx.fillStyle = `rgba(${g},${g},${g},0.85)`;
    ctx.fillRect(rnd(0, w - bw), h - bh, bw, bh);
  }
  // نویز فیلم
  for (let i = 0; i < 2500; i++) {
    const v = Math.random() * 255;
    ctx.fillStyle = `rgba(${v},${v},${v},0.05)`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
  return c;
}

/* ---- مقوای جعبه (کارتن) ---- */
function cardboardCanvas() {
  const s = 128;
  const c = makeCanvas(s);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b79463';
  ctx.fillRect(0, 0, s, s);
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#8a6c40' : '#d0af7c';
    ctx.fillRect(Math.random() * s, Math.random() * s, rnd(1, 4), 1);
  }
  ctx.globalAlpha = 1;
  // نوار چسب
  ctx.fillStyle = 'rgba(150,130,90,0.5)';
  ctx.fillRect(0, s / 2 - 8, s, 16);
  return c;
}

/* ---- فرش ایرانی (طرح انتزاعی گرم) ---- */
function rugCanvas() {
  const s = 256;
  const c = makeCanvas(s);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5a2320';
  ctx.fillRect(0, 0, s, s);
  // حاشیه
  ctx.strokeStyle = '#8a5a2a';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, s - 20, s - 20);
  ctx.strokeStyle = '#c99a4a';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, s - 48, s - 48);
  // مدالیون مرکزی
  ctx.save();
  ctx.translate(s / 2, s / 2);
  for (let r = 0; r < 4; r++) {
    ctx.rotate(Math.PI / 8);
    ctx.fillStyle = ['#c99a4a', '#7a3530', '#3a5a4a', '#b5793a'][r % 4];
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const rad = 40 - r * 8;
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // نقش‌های گوشه
  ctx.fillStyle = 'rgba(200,150,70,0.5)';
  for (const [cx, cy] of [[50, 50], [s - 50, 50], [50, s - 50], [s - 50, s - 50]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

/* ---- برگه کاغذ با خطوط متن (برای تخته و روی زمین) ---- */
function paperCanvas(lines = 6) {
  const w = 128, h = 160;
  const c = makeCanvas(2);
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#efe7d2';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(150,120,70,0.06)';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(60,50,40,0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < lines; i++) {
    const y = 22 + i * ((h - 34) / lines);
    ctx.beginPath();
    ctx.moveTo(12, y);
    ctx.lineTo(w - 12 - Math.random() * 30, y);
    ctx.stroke();
  }
  return c;
}

/* ---- API عمومی: بافت‌ها با کش ---- */
export const Textures = {
  woodPanel: () => cached('woodPanel', () => toTexture(woodPanelCanvas(), { repeat: [2, 1] })),
  parquet: () => cached('parquet', () => toTexture(parquetCanvas(), { repeat: [3, 3] })),
  coffer: () => cached('coffer', () => toTexture(cofferCanvas(), { repeat: [4, 4] })),
  cork: () => cached('cork', () => toTexture(corkCanvas(), { repeat: [2, 1] })),
  map: () => cached('map', () => toTexture(mapCanvas())),
  worldMap: () => cached('worldMap', () => toTexture(mapCanvas())),
  photo: (i) => cached('photo' + i, () => toTexture(photoCanvas(i))),
  cardboard: () => cached('cardboard', () => toTexture(cardboardCanvas(), { repeat: [1, 1] })),
  rug: () => cached('rug', () => toTexture(rugCanvas())),
  paper: (n) => cached('paper' + n, () => toTexture(paperCanvas(n))),

  dispose() {
    for (const t of _cache.values()) t.dispose?.();
    _cache.clear();
  }
};

function cached(key, factory) {
  if (!_cache.has(key)) _cache.set(key, factory());
  return _cache.get(key);
}
