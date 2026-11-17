// ===== DADOS MOCKADOS=====
const rotulos = { critico: 'Crítico', atencao: 'Atenção', estavel: 'Estável' };

const metaHealthScore = 75;

const kpis = [
    { titulo: 'CLPs fora do padrão', valor: '56%', variacao: '▲ 8% nas últimas 24h', cor: '', detalhe: '10 de 18 monitorados' },
    { titulo: 'Health Score Mediano', valor: '68', unidade: '/100', status: 'atencao', variacao: '▼ 6pts vs período anterior', cor: '', detalhe: `Meta de qualidade: ${metaHealthScore}` },
    { titulo: 'Mediana Alertas por CLP', valor: '3', variacao: '▲ 57% acima de outros modelos', cor: '', detalhe: '20 alertas e 18 CLPs ativos' },
    { titulo: 'Componente mais crítico', valor: 'CPU', variacao: '30% dos alertas deste modelo', cor: 'alerta', detalhe: '12 de 40 alertas neste período' }
];

const ranking = [
    { apelido: 'CLP-SIE-01', cliente: 'Mitsubishi Electric', setor: 'Automação Industrial', health: 30, status: 'critico', alertas: 10, componente: 'SCAN' },
    { apelido: 'CLP-SIE-05', cliente: 'Petrobras', setor: 'Óleo e Gás', health: 32, status: 'critico', alertas: 9, componente: 'CPU' },
    { apelido: 'CLP-SIE-03', cliente: 'Vale', setor: 'Mineração', health: 45, status: 'atencao', alertas: 7, componente: 'CPU' },
    { apelido: 'CLP-SIE-10', cliente: 'Mitsubishi Electric', setor: 'Automação Industrial', health: 48, status: 'atencao', alertas: 6, componente: 'SCAN' }
];

const statusClps = [
    { nome: 'Estável', qtd: 8, cor: '#22C55E' },
    { nome: 'Atenção', qtd: 6, cor: '#F59E0B' },
    { nome: 'Crítico', qtd: 4, cor: '#EF4444' }
];

const alertasComponente = { labels: ['CPU', 'RAM', 'SCAN', 'REDE', 'SWAP'], valores: [12, 10, 8, 6, 4] };

const horas = [];
for (let h = 0; h < 24; h++) {
    horas.push(String(h).padStart(2, '0') + ':00');
}

const evolucao = {
    '24h': { labels: horas, valores: [28, 13, 41, 32, 36, 35, 33, 39, 33, 45, 48, 51, 28, 30, 33, 44, 41, 41, 41, 42, 44, 36, 44, 47] },
    '7d': { labels: ['07/11', '08/11', '09/11', '10/11', '11/11', '12/11', '13/11'], valores: [52, 47, 55, 44, 50, 41, 47] },
    '30d': { labels: ['15/10', '20/10', '25/10', '30/10', '04/11', '09/11', '13/11'], valores: [58, 54, 49, 52, 45, 50, 47] }
};

// ===== RENDERIZAÇÃO DO HTML =====
function renderizarKpis() {
    document.getElementById('kpis').innerHTML = kpis.map(kpi => `
        <div class="kpi-box">
            <p class="kpi-title">${kpi.titulo}</p>
            <div class="kpi-valor-linha">
                <p class="kpi-result-big ${kpi.status || ''}">${kpi.valor}${kpi.unidade ? `<span class="kpi-unidade">${kpi.unidade}</span>` : ''}</p>
                ${kpi.status ? `<span class="pill ${kpi.status}">${rotulos[kpi.status]}</span>` : ''}
            </div>
            <p class="kpi-details ${kpi.cor}">${kpi.variacao}</p>
            ${kpi.detalhe ? `<p class="kpi-detalhe">${kpi.detalhe}</p>` : ''}
        </div>`).join('');
}

function renderizarRanking() {
    document.getElementById('ranking').innerHTML = ranking.map(clp => `
        <tr>
            <td>${clp.apelido}</td>
            <td>${clp.cliente}</td>
            <td>${clp.setor}</td>
            <td><span class="pill ${clp.status}">${clp.health} - ${rotulos[clp.status]}</span></td>
            <td>${clp.alertas}</td>
            <td>${clp.componente}</td>
        </tr>`).join('');
}

