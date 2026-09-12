import { View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { ChatFab } from '@/components/chat/chat-fab';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <AppTabs />
      <ChatFab />
    </View>
  );
}
