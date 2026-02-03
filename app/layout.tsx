import './globals.css';
import { Providers } from '@/lib/providers';

export const metadata = {
  title: 'Sistema Contable',
  description: 'Gestion financiera contable para asociaciones'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
