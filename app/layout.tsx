import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/components/AppContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'PharmaLink — Galaxy Swiss Bourdin (GSB) | Place de marché B2B',
  description:
    'Plateforme pharmaceutique B2B pour les professionnels de santé et les laboratoires partenaires. Approvisionnement direct, gestion de panier et suivi de commande. BTS SIO SLAM.',
  keywords: 'GSB, Galaxy Swiss Bourdin, PharmaLink, pharmacie, médicaments, B2B, BTS SIO SLAM, santé, commande médicale',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col font-sans text-[#3a3826] bg-[#fbf7ec] antialiased selection:bg-[#b8934a]/30 selection:text-[#3a3826]">
        <AppProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
