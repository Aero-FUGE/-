
class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private audioUnlocked: boolean = false;

  private readonly SOUND_PATHS = {
    CLICK: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
    AI_PROCESSING: 'https://assets.mixkit.co/active_storage/sfx/2558/2558-preview.mp3',
    AI_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3',
    LEVEL_UP: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
    ACHIEVEMENT: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
    PANEL: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.preload();
    }
  }

  private preload() {
    Object.entries(this.SOUND_PATHS).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      if (key === 'AI_PROCESSING') {
        audio.loop = true;
      }
      this.sounds.set(key, audio);
    });
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public unlock() {
    if (this.audioUnlocked) return;
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
    silentAudio.play().then(() => {
      this.audioUnlocked = true;
    }).catch(() => {});
  }

  private play(key: keyof typeof this.SOUND_PATHS, volume: number = 0.25, playbackRate: number = 1) {
    if (!this.enabled) return;
    
    const original = this.sounds.get(key);
    if (!original) return;

    // Safety: Stop current if it's a looping sound or we want to reset
    if (key === 'AI_PROCESSING') {
      original.volume = volume;
      original.playbackRate = playbackRate;
      original.play().catch(() => {});
      return;
    }

    // For non-looping sounds, create a clone to allow overlapping
    const sound = original.cloneNode() as HTMLAudioElement;
    sound.volume = volume;
    sound.playbackRate = playbackRate;
    sound.play().catch(() => {});
  }

  public stop(key: keyof typeof this.SOUND_PATHS) {
    const sound = this.sounds.get(key);
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  // Explicit Sound Functions
  public playClick(isInteractive: boolean = true) {
    // Interactive: Clean feedback
    // Non-interactive: Ethereal/Light feedback
    const volume = isInteractive ? 0.15 : 0.03;
    const rate = isInteractive ? 1.0 : 1.8;
    this.play('CLICK', volume, rate);
  }

  public playCompletion() {
    this.play('COMPLETE', 0.4);
  }

  public playAIProcessing() {
    this.play('AI_PROCESSING', 0.15);
  }

  public stopAIProcessing() {
    this.stop('AI_PROCESSING');
  }

  public playAIComplete() {
    this.play('AI_COMPLETE', 0.25);
  }

  public playLevelUp() {
    this.play('LEVEL_UP', 0.4);
  }

  public playAchievement() {
    this.play('ACHIEVEMENT', 0.4);
  }

  public playPanelToggle() {
    this.play('PANEL', 0.2);
  }
}

export const soundManager = new SoundManager();
