# Atendimento para gráfica: WhatsApp + orçamento online + ordens de serviço

Código em `atendimento-grafica/`. Status em 15/10/2026: **MVP funcionando com o WhatsApp simulado.** Falta ligar um número real de WhatsApp (seção "Ligar o WhatsApp de verdade").

## O problema

Atendente de gráfica perde o dia respondendo "quanto custa?", "vocês fazem?", "me manda a tabela". O objetivo é o cliente receber a tabela sozinho, montar o orçamento por um link, fechar o pedido (PDF com assinatura e forma de pagamento) e o pedido cair direto nas ordens de serviço da gráfica.

## Como rodar

```bash
cd atendimento-grafica
npm install
npm start
```

- Painel: http://localhost:3100/admin/ (senha de teste `grafica123`; em produção defina `ADMIN_PASSWORD`)
- Simulador de WhatsApp: http://localhost:3100/simulador/
- Testes automáticos: `npm test`
- Requer Node 22.13 ou mais novo (usa o SQLite embutido do Node, a única dependência é o `pdfkit`).

Variáveis opcionais: `PORT`, `ADMIN_PASSWORD`, `PUBLIC_URL` (endereço usado nos links enviados), `DATA_DIR`, `SIMULATOR=off` (desliga o simulador em produção).

## O fluxo do cliente

1. Cliente manda "Oi, queria um orçamento". O robô responde com a **tabela de valores** e o **link do orçamento** (já ligado àquela conversa).
2. Se perguntar por um produto ("quanto custa banner?", "vocês fazem adesivo?"), recebe o preço daquele produto e o link já com ele escolhido.
3. No link, o cliente escolhe os produtos, digita as medidas e vê o **valor na hora** (o cálculo é feito no servidor). Informa os dados, entrega ou retirada, forma de pagamento, link da arte e assina na tela.
4. Ao enviar, nasce o **pedido (OS)** no painel, o cliente recebe a confirmação no WhatsApp com o **PDF** (assinatura do cliente + a sua assinatura, sinal, saldo, condições).
5. Cada vez que você move o pedido de etapa no painel, o cliente é avisado no WhatsApp.
6. Se o cliente pedir "atendente", o robô para e você responde pelo painel (botão "Devolver ao robô" reativa).

O robô também responde: status do pedido, endereço, horário, formas de pagamento, prazo, e um menu numerado quando não entende.

## O que o painel tem

| Tela | Para quê |
|---|---|
| Painel | Pedidos de hoje, vendido no mês, a receber, atrasados, funil por etapa, link do orçamento para copiar |
| Pedidos | Quadro estilo Trello (Novo, Arte, Aprovação, Produção, Pronto, Entregue) com arrastar e soltar, lista com filtro e busca, detalhe com PDF, pagamento, desconto, prazo e histórico |
| Conversas | Caixa de entrada do WhatsApp, respostas rápidas, assumir e devolver ao robô |
| Produtos e preços | Cadastra produto cobrado por m², por unidade (com faixas de quantidade) ou por opções fixas; acabamentos (ilhós, laminação, instalação…); prazo; palavras que o robô reconhece |
| Clientes | Cadastro automático, quantos pedidos, total comprado, anotações |
| Configurações | Dados da gráfica, **sua assinatura**, horário, sinal (%), formas de pagamento, todas as mensagens do robô, termos do pedido |

Preços: banner = R$ 150/m² (1 x 0,80 m = R$ 120) e adesivo = R$ 100/m², como o Ramon passou. **Os outros preços de exemplo (fachada, placa, cartão, panfleto) são chutes; ajuste em Produtos e preços.**

## Ligar o WhatsApp de verdade

O robô, o painel e o orçamento não sabem nada de WhatsApp: só falam com um "canal" (`src/chat.js`, função `setChannel`). Hoje o canal é o simulador. Falta escrever um adaptador com duas partes:

1. **Receber**: uma rota de webhook que chama `receive(telefone, texto, nome)` (de `src/bot.js`).
2. **Enviar**: `deliver(telefone, texto)`.

Opções:

