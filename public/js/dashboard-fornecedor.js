// ======================================
// DASHBOARD DO FORNECEDOR - COMPARATIVO DE MODELOS
// Os dados vêm da API /comparativo-modelos, que lê o resultado do ETL no bucket (gold)
// ======================================

const ID_USUARIO_LOGADO = sessionStorage.getItem("ID_USUARIO");

const COR_STATUS = { 'Crítico': 'danger', 'Atenção': 'warning', 'Estável': 'positive' };
const NIVEL_CALOR = { baixo: 'heat-baixo', medio: 'heat-medio', alto: 'heat-alto', critico: 'heat-critico' };
const COR_VARIACAO = {
    piorou_forte: '#EF4444',
    piorou: '#F59E0B',
    melhorou: '#22C55E',
    sem_variacao: '#94A3B8',
    sem_dados: '#94A3B8'
};

let filtrosDisponiveis = { setores: [], empresas: [] };
let graficoVariacao = null;
let contadorRequisicao = 0; // evita que uma resposta antiga sobrescreva uma mais nova


// ======================================
// FUNÇÕES DE APOIO
// ======================================

// Evita que nomes com HTML quebrem a tela
function escapar(texto) {
    const div = document.createElement('div');
    div.innerText = texto == null ? '' : texto;
    return div.innerHTML;
}

function arredondar(valor) {
    return valor == null ? '—' : Math.round(valor);
}

function arredondarUmaCasa(valor) {
    return Number(Number(valor).toFixed(1));
}

// Empresa escolhida > setor escolhido > todos
function filtroAtual() {
    const empresa = document.getElementById('company-filter').value;

    if (empresa) {
        return empresa;
    }

    return document.getElementById('sector-filter').value || 'todos';
}


// ======================================
// CARREGAMENTO
// ======================================

async function obterDados() {
    await carregarFiltros();
    await carregarDados();
}

async function carregarFiltros() {
    try {
        const resposta = await fetch(`/comparativo-modelos/filtros/${ID_USUARIO_LOGADO}`);

        if (resposta.ok) {
            filtrosDisponiveis = await resposta.json();
        }
    } catch (erro) {
        console.log(erro);
    }

    montarSelectSetor();
    montarSelectEmpresa();
}

async function carregarDados() {
    const requisicao = ++contadorRequisicao;
    const periodo = document.getElementById('period-filter').value;
    const filtro = filtroAtual();

    try {
        const resposta = await fetch(
            `/comparativo-modelos/${ID_USUARIO_LOGADO}?periodo=${periodo}&filtro=${encodeURIComponent(filtro)}`
        );

        if (requisicao != contadorRequisicao) return;

        if (!resposta.ok) {
            const erro = await resposta.json().catch(function () { return {}; });
            mostrarSemDados(erro.message || 'Não foi possível carregar os dados.');
            return;
        }

        const dados = await resposta.json();

        if (requisicao != contadorRequisicao) return;

        plotarKpis(dados.kpis);
        plotarRanking(dados.ranking);
        plotarMapaProblemas(dados.mapa_problemas);
        plotarVariacao(dados.variacao);
    } catch (erro) {
        console.log(erro);
        mostrarSemDados('Não foi possível carregar os dados.');
    }
}

// Limpa a tela e mostra a mensagem (sem dados, erro de rede, etc.)
function mostrarSemDados(mensagem) {
    document.getElementById('kpi-criticas').textContent = '—';
    document.getElementById('kpi-criticas-detalhe').textContent = '';
    document.getElementById('kpi-degradacao').textContent = '—';
    document.getElementById('kpi-health').textContent = '—';
    document.getElementById('kpi-health').className = 'kpi-result-big';
    document.getElementById('kpi-box-health').className = 'kpi-box';
    document.getElementById('kpi-health-detalhe').textContent = '';

    document.getElementById('ranking_body').innerHTML =
        `<tr><td colspan="8">${escapar(mensagem)}</td></tr>`;
    document.getElementById('heat_grid').innerHTML = '';

    if (graficoVariacao) {
        graficoVariacao.destroy();
        graficoVariacao = null;
    }
}


