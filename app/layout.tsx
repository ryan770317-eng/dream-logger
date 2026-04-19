import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: '夢境探索紀錄 · SOMNIUM',
  description: '用語音擷取夢境訊號，封存至探索檔案庫',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '夢境探索紀錄',
  },
};

export const viewport: Viewport = {
  themeColor: '#06060f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+TC:wght@300;400;500;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <div className="sky-bg" aria-hidden />
        <div className="stars" aria-hidden />
        <div className="stars l2" aria-hidden />
        <div className="hud-corner hud-tl" aria-hidden />
        <div className="hud-corner hud-tr" aria-hidden />
        <div className="hud-corner hud-bl" aria-hidden />
        <div className="hud-corner hud-br" aria-hidden />
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
