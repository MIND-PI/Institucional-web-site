// ============================
// Dados mokados
// ============================

const dadosPorPeriodo = {
    '24h': [
        { horarios: '00:00', alertasCPU: 55, alertasScanTime: 10, alertasRAM: 60 },
        { horarios: '03:00', alertasCPU: 62, alertasScanTime: 11, alertasRAM: 63 },
        { horarios: '06:00', alertasCPU: 65, alertasScanTime: 9, alertasRAM: 66 },
        { horarios: '09:00', alertasCPU: 58, alertasScanTime: 8, alertasRAM: 64 },
        { horarios: '12:00', alertasCPU: 60, alertasScanTime: 18, alertasRAM: 68 },
        { horarios: '15:00', alertasCPU: 72, alertasScanTime: 17, alertasRAM: 74 },
        { horarios: '18:00', alertasCPU: 57, alertasScanTime: 12, alertasRAM: 70 },
        { horarios: '21:00', alertasCPU: 67, alertasScanTime: 10, alertasRAM: 69 }
    ],
    '7d': [
        { horarios: '18/10', alertasCPU: 58, alertasScanTime: 12, alertasRAM: 63 },
        { horarios: '19/10', alertasCPU: 61, alertasScanTime: 14, alertasRAM: 65 },
        { horarios: '20/10', alertasCPU: 66, alertasScanTime: 11, alertasRAM: 68 },
        { horarios: '21/10', alertasCPU: 59, alertasScanTime: 16, alertasRAM: 64 },
        { horarios: '22/10', alertasCPU: 70, alertasScanTime: 15, alertasRAM: 72 },
        { horarios: '23/10', alertasCPU: 63, alertasScanTime: 13, alertasRAM: 69 },
        { horarios: '24/10', alertasCPU: 65, alertasScanTime: 12, alertasRAM: 70 }
    ],
    '30d': [
        { horarios: '25/09', alertasCPU: 54, alertasScanTime: 10, alertasRAM: 60 },
        { horarios: '30/09', alertasCPU: 60, alertasScanTime: 13, alertasRAM: 64 },
        { horarios: '05/10', alertasCPU: 68, alertasScanTime: 17, alertasRAM: 71 },
        { horarios: '10/10', alertasCPU: 57, alertasScanTime: 11, alertasRAM: 66 },
        { horarios: '15/10', alertasCPU: 64, alertasScanTime: 14, alertasRAM: 68 },
        { horarios: '20/10', alertasCPU: 66, alertasScanTime: 12, alertasRAM: 70 }
    ]
};

const configGraficoLinha = {
    scanTime: { campo: 'alertasScanTime', nome: 'Scan Time', unidade: ' ms' },
    cpu: { campo: 'alertasCPU', nome: 'CPU', unidade: '%' },
    ram: { campo: 'alertasRAM', nome: 'RAM', unidade: '%' }
};

let graficoLinha = null;

// ============================
// Funções de gráfico
// ============================

// Gráfico de linha - desempenho do clp dinâmico
function GraficoConsumo(idCanvas, consumo) {

    const ctx = document.getElementById(idCanvas);

    new Chart(ctx, {
        type: 'doughnut',

        data: {
            datasets: [{
                data: [consumo, 100 - consumo],
                backgroundColor: ['#06B6D4', '#D1D5DB'],
                borderWidth: 0
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            rotation: -90,
            circumference: 180,
            cutout: '75%',

            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });
}

// Deixando dados do gráfico de linha dinâmico
function atualizarGraficoLinha() {

    const periodo = document.getElementById('period-filter').value;
    const tipo = document.getElementById('graph-type').value;
    const dados = dadosPorPeriodo[periodo];
    const config = configGraficoLinha[tipo];
    const horarios = [];
    const valores = [];

    for (let i = 0; i < dados.length; i++) {
        horarios.push(dados[i].horarios);
        valores.push(dados[i][config.campo]);
    }

    document.getElementById('peak-label').textContent = 'Pico ' + config.nome;
    document.getElementById('current-label').textContent = 'Atual ' + config.nome;
    document.getElementById('minimun-label').textContent = 'Mínimo ' + config.nome;
    document.getElementById('valor-pico').textContent = Math.max(...valores) + config.unidade;
    document.getElementById('valor-atual').textContent = valores[valores.length - 1] + config.unidade;
    document.getElementById('valor-minimo').textContent = Math.min(...valores) + config.unidade;


    if (graficoLinha != null) {
        graficoLinha.destroy();
    }

    const ctx = document.getElementById('line-chart').getContext('2d');

    graficoLinha = new Chart(ctx, {
        type: 'line',

        data: {
            labels: horarios,
            datasets: [{
                label: config.nome,
                data: valores,
                borderColor: '#06B6D4',
                backgroundColor: '#06B6D4'
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: { display: false }
            },

            scales: {
                x: {
                    ticks: { color: '#94A3B8' },
                    grid: { display: false }
                },
                y: {
                    ticks: { color: '#94A3B8' },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' }
                }
            }
        }
    });
}


// Gráfico de pizza - status do clp
function plotarGraficoPizza(dados) {

    const score = dados[0].healthScore;
    const restante = 100 - score;
    const ctx = document.getElementById('pizza').getContext('2d');

    const pluginCentro = {
        id: 'textoCentro',

        afterDraw: function (chart) {
            const contexto = chart.ctx;

            const x = chart.width / 2;
            const y = chart.height / 2;

            contexto.save();

            contexto.textAlign = 'center';
            contexto.textBaseline = 'middle';
            contexto.fillStyle = '#FFFFFF';

            contexto.font = 'bold 38px Geist';
            contexto.fillText(score, x, y - 8);

            contexto.font = '10px Geist';
            contexto.fillText('HEALTH SCORE', x, y + 27);

            contexto.restore();
        }
    };

    new Chart(ctx, {
        type: 'doughnut',

        data: {
            labels: ['Saúde', 'Restante'],

            datasets: [{
                data: [score, restante],
                backgroundColor: ['#FFA500', 'transparent'],
                borderWidth: 0,
                hoverOffset: 0
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '82%',
            rotation: -30,
            circumference: 340,

            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        },

        plugins: [pluginCentro]
    });
}

// Chamandos os gráficos
function obterDados() {

    const dadosGrafico1 = dadosPorPeriodo['24h'];

    const dadosGrafico2 = [
        { healthScore: 58 }
    ];

    plotarGraficoPizza(dadosGrafico2);
    GraficoConsumo('graph-cpu', 65);
    GraficoConsumo('graph-ram', 70);
    atualizarGraficoLinha();
}

// ============================
// EVENTOS SENDO OUVIDOS
// ============================

const periodoSelect = document.getElementById('period-filter');
const btnEtl = document.getElementById('btn-etl');

let periodoAplicado = periodoSelect.value;

periodoSelect.addEventListener('change', function () {
    if (periodoSelect.value != '24h') {
        btnEtl.style.display = 'block';
        btnEtl.style.opacity = 1
    } else {
        btnEtl.style.display = 'none';

        btnEtl.style.opacity = 0
    }
});

// ============================
// Chamando função de obter dados
// ============================
obterDados()
