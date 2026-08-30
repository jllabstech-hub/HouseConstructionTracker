import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopProgressBar } from "@/components/ui/top-progress-bar";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#B85C22",
};

export const metadata: Metadata = {
  title: "House Construction Tracker",
  description:
    "Track every rupee spent on your house. Separate material purchases from labour payments, compare budget vs actual, and share professional PDF reports.",
  applicationName: "House Tracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "House Tracker",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <TopProgressBar />
        {children}
      </body>
    </html>
  );
}
