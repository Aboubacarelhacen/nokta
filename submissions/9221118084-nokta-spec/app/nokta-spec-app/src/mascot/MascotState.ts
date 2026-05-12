// Mascot state machine — ported in spirit from seyyah/nokta-mascot (NoktaAvatar.jsx).
// Web repo used a 3D Canvas; this RN version keeps the same emotional vocabulary
// (idle / listening / thinking / speaking / sleep / angry / love) but drives a 2D SVG.

export type MascotState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'sleep'
  | 'angry'
  | 'love';

export const SLEEP_AFTER_MS = 10_000;       // matches web repo: 10s of inactivity
export const ANGRY_TAP_WINDOW_MS = 900;     // 3 quick taps -> angry
export const ANGRY_TAP_THRESHOLD = 3;
export const LOVE_HOLD_MS = 1800;
export const ANGRY_HOLD_MS = 1500;

export const stateColor: Record<MascotState, string> = {
  idle: '#3A5218',
  listening: '#C97A30',
  thinking: '#8C6C30',
  speaking: '#4A7A28',
  sleep: '#6B7A5A',
  angry: '#B53A2B',
  love: '#D6557A',
};

export const stateLabel: Record<MascotState, string> = {
  idle: 'Ready',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking',
  sleep: 'Zzz',
  angry: 'Easy! 💢',
  love: 'Hehe ❤',
};
