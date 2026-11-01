import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { SmoothScroll } from '@/components/smooth-scroll';

export const metadata: Metadata = {
  title: '@oblivion/fx · showcase',
  description: 'Los efectos del Oblivion FX Kit montados en Next.js con sus hooks.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        {/* Lo que arranca oculto se oculta solo con JS (docs/CONTRACT.md §5). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
