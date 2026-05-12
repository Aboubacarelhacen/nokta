import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import InputScreen from '../screens/InputScreen';
import QuestionsScreen from '../screens/QuestionsScreen';
import LoadingScreen from '../screens/LoadingScreen';
import SpecScreen from '../screens/SpecScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AssistantScreen from '../screens/AssistantScreen';

export type SpecParams = {
  idea?: string;
  answers?: Record<string, string>;
  spec?: Array<{ theme: string; content: string; accent: string }>;
};

export type RootStackParamList = {
  Welcome: undefined;
  Assistant: undefined;
  Input: undefined;
  Questions: undefined;
  Loading: undefined;
  Spec: SpecParams | undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Assistant" component={AssistantScreen} />
      <Stack.Screen name="Input" component={InputScreen} />
      <Stack.Screen name="Questions" component={QuestionsScreen} />
      <Stack.Screen name="Loading" component={LoadingScreen} />
      <Stack.Screen name="Spec" component={SpecScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
    </Stack.Navigator>
  );
}
