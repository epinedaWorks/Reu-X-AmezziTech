import type { Metadata } from "next";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({ variable: "--font-plex", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const serif = Source_Serif_4({ variable: "--font-serif4", subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "Reu-X · Amezzi",
  description: "Actas y minutas de reunión a partir de grabaciones, videos o transcripciones.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
