import { DarkTheme, DefaultTheme, Redirect, Stack, ThemeProvider, usePathname } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStoreHydrated } from '@/hooks/use-store-hydrated';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';

SplashScreen.preventAutoHideAsync();

// Routes reachable without an account — every other route (including deep
// links like /onboarding or /profile opened directly, bypassing "/") must
// still go through the welcome/onboarding gate below.
const PUBLIC_ROUTES = new Set(['/welcome', '/login', '/register']);

function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const authHydrated = useStoreHydrated(useAuthStore);
  const appHydrated = useStoreHydrated(useAppStore);

  if (!authHydrated || !appHydrated) return null;

  if (!isAuthenticated && !PUBLIC_ROUTES.has(pathname)) {
    return <Redirect href="/welcome" />;
  }
  // The post-questionnaire summary/celebration/roadmap screens are still
  // part of onboarding (hasOnboarded flips true only at the very end).
  if (isAuthenticated && !hasOnboarded && !pathname.startsWith('/onboarding')) {
    return <Redirect href="/onboarding" />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="welcome" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="onboarding-created" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="onboarding-roadmap" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
          <Stack.Screen name="chat" options={{ presentation: 'modal' }} />
          <Stack.Screen name="diet-plan" options={{ presentation: 'modal' }} />
          <Stack.Screen name="training-plan" options={{ presentation: 'modal' }} />
          <Stack.Screen name="training-progress" options={{ presentation: 'modal' }} />
        </Stack>
      </AuthGate>
    </ThemeProvider>
  );
}
