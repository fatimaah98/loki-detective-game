import { KEYS } from './constants.js';

/* ============================================================
   مدیریت ورودی — صفحه‌کلید و ماوس (با قفل نشانگر)
   - کنش‌های پیوسته (حرکت) به‌صورت وضعیت نگهداری می‌شوند.
   - کنش‌های لحظه‌ای (بررسی، منو ...) به‌صورت callback رویداد.
   - همه شنونده‌ها در dispose پاک می‌شوند تا نشت حافظه رخ ندهد.
   ============================================================ */

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.actions = { forward: false, backward: false, left: false, right: false };
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.locked = false;

    this._pressListeners = new Map(); // action -> Set(fn)
    this._lockListeners = new Set();

    // اتصال با bind تا در removeEventListener همان مرجع باشد
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
  }

  _resolve(code) {
    for (const action in KEYS) {
      if (KEYS[action].includes(code)) return action;
    }
    return null;
  }

  _onKeyDown(e) {
    const action = this._resolve(e.code);
    if (!action) return;
    if (action in this.actions) {
      this.actions[action] = true;
    } else if (!e.repeat) {
      this._emitPress(action);
    }
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  }

  _onKeyUp(e) {
    const action = this._resolve(e.code);
    if (action && action in this.actions) {
      this.actions[action] = false;
    }
  }

  _onMouseMove(e) {
    if (!this.locked) return;
    this.mouseDX += e.movementX || 0;
    this.mouseDY += e.movementY || 0;
  }

  _onPointerLockChange() {
    this.locked = document.pointerLockElement === this.canvas;
    if (!this.locked) {
      // هنگام خروج از قفل، حرکت را متوقف کن تا بازیکن سُر نخورد
      for (const k in this.actions) this.actions[k] = false;
    }
    for (const fn of this._lockListeners) fn(this.locked);
  }

  /** ثبت callback برای کنش لحظه‌ای؛ تابع لغو اشتراک برمی‌گرداند */
  onPress(action, fn) {
    if (!this._pressListeners.has(action)) this._pressListeners.set(action, new Set());
    this._pressListeners.get(action).add(fn);
    return () => this._pressListeners.get(action)?.delete(fn);
  }

  onLockChange(fn) {
    this._lockListeners.add(fn);
    return () => this._lockListeners.delete(fn);
  }

  _emitPress(action) {
    const set = this._pressListeners.get(action);
    if (set) for (const fn of set) fn();
  }

  requestLock() {
    if (!this.locked) this.canvas.requestPointerLock?.();
  }

  exitLock() {
    if (this.locked) document.exitPointerLock?.();
  }

  /** دلتای ماوس را می‌خواند و صفر می‌کند (هر فریم یک‌بار) */
  consumeMouseDelta() {
    const dx = this.mouseDX;
    const dy = this.mouseDY;
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx, dy };
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    document.removeEventListener('mousemove', this._onMouseMove);
    this._pressListeners.clear();
    this._lockListeners.clear();
  }

  // در Game هنگام قفل شدن، شنونده حرکت ماوس فعال می‌شود
  enableMouseMove() {
    document.addEventListener('mousemove', this._onMouseMove);
  }
}
