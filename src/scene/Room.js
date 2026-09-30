import * as THREE from 'three';
import { ROOM, COLORS } from '../core/constants.js';

/* ============================================================
   اتاق کار — کف، سقف، دیوارها، پنجره، در، میز، کتابخانه، صندلی، ساعت
   همه اجسام از هندسه/متریال مشترک استفاده می‌کنند.
   colliders: فهرست جعبه‌های برخورد افقی (AABB) برای اثاثیه.
   ============================================================ */

export class Room {
  constructor(assets) {
    this.assets = assets;
    this.group = new THREE.Group();
    this.group.name = 'Room';
    this.colliders = []; // { minX, maxX, minZ, maxZ }
    this.clockMesh = null;

    this._buildShell();
    this._buildWindow();
    this._buildDoor();
    this._buildDesk();
    this._buildBookshelf();
    this._buildChairs();
    this._buildClock();
    this._buildRug();
  }

  // ابزار: جعبه مقیاس‌شده از هندسه مشترک
  _box(material, sx, sy, sz, x, y, z, receive = true, cast = true) {
    const mesh = new THREE.Mesh(this.assets.geometries.box, material);
    mesh.scale.set(sx, sy, sz);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    this.group.add(mesh);
    return mesh;
  }

  _addCollider(x, z, sx, sz, pad = 0.05) {
    this.colliders.push({
      minX: x - sx / 2 - pad,
      maxX: x + sx / 2 + pad,
      minZ: z - sz / 2 - pad,
      maxZ: z + sz / 2 + pad
    });
  }

