import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import GreenPill from '../components/GreenPill';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Mascot from '../mascot/Mascot';
import { MascotState } from '../mascot/MascotState';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [mascot, setMascot] = useState<MascotState>('idle');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.hero}>
          <View style={{ marginBottom: 14 }}>
            <GreenPill label="Track 1 · AI Spec Companion" />
          </View>

          {/* Mascot replaces the static logo card — the visible NOKTA "dot". */}
          <Mascot state={mascot} onStateChange={setMascot} size={170} />

          <Text style={styles.title}>NOKTA</Text>
          <Text style={styles.subtitle}>
            Your AI spec companion. Talk to NOKTA — it asks the right engineering questions and turns your idea into a one-page spec.
          </Text>

          <View style={styles.stepsCard}>
            {[
              { n: '01', t: 'Greet & spark', s: 'Mascot greets you, you share an idea (voice or text)' },
              { n: '02', t: 'Guided dialog', s: '5 clarifying questions — problem, user, scope…' },
              { n: '03', t: 'One-page spec', s: 'Structured, readable, ready to share' },
            ].map((row, i) => (
              <View key={i} style={[styles.stepRow, i < 2 && styles.stepRowBorder]}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{row.n}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{row.t}</Text>
                  <Text style={styles.stepSub}>{row.s}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).duration(500).springify()} style={styles.ctaContainer}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Assistant')} style={styles.startBtn}>
            <Text style={styles.startBtnText}>Talk to NOKTA →</Text>
          </TouchableOpacity>
          <View style={styles.rowBtns}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Input')} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Form mode</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Spec', {})} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>View Sample</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('History')} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>My Specs</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.tipMascot}>Tip: tap the mascot 3x quickly, or long-press to pet it ❤</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5EFE0' },
  container: { flex: 1, backgroundColor: '#F5EFE0', flexDirection: 'column', paddingBottom: 26 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: 10 },
  title: { fontSize: 30, fontFamily: 'DMSans_800ExtraBold', color: colors.text, letterSpacing: -0.6, marginTop: 4 },
  subtitle: { fontSize: 13, color: colors.subText, textAlign: 'center', maxWidth: 290, lineHeight: 20, fontFamily: 'DMSans_400Regular', marginTop: 6 },
  stepsCard: { marginTop: 22, backgroundColor: colors.card, borderRadius: 22, paddingVertical: 16, paddingHorizontal: 18, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepRowBorder: { paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0EBE2' },
  stepNum: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 11, fontFamily: 'DMSans_800ExtraBold', color: colors.accent },
  stepTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: colors.text, lineHeight: 18 },
  stepSub: { fontSize: 12, color: colors.subText, marginTop: 1, fontFamily: 'DMSans_400Regular' },
  ctaContainer: { paddingHorizontal: 22, gap: 10 },
  startBtn: { backgroundColor: colors.accent, borderRadius: 18, padding: 16, alignItems: 'center', shadowColor: colors.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.31, shadowRadius: 24, elevation: 6 },
  startBtnText: { color: '#fff', fontSize: 16, fontFamily: 'DMSans_700Bold', letterSpacing: -0.2 },
  rowBtns: { flexDirection: 'row', gap: 8 },
  secondaryBtn: { flex: 1, backgroundColor: colors.card, borderRadius: 14, paddingVertical: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  secondaryBtnText: { color: colors.text, fontSize: 12, fontFamily: 'DMSans_700Bold' },
  tipMascot: { fontSize: 10, color: colors.subText, textAlign: 'center', marginTop: 6, fontFamily: 'DMSans_500Medium' },
});
