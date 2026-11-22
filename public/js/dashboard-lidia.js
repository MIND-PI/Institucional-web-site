// ===== DASHBOARD LÍDIA — PAINEL DE PÓS-VENDA =====
// Página 100% front-end: todos os dados abaixo são de demonstração.
// Quando o back-end estiver pronto, trocar os mocks por fetch.

// ======================================
// DADOS DE DEMONSTRAÇÃO (MOCKS)
// ======================================

// tagAlta = tag "ALTA" exibida ao lado do nome (no futuro vem do banco de dados)
// comAlertas = se o cliente tem alertas no período (usado pelo filtro)
// variacaoAlertas: positivo = mais alertas que o período anterior (piora)
// variacaoResolve: positivo = resolve mais sozinho (melhora)
const clientesMock = [
    { idCliente: 1, empresa: "Mitsubishi Electric", comAlertas: true, alertasPorClp: 3.0, variacaoAlertas: 25, resolveSozinho: 31, variacaoResolve: -8, tempoResposta: "1h40", problemaRecorrente: "CPU ×4" },
    { idCliente: 2, empresa: "Schneider Electric", comAlertas: true, alertasPorClp: 2.6, variacaoAlertas: 12, resolveSozinho: 38, variacaoResolve: 4, tempoResposta: "1h10", problemaRecorrente: "RAM ×3" },
    { idCliente: 3, empresa: "Volkswagen do Brasil", comAlertas: false, alertasPorClp: 2.4, variacaoAlertas: 10, resolveSozinho: 45, variacaoResolve: 12, tempoResposta: "1h25", problemaRecorrente: "—" },
    { idCliente: 4, empresa: "Petrobras", comAlertas: true, alertasPorClp: 1.9, variacaoAlertas: -5, resolveSozinho: 52, variacaoResolve: 3, tempoResposta: "0h50", problemaRecorrente: "SWAP ×3" },
    { idCliente: 5, empresa: "Braskem", comAlertas: false, alertasPorClp: 1.2, variacaoAlertas: -16, resolveSozinho: 61, variacaoResolve: 9, tempoResposta: "0h45", problemaRecorrente: "—" },
    { idCliente: 6, empresa: "Ambev", comAlertas: true, alertasPorClp: 1.1, variacaoAlertas: -3, resolveSozinho: 58, variacaoResolve: 2, tempoResposta: "0h55", problemaRecorrente: "Rede ×2" },
    { idCliente: 7, empresa: "Vale", comAlertas: true, alertasPorClp: 1.0, variacaoAlertas: 6, resolveSozinho: 47, variacaoResolve: -4, tempoResposta: "1h15", problemaRecorrente: "CPU ×2" },
    { idCliente: 8, empresa: "Gerdau", comAlertas: false, alertasPorClp: 0.9, variacaoAlertas: -8, resolveSozinho: 64, variacaoResolve: 5, tempoResposta: "0h40", problemaRecorrente: "—" },
    { idCliente: 9, empresa: "Suzano", comAlertas: true, alertasPorClp: 0.9, variacaoAlertas: 2, resolveSozinho: 55, variacaoResolve: 0, tempoResposta: "1h05", problemaRecorrente: "RAM ×1" },
    { idCliente: 10, empresa: "Embraer", comAlertas: true, alertasPorClp: 0.8, variacaoAlertas: -12, resolveSozinho: 66, variacaoResolve: 6, tempoResposta: "0h35", problemaRecorrente: "Scan time ×2" },
    { idCliente: 11, empresa: "Natura", comAlertas: false, alertasPorClp: 0.7, variacaoAlertas: -4, resolveSozinho: 70, variacaoResolve: 8, tempoResposta: "0h30", problemaRecorrente: "—" },
    { idCliente: 12, empresa: "Randon", comAlertas: true, alertasPorClp: 0.7, variacaoAlertas: 3, resolveSozinho: 59, variacaoResolve: -2, tempoResposta: "0h58", problemaRecorrente: "Swap ×1" },
    { idCliente: 13, empresa: "WEG", comAlertas: true, alertasPorClp: 0.6, variacaoAlertas: -6, resolveSozinho: 72, variacaoResolve: 4, tempoResposta: "0h28", problemaRecorrente: "Rede ×1" },
    { idCliente: 14, empresa: "Cremer", comAlertas: false, alertasPorClp: 0.6, variacaoAlertas: 0, resolveSozinho: 63, variacaoResolve: 0, tempoResposta: "0h48", problemaRecorrente: "—" },
    { idCliente: 15, empresa: "Dedini", comAlertas: true, alertasPorClp: 0.5, variacaoAlertas: 9, resolveSozinho: 51, variacaoResolve: -6, tempoResposta: "1h20", problemaRecorrente: "CPU ×1" },
    { idCliente: 16, empresa: "Romagnole", comAlertas: false, alertasPorClp: 0.4, variacaoAlertas: -2, resolveSozinho: 68, variacaoResolve: 1, tempoResposta: "0h38", problemaRecorrente: "—" },
    { idCliente: 17, empresa: "Tigre", comAlertas: true, alertasPorClp: 0.4, variacaoAlertas: 5, resolveSozinho: 74, variacaoResolve: 7, tempoResposta: "0h26", problemaRecorrente: "RAM ×1" },
    { idCliente: 18, empresa: "Duratex", comAlertas: false, alertasPorClp: 0.3, variacaoAlertas: -9, resolveSozinho: 76, variacaoResolve: 10, tempoResposta: "0h22", problemaRecorrente: "—" }
];

