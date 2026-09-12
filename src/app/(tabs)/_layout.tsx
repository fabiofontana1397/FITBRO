import { Redirect } from 'expo-router';
import { View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { ChatFab } from '@/components/chat/chat-fab';
import { useStoreHydrated } from '@/hooks/use-store-hydrated';
import { useAppStore } from '@/store/app-store';

export default function TabLayout() {
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const hydrated = useStoreHydrated(useAppStore);

  // Avoid a flash to onboarding for returning users while AsyncStorage loads.
  if (!hydrated) return null;
  if (!hasOnboarded) return <Redirect href="/onboarding" />;

  return (
    <View style={{ flex: 1 }}>
      <AppTabs />
      <ChatFab />
    </View>
  );
}
