// The Last Car - Comprehensive Procedural Web Audio Sound Engine & Voice System
// Features: Dynamic breathing, biological heartbeat, footsteps, isolation ear-ringing (tinnitus),
// atmospheric tunnel acoustics, and character voicelines via Web Audio & Speech Synthesis.

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = null;
    this.ambientGain = null;
    this.effectsGain = null;
    this.heartbeatGain = null;
    this.breathingGain = null;
    this.tinnitusGain = null;

    this.humNodes = [];
    this.ventNodes = [];
    this.tinnitusNodes = [];

    this.heartbeatInterval = null;
    this.breathingInterval = null;
    this.randomAtmosphereTimer = null;

    this.initialized = false;
    this.heartRate = 54; // Baseline resting isolation BPM (subtle, heavy)
    this.heartVolume = 0.18; // Always faintly present in the dead silence
    this.breathingTension = 'calm'; // 'calm', 'tense', 'exhausted'
    this.footStepIndex = 0;

    // Voice synthesis cache
    this.voices = [];
    this.initVoices();
  }

  init() {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();

    // Master Gain
    this.masterVolume = this.ctx.createGain();
    this.masterVolume.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.masterVolume.connect(this.ctx.destination);

    // Sub-busses
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    this.ambientGain.connect(this.masterVolume);

    this.effectsGain = this.ctx.createGain();
    this.effectsGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
    this.effectsGain.connect(this.masterVolume);

    this.heartbeatGain = this.ctx.createGain();
    this.heartbeatGain.gain.setValueAtTime(this.heartVolume, this.ctx.currentTime);
    this.heartbeatGain.connect(this.masterVolume);

    this.breathingGain = this.ctx.createGain();
    this.breathingGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    this.breathingGain.connect(this.masterVolume);

    this.tinnitusGain = this.ctx.createGain();
    this.tinnitusGain.gain.setValueAtTime(0.012, this.ctx.currentTime); // The "too quiet it's loud" ear ring
    this.tinnitusGain.connect(this.masterVolume);

    this.initialized = true;

    // Start background systems
    this.startSubwayHum();
    this.startVentilation();
    this.startTinnitus();
    this.startHeartbeatLoop();
    this.startBreathingLoop();
    this.startAtmosphericRandomEvents();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  initVoices() {
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        this.voices = window.speechSynthesis.getVoices();
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  // Generates white or pink noise buffer
  createNoiseBuffer(type = 'pink') {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  // 1. TINNITUS / DEAD SILENCE EAR-RINGING
  // When a room is completely dead silent underground, your ears hear their own nervous system ringing.
  startTinnitus() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(8400, now); // 8.4 kHz high delicate ringing

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(8400, now);
    filter.Q.setValueAtTime(20.0, now);

    osc.connect(filter);
    filter.connect(this.tinnitusGain);
    osc.start();
    this.tinnitusNodes = [osc];
  }

  setTinnitusLevel(volume) {
    if (this.tinnitusGain && this.ctx) {
      this.tinnitusGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 1.2);
    }
  }

  // 2. SUBWAY HUM & TRANSFORMER GROUND
  startSubwayHum() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const humOsc = this.ctx.createOscillator();
    humOsc.type = 'sawtooth';
    humOsc.frequency.setValueAtTime(60, now);

    const humFilter = this.ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(115, now);
    humFilter.Q.setValueAtTime(3.5, now);

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.09, now);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.18, now);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(12, now);
    lfo.connect(lfoGain);
    lfoGain.connect(humFilter.frequency);

    humOsc.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(this.ambientGain);

    humOsc.start();
    lfo.start();
    this.humNodes = [humOsc, lfo, humGain];
  }

  // 3. VENTILATION WHISPER
  startVentilation() {
    if (!this.ctx) return;
    const noiseBuffer = this.createNoiseBuffer('pink');
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(420, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);

    const ventGain = this.ctx.createGain();
    ventGain.gain.setValueAtTime(0.065, this.ctx.currentTime);

    noiseSource.connect(bandpass);
    bandpass.connect(ventGain);
    ventGain.connect(this.ambientGain);

    noiseSource.start();
    this.ventNodes = [noiseSource, ventGain];
  }

  setVentilationState(active) {
    if (this.ventNodes[1]) {
      this.ventNodes[1].gain.setTargetAtTime(active ? 0.065 : 0.0, this.ctx.currentTime, 0.5);
    }
  }

  // 4. PROCEDURAL HUMAN RESPIRATION / BREATHING LOOP
  // Rhythmic quiet inhalation through nose, slow warm exhalation through mouth
  startBreathingLoop() {
    if (this.breathingInterval) clearInterval(this.breathingInterval);
    const cycleDuration = this.breathingTension === 'tense' ? 2400 : this.breathingTension === 'exhausted' ? 1800 : 4200;

    this.breathingInterval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      this.playSingleBreathCycle();
    }, cycleDuration);
  }

  setBreathingState(tension = 'calm') {
    this.breathingTension = tension;
    if (tension === 'tense') {
      this.breathingGain.gain.setTargetAtTime(0.38, this.ctx.currentTime, 0.5);
    } else if (tension === 'exhausted') {
      this.breathingGain.gain.setTargetAtTime(0.48, this.ctx.currentTime, 0.5);
    } else {
      this.breathingGain.gain.setTargetAtTime(0.20, this.ctx.currentTime, 0.8);
    }
    this.startBreathingLoop();
  }

  playSingleBreathCycle() {
    if (!this.ctx || !this.breathingGain) return;
    const now = this.ctx.currentTime;
    const isTense = this.breathingTension === 'tense' || this.breathingTension === 'exhausted';

    // Inhale (Air drawn inwards, frequency sweeps up slightly)
    const inBuffer = this.createNoiseBuffer('pink');
    const inSource = this.ctx.createBufferSource();
    inSource.buffer = inBuffer;

    const inFilter = this.ctx.createBiquadFilter();
    inFilter.type = 'bandpass';
    inFilter.frequency.setValueAtTime(320, now);
    inFilter.frequency.linearRampToValueAtTime(isTense ? 650 : 480, now + (isTense ? 0.7 : 1.3));
    inFilter.Q.setValueAtTime(2.2, now);

    const inGain = this.ctx.createGain();
    inGain.gain.setValueAtTime(0.001, now);
    inGain.gain.linearRampToValueAtTime(isTense ? 0.28 : 0.16, now + (isTense ? 0.35 : 0.65));
    inGain.gain.exponentialRampToValueAtTime(0.001, now + (isTense ? 0.75 : 1.4));

    inSource.connect(inFilter);
    inFilter.connect(inGain);
    inGain.connect(this.breathingGain);

    inSource.start(now);
    inSource.stop(now + (isTense ? 0.8 : 1.5));

    // Exhale (Soft warm release after pause)
    const exStart = now + (isTense ? 0.9 : 1.6);
    const exBuffer = this.createNoiseBuffer('pink');
    const exSource = this.ctx.createBufferSource();
    exSource.buffer = exBuffer;

    const exFilter = this.ctx.createBiquadFilter();
    exFilter.type = 'lowpass';
    exFilter.frequency.setValueAtTime(isTense ? 500 : 380, exStart);
    exFilter.frequency.linearRampToValueAtTime(240, exStart + (isTense ? 0.8 : 1.8));

    const exGain = this.ctx.createGain();
    exGain.gain.setValueAtTime(0.001, exStart);
    exGain.gain.linearRampToValueAtTime(isTense ? 0.25 : 0.14, exStart + (isTense ? 0.25 : 0.5));
    exGain.gain.exponentialRampToValueAtTime(0.001, exStart + (isTense ? 0.9 : 2.0));

    exSource.connect(exFilter);
    exFilter.connect(exGain);
    exGain.connect(this.breathingGain);

    exSource.start(exStart);
    exSource.stop(exStart + (isTense ? 1.0 : 2.1));
  }

  // 5. BIOLOGICAL HEARTBEAT LOOP
  // Anchors the player to their physical body in isolation
  startHeartbeatLoop() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      this.playSingleHeartbeat();
    }, (60 / this.heartRate) * 1000);
  }

  setHeartRate(bpm, volume = null) {
    this.heartRate = bpm;
    if (volume !== null && this.heartbeatGain && this.ctx) {
      this.heartVolume = volume;
      this.heartbeatGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.5);
    }
    this.startHeartbeatLoop();
  }

  playSingleHeartbeat() {
    if (!this.ctx || !this.heartbeatGain) return;
    const now = this.ctx.currentTime;
    const isElevated = this.heartRate > 80;

    // Double beat: "lub... dub"
    [0.0, isElevated ? 0.13 : 0.17].forEach((d, idx) => {
      const time = now + d;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 68 : 55, time);
      osc.frequency.exponentialRampToValueAtTime(28, time + 0.12);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(idx === 0 ? 0.8 : 0.6, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      osc.connect(gain);
      gain.connect(this.heartbeatGain);

      osc.start(time);
      osc.stop(time + 0.18);
    });
  }

  // 6. RICH PLAYER FOOTSTEPS & CLOTHING RUSTLE
  playFootstep() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.footStepIndex++;
    const isLeft = this.footStepIndex % 2 === 0;

    // Base sole contact on ribbed train linoleum
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    const baseFreq = isLeft ? 112 : 118;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.055);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    // Sole rubber grip friction
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer('pink');
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isLeft ? 1150 : 1350, now);
    filter.Q.setValueAtTime(2.2, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.effectsGain);

    osc.connect(gain);
    gain.connect(this.effectsGain);

    osc.start(now);
    osc.stop(now + 0.075);
    noise.start(now);
    noise.stop(now + 0.055);

    // Subtle clothing jacket movement rustle
    if (this.footStepIndex % 2 === 0) {
      this.playClothingRustle(0.05);
    }
  }

  playClothingRustle(vol = 0.08) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer('pink');

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.Q.setValueAtTime(1.2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.5, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain);

    noise.start(now);
    noise.stop(now + 0.16);
  }

  // 7. EXTERIOR FOOTSTEPS & HORROR STEP EFFECTS
  playPlatformFootstep(distZ = 0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Distant shoe click on platform tile through subway window glass
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(310, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.08);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now); // Muffled by double-pane glass

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playRoofFootstep() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Heavy, hollow mechanical thud directly on the car roof overhead
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(85, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    // Sheet metal vibration
    const metalOsc = this.ctx.createOscillator();
    metalOsc.type = 'triangle';
    metalOsc.frequency.setValueAtTime(240, now);
    metalOsc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    const metalGain = this.ctx.createGain();
    metalGain.gain.setValueAtTime(0.35, now);
    metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.effectsGain);

    metalOsc.connect(metalGain);
    metalGain.connect(this.effectsGain);

    osc.start(now);
    osc.stop(now + 0.24);
    metalOsc.start(now);
    metalOsc.stop(now + 0.2);
  }

  // 8. CREATURE GAIT: Multi-legged asynchronous wet scuttling
  playCreatureGait() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const taps = [0.0, 0.09, 0.18, 0.29, 0.38, 0.49, 0.61];
    taps.forEach((t, i) => {
      const time = now + t;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(230 + Math.random() * 90, time);
      osc.frequency.exponentialRampToValueAtTime(65, time + 0.05);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380 + (i % 3) * 60, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.effectsGain);

      osc.start(time);
      osc.stop(time + 0.07);
    });
  }

  // 9. SPATIAL DOOR KNOCKING: 3 crisp strikes on steel and glass
  playDoorKnock() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const delays = [0.0, 0.36, 0.72];

    delays.forEach((delay) => {
      const strikeTime = now + delay;
      // High frequency click (knuckle on safety glass)
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, strikeTime);
      osc.frequency.exponentialRampToValueAtTime(75, strikeTime + 0.07);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, strikeTime);
      filter.Q.setValueAtTime(3.2, strikeTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.85, strikeTime);
      gain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.11);

      // Deep resonance of the hollow stainless steel door shell
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(135, strikeTime);
      subOsc.frequency.exponentialRampToValueAtTime(42, strikeTime + 0.28);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.7, strikeTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.effectsGain);

      subOsc.connect(subGain);
      subGain.connect(this.effectsGain);

      osc.start(strikeTime);
      osc.stop(strikeTime + 0.14);
      subOsc.start(strikeTime);
      subOsc.stop(strikeTime + 0.32);
    });
  }

  // 10. SUBTLE ISOLATION SOUNDS (WATER DRIP, CHASSIS TINK, TUNNEL DRAFT)
  startAtmosphericRandomEvents() {
    if (this.randomAtmosphereTimer) clearInterval(this.randomAtmosphereTimer);
    // Every 12-22 seconds, a very faint sound reminds the player how isolated they are
    this.randomAtmosphereTimer = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const roll = Math.random();
      if (roll < 0.35) {
        this.playWaterDrip();
      } else if (roll < 0.65) {
        this.playMetalTink();
      } else if (roll < 0.85) {
        this.playTunnelDraft();
      } else {
        this.playMetallicCreak();
      }
    }, 16000);
  }

  // A single distant water drop echoing in the dark tunnel
  playWaterDrip() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    const pitch = 1450 + Math.random() * 200;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.8, now + 0.02);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    // Muffled tunnel reverb ping
    const echoOsc = this.ctx.createOscillator();
    echoOsc.type = 'sine';
    echoOsc.frequency.setValueAtTime(pitch * 0.6, now + 0.07);
    const echoGain = this.ctx.createGain();
    echoGain.gain.setValueAtTime(0.025, now + 0.07);
    echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ambientGain);

    echoOsc.connect(echoGain);
    echoGain.connect(this.ambientGain);

    osc.start(now);
    osc.stop(now + 0.12);
    echoOsc.start(now + 0.07);
    echoOsc.stop(now + 0.48);
  }

  // Tiny thermal contraction ping of the train steel chassis
  playMetalTink() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2200 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Low haunting wind draft seeping past the door rubber seals
  playTunnelDraft() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer('pink');

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(190, now);
    filter.frequency.linearRampToValueAtTime(320, now + 1.8);
    filter.frequency.linearRampToValueAtTime(160, now + 3.8);
    filter.Q.setValueAtTime(4.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 4.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    noise.start(now);
    noise.stop(now + 4.3);
  }

  // 11. CHARACTER VOICELINES & AUDIO FILTRATION
  // Uses Web Speech API with procedural radio/telephone/intercom filters and formant synthesis
  speakVoice({ text, character = 'woman', onEnd = null }) {
    this.resume();
    const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/["]/g, '');

    // Play physical sound cues before voice (intercom beep, mic squelch, radio static)
    if (character === 'captain') {
      this.playIntercomChime();
    } else if (character === 'mom') {
      this.playPhoneRingAndConnect();
    } else if (character === 'radio') {
      this.playRadioStatic(1.6);
    } else if (character === 'woman_whisper') {
      this.playClothingRustle(0.12);
    }

    if (!('speechSynthesis' in window)) {
      if (onEnd) setTimeout(onEnd, 2000);
      return;
    }

    // Cancel any overlapping speech
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(cleanText);
    const voices = this.voices.length > 0 ? this.voices : window.speechSynthesis.getVoices();

    // Match voice personality
    if (character === 'woman') {
      // Natural, slightly breathy and tired female voice
      const femaleVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen') || v.name.includes('Zira') || v.name.includes('Female')));
      if (femaleVoice) utter.voice = femaleVoice;
      utter.pitch = 1.05;
      utter.rate = 0.88;
      utter.volume = 0.85;

    } else if (character === 'woman_whisper') {
      // The chilling final whisper: "You should've come with us"
      const femaleVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Female')));
      if (femaleVoice) utter.voice = femaleVoice;
      utter.pitch = 0.82; // Lower, uncanny frequency
      utter.rate = 0.68; // Slow, deliberate cadence
      utter.volume = 0.65; // Soft intimate whisper

    } else if (character === 'captain') {
      // Train operator / captain over crackling PA
      const maleVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Alex') || v.name.includes('Daniel') || v.name.includes('Fred') || v.name.includes('David') || v.name.includes('Male')));
      if (maleVoice) utter.voice = maleVoice;
      utter.pitch = 0.85;
      utter.rate = 0.92;
      utter.volume = 0.95;

    } else if (character === 'mom') {
      // Frantic mother leaving voicemail
      const momVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Female')));
      if (momVoice) utter.voice = momVoice;
      utter.pitch = 1.18;
      utter.rate = 1.12;
      utter.volume = 0.85;

    } else if (character === 'survivor') {
      // Outside male survivor on Day 20
      const maleVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Alex') || v.name.includes('David') || v.name.includes('Male')));
      if (maleVoice) utter.voice = maleVoice;
      utter.pitch = 0.92;
      utter.rate = 0.94;
      utter.volume = 0.85;

    } else if (character === 'radio') {
      // Corrupted broadcast fragment
      utter.pitch = 0.72;
      utter.rate = 0.82;
      utter.volume = 0.75;
    }

    utter.onend = () => {
      if (onEnd) onEnd();
    };

    utter.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utter);
  }

  playIntercomChime() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Two-tone subway PA chime (Ding-dong)
    [784, 523].forEach((f, idx) => {
      const time = now + idx * 0.16;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

      osc.connect(gain);
      gain.connect(this.effectsGain);

      osc.start(time);
      osc.stop(time + 0.4);
    });
  }

  playPhoneRingAndConnect() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Phone click and voicemail pickup squelch
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.effectsGain);

    osc.start(now);
    osc.stop(now + 0.06);

    // Subtle telephone line carrier hiss
    this.playRadioStatic(0.8);
  }

  playPhoneVibration() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Two quick vibration pulses against vinyl seat
    [0.0, 0.22].forEach((d) => {
      const time = now + d;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, time);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.linearRampToValueAtTime(0.001, time + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.effectsGain);

      osc.start(time);
      osc.stop(time + 0.14);
    });
  }

  // 12. OTHER INTERACTIVE AUDIO
  playMetallicCreak() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.4);
    osc.frequency.linearRampToValueAtTime(120, now + 0.9);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(550, now);
    filter.Q.setValueAtTime(6.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(now);
    osc.stop(now + 1.3);
  }

  playEASAlert(duration = 2.5) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(853, now);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(960, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
    gain.gain.setValueAtTime(0.35, now + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0.0, now + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.effectsGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  playPhoneDing() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [659.25, 880.0];
    notes.forEach((freq, idx) => {
      const time = now + idx * 0.1;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.28, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

      osc.connect(gain);
      gain.connect(this.effectsGain);

      osc.start(time);
      osc.stop(time + 0.4);
    });
  }

  playFlashlightClick() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.015);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(this.effectsGain);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  playWaterSip() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(280, now + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.effectsGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playEatingCrunch() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const time = now + i * 0.09;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer('white');

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800 + i * 200, time);
      filter.Q.setValueAtTime(4.0, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.effectsGain);

      noise.start(time);
      noise.stop(time + 0.07);
    }
  }

  playLockerUnlock() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.effectsGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playLightFlicker() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer('white');

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.Q.setValueAtTime(2.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain);

    noise.start(now);
    noise.stop(now + 0.1);
  }

  playRadioStatic(duration = 1.2) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer('white');

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(1.2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.05);
    gain.gain.setValueAtTime(0.28, now + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain);

    noise.start(now);
    noise.stop(now + duration + 0.05);
  }

  setMasterVolume(val) {
    if (this.masterVolume && this.ctx) {
      this.masterVolume.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }
}

export const sound = new SoundEngine();
