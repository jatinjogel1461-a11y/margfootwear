import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "../lib/supabaseClient";
import { ThemeProvider } from "../components/ThemeProvider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist or has been moved.</p>
        <a href="/" className="mt-6 inline-block bg-neon text-neon-foreground px-5 py-2 rounded-md font-semibold">Go home</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="bg-neon text-neon-foreground px-4 py-2 rounded-md font-semibold">Try again</button>
          <a href="/" className="border border-border px-4 py-2 rounded-md">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=5.0" },
      { title: "Marg — Step Into Power" },
      { name: "description", content: "Marg premium footwear. Engineered for athletes, designed for the streets." },
      { name: "theme-color", content: "#0a0a0a" },
      { property: "og:title", content: "Marg — Step Into Power" },
      { property: "og:description", content: "Premium 3D shopping experience for the next generation of footwear." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/images/logo.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" },
      { rel: "icon", type: "image/png", href: "/images/logo.png" },
      { rel: "apple-touch-icon", href: "/images/logo.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body className="antialiased min-h-screen text-foreground selection:bg-neon selection:text-black transition-colors duration-300">
        {/* Global Base Gradient */}
        <div 
          className="fixed inset-0 -z-50 pointer-events-none bg-gradient-to-b from-background via-background/95 to-background transition-colors duration-300"
        />
        {/* Global Noise Overlay */}
        <div 
          className="fixed inset-0 -z-40 opacity-4 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==\")" }}
        />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { Preloader } from "../components/Preloader";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="marg-theme">
        <Preloader />
        <Outlet />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
