import React, { type ReactNode } from 'react';
import './globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AppProviders } from '@/lib/providers/AppProviders';

export const metadata = {
  title: 'Sistema Contable Comunidades',
  description: 'Plataforma financiera para asociaciones comunales'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
