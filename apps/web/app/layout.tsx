import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Manrope, DM_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PwaRegister } from "@/components/pwa-register";

const dmSansHeading = DM_Sans({ subsets: ["latin"], variable: "--font-heading" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Codemate",
  description: "Codemate chat workspace",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/icon.png",
    icon: ["/icon.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Codemate",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1117",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        manrope.variable,
        dmSansHeading.variable
      )}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <PwaRegister />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
