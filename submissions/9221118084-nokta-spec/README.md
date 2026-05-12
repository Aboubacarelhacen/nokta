# NOKTA Spec — Week 14 Mascot Rework

## Track

Track A — Idea Clarifier / Spec Generator (now delivered as a mascot-led AI companion)

## Project Summary

NOKTA Spec is an Expo React Native app that turns rough product ideas into a
clean one-page spec through a guided five-question dialog. Week 14 reworks it
around a 2D animated **NOKTA mascot** and a voice-capable conversational loop
inspired by [`seyyah/nokta-mascot`](https://github.com/seyyah/nokta-mascot).

The original Track A linear form (Welcome → Input → Questions → Loading →
Spec) is preserved as “Form mode”, but the primary experience is now the new
**Talk to NOKTA** flow: a chat-style assistant with an emotional mascot,
speech-to-text input and text-to-speech replies.

## What's new in this rework

- `src/mascot/` — 2D SVG mascot with a state machine ported from the web repo's
  `NoktaAvatar.jsx`: `idle`, `listening`, `thinking`, `speaking`, `sleep`,
  `angry`, `love`. Auto-sleeps after 10 s, gets angry on three quick taps, shows
  hearts on long-press — same emotional vocabulary as the original.
- `src/voice/useVoice.ts` — Expo-friendly voice layer. Swaps Web Speech API for
  `expo-speech` (TTS) and `expo-speech-recognition` (STT), exactly as the
  upstream README instructs for RN ports.
- `src/screens/AssistantScreen.tsx` — conversational chat UI: mascot up top,
  bubbles thread, floating mic + send dock. The five Track A questions are now
  spoken by NOKTA one turn at a time.
- `src/assistant/script.ts` — the question script and `buildSpec()` that
  produces the final one-page spec from the dialog.
- Welcome screen now features the live mascot and a primary “Talk to NOKTA”
  CTA, with Form mode / Sample / History as secondary actions.
- `SpecScreen` accepts an optional `spec` route param so the assistant flow
  feeds its own answers in (the original hardcoded sample remains as a
  fallback).

## Adaptation notes (from `seyyah/nokta-mascot` README)

The upstream repo is a Vite/Three.js web app. Its README explicitly tells RN
ports to:

1. Replace the 3D `<Canvas>` + `<NoktaAvatar>` with a 2D animated character
   (Lottie or SVG). → We use **react-native-svg + reanimated** for the mascot.
2. Replace `window.SpeechRecognition` / `speechSynthesis` with RN libraries. →
   We use **`expo-speech-recognition`** and **`expo-speech`**.
3. Preserve the same state-machine logic for mascot emotion. → States and
   triggers (`idle/sleep/tickle/angry/love`) are kept; timings (10 s sleep,
   3-tap angry) match the upstream behavior.

We deliberately did **not** port the Groq Llama 3 call — the assignment is
demoable offline with mock logic, and a real LLM hook can drop into
`assistant/script.ts`'s `buildSpec()` later.

## Expo QR / Link

https://expo.dev/artifacts/eas/uAM23QzrgDUNJHnByYozoX.apk
(previous APK — rebuild with `eas build` to ship the mascot rework)

## Demo Video

https://youtu.be/WiZ61D546N8

## Decision Log

- Track A core flow preserved; the conversational layer wraps it rather than
  replacing it. Form mode is still reachable from Welcome.
- 2D SVG mascot chosen over Lottie to keep the bundle small and avoid an extra
  native dep; reanimated drives all emotion animations.
- Mock spec generation kept so the app runs fully offline for demo/APK.
- Voice modules are required dynamically — if a build is missing the native
  modules, the assistant degrades gracefully to text only.

## How to Run

```bash
cd app/nokta-spec-app
npm install
npx expo start
```

Voice input/output requires a custom dev build (not Expo Go):

```bash
npx expo prebuild
npx expo run:ios       # or run:android
```
