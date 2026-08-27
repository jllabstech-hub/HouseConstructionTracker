import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/language-context";
import { TopProgressBar } from "@/components/ui/top-progress-bar";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "House Construction Tracker",
  description:
    "Track every rupee spent on your house. Separate material purchases from labour payments, compare budget vs actual, and share professional PDF reports.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${sourceSerif.variable} font-sans antialiased`}>
        <TopProgressBar />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