// KPIs que não vêm da lista de clientes (também de demonstração)
const kpisMock = {
    resolvidoPercentual: 42,
    resolvidoVariacao: 6, // pontos percentuais vs. período anterior
    escalonadosAbertos: 8,
    tempoMedioResposta: "1h25"
};

// resumo dos alertas enviados (barra empilhada do card)
const resumoMock = {
    totalAlertas: 140,
    partes: [
        { cor: "positive", legenda: "Resolvidos pelo cliente", valor: 59 },
        { cor: "info", legenda: "Em andamento com o cliente", valor: 57 },
        { cor: "amarelo", legenda: "Escalonados", valor: 24, detalhe: "(16 resolvidos)" }
    ]
};

// índice dos clientes por id (usado na expansão da linha)
const clientesPorId = {};
for (const cliente of clientesMock) {
    clientesPorId[cliente.idCliente] = cliente;
}

// estado da tabela
const LIMITE_LISTA = 5; // "Mostrando 5 de 18 clientes"
let verTodos = false;
let buscaAtual = "";
let filtroAtual = "";

// gráficos abertos no momento (só um detalhe fica aberto por vez)
let graficoLinha = null;
let graficoRosca = null;


// ======================================
// FUNÇÕES DE APOIO
// ======================================

// 3 -> "3,0"
function formatarDecimal(valor) {
    return valor.toFixed(1).replace(".", ",");
}

// ▲/▼ da variação. bomQuandoSobe define a cor:
// subir é bom (ex.: resolve sozinho) = verde; subir é ruim (ex.: alertas) = vermelho
function montarVariacao(variacao, sufixo, bomQuandoSobe) {
    if (variacao === 0) {
        return `<span class="variacao text-secondary">estável</span>`;
    }

    const subiu = variacao > 0;
    const bom = subiu === bomQuandoSobe;
    const icone = subiu ? "bi-caret-up-fill" : "bi-caret-down-fill";

    return `<span class="variacao ${bom ? "text-positive" : "text-danger"}"><i class="bi ${icone}"></i>${Math.abs(variacao)}${sufixo}</span>`;
}

// série determinística de chamados por dia (dados de demonstração)
function gerarSerieDias(dias, semente, base) {
    const serie = [];

    for (let dia = 1; dia <= dias; dia++) {
        serie.push(Math.abs(Math.round(Math.sin(dia * 1.3 + semente * 2.7) * base)));
    }

    return serie;
}

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
// CARREGAMENTO
// ======================================

function obterDados() {
    plotarKpis();
    plotarResumo();
    renderizarTabela();
}


