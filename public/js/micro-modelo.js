// ===== ESTADO DA TELA =====
const rotulos = { critico: 'Crítico', atencao: 'Atenção', estavel: 'Estável' };
const chaveStatus = { 'Estável': 'estavel', 'Atenção': 'atencao', 'Crítico': 'critico' };
const coresStatus = { 'Estável': '#22C55E', 'Atenção': '#F59E0B', 'Crítico': '#EF4444' };

const idFornecedor = sessionStorage.getItem('ID_EMPRESA');
const parametros = new URLSearchParams(window.location.search);
let idModelo = parametros.get('modelo');

let metaHealthScore = 75;
let graficoStatus, graficoComponentes, graficoEvolucao;

// ===== FORMATAÇÃO =====
function arredondar(valor) {
    return valor === null || valor === undefined ? '—' : Math.round(valor);
}

function statusDoHealth(health, limites) {
    if (health === null || health === undefined) return null;
    if (health >= limites.estavel) return 'estavel';
    if (health >= limites.atencao) return 'atencao';
    return 'critico';
}

function textoVariacao(atual, anterior, unidade, sufixo) {
    if (atual === null || anterior === null || atual === undefined || anterior === undefined) {
        return 'Sem período anterior para comparar';
    }
    const diferenca = atual - anterior;
    const seta = diferenca > 0 ? '▲' : diferenca < 0 ? '▼' : '=';
    return `${seta} ${Math.abs(Math.round(diferenca))}${unidade} ${sufixo}`;
}

// ===== RENDERIZAÇÃO =====
function montarKpis(dados) {
    const k = dados.kpis;
    const status = statusDoHealth(k.health_mediano, dados.limites_status);

    const outros = k.alertas_mediana_outros_modelos;
    let comparaOutros = 'Sem outros modelos para comparar';
    if (outros && k.alertas_mediana_por_clp !== null) {
        const pct = Math.round((k.alertas_mediana_por_clp - outros) / outros * 100);
        comparaOutros = `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct)}% ${pct >= 0 ? 'acima' : 'abaixo'} de outros modelos`;
    }

    const totalAlertas = k.alertas_total;
    const pctComponente = totalAlertas > 0 ? Math.round(k.componente_critico_alertas / totalAlertas * 100) : 0;

    return [
        {
            titulo: 'CLPs fora do padrão',
            valor: k.pct_fora_padrao === null ? '—' : Math.round(k.pct_fora_padrao) + '%',
            variacao: textoVariacao(k.pct_fora_padrao, k.pct_fora_padrao_anterior, '%', 'vs período anterior'),
            cor: '',
            detalhe: `${k.clps_fora_padrao} de ${dados.totalClps} monitorados`
        },
        {
            titulo: 'Health Score Mediano',
            valor: String(arredondar(k.health_mediano)),
            unidade: '/100',
            status: status,
            variacao: textoVariacao(k.health_mediano, k.health_mediano_anterior, 'pts', 'vs período anterior'),
            cor: '',
            detalhe: `Meta de qualidade: ${metaHealthScore}`
        },
        {
            titulo: 'Mediana Alertas por CLP',
            valor: String(arredondar(k.alertas_mediana_por_clp)),
            variacao: comparaOutros,
            cor: '',
            detalhe: `${totalAlertas} alertas e ${k.clps_com_dados} CLPs ativos`
        },
        {
            titulo: 'Componente mais crítico',
            valor: k.componente_critico || '—',
            variacao: k.componente_critico ? `${pctComponente}% dos alertas deste modelo` : 'Nenhum alerta no período',
            cor: k.componente_critico ? 'alerta' : '',
            detalhe: `${k.componente_critico_alertas} de ${totalAlertas} alertas neste período`
        }
    ];
}

