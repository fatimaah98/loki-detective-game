import * as THREE from 'three';
import { COLORS } from '../core/constants.js';
import { Textures } from './Textures.js';

/* ============================================================
   کتابخانه متریال و هندسه مشترک
   متریال‌ها و هندسه‌ها یک‌بار ساخته و در کل صحنه Reuse می‌شوند
   تا تعداد Draw Call و مصرف حافظه کنترل شود.
   بافت‌ها procedural (Canvas) هستند؛ بدون فایل خارجی.
   ============================================================ */

export class Assets {
  constructor() {
    this.materials = {};
    this.geometries = {};
    this._build();
  }

  _std(color, opts = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.85,
      metalness: opts.metalness ?? 0.0,
      ...opts
    });
  }

  _build() {
    const m = this.materials;

    // ---- سطوح اصلی با بافت ----
    m.floor = this._std(0xffffff, { map: Textures.parquet(), roughness: 0.7, metalness: 0.05 });
    m.wall = this._std(0xffffff, { map: Textures.woodPanel(), roughness: 0.85 });
    m.ceiling = this._std(0xffffff, { map: Textures.coffer(), roughness: 0.9 });
    m.rug = this._std(0xffffff, { map: Textures.rug(), roughness: 0.95 });
    m.cork = this._std(0xffffff, { map: Textures.cork(), roughness: 0.95 });
    m.cardboard = this._std(0xffffff, { map: Textures.cardboard(), roughness: 0.95 });
    m.mapFramed = this._std(0xffffff, { map: Textures.map(), roughness: 0.6 });

    // ---- چوب و مبلمان ----
    m.wood = this._std(COLORS.wood, { roughness: 0.7 });
    m.woodDark = this._std(COLORS.woodDark, { roughness: 0.75 });
    m.fabric = this._std(COLORS.fabric, { roughness: 1.0 });
    m.leather = this._std(COLORS.leather, { roughness: 0.55, metalness: 0.05 });
    m.deskPad = this._std(COLORS.deskPad, { roughness: 0.9 });
    m.plant = this._std(COLORS.plant, { roughness: 0.8 });

    // ---- فلز و برنج ----
    m.metal = this._std(COLORS.metal, { roughness: 0.4, metalness: 0.6 });
    m.brass = this._std(COLORS.brass, { roughness: 0.35, metalness: 0.85 });
    m.brassDark = this._std(0x2a1e0c, { roughness: 0.5, metalness: 0.6 });

    // ---- سایر ----
    m.paper = this._std(COLORS.paper, { roughness: 0.9 });
    m.rope = this._std(COLORS.rope, { roughness: 1.0 });
    m.skin = this._std(COLORS.skin, { roughness: 0.8 });
    m.cloth = this._std(COLORS.cloth, { roughness: 0.95 });
    m.clockFace = this._std(0xf0ece0, { roughness: 0.8 });
    m.dark = this._std(0x111318, { roughness: 1.0 });
    m.mug = this._std(0xe8e4dc, { roughness: 0.5 });
    m.typewriter = this._std(0x6a1410, { roughness: 0.45, metalness: 0.2 });
    m.red = this._std(0x7a1c15, { roughness: 0.8 }); // نخ قرمز تخته شواهد
    m.lampGlass = new THREE.MeshStandardMaterial({
      color: 0xffe6b0,
      emissive: 0xffcf8a,
      emissiveIntensity: 0.9,
      roughness: 0.4
    });
    m.greenShade = this._std(0x14472e, { roughness: 0.5, metalness: 0.1 });
    m.glass = new THREE.MeshStandardMaterial({
      color: COLORS.glass,
      roughness: 0.1,
      transparent: true,
      opacity: 0.28
    });

    const g = this.geometries;
    g.box = new THREE.BoxGeometry(1, 1, 1);
    g.plane = new THREE.PlaneGeometry(1, 1);
  }

  dispose() {
    for (const k in this.materials) this.materials[k].dispose();
    for (const k in this.geometries) this.geometries[k].dispose();
    Textures.dispose();
  }
}
