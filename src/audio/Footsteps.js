export class Footsteps {
  constructor() {
    this.context = null;
    this.master = null;
    this.buffer = null;
    this.loading = null;
    this.enabled = true;
  }

  async unlock() {
    if (!this.enabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!this.context) {
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = 0.78;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') await this.context.resume();
    if (!this.buffer && !this.loading) this.loading = this._loadSample();
    await this.loading;
  }

  play({ side = 0, intensity = 1 } = {}) {
    const context = this.context;
    if (!this.enabled || !context || context.state !== 'running' || !this.buffer) return;

    const source = context.createBufferSource();
    const gain = context.createGain();
    const pan = context.createStereoPanner();
    source.buffer = this.buffer;
    gain.gain.value = Math.min(1, Math.max(0, intensity)) * 1.05;
    pan.pan.value = side * 0.12;
    source.connect(gain);
    gain.connect(pan);
    pan.connect(this.master);
    source.start();
    source.addEventListener('ended', () => {
      source.disconnect();
      gain.disconnect();
      pan.disconnect();
    }, { once: true });
  }

  async _loadSample() {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}audio/footstep.ogg`);
      if (!response.ok) throw new Error(`Audio request failed: ${response.status}`);
      const encoded = await response.arrayBuffer();
      this.buffer = await this.context.decodeAudioData(encoded);
    } catch (error) {
      console.error('[کارآگاه لوکی] بارگذاری صدای قدم ناموفق بود:', error);
    } finally {
      this.loading = null;
    }
  }

  dispose() {
    this.enabled = false;
    if (this.context && this.context.state !== 'closed') this.context.close();
    this.context = null;
    this.master = null;
    this.buffer = null;
    this.loading = null;
  }
}
