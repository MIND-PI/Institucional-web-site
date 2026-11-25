Tela Macro CLP (dashboard do cliente)

Documento de contexto para agentes de IA e para a equipe. Descreve a tela Macro CLP de ponta a ponta: front-end, API (Express) e a camada Gold que gera os dados.

Legenda: [PENDENTE] = decisão em aberto (o agente deve perguntar, não decidir sozinho). [VERIFICAR] = informado por relatório, ainda não conferido no código: confirme lendo os arquivos reais. Quando este documento divergir do código, o código manda: aponte a divergência em vez de "corrigir" um dos lados.

0. Estado de implementação (resumo)
Parte	Estado
Gold: etl-silver-gold/macro_clp.py (arquivo novo) + 1 chamada no main.py	Implementado. Testado só com dados de exemplo; fluxo real na EC2 ainda não validado
API: GET /dashboard/macro-clp (rota, controller e model)	Implementada. [PENDENTE] empresa vinda do login (hoje vem da URL)
Front: macroClpAdapter.js + troca da fonte de dados (API, fixture ou mock)	Implementado. Testado com a fixture; teste visual e com API real pendentes
Regra de CLP fora da curva	Calculada no Gold; exibida pelo front. Mínimo de CLPs por setor [PENDENTE]
Definições oficiais (alerta, janela de online, faixas entre telas)	[PENDENTE]
1. Objetivo da tela

Dar ao gestor da operação do cliente (persona: Rogério Andrade) uma visão macro da saúde dos CLPs da sua planta, para que ele responda em poucos segundos:

A minha fábrica está bem?
Os CLPs estão operando (online)?
Onde está o problema (qual setor, qual CLP)?

A tela não faz diagnóstico técnico. Quando o usuário encontra o problema, ele segue para a tela Micro CLP (clique na linha do ranking ou no link de detalhes). Evolução no tempo, alertas por componente e predição ficam na tela Micro.

Público: pessoa da indústria, nem sempre técnica. Os textos precisam explicar se o número é bom ou ruim.

2. Contexto do projeto e stack
Projeto: MIND, plataforma de observabilidade de CLPs industriais.
Dados: Bronze (coleta local) → Silver (tratamento, calcula health_score) → Gold (agregações para as telas). Tudo em um bucket S3 com os prefixos bronze/, silver/ e gold/.
Gold e Silver rodam na EC2 (Python); banco MySQL na EC2 (mind).
API: Node.js + Express (MVC). Front: HTML + CSS + JavaScript puro, gráficos com Chart.js.
Fonte: Poppins.
Quem desenvolve é iniciante/intermediário: o código deve ser simples e legível.
3. Arquivos
Arquivo	Função
etl-silver-gold/macro_clp.py	Novo. Gera o JSON da Macro CLP por empresa
etl-silver-gold/main.py	Gold existente. Só ganhou import macro_clp e a chamada macro_clp.client_macro_analysis(json_clp, s3)
routes/macroClpRoute.js, controllers/macroClpController.js, models/macroClpModel.js	API da Macro CLP (o model usa config/s3 e BUCKET_NAME)
app.js	Registra app.use("/dashboard", macroClp) e serve public/ (express.static)
public/dashboard/dashboard-macro-CLP.html	Página da tela
public/css/dashboard-macro-CLP.css	Estilo da tela
public/js/dashboard-macro-CLP.js	Renderização, gráficos, filtros e busca de dados
public/js/macroClpAdapter.js	Novo. Converte o JSON do Gold para o formato que a tela consome
public/macro-clp-exemplo.json	Fixture (dados de exemplo no formato do Gold). Apagar antes da entrega
public/js/mockDashboardData.js	Dados de exemplo antigos; fallback na fase de transição
css/reset.css, css/aside.css, js/sidebar.js, js/sessao.js, js/configuracoes.js	Compartilhados. Não alterar para esta tela

Pastas e nomes: [VERIFICAR] contra o repositório (os caminhos acima vêm de relatórios).

4. Regras para o agente

Escopo (inegociável)

