// ===== DASHBOARD LÍDIA — PAINEL DE PÓS-VENDA =====
// Os dados vêm do back-end: /jira/fornecedor/chamados/:idEmpresa devolve
// os chamados do Jira de cada cliente ativo, a quantidade de CLPs ativos
// de cada cliente (jiraConfigModel.contarClpsPorEmpresa) e os chamados do
// Jira do próprio fornecedor (escalonamentos da equipe).

// ======================================
// CARREGAMENTO
// ======================================

// Resposta bruta do back-end
let respostaJira = { clientes: [], fornecedor: null };

// Período selecionado no filtro da tela (7, 30 ou 90 dias)
let periodoAtual = 30;

// Busca no back-end os chamados do Jira de todos os clientes do fornecedor
// e também os do Jira do próprio fornecedor. Os tokens ficam no back-end.
async function obterDadosJiraFornecedor() {
    let id_empresa = sessionStorage.getItem("ID_EMPRESA");

    if (!id_empresa) {
        console.error("ID_EMPRESA não encontrado na sessão.");
        return;
    }

    try {
        const resposta = await fetch(`/jira/fornecedor/chamados/${id_empresa}`);

        if (!resposta.ok) {
            throw new Error(`O servidor respondeu com status ${resposta.status}`);
        }

        respostaJira = await resposta.json();
        console.log("Dados do Jira do fornecedor e clientes:", respostaJira);
    } catch (erro) {
        console.error("Erro ao obter dados do Jira:", erro);
        respostaJira = { clientes: [], fornecedor: null };
    }

    plotarTudo();
}

// Reprocessa as métricas e repinta a tela (carregamento e troca de período)
function plotarTudo() {
    periodoAtual = Number(document.getElementById("period-filter").value);
    processarClientes();
    plotarKpis();
    plotarResumo();
    renderizarTabela();
}


// ======================================
// PROCESSAMENTO POR PERÍODO
// ======================================

// clientes já processados com as métricas do período atual
let clientes = [];

// índice dos clientes por id (usado na expansão da linha)
const clientesPorId = {};

// Um chamado é considerado concluído quando o Jira registra a data de
// conclusão (resolutiondate), definida ao entrar em status Done
// ("Concluído" e correlatos).
function estaConcluido(chamado) {
    return chamado.resolvidoEm != null;
}

// O chamado foi criado dentro do período selecionado?
function dentroDoPeriodo(dataIso, dias) {
    if (!dataIso) {
        return false;
    }

    return new Date(dataIso).getTime() >= Date.now() - dias * 24 * 60 * 60 * 1000;
}

// Tempo médio de resposta (em minutos) dos chamados concluídos:
// data de conclusão - data de criação, dividido pelo número de chamados
function mediaTempoResposta(chamados) {
    let somaMilissegundos = 0;
    let concluidos = 0;

    for (const chamado of chamados) {
        if (!estaConcluido(chamado)) {
            continue;
        }

        somaMilissegundos += new Date(chamado.resolvidoEm) - new Date(chamado.criadoEm);
        concluidos++;
    }

    return concluidos > 0 ? somaMilissegundos / concluidos / 60000 : null;
}

// Tipo de chamado mais frequente, no formato do protótipo — "Incidente ×3"
function tipoMaisFrequente(chamados) {
    const contagem = {};

    for (const chamado of chamados) {
        if (!chamado.tipo) {
            continue;
        }

        contagem[chamado.tipo] = (contagem[chamado.tipo] || 0) + 1;
    }

    let maisFrequente = null;
    let maior = 0;

    for (const tipo in contagem) {
        if (contagem[tipo] > maior) {
            maisFrequente = tipo;
            maior = contagem[tipo];
        }
    }

    return maisFrequente ? `${maisFrequente} ×${maior}` : "—";
}

