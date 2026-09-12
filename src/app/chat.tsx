import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SUGGESTED_PROMPTS } from '@/lib/assistant/mock-assistant';
import { useChatStore, type ChatMessage } from '@/store/chat-store';

export default function ChatScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { messages, isTyping, send } = useChatStore();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    send(text);
    setDraft('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.select({ ios: 'padding', default: undefined })}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <View style={{ flex: 1 }}>
          <ThemedText type="subtitle">Coach FITBRO</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {isTyping ? 'Sta scrivendo…' : 'Nutrizionista & personal trainer AI'}
          </ThemedText>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <GlassSurface level="card" radius={Radius.pill} style={styles.closeButton}>
            <View style={styles.closeInner}>
              <Icon name="close" size={18} color={theme.text} />
            </View>
          </GlassSurface>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        style={styles.list}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => <Bubble message={item} />}
      />

      {messages.length <= 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsRow}>
          {SUGGESTED_PROMPTS.map((prompt) => (
            <Pressable key={prompt} onPress={() => handleSend(prompt)} style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="caption">{prompt}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + Spacing.two, borderTopColor: theme.border }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Scrivi al tuo coach…"
          placeholderTextColor={theme.textTertiary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          onSubmitEditing={() => handleSend(draft)}
          returnKeyType="send"
        />
        <Pressable onPress={() => handleSend(draft)} style={[styles.sendButton, { backgroundColor: theme.accent }]}>
          <Icon name="send" size={18} color={theme.onAccent} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const theme = useTheme();
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      <View
        style={[
          styles.bubble,
          { backgroundColor: isUser ? theme.accent : theme.backgroundElement, borderBottomRightRadius: isUser ? 4 : Radius.medium, borderBottomLeftRadius: isUser ? Radius.medium : 4 },
        ]}>
        <ThemedText type="small" style={{ color: isUser ? theme.onAccent : theme.text }}>
          {message.text}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  closeButton: {
    width: 36,
    height: 36,
  },
  closeInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  bubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
  },
  chipsScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipsRow: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
