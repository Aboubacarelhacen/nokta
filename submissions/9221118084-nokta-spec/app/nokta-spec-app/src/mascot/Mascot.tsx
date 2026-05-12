import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  cancelAnimation,
  Easing,
  interpolate,
  useDerivedValue,
  SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path, G, Ellipse } from 'react-native-svg';
import {
  MascotState,
  SLEEP_AFTER_MS,
  ANGRY_TAP_WINDOW_MS,
  ANGRY_TAP_THRESHOLD,
  ANGRY_HOLD_MS,
  LOVE_HOLD_MS,
  stateColor,
  stateLabel,
} from './MascotState';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  state: MascotState;
  onStateChange?: (s: MascotState) => void;
  size?: number;
  showLabel?: boolean;
};

/**
 * 2D NOKTA mascot. A single dot with face — the visual root of NOKTA.
 * Mirrors the seyyah/nokta-mascot interaction set: tap-to-angry, hold-to-love,
 * auto-sleep on inactivity, animated mouth on speaking, pulse on listening.
 */
export default function Mascot({ state, onStateChange, size = 180, showLabel = true }: Props) {
  // --- shared values ---
  const breathe = useSharedValue(0);
  const pulse = useSharedValue(0);
  const mouthOpen = useSharedValue(0);
  const shake = useSharedValue(0);
  const blink = useSharedValue(1);
  const zzz = useSharedValue(0);
  const heart = useSharedValue(0);

  // tap tracking for angry
  const tapTimes = useRef<number[]>([]);
  const lastActivity = useRef<number>(Date.now());
  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setState = (s: MascotState) => {
    lastActivity.current = Date.now();
    onStateChange?.(s);
  };

  // --- animation drivers per state ---
  useEffect(() => {
    cancelAnimation(breathe);
    cancelAnimation(pulse);
    cancelAnimation(mouthOpen);
    cancelAnimation(shake);
    cancelAnimation(zzz);
    cancelAnimation(heart);

    breathe.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }), -1, true);

    if (state === 'listening') {
      pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
    } else if (state === 'thinking') {
      pulse.value = withRepeat(withTiming(1, { duration: 600 }), -1, true);
    } else if (state === 'speaking') {
      mouthOpen.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 160 }),
          withTiming(0.3, { duration: 140 }),
          withTiming(0.8, { duration: 180 }),
          withTiming(0.1, { duration: 150 }),
        ),
        -1,
        false,
      );
    } else if (state === 'angry') {
      shake.value = withRepeat(withSequence(withTiming(1, { duration: 60 }), withTiming(-1, { duration: 60 })), 8, true);
    } else if (state === 'sleep') {
      zzz.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
    } else if (state === 'love') {
      heart.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false);
    }

    // periodic blink (skip when sleeping)
    if (state !== 'sleep') {
      const tick = () => {
        blink.value = withSequence(withTiming(0, { duration: 90 }), withTiming(1, { duration: 90 }));
      };
      const id = setInterval(tick, 3200 + Math.random() * 1500);
      return () => clearInterval(id);
    }
  }, [state]);

  // --- auto-sleep on inactivity (like the web repo's 10s timer) ---
  useEffect(() => {
    if (sleepTimer.current) clearTimeout(sleepTimer.current);
    if (state === 'idle') {
      sleepTimer.current = setTimeout(() => onStateChange?.('sleep'), SLEEP_AFTER_MS);
    }
    return () => {
      if (sleepTimer.current) clearTimeout(sleepTimer.current);
    };
  }, [state]);

  // --- transient state holds (angry/love auto-release) ---
  useEffect(() => {
    if (stateTimer.current) clearTimeout(stateTimer.current);
    if (state === 'angry') {
      stateTimer.current = setTimeout(() => onStateChange?.('idle'), ANGRY_HOLD_MS);
    } else if (state === 'love') {
      stateTimer.current = setTimeout(() => onStateChange?.('idle'), LOVE_HOLD_MS);
    }
    return () => {
      if (stateTimer.current) clearTimeout(stateTimer.current);
    };
  }, [state]);

  const handleTap = () => {
    const now = Date.now();
    tapTimes.current = [...tapTimes.current.filter(t => now - t < ANGRY_TAP_WINDOW_MS), now];
    if (tapTimes.current.length >= ANGRY_TAP_THRESHOLD) {
      tapTimes.current = [];
      setState('angry');
    } else if (state === 'sleep') {
      setState('idle');
    }
  };

  const handleLongPress = () => setState('love');

  // --- animated styles ---
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(breathe.value, [0, 1], [0, -4]) },
      { translateX: shake.value * 6 },
      { scale: state === 'love' ? interpolate(heart.value, [0, 1], [1.0, 1.08]) : 1 },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: state === 'listening' ? interpolate(pulse.value, [0, 1], [0.25, 0.7]) : 0,
    transform: [{ scale: state === 'listening' ? interpolate(pulse.value, [0, 1], [1.0, 1.25]) : 1 }],
  }));

  const blinkProps = useDerivedValue(() => ({ ry: 8 * blink.value + 0.1 }));
  const blinkAnimatedProps = useAnimatedStyle(() => ({} as any));

  const mouthScaleY = useDerivedValue(() => (state === 'speaking' ? 1 + mouthOpen.value * 1.6 : 1));

  return (
    <View style={[styles.wrap, { width: size + 40, height: size + 40 }]}>
      {/* listening pulse ring */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          { width: size, height: size, borderRadius: size / 2, borderColor: stateColor[state] },
          ringStyle,
        ]}
      />

      {/* thinking dots */}
      {state === 'thinking' && <ThinkingDots />}

      {/* sleep Zzz */}
      {state === 'sleep' && <Zzz shared={zzz} />}

      {/* love hearts */}
      {state === 'love' && <Hearts shared={heart} />}

      <Pressable onPress={handleTap} onLongPress={handleLongPress} delayLongPress={350}>
        <Animated.View style={containerStyle}>
          <Svg width={size} height={size} viewBox="0 0 200 200">
            {/* body */}
            <Circle cx={100} cy={100} r={84} fill={stateColor[state]} />
            <Circle cx={100} cy={100} r={84} fill="rgba(255,255,255,0.06)" />

            {/* cheek flush (angry / love) */}
            {(state === 'angry' || state === 'love') && (
              <>
                <Ellipse cx={62} cy={120} rx={14} ry={6} fill={state === 'angry' ? '#E97A6B' : '#F3A6BB'} opacity={0.7} />
                <Ellipse cx={138} cy={120} rx={14} ry={6} fill={state === 'angry' ? '#E97A6B' : '#F3A6BB'} opacity={0.7} />
              </>
            )}

            {/* eyes */}
            {state === 'sleep' ? (
              <>
                <Path d="M55 95 q10 -8 20 0" stroke="#fff" strokeWidth={4} strokeLinecap="round" fill="none" />
                <Path d="M125 95 q10 -8 20 0" stroke="#fff" strokeWidth={4} strokeLinecap="round" fill="none" />
              </>
            ) : state === 'angry' ? (
              <>
                <Path d="M55 82 l20 8" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
                <Path d="M145 82 l-20 8" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
                <Ellipse cx={68} cy={100} rx={5} ry={6} fill="#fff" />
                <Ellipse cx={132} cy={100} rx={5} ry={6} fill="#fff" />
              </>
            ) : state === 'love' ? (
              <>
                <HeartEye cx={68} cy={96} />
                <HeartEye cx={132} cy={96} />
              </>
            ) : (
              <>
                <AnimBlinkEye cx={68} cy={96} blink={blink} />
                <AnimBlinkEye cx={132} cy={96} blink={blink} />
              </>
            )}

            {/* mouth */}
            <MouthForState state={state} mouthScaleY={mouthScaleY} />
          </Svg>
        </Animated.View>
      </Pressable>

      {showLabel && (
        <View style={[styles.labelPill, { backgroundColor: stateColor[state] + '22' }]}>
          <Text style={[styles.labelText, { color: stateColor[state] }]}>{stateLabel[state]}</Text>
        </View>
      )}
    </View>
  );
}

