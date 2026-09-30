# کارآگاه لوکی — پیشرفت ساخت

## هدف
بازی معمایی سه‌بعدی کارآگاهی، فارسی/RTL، با Three.js + Vite + JS خالص. کوچک اما Polished و روان. پرونده: «اتاق خاموش» — قتل النا وودز که شبیه خودکشی صحنه‌سازی شده؛ قاتل واقعی دنیل رید است.

## قیدها
- بدون TypeScript / React / Vue / فریم‌ورک. Three.js مستقیم. وابستگی حداقلی.
- کل UI فارسی و RTL. Performance اولویت بالا.
- توسعه مرحله‌ای؛ بعد از هر مرحله اجرا/تست.
- **کاربر خودش دستورات npm را اجرا می‌کند** — من npm اجرا نمی‌کنم، فقط structure/code.
- VM لینوکس این نشست بالا نیامد (فضای دیسک)؛ امکان اجرای dev server از سمت من نیست.

## انجام‌شده — مرحله ۱ (Architecture + Room + Player + Crime Scene اولیه)
- scaffold: package.json (three ^0.160, vite ^5), vite.config.js (port 5188), index.html (lang=fa dir=rtl، فونت Vazirmatn از Google Fonts).
- core/constants.js: ROOM/PLAYER/CAMERA/COLORS/STATES/KEYS.
- core/GameState.js: ماشین حالت با onChange.
- core/Input.js: کیبورد + pointer lock، cleanup کامل.
- scene/Materials.js: متریال/هندسه مشترک (box, plane).
- scene/Room.js: کف/سقف/دیوار/پنجره/در/میز+چراغ+۲لیوان/کتابخانه/صندلی/ساعت (۲۱:۵۲)/فرش + colliders.
- scene/Lighting.js: ambient کم + directional سرد (تنها سایه‌انداز) + point نور پنجره + point چراغ رومیزی.
- scene/CrimeScene.js: جسد آویزان، طناب+قلاب، صندلی واژگون، دکمه لباس دنیل، برگه کاغذ.
- player/Player.js: اول‌شخص، WASD با شتاب/میرایی، نگاه ماوس، برخورد AABB per-axis.
- ui/UI.js + styles.css: loader، منو+آموزش کنترل فارسی، pause، crosshair.
- core/Game.js: orchestrator (renderer با shadow/ACES، scene با fog، loop با dt clamp، dispose کامل).
- main.js: bootstrap + error fallback + cleanup در beforeunload.
- README.md.

## تست
- روی این نشست اجرا نشده (VM/دیسک). کد از نظر ساختار و اتصال ماژول‌ها بازبینی شده.
- کاربر باید `npm install` سپس `npm run dev` بزند و کنسول را برای خطا چک کند.

## بعدی — مرحله ۲
سیستم تعامل با اشیا (raycast از مرکز دوربین)، highlight ظریف، متن «بررسی [E]»، فوکوس دوربین، شروع اتصال به Evidence.

## نکات فنی برای ادامه
- Player.getLookDirection() برای raycast آماده است.
- Room.deskInfo / CrimeScene.buttonMesh / bodyGroup برای هدف‌گذاری تعامل موجودند.
- حالت‌های EVIDENCE/SUSPECTS/TIMELINE/ACCUSATION/SOLVED/FAILED در STATES تعریف شده ولی هنوز پیاده نشده.
