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

// ============================
// CRIAÇÃO DOS GRÁFICOS
// ============================

const configGraficoLinha = {
    scanTime: { campo: 'alertasScanTime', nome: 'Scan Time', unidade: ' ms' },
    cpu: { campo: 'alertasCPU', nome: 'CPU', unidade: '%' },
    ram: { campo: 'alertasRAM', nome: 'RAM', unidade: '%' }
};

let graficoLinha = null;
let graficoPizza = null

// ============================
// Funções de gráfico
// ============================

// Gráfico de doughnut
// function GraficoConsumo(idCanvas, consumo) {

//     const ctx = document.getElementById(idCanvas);

//     new Chart(ctx, {
//         type: 'doughnut',

//         data: {
//             datasets: [{
//                 data: [consumo, 100 - consumo],
//                 backgroundColor: ['#06B6D4', '#D1D5DB'],
//                 borderWidth: 0,
//             }]
//         },

//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             rotation: -90,
//             circumference: 180,
//             cutout: '75%',

//             plugins: {
//                 legend: {
//                     display: false
//                 },
//                 tooltip: {
//                     enabled: false
//                 }
//             }
//         }
//     });
// }

// Gráfico de linha dinâmico
function atualizarGraficoLinha() {

    const periodo = document.getElementById('period-filter').value;
    const tipo = document.getElementById('graph_type').value;
    const dados = dadosPorPeriodo[periodo];
    const config = configGraficoLinha[tipo];
    const horarios = [];
    const valores = [];

    for (let i = 0; i < dados.length; i++) {
        horarios.push(dados[i].horarios);
        valores.push(dados[i][config.campo]);
    }

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
                backgroundColor: '#06B6D4',
                pointBackgroundColor: (ctx) => {
                    return ctx.dataIndex >= 5 ? '#FFF' : '#06B6D4';
                },

                pointBorderColor: (ctx) => {
                    return ctx.dataIndex >= 5 ? '#FFF' : '#06B6D4';
                },
                segment: {
                    borderColor: (ctx) => {
                        return ctx.p0DataIndex >= 5
                            ? '#FFF'
                            : '#06B6D4';
                    },
                    borderDash: (ctx) =>
                        ctx.p0DataIndex >= 5 ? [6, 6] : [],
                },
            },
            ]
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
function plotarGraficoPizza(json_micro) {
    let health_score = json_micro.health_score
    let health_score_message = json_micro.health_score_status

    const restante = 100 - health_score;
    const ctx = document.getElementById('pizza').getContext('2d');

    if (graficoPizza) {
        graficoPizza.destroy()
    }

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

            contexto.font = 'bold 38px Poppins';
            contexto.fillText(health_score, x, y);

            contexto.font = '10px Poppins';
            contexto.fillText('HEALTH SCORE', x, y + 25);

            contexto.restore();
        }
    };

    graficoPizza = new Chart(ctx, {
        type: 'doughnut',

        data: {
            labels: ['Saúde', 'Restante'],

            datasets: [{
                data: [health_score, restante],
                backgroundColor: [health_score < 40 ? "#EF4444" : health_score < 60 ? "#F59E0B" : "#22C55E", 'transparent'],
                borderWidth: 0,
                hoverOffset: 0
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '85%',
            circumference: 360,

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

    const pizza_kpi = document.getElementById("pizza_kpi")
    pizza_kpi.innerHTML = health_score_message
    pizza_kpi.className = health_score < 40 ? "danger" : health_score < 60 ? "warning" : "positve"
}

// Chamandos os gráficos
function obterDados() {
    const dadosGrafico1 = dadosPorPeriodo['24h'];
    atualizarGraficoLinha();
}

// ============================
// CHAMADAS PARA A API
// ============================

async function getCompanyPlc() {
    // Pegando id da empresa do session storage
    let id_empresa = sessionStorage.getItem("ID_EMPRESA")

    // Chamando a api 
    let response = await fetch(`/clp/listarClps/${id_empresa}`, {
        method: "GET"
    })

    // Verificando se a resposta da api foi ok
    if (!response.ok) {
        console.log("Não foi possível achar os clps da empresa")
        return
    }

    // Transformando a resposta em json
    let json = await response.json()

    return json
}


async function getIndividualPlc() {
    // Pegando id do plc pelo select
    let id_plc = select_clps.value


    // Chamando a api 
    let response = await fetch(`/clp/${id_plc}`, {
        method: "GET"
    })

    // Verificando se a resposta da api foi ok
    if (!response.ok) {
        console.log("Não foi possível achar o clp pelo id")
        return
    }

    // Transformando a resposta em json
    let json = await response.json()

    return json
}

async function getDataMicroPlc() {
    // Pegando id do plc pelo select
    let id_plc = select_clps.value
    let id_empresa = sessionStorage.getItem("ID_EMPRESA")

    // Chamando a api 
    let response = await fetch(`/clp/micro-analise/${id_plc}/${id_empresa}`, {
        method: "GET"
    })

    // Verificando se a resposta da api foi ok
    if (!response.ok) {
        console.log("Não foi possível achar o clp pelo id")
        return
    }

    // Transformando a resposta em json
    let json = await response.json()

    return json
}

// ============================
// CHAMANDO FUNÇÕES DE CARREGAMENTO DE TELA
// ============================
function renderClps(clps) {
    let select_clps = document.getElementById("select_clps")

    clps.forEach(clp => {
        select_clps.innerHTML += `<option value="${clp.idClp}" class="filter-option">${clp.nome}</option>`
    });
}

function renderClpInfo(plc, timestamp) {
    name_clp.innerHTML = plc.nome_clp
    if (plc.status == 1) {
        status_clp.innerHTML = "ativo"
        document.getElementById("status_box").classList.add("positve-bg")
    } else {
        status_clp.innerHTML = "Inativo"
        document.getElementById("status_box").classList.add("danger-bg")
    }

    name_model.innerHTML = plc.nome_modelo
    addres_mac.innerHTML = plc.mac_address
    department.innerHTML = plc.localizacao
    last_update.innerHTML = new Date(timestamp).toLocaleString('pt-BR')
}

function renderKpiPerformance(json, value) {
    let peak
    let minimun
    let current
    if (value == "ram") {
        peak = json.pico_consumo_memoria_ram_porcentagem
        minimun = json.minimo_consumo_memoria_ram_porcentagem
        current = json.porcentagem_uso_ram

        title_peak.innerHTML = "Pico RAM"
        title_current.innerHTML = "Atual RAM"
        title_minimum.innerHTML = "Mínimo RAM"
    } else if (value == "cpu") {
        peak = json.pico_porcentagem_uso_cpu
        minimun = json.minimo_porcentagem_uso_cpu
        current = json.porcentagem_uso_cpu

        title_peak.innerHTML = "Pico CPU"
        title_current.innerHTML = "Atual CPU"
        title_minimum.innerHTML = "Mínimo CPU"
    } else {
        peak = json.scan_time_pico
        minimun = json.scan_time_minimo
        current = json.scan_time_atual

        title_peak.innerHTML = "Pico Scan Time"
        title_current.innerHTML = "Atual Scan Time"
        title_minimum.innerHTML = "Mínimo Scan Time"
    }

    peak_label.innerHTML = peak
    current_label.innerHTML = current
    minimun_label.innerHTML = minimun
}

async function loadClps() {
    let clps = await getCompanyPlc()
    renderClps(clps)
    let individual_plc = await getIndividualPlc()
    let dataMicro = await getDataMicroPlc() 
    renderClpInfo(individual_plc[0], dataMicro[0].timestamp)
    renderKpiPerformance(dataMicro[0], graph_type.value)
    plotarGraficoPizza(dataMicro[0])
}

// ============================
// Chamando função de obter dados
// ============================
obterDados()
loadClps()


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


document.getElementById("select_clps").addEventListener("change", async () => {
    let clp = await getIndividualPlc()
    renderClpInfo(clp[0])
})


let graph_type_value = document.getElementById("graph_type")

graph_type_value.addEventListener("change", async () => {
    atualizarGraficoLinha()
    let microData = await getDataMicroPlc()
    renderKpiPerformance(microData[0], graph_type_value.value)
})