// ======================================
// KPIS
// ======================================

function plotarKpis() {
    // Quem ligar primeiro: cliente com mais alertas por CLP
    let quemLigar = clientesMock[0];

    for (const cliente of clientesMock) {
        if (cliente.alertasPorClp > quemLigar.alertasPorClp) {
            quemLigar = cliente;
        }
    }

    document.getElementById("kpi-empresa").textContent = quemLigar.empresa;

    const detalheEmpresa = document.getElementById("kpi-empresa-detalhe");

    if (quemLigar.variacaoAlertas === 0) {
        detalheEmpresa.textContent = `${formatarDecimal(quemLigar.alertasPorClp)} alertas por CLP · igual ao período anterior`;
        detalheEmpresa.className = "kpi-details";
    } else {
        // mais alertas = piora (vermelho); menos alertas = melhora (verde)
        const piora = quemLigar.variacaoAlertas > 0;
        const icone = piora ? "bi-caret-up-fill" : "bi-caret-down-fill";

        detalheEmpresa.innerHTML =
            `${formatarDecimal(quemLigar.alertasPorClp)} alertas por CLP · <i class="bi ${icone}"></i> ${Math.abs(quemLigar.variacaoAlertas)}% vs. período anterior`;
        detalheEmpresa.className = `kpi-details ${piora ? "text-danger" : "text-positive"}`;
    }

    // Resolvido pelo próprio cliente
    document.getElementById("kpi-resolvido").textContent = kpisMock.resolvidoPercentual + "%";

    const detalheResolvido = document.getElementById("kpi-resolvido-detalhe");

    if (kpisMock.resolvidoVariacao === 0) {
        detalheResolvido.textContent = "igual ao período anterior";
        detalheResolvido.className = "kpi-details";
    } else {
        const melhorou = kpisMock.resolvidoVariacao > 0;
        const icone = melhorou ? "bi-caret-up-fill" : "bi-caret-down-fill";

        detalheResolvido.innerHTML =
            `<i class="bi ${icone}"></i> ${Math.abs(kpisMock.resolvidoVariacao)} % vs. período anterior`;
        detalheResolvido.className = `kpi-details ${melhorou ? "text-positive" : "text-danger"}`;
    }

    // Escalonados abertos para a equipe
    document.getElementById("kpi-escalonados").textContent = kpisMock.escalonadosAbertos;
    document.getElementById("kpi-escalonados-detalhe").textContent =
        `Tempo médio de resposta: ${kpisMock.tempoMedioResposta}`;
}


// ======================================
// RESUMO DOS ALERTAS ENVIADOS (barra empilhada)
// ======================================

function plotarResumo() {
    document.getElementById("resumo-titulo").textContent =
        `O que aconteceu com os ${resumoMock.totalAlertas} alertas enviados`;

    const cores = {
        positive: "var(--color-positive)",
        info: "var(--color-info)",
        amarelo: "var(--color-amarelo-claro)"
    };

    const barra = document.getElementById("resumo_barra");
    const legenda = document.getElementById("resumo_legenda");

    barra.innerHTML = "";
    legenda.innerHTML = "";

    for (const parte of resumoMock.partes) {
        const largura = (parte.valor / resumoMock.totalAlertas * 100).toFixed(1);

        barra.innerHTML += `<div class="resumo-segmento" style="width: ${largura}%; background-color: ${cores[parte.cor]}"></div>`;

        legenda.innerHTML += `<div class="resumo-legenda-item" style="width: ${largura}%">
            ${parte.legenda} <b>${parte.valor}</b>${parte.detalhe ? " " + parte.detalhe : ""}
        </div>`;
    }
}


// ======================================
// TABELA DE CLIENTES (busca, ordenar, filtrar, ver todos)
// ======================================

