# NOTORIUS — Product, UX e Technical Specification

**Versão:** 0.4  
**Status:** Especificação consolidada e alinhada ao branding Notorius, incluindo sistema visual, arquitetura de componentes e referências de direção de arte  
**Objetivo:** orientar design, copy, desenvolvimento, integrações e validação do funil low ticket automatizado da Notorius.  
**Produto inicial:** pacotes de visualizações e interações aplicados a uma única publicação pública do Instagram.  
**Pagamento:** Pix via Pushin Pay.  
**Fulfillment:** criação e acompanhamento de múltiplos pedidos via API Notorius.

---

## Alterações da versão 0.4

- substituição do conceito visual genérico por `Prestígio Digital em Movimento / Sapphire Signal`;
- alinhamento da landing, checkout, Pix, tracking e admin com a logo;
- remoção do verde-limão como cor de marca;
- criação de arquitetura de ativos da logo;
- definição de paleta, tipografia, materiais, iconografia e motion;
- reconstrução completa da seção de componentes;
- definição de contrato obrigatório para implementação por IA;
- revisão das referências por função;
- novos critérios de aceite de marca;
- revisão das decisões em aberto e das fases de implementação.

---

## 1. Visão do produto

A Notorius transforma uma operação comercial já validada no WhatsApp em uma experiência de autosserviço, mantendo a clareza e a confiança do atendimento humano, mas eliminando as tarefas repetitivas que limitam a escala.

A experiência ideal é:

1. O visitante chega por um anúncio.
2. Entende rapidamente o que o produto entrega.
3. Escolhe o pacote adequado.
4. Cola a URL pública da publicação.
5. Informa os dados mínimos para acompanhamento.
6. Gera e paga um Pix.
7. O pagamento é confirmado automaticamente.
8. O sistema cria os serviços correspondentes no Notorius.
9. O cliente acompanha um pedido comercial único.
10. A operação monitora falhas, entregas parciais e solicitações de suporte.

### 1.1 Objetivo principal

Maximizar compras concluídas com a menor fricção possível, sem depender de atendimento humano para explicar, cobrar, conferir comprovante ou lançar pedidos.

### 1.2 Objetivos secundários

- Aumentar ticket médio pela arquitetura dos pacotes.
- Capturar dados de checkout para recuperação de abandono.
- Criar um fluxo de recompra simples.
- Reduzir erros de URL e lançamentos manuais.
- Dar visibilidade operacional sobre pagamento e fulfillment.
- Permitir troca de `service_id` sem alterar a landing page.
- Criar uma base pronta para novas ofertas e plataformas.

---

## 2. Contexto validado

O processo anterior era:

`Anúncio → WhatsApp → atendimento X1 → escolha do pacote → Pix manual → conferência → lançamento manual no Notorius`

O novo processo será:

`Anúncio → landing page → pacote → checkout → Pix Pushin Pay → webhook → orquestração → API Notorius → acompanhamento`

A automação não deve alterar a essência da oferta que já vende. Ela deve substituir as tarefas operacionais do vendedor por:

- hierarquia clara de informação;
- indicação de uso de cada pacote;
- redução de objeções;
- prova social;
- validação da URL;
- resumo do pedido;
- pagamento imediato;
- confirmação e acompanhamento.

---

## 3. Escopo do MVP

### 3.1 Incluído

1. Landing page responsiva.
2. Quatro pacotes configuráveis.
3. Seleção de pacote.
4. Checkout no mesmo domínio.
5. Validação de URL de publicação do Instagram.
6. Coleta de nome, e-mail e WhatsApp.
7. Geração de Pix pela Pushin Pay.
8. QR Code e Pix Copia e Cola.
9. Confirmação por webhook.
10. Criação automática dos serviços no Notorius.
11. Um pedido comercial agrupando vários pedidos técnicos.
12. Página pública segura de acompanhamento.
13. Painel administrativo mínimo.
14. Registro de eventos, falhas e tentativas.
15. Analytics do funil e UTMs.
16. Suporte a reprocessamento administrativo controlado.

### 3.2 Fora do MVP

- Aplicativo mobile nativo.
- Login obrigatório para compradores.
- Assinatura mensal.
- Carteira de créditos.
- Afiliados.
- Cupons complexos.
- Múltiplas plataformas sociais.
- Múltiplas URLs no mesmo pacote.
- Chatbot.
- Marketplace de serviços.
- Recomendação automática baseada no perfil.
- Troca automática de fornecedor em caso de falha.

Esses itens devem ser previstos arquiteturalmente, mas não implementados na primeira versão.

---

## 4. Premissas de negócio

1. Cada pacote é válido para uma única URL pública de publicação do Instagram.
2. Um pacote comercial pode criar vários pedidos técnicos.
3. Cada item técnico possui `service_id`, quantidade e regras próprias.
4. O cliente visualiza um único pedido, independentemente da quantidade de pedidos enviados ao Notorius.
5. O pagamento aprovado é a condição para iniciar o fulfillment.
6. O navegador do cliente nunca é a fonte de verdade do pagamento.
7. API keys e tokens permanecem exclusivamente no backend.
8. Preços são armazenados em centavos.
9. Pacotes, quantidades e `service_ids` não devem ficar hardcoded nos componentes visuais.
10. O sistema deve continuar operável mesmo quando uma integração externa estiver temporariamente indisponível.

---

## 5. Públicos e Jobs to Be Done

### 5.1 Criador ou influenciador

**Situação:** possui uma publicação importante, collab ou publicidade.  
**Objetivo:** reforçar rapidamente os números daquela publicação.  
**Receio:** processo demorado, necessidade de senha ou falta de acompanhamento.  
**Decisão:** escolhe pelo volume, preço, velocidade percebida e simplicidade.

### 5.2 Negócio local ou infoprodutor

**Situação:** publicou uma campanha, lançamento, oferta ou prova social.  
**Objetivo:** aumentar a percepção de presença da publicação.  
**Receio:** não entender qual pacote comprar ou errar o link.  
**Decisão:** precisa de indicação contextual do pacote.

### 5.3 Comprador recorrente

**Situação:** já conhece o serviço e quer repetir a compra.  
**Objetivo:** finalizar em poucos segundos.  
**Receio:** ter que preencher tudo novamente.  
**Decisão:** prioriza velocidade, histórico e confiança na entrega.

---

## 6. Arquitetura do funil

### 6.1 Aquisição

Os anúncios devem apontar para uma oferta específica e manter correspondência de mensagem com o hero.

Exemplos de ângulos:

- publicação de publicidade;
- Reel estratégico;
- collab;
- lançamento;
- conteúdo prioritário;
- primeira compra.

O sistema deve armazenar:

- `utm_source`;
- `utm_medium`;
- `utm_campaign`;
- `utm_content`;
- `utm_term`;
- `fbclid`, quando disponível;
- landing variant;
- timestamp da primeira e da última visita.

### 6.2 Landing page

Objetivo: levar o visitante à seleção de pacote.

A página deve ter uma ação principal: **escolher pacote**.

### 6.3 Checkout

Objetivo: converter intenção em Pix gerado.

Deve ocorrer em rota própria, no mesmo domínio:

`/checkout?package=impulso`

Motivos:

- melhor persistência após retorno do aplicativo bancário;
- melhor uso do botão voltar;
- tracking mais preciso;
- menor distração;
- estados de pagamento mais claros;
- facilidade para recuperar sessões.

### 6.4 Pagamento

Objetivo: transformar Pix gerado em pagamento aprovado.

A tela permanece observando o status do pedido interno, nunca consultando ou acionando o Notorius diretamente.

### 6.5 Fulfillment

Objetivo: transformar pagamento aprovado em pedidos técnicos criados exatamente uma vez.

### 6.6 Pós-compra

Objetivo: confirmar, acompanhar, reduzir suporte e estimular recompra.

---

## 7. Arquitetura da oferta

### 7.1 Pacotes iniciais

| Pacote | Preço | Visualizações | Curtidas | Compartilhamentos | Salvamentos |
|---|---:|---:|---:|---:|---:|
| Start | R$ 9,90 | 8.000 | 100 | 100 | 100 |
| Impulso | R$ 19,90 | 25.000 | 300 | 200 | 200 |
| Pro | R$ 49,90 | 80.000 | 900 | 500 | 400 |
| Top | R$ 99,90 | 250.000 | 2.500 | 1.000 | 1.000 |

### 7.2 Papel de cada pacote

**Start:** entrada e experimentação.  
**Impulso:** pacote principal e mais recomendado.  
**Pro:** opção para publicações estratégicas.  
**Top:** âncora de valor e maior intensidade.

### 7.3 Regras de apresentação

Cada card deve responder:

1. Para quem é.
2. O que entrega.
3. Quanto custa.
4. Quantas publicações atende.
5. Qual é a próxima ação.

O pacote Impulso deve possuir maior peso visual, mas não pode fazer os demais parecerem desabilitados.

### 7.4 Estrutura de dados do pacote

```json
{
  "id": "pkg_impulso",
  "slug": "impulso",
  "name": "Impulso",
  "description": "Para Reels, collabs e publicações que precisam de mais presença.",
  "price_cents": 1990,
  "currency": "BRL",
  "is_featured": true,
  "is_active": true,
  "display_order": 2,
  "items": [
    {
      "metric": "views",
      "service_id": 123,
      "quantity": 25000,
      "display_label": "25.000 visualizações"
    }
  ]
}
```

A configuração real terá um item para cada entregável.

---

## 8. Estrutura da landing page

### 8.1 Papel da landing no sistema de marca

A landing page deve materializar a promessa comercial e apresentar a Notorius como uma marca de **presença digital premium, simples e controlada**.

