/**
 * Audio cinematográfico sintetizado (WebAudio) para el intro de Isabella.
 * Sin archivos externos: cada capa se genera en tiempo real y se dispara
 * desde la timeline, nunca desde temporizadores independientes.
 */

export interface CinematicAudioEvent {
  id: string;
  at: number;
}

export const AUDIO_EVENTS: CinematicAudioEvent[] = [
  { id: "ambience", at: 0.1 },
  { id: "data-rise", at: 5.2 },
  { id: "comet-01", at: 12.2 },
  { id: "comet-02", at: 14.9 },
  { id: "comet-03", at: 17.1 },
  { id: "core-rise", at: 19.0 },
  { id: "logo-impact", at: 26.1 },
  { id: "heart-primary", at: 35.8 },
  { id: "heart-secondary", at: 37.0 },
  { id: "bird-entry", at: 39.1 },
  { id: "bird-ascent", at: 43.2 },
  { id: "interface-online", at: 49.2 },
];

type Ctx = AudioContext;

export class CinematicAudio {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private ambience: { osc: OscillatorNode[]; gain: GainNode } | null = null;
  private fired = new Set<string>();
  private muted = false;
  private disposed = false;

  async resume(): Promise<void> {
    if (this.disposed) return;
    if (!this.ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume().catch(() => {});
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(muted ? 0 : 0.55, this.ctx.currentTime, 0.15);
    }
  }

  /** Dispara los eventos cuya marca temporal ya fue alcanzada. */
  sync(time: number) {
    if (!this.ctx || !this.master || this.disposed) return;
    for (const event of AUDIO_EVENTS) {
      if (time >= event.at && !this.fired.has(event.id)) {
        this.fired.add(event.id);
        this.trigger(event.id);
      }
    }
  }

  reset() {
    this.fired.clear();
  }

  private trigger(id: string) {
    switch (id) {
      case "ambience":
        this.startAmbience();
        break;
      case "data-rise":
        this.sweep(180, 620, 3.2, 0.05, "sine");
        break;
      case "comet-01":
      case "comet-02":
      case "comet-03":
        this.whoosh(id === "comet-02" ? -1 : 1);
        break;
      case "core-rise":
        this.sweep(60, 210, 4.5, 0.12, "sawtooth");
        this.chord([196, 261.6, 329.6], 3.4, 0.05);
        break;
      case "logo-impact":
        this.impact();
        this.chord([261.6, 392, 523.25], 4.2, 0.07);
        break;
      case "heart-primary":
        this.pulse(0.16);
        break;
      case "heart-secondary":
        this.pulse(0.09);
        break;
      case "bird-entry":
        this.shimmer(1400, 1.6);
        break;
      case "bird-ascent":
        this.sweep(700, 2600, 3.4, 0.035, "triangle");
        break;
      case "interface-online":
        this.chord([523.25, 659.25, 783.99], 2.6, 0.06);
        break;
    }
  }

  private startAmbience() {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.11, ctx.currentTime, 3.0);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 320;
    gain.connect(filter).connect(this.master!);

    const osc: OscillatorNode[] = [];
    for (const freq of [36, 54.5, 81.7]) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq;
      const detune = ctx.createOscillator();
      detune.frequency.value = 0.07;
      const detuneGain = ctx.createGain();
      detuneGain.gain.value = 2.5;
      detune.connect(detuneGain).connect(o.detune);
      detune.start();
      o.connect(gain);
      o.start();
      osc.push(o, detune);
    }
    this.ambience = { osc, gain };
  }

  private sweep(from: number, to: number, dur: number, peak: number, type: OscillatorType) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + dur);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(this.master!);
    o.start();
    o.stop(ctx.currentTime + dur + 0.1);
  }

  private whoosh(pan: number) {
    const ctx = this.ctx!;
    const dur = 1.5;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.6;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(320, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2800, ctx.currentTime + dur * 0.6);
    filter.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(-pan, ctx.currentTime);
    panner.pan.linearRampToValueAtTime(pan, ctx.currentTime + dur);
    src.connect(filter).connect(g).connect(panner).connect(this.master!);
    src.start();
    src.stop(ctx.currentTime + dur);
  }

  private chord(freqs: number[], dur: number, peak: number) {
    const ctx = this.ctx!;
    for (const [i, f] of freqs.entries()) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const start = ctx.currentTime + i * 0.08;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(peak, start + 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(g).connect(this.master!);
      o.start(start);
      o.stop(start + dur + 0.1);
    }
  }

  private impact() {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(120, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 1.1);
    g.gain.setValueAtTime(0.24, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
    o.connect(g).connect(this.master!);
    o.start();
    o.stop(ctx.currentTime + 1.6);
  }

  private pulse(peak: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(88, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(46, ctx.currentTime + 0.32);
    g.gain.setValueAtTime(peak, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    o.connect(g).connect(this.master!);
    o.start();
    o.stop(ctx.currentTime + 0.5);
  }

  private shimmer(freq: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = freq;
    lfo.frequency.value = 26;
    lfoGain.gain.value = 90;
    lfo.connect(lfoGain).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(this.master!);
    lfo.start();
    o.start();
    o.stop(ctx.currentTime + dur + 0.1);
    lfo.stop(ctx.currentTime + dur + 0.1);
  }

  /** Libera osciladores, ganancias y el contexto de audio. */
  dispose() {
    this.disposed = true;
    if (this.ambience) {
      for (const o of this.ambience.osc) {
        try {
          o.stop();
        } catch {
          /* ya detenido */
        }
        o.disconnect();
      }
      this.ambience.gain.disconnect();
      this.ambience = null;
    }
    this.master?.disconnect();
    this.master = null;
    const ctx = this.ctx;
    this.ctx = null;
    void ctx?.close().catch(() => {});
  }
}
