# Tela Macro CLP (dashboard do cliente)

> Documento de contexto para agentes de IA e para a equipe. Descreve o front-end da tela **Macro CLP**.
> Itens marcados com **[PENDENTE]** ainda não foram decididos: o agente deve **perguntar**, não decidir sozinho.

---

## 1. Objetivo da tela

Dar ao **gestor da operação do cliente** (persona: Rogério Andrade) uma visão **macro** da saúde dos CLPs da sua planta, para que ele responda em poucos segundos:

1. A minha fábrica está bem?
2. Os CLPs estão operando (online)?
3. Onde está o problema (qual setor, qual CLP)?

A tela **não faz diagnóstico técnico**. Quando o usuário encontra o problema, ele segue para a tela **Micro CLP** (clique na linha do ranking ou no botão de detalhes). Gráficos de evolução no tempo, alertas por componente e predição ficam na tela Micro.

Público: pessoa da indústria, nem sempre técnica. Os textos precisam explicar se o número é bom ou ruim.

---

## 2. Contexto do projeto e stack

- Projeto: **MIND**, plataforma de observabilidade de CLPs industriais.
- Front-end: **HTML + CSS + JavaScript puro**. Gráficos com **Chart.js** (CDN) e o plugin **chartjs-plugin-datalabels** (CDN).
- Back-end (fora do escopo desta tela): Node.js + Express. Dados vêm de uma API; por enquanto a tela usa dados de exemplo.
- Fonte: **Poppins**.
- Quem desenvolve é iniciante/intermediário em front-end: o código deve ser **simples e legível**.

---

## 3. Arquivos da tela

| Arquivo | Função |
|---|---|
| `dashboard-macro-CLP.html` | Página. Contém a sidebar (`aside`) e o `<main>` desta tela |
| `css/dashboard-macro-CLP.css` | Estilo desta tela |
| `js/dashboard-macro-CLP.js` | Gráficos e dados desta tela |
| `css/reset.css`, `css/aside.css`, `js/sidebar.js`, `js/sessao.js`, `js/configuracoes.js` | Compartilhados. **Não alterar** para esta tela |

A sidebar não faz parte desta especificação. Nela, o fluxo do cliente mostra o título "FLUXO DO CLIENTE".

---

## 4. Regras para o agente

**Estilo de código**
- Manter o código **simples**. Preferir `for` e `if` claros a cadeias de `map/filter/reduce`.
- **Não** criar plugins personalizados do Chart.js nem desenhar manualmente no canvas. Usar as opções nativas e o `chartjs-plugin-datalabels`.
- Cores do JS escritas direto em hexadecimal (sem ler variáveis do CSS pelo JS).
- Comentários curtos em português nos pontos não óbvios.
- Reaproveitar as **classes que já existem** (inclusive a grafia `conteiner`). Não renomear classes sem pedir.
- Sem bibliotecas novas sem aprovação.

**Fluxo de trabalho**
- Antes de alterar, ler este arquivo e os arquivos da tela.
- Mudanças pequenas e explicadas. Dizer **o que mudou e em qual arquivo**.
- Não inventar números nem regras de negócio. Se faltar informação, perguntar.
- Não usar `localStorage`/`sessionStorage` nesta tela.

---

## 5. Layout geral

Ordem vertical dentro do `<main>` (`display: flex; flex-direction: column; gap: 1.25rem; padding: 1.5rem 2rem`):

1. Cabeçalho (`header.header-main`)
2. Linha de KPIs (`section.kpi-conteiner`): grid de **4 colunas** iguais, `gap: 1rem`
3. Linha de gráficos (`section.graph-conteiner`): grid de **2 colunas** (`1.7fr` / `1fr`), `gap: 1rem`
   - esquerda: **5 setores com pior health médio**
   - direita: **Situação da frota**
4. Ranking (`section.table-conteiner`): card de largura total

**Cards** (todos iguais): fundo `#0D1527`, borda `1px solid #1E2B45`, **borda superior de 2px na cor de destaque `#06B6D4`**, raio `0.65rem`, padding `1.1rem 1.25rem`.

**Tema escuro.** Cores principais:

| Uso | Cor |
|---|---|
| Fundo da página | `#060A13` |
| Fundo dos cards | `#0D1527` |
| Borda | `#1E2B45` |
| Destaque | `#06B6D4` |
| Texto principal | `#FFFFFF` |
| Texto secundário | `#94A3B8` |
| Positivo (estável) | `#22C55E` |
| Atenção | `#F59E0B` |
| Crítico | `#EF4444` |
| Offline | `#64748B` |