Ela não deve parecer:

- um painel técnico de SMM;
- uma página de revenda genérica;
- uma interface de cassino, cripto ou game;
- uma landing de infoproduto com excesso de selos;
- uma vitrine de efeitos visuais sem relação com o serviço.

A página deve parecer uma experiência de compra de um produto digital bem empacotado, com o nível de acabamento de uma marca consumer-tech.

A hierarquia da landing é:

1. fazer o visitante reconhecer o produto;
2. transformar o serviço em uma escolha simples;
3. mostrar que o processo é rápido e acompanhado;
4. apresentar prova e segurança;
5. levar ao checkout com o pacote selecionado.

### 8.2 Header — `SiteHeader`

Header minimalista, sem menu extenso.

#### Anatomia

- `BrandLockup`: monograma + wordmark horizontal;
- links âncora opcionais: `Pacotes`, `Como funciona`, `Dúvidas`;
- link secundário: `Acompanhar pedido`;
- CTA primário: `Ver pacotes`.

#### Comportamento

- transparente sobre o hero;
- ao rolar, recebe superfície azul-preta com blur leve e borda inferior sutil;
- em mobile, reduzir para logo, acompanhamento e CTA;
- o emblema 3D completo não deve ser usado no header;
- altura recomendada: 72–80 px desktop e 60–68 px mobile.

### 8.3 Hero — `HeroPresence`

O hero deve explicar o produto em até cinco segundos e apresentar a marca como um sistema de **presença que se percebe**.

#### Conteúdo-base

**Eyebrow:** Pacotes para publicações do Instagram  
**Headline:** Dê mais presença à publicação que importa.  
**Subheadline:** Escolha o pacote, cole o link da publicação e pague via Pix. Sem senha, sem mensalidade e com acompanhamento do pedido.  
**CTA primário:** Escolher meu pacote  
**CTA secundário:** Ver como funciona  
**Microcopy:** A partir de R$ 9,90 · 1 publicação por pacote

#### Composição visual

O hero deve utilizar o componente `HeroMedallionScene`:

- emblema 3D Notorius como peça central de marca;
- moldura editorial de uma publicação, sem copiar integralmente a interface nativa do Instagram;
- quatro sinais de métrica: visualizações, curtidas, compartilhamentos e salvamentos;
- anéis concêntricos e linhas de sinal derivados do medalhão;
- profundidade por luz, contraste e sobreposição;
- movimento sutil, nunca uma moeda girando continuamente.

#### Regra de atenção

O hero deve possuir um único ponto dominante: headline + CTA. O emblema deve reforçar a promessa, não competir com ela.

### 8.4 Trust strip — `TrustRail`

Faixa curta após o hero ou parcialmente sobreposta à dobra.

Itens configuráveis:

- `Sem senha`;
- `Pagamento via Pix`;
- `Uma publicação por pacote`;
- `Acompanhamento do pedido`;
- número real de pedidos ou avaliação, quando existirem dados sustentados.

O `TrustRail` usa ícones lineares derivados do monograma e divisórias douradas de baixa opacidade. Não utilizar cinco selos visuais diferentes.

### 8.5 Contextos de uso — `UseCaseEditorialGrid`

O objetivo é fazer o visitante se reconhecer antes de comparar preços.

Contextos iniciais:

- Publicidade e publi.
- Reels estratégicos.
- Collabs e lançamentos.
- Conteúdos prioritários.

Cada bloco deve conter:

- título curto;
- uma linha de explicação;
- recorte de conteúdo ou textura editorial;
- indicador de métrica discreto.

Não utilizar ícones genéricos de foguete, raio ou gráfico ascendente.

### 8.6 Pacotes — `PackageCollection`

A seção de pacotes é o centro comercial da página.

#### Estrutura

- título orientado à decisão;
- explicação de que cada pacote atende uma única URL;
- quatro `PackageCard`;
- comparação resumida opcional;
- microcopy operacional.

#### `PackageCard`

Cada card deve exibir:

- nome do pacote;
- situação recomendada;
- métricas;
- preço;
- uma publicação;
- CTA;
- selo somente quando necessário.

#### Hierarquia dos pacotes

- `Start`: entrada e teste;
- `Impulso`: recomendado e maior peso visual;
- `Pro`: intensidade para publicação estratégica;
- `Top`: maior volume e âncora superior.

#### Variante `featured`

O pacote Impulso recebe:

- superfície safira profunda;
- borda dourada fina;
- selo `Mais escolhido`;
- brilho localizado, não glow em todo o card;
- CTA de maior contraste.

Os demais cards utilizam superfícies neutras azul-pretas. O pacote Top pode usar números dourados, mas não deve ser um card inteiro dourado.

#### Mobile

- cards empilhados;
- Impulso em primeiro ou segundo lugar conforme teste;
- não exigir swipe horizontal para descobrir opções;
- CTA com área mínima de toque de 44 px;
- preço e entregáveis visíveis sem abrir accordion.

### 8.7 Comparação — `PackageMatrix`

Tabela compacta opcional para visitantes que desejam comparar.

Linhas:

- visualizações;
- curtidas;
- compartilhamentos;
- salvamentos;
- uma publicação;
- preço.

Em mobile, transformar cada coluna em bloco vertical ou accordion sem criar rolagem horizontal extensa.

### 8.8 Como funciona — `SignalSteps`

Quatro passos:

1. Escolha o pacote.
2. Cole o link.
3. Pague via Pix.
4. Acompanhe a entrega.

A representação visual deriva dos anéis do emblema:

- quatro nós conectados por uma linha de sinal;
- o nó ativo recebe luz safira;
- o nó concluído recebe preenchimento marfim ou verde de sistema;
- o dourado marca progressão e não sucesso operacional.

### 8.9 Prova social — `ProofGallery`

Prioridade:

1. feedbacks reais do WhatsApp com dados ocultos;
2. mini-cases;
3. pedidos processados;
4. demonstração do fluxo;
5. depoimentos editoriais.

#### Direção visual

- provas tratadas como artefatos, não como cards genéricos de avaliação;
- capturas dentro de molduras editoriais próprias;
- labels como `Cliente recorrente`, `Criador`, `Campanha`;
- sem estrelas gigantes, avatares artificiais ou carrossel automático rápido.

### 8.10 Diferenciais — `OperatingPrinciples`

Bloco curto com seis princípios:

- sem senha;
- aplicação em uma URL;
- pagamento único;
- confirmação automática;
- acompanhamento;
- suporte.

Usar linguagem objetiva e composição em grid. Não repetir o conteúdo do FAQ palavra por palavra.

### 8.11 FAQ — `FAQAccordion`

Perguntas obrigatórias:

1. Qual link devo enviar?
2. A publicação precisa estar pública?
3. Preciso informar senha?
4. Cada pacote vale para quantas publicações?
5. Quando o processamento começa?
6. Como acompanho?
7. O que acontece se eu informar o link errado?
8. Posso comprar novamente?
9. O que fazer se uma entrega ficar parcial?
10. Como falar com o suporte?

O accordion deve ter:

- título sempre visível;
- ícone de expansão derivado da geometria da marca;
- animação curta;
- navegação por teclado;
- estado aberto com contraste suficiente.

### 8.12 CTA final — `FinalPresenceCTA`

Repetir a mesma oferta, sem criar nova promessa.

**Headline-base:** Sua próxima publicação pode ter mais presença.  
**CTA:** Escolher meu pacote  
**Microcopy:** Compra única · pagamento via Pix

O emblema pode aparecer como marca d’água facetada, nunca como uma segunda cena 3D concorrendo com o hero.

### 8.13 Footer — `SiteFooter`

Elementos:

- `BrandLockup`;
- acompanhar pedido;
- suporte;
- termos;
- privacidade;
- política operacional;
- identificação comercial;
- redes sociais, quando aplicável.

O rodapé deve finalizar a experiência com baixa densidade visual, usando linhas de circuito simplificadas como textura de 3% a 6% de opacidade.

## 9. Checkout

### 9.1 Princípio visual

O checkout deve preservar a identidade da Notorius sem carregar os efeitos expressivos do hero.

A recomendação é uma composição de contraste:

- shell externo azul-preto;
- card principal em marfim frio ou cinza muito claro;
- texto escuro;
- ações em safira;
- dourado apenas em detalhes de seleção;
- monograma simplificado no topo;
- nenhuma textura atrás dos campos.

A landing vende impacto. O checkout transmite clareza, continuidade e controle.

### 9.2 Layout desktop — `CheckoutShell`

Duas colunas:

- esquerda: URL, dados e consentimentos;
- direita: resumo fixo do pacote.

Proporção recomendada: 58/42 ou 60/40.

O resumo permanece visível enquanto o usuário preenche os dados, sem cobrir o botão final.

### 9.3 Layout mobile

Ordem vertical:

1. cabeçalho com logo e etapa;
2. pacote selecionado;
3. URL;
4. dados;
5. resumo;
6. aceite;
7. botão de gerar Pix.

Regras:

- uma coluna;
- sem campos lado a lado;
- teclado adequado por tipo de dado;
- autofill habilitado;
- labels sempre visíveis;
- barra inferior fixa apenas quando não ocultar erros ou conteúdo importante.

### 9.4 Componentes do checkout

- `CheckoutHeader`;
- `CheckoutProgress`;
- `SelectedPackageSummary`;
- `InstagramUrlField`;
- `CustomerFields`;
- `TermsConsent`;
- `CheckoutSubmit`;
- `SupportLink`.

### 9.5 Campos

- URL da publicação;
- nome completo;
- e-mail;
- WhatsApp;
- aceite de termos e política aplicável.

