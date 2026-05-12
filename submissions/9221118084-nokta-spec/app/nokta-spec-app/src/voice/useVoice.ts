import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Lazy/optional imports — keeps the app demoable even if a native module is missing
// (e.g. in Expo Go without a dev build). The seyyah/nokta-mascot README explicitly
// tells RN ports to swap window.SpeechRecognition + speechSynthesis for these libs:
//   - expo-speech (TTS)
//   - expo-speech-recognition (STT) — already in package.json
let Speech: any = null;
let SpeechRecognitionMod: any = null;
try {
  Speech = require('expo-speech');
} catch {}
try {
  SpeechRecognitionMod = require('expo-speech-recognition');
} catch {}

export type VoiceStatus = 'idle' | 'listening' | 'speaking';

export function useVoice() {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState({
    tts: !!Speech,
    stt: !!SpeechRecognitionMod?.ExpoSpeechRecognitionModule,
  });
  const subs = useRef<Array<{ remove: () => void }>>([]);

  useEffect(() => {
    return () => {
      subs.current.forEach(s => s?.remove?.());
      subs.current = [];
      try { Speech?.stop?.(); } catch {}
      try { SpeechRecognitionMod?.ExpoSpeechRecognitionModule?.stop?.(); } catch {}
    };
  }, []);

  const speak = useCallback((text: string, opts?: { onDone?: () => void }) => {
    if (!Speech) { opts?.onDone?.(); return; }
    try {
      Speech.stop?.();
      setStatus('speaking');
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.05,
        rate: Platform.OS === 'ios' ? 0.5 : 1.0,
        onDone: () => { setStatus('idle'); opts?.onDone?.(); },
        onStopped: () => { setStatus('idle'); },
        onError: () => { setStatus('idle'); opts?.onDone?.(); },
      });
    } catch {
      setStatus('idle');
      opts?.onDone?.();
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    try { Speech?.stop?.(); } catch {}
    setStatus('idle');
  }, []);

  const startListening = useCallback(async () => {
    const mod = SpeechRecognitionMod?.ExpoSpeechRecognitionModule;
    if (!mod) {
      setSupported(s => ({ ...s, stt: false }));
      return false;
    }
    try {
      const perm = await SpeechRecognitionMod.ExpoSpeechRecognitionModule.requestPermissionsAsync?.();
      if (perm && perm.granted === false) return false;
    } catch {}
    setTranscript('');
    setStatus('listening');

    subs.current.forEach(s => s?.remove?.());
    subs.current = [];
    try {
      subs.current.push(
        SpeechRecognitionMod.addSpeechRecognitionListener('result', (e: any) => {
          const t = e?.results?.[0]?.transcript ?? '';
          if (t) setTranscript(t);
        }),
      );
      subs.current.push(
        SpeechRecognitionMod.addSpeechRecognitionListener('end', () => setStatus('idle')),
      );
      subs.current.push(
        SpeechRecognitionMod.addSpeechRecognitionListener('error', () => setStatus('idle')),
      );
      mod.start({ lang: 'en-US', interimResults: true, continuous: false });
      return true;
    } catch {
      setStatus('idle');
      return false;
    }
  }, []);

  const stopListening = useCallback(() => {
    try { SpeechRecognitionMod?.ExpoSpeechRecognitionModule?.stop?.(); } catch {}
    setStatus('idle');
  }, []);

  return { status, transcript, setTranscript, supported, speak, stopSpeaking, startListening, stopListening };
}