---

## 6. Cabeçalho e filtros

- Esquerda: título **"Visão geral da planta"** (`h1.clp-h1`) e abaixo **"Última atualização às HH:MM"** (`#last-update`, atualizado pelo JS).
- Direita (`.filter-container`), da esquerda para a direita:
  1. Botão **Atualizar** (`#btn-etl`), cor de destaque, texto escuro, altura mínima `2.75rem`.
  2. Select **Setor** (`#sector-filter`): "Setor: Todos", "Setor: Usinagem"...
  3. Select **Período** (`#period-filter`, `onchange="atualizarGraficos()"`): Últimas 24 horas, Últimos 7 dias, Últimos 30 dias.
- Os selects têm o rótulo visível dentro do próprio texto da opção. O `<label>` existe só para leitores de tela (classe `.filter-text`, oculta visualmente).
- O filtro de **setor** e o de **período** valem para a tela inteira (KPIs, gráficos e ranking).

---

## 7. KPIs

Quatro cards (`.kpi-box`). Todos com borda superior na cor de destaque. Estrutura: título pequeno (`.kpi-title`), valor grande, selo de status quando existir, frase explicativa curta (`.kpi-details`).

| # | Título | Valor | Selo | Texto explicativo |
|---|---|---|---|---|
| 1 | Setor mais preocupante | **USINAGEM** (`.kpi-sector`, branco) | Crítico (vermelho) | "Setor com menor health médio (32 de 100)." |
| 2 | Health geral da planta | **47** `/100` (laranja) | Atenção (laranja) | "health score médio dos seus 20 CLPs online." |
| 3 | Disponibilidade | **67%** (laranja) | nenhum | "20 de 30 CLPs estão online." |
| 4 | CLPs críticos | **7** (vermelho) | Requer ação (vermelho) | "Risco de microparada ou parada da linha." |

Regras:
- A cor do número e do selo segue a faixa de status (seção 11).
- **Health geral** considera **somente CLPs online**. Os offline não têm Health Score.
- **Disponibilidade** = CLPs online ÷ total de CLPs.
- **CLPs críticos** = CLPs com Health Score na faixa Crítico.
- Hoje os valores são fixos no HTML. **[PENDENTE]** preencher pelo JS com dados da API.
- Selos: `.status-pill` com `.is-danger`, `.is-warning` ou `.is-positive`.

---

## 8. Gráfico "5 setores com pior health médio"

Card à esquerda (`.graph-box-lines`).

**Cabeçalho do card**
- Título: "5 setores com pior health médio" (`.title-graph`).
- À direita: "de 42 setores" (`#setores-total`; o número vem dos dados).
- Subtítulo: "Média de health dos CLPs online de cada setor, de 0 a 100" (`.lines-title`).

**Filtros do gráfico** (`.chart-filters`, selects `.chart-select`)
- `#sector-metric`: "Métrica: Health médio" (por enquanto só essa opção).
- `#sector-show` (`onchange="atualizarGraficos()"`): "Mostrar: CLPs com problema" (`problem`) ou "Mostrar: todos os online" (`online`).
- **[PENDENTE]** definir exatamente o que cada opção calcula (a média de "CLPs com problema" nunca passaria da faixa Atenção, se só entram CLPs em Atenção/Crítico).

**Gráfico** (`<canvas id="bar-chart">` dentro de `.line-chart-wrapper`, altura `10.5rem`)
- Chart.js, tipo `bar`, `indexAxis: 'y'` (barras horizontais), eixo de valores fixo de **0 a 100**.
- Mostra os **5 setores com menor health**, ordenados do pior (em cima) para o melhor.
- Cor de cada barra pela faixa de status do valor (função `corDaFaixa`).
- Ao lado de cada barra (datalabels): `valor · online/total online`, ex.: `32 · 5/8 online`.
- Sem legenda do Chart.js.

**Abaixo do gráfico**
- Legenda das faixas (`.zone-legend`): Crítico, Atenção, Bom (com os limites da seção 11).
- Aviso de CLP fora da curva (texto laranja), ex.: "Há CLP fora da curva em USINAGEM." **[PENDENTE]** implementar no HTML/JS (hoje existe só no protótipo).
- Rodapé (`.box-footer`): "Os outros 37 setores estão com health médio ≥ 62" (`#peak-label`, calculado dos dados) e o link **"Ver detalhes dos fora da curva →"** (`.link-more`).

