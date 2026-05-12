// Conversational script for NOKTA. Five clarifying engineering questions
// — same themes as the original Track 1 QuestionsScreen, just delivered
// as a guided assistant dialog rather than a linear form.

export type Turn = {
  id: string;
  theme: 'Greeting' | 'Problem' | 'Target User' | 'MVP Scope' | 'Constraints' | 'Exclusions';
  prompt: string;
  hint?: string;
  sample?: string;
};

export const GREETING =
  "Hi, I'm NOKTA. Share a rough idea — text or voice — and I'll guide you through five focused questions to shape it into a one-page spec.";

export const QUESTIONS: Turn[] = [
  {
    id: 'q1',
    theme: 'Problem',
    prompt: 'What specific problem are you trying to solve, and who feels it most?',
    hint: 'Describe the core pain point in one or two sentences.',
    sample: 'Students struggle to coordinate study groups — no clean way to divide topics or track who covers what.',
  },
  {
    id: 'q2',
    theme: 'Target User',
    prompt: 'Who is the primary user — and what role do they play in the flow?',
    hint: 'Be specific about role and context.',
    sample: 'All students in the group, but the group leader initiates setup and assigns topics.',
  },
  {
    id: 'q3',
    theme: 'MVP Scope',
    prompt: 'For version 1, what should the product do — and only do?',
    hint: 'List the small set of core features.',
    sample: 'Group creation, topic assignment, progress tracking, shared deadline view.',
  },
  {
    id: 'q4',
    theme: 'Constraints',
    prompt: 'What technical, time, or resource constraints should we plan around?',
    hint: 'Platform, deadline, team size, budget…',
    sample: 'Mobile-first React Native/Expo. 3-week timeline, team of 2.',
  },
  {
    id: 'q5',
    theme: 'Exclusions',
    prompt: 'What should v1 deliberately exclude — saying no is a design decision.',
    hint: 'List what you will NOT build yet.',
    sample: 'No real-time chat, no video, no AI suggestions — keep it focused.',
  },
];

export type Answers = Record<string, string>;

export function buildSpec(idea: string, answers: Answers) {
  return [
    { theme: 'Problem',     content: answers.q1 || '—', accent: '#C97A30' },
    { theme: 'Target User', content: answers.q2 || '—', accent: '#4A7A28' },
    { theme: 'MVP Scope',   content: answers.q3 || '—', accent: '#8C6C30' },
    { theme: 'Constraints', content: answers.q4 || '—', accent: '#A05C5C' },
    { theme: 'Exclusions',  content: answers.q5 || '—', accent: '#5C5CA0' },
    { theme: 'Original Idea', content: idea, accent: '#3A5218' },
  ];
}
