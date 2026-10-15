# Plataforma de galerias para fotógrafos e videomakers (planejamento)

Status: **só planejamento, nada construído.** O Ramon quer o site (marketing) e a plataforma integrados e funcionais, mas pediu para guardar as informações e desenvolver depois.

## Origem da ideia

Referência inicial: [EPICS](https://www.epics.com.br/) / [EPICS Select](https://epics.io/). O fotógrafo sobe as fotos de um evento, cria uma galeria privada e o cliente escolhe, favorita e aprova. O EPICS pede e-mail antes de mostrar as fotos.

Objetivo: criar algo parecido para **fotógrafos e videomakers**, com interface **mais autoexplicativa, mais ágil, simples, minimalista e profissional**.

## Referências pesquisadas (out/2026)

| Plataforma | O que copiar |
|---|---|
| Pixieset | Capa grande, grade limpa, favoritar com um clique, ecossistema (site, loja, app) |
| Pic-Time | Visual premium de galeria de casamento, vendas de impressão/álbuns, e-mails automáticos |
| ShootProof | Preço por número de fotos, sem comissão |
| Aftershoot Galleries | Reconhecimento facial ("Face Scan") para cada pessoa achar suas fotos |
| Foto Owl | IA para fotos de evento |
| Fotop (Brasil) | Marketplace de fotos de evento (cobra 25%), prova que existe mercado |
| EPICS Select | Seleção de fotos e aprovação de álbum |
| Frame.io | Comentários presos ao tempo do vídeo, versões lado a lado, revisão sem cadastro |

Preços e funcionalidades vieram de sites de comparação (alguns feitos pelos concorrentes). Conferir nos sites oficiais antes de decidir.

## Onde dá para fazer melhor

1. **Vídeo de verdade**: a maioria das galerias é pensada para JPEG. Tratar foto e vídeo igual, com comentário no tempo do vídeo.
2. **Cliente sem fricção**: abrir a galeria direto por link ou QR code; pedir nome/e-mail só ao favoritar.
3. **Eventos**: busca por selfie ou por mesa, para o convidado achar as próprias fotos.
4. **Interface autoexplicativa**: coração para favoritar, barra fixa "Enviar seleção", sem menus escondidos.
5. **Preço em reais e sem comissão.**

## Escopo definido pelo Ramon

- Entregar **o site e a plataforma integrados e funcionais** (não só protótipo).
- Nome e identidade: **sem preferência**. Sugerir um nome provisório (ideia: "Lume") e usar o visual do portfólio como base.

## Design

- Fundo claro ou escuro (tema por galeria), uma única cor de destaque, tipografia sem serifa (Inter).
- Grade de fotos justificada, sem bordas.
- Telas: site de marketing, login/cadastro, painel do fotógrafo (upload arrastando), galeria do cliente, revisão de vídeo.

## Plano técnico proposto (quando for construir)

- Pasta separada no projeto (por exemplo `plataforma/`), sem dependências externas: Node 23 com `node:sqlite` e servidor `http` próprio.
- Armazenamento local em `plataforma/data/` (colocar no `.gitignore`); trocar por S3/R2 na hospedagem.
- Miniaturas geradas no navegador (canvas) antes do upload; vídeos com suporte a `Range` e poster gerado do frame.
- Login com cookie de sessão e senha com scrypt; galeria com senha opcional e download opcional.
- Tabelas: usuários, sessões, galerias, itens (foto/vídeo), favoritos, comentários com tempo, envios de seleção.
- Rotas públicas: `/` (site), `/entrar`, `/painel`, `/g/:slug` (galeria do cliente).

## Decisões em aberto

- Hospedagem e armazenamento em produção (custo de vídeo é o maior).
- Modelo de preço (por número de fotos ou por armazenamento).
- Reconhecimento facial: fazer na primeira versão ou depois.
- Nome definitivo e domínio.
