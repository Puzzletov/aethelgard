import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aethelgard",
  description: "Privacy-first document analysis",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
