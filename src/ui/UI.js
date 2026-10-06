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

      <div class="evidence-prompt hidden" id="evidence-prompt">بررسی <kbd>E</kbd></div>
      <div class="detective-status hidden" id="detective-status">حالت کارآگاه <span id="detective-timer"></span></div>

      <div class="evidence-detail hidden" id="evidence-detail" role="dialog" aria-modal="true" aria-labelledby="evidence-title">
        <div class="evidence-detail-panel">
          <div class="story-kicker" id="evidence-number">شاهد پرونده</div>
          <h2 class="evidence-title" id="evidence-title"></h2>
          <p class="evidence-description" id="evidence-description"></p>
          <div class="evidence-phone hidden" id="evidence-phone">
            <div class="evidence-phone-notch" aria-hidden="true"></div>
            <ol class="evidence-phone-messages" id="evidence-phone-messages"></ol>
          </div>
          <div class="evidence-actions">
            <span class="evidence-count" id="evidence-count"></span>
            <button class="btn evidence-close" id="evidence-close" type="button">بازگشت به بررسی</button>
          </div>
        </div>
      </div>

      <div class="case-alert hidden" id="case-alert" role="status" aria-live="polite">
        <span class="case-alert-icon" aria-hidden="true">!</span>
        <p class="case-alert-text" id="case-alert-text"></p>
        <button class="btn case-alert-ok hidden" id="case-alert-ok" type="button">باشه</button>
      </div>

      <section class="whiteboard hidden" id="whiteboard" aria-labelledby="whiteboard-title">
        <header class="whiteboard-header">
          <div>
            <div class="story-kicker">مقر کارآگاه لوکی</div>
            <h2 id="whiteboard-title">پرونده: اتاق خاموش</h2>
          </div>
          <span class="board-countdown" id="board-countdown" aria-live="polite"></span>
        </header>
        <div class="whiteboard-surface">
          <section class="wb-group wb-victim-group">
            <h3 class="wb-label">مقتول</h3>
            <figure class="wb-victim">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=480&q=85" alt="النا وودز">
              <figcaption>النا وودز · ۳۳ ساله</figcaption>
            </figure>
          </section>
          <section class="wb-group">
            <h3 class="wb-label">اظهارات مظنون‌ها</h3>
            <div class="wb-notes wb-statements" id="wb-statements"></div>
          </section>
          <section class="wb-group">
            <h3 class="wb-label">شواهد صحنه</h3>
            <div class="wb-notes wb-evidence" id="wb-evidence"></div>
          </section>
        </div>
        <footer class="whiteboard-footer">
          <button class="btn accusation-start" id="accusation-start" type="button">بررسی و شناسایی قاتل</button>
        </footer>
      </section>

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
        </header>
        <p class="case-panel-hint">قاتل را انتخاب کنید و علت‌های درست را با توجه به شواهد علامت بزنید.</p>
        <div class="accusation-suspects" id="accusation-suspects"></div>
        <h3 class="proof-heading">علت‌ها و شواهد قتل</h3>
        <div class="proof-list" id="proof-list"></div>
        <p class="proof-status" id="proof-status" aria-live="polite"></p>
        <button class="btn accuse-submit" id="accuse-submit" type="button">ثبت پاسخ</button>
      </section>

      <section class="case-panel ending-panel hidden" id="ending-panel" aria-labelledby="ending-title">
        <div class="story-kicker" id="ending-kicker">نتیجه پرونده</div>
        <h2 id="ending-title"></h2>
        <p class="ending-copy" id="ending-copy"></p>
        <div class="true-timeline hidden" id="true-timeline">
          <h3>خط زمانی واقعی قتل</h3>
          <ol id="true-timeline-list"></ol>
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
            <li><span>بازگشت به مقر (پس از یافتن همه شواهد)</span> <span class="key">J</span></li>
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
    this.caseAlert = this.root.querySelector('#case-alert');
    this.caseAlertText = this.root.querySelector('#case-alert-text');
    this.caseAlertOk = this.root.querySelector('#case-alert-ok');
    this._caseAlertTimer = 0;
    this.whiteboard = this.root.querySelector('#whiteboard');
    this.detectiveStatus = this.root.querySelector('#detective-status');
    this.detectiveTimer = this.root.querySelector('#detective-timer');
    this._detectiveInterval = 0;
    this.timelinePanel = this.root.querySelector('#timeline-panel');
    this.suspectsPanel = this.root.querySelector('#suspects-panel');
    this.accusationPanel = this.root.querySelector('#accusation-panel');
    this.endingPanel = this.root.querySelector('#ending-panel');
    this.timelineMode = 'official';
    this.selectedSuspect = 'david';
    this.collectedEvidence = [];
    this.selectedAccusationSuspect = null;
    this.selectedProof = new Set();
    this._boardInterval = 0;
    this._boardEndsAt = 0;
    this.boardCountdown = this.root.querySelector('#board-countdown');
    this.timelineReconstructed = false;
    this.onCloseEvidence = null;
    this.onReturnToHQ = null;
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
    this.root.querySelector('#ending-close').addEventListener('click', () => this.onCloseEnding?.());
    this.root.querySelector('#accusation-start').addEventListener('click', () => this.onOpenAccusation?.());
    this.root.querySelector('#evidence-close').addEventListener('click', () => this.onCloseEvidence?.());
    this.caseAlertOk.addEventListener('click', () => this.onReturnToHQ?.());
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
  }

  showCaseView(view, collected) {
    this.closeCaseViews();
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

  showAccusation(collected) {
    this.closeCaseViews();
    this.whiteboard.classList.add('hidden');
    this.evidenceDetail.classList.add('hidden');
    this.endingPanel.classList.add('hidden');
    this.accusationPanel.classList.remove('hidden');
    this.crosshair.classList.add('hidden');
    this.collectedEvidence = collected;
    this.selectedAccusationSuspect = null;
    this.selectedProof.clear();
    this.renderAccusation();
  }

  renderAccusation() {
    this.root.querySelector('#accusation-suspects').innerHTML = SUSPECTS.map((suspect) => `
      <button class="accusation-suspect${suspect.id === this.selectedAccusationSuspect ? ' selected' : ''}" type="button" data-accused-id="${suspect.id}" aria-pressed="${suspect.id === this.selectedAccusationSuspect}">
        <img class="accusation-portrait" src="${suspect.portrait}" alt="">
        <span><strong>${suspect.name}</strong><small>${suspect.age} ساله · ${suspect.relation}</small></span>
      </button>`).join('');

    const collectedIds = new Set(this.collectedEvidence.map((item) => item.id));
    this.root.querySelector('#proof-list').innerHTML = ACCUSATION_REQUIREMENTS.map((proof) => {
      const available = collectedIds.has(proof.sourceId);
      const selected = this.selectedProof.has(proof.id);
      const hint = available ? `شاهد: ${EVIDENCE_LABELS[proof.sourceId]}` : 'شاهد هنوز بررسی نشده';
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
    submit.disabled = !this.selectedAccusationSuspect;
    status.textContent = `${this.selectedProof.size} علت انتخاب شده`;
  }

  showEnding(solved, actualTimeline) {
    this.accusationPanel.classList.add('hidden');
    this.endingPanel.classList.remove('hidden');
    this.root.querySelector('#ending-title').textContent = solved ? 'پرونده حل شد' : 'پرونده هنوز حل نشده است';
    this.root.querySelector('#ending-kicker').textContent = solved ? 'پایان بازی · حقیقت آشکار شد' : 'اتهام با شواهد کافی پشتیبانی نشد';
    this.root.querySelector('#ending-copy').textContent = solved
      ? 'دنیل رید، شریک تجاری النا، او را پس از تهدید به افشای اختلاس به قتل رساند و صحنه را شبیه خودکشی جلوه داد.'
      : 'قاتل یا علت قتل را اشتباه انتخاب کردید. شواهد را دوباره مرور کنید و انتخاب دیگری انجام دهید.';
    this.root.querySelector('#true-timeline').classList.toggle('hidden', !solved);
    this.root.querySelector('#true-timeline-list').innerHTML = solved
      ? actualTimeline.map((item) => `<li><time>${item.time}</time><span>${item.label}</span></li>`).join('')
      : '';
    const closeButton = this.root.querySelector('#ending-close');
    closeButton.textContent = solved ? 'بازگشت به منوی اصلی' : 'بازگشت به انتخاب قاتل';
    closeButton.classList.remove('hidden');
  }

  closeEnding() {
    this.endingPanel.classList.add('hidden');
  }

  isAccusationOpen() {
    return !this.accusationPanel.classList.contains('hidden');
  }

  isEndingOpen() {
    return !this.endingPanel.classList.contains('hidden');
  }

  setEvidenceTarget(evidence) {
    if (!evidence || this.evidenceDetail.classList.contains('open') || this.isBoardOpen()) {
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

  showEvidence(evidence, collectedCount) {
    this.evidencePrompt.classList.add('hidden');
    this.root.querySelector('#evidence-number').textContent = `شاهد ${String(collectedCount).padStart(2, '۰')} از ۱۰`;
    this.root.querySelector('#evidence-title').textContent = evidence.title;
    this.root.querySelector('#evidence-description').textContent = evidence.description;
    this._renderPhoneMessages(evidence.messages);
    this.root.querySelector('#evidence-count').textContent = `${collectedCount} از ۱۰ شاهد ثبت شد`;
    this.evidenceDetail.classList.remove('hidden');
    requestAnimationFrame(() => this.evidenceDetail.classList.add('open'));
  }

  _renderPhoneMessages(messages) {
    const phone = this.root.querySelector('#evidence-phone');
    const list = this.root.querySelector('#evidence-phone-messages');
    list.textContent = '';
    phone.classList.toggle('hidden', !messages?.length);
    for (const message of messages || []) {
      const item = document.createElement('li');
      item.className = `evidence-phone-message${message.latest ? ' latest' : ''}`;
      const head = document.createElement('header');
      const sender = document.createElement('strong');
      sender.textContent = message.sender;
      const time = document.createElement('time');
      time.textContent = message.latest ? `${message.time} · آخرین پیام` : message.time;
      head.append(sender, time);
      const text = document.createElement('p');
      text.textContent = message.text;
      item.append(head, text);
      list.append(item);
    }
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

  /** هشدار پایین‌چپ صفحه؛ با action دکمه «باشه» نمایش داده می‌شود و تا کلیک می‌ماند */
  showCaseAlert(message, { action = false, duration = 6500 } = {}) {
    window.clearTimeout(this._caseAlertTimer);
    this.caseAlertText.textContent = message;
    this.caseAlertOk.classList.toggle('hidden', !action);
    this.caseAlert.classList.toggle('actionable', action);
    this.caseAlert.classList.remove('hidden', 'leaving');
    if (!action) this._caseAlertTimer = window.setTimeout(() => this.hideCaseAlert(), duration);
  }

  hideCaseAlert() {
    window.clearTimeout(this._caseAlertTimer);
    if (this.caseAlert.classList.contains('hidden')) return;
    this.caseAlert.classList.add('leaving');
    this._caseAlertTimer = window.setTimeout(() => {
      this.caseAlert.classList.add('hidden');
      this.caseAlert.classList.remove('leaving', 'actionable');
    }, 300);
  }

  isCaseAlertActionable() {
    return !this.caseAlert.classList.contains('hidden') && this.caseAlert.classList.contains('actionable');
  }

  renderWhiteboard(collected) {
    this.root.querySelector('#wb-statements').innerHTML = SUSPECTS.map((suspect, index) => `
      <article class="wb-sticky wb-statement" style="--note-rotation:${[-1.6, 1.2, -0.8][index % 3]}deg">
        <header class="wb-sticky-head">
          <img src="${suspect.portrait}" alt="">
          <span><strong>${suspect.name}</strong><small>${suspect.age} ساله · ${suspect.relation}</small></span>
        </header>
        <p>«${suspect.statement}»</p>
      </article>`).join('');
    const digits = new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 2 });
    this.root.querySelector('#wb-evidence').innerHTML = collected.map((evidence, index) => `
      <article class="wb-sticky wb-evidence-note" style="--note-rotation:${[1.4, -1.1, 0.6, -1.8, 1][index % 5]}deg">
        <span class="wb-index">${digits.format(index + 1)}</span>
        <strong>${evidence.title}</strong>
        <p>${evidence.description}</p>
        ${evidence.messages ? `<ul class="wb-phone-messages">${evidence.messages.map((message) => `
          <li><b>${message.sender} (${message.time}):</b> ${message.text}</li>`).join('')}</ul>` : ''}
      </article>`).join('');
  }

  showWhiteboard(collected) {
    this.hideCaseAlert();
    this.closeEvidence();
    this.evidencePrompt.classList.add('hidden');
    this.crosshair.classList.add('hidden');
    this.setDetectiveMode(false);
    this.renderWhiteboard(collected);
    this.whiteboard.classList.remove('hidden');
    this.whiteboard.scrollTop = 0;
    this.stopBoardTimer();
    this._boardEndsAt = performance.now() + 60000;
    this._updateBoardCountdown();
    this._boardInterval = window.setInterval(() => this._updateBoardCountdown(), 200);
  }

  _updateBoardCountdown() {
    const remaining = Math.max(0, this._boardEndsAt - performance.now());
    const seconds = Math.ceil(remaining / 1000);
    const digits = new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 2 });
    this.boardCountdown.textContent = `زمان باقی‌مانده: ${new Intl.NumberFormat('fa-IR').format(Math.floor(seconds / 60))}:${digits.format(seconds % 60)}`;
    if (remaining <= 0) {
      this.stopBoardTimer();
      this.onBoardTimeUp?.();
    }
  }

  stopBoardTimer() {
    window.clearInterval(this._boardInterval);
    this._boardInterval = 0;
  }

  isBoardOpen() {
    return !this.whiteboard.classList.contains('hidden');
  }

  isEvidenceOpen() {
    return !this.evidenceDetail.classList.contains('hidden');
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