**Propósito:** mostrar o **comportamento típico do setor** e **explicar por que o health do setor caiu**, apontando o CLP fora da curva. Depois o usuário segue para a tela Micro.

---

## 9. Gráfico "Situação da frota"

Card à direita (`.graph-box-pizza`).

- Título "Situação da frota". Subtítulo (`#frota-resumo`): "23% dos 30 CLPs estão estáveis" (calculado).
- Gráfico de **rosca** (`<canvas id="pizza">` dentro de `.pizza-chart`, `cutout: '64%'`), 4 fatias: Estável, Atenção, Crítico, Offline.
- No centro, em HTML (`.pizza-center`): total de CLPs (`#frota-total`) e o texto "CLPs". O texto central **não** é desenhado no canvas.
- Legenda ao lado do gráfico (`.pizza-datas`), cada item com bolinha colorida, nome em negrito com a quantidade e uma linha de definição:
  - Estável · 7: "health de 60 ou mais" (`#frota-estavel`)
  - Atenção · 6: "health de 40 a 59" (`#frota-atencao`)
  - Crítico · 7: "health abaixo de 40" (`#frota-critico`)
  - Offline · 10: "sem comunicação" (`#frota-offline`)
- Offline é um **estado**, não uma faixa de health: entra na rosca em cinza, mas **fora** da média de health.
- Sem legenda do Chart.js (a legenda é o HTML acima).

---

## 10. Ranking de CLPs

Card de largura total (`.metrics-box`), contendo título "Ranking de CLPs" e a dica "Do menor para o maior health score · clique em uma linha para ver o detalhe" (`.ranking-hint`).

Tabela (`table.ranking-table`, dentro de `.table-scroll` para rolar na horizontal em telas pequenas), com `<thead>` e `<tbody>`:

| Coluna | Conteúdo |
|---|---|
| Apelido | nome do CLP, ex.: CLP-07 (negrito) |
| Setor | setor de localização |
| Modelo | modelo do CLP, ex.: SIEMENS-S7-1200 |
| Health médio | número colorido pela faixa + barra de progresso (`.health-track`/`.health-fill`) |
| Status | selo `.status-pill`: Crítico, Atenção ou Estável |
| Alertas | quantidade de alertas no período |
| Componente mais problemático | CPU, RAM, Scan Time, Rede... |

Regras:
- Ordenado do **menor para o maior** Health Score.
- A linha inteira é clicável (`.ranking-row`, `tabindex="0"`, `data-clp="CLP-07"`) e abre a tela **Micro CLP** do CLP escolhido. **[PENDENTE]** definir a URL/parâmetro de navegação.
- Hover e foco com fundo `rgba(6, 182, 212, 0.08)`.
- Hoje a tabela é estática no HTML. **[PENDENTE]** gerar as linhas pelo JS.
- **[PENDENTE]** paginação, rolagem interna ou busca (podem existir mais de 1000 CLPs).
- **[PENDENTE]** clicar no KPI "CLPs críticos" deve filtrar o ranking só pelos críticos?

---

## 11. Regras de negócio

**Faixas de Health Score**
- **[PENDENTE]** faixas definitivas do projeto. Há três versões em circulação:
  - Especificação do Micro CLP: Crítico < 40, Atenção 40 a 59, Estável ≥ 60.
  - Tela Macro Modelo (colega): Crítico < 50, Atenção 50 a 74, Estável ≥ 75.
  - Código atual (`corDaFaixa` e CSS): 30 e 60.
- Enquanto não houver decisão, **usar 40 e 60** e concentrar os limites em um único lugar do JS.

**CLP offline**
- Sem comunicação: não tem Health Score, não entra na média de health e aparece em cinza na situação da frota.

**Média por setor e CLP fora da curva**
- A barra do setor é a **média dos CLPs online do setor, desconsiderando os CLPs fora da curva**, para representar o comportamento típico.
- Fora da curva só vale **para baixo** (não se sinaliza CLP melhor que o setor).
- Um CLP é fora da curva quando está em status **Crítico** e o restante do setor, sem ele, está em Atenção ou Estável. Se o setor inteiro está crítico, ninguém é fora da curva.
- **[PENDENTE]** mínimo de CLPs online por setor para aplicar a regra (sugestão: 4).
- O CLP fora da curva continua contado no **ranking**, nos **CLPs críticos** e na **situação da frota**.
- O botão "Ver detalhes dos fora da curva" mostra o CLP (nome e health) e compara a média do setor **com** e **sem** ele, e leva à tela Micro CLP.

