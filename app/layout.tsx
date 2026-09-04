import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://equipo-casa-altair.kcconsultoriainvesti.chatgpt.site'),
  title: 'Equipo Casa Altair | Club Equilibria 360',
  description:
    'Conoce a los integrantes de Casa Altair, sus perfiles profesionales, experiencia y participación en el desarrollo del proyecto de Club Equilibria 360.',
  openGraph: {
    title: 'Equipo Casa Altair | Club Equilibria 360',
    description:
      'Conoce a los integrantes de Casa Altair, sus perfiles profesionales, experiencia y participación en el proyecto.',
    url: '/',
    siteName: 'Casa Altair',
    locale: 'es_PE',
    type: 'website',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'Conoce al equipo de Casa Altair' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Equipo Casa Altair | Club Equilibria 360',
    description: 'Directorio profesional de Casa Altair y su participación en el proyecto.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