// ===== GRÁFICOS =====
function criarGraficoStatus() {
    const total = statusClps.reduce((soma, item) => soma + item.qtd, 0);
    document.getElementById('total-clps').textContent = total;

    document.getElementById('legenda-status').innerHTML = statusClps.map(item => `
        <li><span style="background-color: ${item.cor}"></span>${item.nome} - ${item.qtd}</li>`).join('');

    new Chart(document.getElementById('grafico-status'), {
        type: 'doughnut',
        data: {
            labels: statusClps.map(item => item.nome),
            datasets: [{
                data: statusClps.map(item => item.qtd),
                backgroundColor: statusClps.map(item => item.cor),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: { legend: { display: false } }
        }
    });
}

function criarGraficoComponentes() {
    new Chart(document.getElementById('grafico-componentes'), {
        type: 'bar',
        data: {
            labels: alertasComponente.labels,
            datasets: [{
                data: alertasComponente.valores,
                backgroundColor: '#06B6D4',
                barThickness: 14
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false, beginAtZero: true, grace: '20%' },
                y: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: '#FFFFFF', font: { family: 'Montserrat', size: 13, weight: '600' } }
                }
            }
        },
        // escreve o valor na ponta de cada barra
        plugins: [{
            id: 'valoresNasBarras',
            afterDatasetsDraw(chart) {
                const ctx = chart.ctx;
                ctx.save();
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '600 13px Montserrat, sans-serif';
                ctx.textBaseline = 'middle';
                chart.data.datasets[0].data.forEach((valor, i) => {
                    const barra = chart.getDatasetMeta(0).data[i];
                    ctx.fillText(valor, barra.x + 8, barra.y);
                });
                ctx.restore();
            }
        }]
    });
}

let graficoEvolucao;

function criarGraficoEvolucao() {
    graficoEvolucao = new Chart(document.getElementById('grafico-evolucao'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'SIEMENS-S7-1500',
                data: [],
                borderColor: '#20E4D7',
                backgroundColor: '#20E4D7',
                borderWidth: 1.5,
                pointRadius: 0,
                pointHoverRadius: 4
            },
            {
                // linha tracejada da meta (valores preenchidos em atualizarEvolucao)
                label: `Meta (${metaHealthScore})`,
                data: [],
                borderColor: '#ffffff',
                backgroundColor: '#ffffff',
                borderWidth: 1.5,
                borderDash: [6, 4],
                pointRadius: 0,
                pointHoverRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94A3B8', boxWidth: 14, boxHeight: 8, font: { size: 9 } }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#94A3B8',
                        font: { size: 9 },
                        maxRotation: 0,
                        autoSkip: false,
                        // mostra só alguns rótulos para não amontoar (sempre o primeiro e o último)
                        callback: function (valor, indice, ticks) {
                            const passo = Math.ceil(ticks.length / 6);
                            const ehUltimo = indice === ticks.length - 1;
                            return indice % passo === 0 || ehUltimo ? this.getLabelForValue(valor) : '';
                        }
                    }
                },
                y: {
                    min: 0,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                    ticks: { stepSize: 20, color: '#94A3B8', font: { size: 9 } }
                }
            }
        }
    });
}

function atualizarEvolucao() {
    const periodo = document.getElementById('filtro-periodo').value;
    const { labels, valores } = evolucao[periodo];

    document.getElementById('hs-min').textContent = Math.min(...valores);
    document.getElementById('hs-max').textContent = Math.max(...valores);
    document.getElementById('hs-atual').textContent = valores[valores.length - 1];
    document.getElementById('hs-intervalo').textContent = labels[0] + ' - ' + labels[labels.length - 1];

    graficoEvolucao.data.labels = labels;
    graficoEvolucao.data.datasets[0].data = valores;
    graficoEvolucao.data.datasets[1].data = labels.map(() => metaHealthScore);
    graficoEvolucao.update();
}

// ===== INÍCIO E EVENTOS =====
function atualizarTela() {
    // futuramente: buscar os dados na API aqui antes de renderizar
    renderizarKpis();
    renderizarRanking();
    atualizarEvolucao();
}

function iniciar() {
    criarGraficoStatus();
    criarGraficoComponentes();
    criarGraficoEvolucao();
    atualizarTela();

    const linkDashboard = document.querySelector('#nav_flow .nav-link');
    if (linkDashboard) linkDashboard.classList.add('active');
}

document.getElementById('filtro-periodo').addEventListener('change', atualizarEvolucao);
document.getElementById('btn-atualizar').addEventListener('click', atualizarTela);
document.getElementById('btn-refresh').addEventListener('click', atualizarTela);

iniciar();