// ======================================
// FILTROS
// ======================================

function montarSelectSetor() {
    const select = document.getElementById('sector-filter');

    select.innerHTML = '<option value="" class="filter-option">Selecionar setor</option>';

    filtrosDisponiveis.setores.forEach(function (setor) {
        select.innerHTML += `<option value="${escapar(setor.chave)}" class="filter-option">${escapar(setor.rotulo)}</option>`;
    });
}

// Só mostra as empresas do setor escolhido (ou todas, se nenhum setor foi escolhido)
function montarSelectEmpresa() {
    const select = document.getElementById('company-filter');
    const chaveSetor = document.getElementById('sector-filter').value;
    const setor = filtrosDisponiveis.setores.find(function (item) {
        return item.chave == chaveSetor;
    });

    select.innerHTML = '<option value="" class="filter-option">Selecionar empresa</option>';

    filtrosDisponiveis.empresas
        .filter(function (empresa) {
            return !setor || empresa.setor == setor.rotulo;
        })
        .forEach(function (empresa) {
            select.innerHTML += `<option value="${escapar(empresa.chave)}" class="filter-option">${escapar(empresa.rotulo)}</option>`;
        });
}

document.getElementById('sector-filter').addEventListener('change', function () {
    montarSelectEmpresa();
    carregarDados();
});

document.getElementById('company-filter').addEventListener('change', carregarDados);


// ======================================
// KPIS
// ======================================

function plotarKpis(kpis) {
    const criticas = kpis.criticas;
    const elCriticas = document.getElementById('kpi-criticas');
    const elDetalhe = document.getElementById('kpi-criticas-detalhe');

    if (!criticas.total) {
        elCriticas.textContent = '—';
        elDetalhe.textContent = 'Sem unidades no período';
    } else {
        elCriticas.textContent = Math.round(criticas.pct) + '%';

        let comparacao = 'sem período anterior para comparar';

        if (criticas.pct_anterior != null) {
            if (criticas.delta_quantidade > 0) {
                comparacao = `▲ ${criticas.delta_quantidade} a mais que no período anterior`;
            } else if (criticas.delta_quantidade < 0) {
                comparacao = `▼ ${Math.abs(criticas.delta_quantidade)} a menos que no período anterior`;
            } else {
                comparacao = 'igual ao período anterior';
            }
        }

        elDetalhe.innerHTML = `<b>${criticas.quantidade} de ${criticas.total} unidades</b> · ${comparacao}`;
    }

    document.getElementById('kpi-degradacao').textContent = kpis.degradacao.quantidade;

    // Health mediano: a cor segue o status que o ETL já calculou
    const health = kpis.health_mediano;
    const cor = COR_STATUS[health.status];

    document.getElementById('kpi-health').textContent = arredondar(health.valor);
    document.getElementById('kpi-health').className = 'kpi-result-big' + (cor ? ' text-' + cor : '');
    document.getElementById('kpi-box-health').className = 'kpi-box' + (cor ? ' kpi-' + cor : '');

    const detalhe = document.getElementById('kpi-health-detalhe');

    if (health.delta == null) {
        detalhe.textContent = 'sem período anterior para comparar';
        detalhe.className = 'kpi-details';
    } else if (health.delta < 0) {
        detalhe.textContent = `▼ ${Math.abs(arredondarUmaCasa(health.delta))} pts vs. período anterior`;
        detalhe.className = 'kpi-details text-danger';
    } else if (health.delta > 0) {
        detalhe.textContent = `▲ ${arredondarUmaCasa(health.delta)} pts vs. período anterior`;
        detalhe.className = 'kpi-details text-positive';
    } else {
        detalhe.textContent = 'igual ao período anterior';
        detalhe.className = 'kpi-details';
    }
}