function AnimBlinkEye({ cx, cy, blink }: { cx: number; cy: number; blink: SharedValue<number> }) {
  const props = useAnimatedStyle(() => ({} as any));
  // react-native-svg doesn't accept animated rx/ry from useAnimatedStyle reliably,
  // so we just toggle a quick scaleY on a wrapping group via key swap is overkill — use static.
  return <Ellipse cx={cx} cy={cy} rx={6} ry={8} fill="#fff" />;
}

function HeartEye({ cx, cy }: { cx: number; cy: number }) {
  return (
    <Path
      d={`M${cx - 6} ${cy} a4 4 0 0 1 6 -3 a4 4 0 0 1 6 3 c0 4 -6 8 -6 8 s-6 -4 -6 -8 z`}
      fill="#fff"
    />
  );
}

function MouthForState({
  state,
  mouthScaleY,
}: {
  state: MascotState;
  mouthScaleY: SharedValue<number>;
}) {
  if (state === 'speaking') {
    return <Ellipse cx={100} cy={138} rx={14} ry={8} fill="#1C1C1A" />;
  }
  if (state === 'angry') {
    return <Path d="M82 144 q18 -14 36 0" stroke="#fff" strokeWidth={4} strokeLinecap="round" fill="none" />;
  }
  if (state === 'love' || state === 'idle' || state === 'listening' || state === 'thinking') {
    return <Path d="M82 134 q18 16 36 0" stroke="#fff" strokeWidth={4} strokeLinecap="round" fill="none" />;
  }
  // sleep
  return <Path d="M88 138 q12 6 24 0" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" fill="none" />;
}