function clientesFiltradas() {
    let lista = clientesMock.slice();

    // filtro do select
    if (filtroAtual === "com-alertas") {
        lista = lista.filter(cliente => cliente.comAlertas);
    } else if (filtroAtual === "tag-alta") {
        lista = lista.filter(cliente => cliente.tagAlta);
    }

    // busca por nome da empresa
    if (buscaAtual !== "") {
        const termo = buscaAtual.toLowerCase();
        lista = lista.filter(cliente => cliente.empresa.toLowerCase().includes(termo));
    }

    // ordenação: alertas por CLP, do maior para o menor
    lista.sort((a, b) => b.alertasPorClp - a.alertasPorClp);

    return lista;
}

function montarLinhaCliente(cliente) {
    const tag = cliente.tagAlta ? `<span class="tag-alta">ALTA</span>` : "";

    const problema = cliente.problemaRecorrente === "—"
        ? `<span class="sem-problema">—</span>`
        : cliente.problemaRecorrente;

    return `<tr class="linha-cliente" data-id="${cliente.idCliente}">
        <td><span class="nome-empresa">${cliente.empresa}</span>${tag}</td>
        <td><span class="valor-destaque">${formatarDecimal(cliente.alertasPorClp)}</span> ${montarVariacao(cliente.variacaoAlertas, "%", false)}</td>
        <td>${cliente.resolveSozinho}% ${montarVariacao(cliente.variacaoResolve, " p.p.", true)}</td>
        <td>${cliente.tempoResposta}</td>
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
                <p class="detalhe-titulo">${cliente.empresa} · detalhe</p>
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
    graficoRosca = graficoSituacaoChamados(cliente);
}


// ======================================
// GRÁFICO DE LINHA — Chamados por etapa
// ======================================

function graficoChamadosPorEtapa(cliente, dias) {
    const rotulos = [];

    for (let dia = 1; dia <= dias; dia++) {
        rotulos.push(dia);
    }

    const ctx = document.getElementById("chart-etapa");

    return new Chart(ctx, {
        type: "line",

        data: {
            labels: rotulos,
            datasets: [
                {
                    label: "Alertas enviados",
                    data: gerarSerieDias(dias, cliente.idCliente, 2),
                    borderColor: "#60A5FA",
                    tension: 0,
                    borderWidth: 2,
                    pointRadius: 0
                },
                {
                    label: "Resolvidos pelo cliente",
                    data: gerarSerieDias(dias, cliente.idCliente + 5, 1),
                    borderColor: "#22C55E",
                    tension: 0,
                    borderWidth: 2,
                    pointRadius: 0
                },
                {
                    label: "Escalonados",
                    data: gerarSerieDias(dias, cliente.idCliente + 9, 1),
                    borderColor: "#FBBF24",
                    borderDash: [6, 4],
                    tension: 0,
                    borderWidth: 2,
                    pointRadius: 0
                }
            ]
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
                    ticks: { color: "#94A3B8", stepSize: 1, font: { size: 10 } },
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

function graficoSituacaoChamados(cliente) {
    // distribuição de demonstração derivada dos alertas por CLP
    const total = Math.max(4, Math.round(cliente.alertasPorClp * 10));
    const resolvidosCliente = Math.round(total * 0.4);
    const emAbertoCliente = Math.round(total * 0.29);
    const resolvidosFornecedor = Math.round(total * 0.23);
    const emAbertoFornecedor = total - resolvidosCliente - emAbertoCliente - resolvidosFornecedor;

    const situacao = [
        { legenda: "Resolvidos pelo cliente", valor: resolvidosCliente, cor: "#22C55E" },
        { legenda: "Em aberto com o cliente", valor: emAbertoCliente, cor: "#60A5FA" },
        { legenda: "Resolvidos pelo fornecedor", valor: resolvidosFornecedor, cor: "#A78BFA" },
        { legenda: "Em aberto com o fornecedor", valor: emAbertoFornecedor, cor: "#FBBF24" }
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

// filtro (todos / com alertas / tag ALTA)
document.getElementById("filtrar-clientes").addEventListener("change", (evento) => {
    filtroAtual = evento.target.value;
    renderizarTabela();
});

// ver todos / mostrar menos
document.getElementById("btn-ver-todos").addEventListener("click", () => {
    verTodos = !verTodos;
    renderizarTabela();
});
