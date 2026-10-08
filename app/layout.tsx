import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Baskervville, Montserrat } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/components/locale-provider";
import { SiteChrome, SiteFooter } from "@/components/site-chrome";
import { serializeJsonLd } from "@/lib/security/json-ld";
const display = Baskervville({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});
const sans = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cieloterre.tn"),
  title: {
    default: "CieloTerre | Agence immobilière en Tunisie",
    template: "%s | CieloTerre",
  },
  description:
    "Trouvez votre prochain appartement, maison ou programme neuf en Tunisie avec CieloTerre, une agence immobilière attentive à chaque adresse.",
  keywords: [
    "agence immobilière Tunisie",
    "immobilier Tunisie",
    "acheter appartement Tunisie",
    "louer appartement Tunisie",
    "immobilier neuf Tunisie",
  ],
  openGraph: {
    title: "CieloTerre | Agence immobilière en Tunisie",
    description:
      "Des biens sélectionnés en Tunisie pour acheter, louer ou investir avec justesse.",
    locale: "fr_TN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CieloTerre | Agence immobilière en Tunisie",
    description:
      "Des biens sélectionnés en Tunisie pour acheter, louer ou investir avec justesse.",
  },
  generator: "CieloTerre",
};
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#2f7896",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "CieloTerre",
    url: "https://cieloterre.tn",
    description:
      "Agence immobilière en Tunisie : achat, location, gestion locative et programmes neufs.",
    areaServed: "TN",
  };
  return (
    <html lang="fr" className="bg-background" data-scroll-behavior="smooth">
      <body className={`${display.variable} ${sans.variable} antialiased`}>
        <SiteChrome />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
        />
        <LocaleProvider>{children}</LocaleProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
        <SiteFooter />
      </body>
    </html>
  );
}
