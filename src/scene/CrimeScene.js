import * as THREE from 'three';
import { COLORS } from '../core/constants.js';
import { PHONE_MESSAGES } from '../evidence/phoneMessages.js';

/* ============================================================
   صحنه جرم اولیه — «پرونده: اتاق خاموش»
   جسد النا وودز از سقف آویزان، طناب، صندلی واژگون، و نشانه‌های اولیه.
   در این مرحله فقط چیدمان بصری است؛ سیستم تعامل/Evidence در مرحله بعد.
   از هندسه ساده استفاده می‌شود تا سبک و بهینه بماند.
   ============================================================ */

export class CrimeScene {
  constructor(assets, room) {
    this.assets = assets;
    this.room = room;
    this.group = new THREE.Group();
    this.group.name = 'CrimeScene';

    // مرکز صحنه: کمی جلوتر از مرکز اتاق
    this.center = new THREE.Vector3(0.6, 0, -0.4);

    this._buildBody();
    this._buildRope();
    this._buildTippedChair();
    this._buildDetails();
  }

  _mat(color, opts = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...opts });
  }

  // جسد آویزان — ساده و بدون جزئیات آزارنده، سایه‌محور برای حس نوآر
  _buildBody() {
    const c = this.center;
    const ropeTopY = 3.0;   // نقطه اتصال به سقف
    const headY = 2.05;     // ارتفاع سر
    const g = new THREE.Group();
    g.position.set(c.x, 0, c.z);

    const skin = this.assets.materials.skin;
    const cloth = this.assets.materials.cloth;

    // تنه (پیراهن تیره)
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.5, 4, 10), cloth);
    torso.position.y = headY - 0.55;
    torso.castShadow = true;
    g.add(torso);

    // سر
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), skin);
    head.position.y = headY;
    head.rotation.z = 0.25; // سر کمی خم — حس بی‌جانی
    head.castShadow = true;
    g.add(head);

    // موها
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10), this._mat(0x1c1712));
    hair.scale.set(1, 0.8, 1);
    hair.position.set(0, headY + 0.03, -0.02);
    g.add(hair);

    // دست‌ها آویزان
    for (const sx of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.5, 4, 8), cloth);
      arm.position.set(sx * 0.2, headY - 0.62, 0);
      arm.rotation.z = sx * 0.12;
      arm.castShadow = true;
      g.add(arm);
    }

    // پاها آویزان
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.7, 4, 8), this._mat(0x15171c));
      leg.position.set(sx * 0.09, headY - 1.35, 0);
      leg.castShadow = true;
      g.add(leg);
    }

    // دامن/لباس بلند
    const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.5, 12), cloth);
    dress.position.y = headY - 1.0;
    dress.castShadow = true;
    g.add(dress);

    this.bodyGroup = g;
    this.bodyAnchor = new THREE.Vector3(c.x, ropeTopY, c.z);
    this.bodyNeckY = headY + 0.12;
    this.group.add(g);
  }

  // طناب از گردن تا سقف
  _buildRope() {
    const topY = 3.02;
    const neckY = this.bodyNeckY;
    const len = topY - neckY;
    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, len, 8),
      this.assets.materials.rope
    );
    rope.position.set(this.center.x, neckY + len / 2, this.center.z);
    rope.castShadow = true;
    this.group.add(rope);
    this.ropeMesh = rope;

    // قلاب/اتصال سقف
    const hook = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.014, 8, 14),
      this.assets.materials.metal
    );
    hook.position.set(this.center.x, topY, this.center.z);
    hook.rotation.x = Math.PI / 2;
    this.group.add(hook);
  }

  // صندلی واژگون زیر جسد — نشانه صحنه‌سازی
  _buildTippedChair() {
    const m = this.assets.materials;
    const g = new THREE.Group();
    const seatY = 0.46;
    const seat = new THREE.Mesh(this.assets.geometries.box, m.fabric);
    seat.scale.set(0.44, 0.08, 0.44);
    seat.position.y = seatY;
    seat.castShadow = true;
    g.add(seat);
    const back = new THREE.Mesh(this.assets.geometries.box, m.woodDark);
    back.scale.set(0.44, 0.5, 0.06);
    back.position.set(0, seatY + 0.29, -0.19);
    g.add(back);
    for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
      const leg = new THREE.Mesh(this.assets.geometries.box, m.woodDark);
      leg.scale.set(0.05, seatY, 0.05);
      leg.position.set(lx, seatY / 2, lz);
      g.add(leg);
    }
    // واژگون روی زمین
    g.rotation.z = Math.PI / 2;
    g.rotation.y = 0.4;
    g.position.set(this.center.x + 0.5, 0.22, this.center.z + 0.45);
    this.group.add(g);
    this.tippedChairGroup = g;
  }

  // جزئیات ظریف صحنه: دکمه لباس کنار میز، برگه‌ای روی زمین
  _buildDetails() {
    const desk = this.room.deskInfo;
    if (desk) {
      // دکمه لباس دنیل کنار میز (سرنخ کلیدی — تعامل در مرحله بعد)
      const button = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.008, 12),
        this._mat(0x20242b, { metalness: 0.3, roughness: 0.6 })
      );
      button.position.set(desk.x + 0.5, 0.012, desk.z + desk.topD / 2 + 0.35);
      button.rotation.x = Math.PI / 2;
      this.group.add(button);
      this.buttonMesh = button;
    }

    this._buildPhone();
  }

  // موبایل مشکی النا روی میز — صفحه قفل روشن با اعلان پیام‌ها، شیشه شکسته
  _buildPhone() {
    // کمی بزرگ‌تر از واقعیت تا از ارتفاع چشم خوانا باشد
    const W = 0.085, H = 0.009, D = 0.175, R = 0.011, bevel = 0.0015;
    const phone = new THREE.Group();

    // بدنه: مستطیل با گوشه‌های گرد، اکسترود با لبه پخ — قاب مشکی
    const bodyGeo = new THREE.ExtrudeGeometry(
      this._roundedRectShape(W - bevel * 2, D - bevel * 2, R - bevel),
      { depth: H - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 10 }
    );
    bodyGeo.rotateX(-Math.PI / 2);
    bodyGeo.translate(0, -H / 2 + bevel, 0);
    const body = new THREE.Mesh(bodyGeo, this._mat(0x141518, { metalness: 0.55, roughness: 0.3 }));
    body.castShadow = true;
    body.receiveShadow = true;
    phone.add(body);

    // شیشه مشکی جلو (حاشیه دور صفحه)
    const glass = new THREE.Mesh(
      new THREE.ShapeGeometry(this._roundedRectShape(W - 0.0025, D - 0.0025, R - 0.001), 10),
      this._mat(0x040506, { metalness: 0.3, roughness: 0.1 })
    );
    glass.rotation.x = -Math.PI / 2;
    glass.position.y = H / 2 + 0.0002;
    phone.add(glass);

    // صفحه نمایش با بافت صفحه قفل
    const sw = W - 0.007, sd = D - 0.008;
    const screenGeo = new THREE.ShapeGeometry(this._roundedRectShape(sw, sd, R - 0.0035), 10);
    const pos = screenGeo.attributes.position;
    const uv = screenGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / sw + 0.5, pos.getY(i) / sd + 0.5);
    this.phoneTexture = this._createPhoneScreenTexture();
    const screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: this.phoneTexture }));
    screen.rotation.x = -Math.PI / 2;
    screen.position.y = H / 2 + 0.0004;
    phone.add(screen);

    // دکمه‌های کناری: پاور در یک سمت، ولوم در سمت دیگر
    const keyMat = this._mat(0x1e2024, { metalness: 0.6, roughness: 0.3 });
    const keys = [[1, -0.03, 0.022], [-1, -0.042, 0.018], [-1, -0.018, 0.018]];
    for (const [side, z, len] of keys) {
      const key = new THREE.Mesh(new THREE.BoxGeometry(0.0018, 0.0035, len), keyMat);
      key.position.set(side * (W / 2 + 0.0006), 0, z);
      phone.add(key);
    }

    // روی میز، گوشه جلو-راست (دور از چراغ، لیوان‌ها و قرارداد)، کمی چرخیده
    const desk = this.room.deskInfo;
    const surfaceY = desk ? desk.topY + 0.04 : 0;
    phone.rotation.y = 0.45;
    if (desk) phone.position.set(desk.x + 0.62, surfaceY + H / 2, desk.z + 0.27);
    else phone.position.set(this.center.x - 0.7, H / 2, this.center.z + 0.6);
    this.group.add(phone);
    this.messageMesh = phone;
  }

  _roundedRectShape(w, h, r) {
    const x = -w / 2, y = -h / 2;
    const shape = new THREE.Shape();
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }

  _createPhoneScreenTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 690;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;

    const draw = () => {
      this._drawPhoneScreen(canvas.getContext('2d'), canvas.width, canvas.height);
      texture.needsUpdate = true;
    };
    draw();
    // فونت وزیرمتن ممکن است هنوز بارگذاری نشده باشد؛ پس از بارگذاری دوباره رسم می‌شود
    document.fonts?.load('600 24px Vazirmatn').then(draw).catch(() => {});
    return texture;
  }

  _drawPhoneScreen(ctx, w, h) {
    const font = (size, weight = 400) => `${weight} ${size}px Vazirmatn, Tahoma, sans-serif`;

    // پس‌زمینه صفحه قفل
    const bg = ctx.createLinearGradient(0, 0, w * 0.4, h);
    bg.addColorStop(0, '#1b2b45');
    bg.addColorStop(0.55, '#121a2c');
    bg.addColorStop(1, '#0b0e16');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // دوربین جلو (پانچ‌هول)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(w / 2, 22, 8, 0, Math.PI * 2);
    ctx.fill();

    // نوار وضعیت: باتری کم
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    ctx.strokeRect(w - 52, 14, 30, 15);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(w - 22, 18, 3, 7);
    ctx.fillStyle = '#e0533d';
    ctx.fillRect(w - 50, 16, 6, 11);

    // ساعت و تاریخ صفحه قفل
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#eef2f8';
    ctx.font = font(78, 300);
    ctx.fillText('۲۳:۰۸', w / 2, 142);
    ctx.font = font(20, 500);
    ctx.fillStyle = 'rgba(238,242,248,0.75)';
    ctx.fillText('سه‌شنبه', w / 2, 178);

    // اعلان‌ها: جدیدترین در بالا
    let y = 216;
    for (const message of [...PHONE_MESSAGES].reverse()) {
      y = this._drawNotification(ctx, message, 16, y, w - 32, font) + 12;
    }

    // نوار پایین صفحه (Home indicator)
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 55, h - 20, 110, 6, 3);
    ctx.fill();

    // ترک روی شیشه از ضربه افتادن
    this._drawCrack(ctx, w * 0.68, h * 0.6);
  }

  _drawNotification(ctx, message, x, y, width, font) {
    const pad = 14;
    ctx.font = font(17);
    const lines = this._wrapText(ctx, message.text, width - pad * 2).slice(0, 3);
    const height = 50 + lines.length * 26;

    ctx.fillStyle = message.latest ? 'rgba(214,170,110,0.32)' : 'rgba(255,255,255,0.13)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 16);
    ctx.fill();

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = font(18, 700);
    ctx.fillText(message.sender, x + width - pad, y + 30);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = font(14);
    ctx.fillText(message.time, x + pad, y + 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.font = font(17);
    lines.forEach((line, i) => ctx.fillText(line, x + width - pad, y + 58 + i * 26));
    return y + height;
  }

  _wrapText(ctx, text, maxWidth) {
    const lines = [];
    let line = '';
    for (const word of text.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // شکستگی تار عنکبوتی: پرتوهای ترک از نقطه ضربه + حلقه‌های نامنظم بین آن‌ها
  _drawCrack(ctx, cx, cy) {
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    // نقطه ضربه: شیشه خردشده و تیره
    const impact = ctx.createRadialGradient(cx, cy, 0, cx, cy, 42);
    impact.addColorStop(0, 'rgba(0,0,0,0.85)');
    impact.addColorStop(0.5, 'rgba(10,12,16,0.45)');
    impact.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = impact;
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, Math.PI * 2);
    ctx.fill();

    // پرتوهای ترک با مسیر شکسته
    const rays = [];
    const count = 15;
    for (let i = 0; i < count; i++) {
      let angle = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.35;
      const length = 150 + rand() * 450;
      const points = [[cx, cy, 0]];
      let x = cx, y = cy, dist = 0;
      while (dist < length) {
        const step = 22 + rand() * 30;
        angle += (rand() - 0.5) * 0.32;
        x += Math.cos(angle) * step;
        y += Math.sin(angle) * step;
        dist += step;
        points.push([x, y, dist]);
      }
      rays.push(points);
    }

    const strokePath = (points) => {
      // سایه تیره زیر هر ترک و خط روشن روی آن، حس عمق شیشه
      for (const [width, color] of [[3.2, 'rgba(0,0,0,0.45)'], [1.3, 'rgba(235,242,255,0.75)']]) {
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.beginPath();
        points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.stroke();
      }
    };

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // تکه‌های کوچک شیشه نزدیک مرکز
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < rays.length; i += 2) {
      const a = rays[i][2] || rays[i][1];
      const b = rays[(i + 1) % rays.length][2] || rays[(i + 1) % rays.length][1];
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.fill();
    }

    for (const ray of rays) strokePath(ray);

    // حلقه‌های نامنظم بین پرتوها
    const pointAt = (ray, r) => ray.find((p) => p[2] >= r) || ray[ray.length - 1];
    for (const r of [16, 40, 72, 115]) {
      for (let i = 0; i < rays.length; i++) {
        if (rand() < 0.25) continue;
        const a = pointAt(rays[i], r + (rand() - 0.5) * 10);
        const b = pointAt(rays[(i + 1) % rays.length], r + (rand() - 0.5) * 10);
        strokePath([a, b]);
      }
    }
  }

  dispose() {
    this.phoneTexture?.dispose();
    this.group.traverse((o) => {
      if (o.isMesh && o.geometry &&
        o.geometry !== this.assets.geometries.box &&
        o.geometry !== this.assets.geometries.plane) {
        o.geometry.dispose();
      }
    });
  }
}
