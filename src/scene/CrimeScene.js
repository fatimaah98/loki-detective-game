import * as THREE from 'three';
import { COLORS } from '../core/constants.js';

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

    // برگه کاغذ روی زمین نزدیک جسد
    const paper = new THREE.Mesh(this.assets.geometries.plane, this.assets.materials.paper);
    paper.rotation.x = -Math.PI / 2;
    paper.rotation.z = 0.6;
    paper.scale.set(0.21, 0.29, 1);
    paper.position.set(this.center.x - 0.7, 0.015, this.center.z + 0.6);
    this.group.add(paper);
  }

  dispose() {
    this.group.traverse((o) => {
      if (o.isMesh && o.geometry &&
        o.geometry !== this.assets.geometries.box &&
        o.geometry !== this.assets.geometries.plane) {
        o.geometry.dispose();
      }
    });
  }
}
