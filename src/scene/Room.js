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
    this._buildEvidenceBoard();
    this._buildWallFrames();
    this._buildLounge();
    this._buildTrim();
    this._buildEvidenceProps();
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
    const x = -2.7;

    // شیشه
    this._box(m.glass, winW, winH, 0.04, x, cy, z, false, false);

    // قاب پنجره (چهار لبه + میله وسط)
    const fr = m.woodDark;
    this._box(fr, winW + 0.2, 0.12, 0.12, x, cy + winH / 2, z, false, false);
    this._box(fr, winW + 0.2, 0.12, 0.12, x, cy - winH / 2, z, false, false);
    this._box(fr, 0.12, winH, 0.12, x - winW / 2, cy, z, false, false);
    this._box(fr, 0.12, winH, 0.12, x + winW / 2, cy, z, false, false);
    this._box(fr, 0.08, winH, 0.08, x, cy, z, false, false);
    this._box(fr, winW, 0.08, 0.08, x, cy, z, false, false);
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
    const glassOne = this._glass(x + 0.2, gY, z + 0.15);
    const glassTwo = this._glass(x + 0.42, gY, z - 0.02);
    this.glasses = [glassOne, glassTwo];

    this.deskInfo = { x, z, topY, topW, topD };
  }

  _glass(x, y, z) {
    const geo = new THREE.CylinderGeometry(0.045, 0.04, 0.12, 12);
    const mesh = new THREE.Mesh(geo, this.assets.materials.glass);
    mesh.position.set(x, y, z);
    mesh.castShadow = false;
    this.group.add(mesh);
    return mesh;
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

  _buildEvidenceProps() {
    const m = this.assets.materials;
    const desk = this.deskInfo;
    const contract = new THREE.Mesh(this.assets.geometries.plane, m.paper);
    contract.rotation.x = -Math.PI / 2;
    contract.rotation.z = -0.18;
    contract.scale.set(0.34, 0.25, 1);
    contract.position.set(desk.x - 0.18, desk.topY + 0.047, desk.z + 0.08);
    this.group.add(contract);
    this.contractMesh = contract;

    const camera = new THREE.Group();
    camera.position.set(-1.1, 2.75, -ROOM.depth / 2 + 0.18);
    const body = new THREE.Mesh(this.assets.geometries.box, m.darkMetal);
    body.scale.set(0.34, 0.18, 0.16);
    camera.add(body);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.12, 12), m.metal);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = -0.12;
    camera.add(lens);
    const mount = new THREE.Mesh(this.assets.geometries.box, m.darkMetal);
    mount.scale.set(0.08, 0.24, 0.08);
    mount.position.y = -0.19;
    camera.add(mount);
    this.group.add(camera);
    this.cameraMesh = camera;

    const traceGroup = new THREE.Group();
    const footprintGeometry = new THREE.CircleGeometry(0.09, 10);
    const traceMaterial = new THREE.MeshStandardMaterial({
      color: 0x332c25,
      roughness: 1,
      transparent: true,
      opacity: 0.56,
      side: THREE.DoubleSide
    });
    const marks = [
      [-0.28, 0.02, 0.08], [0.02, -0.08, -0.1], [0.27, 0.12, 0.16]
    ];
    for (const [x, z, rotation] of marks) {
      const mark = new THREE.Mesh(footprintGeometry, traceMaterial);
      mark.rotation.x = -Math.PI / 2;
      mark.rotation.z = rotation;
      mark.scale.set(0.7, 1.2, 1);
      mark.position.set(x, 0.018, z);
      traceGroup.add(mark);
    }
    traceGroup.position.set(0.95, 0, 0.45);
    this.group.add(traceGroup);
    this.footprintsMesh = traceGroup;
  }

  _buildRug() {
    const m = this.assets.materials;
    const rug = new THREE.Mesh(this.assets.geometries.plane, m.rug);
    rug.rotation.x = -Math.PI / 2;
    rug.scale.set(3.2, 2.4, 1);
    rug.position.set(0.4, 0.01, 0.6);
    rug.receiveShadow = true;
    this.group.add(rug);
  }

  _buildEvidenceBoard() {
    const m = this.assets.materials;
    const x = 0.65;
    const y = 2.05;
    const z = -ROOM.depth / 2 + 0.11;
    const width = 3.25;
    const height = 1.45;

    this._box(m.frame, width + 0.18, height + 0.18, 0.12, x, y, z, false, false);
    this._box(m.cork, width, height, 0.045, x, y, z + 0.07, false, false);

    const papers = new THREE.InstancedMesh(
      this.assets.geometries.plane,
      m.paperMuted,
      8
    );
    const placements = [
      [-1.25, 0.38, 0.42, 0.34, -0.08], [-0.72, 0.45, 0.32, 0.42, 0.04],
      [-0.18, 0.31, 0.46, 0.29, 0.07], [0.46, 0.43, 0.33, 0.4, -0.04],
      [1.1, 0.33, 0.42, 0.3, 0.06], [-0.92, -0.35, 0.4, 0.31, 0.04],
      [-0.2, -0.38, 0.31, 0.38, -0.05], [0.67, -0.33, 0.48, 0.3, 0.07]
    ];
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    for (let i = 0; i < placements.length; i++) {
      const [px, py, sx, sy, rotation] = placements[i];
      position.set(x + px, y + py, z + 0.105);
      quaternion.setFromEuler(new THREE.Euler(0, 0, rotation));
      scale.set(sx, sy, 1);
      matrix.compose(position, quaternion, scale);
      papers.setMatrixAt(i, matrix);
    }
    papers.instanceMatrix.needsUpdate = true;
    papers.castShadow = false;
    this.group.add(papers);
  }

  _buildWallFrames() {
    const m = this.assets.materials;
    const leftWall = new THREE.Group();
    leftWall.position.set(-ROOM.width / 2 + 0.09, 2.0, 0.2);
    leftWall.rotation.y = Math.PI / 2;
    const frame = new THREE.Mesh(this.assets.geometries.box, m.frame);
    frame.scale.set(1.9, 1.45, 0.11);
    leftWall.add(frame);
    const print = new THREE.Mesh(this.assets.geometries.plane, m.mapFramed);
    print.position.z = 0.062;
    print.scale.set(1.68, 1.23, 1);
    leftWall.add(print);
    this.group.add(leftWall);

    const rightFrame = new THREE.Group();
    rightFrame.position.set(ROOM.width / 2 - 0.09, 2.0, -1.0);
    rightFrame.rotation.y = -Math.PI / 2;
    const border = new THREE.Mesh(this.assets.geometries.box, m.frame);
    border.scale.set(1.15, 0.9, 0.1);
    rightFrame.add(border);
    const photo = new THREE.Mesh(this.assets.geometries.plane, m.mapFramed);
    photo.position.z = 0.057;
    photo.scale.set(0.96, 0.7, 1);
    rightFrame.add(photo);
    this.group.add(rightFrame);
  }

  _buildLounge() {
    const m = this.assets.materials;
    const x = 3.05;
    const z = 0.35;
    const sofa = new THREE.Group();
    const part = (material, sx, sy, sz, px, py, pz) => {
      const mesh = new THREE.Mesh(this.assets.geometries.box, material);
      mesh.scale.set(sx, sy, sz);
      mesh.position.set(px, py, pz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      sofa.add(mesh);
    };

    part(m.woodDark, 1.65, 0.22, 0.72, 0, 0.32, 0);
    part(m.leatherChair, 1.43, 0.16, 0.52, 0, 0.52, 0.03);
    part(m.leatherChair, 1.5, 0.62, 0.16, 0, 0.77, -0.27);
    part(m.woodDark, 0.18, 0.48, 0.74, -0.74, 0.55, 0.02);
    part(m.woodDark, 0.18, 0.48, 0.74, 0.74, 0.55, 0.02);
    part(m.woodDark, 0.07, 0.28, 0.07, -0.62, 0.14, -0.25);
    part(m.woodDark, 0.07, 0.28, 0.07, 0.62, 0.14, -0.25);
    part(m.woodDark, 0.07, 0.28, 0.07, -0.62, 0.14, 0.25);
    part(m.woodDark, 0.07, 0.28, 0.07, 0.62, 0.14, 0.25);
    sofa.position.set(x, 0, z);
    this.group.add(sofa);
    this._addCollider(x, z, 1.8, 0.85, 0.08);

    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(0.43, 0.38, 0.09, 20),
      m.wood
    );
    table.position.set(2.15, 0.5, 0.25);
    table.castShadow = true;
    this.group.add(table);
    this._box(m.woodDark, 0.12, 0.48, 0.12, 2.15, 0.25, 0.25);
    this._addCollider(2.15, 0.25, 0.9, 0.9);
  }

  _buildTrim() {
    const m = this.assets.materials;
    const baseboard = new THREE.InstancedMesh(
      this.assets.geometries.box,
      m.woodDark,
      4
    );
    const matrix = new THREE.Matrix4();
    const placements = [
      [0, 0.13, -ROOM.depth / 2 + 0.1, ROOM.width, 0.22, 0.12],
      [0, 0.13, ROOM.depth / 2 - 0.1, ROOM.width, 0.22, 0.12],
      [-ROOM.width / 2 + 0.1, 0.13, 0, 0.12, 0.22, ROOM.depth],
      [ROOM.width / 2 - 0.1, 0.13, 0, 0.12, 0.22, ROOM.depth]
    ];
    for (let i = 0; i < placements.length; i++) {
      const [x, y, z, sx, sy, sz] = placements[i];
      matrix.compose(
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion(),
        new THREE.Vector3(sx, sy, sz)
      );
      baseboard.setMatrixAt(i, matrix);
    }
    baseboard.instanceMatrix.needsUpdate = true;
    baseboard.castShadow = false;
    this.group.add(baseboard);
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
