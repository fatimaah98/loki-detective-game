/* ============================================================
   کارآگاه لوکی — ثابت‌ها و پیکربندی مرکزی بازی
   همه اعداد کلیدی اینجا نگهداری می‌شوند تا تنظیم بازی آسان باشد.
   ============================================================ */

// ابعاد اتاق (واحد: متر). اتاق کوچک و قابل کنترل برای Performance بهتر.
export const ROOM = {
  width: 10,  // محور X
  depth: 9,   // محور Z
  height: 3.4 // محور Y
};

// تنظیمات بازیکن (دوربین اول‌شخص)
export const PLAYER = {
  eyeHeight: 1.62,   // ارتفاع چشم از کف
  radius: 0.34,      // شعاع برخورد افقی
  moveSpeed: 2.7,    // سرعت راه رفتن (متر بر ثانیه)
  accel: 12,         // شتاب رسیدن به سرعت هدف
  damping: 10,       // میرایی برای توقف نرم
  lookSpeed: 0.0022  // حساسیت چرخش دوربین با ماوس
};

// تنظیمات دوربین
export const CAMERA = {
  fov: 62,
  near: 0.05,
  far: 60
};

// پالت رنگ — دفتر کارآگاهی گرم و چوبی (نوآر گرم، مطابق تصویر مرجع)
export const COLORS = {
  floor: 0x3a2814,
  wallWarm: 0x43301d,
  ceiling: 0x2a2016,
  wood: 0x5a3f26,
  woodDark: 0x33220f,
  fabric: 0x2d3138,
  metal: 0x6a5a44,
  brass: 0xb8862f,
  glass: 0x9fb4c4,
  paper: 0xefe7d2,
  lampWarm: 0xffcf9a,
  streetCold: 0x8faccc,
  deskPad: 0x1f4030,
  leather: 0x5a2820,
  plant: 0x2f5230,
  skin: 0xb99a86,
  cloth: 0x1b1e24,
  rope: 0x8a7a5c
};

// حالت‌های بازی — ماشین حالت اصلی
export const STATES = Object.freeze({
  LOADING: 'LOADING',
  MENU: 'MENU',
  INTRO: 'INTRO',
  INVESTIGATION: 'INVESTIGATION',
  EVIDENCE: 'EVIDENCE',
  BOARD: 'BOARD',
  SUSPECTS: 'SUSPECTS',
  TIMELINE: 'TIMELINE',
  ACCUSATION: 'ACCUSATION',
  SOLVED: 'SOLVED',
  FAILED: 'FAILED'
});

// نگاشت کلیدها به کنش‌ها
export const KEYS = {
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  interact: ['KeyE'],
  detective: ['Space'],
  journal: ['KeyJ'],
  menu: ['Escape']
};