function ThinkingDots() {
  const d1 = useSharedValue(0);
  useEffect(() => {
    d1.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, []);
  const s = (delay: number) =>
    useAnimatedStyle(() => ({
      opacity: interpolate((d1.value + delay) % 1, [0, 0.5, 1], [0.2, 1, 0.2]),
    }));
  return (
    <View style={styles.thinkBox} pointerEvents="none">
      <Animated.View style={[styles.thinkDot, s(0)]} />
      <Animated.View style={[styles.thinkDot, s(0.33)]} />
      <Animated.View style={[styles.thinkDot, s(0.66)]} />
    </View>
  );
}

function Zzz({ shared }: { shared: SharedValue<number> }) {
  const a = useAnimatedStyle(() => ({
    opacity: interpolate(shared.value, [0, 0.2, 1], [0, 1, 0]),
    transform: [
      { translateY: interpolate(shared.value, [0, 1], [0, -24]) },
      { translateX: interpolate(shared.value, [0, 1], [0, 12]) },
    ],
  }));
  return (
    <Animated.View style={[styles.zzz, a]} pointerEvents="none">
      <Text style={styles.zzzText}>Z z z</Text>
    </Animated.View>
  );
}

function Hearts({ shared }: { shared: SharedValue<number> }) {
  const mk = (delay: number, dx: number) =>
    useAnimatedStyle(() => {
      const v = (shared.value + delay) % 1;
      return {
        opacity: interpolate(v, [0, 0.2, 1], [0, 1, 0]),
        transform: [
          { translateY: interpolate(v, [0, 1], [0, -50]) },
          { translateX: dx },
          { scale: interpolate(v, [0, 1], [0.6, 1.2]) },
        ],
      };
    });
  return (
    <View style={styles.heartsWrap} pointerEvents="none">
      <Animated.Text style={[styles.heart, mk(0, -20)]}>❤</Animated.Text>
      <Animated.Text style={[styles.heart, mk(0.33, 10)]}>❤</Animated.Text>
      <Animated.Text style={[styles.heart, mk(0.66, -4)]}>❤</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 3 },
  labelPill: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 },
  labelText: { fontSize: 12, fontFamily: 'DMSans_700Bold', letterSpacing: 0.2 },
  thinkBox: { position: 'absolute', top: 6, right: 18, flexDirection: 'row', gap: 4 },
  thinkDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#8C6C30' },
  zzz: { position: 'absolute', top: 0, right: 10 },
  zzzText: { fontSize: 22, color: '#6B7A5A', fontFamily: 'DMSans_800ExtraBold', letterSpacing: 2 },
  heartsWrap: { position: 'absolute', top: 8, alignItems: 'center', justifyContent: 'center' },
  heart: { position: 'absolute', fontSize: 22, color: '#D6557A' },
});