| Opção | Prós | Contras |
|---|---|---|
| **API oficial da Meta (WhatsApp Cloud API)**, direto ou por provedor (Twilio, 360dialog, Gupshup…) | Sem risco de banimento, é o caminho para negócio | Precisa conta Meta Business e número dedicado; servidor com HTTPS público; mensagens iniciadas pela gráfica fora de 24 h do último contato exigem *templates* aprovados (vale para avisos de "pedido pronto" enviados dias depois); cobrança por mensagem, confirmar valores atuais no site da Meta |
| Não oficial (Baileys, whatsapp-web.js, Evolution API, Z-API) | Grátis ou barato, lê QR Code do número que a gráfica já usa | Viola os termos do WhatsApp; número pode ser banido; quebra quando o WhatsApp muda |

**Recomendação:** API oficial. Para validar rápido com um cliente real, um provedor oficial costuma ser mais simples do que montar a conta Meta sozinho.

Tarefas quando for ligar: rota `GET/POST /webhook/whatsapp` (verificação do token + validar assinatura `X-Hub-Signature-256`), cadastrar *templates* de aviso de etapa, hospedar com HTTPS, definir `PUBLIC_URL`. Não foi testado nada contra o WhatsApp real.

## Sugestões para a gráfica (próximos passos)

**Fecham mais pedidos**
- Pagamento do sinal por **PIX com QR Code e baixa automática** (Mercado Pago, Asaas, Efí): o cliente paga na hora e a OS já vai "sinal pago".
- **Follow-up automático** de orçamento aberto e não fechado (após 24 h e 3 dias) e validade do orçamento.
- **Aprovação de arte** por link: a gráfica sobe a prova, o cliente aprova com um clique e fica registrado (evita briga depois).
- Upload da arte direto no orçamento, com checagem de resolução, sangria e cor.
- Cupom e tabela de preço para revenda/empresa.
- Frete por CEP.

**Organizam a produção**
- **Ficha de produção** para imprimir (medidas e acabamento, sem valores) e etiqueta com QR da OS.
- Controle de estoque de material (bobina de lona e vinil, tinta) com alerta de mínimo.
- Aproveitamento de bobina (encaixe de vários pedidos na mesma largura).
- Custo e margem por produto: o painel avisa quando um preço está abaixo do custo.
- Fila por máquina e serviços terceirizados.

**Financeiro**
- Contas a receber, fluxo de caixa, relatório mensal, produtos mais vendidos.
- Emissão de NFS-e.

**Relacionamento**
- "Repetir pedido" com um clique para cliente recorrente e histórico de artes por cliente.
- Pesquisa de satisfação depois da entrega e reativação de cliente que sumiu (respeitando as regras de mensagem em massa do WhatsApp).

**Equipe e segurança**
- Vários usuários (atendimento, produção, financeiro) com permissões, log de quem mudou o quê, backup automático do banco.

## Limitações do MVP (conhecidas)

- Um único login e senha; a sessão fica na memória (reiniciar o servidor desloga).
- O robô entende palavras-chave, não conversa livre. Dá para trocar a função `decide()` em `src/bot.js` por uma IA mantendo o resto.
- A arte entra por link (Drive etc.), não por upload de arquivo.
- O PDF usa a fonte padrão, então emojis são removidos do texto.
- Datas de prazo usam o fuso do servidor e contam dias úteis conforme o horário cadastrado.
- Testado: cálculo de preço, robô, criação do pedido, PDF, login e avisos de etapa (`npm test`) e as telas no navegador. Não testado: WhatsApp real e impressão do PDF em papel.

## Estrutura do código

```
atendimento-grafica/
  server.js            servidor, login, arquivos estáticos
  src/db.js            SQLite (tabelas, configurações)
  src/seed.js          produtos e mensagens iniciais
  src/pricing.js       cálculo de preço (centavos, m², faixas, acabamentos)
  src/bot.js           robô de atendimento e etapas do pedido
  src/chat.js          conversas, mensagens e o "canal" do WhatsApp
  src/orders.js        pedidos, status, painel, avisos ao cliente
  src/pdf.js           PDF do pedido com assinaturas
  src/routes.js        API
  public/admin/        painel
  public/orcamento/    página de orçamento do cliente
  public/simulador/    simulador de WhatsApp
  test/fluxo.test.js   teste de ponta a ponta
```

## Publicar

Precisa de um servidor com Node 22.13+ e disco que persista (o banco é o arquivo `data/grafica.db`; faça backup dele). Defina `ADMIN_PASSWORD`, `PUBLIC_URL` e `SIMULATOR=off`, e coloque atrás de HTTPS.
