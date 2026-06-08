import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { AudioPlayer } from "../components/AudioPlayer";
import { Toaster } from "sonner";
import { ErrorBoundary } from "../components/ErrorBoundary";
import "../i18n";
import faviconAsset from "@/assets/sevanet-logo.png";

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
      { title: "SevaNet – Telugu Pilgrim Companion" },
      { name: "description", content: "SevaNet (సేవనెట్) — Telugu pilgrim companion for Arunachalam: hotels, food, dharmashalas, hospitals, maps, and live Girivalam GPS tracker." },
      { name: "application-name", content: "SevaNet" },
      { name: "apple-mobile-web-app-title", content: "SevaNet" },
      { name: "theme-color", content: "#c2410c" },
      { property: "og:title", content: "SevaNet – Telugu Pilgrim Companion" },
      { property: "og:description", content: "SevaNet (సేవనెట్) — Telugu pilgrim companion for Arunachalam: hotels, food, dharmashalas, hospitals, maps, and live Girivalam GPS tracker." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "SevaNet" },
      { name: "twitter:title", content: "SevaNet – Telugu Pilgrim Companion" },
      { name: "twitter:description", content: "SevaNet (సేవనెట్) — Telugu pilgrim companion for Arunachalam: hotels, food, dharmashalas, hospitals, maps, and live Girivalam GPS tracker." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/8d0841c0-8d3b-437c-824b-eca351693d6d" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/8d0841c0-8d3b-437c-824b-eca351693d6d" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: faviconAsset },
      { rel: "apple-touch-icon", href: faviconAsset },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "alternate", hrefLang: "te-IN", href: "/" },
      { rel: "alternate", hrefLang: "hi-IN", href: "/" },
      { rel: "alternate", hrefLang: "kn-IN", href: "/" },
      { rel: "alternate", hrefLang: "x-default", href: "/" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="te-IN">
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
        <main className="flex-1">
          <ErrorBoundary label="route">
            <Outlet />
          </ErrorBoundary>
        </main>
        <SiteFooter />
        <AudioPlayer />
        <Toaster theme="dark" position="top-center" />
      </div>
    </QueryClientProvider>
  );
}
