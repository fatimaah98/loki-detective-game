import * as THREE from 'three';

const EVIDENCE_DATA = [
  {
    id: 'body',
    title: 'جسد النا وودز',
    description: 'جسد النا از سقف آویزان شده است. در نگاه اول صحنه شبیه خودکشی به نظر می‌رسد، اما وضعیت صندلی و جزئیات صحنه نیاز به بررسی دقیق‌تر دارد.',
    rootKey: 'bodyGroup',
    radius: 0.48
  },
  {
    id: 'rope',
    title: 'طناب',
    description: 'طناب از سقف تا گردن قربانی کشیده شده است. گره و جای اتصال آن را با دقت بررسی کنید.',
    rootKey: 'ropeMesh',
    radius: 0.24
  },
  {
    id: 'chair',
    title: 'صندلی واژگون',
    description: 'صندلی زیر جسد افتاده است. جای آن می‌تواند درباره نحوه چیده‌شدن صحنه سرنخ بدهد.',
    rootKey: 'tippedChairGroup',
    radius: 0.42
  },
  {
    id: 'clock',
    title: 'ساعت متوقف‌شده',
    description: 'ساعت دیواری روی ۲۱:۵۲ متوقف شده است. این زمان ممکن است با روایت مظنون‌ها تطابق نداشته باشد.',
    rootKey: 'clockMesh',
    radius: 0.34
  },
  {
    id: 'glasses',
    title: 'دو لیوان روی میز',
    description: 'دو لیوان روی میز نشان می‌دهند که النا احتمالاً پیش از مرگ با شخص دیگری دیدار کرده است.',
    rootKey: 'glasses',
    radius: 0.32
  },
  {
    id: 'message',
    title: 'پیام آخر النا',
    description: 'روی برگه نوشته شده است: «باید امشب همه چیز را تمام کنیم.» این پیام ممکن است انگیزه‌ای برای قتل را آشکار کند.',
    rootKey: 'messageMesh',
    radius: 0.3
  },
  {
    id: 'contract',
    title: 'قرارداد مالی',
    description: 'این برگه بخشی از اسناد مالی شرکت را نشان می‌دهد. بررسی آن می‌تواند انگیزه‌ای برای قتل آشکار کند.',
    rootKey: 'contractMesh',
    radius: 0.3
  },
  {
    id: 'button',
    title: 'دکمه لباس',
    description: 'دکمه‌ای کنار میز افتاده است. ظاهر و جنس آن می‌تواند به لباس یکی از افراد حاضر در خانه مرتبط باشد.',
    rootKey: 'buttonMesh',
    radius: 0.28
  },
  {
    id: 'footprints',
    title: 'رد حضور در اتاق',
    description: 'رد پا روی زمین نشان می‌دهد که شخصی در زمان وقوع حادثه در اتاق حضور داشته است. بررسی آن می‌تواند با اظهارات مظنون‌ها مقایسه شود.',
    rootKey: 'footprintsMesh',
    radius: 0.42
  },
  {
    id: 'camera',
    title: 'دوربین بیرونی',
    description: 'دوربین بیرونی خانه می‌تواند زمان ورود و خروج افراد را روشن کند. ثبت‌های آن را با اظهاراتشان مقایسه کنید.',
    rootKey: 'cameraMesh',
    radius: 0.32
  }
];