// ======================================
// RANKING DE MODELOS (o ETL já entrega ordenado do pior para o melhor)
// ======================================

function textoTendencia(tendencia) {
    const delta = tendencia.delta == null ? null : arredondarUmaCasa(tendencia.delta);

    switch (tendencia.categoria) {
        case 'piorou_forte':
            return { texto: `▼ ${delta} pts`, cor: 'text-danger' };
        case 'piorou':
            return { texto: `▼ ${delta} pts`, cor: 'text-warning' };
        case 'melhorou':
            return { texto: `▲ +${delta} pts`, cor: 'text-positive' };
        case 'sem_variacao':
            return { texto: 'estável', cor: 'text-secondary' };
        default:
            return { texto: '—', cor: 'text-secondary' };
    }
}

function plotarRanking(ranking) {
    const tabela = document.getElementById('ranking_body');

    if (!ranking || ranking.length == 0) {
        tabela.innerHTML = '<tr><td colspan="8">Sem modelos com dados neste período.</td></tr>';
        return;
    }

    let html = '';

    ranking.forEach(function (modelo) {
        const cor = COR_STATUS[modelo.status] || 'secondary';
        const tendencia = textoTendencia(modelo.tendencia);
        const pior = modelo.pior_componente
            ? `${escapar(modelo.pior_componente.rotulo)} · ${modelo.pior_componente.unidades_com_alerta} de ${modelo.pior_componente.unidades} unid.`
            : 'Sem alertas';
        const largura = modelo.health_medio == null ? 0 : Math.round(modelo.health_medio);
        const link = `./dashboard-micro-modelo.html?idModelo=${modelo.id_modelo}`;

        html += `<tr data-id="${modelo.id_modelo}">
            <td><a class="ranking-link" href="${link}">${escapar(modelo.nome)}</a></td>
            <td>${modelo.unidades}</td>
            <td>
                <div class="health-cell">
                    <span class="health-value text-${cor}">${arredondar(modelo.health_medio)}</span>
                    <div class="health-bar">
                        <div class="health-bar-fill bg-${cor}" style="width: ${largura}%"></div>
                    </div>
                </div>
            </td>
            <td><span class="trend-text ${tendencia.cor}">${tendencia.texto}</span></td>
            <td>${pior}</td>
            <td class="ranking-model">${modelo.criticos.quantidade} (${Math.round(modelo.criticos.pct)}%)</td>
            <td><span class="status-pill bg-${cor}">${escapar(modelo.status)}</span></td>
            <td>
                <a class="btn-detalhes" href="${link}">
                    Ver dashboard <i class="bi bi-arrow-right"></i>
                </a>
            </td>
        </tr>`;
    });

    tabela.innerHTML = html;
}

// Abre a dashboard micro do modelo (clicando na linha, no nome ou no botão)
function abrirDashboardModelo(idModelo) {
    window.location.href = `./dashboard-micro-modelo.html?idModelo=${idModelo}`;
}

document.getElementById('ranking_body').addEventListener('click', function (event) {
    const linha = event.target.closest('tr');

    if (linha && linha.getAttribute('data-id') && !event.target.closest('a')) {
        abrirDashboardModelo(linha.getAttribute('data-id'));
    }
});


// ======================================
// MAPA DE PROBLEMAS (modelo x componente)
// ======================================

function plotarMapaProblemas(mapa) {
    const grade = document.getElementById('heat_grid');

    if (!mapa || mapa.linhas.length == 0) {
        grade.innerHTML = '';
        return;
    }

    let html = '<div></div>';

    mapa.componentes.forEach(function (componente) {
        html += `<div class="heat-header">${escapar(componente.rotulo)}</div>`;
    });

    mapa.linhas.forEach(function (linha) {
        html += `<div class="heat-model">${escapar(linha.nome)}</div>`;

        mapa.componentes.forEach(function (componente) {
            const celula = linha.valores[componente.id] || { pct: null, nivel: null };
            const texto = celula.pct == null ? '—' : Math.round(celula.pct) + '%';

            html += `<div class="heat-cell ${NIVEL_CALOR[celula.nivel] || 'heat-baixo'}">${texto}</div>`;
        });
    });

    grade.innerHTML = html;
}


