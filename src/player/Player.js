import * as THREE from 'three';
import { PLAYER, ROOM } from '../core/constants.js';

/* ============================================================
   کنترلر بازیکن اول‌شخص
   - حرکت با WASD نسبت به جهت نگاه (روی صفحه افقی).
   - نگاه با ماوس (yaw/pitch) — بدون کتابخانه اضافه.
   - برخورد: محدود شدن به مرز اتاق + جعبه‌های اثاثیه (AABB).
   - حرکت با شتاب و میرایی برای حس بهتر.
   ============================================================ */

export class Player {
  constructor(camera, input, colliders) {
    this.camera = camera;
    this.input = input;
    this.colliders = colliders || [];

    this.position = new THREE.Vector3(2.2, PLAYER.eyeHeight, 2.6);
    this.velocity = new THREE.Vector3();
    this.yaw = Math.PI; // رو به داخل اتاق
    this.pitch = 0;

    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._wish = new THREE.Vector3();

    this._syncCamera();
  }

  _syncCamera() {
    this.camera.position.copy(this.position);
    const cp = Math.cos(this.pitch);
    this.camera.rotation.set(0, 0, 0);
    // نگاه: yaw حول محور Y، سپس pitch حول محور X
    const dir = new THREE.Vector3(
      Math.sin(this.yaw) * cp,
      Math.sin(this.pitch),
      Math.cos(this.yaw) * cp
    );
    this.camera.lookAt(
      this.position.x + dir.x,
      this.position.y + dir.y,
      this.position.z + dir.z
    );
  }

  update(dt) {
    // ---- نگاه با ماوس ----
    if (this.input.locked) {
      const { dx, dy } = this.input.consumeMouseDelta();
      this.yaw -= dx * PLAYER.lookSpeed;
      this.pitch -= dy * PLAYER.lookSpeed;
      const lim = Math.PI / 2 - 0.05;
      this.pitch = Math.max(-lim, Math.min(lim, this.pitch));
    }

    // ---- جهت حرکت روی صفحه افقی ----
    this._forward.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    this._right.set(Math.sin(this.yaw - Math.PI / 2), 0, Math.cos(this.yaw - Math.PI / 2));

    const a = this.input.actions;
    this._wish.set(0, 0, 0);
    if (a.forward) this._wish.add(this._forward);
    if (a.backward) this._wish.sub(this._forward);
    if (a.right) this._wish.add(this._right);
    if (a.left) this._wish.sub(this._right);

    const hasInput = this._wish.lengthSq() > 0;
    if (hasInput) this._wish.normalize().multiplyScalar(PLAYER.moveSpeed);

    // شتاب به‌سمت سرعت هدف و میرایی هنگام رها کردن
    const rate = hasInput ? PLAYER.accel : PLAYER.damping;
    this.velocity.x += (this._wish.x - this.velocity.x) * Math.min(1, rate * dt);
    this.velocity.z += (this._wish.z - this.velocity.z) * Math.min(1, rate * dt);

    // ---- حرکت + برخورد (هر محور جداگانه برای لغزیدن روی دیوار) ----
    this._moveAxis('x', this.velocity.x * dt);
    this._moveAxis('z', this.velocity.z * dt);

    this._syncCamera();
  }

  _moveAxis(axis, delta) {
    if (delta === 0) return;
    const next = this.position.clone();
    next[axis] += delta;
    if (!this._blocked(next)) {
      this.position[axis] = next[axis];
    } else {
      this.velocity[axis] = 0;
    }
  }

  _blocked(pos) {
    const r = PLAYER.radius;
    // مرز اتاق
    const hx = ROOM.width / 2 - r - 0.08;
    const hz = ROOM.depth / 2 - r - 0.08;
    if (pos.x < -hx || pos.x > hx || pos.z < -hz || pos.z > hz) return true;
    // اثاثیه
    for (const c of this.colliders) {
      if (
        pos.x + r > c.minX &&
        pos.x - r < c.maxX &&
        pos.z + r > c.minZ &&
        pos.z - r < c.maxZ
      ) {
        return true;
      }
    }
    return false;
  }

  /** جهت نگاه دوربین (برای raycast تعامل در مراحل بعد) */
  getLookDirection(target = new THREE.Vector3()) {
    const cp = Math.cos(this.pitch);
    return target
      .set(Math.sin(this.yaw) * cp, Math.sin(this.pitch), Math.cos(this.yaw) * cp)
      .normalize();
  }
}
