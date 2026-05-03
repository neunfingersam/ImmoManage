import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://immo-manage.ch'),
  title: {
    default: 'ImmoManage – Immobilienverwaltung Schweiz',
    template: '%s | ImmoManage',
  },
  description: 'Die Schweizer Software für Hausverwaltungen und private Vermieter. Mietverträge, QR-Rechnungen, Mieterportal, Schadensmeldungen – einfach und CH-konform.',
  keywords: [
    'Immobilienverwaltung Schweiz', 'Hausverwaltung Software Schweiz', 'Mietverwaltung Software',
    'Vermieter Software Schweiz', 'QR Rechnung Miete', 'Mieterportal Schweiz',
    'Liegenschaftsverwaltung', 'Nebenkostenabrechnung Software', 'Mietvertrag digital Schweiz',
    'Verwaltungssoftware Immobilien', 'private Vermieter Software', 'WEG Verwaltung',
    'gestion immobilière Suisse', 'logiciel gérance immobilière', 'gestione immobiliare Svizzera',
    'property management Switzerland', 'Hausverwaltung digital', 'Schadensmeldung App',
  ],
  authors: [{ name: 'ImmoManage', url: 'https://immo-manage.ch' }],
  creator: 'ImmoManage',
  publisher: 'ImmoManage',
  openGraph: {
    type: 'website',
    locale: 'de_CH',
    alternateLocale: ['fr_CH', 'it_CH', 'en_GB'],
    url: 'https://immo-manage.ch',
    siteName: 'ImmoManage',
    title: 'ImmoManage – Immobilienverwaltung Schweiz',
    description: 'Die Schweizer Software für Hausverwaltungen und private Vermieter. Einfach, vollständig, CH-konform.',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'ImmoManage' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ImmoManage – Immobilienverwaltung Schweiz',
    description: 'Die Schweizer Software für Hausverwaltungen und private Vermieter.',
    images: ['/api/og'],
  },
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.json',
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://immo-manage.ch/de',
    languages: {
      'de-CH': 'https://immo-manage.ch/de',
      'fr-CH': 'https://immo-manage.ch/fr',
      'it-CH': 'https://immo-manage.ch/it',
      'en': 'https://immo-manage.ch/en',
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
