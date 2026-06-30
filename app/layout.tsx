import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "StockSignal | Public Market Signal Dashboard",
  description: "Track public market signals from disclosures, contracts, lobbying activity, and news sentiment."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          {children}
          <footer className="border-t border-border px-6 py-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
              <Link href="/" className="font-mono text-sm font-bold tracking-wide text-zinc-300">
                StockSignal
              </Link>
              <p>This is not financial advice. Signal data is for informational purposes only.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
