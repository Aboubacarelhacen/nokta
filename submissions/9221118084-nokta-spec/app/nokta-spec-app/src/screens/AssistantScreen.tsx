import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import Mascot from '../mascot/Mascot';
import { MascotState } from '../mascot/MascotState';
import { useVoice } from '../voice/useVoice';
import { GREETING, QUESTIONS, Answers, buildSpec } from '../assistant/script';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Assistant'>;

type Bubble = { from: 'nokta' | 'user'; text: string; id: string };

export default function AssistantScreen() {
  const navigation = useNavigation<NavigationProp>();
  const voice = useVoice();

  const [mascot, setMascot] = useState<MascotState>('idle');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [draft, setDraft] = useState('');
  const [stage, setStage] = useState<'idea' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'done'>('idea');
  const [idea, setIdea] = useState('');
  const [answers, setAnswers] = useState<Answers>({});
  const scrollRef = useRef<ScrollView>(null);
  const greetedRef = useRef(false);

  // Sync draft with live STT transcript
  useEffect(() => {
    if (voice.status === 'listening' && voice.transcript) setDraft(voice.transcript);
  }, [voice.transcript, voice.status]);

  // Mascot reacts to voice status
  useEffect(() => {
    if (voice.status === 'listening') setMascot('listening');
    else if (voice.status === 'speaking') setMascot('speaking');
    else setMascot(m => (m === 'listening' || m === 'speaking' ? 'idle' : m));
  }, [voice.status]);

  const push = (b: Omit<Bubble, 'id'>) =>
    setBubbles(prev => [...prev, { ...b, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }]);

  const noktaSay = (text: string, onDone?: () => void) => {
    push({ from: 'nokta', text });
    setMascot('speaking');
    voice.speak(text, {
      onDone: () => {
        setMascot('idle');
        onDone?.();
      },
    });
  };

  // Initial greeting
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const t = setTimeout(() => noktaSay(GREETING), 350);
    return () => clearTimeout(t);
  }, []);

  // Auto-scroll
  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [bubbles, stage]);

  const currentPrompt = useMemo(() => {
    if (stage === 'idea') return 'Type or speak your rough idea…';
    const q = QUESTIONS.find(q => q.id === stage);
    return q ? `Answer about ${q.theme.toLowerCase()}…` : '';
  }, [stage]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    push({ from: 'user', text });
    setDraft('');
    voice.setTranscript('');
    if (voice.status === 'listening') voice.stopListening();
    advance(text);
  };

  const advance = (text: string) => {
    setMascot('thinking');
    setTimeout(() => {
      if (stage === 'idea') {
        setIdea(text);
        const q = QUESTIONS[0];
        setStage('q1');
        noktaSay(`Got it. ${q.prompt}`);
        return;
      }
      const idx = QUESTIONS.findIndex(q => q.id === stage);
      const updated = { ...answers, [stage]: text };
      setAnswers(updated);
      if (idx < QUESTIONS.length - 1) {
        const next = QUESTIONS[idx + 1];
        setStage(next.id as any);
        noktaSay(next.prompt);
      } else {
        setStage('done');
        noktaSay('Perfect — generating your one-page spec now.', () => {
          navigation.navigate('Spec', { idea, answers: updated, spec: buildSpec(idea, updated) });
        });
      }
    }, 650);
  };

  const useSample = () => {
    if (stage === 'idea') {
      setDraft('I want to build an app that helps university students organize study groups and divide revision topics fairly.');
      return;
    }
    const q = QUESTIONS.find(q => q.id === stage);
    if (q?.sample) setDraft(q.sample);
  };

  const onMic = async () => {
    if (voice.status === 'listening') {
      voice.stopListening();
      return;
    }
    voice.stopSpeaking();
    const ok = await voice.startListening();
    if (!ok) {
      noktaSay('Voice input is not available on this build — please type your answer.');
    }
  };

  const progress = stage === 'idea' ? 0 : stage === 'done' ? 100 :
    Math.round((QUESTIONS.findIndex(q => q.id === stage) + 1) / QUESTIONS.length * 100);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Svg width="9" height="15" viewBox="0 0 9 15" fill="none">
              <Path d="M7.5 1.5L2 7.5l5.5 6" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.title}>NOKTA</Text>
            <Text style={styles.subtitle}>AI Spec Assistant</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Mascot strip */}
        <View style={styles.mascotStrip}>
          <Mascot state={mascot} onStateChange={setMascot} size={130} />
          {stage !== 'idea' && (
            <View style={styles.progressWrap}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressTxt}>{stage === 'done' ? 'Spec ready' : `Step ${QUESTIONS.findIndex(q => q.id === stage) + 1} of ${QUESTIONS.length}`}</Text>
            </View>
          )}
        </View>

        {/* Chat thread */}
        <ScrollView
          ref={scrollRef}
          style={styles.thread}
          contentContainerStyle={{ padding: 16, paddingBottom: 8, gap: 10 }}
          keyboardShouldPersistTaps="handled"
        >
          {bubbles.map(b => (
            <Animated.View
              key={b.id}
              entering={b.from === 'nokta' ? FadeInUp.duration(280) : FadeInDown.duration(220)}
              layout={Layout.springify()}
              style={[styles.bubble, b.from === 'nokta' ? styles.bubbleNokta : styles.bubbleUser]}
            >
              <Text style={[styles.bubbleText, b.from === 'user' && { color: '#fff' }]}>{b.text}</Text>
            </Animated.View>
          ))}
          {mascot === 'thinking' && (
            <View style={[styles.bubble, styles.bubbleNokta, { paddingVertical: 12 }]}>
              <Text style={styles.bubbleText}>•••</Text>
            </View>
          )}
        </ScrollView>

        {/* Input dock */}
        <View style={styles.dock}>
          <View style={styles.inputRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={currentPrompt}
              placeholderTextColor="#9C968C"
              style={styles.input}
              multiline
            />
          </View>
          <View style={styles.dockActions}>
            <Pressable onPress={useSample} style={styles.sampleBtn}>
              <Text style={styles.sampleTxt}>Use sample</Text>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={onMic}
                style={[styles.micBtn, { backgroundColor: voice.status === 'listening' ? '#E05555' : colors.accentLight }]}
              >
                {voice.status === 'listening' ? (
                  <Text style={[styles.micTxt, { color: '#fff' }]}>● Stop</Text>
                ) : (
                  <>
                    <Svg width="10" height="13" viewBox="0 0 10 13" fill="none">
                      <Rect x="2" y="0" width="6" height="8.5" rx="3" fill={colors.accent} />
                      <Path d="M1 7c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke={colors.accent} strokeWidth="1.4" strokeLinecap="round" />
                      <Line x1="5" y1="11" x2="5" y2="13" stroke={colors.accent} strokeWidth="1.4" strokeLinecap="round" />
                    </Svg>
                    <Text style={styles.micTxt}>Voice</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                onPress={send}
                disabled={!draft.trim()}
                style={[styles.sendBtn, { backgroundColor: draft.trim() ? colors.accent : '#E8E2D8' }]}
              >
                <Text style={[styles.sendTxt, { color: draft.trim() ? '#fff' : '#B5AFA8' }]}>Send →</Text>
              </Pressable>
            </View>
          </View>
          {!voice.supported.tts && (
            <Text style={styles.hint}>Voice output disabled — install expo-speech for spoken replies.</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 6, paddingBottom: 4 },
  iconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontFamily: 'DMSans_800ExtraBold', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 11, color: colors.subText, fontFamily: 'DMSans_500Medium' },

  mascotStrip: { alignItems: 'center', paddingTop: 4, paddingBottom: 6 },
  progressWrap: { width: '70%', marginTop: 8 },
  progressBar: { height: 4, backgroundColor: '#E8E2D5', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 99 },
  progressTxt: { textAlign: 'center', fontSize: 10, color: colors.subText, marginTop: 4, fontFamily: 'DMSans_500Medium' },

  thread: { flex: 1 },
  bubble: { maxWidth: '85%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleNokta: { backgroundColor: colors.card, alignSelf: 'flex-start', borderTopLeftRadius: 4 },
  bubbleUser: { backgroundColor: colors.accent, alignSelf: 'flex-end', borderTopRightRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20, color: colors.text, fontFamily: 'DMSans_400Regular' },

  dock: { padding: 12, paddingTop: 8, gap: 8, borderTopWidth: 1, borderTopColor: '#EDE6D8', backgroundColor: colors.bg },
  inputRow: { backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#EDE6D8' },
  input: { fontSize: 14, color: colors.text, fontFamily: 'DMSans_400Regular', minHeight: 38, maxHeight: 110 },
  dockActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sampleBtn: { paddingHorizontal: 6, paddingVertical: 6 },
  sampleTxt: { fontSize: 11, color: colors.subText, fontFamily: 'DMSans_700Bold' },
  micBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12 },
  micTxt: { fontSize: 12, color: colors.accent, fontFamily: 'DMSans_700Bold' },
  sendBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  sendTxt: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  hint: { fontSize: 10, color: colors.subText, textAlign: 'center', fontFamily: 'DMSans_400Regular' },
});
