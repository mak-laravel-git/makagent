import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Mono, Noto_Sans_Bengali } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap", axes: ["opsz"] });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono", display: "swap" });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bengali", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SalesPilot AI — by MakTech", template: "%s · SalesPilot AI" },
  description: "SalesPilot is the AI sales agent that turns every Facebook, Instagram and WhatsApp message into an order. Built by MakTech.",
  icons: { icon: "https://maktechgroup.com/Infinity.webp" },
};

export const viewport: Viewport = { themeColor: "#1c1c1c", width: "device-width", initialScale: 1 };

const themeScript = `try{var t=localStorage.getItem('sp-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${dmSans.variable} ${dmMono.variable} ${bengali.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
