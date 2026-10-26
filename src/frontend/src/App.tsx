import { AuthenticatedApp } from "@/components/InternetIdentity";
import { Layout } from "@/components/Layout";
import { useCallerProfile } from "@/hooks/useQueries";
import { SoundboxProvider } from "@/lib/soundbox-context";
import { CardPage } from "@/pages/CardPage";
import { FriendsPage } from "@/pages/FriendsPage";
import { LeaderboardPage } from "@/pages/LeaderboardPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ScanPage } from "@/pages/ScanPage";
import { WalletPage } from "@/pages/WalletPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

/**
 * The shell lives inside the router tree so `useRouterState` and `Link`
 * always read a mounted router context instead of a null store.
 */
function RootShell() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

const rootRoute = createRootRoute({
  component: RootShell,
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: WalletPage,
});

const friendsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/friends",
  component: FriendsPage,
});

const scanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scan",
  component: ScanPage,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboard",
  component: LeaderboardPage,
});

const cardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/card",
  component: CardPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const routeTree = rootRoute.addChildren([
  walletRoute,
  friendsRoute,
  scanRoute,
  leaderboardRoute,
  cardRoute,
  profileRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/** Gate the private app behind onboarding, then render the routed shell. */
function PrivateApp() {
  const { data: profile, isLoading } = useCallerProfile();

  if (isLoading) {
    return (
      <div
        data-ocid="app.loading_state"
        className="grid min-h-dvh place-items-center bg-background text-muted-foreground"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Warming up the vault…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <OnboardingPage />;
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <SoundboxProvider>
      <AuthenticatedApp
        title="Neon Vault"
        description="Sign in with Internet Identity to open your fake-money arcade. No real rupees, only vibes."
        className="relative flex min-h-dvh flex-col items-center justify-center gap-5 overflow-hidden bg-background px-6 text-center text-foreground"
        buttonClassName="rounded-full bg-gradient-primary px-7 py-3.5 font-display font-bold text-primary-foreground shadow-pop transition-pop hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
      >
        <PrivateApp />
      </AuthenticatedApp>
    </SoundboxProvider>
  );
}