Não coletar dados que não tenham uso operacional no MVP.

### 9.6 Validação da URL — `InstagramUrlField`

Aceitar inicialmente:

- `https://www.instagram.com/p/{shortcode}/`
- `https://instagram.com/p/{shortcode}/`
- `https://www.instagram.com/reel/{shortcode}/`
- `https://instagram.com/reel/{shortcode}/`

O parser deve:

1. normalizar protocolo;
2. remover query strings desnecessárias;
3. normalizar `www`;
4. validar domínio;
5. validar tipo de rota;
6. salvar URL canônica;
7. bloquear perfil, Stories e URLs não suportadas;
8. exibir exemplo correto junto ao erro.

Não depender somente de regex no frontend. Revalidar no backend.

#### Estados visuais

- `idle`: exemplo abaixo do campo;
- `typing`: sem mudança ornamental;
- `validating`: spinner curto no sufixo;
- `valid`: confirmação textual + ícone;
- `invalid`: borda e texto de erro próximos ao campo;
- `incompatible_after_payment`: tratado na tela pública, não no checkout sintático.

### 9.7 Resumo do pedido — `OrderSummary`

Exibir:

- nome do pacote;
- entregáveis;
- uma publicação;
- URL abreviada;
- valor total;
- Pix como forma de pagamento.

O valor deve ser o elemento dominante. Não esconder o total em texto pequeno.

### 9.8 Botão final

CTA dinâmico:

`Gerar Pix de R$ 19,90`

Estados:

- default;
- hover;
- focus;
- submitting;
- success;
- error;
- disabled somente por motivo real.

### 9.9 Microinterações

- confirmação visual ao selecionar pacote;
- preview discreto da URL validada;
- loading no envio;
- mensagens de erro próximas ao campo;
- preservação de dados após falha;
- retorno de foco ao primeiro erro;
- transição para Pix sem flash de layout;
- feedback tátil ou visual ao copiar código.

### 9.10 Continuidade de marca

O checkout deve reutilizar:

- wordmark;
- tipografia de interface;
- raio dos componentes;
- tokens de espaçamento;
- linguagem dos botões;
- ícones;
- tratamento dos estados.

Não reutilizar no checkout:

- emblema 3D em grande escala;
- glow decorativo;
- textura facetada atrás do formulário;
- animações de órbita contínuas.

## 10. Experiência Pix

### 10.1 Criação

Após o envio do checkout:

1. criar o pedido interno;
2. gerar uma chave idempotente interna;
3. solicitar cobrança à Pushin Pay;
4. salvar ID externo, Pix Copia e Cola e dados de expiração;
5. redirecionar para `/pedido/{public_token}/pagamento`.

### 10.2 Tela aguardando pagamento

Exibir:

- QR Code;
- Pix Copia e Cola;
- botão copiar;
- valor;
- pacote;
- status “Aguardando pagamento”;
- instrução curta;
- atualização automática;
- opção de suporte;
- estado de expiração, caso aplicável.

### 10.3 Confirmação

A aprovação deve ocorrer por webhook no backend.

O frontend consulta apenas o pedido interno:

`GET /api/public/orders/{public_token}`

Quando o backend confirmar o pagamento, a tela muda automaticamente para sucesso.

### 10.4 Janela de expiração e resgate tardio de Pix

1. **Janela de Expiração:** A validade comercial da cobrança Pix é configurada para **30 minutos** (`expires_at = payment_created_at + 30 minutos`).
2. **Reativação Automática de Pix Expirado (`paid_after_expiration`):**
   - O estado `expired` local indica o fim da janela do checkout ativo, mas não inviabiliza o recebimento.
   - Caso um webhook de pagamento aprovado chegue para uma cobrança marcada localmente como `expired`, o backend valida autenticidade, valor exato (`amount_cents`), moeda e ausência de processamento prévio.
   - Confirmada a validade, a cobrança é atualizada para `paid` com a flag `paid_after_expiration = true`, transicionando o pedido para `payment_status = paid` e **disparando o fulfillment automaticamente**, sem reter no atendimento humano.
   - A tela pública do cliente exibe imediatamente **"Pagamento confirmado — Seu pedido já está sendo processado"**.
3. **Invariante de Idempotência Comercial e Cobranças Duplicadas:**
   - *Invariante Central:* Um pedido comercial só inicia o fulfillment exatamente uma única vez.
   - Se o cliente gerar uma 2ª tentativa de Pix (Pagamento B) após a 1ª (Pagamento A) expirar, ambas ficam associadas ao mesmo `order_id`.
   - Se ambas as cobranças forem pagas no banco, a primeira confirmada desencadeia o fulfillment. O segundo pagamento entra em `duplicate_payment_review` para estorno administrativo manual.

### 10.5 Estados de pagamento

- `pending`: aguardando pagamento Pix;
- `paid`: pagamento aprovado (pode conter a flag `paid_after_expiration = true`);
- `expired`: janela de 30 min encerrada sem confirmação;
- `failed`: pagamento rejeitado ou falhado no provedor;
- `refunded`: valor reembolsado ao cliente;
- `reversed`: estorno / chargeback efetuado;
- `manual_review`: retido para revisão humana (divergência de valor, duplicidade `duplicate_payment_review`, ou inconsistentência de payload).

---

## 11. Integração Pushin Pay

### 11.1 Endpoint documentado

```http
POST https://api.pushinpay.com.br/api/pix/cashIn
Authorization: Bearer {TOKEN}
Accept: application/json
Content-Type: application/json
```

Exemplo-base:

```json
{
  "value": 1990,
  "webhook_url": "https://dominio.com/api/webhooks/pushinpay"
}
```

`value` deve ser enviado em centavos.

### 11.2 Dados mínimos a persistir

- `provider = pushinpay`;
- `provider_payment_id`;
- `value_cents`;
- `currency`;
- `qr_code`;
- representação do QR Code, caso retornada;
- `status`;
- `expires_at`, quando fornecido;
- `raw_response`;
- `created_at`;
- `paid_at`.

### 11.3 Webhook

Requisitos:

1. endpoint público HTTPS;
2. salvar payload bruto antes do processamento;
3. validar autenticidade conforme mecanismo oficial;
4. deduplicar eventos;
5. localizar pagamento pelo ID externo;
6. conferir valor;
7. atualizar dentro de transação;
8. enfileirar fulfillment;
9. responder rapidamente;
10. processar tarefas demoradas fora da requisição.

Nunca criar pedidos no Notorius diretamente dentro do request do webhook.

### 11.4 Pendências técnicas Pushin Pay

Antes de implementação final, confirmar na documentação autenticada ou conta:

- payload completo do webhook;
- assinatura ou mecanismo de autenticação;
- nomes oficiais dos status;
- expiração do Pix;
- endpoint de consulta;
- política de retries;
- eventos de devolução;
- ambiente de testes;
- limites de requisição;
- uso da white IP list.

---

## 12. Integração Notorius

### 12.1 Endpoint

```http
POST https://notorius.pro/api/v2
Content-Type: application/x-www-form-urlencoded
```

### 12.2 Listagem de serviços

```text
key={API_KEY}
action=services
```

O catálogo retorna, entre outros:

- `service`;
- `name`;
- `type`;
- `category`;
- `rate`;
- `min`;
- `max`;
- `refill`;
- `cancel`.

### 12.3 Criação de pedido

```text
key={API_KEY}
action=add
service={SERVICE_ID}
link={INSTAGRAM_URL}
quantity={QUANTITY}
```

Resposta esperada:

```json
{
  "order": 23501
}
```

### 12.4 Consulta

Pedido único:

```text
action=status
order={ORDER_ID}
```

Lote:

```text
action=status
orders=1,2,3
```

A consulta em lote aceita até 100 IDs.

### 12.5 Refill e cancelamento

O painel administrativo pode expor essas ações somente quando o serviço sincronizado permitir:

- `refill = true`;
- `cancel = true`.

### 12.6 Sincronização do catálogo

Criar job diário ou manual para:

1. buscar serviços;
2. salvar snapshot;
3. atualizar preço, mínimo, máximo e flags;
4. alertar quando um `service_id` usado por pacote desaparecer;
5. impedir ativação de pacote inválido;
6. nunca substituir automaticamente o serviço sem revisão.

### 12.7 Risco de duplicidade

A documentação de criação não expõe chave de idempotência. Portanto:

- cada item do pacote terá registro local único;
- usar lock transacional antes do envio;
- salvar `submission_started_at`;
- não reenviar automaticamente quando houver timeout ambíguo;
- mover o item para `submission_unknown`;
- permitir revisão administrativa.

Isso evita que uma falha de rede após a criação externa gere uma segunda compra técnica.

---


## 12A. Regra central: pacote comercial versus pedidos técnicos

O Notorius não recebe um único pedido de pacote. A categoria exibida no painel serve para organização visual dos serviços, mas cada entregável possui um `service_id` próprio e deve ser enviado em uma chamada independente à API.

Portanto:

- o **pacote** existe na camada comercial da aplicação;
- cada **item do pacote** existe como um serviço técnico independente;
- todos os itens recebem a mesma URL informada pelo cliente;
- cada item usa sua própria quantidade fixa;
- cada chamada bem-sucedida retorna um `order_id` diferente;
- o cliente visualiza um único pedido comercial;
- o painel administrativo visualiza o pedido pai e todos os pedidos filhos.

### Exemplo: pacote START

Configuração observada:

| Entregável | Service ID | Quantidade |
|---|---:|---:|
| Compartilhamentos | 19 | 100 |
| Salvamentos | 20 | 100 |
| Curtidas | 21 | 100 |
| Visualizações | 22 | 8.000 |