export class EvidenceSystem {
  constructor({ scene, camera, player, room, crimeScene, onTarget, onInspect, onDetectiveMode }) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.onTarget = onTarget;
    this.onInspect = onInspect;
    this.onDetectiveMode = onDetectiveMode;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 3.4;
    this.center = new THREE.Vector2(0, 0);
    this.proxyGeometry = new THREE.SphereGeometry(1, 10, 8);
    this.proxyMaterial = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.targets = [];
    this.collected = new Set();
    this.current = null;
    this.highlightedRoots = [];
    this.originalMaterials = new Map();
    this.detectiveUntil = 0;
    this.detectiveDuration = 3500;
    this._buildTargets(room, crimeScene);
  }

  _buildTargets(room, crimeScene) {
    const roots = {
      bodyGroup: crimeScene.bodyGroup,
      ropeMesh: crimeScene.ropeMesh,
      tippedChairGroup: crimeScene.tippedChairGroup,
      clockMesh: room.clockMesh,
      glasses: room.glasses,
      messageMesh: crimeScene.messageMesh,
      contractMesh: room.contractMesh,
      buttonMesh: crimeScene.buttonMesh,
      footprintsMesh: room.footprintsMesh,
      cameraMesh: room.cameraMesh
    };

    for (const definition of EVIDENCE_DATA) {
      const root = roots[definition.rootKey];
      if (!root) continue;
      const rootList = Array.isArray(root) ? root : [root];
      const proxy = new THREE.Mesh(this.proxyGeometry, this.proxyMaterial);
      proxy.name = `evidence-target-${definition.id}`;
      proxy.userData.evidence = definition;

      const bounds = new THREE.Box3();
      for (const item of rootList) {
        item.updateWorldMatrix(true, true);
        bounds.expandByObject(item);
      }
      const center = bounds.isEmpty() ? new THREE.Vector3() : bounds.getCenter(new THREE.Vector3());
      proxy.position.copy(center);
      proxy.scale.setScalar(definition.radius);
      proxy.updateMatrixWorld(true);
      this.scene.add(proxy);
      this.targets.push({ definition, roots: rootList, proxy });
    }
  }

  update() {
    if (this.detectiveUntil && performance.now() >= this.detectiveUntil) {
      this.detectiveUntil = 0;
      this._applyHighlights();
      this.onDetectiveMode?.(false);
    }

    this.camera.updateMatrixWorld();
    this.raycaster.setFromCamera(this.center, this.camera);
    const hits = this.raycaster.intersectObjects(this.targets.map((target) => target.proxy), false);
    const hit = hits.find((entry) => this.player.position.distanceTo(entry.object.position) <= 3.2);
    const next = hit?.object.userData.evidence || null;

    if (next?.id !== this.current?.id) {
      this.current = next;
      this._applyHighlights();
      this.onTarget?.(next);
    }
  }

  activateDetectiveMode() {
    if (this.detectiveUntil) return false;
    const remaining = this.targets.filter(({ definition }) => !this.collected.has(definition.id));
    if (!remaining.length) return false;
    this.detectiveUntil = performance.now() + this.detectiveDuration;
    this._applyHighlights();
    this.onDetectiveMode?.(true, this.detectiveDuration);
    return true;
  }

  inspectCurrent() {
    if (!this.current) return null;
    this.collected.add(this.current.id);
    this.onInspect?.(this.current, this.collected.size);
    return this.current;
  }

  getCollected() {
    return EVIDENCE_DATA.filter((item) => this.collected.has(item.id));
  }

  _applyHighlights() {
    this._restoreHighlight();
    const activeTargets = this.targets.filter(({ definition }) => {
      if (this.detectiveUntil) return !this.collected.has(definition.id);
      return definition.id === this.current?.id;
    });
    const rootSet = new Set(activeTargets.flatMap((target) => target.roots));
    this.highlightedRoots = [...rootSet];
    for (const root of this.highlightedRoots) {
      root.traverse((object) => {
        if (!object.isMesh || !object.material) return;
        const original = object.material;
        const highlighted = Array.isArray(original)
          ? original.map((material) => this._highlightMaterial(material, this.detectiveUntil ? 0.105 : 0.16))
          : this._highlightMaterial(original, this.detectiveUntil ? 0.105 : 0.16);
        this.originalMaterials.set(object, original);
        object.material = highlighted;
      });
    }
  }

  _highlightMaterial(material, intensity) {
    const clone = material.clone();
    if ('emissive' in clone) {
      clone.emissive.set(0x80613e);
      clone.emissiveIntensity = intensity;
    } else {
      clone.color.lerp(new THREE.Color(0xd8b47d), 0.12);
    }
    return clone;
  }

  _restoreHighlight() {
    for (const [object, original] of this.originalMaterials) {
      const active = object.material;
      for (const material of Array.isArray(active) ? active : [active]) material.dispose();
      object.material = original;
    }
    this.originalMaterials.clear();
    this.highlightedRoots = [];
  }

  dispose() {
    if (this.detectiveUntil) this.onDetectiveMode?.(false);
    this.detectiveUntil = 0;
    this._restoreHighlight();
    for (const target of this.targets) target.proxy.removeFromParent();
    this.proxyGeometry.dispose();
    this.proxyMaterial.dispose();
    this.targets.length = 0;
  }
}
