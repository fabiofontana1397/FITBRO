import { View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { ChatFab } from '@/components/chat/chat-fab';

// Auth/onboarding gating now lives in the root layout (src/app/_layout.tsx)
// so it applies to every route, not just this tab group.
export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <AppTabs />
      <ChatFab />
    </View>
  );
}
