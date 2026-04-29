import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "פוליסט - ניהול לקוחות ביטוח",
  description: "מערכת לניהול לקוחות ופוליסות ביטוח",
};

const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
