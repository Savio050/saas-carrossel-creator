import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Carrossel Creator - Gere carrosséis virais com IA',
  description: 'Plataforma SaaS para geração automática de carrosséis estilo tweet usando IA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
