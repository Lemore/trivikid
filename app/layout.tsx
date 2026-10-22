import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { strings } from "@/lib/strings";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: strings.appName,
    template: `%s · ${strings.appName}`,
  },
  description: strings.home.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBF1E2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} antialiased`}>
      <body className="min-h-dvh overflow-x-hidden font-sans">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 sm:px-5">
          {children}
        </div>
      </body>
    </html>
  );
}
