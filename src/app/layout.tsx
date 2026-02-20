import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "פוליסט - ניהול לקוחות ביטוח",
  description: "מערכת לניהול לקוחות ופוליסות ביטוח",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