// Transforma a resposta do back-end em clientes com as métricas do período
function processarClientes() {
    clientes = [];
    for (const id in clientesPorId) {
        delete clientesPorId[id];
    }

    for (const dados of respostaJira.clientes || []) {
        const chamadosPeriodo = (dados.chamados || []).filter(chamado => dentroDoPeriodo(chamado.criadoEm, periodoAtual));
        const alertas = chamadosPeriodo.length;
        const concluidos = chamadosPeriodo.filter(estaConcluido).length;
        const totalClps = Number(dados.totalClps) || 0;

        const cliente = {
            idCliente: dados.idCliente,
            empresa: dados.cliente,
            erro: !!dados.erro,
            chamados: dados.chamados || [],
            totalClps: totalClps,
            alertas: alertas,
            concluidos: concluidos,
            // Alertas por CLP: alertas do período / CLPs ativos do cliente
            alertasPorClp: totalClps > 0 ? alertas / totalClps : 0,
            resolveSozinho: alertas > 0 ? Math.round(concluidos / alertas * 100) : null,
            tempoResposta: mediaTempoResposta(chamadosPeriodo),
            problemaRecorrente: tipoMaisFrequente(chamadosPeriodo)
        };

        clientes.push(cliente);
        clientesPorId[cliente.idCliente] = cliente;
    }
}

// Chamados do Jira do próprio fornecedor (equipe)
function chamadosDoFornecedor() {
    return (respostaJira.fornecedor && respostaJira.fornecedor.chamados) || [];
}


// ======================================
// FUNÇÕES DE APOIO
// ======================================

// Evita que textos vindos do Jira quebrem a tela
function escapar(texto) {
    const div = document.createElement("div");
    div.innerText = texto == null ? "" : texto;
    return div.innerHTML;
}

// 3 -> "3,0"
function formatarDecimal(valor) {
    return valor.toFixed(1).replace(".", ",");
}

// minutos -> "1h40"
function formatarTempo(minutos) {
    const horas = Math.floor(minutos / 60);
    const resto = Math.round(minutos % 60);
    return `${horas}h${String(resto).padStart(2, "0")}`;
}

// estado da tabela
const LIMITE_LISTA = 5; // "Mostrando 5 de 18 clientes"
let verTodos = false;
let buscaAtual = "";

// gráficos abertos no momento (só um detalhe fica aberto por vez)
let graficoLinha = null;
let graficoRosca = null;

function destruirGraficos() {
    if (graficoLinha) {
        graficoLinha.destroy();
        graficoLinha = null;
    }

    if (graficoRosca) {
        graficoRosca.destroy();
        graficoRosca = null;
    }
}


// ======================================
// KPIS
// ======================================

