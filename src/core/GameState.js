import { STATES } from './constants.js';

/* ============================================================
   ماشین حالت بازی
   یک منبع واحد برای حالت فعلی؛ تغییر حالت رویداد صادر می‌کند
   تا سیستم‌های دیگر (UI و ...) بدون وابستگی مستقیم واکنش دهند.
   ============================================================ */

export class GameState {
  constructor(initial = STATES.LOADING) {
    this._state = initial;
    this._prev = null;
    this._listeners = new Set();
  }

  get current() {
    return this._state;
  }

  get previous() {
    return this._prev;
  }

  is(state) {
    return this._state === state;
  }

  /**
   * ثبت شنونده تغییر حالت. تابعی برای لغو اشتراک برمی‌گرداند
   * تا از نشت حافظه جلوگیری شود.
   */
  onChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  set(next) {
    if (!STATES[next]) {
      console.warn(`[GameState] حالت ناشناخته: ${next}`);
      return;
    }
    if (next === this._state) return;
    this._prev = this._state;
    this._state = next;
    for (const fn of this._listeners) {
      fn(this._state, this._prev);
    }
  }

  dispose() {
    this._listeners.clear();
  }
}