Depois da confirmação do pagamento, o backend deve executar quatro pedidos independentes:

```text
POST /api/v2
key={API_KEY}
action=add
service=19
link={URL_DA_PUBLICACAO}
quantity=100
```

```text
POST /api/v2
key={API_KEY}
action=add
service=20
link={URL_DA_PUBLICACAO}
quantity=100
```

```text
POST /api/v2
key={API_KEY}
action=add
service=21
link={URL_DA_PUBLICACAO}
quantity=100
```

```text
POST /api/v2
key={API_KEY}
action=add
service=22
link={URL_DA_PUBLICACAO}
quantity=8000
```

O mesmo padrão se aplica aos demais pacotes.

### Mapeamentos confirmados pelas telas fornecidas

#### Pacote IMPULSO

| Entregável | Service ID | Quantidade |
|---|---:|---:|
| Visualizações | 27 | 25.000 |
| Curtidas | 28 | 300 |
| Salvamentos | 29 | 200 |
| Compartilhamentos | 30 | 200 |

#### Pacote PRO

| Entregável | Service ID | Quantidade |
|---|---:|---:|
| Visualizações | 35 | 80.000 |
| Curtidas | 36 | 900 |
| Salvamentos | 37 | 400 |
| Compartilhamentos | 38 | 500 |

#### Pacote TOP

*Os `service_ids` do pacote TOP são dinâmicos e gerenciados no banco de dados (`package_items`), permitindo cadastro/atualização via seeds/admin sem alteração de código.*

### Modelo de pedido pai e pedidos filhos

```text
Pedido comercial #NT-1024
Pacote: START
URL: instagram.com/reel/ABC123
Pagamento: aprovado
Fulfillment: em andamento

├── Item 1 — Compartilhamentos
│   ├── service_id: 19
│   ├── quantidade: 100
│   └── provider_order_id: 50101
│
├── Item 2 — Salvamentos
│   ├── service_id: 20
│   ├── quantidade: 100
│   └── provider_order_id: 50102
│
├── Item 3 — Curtidas
│   ├── service_id: 21
│   ├── quantidade: 100
│   └── provider_order_id: 50103
│
└── Item 4 — Visualizações (Gatekeeper)
    ├── service_id: 22
    ├── quantidade: 8000
    └── provider_order_id: 50104
```

### Regras de orquestração e Compatibility Gate Pattern

1. **Gatekeeper de Compatibilidade:** O serviço de Visualizações atua como portão de compatibilidade antes de liberar os demais itens.
   - Ao aprovar o pagamento, o pedido pai assume `validating_content_compatibility`.
   - O item de Visualizações é disparado primeiro (`submitting`), enquanto Curtidas, Salvamentos e Compartilhamentos aguardam em `waiting_for_compatibility`.
   - Confirmado o `provider_order_id` das Visualizações, os demais itens são liberados em paralelo.
2. **Tratamento de Incompatibilidade de URL (`/p/` vs `/reel/`):**
   - Se o Notorius recusar o item de Visualizações com erro de compatibilidade de formato (`invalid_post_type_for_service`), o item assume `blocked_incompatible_content` e o pedido pai assume `awaiting_customer_action`.
   - **Troca Autônoma de Link:** Como os outros 3 itens não foram enviados, a interface pública exibe ao cliente a solicitação amigável para fornecer um link de Reel (`instagram.com/reel/...`), reexecutando o *Compatibility Gate* sem nova cobrança.
3. **Classificação de Erros & Política de Retry:**
   - **Erros Transitórios (HTTP 429, 500, 502, 503, 504, timeout de rede):** Retry automático com **Backoff Exponencial + Jitter** (5 tentativas: 30s, 2m, 10m, 30m, 2h). O item assume `retry_scheduled` e o pedido pai fica em `partially_submitted`. O status público permanece **"Pedido em andamento"**.
   - **Erros Definitivos/Operacionais (service_id desativado, saldo insuficiente, URL inválida):** Sem retry automático. O item assume `failed` e o pedido pai assume `partially_failed` ou `awaiting_review` após esgotar tentativas, exibindo publicamente **"Pedido em análise"**.
   - **Erros Ambíguos (Timeout após o envio do socket):** O item transiciona para `submission_unknown` e o pedido pai para `awaiting_review`. Zero retry automático para prevenir *double-submit* na API Notorius.

### Snapshot obrigatório

No momento da compra, salvar no pedido uma cópia imutável de:

- nome do pacote;
- preço;
- entregáveis;
- quantidades;
- `service_ids`;
- textos exibidos.

Assim, mudanças futuras no catálogo não alteram pedidos já pagos.


## 13. Orquestração do fulfillment

### 13.1 Fluxo

1. Webhook confirma pagamento.
2. Pedido recebe `payment_status = paid`.
3. Job de fulfillment é criado.
4. Sistema carrega o snapshot do pacote comprado.
5. Cria os 4 `fulfillment_items` locais.
6. Executa o **Compatibility Gate** (envia Visualizações primeiro).
7. Aceito o Gate, libera o envio de Curtidas, Salvamentos e Compartilhamentos.
8. Salva os `provider_order_ids`.
9. Worker de monitoramento consulta status de lote.
10. Cliente visualiza um estado consolidado limpo.

### 13.2 Estados por item

- `pending`;
- `waiting_for_compatibility`;
- `submitting`;
- `submitted`;
- `retry_scheduled`;
- `blocked_incompatible_content`;
- `in_progress`;
- `partial`;
- `completed`;
- `canceled`;
- `failed`;
- `submission_unknown`;
- `refill_requested`;
- `refilling`.

### 13.3 Estados consolidados do pedido pai

- `pending`: aguardando pagamento;
- `validating_content_compatibility`: executando a verificação inicial do gate de visualizações;
- `partially_submitted`: itens enviados com sucesso e outros em fila de retry;
- `awaiting_customer_action`: retido para o cliente atualizar a URL (ex: enviar Reel para liberar views);
- `in_progress`: todos os itens técnicos aceitos e em andamento;
- `completed`: entrega concluída com sucesso;
- `partially_failed`: tentativas automáticas esgotadas ou falha definitiva em item isolado;
- `awaiting_review`: retenção para análise da equipe operacional (erro ambíguo/timeout).

Não mostrar mensagens técnicas do fornecedor ao cliente.

---

## 14. Modelo de dados

### 14.1 `packages`

- `id`;
- `slug`;
- `name`;
- `description`;
- `price_cents`;
- `currency`;
- `is_featured`;
- `is_active`;
- `display_order`;
- `version`;
- timestamps.

### 14.2 `package_items`

- `id`;
- `package_id`;
- `metric`;
- `service_id`;
- `quantity`;
- `display_label`;
- `sort_order`;
- `provider`;
- `is_active`.

### 14.3 `customers`

- `id`;
- `name`;
- `email`;
- `phone_e164`;
- timestamps.

### 14.4 `orders`

- `id`;
- `public_token`;
- `customer_id`;
- `package_id`;
- `package_snapshot`;
- `post_url_original`;
- `post_url_canonical`;
- `amount_cents`;
- `currency`;
- `payment_status`;
- `fulfillment_status`;
- `attribution`;
- timestamps.

### 14.5 `payments`

- `id`;
- `order_id`;
- `provider`;
- `provider_payment_id`;
- `status`;
- `amount_cents`;
- `qr_code`;
- `raw_create_response`;
- `paid_at`;
- `expires_at`;
- timestamps.

### 14.6 `fulfillment_items`

- `id`;
- `order_id`;
- `metric`;
- `service_id`;
- `quantity`;
- `provider_order_id`;
- `status`;
- `charge`;
- `currency`;
- `start_count`;
- `remains`;
- `raw_response`;
- `submission_started_at`;
- `submitted_at`;
- `completed_at`;
- timestamps.

### 14.7 `provider_events`

- `id`;
- `provider`;
- `external_event_key`;
- `payload`;
- `received_at`;
- `processed_at`;
- `status`;
- `error`.

### 14.8 `order_events`

Timeline interna e pública:

- pagamento gerado;
- pagamento aprovado;
- pedido preparado;
- entrega iniciada;
- atualização;
- conclusão;
- intervenção administrativa.

---

## 15. APIs internas

### 15.1 Criar checkout

```http
POST /api/checkout
```

```json
{
  "package_slug": "impulso",
  "post_url": "https://www.instagram.com/reel/ABC123/",
  "customer": {
    "name": "Nome",
    "email": "cliente@email.com",
    "phone": "+5511999999999"
  },
  "attribution": {
    "utm_source": "meta",
    "utm_campaign": "reels"
  }
}
```

Resposta:

```json
{
  "order_token": "ord_public_xxx",
  "payment_status": "pending",
  "payment_url": "/pedido/ord_public_xxx/pagamento"
}
```

### 15.2 Consultar pedido público

```http
GET /api/public/orders/{public_token}
```

Não retornar IDs internos, API keys, `service_id`, custos ou payloads brutos.

### 15.3 Webhook Pushin Pay

```http
POST /api/webhooks/pushinpay
```

### 15.4 Admin

- listar pedidos;
- filtrar por pagamento e fulfillment;
- abrir detalhes;
- reenviar processamento seguro;
- marcar revisão;
- solicitar refill;
- solicitar cancelamento;
- copiar URL;
- visualizar logs sanitizados.

---

## 16. Stack recomendada

### 16.1 Aplicação