function renderizarKpis(kpis) {
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

function renderizarRanking(ranking) {
    const corpo = document.getElementById('ranking');
    if (ranking.length === 0) {
        corpo.innerHTML = '<tr><td colspan="6">Nenhum CLP com dados neste período</td></tr>';
        return;
    }
    corpo.innerHTML = ranking.map(clp => {
        const status = chaveStatus[clp.status] || 'estavel';
        return `
        <tr>
            <td>${clp.apelido}</td>
            <td>${clp.cliente}</td>
            <td>${clp.setor}</td>
            <td><span class="pill ${status}">${arredondar(clp.health)} - ${rotulos[status]}</span></td>
            <td>${clp.alertas}</td>
            <td>${clp.pior_componente || '—'}</td>
        </tr>`;
    }).join('');
}

function atualizarStatus(contagem) {
    const itens = ['Estável', 'Atenção', 'Crítico'].map(nome => ({
        nome, qtd: contagem[nome] || 0, cor: coresStatus[nome]
    }));
    const total = itens.reduce((soma, item) => soma + item.qtd, 0);

    document.getElementById('total-clps').textContent = total;
    document.getElementById('legenda-status').innerHTML = itens.map(item => `
        <li><span style="background-color: ${item.cor}"></span>${item.nome} - ${item.qtd}</li>`).join('');

    graficoStatus.data.labels = itens.map(item => item.nome);
    graficoStatus.data.datasets[0].data = itens.map(item => item.qtd);
    graficoStatus.data.datasets[0].backgroundColor = itens.map(item => item.cor);
    graficoStatus.update();
}

function atualizarComponentes(alertas) {
    const nomes = ['CPU', 'RAM', 'SCAN', 'REDE', 'SWAP'];
    graficoComponentes.data.labels = nomes;
    graficoComponentes.data.datasets[0].data = nomes.map(nome => alertas[nome] || 0);
    graficoComponentes.update();
}

function atualizarEvolucao(evolucao, nomeModelo) {
    document.getElementById('hs-min').textContent = arredondar(evolucao.minimo);
    document.getElementById('hs-max').textContent = arredondar(evolucao.maximo);
    document.getElementById('hs-atual').textContent = arredondar(evolucao.atual);

    const labels = evolucao.labels;
    document.getElementById('hs-intervalo').textContent =
        labels.length ? labels[0] + ' - ' + labels[labels.length - 1] : '';

    graficoEvolucao.data.labels = labels;
    graficoEvolucao.data.datasets[0].label = nomeModelo || 'Modelo';
    graficoEvolucao.data.datasets[0].data = evolucao.mediana;
    graficoEvolucao.data.datasets[1].label = `Meta (${metaHealthScore})`;
    graficoEvolucao.data.datasets[1].data = labels.map(() => metaHealthScore);
    graficoEvolucao.update();
}

function limparTela(mensagem) {
    document.getElementById('kpis').innerHTML = `<p class="kpi-detalhe">${mensagem}</p>`;
    document.getElementById('ranking').innerHTML = `<tr><td colspan="6">${mensagem}</td></tr>`;
    atualizarStatus({});
    atualizarComponentes({});
    atualizarEvolucao({ labels: [], mediana: [], minimo: null, maximo: null, atual: null }, '');
}

// ===== GRÁFICOS (criados vazios; os dados chegam da API) =====
function criarGraficoStatus() {
    graficoStatus = new Chart(document.getElementById('grafico-status'), {
        type: 'doughnut',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: { legend: { display: false } }
        }
    });
}

function criarGraficoComponentes() {
    graficoComponentes = new Chart(document.getElementById('grafico-componentes'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{ data: [], backgroundColor: '#06B6D4', barThickness: 14 }]
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

function criarGraficoEvolucao() {
    graficoEvolucao = new Chart(document.getElementById('grafico-evolucao'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Modelo',
                data: [],
                borderColor: '#20E4D7',
                backgroundColor: '#20E4D7',
                borderWidth: 1.5,
                pointRadius: 0,
                pointHoverRadius: 4,
                spanGaps: true
            },
            {
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

// ===== BUSCA DOS DADOS =====
async function carregarMicroModelo() {
    if (!idModelo) {
        limparTela('Selecione um modelo');
        return;
    }

    const periodo = document.getElementById('filtro-periodo').value;

    try {
        const resposta = await fetch(`/microModelo/${idFornecedor}/${idModelo}/${periodo}`);

        if (resposta.status === 404) {
            const vazio = await resposta.json();
            if (vazio.modeloNome) document.querySelector('.clp-h1').textContent = vazio.modeloNome;
            limparTela('Ainda não há dados para este modelo');
            return;
        }
        if (!resposta.ok) {
            limparTela('Não foi possível carregar os dados');
            return;
        }

        const dados = await resposta.json();
        metaHealthScore = dados.meta_health_score;

        document.querySelector('.clp-h1').textContent = dados.modeloNome || 'Modelo';
        renderizarKpis(montarKpis(dados));
        renderizarRanking(dados.ranking);
        atualizarStatus(dados.status);
        atualizarComponentes(dados.alertas_por_componente);
        atualizarEvolucao(dados.evolucao, dados.modeloNome);
    } catch (erro) {
        console.log(erro);
        limparTela('Não foi possível conectar ao servidor');
    }
}

// ===== FILTRO DE MODELO =====
async function carregarModelos() {
    const seletor = document.getElementById('filtro-modelo');
    try {
        const resposta = await fetch(`/modelo/${idFornecedor}`);
        if (!resposta.ok) return;
        const modelos = await resposta.json();

        seletor.innerHTML = '<option value="" disabled>Selecionar modelo</option>' +
            modelos.map(m => `<option value="${m.idModelo}">${m.nome}</option>`).join('');
        seletor.value = idModelo || '';
    } catch (erro) {
        console.log(erro);
    }
}

function trocarModelo() {
    idModelo = document.getElementById('filtro-modelo').value;
    // mantém o id do modelo na URL, igual a quando vem da tela macro
    const url = new URL(window.location.href);
    url.searchParams.set('modelo', idModelo);
    window.history.replaceState(null, '', url);
    carregarMicroModelo();
}

// ===== INÍCIO E EVENTOS =====
async function iniciar() {
    criarGraficoStatus();
    criarGraficoComponentes();
    criarGraficoEvolucao();

    const linkDashboard = document.querySelector('#nav_flow .nav-link');
    if (linkDashboard) linkDashboard.classList.add('active');

    await carregarModelos();
    carregarMicroModelo();
}

document.getElementById('filtro-periodo').addEventListener('change', carregarMicroModelo);
document.getElementById('filtro-modelo').addEventListener('change', trocarModelo);
document.getElementById('btn-atualizar').addEventListener('click', carregarMicroModelo);
document.getElementById('btn-refresh').addEventListener('click', carregarMicroModelo);

iniciar();