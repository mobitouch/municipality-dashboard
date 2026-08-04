import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { THEME_STORAGE_KEY, ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

/**
 * Applies the persisted theme before first paint, so a dark-mode user never
 * sees a flash of the light theme while ThemeProvider mounts and reads
 * localStorage. Kept inline here rather than in components/theme-provider.tsx:
 * next/script's `beforeInteractive` strategy is only meant for the root
 * layout, and the lint rule enforcing that checks the *file's* path for
 * "/app/" — it can't see that a component living outside app/ is only ever
 * rendered from here.
 */
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Staff Dashboard`,
    template: `%s · ${APP_NAME}`,
  },
  description: "Municipal staff dashboard for managing citizen requests and complaints.",
  // An internal tool has no business in a search index.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1d17" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col antialiased">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