- Next.js com App Router e TypeScript.
- React Server Components para conteúdo estático.
- Client Components apenas para interações.
- Tailwind CSS ou CSS Modules com tokens centralizados.
- Zod para validação compartilhada.
- PostgreSQL.
- Drizzle ORM.
- Trigger.dev ou Inngest para workflows, retries e tarefas agendadas.
- Vercel para aplicação.
- Neon, Supabase ou PostgreSQL gerenciado.
- Sentry para erros.
- PostHog e/ou GA4 para produto e funil.

### 16.2 Justificativa

Um backend separado em NestJS é desnecessário para o MVP. O projeto precisa de:

- endpoints seguros;
- webhooks;
- jobs;
- persistência;
- processamento assíncrono;
- páginas rápidas.

Next.js full-stack reduz a superfície de infraestrutura. A camada de jobs evita depender de execução longa em funções serverless. Caso o volume cresça, o worker pode ser extraído sem reconstruir o domínio.

---

## 17. Sistema de marca e design premium

### 17.1 Conceito estratégico da marca

**Território de marca:** Prestígio Digital em Movimento  
**Conceito visual:** Sapphire Signal  
**Ideia central:** a Notorius transforma uma publicação em um sinal mais forte de presença.  
**Linha de marca:** Presença que se percebe.

A marca combina dois mundos:

1. **Prestígio:** medalhão, ouro, acabamento, confiança e valor percebido.
2. **Sinal digital:** safira, pulsos, métricas, distribuição e movimento.

O projeto não deve parecer luxuoso apenas por usar dourado. O premium deve vir de precisão, consistência, proporção, materialidade controlada e clareza operacional.

### 17.2 Relação entre marca e serviço

Cada elemento visual precisa ter relação com o produto:

| Elemento da marca | Significado no serviço |
|---|---|
| Medalhão circular | selo de presença e pacote concluído |
| Safira facetada | conteúdo digital transformado em sinal |
| Ouro | valor, seleção e destaque |
| Anéis concêntricos | distribuição e alcance |
| Circuitos externos | operação automatizada |
| Reflexos | progressão de métricas |
| Monograma central | assinatura e reconhecimento |

A interface deve traduzir essas metáforas de modo funcional, sem transformar a landing em uma ilustração literal.

### 17.3 Diagnóstico e requisitos da logo

O arquivo atual possui forte potencial como emblema expressivo, mas o SVG fornecido incorpora uma imagem raster em base64. Ele não deve ser usado como único ativo de produção.

#### Entregáveis obrigatórios de identidade

1. `notorius-emblem-3d.avif` e `.webp`
   - hero;
   - criativos;
   - telas comemorativas.

2. `notorius-emblem-flat.svg`
   - versão vetorial simplificada;
   - header secundário;
   - peças menores.

3. `notorius-monogram.svg`
   - favicon;
   - loading;
   - ícones;
   - estados compactos.

4. `notorius-lockup-horizontal.svg`
   - principal assinatura do header e checkout.

5. `notorius-lockup-monochrome.svg`
   - fundos claros;
   - documentos;
   - aplicações restritas.

6. Favicons e app icons
   - 16, 32, 48, 180, 192 e 512 px.

#### Regras de uso

- não distorcer;
- não inclinar;
- não aplicar glow externo genérico;
- não fazer rotação contínua de moeda;
- não usar o emblema 3D abaixo de 96 px;
- não sobrepor o wordmark a áreas de alto ruído;
- manter área de proteção mínima equivalente a 25% do diâmetro do monograma.

### 17.4 Princípios de marca

#### 1. Presença antes de decoração

A marca deve tornar o produto mais compreensível. Efeitos só permanecem quando reforçam hierarquia, estado ou narrativa.

#### 2. Precisão sem frieza

A interface é objetiva, mas usa tipografia, materiais e movimento para não parecer um painel técnico.

#### 3. Luxo controlado

Ouro é assinatura, não preenchimento dominante. O emblema é o objeto expressivo; o restante da interface cria espaço para ele.

#### 4. Movimento com função

Pulsos, anéis e facetas indicam progressão, distribuição, seleção ou confirmação.

#### 5. Uma experiência, dois níveis

- marketing: expressivo, escuro, editorial;
- transação: claro, focado e legível.

### 17.5 Personalidade

Atributos:

- confiante;
- precisa;
- desejável;
- atual;
- tecnológica;
- direta;
- cultural;
- controlada.

Não deve ser:

- infantil;
- agressiva;
- espalhafatosa;
- excessivamente corporativa;
- mística;
- cripto;
- cassino;
- “hacker”.

### 17.6 Paleta cromática

A paleta deriva dos tons dominantes da logo: preto, azul-noturno, safira, ouro envelhecido e marfim.

```css
:root {
  /* Foundations */
  --ink-1000: #000000;
  --ink-950: #05070D;
  --navy-950: #070E27;
  --navy-900: #0A1326;
  --navy-800: #0D2654;

  /* Sapphire */
  --sapphire-700: #0E3D83;
  --sapphire-600: #0E51B3;
  --sapphire-500: #1C66D1;
  --sapphire-action: #2F7BFF;
  --sapphire-soft: #9BC2FF;

  /* Gold */
  --gold-900: #392212;
  --gold-800: #624625;
  --gold-700: #85673F;
  --gold-500: #B08F60;
  --gold-300: #DDBC83;

  /* Neutrals */
  --ivory-100: #F1E9D5;
  --ivory-50: #F7F4EC;
  --slate-700: #616D7E;
  --slate-400: #ABB6C3;
  --white: #FFFFFF;

  /* Semantic */
  --success: #49B887;
  --warning: #E7A849;
  --danger: #E6626A;
  --info: #2F7BFF;
}
```

#### Proporção recomendada

- 65% a 75%: ink/navy;
- 15% a 25%: marfim e neutros;
- 5% a 8%: safira;
- 2% a 5%: dourado;
- cores semânticas apenas em estados.

#### Regras

- CTA primário pode usar marfim sobre fundo escuro ou safira de alto contraste;
- dourado indica seleção, nível ou assinatura;
- verde é exclusivo para sucesso;
- não usar dourado para mensagens de sucesso;
- não aplicar gradiente ouro-safira em todos os componentes.

### 17.7 Superfícies e materiais

#### Marketing

- canvas azul-preto;
- cards navy;
- bordas brancas ou douradas em 8% a 18%;
- reflexos localizados;
- sombras amplas e suaves;
- textura facetada com opacidade baixa.

#### Checkout

- shell navy;
- superfície principal marfim;
- texto escuro;
- bordas neutras;
- foco em safira.

#### Admin

- superfícies funcionais e compactas;
- contraste moderado;
- sem materiais 3D;
- ouro somente em branding e pacote destacado.

### 17.8 Tipografia

Usar no máximo duas famílias.

#### Direção recomendada

- **Display:** serif editorial contemporânea ou sans display com cortes geométricos.
- **Interface:** sans neutra, legível e com numerais tabulares.

Combinação de implementação aberta:

- Display: `Instrument Serif` para frases curtas de marca;
- Interface: `Manrope` ou `Geist`;
- Números: variante tabular da família de interface.

#### Regras

- a serif não aparece em formulários, tabelas ou estados;
- headline principal: 52–76 px desktop, 38–48 px mobile;
- corpo: 16–20 px;
- line-height de headline entre 0,95 e 1,08;
- line-height de corpo entre 1,45 e 1,65;
- caixa alta apenas em eyebrows e labels curtos;
- usar tracking negativo somente em títulos grandes.

### 17.9 Sistema de espaçamento e grid

Base de 4 px, com passos preferenciais:

`4, 8, 12, 16, 24, 32, 48, 64, 80, 96, 128`

Grid desktop:

- 12 colunas;
- largura máxima entre 1200 e 1280 px;
- gutter de 24 ou 32 px.

Grid mobile:

- 4 colunas;
- margem lateral de 20 px;
- gutter de 12 ou 16 px.

As seções devem respirar. Não preencher todas as áreas com cards.

### 17.10 Formas e raio

- cards editoriais: 20–28 px;
- inputs e botões: 12–16 px;
- chips: raio completo;
- emblemas e indicadores: círculos;
- evitar misturar cinco raios diferentes.

A geometria deve combinar retângulos controlados com círculos derivados do medalhão.

### 17.11 Iconografia

Criar uma família própria ou adaptar um único set linear.

Características:

- traço de 1,5–2 px;
- terminais arredondados;
- construção geométrica;
- versões para views, likes, shares, saves, Pix, suporte e status;
- detalhes inspirados no monograma sem reproduzi-lo em todo ícone.

Não misturar emoji, ícone preenchido e ícone linear na mesma experiência.

### 17.12 Linguagem gráfica

#### Facetas

Uso:

- máscara de imagem;
- textura do hero;
- detalhe de divisória;
- transição de seção.

#### Anéis

Uso:

- progresso;
- destaque do pacote;
- cena do hero;
- status de pedido.

#### Linhas de sinal

Uso:

- conectar passos;
- representar distribuição;
- ornamentar separadores.

#### Circuitos

Uso restrito:

- rodapé;
- painel administrativo;
- background do hero em baixa opacidade.

Circuitos não devem ser o elemento principal da marca.

### 17.13 Fotografia e conteúdo

Priorizar:

- creators em contexto real;
- close de celular e conteúdo;
- cenas de produção;
- publicação como objeto editorial;
- crops fortes;
- baixo ruído;
- luz dirigida.

Evitar:

- banco de imagens corporativo;
- pessoas apontando para métricas;
- influencer genérico sorrindo para a câmera;
- montagens com dinheiro;
- smartphone flutuando sem contexto;
- interface falsa excessivamente detalhada.

### 17.14 Mockups de publicação

A publicação deve ser apresentada em uma moldura própria da Notorius.