// ======================================
// VARIAÇÃO DO HEALTH POR MODELO
// ======================================

function plotarVariacao(variacao) {
    if (graficoVariacao) {
        graficoVariacao.destroy();
        graficoVariacao = null;
    }

    if (!variacao || variacao.length == 0) {
        return;
    }

    const nomes = [];
    const valores = [];
    const cores = [];

    variacao.forEach(function (item) {
        nomes.push(item.nome);
        valores.push(item.delta == null ? 0 : arredondarUmaCasa(item.delta));
        cores.push(COR_VARIACAO[item.categoria] || COR_VARIACAO.sem_dados);
    });

    // Eixo simétrico para a barra do meio ficar no zero
    const maiorVariacao = Math.max(10, Math.ceil(Math.max(...valores.map(Math.abs)) / 5) * 5);

    graficoVariacao = new Chart(document.getElementById('variacao-chart'), {
        type: 'bar',

        data: {
            labels: nomes,
            datasets: [{
                data: valores,
                backgroundColor: cores,
                borderRadius: 0,
                borderSkipped: false,
                maxBarThickness: 36
            }]
        },

        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: { display: false },

                tooltip: {
                    callbacks: {
                        label: (context) => `${context.raw > 0 ? '+' : ''}${context.raw} pts`
                    }
                }
            },

            scales: {
                x: {
                    min: -maiorVariacao,
                    max: maiorVariacao,

                    ticks: {
                        color: '#94A3B8',
                        font: { size: 10 }
                    },

                    grid: {
                        color: (context) =>
                            context.tick.value === 0
                                ? 'rgba(255, 255, 255, 0.4)'
                                : 'rgba(255, 255, 255, 0.08)'
                    }
                },

                y: {
                    grid: { display: false },
                    border: { display: false },

                    ticks: {
                        color: '#FFFFFF',
                        font: {
                            family: 'Montserrat',
                            size: 11,
                            weight: '600'
                        }
                    }
                }
            }
        },

        plugins: [{
            id: 'valoresNasBarras',

            afterDatasetsDraw(chart) {
                const { ctx } = chart;

                chart.data.datasets[0].data.forEach((valor, index) => {
                    const barra = chart.getDatasetMeta(0).data[index];

                    ctx.save();
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '600 12px Montserrat, sans-serif';
                    ctx.textBaseline = 'middle';

                    // Barra negativa: texto fica na esquerda da ponta
                    if (valor < 0) {
                        ctx.textAlign = 'right';
                        ctx.fillText(`${valor} pts`, barra.x - 8, barra.y);
                    } else {
                        ctx.textAlign = 'left';
                        ctx.fillText(`${valor > 0 ? '+' : ''}${valor} pts`, barra.x + 8, barra.y);
                    }

                    ctx.restore();
                });
            }
        }]
    });
}


// ======================================
// PERÍODO, BOTÃO ATUALIZAR E ÍCONE DE REFRESH
// ======================================

const periodoSelect = document.getElementById('period-filter');
const btnEtl = document.getElementById('btn-etl');

// O botão Atualizar aparece quando o período não é 24h
periodoSelect.addEventListener('change', function () {
    if (periodoSelect.value != '24h') {
        btnEtl.style.display = 'block';
        btnEtl.style.opacity = 1;
    } else {
        btnEtl.style.display = 'none';
        btnEtl.style.opacity = 0;
    }

    carregarDados();
});

// O ETL já atualiza 24h, 7d e 30d a cada 15 minutos: aqui só recarrega o resultado mais recente
btnEtl.addEventListener('click', carregarDados);
document.getElementById('btn-refresh').addEventListener('click', carregarDados);
