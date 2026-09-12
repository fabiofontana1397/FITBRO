import { create } from 'zustand';

import { generateAssistantReply } from '@/lib/assistant/mock-assistant';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type ChatState = {
  messages: ChatMessage[];
  isTyping: boolean;
  send: (text: string) => void;
};

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Ciao! Sono il tuo coach FITBRO — chiedimi di allenamento, dieta, misure o del tuo obiettivo.',
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [WELCOME_MESSAGE],
  isTyping: false,
  send: (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    set((state) => ({ messages: [...state.messages, userMessage], isTyping: true }));

    const reply = generateAssistantReply(trimmed);
    setTimeout(() => {
      const assistantMessage: ChatMessage = { id: `a-${Date.now()}`, role: 'assistant', text: reply };
      set((state) => ({ messages: [...state.messages, assistantMessage], isTyping: false }));
    }, 450);
  },
}));