**Top 5**
- O gráfico mostra só os 5 piores setores. Os demais ficam resumidos no rodapé. **[PENDENTE]** tela/lista com todos os setores (sugestão: tabela com busca e ordenação).

---

## 12. Dados

Hoje: objeto `dadosMacro` no JS, com dados de exemplo.

```js
const dadosMacro = {
    setores: {
        total: 42,                       // total de setores do cliente
        menorHealthDoRestante: 62,       // menor health entre os setores que NÃO estão no top 5
        problem: [ { nome: 'USINAGEM', health: 32, online: 5, total: 8 }, /* ... */ ],
        online:  [ { nome: 'USINAGEM', health: 38, online: 5, total: 8 }, /* ... */ ]
    },
    frota: { estavel: 7, atencao: 6, critico: 7, offline: 10 }
};
```

Futuro: dados vindos da API do back-end (Node/Express), a partir da camada gold do S3, por CLP: `clp-ultimos-processos`, `clp-micro`, `clp-ranking-processos`, `clp-ping`. **[PENDENTE]** contrato da API (rotas e formato).

O ponto de troca é a função `atualizarGraficos()` (marcado com `TODO`). Ela deve usar o **período** e o **setor** dos filtros.

---

## 13. Contrato HTML ↔ JS

| Elemento (id) | Usado para |
|---|---|
| `last-update` | hora da última atualização |
| `period-filter`, `sector-filter` | filtros do topo |
| `sector-show`, `sector-metric` | filtros do gráfico de setores |
| `setores-total` | "de N setores" |
| `bar-chart` | canvas das barras |
| `peak-label` | texto do rodapé do gráfico de setores |
| `pizza` | canvas da rosca |
| `frota-total`, `frota-resumo` | total no centro e subtítulo |
| `frota-estavel`, `frota-atencao`, `frota-critico`, `frota-offline` | legenda da rosca |

Funções em `dashboard-macro-CLP.js`:
- `obterDados()`: chamada no `onload` do `<body>`. Define a fonte padrão do Chart.js e chama `atualizarGraficos()`.
- `atualizarGraficos()`: lê os filtros, chama os dois gráficos e atualiza a hora.
- `plotarGraficoSetores(modo)`: ordena, pega os 5 piores, monta o gráfico e os textos.
- `plotarGraficoFrota()`: monta a rosca e os textos.
- `corDaFaixa(health)`: devolve a cor da faixa.
- Cada gráfico é destruído (`destroy()`) antes de ser recriado.

---

## 14. Estados e comportamentos

- **Carregando:** **[PENDENTE]**.
- **Sem dados / erro de API:** **[PENDENTE]** mensagem amigável em cada card.
- **Hover** nas linhas do ranking e **tooltip** padrão do Chart.js nos gráficos.
- **Foco por teclado** visível (`:focus-visible`) em botão, selects, links e linhas do ranking.

---

## 15. Responsividade

- Até `1100px`: KPIs em 2 colunas; gráficos em 1 coluna.
- Até `640px`: KPIs em 1 coluna; cabeçalho em coluna; filtros em grade de 2 colunas com o botão Atualizar ocupando a linha toda; a tabela rola na horizontal.
- Em telas pequenas, o texto ao lado das barras (datalabels) pode ficar apertado. **[PENDENTE]** testar.

---

## 16. Acessibilidade

- Os dois `<canvas>` têm `role="img"` e `aria-label`.
- Cor nunca é a única informação: sempre há texto (selo, legenda, número).
- Contraste: texto claro sobre fundo escuro. Usar `#94A3B8` só para texto secundário.
- Tabela com `<th scope="col">`.

---

## 17. Fora do escopo desta tela

- Evolução do health no tempo, alertas por componente, predição e indicadores do modelo: tela **Micro CLP**.
- Comparação de modelos: telas do **fornecedor**.
- Sidebar, login e configurações do usuário.

---

## 18. Como refinar este documento

Quando uma decisão for tomada, mover o item de **[PENDENTE]** para a seção correspondente e remover a marca. Manter este arquivo sempre igual ao que está no código.