A moldura pode mostrar:

- thumbnail;
- username anonimizado;
- legenda curta;
- quatro métricas;
- estado de progressão.

Não copiar integralmente a interface do Instagram nem depender de elementos proprietários para a identidade visual.

### 17.15 Motion system

#### Princípios

- motion confirma;
- motion orienta;
- motion cria presença;
- motion não distrai.

#### Durações

- feedback rápido: 120–180 ms;
- transição de componente: 180–260 ms;
- entrada de seção: 400–700 ms;
- cena do hero: ciclos lentos de 6–12 s.

#### Padrões

- pulso radial;
- brilho percorrendo uma borda;
- faceta mudando de luminosidade;
- número atualizando com transição curta;
- nó de timeline preenchendo.

#### Proibido

- moeda girando;
- partículas constantes;
- parallax agressivo;
- scroll-jacking;
- contadores longos em toda visita;
- animações que atrasam CTA.

Sempre respeitar `prefers-reduced-motion`.

### 17.16 Direção por área do produto

#### Landing

Expressiva, escura, editorial e orientada à conversão.

#### Checkout

Clara, focada, com forte continuidade de marca.

#### Pagamento Pix

Operacional, com QR Code dominante e status evidente.

#### Acompanhamento

Escuro ou híbrido, com anéis de progresso e linguagem humana.

#### Admin

Denso, previsível e utilitário. O premium vem da consistência, não de decoração.

### 17.17 Anti-padrões visuais

Evitar:

- roxo neon como base;
- verde-limão como cor de marca;
- glassmorphism em todos os cards;
- esferas 3D aleatórias;
- robôs ou cérebros;
- foguetes;
- moedas espalhadas;
- ouro em grandes fundos;
- dashboards falsos;
- dezenas de selos;
- gradients em todo texto;
- tipografia serifada nos formulários;
- logo 3D no header;
- estética de cassino, cripto ou game;
- elementos que parecem gerados por IA sem direção de arte.

### 17.18 Critério de premium

Uma tela é considerada premium quando:

1. existe um foco visual inequívoco;
2. a marca é reconhecível sem depender do logo;
3. os materiais são usados com restrição;
4. a tipografia possui hierarquia;
5. as transições têm função;
6. a interface continua rápida;
7. a informação comercial não é sacrificada pela estética;
8. todos os estados parecem pertencer ao mesmo sistema.

## 18. Arquitetura e construção dos componentes

### 18.1 Contrato obrigatório de componente

Todo componente relevante deve ser especificado e implementado com:

1. **Objetivo:** qual decisão ou tarefa suporta.
2. **Anatomia:** subelementos internos.
3. **Dados/props:** fonte e formato dos dados.
4. **Variantes:** diferenças permitidas.
5. **Estados:** idle, hover, focus, loading, success, error e disabled, quando aplicável.
6. **Responsividade:** desktop, tablet e mobile.
7. **Motion:** entrada e feedback.
8. **Acessibilidade:** semântica, teclado, contraste e ARIA.
9. **Analytics:** evento emitido quando houver interação.
10. **Critério de aceite:** resultado observável.

Nenhuma IA de implementação deve criar componentes adicionais apenas para decoração sem atualizar o spec.

### 18.2 Primitivos de marca

#### `BrandMonogram`

Uso compacto.

Props:

```ts
type BrandMonogramProps = {
  variant: "flat" | "monochrome" | "embossed";
  size: "xs" | "sm" | "md" | "lg";
  label?: string;
};
```

#### `BrandLockup`

Assinatura horizontal.

Variantes:

- `light`;
- `dark`;
- `monochrome`.

#### `BrandEmblem3D`

Uso exclusivamente expressivo.

Regras:

- carregar AVIF/WebP;
- fornecer fallback estático;
- não usar como ícone;
- lazy load fora do hero.

#### `FacetPattern`

Textura vetorial ou CSS/SVG.

Props:

- densidade;
- opacidade;
- direção de luz;
- máscara.

#### `SignalRing`

Anel de sinal e progresso.

Variantes:

- decorative;
- progress;
- status;
- featured.

#### `MetricGlyph`

Ícones de views, likes, shares e saves.

Não usar o ícone do Instagram como substituto das métricas.

### 18.3 Componentes de marketing

#### `SiteHeader`

Objetivo: manter orientação e acesso ao CTA.

Analytics:

- `header_package_click`;
- `order_tracking_click`;
- `support_click`.

#### `HeroPresence`

Anatomia:

- eyebrow;
- headline;
- subheadline;
- CTA group;
- microcopy;
- `HeroMedallionScene`.

Critério de aceite:

- proposta compreensível sem rolar;
- CTA primário visível em 360 × 800;
- LCP não depende de vídeo.

#### `HeroMedallionScene`

Camadas:

1. signal field;
2. post frame;
3. emblema;
4. metric chips;
5. highlights.

Implementar em HTML/CSS/SVG sempre que possível. Não criar uma imagem única com todo o hero, pois ela impediria responsividade e acessibilidade.

#### `TrustRail`

Props:

```ts
type TrustItem = {
  id: string;
  label: string;
  icon: TrustIcon;
  value?: string;
  sourceLabel?: string;
};
```

Números dinâmicos só aparecem quando configurados.

#### `UseCaseEditorialGrid`

Cards sem CTA individual. O clique opcional leva aos pacotes.

#### `PackageCollection`

Busca pacotes ativos no backend ou camada de conteúdo. Não contém preços hardcoded.

#### `PackageCard`

Props:

```ts
type PackageCardProps = {
  package: PublicPackage;
  variant: "default" | "featured" | "premium";
  selected?: boolean;
  onSelect: (slug: string) => void;
};
```

Estados:

- default;
- hover;
- selected;
- unavailable;
- loading.

Eventos:

- `package_view`;
- `package_select`.

Critério de aceite:

- quantidade e preço legíveis;
- uma publicação explicitada;
- pacote indisponível não gera checkout.

#### `PackageMatrix`

Recebe o mesmo dataset dos cards. Não duplicar conteúdo manualmente.

#### `SignalSteps`

Cada passo possui label, título e texto. Em mobile vira linha vertical.

#### `ProofGallery`

Tipos aceitos:

- screenshot;
- quote;
- case metric;
- short video.

O componente precisa permitir ocultar nomes e dados.

#### `OperatingPrinciples`

Grid de princípios operacionais.

#### `FAQAccordion`

Apenas um ou vários itens abertos conforme decisão de UX; manter comportamento consistente.

#### `FinalPresenceCTA`

Reusa o mesmo destino do CTA do hero.

#### `MobileStickyCTA`

Aparece após o usuário sair do hero e desaparece ao entrar na seção de pacotes ou checkout.

### 18.4 Componentes de checkout

#### `CheckoutShell`

Responsável por layout, branding e persistência visual.

#### `CheckoutProgress`

Etapas:

1. dados;
2. Pix;
3. confirmação.

Não criar etapas adicionais sem necessidade.

#### `SelectedPackageSummary`

Usa snapshot visual dos dados públicos do pacote.

#### `InstagramUrlField`

Implementa normalização e validação compartilhada com backend.

#### `CustomerFields`

Campos com labels persistentes e autofill.

#### `TermsConsent`

Links abrem em nova rota ou modal acessível, sem apagar os dados preenchidos.

#### `CheckoutSubmit`

Recebe o valor calculado pelo backend; o frontend envia apenas `package_slug`.

### 18.5 Componentes Pix

#### `PixPaymentPanel`

Anatomia:

- status;
- QR Code;
- valor;
- tempo restante;
- código;
- copiar;
- instrução;
- suporte.

#### `PixCopyButton`

Após copiar:

- alterar texto para `Código copiado`;
- exibir confirmação por 2–3 s;
- não depender apenas de cor.

#### `PaymentStatus`

Estados públicos:

- aguardando pagamento;
- confirmado;
- expirado;
- em análise.

#### `ExpirationTimer`

O timer é visual. A fonte de verdade é `expires_at` do servidor.

### 18.6 Componentes de acompanhamento público

#### `PublicOrderHeader`

Exibe número do pedido, pacote e URL abreviada.

#### `OrderStatusRing`

Derivado do medalhão, mas plano e funcional.

Estados:

- recebido;
- em andamento;
- ação necessária;
- em análise;
- concluído.

#### `OrderTimeline`

Eventos públicos humanizados.

Não exibir:

- `service_id`;
- `provider_order_id`;
- erro bruto;
- custos;
- nome do fornecedor.

#### `CustomerActionCard`

Usado para troca de URL quando o Compatibility Gate bloquear views.

#### `RepeatPurchaseCTA`

Aparece após conclusão.

### 18.7 Componentes administrativos

- `AdminShell`;
- `AdminOrderTable`;
- `AdminFilters`;
- `OrderDetail`;
- `PaymentAttemptList`;
- `FulfillmentItemList`;
- `ProviderEventLog`;
- `RetryAction`;
- `RefillAction`;
- `CancelAction`;
- `PackageEditor`;
- `ProviderServicePicker`;
- `ServiceSyncStatus`.

O painel não deve reutilizar o emblema 3D. Usar monograma, tokens e superfícies.

### 18.8 Componentes de estado

Criar estados consistentes e reutilizáveis:

- `InlineError`;
- `FieldSuccess`;
- `LoadingSkeleton`;
- `EmptyState`;
- `SystemAlert`;
- `StatusBadge`;
- `Toast`;
- `ConfirmationDialog`.

### 18.9 Estrutura de diretórios sugerida

