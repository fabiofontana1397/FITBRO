import { Redirect } from 'expo-router';
import { View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { ChatFab } from '@/components/chat/chat-fab';
import { useStoreHydrated } from '@/hooks/use-store-hydrated';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';

export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const authHydrated = useStoreHydrated(useAuthStore);
  const appHydrated = useStoreHydrated(useAppStore);

  // Avoid a flash to welcome/onboarding for returning users while AsyncStorage loads.
  if (!authHydrated || !appHydrated) return null;
  if (!isAuthenticated) return <Redirect href="/welcome" />;
  if (!hasOnboarded) return <Redirect href="/onboarding" />;

  return (
    <View style={{ flex: 1 }}>
      <AppTabs />
      <ChatFab />
    </View>
  );
}
