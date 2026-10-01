import { STATES } from '../core/constants.js';
import { ACCUSATION_REQUIREMENTS, EVIDENCE_LABELS, SUSPECTS, TIMELINE_EVENTS, TIMELINE_RECONSTRUCTION } from '../case/caseData.js';

/* ============================================================
   مدیریت رابط کاربری (DOM)
   - صفحه بارگذاری
   - منوی اصلی + معرفی کنترل‌ها (فارسی، RTL)
   - نشانگر مرکز و پیام راهنمای HUD
   UI مستقل از منطق سه‌بعدی است و از طریق callback با بازی حرف می‌زند.
   ============================================================ */

export class UI {
  constructor(root) {
    this.root = root;
    this.onStart = null; // callback شروع بازی
    this._build();
  }

  _build() {
    this.root.innerHTML = `
      <div class="loader" id="loader">
        <div class="spinner"></div>
        <div class="label">در حال بارگذاری پرونده…</div>
      </div>

      <div class="crosshair hidden" id="crosshair"></div>

      <button class="journal-toggle hidden" id="journal-toggle" type="button">دفتر شواهد <span>J</span></button>
      <nav class="case-nav hidden" id="case-nav" aria-label="پرونده">
        <button type="button" data-case-view="timeline">خط زمانی</button>
        <button type="button" data-case-view="suspects">مظنون‌ها</button>
      </nav>
      <div class="evidence-prompt hidden" id="evidence-prompt">بررسی <kbd>E</kbd></div>
      <div class="detective-status hidden" id="detective-status">حالت کارآگاه <span id="detective-timer"></span></div>

      <div class="evidence-detail hidden" id="evidence-detail" role="dialog" aria-modal="true" aria-labelledby="evidence-title">
        <div class="evidence-detail-panel">
          <div class="story-kicker" id="evidence-number">شاهد پرونده</div>
          <h2 class="evidence-title" id="evidence-title"></h2>
          <p class="evidence-description" id="evidence-description"></p>
          <div class="evidence-actions">
            <span class="evidence-count" id="evidence-count"></span>
            <button class="btn evidence-close" id="evidence-close" type="button">بازگشت به بررسی</button>
          </div>
        </div>
      </div>

      <aside class="evidence-journal hidden" id="evidence-journal" aria-label="دفتر شواهد">
        <header class="journal-header">
          <div>
            <div class="story-kicker">پرونده: اتاق خاموش</div>
            <h2>شواهد پرونده</h2>
          </div>
          <button class="journal-close" id="journal-close" type="button" aria-label="بستن دفتر">×</button>
        </header>
        <p class="journal-progress" id="journal-progress">۰ از ۱۰ شاهد بررسی شده</p>
        <p class="journal-hint">برای پیوند، دو مورد را انتخاب کنید.</p>
        <div class="journal-list" id="journal-list"></div>
        <section class="relation-result hidden" id="relation-result" aria-live="polite"></section>
        <button class="relation-clear hidden" id="relation-clear" type="button">پاک‌کردن انتخاب‌ها</button>
        <button class="btn accusation-start" id="accusation-start" type="button" disabled>پایان بررسی و شناسایی قاتل</button>
      </aside>

      <section class="case-panel hidden" id="timeline-panel" aria-labelledby="timeline-title">
        <header class="journal-header">
          <div><div class="story-kicker">پرونده: اتاق خاموش</div><h2 id="timeline-title">خط زمانی پرونده</h2></div>
          <button class="journal-close" type="button" data-close-case aria-label="بستن">×</button>
        </header>
        <div class="timeline-tabs" role="tablist">
          <button class="active" type="button" data-timeline-mode="official">روایت اولیه</button>
          <button type="button" data-timeline-mode="reconstructed">بازسازی کارآگاه</button>
        </div>
        <p class="case-panel-hint" id="timeline-hint">گفته‌ها و ثبت‌های موجود را کنار هم بسنجید.</p>
        <div class="timeline-list" id="timeline-list"></div>
      </section>

      <section class="case-panel suspects-panel hidden" id="suspects-panel" aria-labelledby="suspects-title">
        <header class="journal-header">
          <div><div class="story-kicker">پرونده: اتاق خاموش</div><h2 id="suspects-title">پرونده مظنون‌ها</h2></div>
          <button class="journal-close" type="button" data-close-case aria-label="بستن">×</button>
        </header>
        <div class="suspect-layout">
          <nav class="suspect-list" id="suspect-list" aria-label="انتخاب مظنون"></nav>
          <article class="suspect-detail" id="suspect-detail"></article>
        </div>
      </section>

      <section class="case-panel accusation-panel hidden" id="accusation-panel" aria-labelledby="accusation-title">
        <header class="journal-header">
          <div><div class="story-kicker">جمع‌بندی پرونده</div><h2 id="accusation-title">قاتل را شناسایی کنید</h2></div>
          <button class="journal-close" type="button" data-close-accusation aria-label="بازگشت">×</button>
        </header>
        <p class="case-panel-hint">یک مظنون و تمام شواهد لازم برای اثبات اتهام را انتخاب کنید.</p>
        <div class="accusation-suspects" id="accusation-suspects"></div>
        <h3 class="proof-heading">شواهد اثباتی</h3>
        <div class="proof-list" id="proof-list"></div>
        <p class="proof-status" id="proof-status" aria-live="polite"></p>
        <button class="btn accuse-submit" id="accuse-submit" type="button" disabled>ثبت اتهام</button>
      </section>

      <section class="case-panel ending-panel hidden" id="ending-panel" aria-labelledby="ending-title">
        <div class="story-kicker" id="ending-kicker">نتیجه پرونده</div>
        <h2 id="ending-title"></h2>
        <p class="ending-copy" id="ending-copy"></p>
        <div class="true-timeline hidden" id="true-timeline">
          <h3>خط زمانی واقعی قتل</h3>
          <ol id="true-timeline-list"></ol>
        </div>
        <div class="ending-actions" id="failed-actions">
          <button class="btn" id="return-board" type="button">بازگشت به Evidence Board</button>
          <button class="btn ghost" id="retry-accusation" type="button">تلاش دوباره</button>
        </div>
        <button class="btn ending-close hidden" id="ending-close" type="button">بازگشت به صحنه</button>
      </section>

      <div class="story-overlay hidden" id="story-intro" role="dialog" aria-modal="true" aria-labelledby="story-title">
        <div class="story-panel">
          <h1 class="story-title" id="story-title">اتاق خاموش</h1>
          <div class="story-kicker">افسر جان میلتون: گزارش اولیه پرونده</div>
          <p class="story-copy">
            النا وودز، زن 33 ساله اهل ایالت ایلینوی، در اقدامی شوکه کننده دست به خودکشی زده.
            جسد وی درحالی که از سقف آویزان شده توسط نامزدش، دیوید میلر، یافت شد.
          </p>
          <div class="story-kicker">دکتر توماس کالاهان: </div>
          <p>
            ساعت احتمالی مرگ 11:45 تا 12:30 بامداد. شواهد اولیه نشان می‌دهد که مرگ ناشی از خودکشی است.
          </p>
          <button class="btn story-continue" id="intro-continue">ورود به اتاق</button>
        </div>
      </div>

      <div class="overlay" id="menu">
        <div class="panel">
          <div class="title">کارآگاه لوکی</div>
          <div class="subtitle">پرونده: اتاق خاموش</div>

          <p style="color:var(--c-text-dim); line-height:2; font-size:0.98rem;">
            نیمه‌شب است و باران می‌بارد. زنی به نام «النا وودز» در اتاق کارش
            جان باخته و صحنه در نگاه اول شبیه خودکشی است. وارد اتاق شوید،
            با دقت همه‌چیز را بررسی کنید و حقیقت را پیدا کنید.
          </p>

          <div class="rule"></div>

          <ul class="controls-list">
            <li><span>حرکت</span> <span class="key">W A S D</span></li>
            <li><span>نگاه کردن</span> <span class="key">ماوس</span></li>
            <li><span>بررسی</span> <span class="key">E</span></li>
            <li><span>حالت کارآگاه</span> <span class="key">Space</span></li>
            <li><span>دفتر شواهد</span> <span class="key">J</span></li>
            <li><span>منو</span> <span class="key">Esc</span></li>
            <li><span>شروع</span> <span class="key">کلیک</span></li>
          </ul>

          <button class="btn" id="start-btn">ورود به صحنه جرم</button>
          <p class="hint">برای چرخاندن دوربین، پس از شروع روی صفحه کلیک کنید.</p>
        </div>
      </div>

      <div class="overlay hidden" id="pause">
        <div class="panel">
          <div class="title" style="font-size:1.8rem;">توقف</div>
          <div class="subtitle">بازی متوقف شده است.</div>
          <div class="rule"></div>
          <button class="btn" id="resume-btn">ادامه بررسی</button>
        </div>
      </div>
    `;

    this.loader = this.root.querySelector('#loader');
    this.crosshair = this.root.querySelector('#crosshair');
    this.evidencePrompt = this.root.querySelector('#evidence-prompt');
    this.evidenceDetail = this.root.querySelector('#evidence-detail');
    this.journal = this.root.querySelector('#evidence-journal');
    this.journalList = this.root.querySelector('#journal-list');
    this.journalProgress = this.root.querySelector('#journal-progress');
    this.relationResult = this.root.querySelector('#relation-result');
    this.relationClear = this.root.querySelector('#relation-clear');
    this.detectiveStatus = this.root.querySelector('#detective-status');
    this.detectiveTimer = this.root.querySelector('#detective-timer');
    this.selectedEvidence = [];
    this._detectiveInterval = 0;
    this.timelinePanel = this.root.querySelector('#timeline-panel');
    this.suspectsPanel = this.root.querySelector('#suspects-panel');
    this.accusationPanel = this.root.querySelector('#accusation-panel');
    this.endingPanel = this.root.querySelector('#ending-panel');
    this.caseNav = this.root.querySelector('#case-nav');
    this.timelineMode = 'official';
    this.selectedSuspect = 'david';
    this.collectedEvidence = [];
    this.selectedAccusationSuspect = null;
    this.selectedProof = new Set();
    this.timelineReconstructed = false;
    this.onCloseEvidence = null;
    this.onCloseJournal = null;
    this.storyIntro = this.root.querySelector('#story-intro');
    this.menu = this.root.querySelector('#menu');
    this.pause = this.root.querySelector('#pause');

    this.root.querySelector('#start-btn').addEventListener('click', () => {
      this.onStart?.();
    });
    this.root.querySelector('#resume-btn').addEventListener('click', () => {
      this.onStart?.();
    });
    this.root.querySelector('#intro-continue').addEventListener('click', () => {
      this.onIntroContinue?.();
    });
    this.root.querySelector('[data-close-accusation]').addEventListener('click', () => this.onCloseAccusation?.());
    this.root.querySelector('#accusation-suspects').addEventListener('click', (event) => {
      const button = event.target.closest('[data-accused-id]');
      if (button) this.selectAccused(button.dataset.accusedId);
    });
    this.root.querySelector('#proof-list').addEventListener('change', (event) => {
      const input = event.target.closest('[data-proof-id]');
      if (input) this.toggleProof(input.dataset.proofId, input.checked);
    });
    this.root.querySelector('#accuse-submit').addEventListener('click', () => this.onSubmitAccusation?.({
      suspectId: this.selectedAccusationSuspect,
      proofIds: [...this.selectedProof]
    }));
    this.root.querySelector('#return-board').addEventListener('click', () => this.onReturnToBoard?.());
    this.root.querySelector('#retry-accusation').addEventListener('click', () => this.onRetryAccusation?.());
    this.root.querySelector('#ending-close').addEventListener('click', () => this.onCloseEnding?.());
    this.root.querySelector('#accusation-start').addEventListener('click', () => this.onOpenAccusation?.());
    this.root.querySelector('#evidence-close').addEventListener('click', () => this.onCloseEvidence?.());
    this.root.querySelector('#journal-close').addEventListener('click', () => this.onCloseJournal?.());
    this.root.querySelector('#journal-toggle').addEventListener('click', () => this.onToggleJournal?.());
    this.caseNav.addEventListener('click', (event) => {
      const button = event.target.closest('[data-case-view]');
      if (button) this.onOpenCaseView?.(button.dataset.caseView);
    });
    this.root.querySelectorAll('[data-close-case]').forEach((button) => {
      button.addEventListener('click', () => this.onCloseCaseView?.());
    });
    this.root.querySelector('.timeline-tabs').addEventListener('click', (event) => {
      const button = event.target.closest('[data-timeline-mode]');
      if (button) this.setTimelineMode(button.dataset.timelineMode);
    });
    this.root.querySelector('#suspect-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-suspect-id]');
      if (button) this.selectSuspect(button.dataset.suspectId);
    });
    this.root.querySelector('#timeline-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-evidence-link]');
      if (button) this.onOpenEvidenceBoard?.(button.dataset.evidenceLink);
    });
    this.journalList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-suspect-view]');
      if (button) this.onOpenCaseView?.('suspects', button.dataset.suspectView);
    });
    this.journalList.addEventListener('click', (event) => {
      const item = event.target.closest('[data-evidence-id]');
      if (item) this._toggleEvidenceSelection(item.dataset.evidenceId);
    });
    this.relationClear.addEventListener('click', () => {
      this.selectedEvidence = [];
      this._updateSelectedEvidence();
    });
  }

  hideLoader() {
    this.loader.classList.add('done');
    setTimeout(() => {
      this.loader.style.display = 'none';
    }, 650);
  }

  showMenu() {
    this.menu.classList.remove('hidden');
    this.pause.classList.add('hidden');
    this.crosshair.classList.add('hidden');
  }

  showPause() {
    this.pause.classList.remove('hidden');
    this.crosshair.classList.add('hidden');
  }

  enterInvestigation() {
    this.menu.classList.add('hidden');
    this.pause.classList.add('hidden');
    this.crosshair.classList.remove('hidden');
    this.root.querySelector('#journal-toggle').classList.remove('hidden');
    this.caseNav.classList.remove('hidden');
  }

  showCaseView(view, collected) {
    this.closeCaseViews();
    this.journal.classList.add('hidden');
    this.collectedEvidence = collected;
    this.evidencePrompt.classList.add('hidden');
    if (view === 'timeline') {
      this.timelinePanel.classList.remove('hidden');
      this.renderTimeline();
    } else if (view === 'suspects') {
      this.suspectsPanel.classList.remove('hidden');
      this.renderSuspects();
    }
  }

  closeCaseViews() {
    this.timelinePanel.classList.add('hidden');
    this.suspectsPanel.classList.add('hidden');
  }

  closeAccusation() {
    this.accusationPanel.classList.add('hidden');
  }

  isCasePanelOpen() {
    return !this.timelinePanel.classList.contains('hidden') || !this.suspectsPanel.classList.contains('hidden');
  }

  renderTimeline() {
    const reconstructed = this.timelineMode === 'reconstructed';
    const source = reconstructed ? TIMELINE_RECONSTRUCTION : TIMELINE_EVENTS;
    const collectedIds = new Set(this.collectedEvidence.map((item) => item.id));
    this.root.querySelector('#timeline-hint').textContent = reconstructed
      ? 'بازسازی بر پایه شواهد پیدا‌شده؛ زمان دقیق خروج سارا همچنان قطعی نیست.'
      : 'این روایت اولیه است؛ موارد ناسازگار با شواهد را بررسی کنید.';
    if (reconstructed && !this.timelineReconstructed) {
      this.timelineReconstructed = true;
      this.onTimelineReconstructed?.();
      const accusationStart = this.root.querySelector('#accusation-start');
      accusationStart.disabled = false;
      accusationStart.title = '';
    }
    this.root.querySelectorAll('[data-timeline-mode]').forEach((button) => {
      button.classList.toggle('active', button.dataset.timelineMode === this.timelineMode);
    });
    this.root.querySelector('#timeline-list').innerHTML = source.map((item) => {
      const linkedIds = item.evidenceIds || (item.evidenceId ? [item.evidenceId] : []);
      const verified = linkedIds.length > 0 && linkedIds.every((id) => collectedIds.has(id));
      const kind = item.kind || 'reconstruction';
      return `
        <article class="timeline-event ${verified ? 'verified' : ''} ${kind}">
          <time>${item.time}</time>
          <div class="timeline-event-copy"><h3>${item.label}</h3><p>${item.detail || (verified ? 'این رویداد با شواهد بررسی‌شده پشتیبانی می‌شود.' : 'برای سنجش این رویداد، شواهد مرتبط را پیدا کنید.')}</p>
          ${linkedIds.length ? `<div class="timeline-evidence-links">${linkedIds.map((id) => `<button type="button" data-evidence-link="${id}" ${collectedIds.has(id) ? '' : 'disabled'}>${EVIDENCE_LABELS[id] || id}</button>`).join('')}</div>` : ''}</div>
        </article>`;
    }).join('');
  }

  setTimelineMode(mode) {
    this.timelineMode = mode;
    this.renderTimeline();
  }

  renderSuspects() {
    const collectedIds = new Set(this.collectedEvidence.map((item) => item.id));
    this.root.querySelector('#suspect-list').innerHTML = SUSPECTS.map((suspect) => `
      <button class="suspect-select${suspect.id === this.selectedSuspect ? ' active' : ''}" type="button" data-suspect-id="${suspect.id}" aria-pressed="${suspect.id === this.selectedSuspect}">
        <span class="suspect-avatar" style="--suspect-color:${suspect.color}">${suspect.initials}</span>
        <span><strong>${suspect.name}</strong><small>${suspect.age} ساله</small></span>
      </button>`).join('');
    const suspect = SUSPECTS.find((item) => item.id === this.selectedSuspect) || SUSPECTS[0];
    const related = suspect.compareIds.map((id) => ({ id, found: collectedIds.has(id) }));
    this.root.querySelector('#suspect-detail').innerHTML = `
      <div class="suspect-profile">
        <div class="suspect-portrait" style="--suspect-color:${suspect.color}"><span>${suspect.initials}</span></div>
        <div><h3>${suspect.name}</h3><p>${suspect.age} ساله · ${suspect.relation}</p></div>
      </div>
      <section class="dossier-block"><h4>اظهارات</h4><p>«${suspect.statement}»</p></section>
      <section class="dossier-block"><h4>اطلاعات پرونده</h4><p>${suspect.dossier}</p></section>
      <section class="dossier-block red-herring"><h4>سرنخ‌های گمراه‌کننده</h4><p>${suspect.redHerring}</p></section>
      <section class="dossier-block"><h4>مقایسه با شواهد</h4><div class="suspect-evidence-list">${related.map((item) => `<span class="suspect-evidence${item.found ? ' found' : ''}">${EVIDENCE_LABELS[item.id] || item.id}${item.found ? ' · بررسی‌شده' : ' · پیدا نشده'}</span>`).join('')}</div></section>`;
    this.root.querySelectorAll('[data-suspect-id]').forEach((button) => {
      button.classList.toggle('active', button.dataset.suspectId === this.selectedSuspect);
      button.setAttribute('aria-pressed', String(button.dataset.suspectId === this.selectedSuspect));
    });
  }

  selectSuspect(id) {
    this.selectedSuspect = id;
    this.renderSuspects();
  }

  selectSuspectById(id) {
    if (SUSPECTS.some((suspect) => suspect.id === id)) this.selectedSuspect = id;
  }

  showAccusation(collected, timelineReconstructed) {
    this.closeCaseViews();
    this.journal.classList.add('hidden');
    this.evidenceDetail.classList.add('hidden');
    this.endingPanel.classList.add('hidden');
    this.accusationPanel.classList.remove('hidden');
    this.collectedEvidence = collected;
    this.timelineReconstructed = timelineReconstructed;
    this.selectedAccusationSuspect = null;
    this.selectedProof.clear();
    this.renderAccusation();
  }

  renderAccusation() {
    this.root.querySelector('#accusation-suspects').innerHTML = SUSPECTS.map((suspect) => `
      <button class="accusation-suspect${suspect.id === this.selectedAccusationSuspect ? ' selected' : ''}" type="button" data-accused-id="${suspect.id}" aria-pressed="${suspect.id === this.selectedAccusationSuspect}">
        <span class="suspect-avatar" style="--suspect-color:${suspect.color}">${suspect.initials}</span>
        <span><strong>${suspect.name}</strong><small>${suspect.age} ساله · ${suspect.relation}</small></span>
      </button>`).join('');

    const collectedIds = new Set(this.collectedEvidence.map((item) => item.id));
    this.root.querySelector('#proof-list').innerHTML = ACCUSATION_REQUIREMENTS.map((proof) => {
      const available = proof.sourceId ? collectedIds.has(proof.sourceId) : this.timelineReconstructed;
      const selected = this.selectedProof.has(proof.id);
      const hint = available ? 'آماده ارائه' : (proof.id === 'timeline' ? 'ابتدا بازسازی Timeline را ببینید' : 'ابتدا شاهد را در صحنه بررسی کنید');
      return `<label class="proof-option${available ? '' : ' unavailable'}${selected ? ' selected' : ''}">
        <input type="checkbox" data-proof-id="${proof.id}" ${available ? '' : 'disabled'} ${selected ? 'checked' : ''}>
        <span class="proof-check"></span><span>${proof.label}</span><small>${hint}</small>
      </label>`;
    }).join('');
    this._updateAccusationStatus();
  }

  selectAccused(id) {
    this.selectedAccusationSuspect = id;
    this.renderAccusation();
  }

  toggleProof(id, checked) {
    if (checked) this.selectedProof.add(id);
    else this.selectedProof.delete(id);
    this.renderAccusation();
  }

  _updateAccusationStatus() {
    const submit = this.root.querySelector('#accuse-submit');
    const status = this.root.querySelector('#proof-status');
    const hasAllProof = this.selectedProof.size === ACCUSATION_REQUIREMENTS.length;
    submit.disabled = !this.selectedAccusationSuspect || !hasAllProof;
    status.textContent = `${this.selectedProof.size} از ${ACCUSATION_REQUIREMENTS.length} مدرک انتخاب شده`;
  }

  showEnding(solved, actualTimeline) {
    this.accusationPanel.classList.add('hidden');
    this.endingPanel.classList.remove('hidden');
    this.root.querySelector('#ending-title').textContent = solved ? 'پرونده حل شد' : 'پرونده هنوز حل نشده است';
    this.root.querySelector('#ending-kicker').textContent = solved ? 'حقیقت آشکار شد' : 'اتهام با شواهد کافی پشتیبانی نشد';
    this.root.querySelector('#ending-copy').textContent = solved
      ? 'دنیل رید، شریک تجاری النا، او را پس از تهدید به افشای اختلاس به قتل رساند و صحنه را شبیه خودکشی جلوه داد.'
      : 'مظنون انتخاب‌شده قاتل نیست. می‌توانید به Evidence Board برگردید و با بررسی شواهد دوباره تلاش کنید.';
    this.root.querySelector('#true-timeline').classList.toggle('hidden', !solved);
    this.root.querySelector('#true-timeline-list').innerHTML = solved
      ? actualTimeline.map((item) => `<li><time>${item.time}</time><span>${item.label}</span></li>`).join('')
      : '';
    this.root.querySelector('#failed-actions').classList.toggle('hidden', solved);
    this.root.querySelector('#ending-close').classList.toggle('hidden', !solved);
    this.root.querySelector('#journal-toggle').classList.add('hidden');
    this.caseNav.classList.add('hidden');
  }

  closeEnding() {
    this.endingPanel.classList.add('hidden');
    this.root.querySelector('#journal-toggle').classList.remove('hidden');
    this.caseNav.classList.remove('hidden');
  }

  isAccusationOpen() {
    return !this.accusationPanel.classList.contains('hidden');
  }

  isEndingOpen() {
    return !this.endingPanel.classList.contains('hidden');
  }

  setEvidenceTarget(evidence) {
    if (!evidence || this.evidenceDetail.classList.contains('open') || !this.journal.classList.contains('hidden')) {
      this.evidencePrompt.classList.add('hidden');
      return;
    }
    this.evidencePrompt.textContent = '';
    this.evidencePrompt.append('بررسی ');
    const key = document.createElement('kbd');
    key.textContent = 'E';
    this.evidencePrompt.append(key);
    this.evidencePrompt.classList.remove('hidden');
  }

  showEvidence(evidence, collectedCount, collected) {
    this.evidencePrompt.classList.add('hidden');
    this.root.querySelector('#evidence-number').textContent = `شاهد ${String(collectedCount).padStart(2, '۰')} از ۱۰`;
    this.root.querySelector('#evidence-title').textContent = evidence.title;
    this.root.querySelector('#evidence-description').textContent = evidence.description;
    this.root.querySelector('#evidence-count').textContent = `${collectedCount} از ۱۰ شاهد ثبت شد`;
    this.evidenceDetail.classList.remove('hidden');
    requestAnimationFrame(() => this.evidenceDetail.classList.add('open'));
    this.renderJournal(collected);
  }

  setDetectiveMode(active, duration = 0) {
    window.clearInterval(this._detectiveInterval);
    if (!active) {
      this.detectiveStatus.classList.add('hidden');
      return;
    }
    const endsAt = performance.now() + duration;
    const updateTimer = () => {
      const seconds = Math.max(0, Math.ceil((endsAt - performance.now()) / 1000));
      this.detectiveTimer.textContent = new Intl.NumberFormat('fa-IR').format(seconds);
      if (seconds === 0) window.clearInterval(this._detectiveInterval);
    };
    this.detectiveStatus.classList.remove('hidden');
    updateTimer();
    this._detectiveInterval = window.setInterval(updateTimer, 200);
  }

  closeEvidence() {
    this.evidenceDetail.classList.remove('open');
    this.evidenceDetail.classList.add('hidden');
  }

  toggleJournal(collected) {
    const opening = this.journal.classList.contains('hidden');
    if (opening) {
      this.renderJournal(collected);
      this.journal.classList.remove('hidden');
      this.evidencePrompt.classList.add('hidden');
    } else {
      this.journal.classList.add('hidden');
    }
    return opening;
  }

  renderJournal(collected) {
    const collectedIds = new Set(collected.map((item) => item.id));
    this.selectedEvidence = this.selectedEvidence.filter((id) => id.endsWith('-claim') || collectedIds.has(id));
    this.journalProgress.textContent = `${collected.length} از ۱۰ شاهد بررسی شده`;
    const cards = collected.map((evidence, index) => `
      <button class="journal-item${this.selectedEvidence.includes(evidence.id) ? ' selected' : ''}" type="button" data-evidence-id="${evidence.id}" aria-pressed="${this.selectedEvidence.includes(evidence.id)}">
        <span class="journal-index">${String(index + 1).padStart(2, '۰')}</span>
        <span class="journal-item-copy"><strong>${evidence.title}</strong><span>${evidence.description}</span></span>
      </button>
    `);
    cards.push(...SUSPECTS.map((suspect) => `
      <button class="journal-item statement-item${this.selectedEvidence.includes(`${suspect.id}-claim`) ? ' selected' : ''}" type="button" data-evidence-id="${suspect.id}-claim" aria-pressed="${this.selectedEvidence.includes(`${suspect.id}-claim`)}">
        <span class="journal-index">!</span>
        <span class="journal-item-copy"><strong>اظهار ${suspect.name}: ${suspect.relation}</strong><span>${suspect.statement}</span></span>
      </button>
    `));
    cards.push(...SUSPECTS.map((suspect) => `
      <button class="journal-item suspect-link" type="button" data-suspect-view="${suspect.id}">
        <span class="journal-index">?</span>
        <span class="journal-item-copy"><strong>پرونده ${suspect.name}</strong><span>اظهارات و شواهد مرتبط را مقایسه کنید.</span></span>
      </button>`));
    if (!collected.length) cards.unshift('<p class="journal-empty">هنوز هیچ شاهدی ثبت نشده است.</p>');
    this.journalList.innerHTML = cards.join('');
    const accusationStart = this.root.querySelector('#accusation-start');
    accusationStart.disabled = false;
    accusationStart.title = '';
    this._updateSelectedEvidence();
  }

  _toggleEvidenceSelection(id) {
    if (this.selectedEvidence.includes(id)) {
      this.selectedEvidence = this.selectedEvidence.filter((selected) => selected !== id);
    } else if (this.selectedEvidence.length < 2) {
      this.selectedEvidence.push(id);
    } else {
      this.selectedEvidence = [this.selectedEvidence[1], id];
    }
    this._updateSelectedEvidence();
  }

  _updateSelectedEvidence() {
    for (const item of this.journalList.querySelectorAll('[data-evidence-id]')) {
      const selected = this.selectedEvidence.includes(item.dataset.evidenceId);
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    }
    const selected = this.selectedEvidence;
    this.relationClear.classList.toggle('hidden', selected.length === 0);
    if (selected.length !== 2) {
      this.relationResult.classList.add('hidden');
      return;
    }
    const titles = new Map([...this.journalList.querySelectorAll('[data-evidence-id]')].map((item) => [
      item.dataset.evidenceId,
      item.querySelector('strong')?.textContent || ''
    ]));
    const pair = new Set(selected);
    let result = `این دو مورد را کنار هم بگذارید: «${titles.get(selected[0])}» و «${titles.get(selected[1])}». این ارتباط را با زمان‌بندی و گفته‌های افراد مقایسه کنید.`;
    if (pair.has('button') && pair.has('daniel-claim')) {
      result = 'دنیل ادعا کرده که هرگز وارد خانه نشده است، اما دکمه لباس او در محل حادثه پیدا شده است.';
    } else if (pair.has('footprints') && pair.has('daniel-claim')) {
      result = 'رد حضور در اتاق با انکار دنیل ناسازگار است؛ زمان دقیق ورود باید با ثبت دوربین و ساعت متوقف‌شده سنجیده شود.';
    } else if (pair.has('camera') && pair.has('david-claim')) {
      result = 'دوربین خروج دیوید را در ۲۱:۴۷ ثبت کرده است؛ این زمان با گفته او که حدود ۲۱:۴۵ خارج شده بود، اختلافی کوتاه و قابل‌توضیح دارد.';
    } else if (pair.has('footprints') && pair.has('sara-claim')) {
      result = 'ردها حضور فردی را در اتاق ثابت می‌کنند، نه هویت او را؛ زمان خروج نامشخص سارا به‌تنهایی این رد را به او وصل نمی‌کند.';
    } else if (pair.has('contract') && pair.has('message')) {
      result = 'قرارداد، دستکاری مالی در شرکت را نشان می‌دهد؛ پیام آخر النا با قرار رویارویی همان شب سازگار است و برای دنیل انگیزه می‌سازد.';
    } else if (pair.has('clock') && pair.has('camera')) {
      result = 'زمان ثبت‌شده دوربین را با ساعت متوقف‌شده روی ۲۱:۵۲ مقایسه کنید؛ این دو سرنخ می‌توانند ترتیب رویدادها را روشن کنند.';
    } else if (pair.has('glasses') && pair.has('body')) {
      result = 'دو لیوان از حضور یک ملاقات‌کننده خبر می‌دهند؛ این نکته با تصویری که صحنه خودکشی نشان می‌دهد کاملاً جور نیست.';
    } else if (pair.has('glasses') && pair.has('contract')) {
      result = 'اختلاف مالی سارا او را مشکوک می‌کند، اما لیوان دوم فقط وجود یک ملاقات را ثابت می‌کند؛ به‌تنهایی هویت مهمان را مشخص نمی‌کند.';
    } else if (pair.has('camera') && pair.has('glasses')) {
      result = 'ثبت خروج دیوید در ۲۱:۴۷ با گفته او هم‌خوان است؛ لیوان دوم از دیداری پیش از آن خبر می‌دهد، نه حضور او هنگام قتل.';
    } else if (pair.has('footprints') && pair.has('camera')) {
      result = 'رد حضور داخل اتاق در کنار ثبت‌های بیرونی نشان می‌دهد فردی پس از خروج دیوید وارد شده است؛ ادعای عدم حضور دنیل زیر سؤال می‌رود.';
    }
    this.relationResult.textContent = result;
    this.relationResult.classList.remove('hidden');
  }

  isEvidenceOpen() {
    return !this.evidenceDetail.classList.contains('hidden');
  }

  isJournalOpen() {
    return !this.journal.classList.contains('hidden');
  }

  showIntro() {
    this.menu.classList.add('hidden');
    this.pause.classList.add('hidden');
    this.crosshair.classList.add('hidden');
    this.storyIntro.classList.remove('hidden', 'leaving');
  }

  dismissIntro(onComplete) {
    this.storyIntro.classList.add('leaving');
    setTimeout(() => {
      this.storyIntro.classList.add('hidden');
      this.storyIntro.classList.remove('leaving');
      onComplete?.();
    }, 750);
  }

  /** واکنش به تغییر حالت بازی */
  syncState(state) {
    if (state === STATES.MENU) this.showMenu();
    else if (state === STATES.INTRO) this.showIntro();
    else if (state === STATES.INVESTIGATION) this.enterInvestigation();
  }
}
