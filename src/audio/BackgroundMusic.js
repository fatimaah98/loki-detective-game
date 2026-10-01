export class BackgroundMusic {
  constructor() {
    this.audio = new Audio(`${import.meta.env.BASE_URL}audio/bg-sound.mp3`);
    this.audio.loop = true;
    this.audio.preload = 'metadata';
    this.audio.volume = 0.24;
    this.started = false;
  }

  async play() {
    if (this.started) return;
    this.started = true;
    try {
      await this.audio.play();
    } catch (error) {
      this.started = false;
      console.warn('[کارآگاه لوکی] پخش موسیقی پس‌زمینه ممکن نشد:', error);
    }
  }

  stop() {
    this.started = false;
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  dispose() {
    this.stop();
    this.audio.removeAttribute('src');
    this.audio.load();
  }
}