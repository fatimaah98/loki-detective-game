import * as THREE from 'three';
import { CAMERA, STATES, ROOM } from './constants.js';
import { GameState } from './GameState.js';
import { Input } from './Input.js';
import { Assets } from '../scene/Materials.js';
import { Room } from '../scene/Room.js';
import { Lighting } from '../scene/Lighting.js';
import { CrimeScene } from '../scene/CrimeScene.js';
import { Player } from '../player/Player.js';
import { EvidenceSystem } from '../evidence/EvidenceSystem.js';
import { TIMELINE_RECONSTRUCTION } from '../case/caseData.js';
import { Footsteps } from '../audio/Footsteps.js';
import { BackgroundMusic } from '../audio/BackgroundMusic.js';
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
    this.footsteps = new Footsteps();
    this.backgroundMusic = new BackgroundMusic();

    this._initRenderer();
    this._initScene();
    this._initWorld();
    this._initPlayer();
    this._initInput();
    this._initEvidence();
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
    this.renderer.toneMappingExposure = 1.18;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x100d0a);
    // مه کم‌تراکم برای حفظ عمق اتاق بدون پوشاندن جزئیات
    this.scene.fog = new THREE.FogExp2(0x100d0a, 0.018);

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
    this.player.onFootstep = (step) => this.footsteps.play(step);
  }

  _initInput() {
    this.input = new Input(this.canvas);
    this.input.enableMouseMove();
    this.player.input = this.input;

    // خروج از قفل نشانگر ⇒ نمایش پنل توقف (حالت بازی INVESTIGATION می‌ماند
    // تا با «ادامه بررسی» بدون بازگشت به منوی اصلی برگردیم).
    this._offLock = this.input.onLockChange((locked) => {
      if (
        !locked &&
        (this.state.is(STATES.INVESTIGATION) || this.state.is(STATES.TIMELINE) || this.state.is(STATES.SUSPECTS)) &&
        !this.ui.isEvidenceOpen() &&
        !this.ui.isJournalOpen() &&
        !this.ui.isCasePanelOpen()
      ) {
        this.ui.showPause();
      }
    });

    // Esc ⇒ منوی توقف
    this._offMenu = this.input.onPress('menu', () => {
      if (this.ui.isEndingOpen()) return;
      if (this.ui.isAccusationOpen()) {
        this.ui.closeAccusation();
        this.state.set(STATES.INVESTIGATION);
        this.input.requestLock();
        return;
      }
      if (this.ui.isCasePanelOpen()) {
        this.ui.closeCaseViews();
        this.state.set(STATES.INVESTIGATION);
        this.input.requestLock();
        return;
      }
      if (this.state.is(STATES.INVESTIGATION)) {
        this.input.exitLock();
      }
    });

    this._offInteract = this.input.onPress('interact', () => {
      if (!this.state.is(STATES.INVESTIGATION) || this.ui.isEvidenceOpen() || this.ui.isJournalOpen()) return;
      const evidence = this.evidence.inspectCurrent();
      if (!evidence) return;
      this.input.exitLock();
    });

    this._offDetective = this.input.onPress('detective', () => {
      if (
        !this.state.is(STATES.INVESTIGATION) ||
        !this.input.locked ||
        this.ui.isEvidenceOpen() ||
        this.ui.isJournalOpen()
      ) return;
      this.evidence.activateDetectiveMode();
    });

    this._offJournal = this.input.onPress('journal', () => {
      if (!this.state.is(STATES.INVESTIGATION) || this.ui.isEvidenceOpen() || this.ui.isCasePanelOpen()) return;
      const opened = this.ui.toggleJournal(this.evidence.getCollected());
      if (opened) this.input.exitLock();
      else {
        this.ui.setEvidenceTarget(this.evidence.current);
        this.input.requestLock();
      }
    });

    this._offTimeline = this.input.onPress('timeline', () => this.openCaseView('timeline'));
    this._offSuspects = this.input.onPress('suspects', () => this.openCaseView('suspects'));

    this.ui.onCloseEvidence = () => {
      this.ui.closeEvidence();
      this.ui.setEvidenceTarget(this.evidence.current);
      this.input.requestLock();
    };
    this.ui.onCloseJournal = () => {
      this.ui.toggleJournal(this.evidence.getCollected());
      this.ui.setEvidenceTarget(this.evidence.current);
      this.input.requestLock();
    };
    this.ui.onToggleJournal = () => {
      if (!this.state.is(STATES.INVESTIGATION) || this.ui.isCasePanelOpen()) return;
      const opened = this.ui.toggleJournal(this.evidence.getCollected());
      if (opened) this.input.exitLock();
      else {
        this.ui.setEvidenceTarget(this.evidence.current);
        this.input.requestLock();
      }
    };
    this.ui.onOpenCaseView = (view, suspectId) => {
      if (suspectId) this.ui.selectSuspectById(suspectId);
      this.openCaseView(view);
    };
    this.ui.onCloseCaseView = () => {
      this.ui.closeCaseViews();
      this.state.set(STATES.INVESTIGATION);
      this.ui.setEvidenceTarget(this.evidence.current);
      this.input.requestLock();
    };
    this.ui.onOpenEvidenceBoard = (evidenceId) => {
      this.ui.closeCaseViews();
      this.state.set(STATES.INVESTIGATION);
      this.ui.toggleJournal(this.evidence.getCollected());
      this.input.requestLock();
      const card = this.ui.journalList.querySelector(`[data-evidence-id="${evidenceId}"]`);
      card?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
    this.ui.onTimelineReconstructed = () => {
      this.timelineReconstructed = true;
    };
    this.ui.onOpenAccusation = () => this.openAccusation();
    this.ui.onCloseAccusation = () => {
      this.ui.closeAccusation();
      this.state.set(STATES.INVESTIGATION);
      this.input.requestLock();
    };
    this.ui.onSubmitAccusation = (accusation) => this.submitAccusation(accusation);
    this.ui.onReturnToBoard = () => {
      this.ui.closeEnding();
      this.ui.toggleJournal(this.evidence.getCollected());
      this.state.set(STATES.INVESTIGATION);
      this.ui.enterInvestigation();
      this.input.exitLock();
    };
    this.ui.onRetryAccusation = () => this.openAccusation();
    this.ui.onCloseEnding = () => {
      this.ui.closeEnding();
      this.state.set(STATES.INVESTIGATION);
      this.ui.enterInvestigation();
      this.input.exitLock();
    };
  }

  openCaseView(view) {
    if (!this.state.is(STATES.INVESTIGATION) || this.ui.isEvidenceOpen()) return;
    this.ui.showCaseView(view, this.evidence.getCollected());
    this.input.exitLock();
    this.state.set(view === 'timeline' ? STATES.TIMELINE : STATES.SUSPECTS);
  }

  openAccusation() {
    const allowedStates = [STATES.INVESTIGATION, STATES.TIMELINE, STATES.SUSPECTS];
    if (!this.timelineReconstructed || !allowedStates.some((state) => this.state.is(state))) return;
    this.ui.showAccusation(this.evidence.getCollected(), this.timelineReconstructed);
    this.state.set(STATES.ACCUSATION);
    this.input.exitLock();
  }

  submitAccusation({ suspectId, proofIds }) {
    if (!this.state.is(STATES.ACCUSATION)) return;
    const requiredProof = ['button', 'contract', 'message', 'timeline', 'footprints'];
    const collectedIds = new Set(this.evidence.getCollected().map((item) => item.id));
    const evidenceProof = requiredProof
      .filter((proofId) => proofId !== 'timeline')
      .every((proofId) => collectedIds.has(proofId));
    const allSelected = requiredProof.every((proofId) => proofIds.includes(proofId));
    const solved = suspectId === 'daniel' && this.timelineReconstructed && evidenceProof && allSelected;
    this.lastAccusationSolved = solved;
    this.state.set(solved ? STATES.SOLVED : STATES.FAILED);
  }

  _initEvidence() {
    this.evidence = new EvidenceSystem({
      scene: this.scene,
      camera: this.camera,
      player: this.player,
      room: this.room,
      crimeScene: this.crimeScene,
      onTarget: (evidence) => this.ui.setEvidenceTarget(evidence),
      onInspect: (evidence, count) => this.ui.showEvidence(evidence, count, this.evidence.getCollected()),
      onDetectiveMode: (active, duration) => this.ui.setDetectiveMode(active, duration)
    });
  }

  _bindEvents() {
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);

    // شنونده تغییر حالت ⇒ همگام‌سازی UI
    this._offState = this.state.onChange((s) => {
      this.ui.syncState(s);
      if (s === STATES.SOLVED || s === STATES.FAILED) {
        this.ui.showEnding(this.lastAccusationSolved, TIMELINE_RECONSTRUCTION);
      }
    });

    // دکمه شروع/ادامه در UI
    this.ui.onStart = () => this.startInvestigation();
    this.ui.onIntroContinue = () => this.continueFromIntro();
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
    this.footsteps.unlock();
    if (this.state.is(STATES.MENU)) {
      this.state.set(STATES.INTRO);
      return;
    }
    this._enterInvestigation();
  }

  continueFromIntro() {
    if (!this.state.is(STATES.INTRO)) return;
    this.footsteps.unlock();
    this.backgroundMusic.play();
    this.input.requestLock();
    this.ui.dismissIntro(() => this._enterInvestigation());
  }

  _enterInvestigation() {
    this.state.set(STATES.INVESTIGATION);
    this.ui.enterInvestigation(); // اطمینان از بسته‌شدن منو/توقف حتی اگر حالت تغییر نکرده باشد
    this.input.requestLock();
  }

  _loop() {
    if (!this._running) return;
    this._raf = requestAnimationFrame(() => this._loop());

    // dt محدودشده تا پرش زمانی (تب پس‌زمینه) باعث پرش نشود
    const dt = Math.min(this._clock.getDelta(), 0.05);

    if (this.state.is(STATES.INVESTIGATION) || this.state.is(STATES.TIMELINE) || this.state.is(STATES.SUSPECTS)) {
      if (!this.ui.isEvidenceOpen() && !this.ui.isJournalOpen() && this.input.locked) {
        this.player.update(dt);
      }
      if (this.state.is(STATES.INVESTIGATION)) this.evidence.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this._running = false;
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    this._offLock?.();
    this._offMenu?.();
    this._offInteract?.();
    this._offDetective?.();
    this._offJournal?.();
    this._offTimeline?.();
    this._offSuspects?.();
    this._offState?.();
    this.evidence.dispose();
    this.footsteps.dispose();
    this.backgroundMusic.dispose();
    this.input.dispose();
    this.state.dispose();
    this.room.dispose();
    this.crimeScene.dispose();
    this.lighting.dispose();
    this.assets.dispose();
    this.renderer.dispose();
  }
}
