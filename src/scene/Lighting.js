import * as THREE from 'three';
import { COLORS, ROOM } from '../core/constants.js';

/* ============================================================
   نورپردازی نوآر — کم‌نور، سرد و سینمایی، اما بهینه.
   - نور محیطی بسیار کم برای پایه.
   - نور سرد خیابان از پنجره (تنها منبع سایه‌انداز).
   - چراغ رومیزی گرم (بدون سایه، برای کنترل هزینه).
   فقط یک نور سایه‌انداز داریم تا Performance حفظ شود.
   ============================================================ */

export class Lighting {
  constructor(scene, lampPosition) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'Lighting';

    // نور محیطی خیلی کم — تاریکی عمیق
    this.ambient = new THREE.AmbientLight(0x2a3038, 0.55);
    this.group.add(this.ambient);

    // نور سرد خیابان از پنجره (دیوار عقب z-)
    this.moon = new THREE.DirectionalLight(COLORS.streetCold, 1.15);
    this.moon.position.set(-1.5, 3.2, -6);
    this.moon.target.position.set(0.5, 0.8, 1);
    this.moon.castShadow = true;
    this.moon.shadow.mapSize.set(1024, 1024);
    this.moon.shadow.camera.near = 0.5;
    this.moon.shadow.camera.far = 18;
    const s = 7;
    this.moon.shadow.camera.left = -s;
    this.moon.shadow.camera.right = s;
    this.moon.shadow.camera.top = s;
    this.moon.shadow.camera.bottom = -s;
    this.moon.shadow.bias = -0.0006;
    this.group.add(this.moon);
    this.group.add(this.moon.target);

    // هاله ملایم نور سرد نزدیک پنجره برای عمق فضا
    this.windowGlow = new THREE.PointLight(COLORS.streetCold, 4, 6, 2);
    this.windowGlow.position.set(0, 1.9, -ROOM.depth / 2 + 0.6);
    this.group.add(this.windowGlow);

    // چراغ رومیزی گرم (بدون سایه)
    this.lamp = new THREE.PointLight(COLORS.lampWarm, 6, 4.5, 2.2);
    if (lampPosition) {
      this.lamp.position.copy(lampPosition).add(new THREE.Vector3(0, -0.05, 0));
    } else {
      this.lamp.position.set(-2.6, 1.1, -2.3);
    }
    this.group.add(this.lamp);

    scene.add(this.group);
  }

  dispose() {
    this.scene.remove(this.group);
    this.moon.dispose?.();
    this.lamp.dispose?.();
    this.windowGlow.dispose?.();
    this.ambient.dispose?.();
  }
}
