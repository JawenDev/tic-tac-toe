type SoundName = "p1" | "p2" | "win" | "draw" | "click";

let ctx: AudioContext | null = null;
let muted = false;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  audio: AudioContext,
  from: number,
  to: number,
  duration: number,
  type: OscillatorType,
  delay = 0,
  volume = 0.15,
) {
  const start = audio.currentTime + delay;
  const end = start + duration;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.linearRampToValueAtTime(to, end);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(audio.destination);
  osc.start(start);
  osc.stop(end + 0.02);
}

export function setMuted(value: boolean) {
  muted = value;
}

export function play(name: SoundName) {
  if (muted) return;
  const audio = getContext();
  if (!audio) return;

  switch (name) {
    case "p1":
      tone(audio, 300, 450, 0.08, "triangle");
      break;
    case "p2":
      tone(audio, 420, 600, 0.08, "triangle");
      break;
    case "win":
      // C5 - E5 - G5 - C6
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone(audio, f, f, 0.14, "square", i * 0.12, 0.08),
      );
      break;
    case "draw":
      tone(audio, 250, 250, 0.18, "triangle", 0, 0.18);
      tone(audio, 180, 180, 0.28, "triangle", 0.2, 0.18);
      break;
    case "click":
      tone(audio, 600, 600, 0.02, "square", 0, 0.06);
      break;
  }
}
