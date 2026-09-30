import * as THREE from 'three';
import { CAMERA, STATES, ROOM } from './constants.js';
import { GameState } from './GameState.js';
import { Input } from './Input.js';
import { Assets } from '../scene/Materials.js';
import { Room } from '../scene/Room.js';
import { Lighting } from '../scene/Lighting.js';
import { CrimeScene } from '../scene/CrimeScene.js';
import { Player } from '../player/Player.js';
import { UI } from '../ui/UI.js';

/* ============================================================
   Game — هماهنگ‌کننده اصلی (بدون God Object)
   وظیفه: ساخت renderer/scene/camera، اتصال سیستم‌ها و اجرای حلقه بازی.
   منطق هر سیستم داخل ماژول خودش است؛ اینجا فقط سیم‌کشی می‌شود.
   ============================================================ */

export class Game {
  constructor(canvas, uiRoot) {
    this.canvas = canvas;
    this.state = new GameState(STATES.LOADING);
    this.ui = new UI(uiRoot);
    this._running = false;
    this._raf = 0;
    this._clock = new THREE.Clock();

    this._initRenderer();
    this._initScene();
    this._initWorld();
    this._initPlayer();
    this._initInput();
    this._bindEvents();
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05060a);
    // مه ملایم برای عمق نوآر (بسیار سبک، بدون هزینه)
    this.scene.fog = new THREE.FogExp2(0x05060a, 0.045);

    this.camera = new THREE.PerspectiveCamera(
      CAMERA.fov,
      window.innerWidth / window.innerHeight,
      CAMERA.near,
      CAMERA.far
    );
  }

  _initWorld() {
    this.assets = new Assets();
    this.room = new Room(this.assets);
    this.scene.add(this.room.group);
    this.lighting = new Lighting(this.scene, this.room.lampPosition);
    this.crimeScene = new CrimeScene(this.assets, this.room);
    this.scene.add(this.crimeScene.group);
  }

  _initPlayer() {
    this.player = new Player(this.camera, null, this.room.colliders);
  }

  _initInput() {
    this.input = new Input(this.canvas);
    this.input.enableMouseMove();
    this.player.input = this.input;

    // خروج از قفل نشانگر ⇒ نمایش پنل توقف (حالت بازی INVESTIGATION می‌ماند
    // تا با «ادامه بررسی» بدون بازگشت به منوی اصلی برگردیم).
    this._offLock = this.input.onLockChange((locked) => {
      if (!locked && this.state.is(STATES.INVESTIGATION)) {
        this.ui.showPause();
      }
    });

    // Esc ⇒ منوی توقف
    this._offMenu = this.input.onPress('menu', () => {
      if (this.state.is(STATES.INVESTIGATION)) {
        this.input.exitLock();
      }
    });
  }

  _bindEvents() {
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);

    // شنونده تغییر حالت ⇒ همگام‌سازی UI
    this._offState = this.state.onChange((s) => this.ui.syncState(s));

    // دکمه شروع/ادامه در UI
    this.ui.onStart = () => this.startInvestigation();
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  /** پس از بارگذاری صحنه فراخوانی می‌شود */
  ready() {
    this.ui.hideLoader();
    this.state.set(STATES.MENU);
    this._running = true;
    this._clock.start();
    this._loop();
  }

  startInvestigation() {
    this.state.set(STATES.INVESTIGATION);
    this.ui.enterInvestigation(); // اطمینان از بسته‌شدن منو/توقف حتی اگر حالت تغییر نکرده باشد
    this.input.requestLock();
  }

  _loop() {
    if (!this._running) return;
    this._raf = requestAnimationFrame(() => this._loop());

    // dt محدودشده تا پرش زمانی (تب پس‌زمینه) باعث پرش نشود
    const dt = Math.min(this._clock.getDelta(), 0.05);

    if (this.state.is(STATES.INVESTIGATION)) {
      this.player.update(dt);
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this._running = false;
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    this._offLock?.();
    this._offMenu?.();
    this._offState?.();
    this.input.dispose();
    this.state.dispose();
    this.room.dispose();
    this.crimeScene.dispose();
    this.lighting.dispose();
    this.assets.dispose();
    this.renderer.dispose();
  }
}
