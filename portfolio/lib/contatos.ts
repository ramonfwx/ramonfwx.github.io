import { site } from "@/data/site";

// Só os contatos que foram preenchidos em data/site.ts aparecem no site.
export const contatos: { rotulo: string; url: string; externo: boolean }[] = [
  { rotulo: "E-mail", url: site.email && `mailto:${site.email}`, externo: false },
  {
    rotulo: "WhatsApp",
    url: site.whatsapp && `https://wa.me/${site.whatsapp.replace(/\D/g, "")}`,
    externo: true,
  },
  { rotulo: "Instagram", url: site.redes.instagram, externo: true },
  { rotulo: "GitHub", url: site.redes.github, externo: true },
  { rotulo: "Behance", url: site.redes.behance, externo: true },
  { rotulo: "LinkedIn", url: site.redes.linkedin, externo: true },
].filter((c) => c.url);