```text
components/
├── brand/
│   ├── BrandMonogram.tsx
│   ├── BrandLockup.tsx
│   ├── BrandEmblem3D.tsx
│   ├── FacetPattern.tsx
│   └── SignalRing.tsx
├── marketing/
│   ├── SiteHeader.tsx
│   ├── HeroPresence.tsx
│   ├── HeroMedallionScene.tsx
│   ├── PackageCollection.tsx
│   ├── PackageCard.tsx
│   └── ...
├── checkout/
├── payment/
├── order-tracking/
├── admin/
└── ui/
```

### 18.10 Regras de implementação por IA

A IA deve:

- usar tokens;
- reutilizar componentes;
- respeitar nomes e responsabilidades;
- não adicionar bibliotecas de UI completas sem justificativa;
- não criar gradientes aleatórios;
- não alterar a paleta;
- não hardcodar pacotes;
- não substituir SVGs por emojis;
- não gerar seções extras;
- não inventar provas ou métricas;
- não alterar a arquitetura de estados.

Quando faltar um ativo, usar placeholder explícito com nome do arquivo esperado, não gerar uma identidade alternativa silenciosamente.

## 19. Sistema de voz, copy e conteúdo

### 19.1 Essência verbal

A marca fala sobre:

- presença;
- publicação;
- métricas;
- escolha;
- simplicidade;
- acompanhamento.

A marca não fala como painel técnico nem como vendedor agressivo.

### 19.2 Tom

- direto;
- confiante;
- curto;
- sofisticado sem rebuscamento;
- humano;
- operacional quando necessário.

### 19.3 Pilares de mensagem

#### 1. Presença que se percebe

A publicação recebe mais força visual por meio dos entregáveis do pacote.

#### 2. Simples de comprar

Escolha, link e Pix.

#### 3. Sem acesso à conta

Nenhuma senha é solicitada.

#### 4. Processo acompanhado

O cliente recebe confirmação e consulta o pedido.

### 19.4 Vocabulário preferencial

Usar:

- presença;
- publicação;
- pacote;
- entrega;
- acompanhamento;
- processando;
- confirmado;
- escolha;
- conteúdo prioritário.

Evitar:

- hack;
- explodir;
- viralizar garantido;
- burlar algoritmo;
- painel secreto;
- fórmula;
- mágica;
- robô;
- revolução;
- incomparável;
- resultado instantâneo sem base operacional.

### 19.5 Regras

- frases curtas;
- uma ideia por bloco;
- benefícios antes das métricas;
- “uma publicação” nos pontos críticos;
- não mencionar API, `service_id` ou fornecedor;
- não inventar urgência;
- não criar novos números sem fonte;
- não usar adjetivos premium em toda frase;
- manter CTA consistente;
- mensagens de erro devem explicar a ação seguinte.

### 19.6 CTAs

Primário: `Escolher meu pacote`  
Cards: `Escolher Start`, `Escolher Impulso`, etc.  
Checkout: `Gerar Pix de R$ 19,90`  
Pagamento: `Copiar código Pix`  
Pós-compra: `Acompanhar pedido`  
Troca de URL: `Enviar outro link`  
Recompra: `Impulsionar outra publicação`

### 19.7 Headlines-base

Hero:

`Dê mais presença à publicação que importa.`

Pacotes:

`Escolha o nível de presença ideal para o seu conteúdo.`

Como funciona:

`Da escolha ao acompanhamento, sem complicação.`

Prova:

`Uma operação que já acontece todos os dias.`

CTA final:

`Sua próxima publicação pode ter mais presença.`

### 19.8 Mensagens de sistema

Pagamento pendente:

`Seu Pix está pronto. Conclua o pagamento para iniciarmos o pedido.`

Pagamento confirmado:

`Pagamento confirmado. Seu pedido já está sendo processado.`

Pedido em andamento:

`Seu pacote está em processamento. Você pode acompanhar as atualizações por aqui.`

Ação necessária:

`Precisamos ajustar o link da publicação para continuar.`

Análise:

`Uma etapa do pedido precisa de ajuste. Nossa equipe já foi notificada.`

Concluído:

`Pedido concluído. Os itens do pacote foram processados.`

## 20. Analytics

Eventos mínimos:

- `landing_view`;
- `hero_cta_click`;
- `package_view`;
- `package_select`;
- `checkout_view`;
- `post_url_valid`;
- `post_url_error`;
- `checkout_submit`;
- `pix_created`;
- `pix_copy`;
- `payment_confirmed`;
- `fulfillment_queued`;
- `fulfillment_started`;
- `order_partial`;
- `order_completed`;
- `support_click`;
- `repeat_purchase_click`.

Propriedades:

- package;
- price;
- campaign;
- device;
- landing variant;
- new or returning;
- URL type: post or reel;
- time to payment;
- time to fulfillment;
- fulfillment result.

### KPIs

- landing → seleção;
- seleção → checkout;
- checkout → Pix;
- Pix → pagamento;
- pagamento → envio ao Notorius;
- tempo até início;
- tempo até conclusão;
- distribuição por pacote;
- ticket médio;
- margem por pacote;
- recompra;
- suporte por 100 pedidos;
- falhas por serviço.

---

## 21. Performance, SEO e acessibilidade

### Performance

- mobile-first;
- imagens responsivas;
- fontes com preload controlado;
- evitar vídeo pesado no hero;
- animações com transform e opacity;
- mínimo JavaScript no marketing;
- carregamento assíncrono de analytics;
- LCP abaixo de 2,5 s;
- INP abaixo de 200 ms;
- CLS abaixo de 0,1;
- Lighthouse mobile acima de 90 como meta.

### SEO

A página é primariamente de mídia paga, mas deve possuir:

- title e description;
- Open Graph;
- canonical;
- sitemap;
- robots adequado;
- conteúdo renderizado no servidor;
- schema de Organization e FAQ quando aplicável.

### Acessibilidade

- WCAG 2.2 AA como meta;
- contraste validado;
- foco visível;
- labels reais;
- navegação por teclado;
- mensagens de erro associadas aos inputs;
- status com texto, não apenas cor;
- motion reduzido.

---

## 22. Segurança e confiabilidade

1. Segredos somente no servidor.
2. Logs sem token, API key, Pix completo ou dados desnecessários.
3. Rate limit em checkout e consulta pública.
4. Tokens públicos imprevisíveis.
5. Validação de payload com Zod.
6. Proteção contra replay de webhook.
7. Deduplicação de eventos.
8. Conferência de valor antes do fulfillment.
9. Backups do banco.
10. Auditoria de ações administrativas.
11. Não confiar em parâmetros de preço enviados pelo frontend.
12. Snapshot do pacote no momento da compra.
13. CSP e headers de segurança.
14. Dados pessoais limitados ao necessário.

---

## 23. Painel administrativo mínimo

### Dashboard

- pedidos hoje;
- receita;
- Pix pendentes;
- pagos aguardando envio;
- pedidos em andamento;
- falhas;
- pedidos parciais.

### Lista

Filtros por:

- data;
- pacote;
- pagamento;
- fulfillment;
- serviço;
- campanha;
- cliente.

### Detalhe

- cliente;
- URL;
- pacote comprado;
- pagamento;
- itens técnicos;
- timeline;
- respostas externas sanitizadas;
- ações administrativas.

---

## 24. Critérios de aceite

### Funcionais

1. O visitante consegue comprar qualquer pacote ativo.
2. O preço usado no pagamento vem do backend.
3. URLs inválidas não geram cobrança.
4. Um pagamento aprovado cria o fulfillment uma única vez.
5. Cada item técnico armazena o ID retornado pelo Notorius.
6. O cliente acompanha o pedido por token público.
7. Recarregar a página de pagamento não cria outro Pix automaticamente.
8. Webhooks duplicados não duplicam pedidos.
9. Falha em um item não apaga o progresso dos demais.
10. A operação consegue localizar e tratar pedidos com falha.

### UX

1. A oferta é compreensível na primeira dobra.
2. “Uma publicação” aparece no hero, card e checkout.
3. O checkout tem uma ação principal.
4. O valor total está visível antes da geração do Pix.
5. Erros preservam os dados preenchidos.
6. A experiência funciona após retorno do aplicativo bancário.
7. O mobile não exige zoom nem rolagem horizontal.
8. O cliente recebe confirmação clara após o pagamento.
9. Estados públicos nunca expõem detalhes do fornecedor.
10. A troca de URL após incompatibilidade possui caminho claro.

### Marca

1. A interface é reconhecível como Notorius mesmo sem o emblema 3D.
2. Safira, ouro, marfim e navy seguem os tokens definidos.
3. Ouro não ocupa grandes superfícies interativas.
4. O emblema 3D aparece apenas em áreas expressivas.
5. Header e checkout usam lockup vetorial simplificado.
6. Não existe estética de cripto, cassino, game ou IA genérica.
7. A metáfora de sinal aparece em anéis, progressão ou linhas, sem excesso.
8. A linguagem visual conversa com publicação, presença e métricas.

### Componentes

1. Todos os componentes reutilizam tokens.
2. `PackageCard` e `PackageMatrix` consomem a mesma fonte de dados.
3. Nenhum preço ou `service_id` fica hardcoded em componentes.
4. Cada componente interativo possui hover, focus, loading, error e disabled quando aplicável.
5. Componentes públicos possuem semântica e navegação por teclado.
6. A IA não cria novos componentes ornamentais fora do spec.
7. O design permanece consistente entre landing, checkout, Pix e acompanhamento.

### Visual