function plotarKpis() {
    // Cliente mais urgente: maior "alertas por CLP" do período
    let quemLigar = null;

    for (const cliente of clientes) {
        if (cliente.erro) {
            continue;
        }

        if (!quemLigar || cliente.alertasPorClp > quemLigar.alertasPorClp) {
            quemLigar = cliente;
        }
    }

    const detalheEmpresa = document.getElementById("kpi-empresa-detalhe");

    if (!quemLigar || quemLigar.alertas === 0) {
        document.getElementById("kpi-empresa").textContent = "—";
        detalheEmpresa.textContent = "Nenhum alerta no período";
        detalheEmpresa.className = "kpi-details";
    } else {
        document.getElementById("kpi-empresa").textContent = quemLigar.empresa;
        detalheEmpresa.textContent =
            `${formatarDecimal(quemLigar.alertasPorClp)} alertas por CLP · ${quemLigar.alertas} alerta(s) em ${quemLigar.totalClps} CLP(s)`;
        detalheEmpresa.className = "kpi-details";
    }

    // Resolvido pelo próprio cliente: concluídos * 100 / total de alertas recebidos
    let totalAlertas = 0;
    let totalConcluidos = 0;

    for (const cliente of clientes) {
        totalAlertas += cliente.alertas;
        totalConcluidos += cliente.concluidos;
    }

    document.getElementById("kpi-resolvido").textContent =
        totalAlertas > 0 ? Math.round(totalConcluidos / totalAlertas * 100) + "%" : "0%";

    const detalheResolvido = document.getElementById("kpi-resolvido-detalhe");

    detalheResolvido.textContent = totalAlertas > 0
        ? `${totalConcluidos} de ${totalAlertas} alertas concluídos`
        : "Nenhum alerta no período";
    detalheResolvido.className = "kpi-details";

    // Escalonados abertos para a equipe: chamados do Jira do próprio fornecedor
    // que não estão concluídos (todos, independente do período selecionado)
    const abertos = chamadosDoFornecedor().filter(chamado => !estaConcluido(chamado));
    const tempoMedio = mediaTempoResposta(chamadosDoFornecedor());

    document.getElementById("kpi-escalonados").textContent =
        respostaJira.fornecedor ? abertos.length : "—";

    const detalheEscalonados = document.getElementById("kpi-escalonados-detalhe");

    if (!respostaJira.fornecedor) {
        detalheEscalonados.textContent = "Não foi possível consultar o Jira da equipe";
    } else if (tempoMedio != null) {
        detalheEscalonados.textContent = `Tempo médio de resposta: ${formatarTempo(tempoMedio)}`;
    } else {
        detalheEscalonados.textContent = "Sem chamados concluídos para calcular o tempo médio";
    }
    detalheEscalonados.className = "kpi-details";
}


// ======================================
// RESUMO DOS ALERTAS ENVIADOS (barra empilhada)
// ======================================

function plotarResumo() {
    let alertasClientes = 0;
    let resolvidosCliente = 0;

    for (const cliente of clientes) {
        alertasClientes += cliente.alertas;
        resolvidosCliente += cliente.concluidos;
    }

    // Escalonamentos criados dentro do período selecionado
    const escalonados = chamadosDoFornecedor().filter(chamado => dentroDoPeriodo(chamado.criadoEm, periodoAtual));
    const escalonadosResolvidos = escalonados.filter(estaConcluido).length;

    const totalAlertas = alertasClientes + escalonados.length;

    document.getElementById("resumo-titulo").textContent =
        `O que aconteceu com os ${totalAlertas} alertas enviados`;

    const cores = {
        positive: "var(--color-positive)",
        info: "var(--color-info)",
        amarelo: "var(--color-amarelo-claro)"
    };

    const partes = [
        { cor: "positive", legenda: "Resolvidos pelo cliente", valor: resolvidosCliente },
        { cor: "info", legenda: "Em andamento com o cliente", valor: alertasClientes - resolvidosCliente },
        { cor: "amarelo", legenda: "Escalonados", valor: escalonados.length, detalhe: `(${escalonadosResolvidos} resolvidos)` }
    ];

    const barra = document.getElementById("resumo_barra");
    const legenda = document.getElementById("resumo_legenda");

    barra.innerHTML = "";
    legenda.innerHTML = "";

    for (const parte of partes) {
        const largura = totalAlertas > 0 ? (parte.valor / totalAlertas * 100).toFixed(1) : 0;

        barra.innerHTML += `<div class="resumo-segmento" style="width: ${largura}%; background-color: ${cores[parte.cor]}"></div>`;

        legenda.innerHTML += `<div class="resumo-legenda-item" style="width: ${largura}%">
            ${parte.legenda} <b>${parte.valor}</b>${parte.detalhe ? " " + parte.detalhe : ""}
        </div>`;
    }
}


// ======================================
// TABELA DE CLIENTES (busca, ordenar, ver todos)
// ======================================

// clientes sem valor (erro ou sem chamados concluídos) vão para o fim da lista
function valorOrdenacao(cliente, campo) {
    return cliente[campo] == null ? -1 : cliente[campo];
}

