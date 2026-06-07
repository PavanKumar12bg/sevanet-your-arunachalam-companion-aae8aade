import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { AudioPlayer } from "../components/AudioPlayer";
import { Toaster } from "sonner";
import { ErrorBoundary } from "../components/ErrorBoundary";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-7xl font-display text-gradient-gold">404</h1>
        <p className="mt-3 text-muted-foreground">ఈ పేజీ కనుగొనబడలేదు</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-gradient-gold px-5 py-2 text-gold-foreground">హోమ్</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-display text-accent">ఏదో తప్పు జరిగింది</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={reset} className="rounded-full border border-border px-5 py-2 text-sm hover:border-accent">మళ్ళీ ప్రయత్నించండి</button>
          <a href="/" className="inline-block rounded-full bg-gradient-gold px-5 py-2 text-gold-foreground">హోమ్</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "సేవనెట్ — తెలుగు భక్తుల కోసం అరుణాచల సేవా వేదిక" },
      { name: "description", content: "అరుణాచలం యాత్రకు హోటల్స్, భోజనం, ధర్మశాలలు, దవాఖానాలు, మ్యాప్‌లు. తెలుగు భక్తుల కోసం." },
      { property: "og:title", content: "సేవనెట్ — SevaNet" },
      { property: "og:description", content: "అరుణాచల యాత్రకు అన్ని సేవలు ఒకే చోట." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="te">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1"><Outlet /></main>
        <SiteFooter />
        <AudioPlayer />
        <Toaster theme="dark" position="top-center" />
      </div>
    </QueryClientProvider>
  );
}
