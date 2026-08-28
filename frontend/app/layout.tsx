import type { Metadata } from "next";

import { cssTokenVariables } from "../design/tokens";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aethelgard",
  description: "Private document reasoning with a browser-local trust boundary.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" style={cssTokenVariables}>
      <body>{children}</body>
    </html>
  );
}
