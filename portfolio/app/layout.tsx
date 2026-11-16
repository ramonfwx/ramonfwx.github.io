import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./fio.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Ambiente from "@/components/Ambiente";
import Intro from "@/components/Intro";
import Providers from "@/components/Providers";
import SmoothScroll from "@/components/SmoothScroll";
import { site } from "@/data/site";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.nomeCompleto} — Desenvolvimento, design e audiovisual`,
    template: `%s — ${site.nomeCompleto}`,
  },
  description: site.descricao,
  openGraph: {
    title: `${site.nomeCompleto} — Entre tecnologia, imagem e movimento`,
    description: site.descricao,
    type: "website",
    locale: "pt_BR",
    url: site.url,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:bg-texto focus:px-4 focus:py-2 focus:text-fundo"
        >
          Ir para o conteúdo
        </a>
        <Providers>
          <SmoothScroll>
            <Ambiente />
            <Intro />
            <Header />
            <main id="conteudo" className="flex-1">
              {children}
            </main>
            <Footer />
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}