function clientesFiltradas() {
    let lista = clientes.slice();

    // busca por nome da empresa
    if (buscaAtual !== "") {
        const termo = buscaAtual.toLowerCase();
        lista = lista.filter(cliente => cliente.empresa.toLowerCase().includes(termo));
    }

    // ordenação escolhida no select
    const ordenacao = document.getElementById("ordenar-por").value;

    if (ordenacao === "empresa") {
        lista.sort((a, b) => a.empresa.localeCompare(b.empresa, "pt-BR"));
    } else if (ordenacao === "resolve") {
        // mais resolvidos sozinhos primeiro
        lista.sort((a, b) => valorOrdenacao(b, "resolveSozinho") - valorOrdenacao(a, "resolveSozinho"));
    } else if (ordenacao === "tempo") {
        // tempo de resposta mais demorado primeiro
        lista.sort((a, b) => valorOrdenacao(b, "tempoResposta") - valorOrdenacao(a, "tempoResposta"));
    } else {
        // padrão: alertas por CLP, do maior para o menor
        lista.sort((a, b) => b.alertasPorClp - a.alertasPorClp);
    }

    return lista;
}

function montarLinhaCliente(cliente) {
    const alertasTexto = cliente.erro ? "—" : formatarDecimal(cliente.alertasPorClp);
    const resolveTexto = !cliente.erro && cliente.resolveSozinho != null ? `${cliente.resolveSozinho}%` : "—";
    const tempoTexto = !cliente.erro && cliente.tempoResposta != null ? formatarTempo(cliente.tempoResposta) : "—";

    const problema = cliente.problemaRecorrente === "—"
        ? `<span class="sem-problema">—</span>`
        : escapar(cliente.problemaRecorrente);

    return `<tr class="linha-cliente" data-id="${cliente.idCliente}">
        <td><span class="nome-empresa">${escapar(cliente.empresa)}</span></td>
        <td><span class="valor-destaque">${alertasTexto}</span></td>
        <td>${resolveTexto}</td>
        <td>${tempoTexto}</td>
        <td>${problema}</td>
        <td class="celula-acoes">
            <button type="button" class="btn-expandir" title="Ver detalhes" aria-label="Ver detalhes">
                <i class="bi bi-chevron-right"></i>
            </button>
        </td>
    </tr>
    <tr class="linha-detalhe" data-para="${cliente.idCliente}"></tr>`;
}