  _buildShell() {
    const { width: w, depth: d, height: h } = ROOM;
    const m = this.assets.materials;

    // کف
    const floor = new THREE.Mesh(this.assets.geometries.plane, m.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.scale.set(w, d, 1);
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.group.add(floor);

    // سقف
    const ceil = new THREE.Mesh(this.assets.geometries.plane, m.ceiling);
    ceil.rotation.x = Math.PI / 2;
    ceil.scale.set(w, d, 1);
    ceil.position.y = h;
    this.group.add(ceil);

    const t = 0.15; // ضخامت دیوار
    // دیوار عقب (z-) و جلو (z+)
    this._box(m.wall, w, h, t, 0, h / 2, -d / 2, false, false);
    this._box(m.wall, w, h, t, 0, h / 2, d / 2, false, false);
    // دیوار چپ (x-) و راست (x+)
    this._box(m.wall, t, h, d, -w / 2, h / 2, 0, false, false);
    this._box(m.wall, t, h, d, w / 2, h / 2, 0, false, false);
  }

  // پنجره روی دیوار عقب با نور سرد خیابان (شیشه شفاف + قاب)
  _buildWindow() {
    const { depth: d, height: h } = ROOM;
    const m = this.assets.materials;
    const z = -d / 2 + 0.09;
    const winW = 2.4;
    const winH = 1.6;
    const cy = 1.7;

    // شیشه
    this._box(m.glass, winW, winH, 0.04, 0, cy, z, false, false);

    // قاب پنجره (چهار لبه + میله وسط)
    const fr = m.woodDark;
    this._box(fr, winW + 0.2, 0.12, 0.12, 0, cy + winH / 2, z, false, false);
    this._box(fr, winW + 0.2, 0.12, 0.12, 0, cy - winH / 2, z, false, false);
    this._box(fr, 0.12, winH, 0.12, -winW / 2, cy, z, false, false);
    this._box(fr, 0.12, winH, 0.12, winW / 2, cy, z, false, false);
    this._box(fr, 0.08, winH, 0.08, 0, cy, z, false, false);
    this._box(fr, winW, 0.08, 0.08, 0, cy, z, false, false);
  }

  // در روی دیوار راست
  _buildDoor() {
    const { width: w } = ROOM;
    const m = this.assets.materials;
    const x = w / 2 - 0.09;
    const doorH = 2.15;
    const doorW = 1.0;
    this._box(m.woodDark, 0.08, doorH, doorW, x, doorH / 2, 1.6, false, false);
    // دستگیره
    this._box(m.metal, 0.06, 0.06, 0.14, x - 0.06, 1.05, 1.2, false, false);
  }

  _buildDesk() {
    const m = this.assets.materials;
    const x = -2.6;
    const z = -2.3;
    const topY = 0.76;
    const topW = 1.8;
    const topD = 0.9;

    // صفحه میز
    this._box(m.wood, topW, 0.08, topD, x, topY, z);
    // پایه‌ها
    const ly = topY / 2;
    const off = 0.06;
    this._box(m.woodDark, 0.08, topY, 0.08, x - topW / 2 + off + 0.06, ly, z - topD / 2 + off + 0.06);
    this._box(m.woodDark, 0.08, topY, 0.08, x + topW / 2 - off - 0.06, ly, z - topD / 2 + off + 0.06);
    this._box(m.woodDark, 0.08, topY, 0.08, x - topW / 2 + off + 0.06, ly, z + topD / 2 - off - 0.06);
    this._box(m.woodDark, 0.08, topY, 0.08, x + topW / 2 - off - 0.06, ly, z + topD / 2 - off - 0.06);
    // کشوی میز
    this._box(m.woodDark, 0.7, 0.22, topD - 0.1, x + topW / 2 - 0.45, topY - 0.2, z);
    // دستگیره کشو
    this._box(m.metal, 0.16, 0.03, 0.03, x + topW / 2 - 0.45, topY - 0.2, z + topD / 2 - 0.02);

    this._addCollider(x, z, topW, topD);

    // چراغ رومیزی (پایه + بازو + سرپوش) — نور آن در Lighting افزوده می‌شود
    const lx = x - 0.6;
    const lz = z - 0.2;
    this._box(m.metal, 0.16, 0.03, 0.16, lx, topY + 0.02, lz, false, false);
    this._box(m.metal, 0.04, 0.4, 0.04, lx, topY + 0.22, lz, false, false);
    this._box(m.metal, 0.24, 0.1, 0.24, lx + 0.05, topY + 0.44, lz, false, false);
    this.lampPosition = new THREE.Vector3(lx + 0.05, topY + 0.4, lz);

    // دو لیوان روی میز (سرنخ آینده)
    const gY = topY + 0.09;
    this._glass(x + 0.2, gY, z + 0.15);
    this._glass(x + 0.42, gY, z - 0.02);

    this.deskInfo = { x, z, topY, topW, topD };
  }

  _glass(x, y, z) {
    const geo = new THREE.CylinderGeometry(0.045, 0.04, 0.12, 12);
    const mesh = new THREE.Mesh(geo, this.assets.materials.glass);
    mesh.position.set(x, y, z);
    mesh.castShadow = false;
    this.group.add(mesh);
  }

  _buildBookshelf() {
    const m = this.assets.materials;
    const x = 3.9;
    const z = -2.6;
    const shW = 1.4;
    const shH = 2.2;
    const shD = 0.4;

    // بدنه
    this._box(m.woodDark, shW, shH, shD, x, shH / 2, z);
    // طبقات و کتاب‌ها (رنگ‌های خاموش، به‌صورت بلوک ساده)
    const bookColors = [0x3a2b2b, 0x2b3a34, 0x33303a, 0x3a3630];
    for (let i = 0; i < 4; i++) {
      const sy = 0.45 + i * 0.5;
      for (let j = 0; j < 3; j++) {
        const bw = 0.08 + Math.random() * 0.05;
        const bh = 0.28 + Math.random() * 0.08;
        const mat = new THREE.MeshStandardMaterial({
          color: bookColors[(i + j) % bookColors.length],
          roughness: 1.0
        });
        const b = new THREE.Mesh(this.assets.geometries.box, mat);
        b.scale.set(bw, bh, shD - 0.1);
        b.position.set(x - shW / 2 + 0.25 + j * 0.28, sy + bh / 2 - 0.14, z);
        b.castShadow = true;
        this.group.add(b);
      }
    }
    this._addCollider(x, z, shW, shD);
  }

  _buildChairs() {
    const m = this.assets.materials;
    // صندلی سالم کنار میز
    this._chair(-1.4, -1.6, Math.PI * 0.15, false);
    // صندلی واژگون‌شده زیر جسد (بخشی از صحنه جرم) در CrimeScene قرار می‌گیرد
  }

  _chair(x, z, rot, tipped) {
    const m = this.assets.materials;
    const g = new THREE.Group();
    const seatY = 0.46;
    // نشیمن
    const seat = new THREE.Mesh(this.assets.geometries.box, m.fabric);
    seat.scale.set(0.44, 0.08, 0.44);
    seat.position.y = seatY;
    seat.castShadow = true;
    g.add(seat);
    // پشتی
    const back = new THREE.Mesh(this.assets.geometries.box, m.woodDark);
    back.scale.set(0.44, 0.5, 0.06);
    back.position.set(0, seatY + 0.29, -0.19);
    back.castShadow = true;
    g.add(back);
    // پایه‌ها
    const legPos = [
      [-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]
    ];
    for (const [lx, lz] of legPos) {
      const leg = new THREE.Mesh(this.assets.geometries.box, m.woodDark);
      leg.scale.set(0.05, seatY, 0.05);
      leg.position.set(lx, seatY / 2, lz);
      leg.castShadow = true;
      g.add(leg);
    }
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    if (tipped) {
      g.rotation.z = Math.PI / 2;
      g.position.y = 0.25;
    }
    this.group.add(g);
    if (!tipped) this._addCollider(x, z, 0.5, 0.5);
    return g;
  }

  _buildClock() {
    const m = this.assets.materials;
    const { depth: d } = ROOM;
    // ساعت دیواری روی دیوار عقب، متوقف روی ۲۱:۵۲
    const z = -d / 2 + 0.1;
    const x = 2.8;
    const y = 2.2;
    const g = new THREE.Group();

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 24), m.woodDark);
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), m.clockFace);
    face.position.z = 0.032;
    g.add(face);

    // عقربه ساعت و دقیقه برای ۲۱:۵۲ (~ عقربه‌ها)
    const handMat = m.dark;
    // عقربه دقیقه (۵۲ دقیقه ≈ ۳۱۲ درجه از بالا)
    const minute = new THREE.Mesh(this.assets.geometries.box, handMat);
    minute.scale.set(0.015, 0.2, 0.01);
    minute.position.z = 0.04;
    minute.geometry = this.assets.geometries.box;
    const minAngle = -(52 / 60) * Math.PI * 2;
    minute.position.set(Math.sin(minAngle) * 0.09, Math.cos(minAngle) * 0.09, 0.045);
    minute.rotation.z = -minAngle;
    g.add(minute);
    // عقربه ساعت (~۹ و کمی، حدود ۲۱:۵۲)
    const hour = new THREE.Mesh(this.assets.geometries.box, handMat);
    hour.scale.set(0.02, 0.13, 0.01);
    const hourAngle = -((21 + 52 / 60) % 12 / 12) * Math.PI * 2;
    hour.position.set(Math.sin(hourAngle) * 0.05, Math.cos(hourAngle) * 0.05, 0.045);
    hour.rotation.z = -hourAngle;
    g.add(hour);

    g.position.set(x, y, z);
    this.group.add(g);
    this.clockMesh = g;
  }

  _buildRug() {
    const m = this.assets.materials;
    const rug = new THREE.Mesh(this.assets.geometries.plane, m.fabric);
    rug.rotation.x = -Math.PI / 2;
    rug.scale.set(3.2, 2.4, 1);
    rug.position.set(0.4, 0.01, 0.6);
    rug.receiveShadow = true;
    this.group.add(rug);
  }

  dispose() {
    this.group.traverse((o) => {
      if (o.isMesh) {
        // فقط هندسه‌های اختصاصی (نه مشترک) را آزاد کن
        if (
          o.geometry &&
          o.geometry !== this.assets.geometries.box &&
          o.geometry !== this.assets.geometries.plane
        ) {
          o.geometry.dispose();
        }
      }
    });
  }
}
