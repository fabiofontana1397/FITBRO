import { View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { ChatFab } from '@/components/chat/chat-fab';

// Auth/onboarding gating now lives in the root layout (src/app/_layout.tsx)
// so it applies to every route, not just this tab group.
//
// ChatFab is a sibling here, not nested inside AppTabs' TabList — expo-router
// /ui's <TabList asChild> apparently resolves taps anywhere in that subtree
// to "nearest known tab route" (nesting it inside the floating bar's row
// made every tap on the chat button silently navigate to a tab instead of
// opening chat). Keeping it external and only visually docked beside the
// bar (via matching absolute-position math in ChatFab) avoids that.
export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <AppTabs />
      <ChatFab />
    </View>
  );
}