1. Existe um foco dominante por seção.
2. O pacote recomendado possui destaque sem invalidar os demais.
3. O checkout preserva a marca com menor carga visual.
4. Estados usam texto e forma, não apenas cor.
5. Motion não atrasa tarefas.
6. O hero não depende de vídeo pesado.
7. O design funciona em 360 px de largura.
8. Nenhuma prova, métrica ou depoimento é inventado.
9. A logo atual é substituída por ativos adequados a cada escala.
10. A experiência final não parece um template de painel SMM.

### Performance e acessibilidade

1. LCP mobile abaixo de 2,5 s como meta.
2. INP abaixo de 200 ms como meta.
3. CLS abaixo de 0,1.
4. Lighthouse mobile acima de 90 como meta.
5. WCAG 2.2 AA como meta.
6. `prefers-reduced-motion` é respeitado.
7. Contraste dos tokens é validado antes da aprovação visual.

## 25. Plano de implementação

### Fase 0 — Descoberta e insumos

- confirmar custos por `service_id`;
- validar serviços, mínimos, máximos e reposição;
- obter token Pushin Pay;
- capturar exemplos reais de webhook;
- reunir provas sociais;
- mapear dúvidas do atendimento X1;
- fechar política operacional;
- reunir arquivos originais da logo;
- definir domínio e identificação comercial.

### Fase 1 — Brand foundation

- reconstruir o monograma em vetor;
- criar emblema flat;
- criar lockup horizontal;
- criar versão monocromática;
- tratar emblema 3D em alta resolução;
- fechar paleta;
- escolher tipografia;
- criar iconografia mínima;
- criar tokens;
- validar contraste;
- criar mini brand guide.

### Fase 2 — UX e direção de arte

- moodboard orientado pelas referências;
- wireframe low fidelity;
- copy por seção;
- protótipo de hero;
- protótipo de pacotes;
- protótipo de checkout;
- protótipo da tela Pix;
- protótipo de acompanhamento;
- versão desktop e mobile;
- teste rápido com compradores anteriores.

### Fase 3 — Design system e componentes

- primitives;
- componentes de marca;
- marketing;
- checkout;
- Pix;
- tracking;
- estados;
- documentação de props, variantes e comportamento;
- handoff para implementação por IA.

### Fase 4 — Core commerce

- catálogo;
- landing;
- checkout;
- banco;
- Pushin Pay;
- webhook;
- tela Pix;
- analytics.

### Fase 5 — Fulfillment

- adapter Notorius;
- orquestração;
- Compatibility Gate;
- polling;
- acompanhamento;
- painel administrativo;
- alertas.

### Fase 6 — QA de marca e produto

- revisão visual comparada ao spec;
- testes mobile reais;
- estados de erro;
- loading;
- Pix expirado;
- pagamento tardio;
- subserviço com falha;
- troca de URL;
- acessibilidade;
- performance;
- eventos de analytics.

### Fase 7 — Otimização

- recuperação de Pix;
- recompra;
- upsell;
- testes A/B;
- variantes por anúncio;
- análise de margem e CAC.

## 26. Decisões em aberto

### Operação e oferta

1. Quais são os `service_ids` do pacote Top?
2. Qual é o custo real atualizado de cada pacote?
3. Qual prazo será comunicado por pacote?
4. Qual política comercial será aplicada após entrega parcial?
5. Em quais situações haverá refill?
6. Quais provas reais serão usadas?
7. Haverá cupom no MVP?

### Pagamento e comunicação

8. Qual canal fará notificações?
9. Quais estados e campos exatos a Pushin Pay envia no webhook?
10. Existe endpoint oficial de consulta de cobrança e qual será o fallback?
11. A Pushin Pay permite configurar tecnicamente a expiração em 30 minutos ou a janela será apenas comercial na aplicação?

### Marca e conteúdo

12. Qual é o arquivo original editável da logo?
13. O símbolo central será mantido exatamente ou refinado geometricamente?
14. Qual família display será licenciada ou utilizada?
15. Quais fotografias e conteúdos reais estarão disponíveis?
16. O wordmark `NOTORIUS` será redesenhado ou apenas vetorizado?
17. O hero utilizará conteúdo real anonimizado ou mockup editorial?
18. Qual será o domínio final?

### Produto

19. O comprador poderá editar a URL livremente antes do fulfillment ou somente após erro de compatibilidade?
20. O painel admin do MVP permitirá editar textos comerciais ou apenas pacotes e serviços?
21. A recuperação de Pix será feita por WhatsApp no MVP ou em fase posterior?

## 27. Referências de produto, marca e design

As referências abaixo são usadas por princípio específico. A Notorius não deve copiar layout, cor ou identidade integral de nenhuma delas.

### 27.1 Cartier — precisão, equilíbrio e materialidade

**Referência para:**

- relação entre safira, ouro e espaço negativo;
- linhas limpas;
- volume controlado;
- apresentação de uma peça central;
- princípio de “nada em excesso”.

**Não copiar:**

- linguagem de joalheria;
- navegação institucional;
- excesso de distância emocional;
- tipografia clássica aplicada a todo o produto.

**Aplicação Notorius:**

- emblema como objeto central;
- ouro em pequenos detalhes;
- safira como núcleo;
- grandes áreas de respiro;
- luz localizada.

### 27.2 Bang & Olufsen — tecnologia tratada como objeto premium

**Referência para:**

- combinação entre engenharia e materialidade;
- storytelling de produto;
- fotografia com contexto;
- sensação de acabamento;
- tecnologia sem estética “tech genérica”.

**Não copiar:**

- ritmo lento de site institucional;
- foco em lifestyle residencial;
- navegação de catálogo físico.

**Aplicação Notorius:**

- tratar o pacote digital como produto bem construído;
- explicar processo sem perder desejo;
- unir precisão operacional e apresentação premium.

### 27.3 Linear — hierarquia e interface calma

**Referência para:**

- reduzir peso visual do que não é central;
- consistência entre estados;
- previsibilidade de ações;
- densidade com legibilidade;
- sistema de tokens.

**Não copiar:**

- estética de software B2B;
- cinza frio em toda a interface;
- interface excessivamente compacta na landing.

**Aplicação Notorius:**

- foco no CTA e na escolha;
- suporte visual recuado;
- admin organizado;
- estados consistentes;
- componentes previsíveis.

### 27.4 Spotify Design — marca, produto e motion no mesmo sistema

**Referência para:**

- sistema de sistemas;
- cor, tipo, motion, espaçamento e acessibilidade sob uma única governança;
- movimento ligado à identidade;
- componentes adaptáveis sem perder marca.

**Não copiar:**

- paleta;
- estética musical;
- intensidade cromática do Wrapped.

**Aplicação Notorius:**

- marca expressiva no marketing;
- componentes funcionais no produto;
- motion derivado de sinal;
- governança central dos tokens.

### 27.5 Stripe — checkout e continuidade de marca

**Referência para:**

- checkout com uma rota clara;
- poucos campos;
- layout vertical em mobile;
- validação em tempo real;
- preço transparente;
- continuidade visual entre landing e pagamento.

**Não copiar:**

- interface de cartão;
- linguagem financeira;
- componentes de terceiros visualmente desconectados.

**Aplicação Notorius:**

- checkout branded;
- resumo fixo;
- Pix dominante;
- estados claros;
- transição contínua até confirmação.

### 27.6 Matriz de referência

| Necessidade | Referência principal | Aplicação |
|---|---|---|
| Materialidade da logo | Cartier | safira, ouro, luz e espaço |
| Produto premium tecnológico | Bang & Olufsen | engenharia + acabamento |
| Hierarquia de interface | Linear | foco, consistência e densidade |
| Sistema marca-produto-motion | Spotify Design | tokens e movimento |
| Checkout e mobile | Stripe | clareza e conversão |

### 27.7 Referências rejeitadas como direção principal

Não utilizar como base:

- templates genéricos de fintech dark;
- painéis SMM concorrentes;
- interfaces de cripto;
- sites de cassino;
- landing pages de curso com selos e contadores;
- Dribbble shots sem fluxo funcional;
- estética “AI SaaS” com roxo, robôs e esferas.

## 28. Fontes técnicas e referências consultadas

### Produto e integrações

- Notorius API: https://notorius.pro/api
- Pushin Pay Docs: https://docs.pushinpay.com.br/#tag/pix/POST/api/pix/cashIn
- Pushin Pay — exemplo oficial de integração: https://pushinpay.com.br/blog/integracao-com-a-pushin-pay-via-typebot-para-geracao-de-pix
- Landing atual: https://notorius-pi.vercel.app

### UX e checkout

- Stripe — Ecommerce checkout best practices: https://stripe.com/resources/more/ecommerce-checkout-best-practices
- Stripe — Mobile checkout best practices: https://stripe.com/en-br/resources/more/mobile-checkout-best-practices-for-ecommerce-businesses
- Stripe — Branded checkout experiences: https://stripe.com/en-br/resources/more/how-branded-checkout-experiences-can-help-businesses-increase-revenue
- Stripe — Checkout: https://stripe.com/payments/checkout

### Design systems e produto

- Linear — A calmer interface for a product in motion: https://linear.app/now/behind-the-latest-design-refresh
- Linear — How we redesigned the Linear UI: https://linear.app/now/how-we-redesigned-the-linear-ui
- Spotify Design — Reimagining Design Systems at Spotify: https://spotify.design/article/reimagining-design-systems-at-spotify
- Spotify Design — Bringing the Spotify Heart to Life: https://spotify.design/article/bringing-the-spotify-heart-to-life

### Direção de arte e materialidade

- Cartier — En Équilibre: https://www.cartier.com/en-ae/high-jewelry/latest-collections/en-equilibre/
- Bang & Olufsen — About: https://www.bang-olufsen.com/en/fr/story/about-bang-and-olufsen