Bronze e Silver: não alterar. Silver é padronizado para o projeto inteiro.
Gold: somente acrescentar. Não apagar, renomear nem alterar o comportamento de nada que já existe. O código novo fica em macro_clp.py; o main.py só tem a linha de chamada. Saídas novas só em gold/id-empresa-{id}/clp-macro/.
Gold só lê o Silver e o MySQL. Não escrever no MySQL, não criar tabelas nem colunas.
Se uma necessidade da tela não puder ser atendida sem mexer em outra camada, registrar como bloqueio e perguntar.

Estilo de código

Manter o código simples. Preferir for e if claros a cadeias de map/filter/reduce.
Não criar plugins novos do Chart.js sem pedir e não remover os existentes (pluginFundoFaixas, pluginRotulosSetores).
Cores do JS em hexadecimal (sem ler variáveis do CSS pelo JS).
Comentários curtos em português nos pontos não óbvios.
Reaproveitar as classes existentes (inclusive a grafia conteiner). Não alterar CSS sem pedir.
Sem bibliotecas novas sem aprovação.

Fluxo de trabalho

Antes de alterar, ler este arquivo e os arquivos da tela. Usar modo plan e mostrar o plano antes de editar.
Mudanças pequenas e explicadas: dizer o que mudou e em qual arquivo.
Não inventar números nem regras de negócio. Se faltar informação, perguntar.
A API devolve o JSON do Gold sem reformatar; quem converte é o adaptador do front.
Não usar localStorage/sessionStorage nesta tela.
Nunca escrever senhas, chaves ou tokens em arquivos, commits ou respostas.
5. Layout geral

Ordem vertical dentro do <main> (display: flex; flex-direction: column; gap: 1.25rem; padding: 1.5rem 2rem):

Cabeçalho (header.header-main)
Linha de KPIs (section.kpi-conteiner): grid de 4 colunas iguais, gap: 1rem
Linha de gráficos (section.graph-conteiner): grid de 2 colunas (1.7fr / 1fr)
esquerda: 5 setores com pior health médio
direita: Situação da frota
Ranking (section.table-conteiner): card de largura total

Cards (todos iguais): fundo #0D1527, borda 1px solid #1E2B45, borda superior de 2px em #06B6D4, raio 0.65rem, padding 1.1rem 1.25rem.

