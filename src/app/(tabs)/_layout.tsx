import AppTabs from '@/components/app-tabs';

// Auth/onboarding gating now lives in the root layout (src/app/_layout.tsx)
// so it applies to every route, not just this tab group. The chat FAB is
// rendered inside AppTabs' own floating bar row (external to the bar's
// surface, but docked at the same level), not as a separate overlay here.
export default function TabLayout() {
  return <AppTabs />;
}
