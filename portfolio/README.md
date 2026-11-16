# Portfólio de Ramon Lima

Site pessoal em Next.js (App Router), React, TypeScript, Tailwind CSS, GSAP (com ScrollTrigger e SplitText), Lenis (rolagem suave) e Motion.
Gera um site estático, pronto para o GitHub Pages.

Animações principais: abertura (`components/Intro.tsx`), galeria horizontal conduzida pelo scroll
(`GaleriaEspacial.tsx`), índice com prévia no cursor (`IndiceProjetos.tsx`) e áreas de atuação (`Areas.tsx`).
Todas respeitam `prefers-reduced-motion`.

## Como rodar

Precisa do Node.js 20 ou mais novo.

```bash
cd portfolio
npm install
npm run dev      # http://localhost:3000, com recarga automática
```

Para gerar a versão final:

```bash
npm run build    # cria a pasta out/ com o site pronto
```

## Onde editar

| O que mudar | Arquivo |
|---|---|
| Nome, e-mail, WhatsApp, redes sociais e foto do "Sobre" (só os contatos preenchidos aparecem) | `data/site.ts` |
| Projetos (título, textos, links, imagens) | `data/projetos.ts` |
| Texto, formação e ferramentas da página "Sobre" | `data/sobre.ts` |
| Cores e tipografia | `app/globals.css` |

### Trocar as fotos principais

1. Salve a foto em `public/images/` (por exemplo `hero.jpg` e `ramon.jpg`).
2. Em `data/site.ts`, troque `null` pelo caminho: `imagemHero: "/images/hero.jpg"`.

### Cadastrar um projeto

1. Salve as imagens em `public/images/projetos/<slug>/` e use JPEG já reduzido (cerca de 1800 px de largura).
2. Copie um bloco da lista em `data/projetos.ts` e mude os campos.
3. Campos que ficarem vazios não aparecem na página do projeto.
4. Para o projeto aparecer na página inicial, use `destaque: true`.

Vídeos aceitam YouTube, Vimeo, arquivo hospedado e Instagram. Veja o tipo `Video` em `data/projetos.ts`.

### Imagens

O site usa exportação estática, então o Next.js não otimiza imagens sozinho.
Reduza e comprima as imagens antes de colocá-las em `public/`.
O arquivo `data/imagens.json` guarda as dimensões das imagens já cadastradas.

## Publicar no GitHub Pages

O arquivo `.github/workflows/pages.yml` (na raiz do repositório) compila e publica o site a cada envio para a branch `main`.

Uma vez só, no GitHub: **Settings → Pages → Build and deployment → Source → GitHub Actions**.

## Contato

O formulário usa o Web3Forms. A chave pública fica em `data/site.ts`.