Uso	Cor
Fundo da página	#060A13
Fundo dos cards	#0D1527
Borda	#1E2B45
Destaque	#06B6D4
Texto principal	#FFFFFF
Texto secundário	#94A3B8
Estável	#22C55E
Atenção	#F59E0B
Crítico	#EF4444
Offline	#64748B
6. Cabeçalho e filtros
Esquerda: título "Visão macro da planta" (#page-title) e abaixo a última atualização (#last-update).
Com dados da API: usa o geradoEm do JSON ("Última atualização em dd/mm/aaaa, hh:mm"). Se o dado tiver mais de 60 minutos, acrescenta o aviso "dado possivelmente desatualizado (N min)".
Com ?fixture=1 ou com o fallback para mock: mostra "dados de exemplo" (sem aviso de dado velho).
Direita (.filter-container):
Botão Atualizar (#btn-etl): recarrega o JSON da API. Não dispara o ETL: o dado só muda quando o Gold roda de novo.
Select Setor (#sector-filter).
Select Período (#period-filter): Agora (agora), Últimos 7 dias (7-dias), Últimos 30 dias (30-dias). Os valores são os mesmos que a API e o Gold usam. Não existe "24 horas" (o Gold não gera essa janela).
O filtro de setor afeta apenas o ranking. KPIs, situação da frota e gráfico de setores continuam globais, porque o Gold não gera dados por setor.
Rótulos <label> só para leitores de tela (.filter-text).
7. KPIs

Quatro cards (.kpi-box), renderizados pelo JS (#kpi-container) a partir do formato adaptado.

#	Título	Valor	Fonte no JSON do Gold
1	Setor mais preocupante	nome do setor + selo de status	setores (o primeiro, já do pior para o melhor, ignorando "Sem setor")
2	Health geral da planta	healthGeral /100 + selo	kpis.healthGeral, kpis.healthGeralStatus
3	Disponibilidade	percentual arredondado	kpis.disponibilidadePct, kpis.clpsOnline, kpis.clpsTotal
4	CLPs críticos	quantidade	kpis.clpsCriticos

Regras:

Cor do número e do selo pela faixa de status (seção 11). Os limites vêm de faixas do JSON (fallback 40/60 se faltar).
Health geral = média do health dos CLPs que têm health no período (online ou não). Quantos entraram: kpis.clpsNaMedia. O texto do card deve dizer "CLPs com dados no período" (não "CLPs online").
Disponibilidade = CLPs online agora ÷ total de CLPs ativos. Não é uptime: é a proporção de CLPs com dados recentes.
CLPs críticos conta só CLPs online em Crítico. Um CLP crítico que ficou offline aparece no ranking, mas não neste KPI.
Selos: .status-pill com .is-danger, .is-warning ou .is-positive.
Textos explicativos (ex.: "Risco de microparada ou parada da linha.") são da interface, ficam no front.
8. Gráfico "5 setores com pior health médio"

Card à esquerda (.graph-box-lines).

Título e subtítulo (#sectors-title, #sectors-subtitle): "Média de health dos CLPs de cada setor, de 0 a 100". [VERIFICAR] o texto atual: a média inclui CLPs offline com health no período e exclui os fora da curva.
À direita do título: "de N setores" (#setores-total), onde N = quantidade de setores válidos (sem "Sem setor").
Gráfico (<canvas id="bar-chart">, altura 10.5rem): Chart.js, indexAxis: 'y', eixo de 0 a 100, 5 piores setores do pior (em cima) para o melhor.
Cor da barra pela faixa de status. Fundo da barra dividido nas faixas (pluginFundoFaixas) e rótulo à direita com valor e online/total online (pluginRotulosSetores). Os limites das faixas são dinâmicos (vêm de faixas).
Legenda das faixas (#zone-legend): textos montados a partir de faixas ("Crítico (abaixo de X)", "Atenção (X a Y)", "Bom (Y ou mais)").
Aviso de fora da curva (#outlier-info, texto laranja): cita todos os setores do gráfico que tenham CLP fora da curva, na ordem do gráfico.
1 setor: "Há CLP fora da curva em X."
2 setores: "Há CLP fora da curva em X e Y."
3 ou mais: "Há CLP fora da curva em X, Y e mais N."
nenhum: sem aviso.
Rodapé (.box-footer):
Texto #setores-footer (só o texto é ocultado, via hidden), 3 casos:
não há setores além dos 5 exibidos: não aparece;
há outros, mas nenhum com health: "Os outros N setores ainda não têm health";
há outros com health: "Os outros N setores estão com health médio ≥ X".
Link #setores-link ("Ver detalhes dos fora da curva →"): só aparece quando há fora da curva.
Sem filtros próprios no card (a "Métrica" e o "Mostrar" foram retirados). [PENDENTE] se voltam.

Propósito: mostrar o comportamento típico do setor e explicar por que o health caiu, apontando o CLP fora da curva. Depois o usuário segue para o Micro CLP.

9. Gráfico "Situação da frota"

Card à direita (.graph-box-pizza).

Subtítulo (#frota-resumo): percentual de CLPs estáveis (calculado), com texto de apoio quando frota.semHealth > 0 (ex.: "1 sem health no período").
Rosca (<canvas id="pizza">, cutout: '64%') com 4 fatias: Estável, Atenção, Crítico, Offline.
Centro em HTML (.pizza-center): total de CLPs (#frota-total) = kpis.clpsTotal (não a soma das fatias, porque semHealth fica fora do donut).
Legenda ao lado (#fleet-legend), com limites vindos de faixas:
Estável: "health de Y ou mais"; Atenção: "health de X a Y-1"; Crítico: "health abaixo de X"; Offline: "sem comunicação".
Offline é um estado, não uma faixa: cada CLP cai em uma categoria da frota. Um CLP offline agora entra na fatia "Offline", mesmo que tenha health no período (ele só entra nas médias e no ranking).
10. Ranking de CLPs

Card de largura total (.metrics-box). Tabela gerada pelo JS (renderRanking) em #ranking-head e #ranking-body.

Coluna	Conteúdo (campo no Gold)
Apelido	apelido (nome cadastrado do CLP)
Setor	setor (nome da localização)
Modelo	modelo
Health médio	health + barra de progresso (com valor numérico seguro)
Status	status (Crítico/Atenção/Estável); se online for falso, o texto ganha "· offline" (ex.: "Crítico · offline"), mantendo a cor da faixa
Alertas	alertas
Componente mais problemático	componenteMaisProblematico

Regras:

Do menor para o maior health. Entram CLPs com health no período, online ou offline. CLP sem health não aparece.
Linha clicável (.ranking-row, tabindex="0") que abre a tela Micro CLP. [PENDENTE] URL e parâmetro de navegação.
O filtro de setor (slug do setor) filtra só esta tabela.
[PENDENTE] paginação, rolagem interna ou busca (podem existir mais de 1000 CLPs). O Gold hoje manda todos.
[PENDENTE] clicar no KPI "CLPs críticos" filtrar o ranking?
11. Regras de negócio

Faixas de Health Score

Macro CLP usa Crítico < 40, Atenção 40 a 59, Estável ≥ 60, as mesmas do restante do Gold (micro_analysis_plc, model_analysis, model_critical). O Gold escreve as faixas no JSON (faixas) e o front lê de lá.
[PENDENTE] alinhamento entre telas: a documentação da tela Macro Modelo cita 50/75, mas o código do Gold usa 40/60. O banco tem o parâmetro HEALTH por CLP (60 nos dados de exemplo).

Health do CLP no período (mesma regra do Micro CLP)

Período agora: última leitura da janela. 7-dias e 30-dias: média do período.
health_score vazio = sem health (nunca 0). O CLP fica fora das médias e conta em frota.semHealth.

CLP online / offline

Online = o Silver recebeu arquivo desse CLP há menos de ONLINE_WINDOW_MIN minutos (padrão 30, lido do .env na hora da execução). É a última escrita do arquivo (LastModified), não o horário da leitura: use pelo menos o dobro do intervalo do Bronze→Silver. [PENDENTE] validar o valor contra o agendamento (cron) real.
Total de CLPs = CLPs ativos (clp.status = 1) da empresa, vindos do MySQL. CLP inativo não conta.
Offline com dados no período (ex.: quebrou ontem): conta como offline na frota e na disponibilidade, mas entra na média do setor, no health geral, no ranking (online: false) e na regra de fora da curva, para um CLP quebrado não fazer o setor parecer melhor.
Offline sem nenhum dado no período: só aparece como offline na frota.

Setor

Setor = localizacao.nome (ligado por clp.localizacaoId). CLP sem localização cai no grupo "Sem setor", que o front ignora em todas as contas do gráfico de setores (total, top 5, menor health dos demais, aviso de fora da curva). empresa.setor (ramo da empresa) não é o setor da fábrica.
Os nomes de localização podem ser longos ("Planta Industrial - Linha de Produção 01"). [PENDENTE] padronizar nomes curtos no cadastro.

Alertas (definição proposta, [PENDENTE] oficial)

Alerta = leitura com valor ≥ limite cadastrado (clp_medicao.parametro) do componente, com o mesmo >= do restante do Gold. Componentes: CPU, RAM, Scan Time, Swap, Rede (latência).
alertas = total de leituras acima do limite no período. componenteMaisProblematico = componente com mais leituras acima do limite.

Média por setor e CLP fora da curva (calculado no Gold)

A barra do setor é a média dos CLPs com health no período, desconsiderando os fora da curva.
Fora da curva só vale para baixo. É fora da curva o CLP em Crítico cujo restante do setor, sem ele, tem média em Atenção ou Estável (≥ limite de crítico). Se o setor inteiro está crítico, ninguém é fora da curva.
Só se aplica em setores com pelo menos MIN_CLPS_FORA_DA_CURVA CLPs com health (hoje 4). [PENDENTE] confirmar o valor.
O CLP fora da curva continua no ranking, nos CLPs críticos (se online) e na frota.
O Gold manda, por setor: foraDaCurva (lista com idClp, apelido, health) e mediaComForaDaCurva. Se o link "Ver detalhes" abrir uma tela, ela compara a média com e sem o CLP e leva ao Micro CLP. [PENDENTE] essa tela/ação.

Top 5

O gráfico mostra só os 5 piores setores. O Gold manda a lista completa de setores (do pior para o melhor); o front pega os 5 primeiros. [PENDENTE] tela/lista com todos os setores (sugestão: tabela com busca e ordenação).
12. Gold: macro_clp.py (gera os dados)

Entrada: o mesmo json_clp que o main.py já monta (arquivos do Silver na janela atual) + MySQL (CLPs ativos, setor, modelo) + listagem do Silver (para online/offline).

Janelas (calculadas por validation_filter() do Gold, não alterar):

agora: arquivos dos últimos 15 minutos (execução normal).
7-dias: só é gerada quando o Gold roda no domingo às 23:30 UTC.
30-dias: só é gerada quando o Gold roda no dia 28 às 01:30 UTC.
Consequência: fora desses horários só existe o período agora. Antes da primeira execução semanal ou mensal, a API responde 404 para 7-dias e 30-dias.

Saída (JSON, uma por empresa):

gold/id-empresa-{id}/clp-macro/{periodo}/{AAAA-MM-DD_HH-MM}.json (histórico)
gold/id-empresa-{id}/clp-macro/{periodo}/ultimo-resultado.json (o que a tela lê). Para agora não há subpasta.

Estrutura do JSON:

Campo	Conteúdo
empresaId, periodo, geradoEm	empresa, agora/7-dias/30-dias e data/hora com fuso
faixas	criticoAbaixoDe, estavelAPartirDe
kpis	healthGeral, healthGeralStatus, clpsOnline, clpsTotal, clpsNaMedia, disponibilidadePct, clpsCriticos, setorMaisPreocupante (nome, health, status)
frota	estavel, atencao, critico, offline, semHealth
setores[]	nome, health (média sem fora da curva), online, total, clpsNaMedia, mediaComForaDaCurva, foraDaCurva[]. Do pior para o melhor; inclui "Sem setor"
ranking[]	idClp, apelido, setor, modelo, health, status, alertas, componenteMaisProblematico, online, ultimaLeituraEm

Status em texto com acento: Crítico, Atenção, Estável.

Comportamentos e limitações conhecidas

Se não há arquivos do Silver na janela, o main() retorna antes e nenhum arquivo é gravado: o ultimo-resultado.json fica velho. O front usa geradoEm para avisar.
Um erro numa empresa é registrado no log ([Macro CLP] Erro na empresa X) e não derruba as outras análises nem o resto do Gold.
O Silver é lido mais uma vez por CLP (além do micro e do fornecedor): custo cresce com 7/30 dias.
A listagem do Silver é paginada e feita uma vez por execução. (O silver_read original não pagina: janelas longas podem vir incompletas. Isso é do Gold original e não deve ser alterado aqui.)
Alertas, janela de online e mínimo para fora da curva dependem das definições [PENDENTE] da seção 11.
13. API (Express)
Endpoint: GET /dashboard/macro-clp?idEmpresa=<número>&periodo=agora|7-dias|30-dias (padrão agora).
Resposta 200: o JSON do Gold, sem alterações. Caminho lido: gold/id-empresa-{id}/clp-macro/[{periodo}/]ultimo-resultado.json.
400: idEmpresa ou periodo inválidos (idEmpresa só aceita dígitos, porque entra no caminho do S3). 404: o Gold ainda não gerou o arquivo. 500: erro ao ler (permissão, rede...).
Estrutura MVC: rota → controller (valida e responde) → model (lê do S3 com o cliente de config/s3 e process.env.BUCKET_NAME).
O bucket em BUCKET_NAME precisa ser o mesmo onde o Gold grava. A credencial precisa de s3:GetObject em gold/* e, para o 404 funcionar, de s3:ListBucket (sem ela o S3 devolve AccessDenied em vez de NoSuchKey).
[PENDENTE] Segurança: hoje a empresa vem da URL. Deve vir do usuário logado (sessão no servidor), senão qualquer pessoa troca o número e vê outra empresa. Restringir o cors() ao endereço do site.
14. Front: adaptador, fluxo de dados e modos

macroClpAdapter.js (função pura, sem DOM nem fetch):

adaptGoldToDashboardData(goldJson, opts): converte o JSON do Gold para o formato consumido pela tela (seção 15). opts.now opcional, para testes.
buildSemDadosDashboardData(opts): objeto do estado "sem dados" (404).
Regras que aplica: faixas dinâmicas de faixas; "Sem setor" fora das contas de setor; mensagem de fora da curva e rodapé conforme a seção 8; "· offline" no status do ranking; clpsTotal no centro do donut; semHealth em texto de apoio; disponibilidade arredondada; texto de última atualização com geradoEm e aviso de dado velho (60 min).

Fluxo em dashboard-macro-CLP.js:

Lê o idEmpresa da sessão do front e o período do filtro.
fetch em MACRO_CLP_API_BASE (padrão /dashboard/macro-clp).
200 → adaptador → render. 404 → estado "sem dados". 500 ou rede → fallback para o mock com console.warn e o texto "dados de exemplo" na última atualização.
?fixture=1 → carrega /macro-clp-exemplo.json no lugar da API, mostra "dados de exemplo (fixture)" e não mostra aviso de dado velho.

O fallback para o mock existe só na fase de transição: ele esconderia uma falha da API mostrando números falsos. Remover antes da entrega.

Fixture public/macro-clp-exemplo.json (gerada com o código real do Gold) cobre: grupo "Sem setor", CLP offline com health no período, fora da curva em dois setores, semHealth > 0. Valores esperados do adaptador com ela: health geral 55,14 (Atenção); disponibilidade 91% (21 de 23); frota 9 / 10 / 1 / 2 (+1 sem health), centro 23; setores PINTURA 46, FUNDIÇÃO 48, USINAGEM 58,75, MONTAGEM 65, SOLDA 78,33 (5 setores válidos); aviso "FUNDIÇÃO e USINAGEM"; sem rodapé "Os outros..."; CLP-13 "Crítico · offline".

15. Contrato HTML ↔ JS
Elemento (id)	Usado para
page-title	título da tela
last-update	texto da última atualização
btn-etl	recarregar os dados
period-filter, sector-filter	filtros do topo
kpi-container	container dos 4 KPIs (JS)
sectors-title, sectors-subtitle, setores-total	textos do card de setores
bar-chart, zone-legend	canvas das barras e legenda das faixas
outlier-info	aviso de fora da curva
setores-footer, setores-link	rodapé (texto) e link do card de setores
pizza, frota-total, frota-resumo, frota-title, fleet-legend	donut, total, subtítulo, título e legenda
ranking-title, ranking-hint, ranking-head, ranking-body	ranking

Funções principais em dashboard-macro-CLP.js ([VERIFICAR] nomes e assinaturas atuais): initDashboardMacroCLP() (assíncrona), montarEstruturaEstatica, renderDashboard, renderKpis, renderGraficoSetores, renderGraficoFrota, renderRanking, atualizarCabecalho, e os handlers de filtro e de atualizar (assíncronos: recarregam os dados). Plugins do Chart.js: pluginFundoFaixas, pluginRotulosSetores.

Formato consumido pela tela (adaptado do Gold):

js
{
  header: { title, lastUpdatePrefix, lastUpdateText },
  filters: { sectors: [{ value, label }], periods: [{ value, label }] },
  kpis: [{ type, tone, title, ... }],
  sectorsChart: {
    title, subtitle, totalSectors, minOtherHealth, linkLabel,
    items: [{ name, health, online, total }],
    outlier: { enabled, message, detailsLinkLabel },
    footer: { visible, text },
    legend: [{ label, tone }]
  },
  fleet: { title, summaryPrefix, totalClps, values: { estavel, atencao, critico, offline }, legend: [...] },
  ranking: { title, hint, columns: [...], rows: [{ nickname, sectorLabel, model, health, status, statusTone, alerts, component, sector }] }
}

Mapeamento resumido Gold → tela: kpis.* → cards; frota.* → fleet.values/totalClps; setores[] → sectorsChart.items (top 5 sem "Sem setor"), totalSectors, minOtherHealth, outlier, footer; ranking[] → ranking.rows (apelido→nickname, setor→sectorLabel, modelo→model, alertas→alerts, componenteMaisProblematico→component; sector = slug do setor).

16. Estados e comportamentos
Carregando: [PENDENTE].
Sem dados (404): estado "sem dados" montado por buildSemDadosDashboardData.
Erro da API (500/rede): hoje cai no mock com aviso "dados de exemplo" (só transição). [PENDENTE] mensagem de erro definitiva por card.
Dado velho: aviso na última atualização quando passar de 60 minutos.
Hover nas linhas do ranking e tooltip padrão do Chart.js nos gráficos.
Foco por teclado visível (:focus-visible) em botão, selects, links e linhas do ranking.
17. Responsividade
Até 1100px: KPIs em 2 colunas; gráficos em 1 coluna.
Até 640px: KPIs em 1 coluna; cabeçalho em coluna; filtros em grade de 2 colunas com o botão Atualizar na linha toda; a tabela rola na horizontal.
Em telas pequenas, os rótulos à direita das barras podem ficar apertados. [PENDENTE] testar.
18. Acessibilidade
Os dois <canvas> têm role="img" e aria-label.
Cor nunca é a única informação: sempre há texto (selo, legenda, número, "· offline").
Contraste: texto claro sobre fundo escuro; #94A3B8 só para texto secundário.
Tabela com <th scope="col">.
19. Fora do escopo desta tela
Evolução do health no tempo, alertas por componente, predição e indicadores do modelo: tela Micro CLP.
Comparação de modelos: telas do fornecedor.
Sidebar, login e configurações do usuário.
20. Pendências e divergências

Decisões em aberto

Definição oficial de alerta (hoje: leitura ≥ limite).
Janela de online (ONLINE_WINDOW_MIN, hoje 30) conferida com o agendamento do Bronze→Silver.
Mínimo de CLPs com health por setor para a regra de fora da curva (hoje 4).
Faixas oficiais entre telas (40/60 do Gold × 50/75 citadas na tela Macro Modelo × parâmetro HEALTH do banco).
Empresa vinda do login (não da URL) e CORS restrito.
Nomes curtos de localização no cadastro (e vários CLPs por localização nos dados de demonstração).
Navegação para o Micro CLP; tela "ver todos os setores"; paginação/busca do ranking; filtro de "CLPs críticos".
Estados de carregamento e de erro definitivos.
Se os filtros "Métrica" e "Mostrar" voltam ao card de setores.

Divergências conhecidas (registradas, não corrigidas)

A janela 7-dias só é gerada aos domingos 23:30 UTC e a 30-dias no dia 28 às 01:30 UTC (validation_filter); fora disso a API responde 404 para esses períodos.
Sem arquivos do Silver na janela, o Gold não grava nada e o ultimo-resultado.json fica velho.
O silver_read original não pagina o S3 (limite de 1000 arquivos): janelas longas podem ficar incompletas.
A coleta (script_escrita_mind.py) parece inserir clp.localizacao, mas o esquema do banco usa localizacaoId: [VERIFICAR] SHOW COLUMNS FROM clp; na EC2.
O fluxo completo Bronze → Silver → Gold com dados reais ainda não foi validado na EC2.
A fixture e o fallback para o mock são temporários: remover antes da entrega.
21. Como refinar este documento

Quando uma decisão for tomada, mover o item de [PENDENTE] para a seção correspondente e remover a marca. Manter este arquivo igual ao que está no código; ao descobrir uma divergência, registrá-la na seção 20.