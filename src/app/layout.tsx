import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import RouteChangeLoader from '@/layout/RouteChangeLoader';
import { Suspense } from 'react';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <RouteChangeLoader />
              {children}
            </Suspense>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
