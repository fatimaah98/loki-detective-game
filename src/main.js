import { Game } from './core/Game.js';

/* ============================================================
   نقطه ورود بازی «کارآگاه لوکی»
   ساخت نمونه بازی، آماده‌سازی صحنه و مدیریت پاک‌سازی هنگام بستن صفحه.
   ============================================================ */

const canvas = document.getElementById('game-canvas');
const uiRoot = document.getElementById('ui-root');

let game = null;

try {
  game = new Game(canvas, uiRoot);
  // در این مرحله همه دارایی‌ها procedural هستند و نیازی به بارگذاری فایل نیست،
  // پس بلافاصله آماده می‌شویم (تأخیر کوتاه فقط برای نمایش صفحه بارگذاری).
  requestAnimationFrame(() => {
    setTimeout(() => game.ready(), 300);
  });
} catch (err) {
  console.error('[کارآگاه لوکی] خطا در راه‌اندازی بازی:', err);
  uiRoot.innerHTML =
    '<div class="overlay"><div class="panel"><div class="title" style="font-size:1.6rem;">خطا</div>' +
    '<p style="color:var(--c-text-dim)">متأسفانه بازی اجرا نشد. مرورگر شما باید از WebGL پشتیبانی کند.</p></div></div>';
}

// پاک‌سازی منابع هنگام ترک صفحه (جلوگیری از نشت حافظه)
window.addEventListener('beforeunload', () => {
  game?.dispose();
});
