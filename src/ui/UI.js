import { STATES } from '../core/constants.js';

/* ============================================================
   مدیریت رابط کاربری (DOM)
   - صفحه بارگذاری
   - منوی اصلی + معرفی کنترل‌ها (فارسی، RTL)
   - نشانگر مرکز و پیام راهنمای HUD
   UI مستقل از منطق سه‌بعدی است و از طریق callback با بازی حرف می‌زند.
   ============================================================ */

export class UI {
  constructor(root) {
    this.root = root;
    this.onStart = null; // callback شروع بازی
    this._build();
  }

  _build() {
    this.root.innerHTML = `
      <div class="loader" id="loader">
        <div class="spinner"></div>
        <div class="label">در حال بارگذاری پرونده…</div>
      </div>

      <div class="crosshair hidden" id="crosshair"></div>

      <div class="overlay" id="menu">
        <div class="panel">
          <div class="title">کارآگاه لوکی</div>
          <div class="subtitle">پرونده: اتاق خاموش</div>

          <p style="color:var(--c-text-dim); line-height:2; font-size:0.98rem;">
            نیمه‌شب است و باران می‌بارد. زنی به نام «النا وودز» در اتاق کارش
            جان باخته و صحنه در نگاه اول شبیه خودکشی است. وارد اتاق شوید،
            با دقت همه‌چیز را بررسی کنید و حقیقت را پیدا کنید.
          </p>

          <div class="rule"></div>

          <ul class="controls-list">
            <li><span>حرکت</span> <span class="key">W A S D</span></li>
            <li><span>نگاه کردن</span> <span class="key">ماوس</span></li>
            <li><span>بررسی</span> <span class="key">E</span></li>
            <li><span>حالت کارآگاه</span> <span class="key">Space</span></li>
            <li><span>منو</span> <span class="key">Esc</span></li>
            <li><span>شروع</span> <span class="key">کلیک</span></li>
          </ul>

          <button class="btn" id="start-btn">ورود به صحنه جرم</button>
          <p class="hint">برای چرخاندن دوربین، پس از شروع روی صفحه کلیک کنید.</p>
        </div>
      </div>

      <div class="overlay hidden" id="pause">
        <div class="panel">
          <div class="title" style="font-size:1.8rem;">توقف</div>
          <div class="subtitle">بازی متوقف شده است.</div>
          <div class="rule"></div>
          <button class="btn" id="resume-btn">ادامه بررسی</button>
        </div>
      </div>
    `;

    this.loader = this.root.querySelector('#loader');
    this.crosshair = this.root.querySelector('#crosshair');
    this.menu = this.root.querySelector('#menu');
    this.pause = this.root.querySelector('#pause');

    this.root.querySelector('#start-btn').addEventListener('click', () => {
      this.onStart?.();
    });
    this.root.querySelector('#resume-btn').addEventListener('click', () => {
      this.onStart?.();
    });
  }

  hideLoader() {
    this.loader.classList.add('done');
    setTimeout(() => {
      this.loader.style.display = 'none';
    }, 650);
  }

  showMenu() {
    this.menu.classList.remove('hidden');
    this.pause.classList.add('hidden');
    this.crosshair.classList.add('hidden');
  }

  showPause() {
    this.pause.classList.remove('hidden');
    this.crosshair.classList.add('hidden');
  }

  enterInvestigation() {
    this.menu.classList.add('hidden');
    this.pause.classList.add('hidden');
    this.crosshair.classList.remove('hidden');
  }

  /** واکنش به تغییر حالت بازی */
  syncState(state) {
    if (state === STATES.MENU) this.showMenu();
    else if (state === STATES.INVESTIGATION) this.enterInvestigation();
  }
}
