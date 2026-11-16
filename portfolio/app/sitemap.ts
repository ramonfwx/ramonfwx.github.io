import type { MetadataRoute } from "next";
import { projetos } from "@/data/projetos";
import { site } from "@/data/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const fixas = ["", "/projetos", "/contato"].map((r) => ({
    url: `${site.url}${r}/`,
  }));
  const paginas = projetos.map((p) => ({ url: `${site.url}/projetos/${p.slug}/` }));
  return [...fixas, ...paginas];
}