function renderizarTabela() {
    const tbody = document.getElementById("clientes_body");
    const lista = clientesFiltradas();
    const visiveis = verTodos ? lista : lista.slice(0, LIMITE_LISTA);

    // as linhas de detalhe serão recriadas, então os gráficos abertos morrem aqui
    destruirGraficos();

    tbody.innerHTML = "";

    if (visiveis.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="tabela-vazia">Nenhum cliente encontrado</td></tr>`;
    } else {
        for (const cliente of visiveis) {
            tbody.innerHTML += montarLinhaCliente(cliente);
        }
    }

    document.getElementById("contador-clientes").textContent =
        `Mostrando ${visiveis.length} de ${lista.length} clientes`;

    // "Ver todos" só faz sentido quando a lista passa do limite
    const btnVerTodos = document.getElementById("btn-ver-todos");
    btnVerTodos.textContent = verTodos ? "Mostrar menos" : "Ver todos";
    btnVerTodos.style.display = lista.length > LIMITE_LISTA ? "" : "none";
}


// ======================================
// EXPANSÃO DA LINHA (detalhe da empresa)
// ======================================

// abre/fecha o detalhe de uma linha (mesma mecânica da classe "ativo" do modal)
function alternarDetalhe(linha) {
    const detalhe = linha.nextElementSibling;
    const jaEstavaAberta = detalhe.classList.contains("ativa");

    // uma empresa expandida por vez
    fecharDetalheAberto();

    if (!jaEstavaAberta) {
        detalhe.classList.add("ativa");
        linha.classList.add("linha-expandida");
        renderizarDetalhe(clientesPorId[linha.dataset.id], 30);
    }
}

function fecharDetalheAberto() {
    const aberto = document.querySelector(".linha-detalhe.ativa");

    if (aberto) {
        aberto.classList.remove("ativa");
        aberto.previousElementSibling.classList.remove("linha-expandida");
    }

    destruirGraficos();
}

function renderizarDetalhe(cliente, dias) {
    const detalhe = document.querySelector(`.linha-detalhe[data-para="${cliente.idCliente}"]`);

    detalhe.innerHTML = `<td colspan="6">
        <div class="detalhe-panel">
            <div class="detalhe-header">
                <p class="detalhe-titulo">${escapar(cliente.empresa)} · detalhe</p>
               <!-- <div class="detalhe-periodo">
                     <label class="filter-text" for="periodo-detalhe">Período</label> -->
                    <select id="periodo-detalhe" class="select-tabela select-periodo-detalhe">
                        <option value="7">Últimos 7 dias</option>
                        <option value="30" selected>Últimos 30 dias</option>
                        <option value="90">Últimos 90 dias</option>
                    </select>
                </div>
            </div>

            <div class="detalhe-graficos">
                <div class="detalhe-box">
                    <p class="title-graph">Chamados por etapa</p>
                    <div class="chart-wrapper">
                        <canvas id="chart-etapa"></canvas>
                    </div>
                </div>

                <div class="detalhe-box">
                    <p class="title-graph">Situação dos chamados</p>
                    <div class="rosca-wrapper">
                        <div class="rosca-canvas">
                            <canvas id="chart-rosca"></canvas>
                            <div class="rosca-centro" id="rosca-centro"></div>
                        </div>
                        <ul class="rosca-legenda" id="rosca-legenda"></ul>
                    </div>
                </div>
            </div>
        </div>
    </td>`;

    graficoLinha = graficoChamadosPorEtapa(cliente, dias);
    graficoRosca = graficoSituacaoChamados(cliente, dias);
}


// ======================================
// GRÁFICO DE LINHA — Chamados por etapa
// ======================================

// Em qual status o chamado estava no fim do dia informado,
// reconstruindo pelo histórico de mudanças de status do Jira
function statusDoChamadoNoDia(chamado, fimDoDia) {
    const historico = chamado.historico || [];

    let status = historico.length
        ? (historico[0].de || historico[0].para)
        : chamado.status;

    for (const item of historico) {
        if (new Date(item.data).getTime() <= fimDoDia) {
            status = item.para;
        }
    }

    return status || "Sem status";
}

function graficoChamadosPorEtapa(cliente, dias) {
    const rotulos = [];
    const fimDosDias = [];
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    for (let i = dias - 1; i >= 0; i--) {
        const dia = new Date(hoje);
        dia.setDate(dia.getDate() - i);
        fimDosDias.push(dia.getTime());
        rotulos.push(dia.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
    }

    const chamadosPeriodo = cliente.chamados.filter(chamado => dentroDoPeriodo(chamado.criadoEm, dias));

    // quantos chamados estavam em cada status em cada dia
    const porStatus = {};

    for (const chamado of chamadosPeriodo) {
        for (let i = 0; i < fimDosDias.length; i++) {
            // o chamado ainda não existia neste dia
            if (new Date(chamado.criadoEm).getTime() > fimDosDias[i]) {
                continue;
            }

            const status = statusDoChamadoNoDia(chamado, fimDosDias[i]);

            if (!porStatus[status]) {
                porStatus[status] = new Array(fimDosDias.length).fill(0);
            }

            porStatus[status][i]++;
        }
    }

    // no máximo 4 status no gráfico: os que mais apareceram
    const totalPorStatus = {};

    for (const status in porStatus) {
        totalPorStatus[status] = porStatus[status].reduce((soma, valor) => soma + valor, 0);
    }

    const principais = Object.keys(totalPorStatus)
        .sort((a, b) => totalPorStatus[b] - totalPorStatus[a])
        .slice(0, 4);

    const cores = ["#60A5FA", "#22C55E", "#FBBF24", "#A78BFA"];

    const datasets = principais.map((status, indice) => ({
        label: status,
        data: porStatus[status],
        borderColor: cores[indice % cores.length],
        tension: 0,
        borderWidth: 2,
        pointRadius: 0
    }));

    const ctx = document.getElementById("chart-etapa");

    return new Chart(ctx, {
        type: "line",

        data: {
            labels: rotulos,
            datasets: datasets
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "top",
                    align: "start",
                    labels: {
                        color: "#94A3B8",
                        boxWidth: 26,
                        font: { family: "Montserrat", size: 11 }
                    }
                }
            },

            scales: {
                x: {
                    ticks: { color: "#94A3B8", maxTicksLimit: 10, font: { size: 10 } },
                    grid: { display: false },
                    border: { display: false },
                    title: { display: true, text: "dia", color: "#94A3B8", font: { size: 10 } }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: "#94A3B8", maxTicksLimit: 6, font: { size: 10 } },
                    grid: { color: "rgba(255, 255, 255, 0.08)" },
                    border: { display: false }
                }
            }
        }
    });
}


// ======================================
// GRÁFICO DE ROSCA — Situação dos chamados
// ======================================

function graficoSituacaoChamados(cliente, dias) {
    const chamadosPeriodo = cliente.chamados.filter(chamado => dentroDoPeriodo(chamado.criadoEm, dias));
    const total = chamadosPeriodo.length;
    const resolvidos = chamadosPeriodo.filter(estaConcluido).length;

    const situacao = [
        { legenda: "Resolvidos pelo cliente", valor: resolvidos, cor: "#22C55E" },
        { legenda: "Em aberto com o cliente", valor: total - resolvidos, cor: "#60A5FA" }
    ];

    // número de chamados no centro da rosca
    document.getElementById("rosca-centro").innerHTML =
        `<strong>${total}</strong><span>chamados</span>`;

    // legenda abaixo do gráfico
    document.getElementById("rosca-legenda").innerHTML = situacao.map(item =>
        `<li>
            <span class="rosca-legenda-dot" style="background-color: ${item.cor}"></span>
            ${item.legenda}
            <span class="rosca-legenda-count">${item.valor}</span>
        </li>`
    ).join("");

    const ctx = document.getElementById("chart-rosca");

    return new Chart(ctx, {
        type: "doughnut",

        data: {
            labels: situacao.map(item => item.legenda),
            datasets: [{
                data: situacao.map(item => item.valor),
                backgroundColor: situacao.map(item => item.cor),
                borderColor: "#0D1527",
                borderWidth: 2
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "62%",
            plugins: {
                legend: { display: false }
            }
        }
    });
}


// ======================================
// EVENTOS DA TELA
// ======================================

// troca o período do painel inteiro (KPIs, resumo e tabela)
document.getElementById("period-filter").addEventListener("change", plotarTudo);

// abre/fecha o detalhe ao clicar na linha
document.getElementById("clientes_body").addEventListener("click", (evento) => {
    const linha = evento.target.closest(".linha-cliente");

    if (linha) {
        alternarDetalhe(linha);
    }
});

// troca o período dentro do detalhe -> refaz os gráficos
document.getElementById("clientes_body").addEventListener("change", (evento) => {
    if (evento.target.classList.contains("select-periodo-detalhe")) {
        const detalhe = evento.target.closest(".linha-detalhe");
        const linha = detalhe.previousElementSibling;

        renderizarDetalhe(clientesPorId[linha.dataset.id], Number(evento.target.value));
    }
});

// busca por nome
document.getElementById("busca-empresa").addEventListener("input", (evento) => {
    buscaAtual = evento.target.value.trim();
    renderizarTabela();
});

// ordenação
document.getElementById("ordenar-por").addEventListener("change", renderizarTabela);

// ver todos / mostrar menos
document.getElementById("btn-ver-todos").addEventListener("click", () => {
    verTodos = !verTodos;
    renderizarTabela();
});
