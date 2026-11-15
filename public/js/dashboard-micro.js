// ============================
// CRIAÇÃO DOS GRÁFICOS
// ============================

const configGraficoLinha = {
    scanTime: { campo: 'scan_time_ms', nome: 'Scan Time', unidade: 'ms' },
    cpu: { campo: 'porcentagem_uso_cpu', nome: 'CPU', unidade: '%' },
    ram: { campo: 'porcentagem_uso_ram', nome: 'RAM', unidade: '%' }
};

let graficoLinha = null;
let graficoPizza = null

// ============================
// Funções de gráfico
// ============================

// Gráfico de linha dinâmico

function atualizarGraficoLinha(performance, predict) {
    console.log(performance, predict.length)
    if (performance.length <= 0 && predict.length <= 0 || !performance && !predict) {
        graficoLinha.destroy();
        return
    }

    const tipo = document.getElementById('graph_type').value
    const config = configGraficoLinha[tipo]

    const dados_performance = [...performance].reverse()

    let labels = []
    let valores_performance = []
    let valores_predict = []
    let horarios_completos = []
    let ultimo_horario = null

    dados_performance.forEach(item => {
        let data = new Date(item.timestamp.replace(' ', 'T'))
        let label = ""

        let horario_atual = data.getHours() * 60 + data.getMinutes()

        if (data.getMinutes() % 15 == 0 && horario_atual != ultimo_horario) {
            label = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            ultimo_horario = horario_atual
        }

        horarios_completos.push(data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        labels.push(label)
        valores_performance.push(Number(item[config.campo]))
        valores_predict.push(null)
    })


    let ultimo = dados_performance.length - 1
    let ultima_captura = new Date(dados_performance[ultimo].timestamp.replace(' ', 'T'))

    labels[ultimo] = ultima_captura.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    valores_predict[ultimo] = valores_performance[ultimo]

    predict.forEach((item, index) => {
        let minutos = index + 1
        let horario = ""
        let futuro = new Date(ultima_captura)
        futuro.setMinutes(futuro.getMinutes() + minutos)

        if (minutos % 60 == 0) {
            horario = futuro.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }

        horarios_completos.push(futuro.toLocaleTimeString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }))
        labels.push(horario)
        valores_performance.push(null)
        valores_predict.push(Number(item[config.campo]))
    })

    if (graficoLinha != null) {
        graficoLinha.destroy();
    }

    const ctx = document.getElementById('line-chart').getContext('2d');

    graficoLinha = new Chart(ctx, {

        type: 'line',

        data: {
            labels: labels,

            datasets: [

                {
                    label: 'Performance',
                    data: valores_performance,

                    borderColor: '#06B6D4',
                    backgroundColor: '#06B6D4',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.3
                },

                {
                    label: 'Predição',

                    data: valores_predict,

                    borderColor: '#FFF',
                    backgroundColor: '#FFF',
                    borderWidth: 2,
                    borderDash: [6, 5],
                    pointRadius: 0,
                    tension: 0.3
                }

            ]
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#94A3B8'
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function (itens) {
                            return horarios_completos[itens[0].dataIndex]
                        }
                    }
                }
            },

            scales: {

                x: {
                    ticks: {
                        color: '#94A3B8',
                        autoSkip: false,
                        maxRotation: 0
                    },
                    grid: {
                        display: false
                    }
                },

                y: {
                    ticks: {
                        color: '#94A3B8'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.08)'
                    }
                }

            }
        }
    });
}



// Gráfico de pizza - status do clp
function plotarGraficoPizza(json_micro) {
    const pizza_kpi = document.getElementById("pizza_kpi")

    if (graficoPizza) {
        graficoPizza.destroy()
    }

    if (!json_micro) {
        pizza_kpi.innerHTML = "Sem dados"
        pizza_kpi.className = ""
        return
    }

    let health_score = json_micro?.health_score
    let health_score_message = json_micro?.health_score_status

    const restante = 100 - health_score;
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

            contexto.font = 'bold 38px Poppins';
            contexto.fillText(health_score, x, y);

            contexto.font = 'bold 10px Poppins';
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

    pizza_kpi.innerHTML = health_score_message
    pizza_kpi.className = health_score < 40 ? "danger" : health_score < 60 ? "warning" : "positve"
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
        return {}
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
        return {}
    }

    // Transformando a resposta em json
    let json = await response.json()

    return json
}

async function getPerformanceAnalyse() {
    // Pegando id do plc pelo select
    let id_plc = select_clps.value
    let id_empresa = sessionStorage.getItem("ID_EMPRESA")

    // Chamando a api 
    let response = await fetch(`/clp/performance-analise/${id_plc}/${id_empresa}`, {
        method: "GET"
    })

    // Verificando se a resposta da api foi ok
    if (!response.ok) {
        console.log("Não foi possível achar o clp pelo id")
        return []
    }

    // Transformando a resposta em json
    let json = await response.json()

    return json
}

async function getPredictionAnalyse() {
    // Pegando id do plc pelo select
    let id_plc = select_clps.value
    let id_empresa = sessionStorage.getItem("ID_EMPRESA")

    // Chamando a api 
    let response = await fetch(`/clp/predicao-analise/${id_plc}/${id_empresa}`, {
        method: "GET"
    })

    // Verificando se a resposta da api foi ok
    if (!response.ok) {
        console.log("Não foi possível achar o clp pelo id")
        return []
    }

    // Transformando a resposta em json
    let json = await response.json()

    return json
}


async function getMetricAnalyse() {
    // Pegando id do plc pelo select
    let id_plc = select_clps.value
    let id_empresa = sessionStorage.getItem("ID_EMPRESA")

    // Chamando a api 
    let response = await fetch(`/clp/predicao-metrica/${id_plc}/${id_empresa}`, {
        method: "GET"
    })

    // Verificando se a resposta da api foi ok
    if (!response.ok) {
        console.log("Não foi possível achar o clp pelo id")
        return []
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
    let status_box = document.getElementById("status_box")
    name_clp.innerHTML = plc.nome_clp

    status_box.classList.remove("danger-bg")
    status_box.classList.remove("positve-bg")

    if (plc.status == 1) {
        status_clp.innerHTML = "ativo"
        status_box.classList.add("positve-bg")
    } else {
        status_clp.innerHTML = "Inativo"
        status_box.classList.add("danger-bg")
    }

    timestamp = timestamp ? new Date(timestamp).toLocaleString('pt-BR') : "Sem data"
    name_model.innerHTML = plc.nome_modelo
    addres_mac.innerHTML = plc.mac_address
    department.innerHTML = plc.localizacao
    last_update.innerHTML = timestamp
}

function renderKpiPerformance(json, value) {
    if (!json) {
        peak_label.innerHTML = "Sem dados"
        current_label.innerHTML = "Sem dados"
        minimun_label.innerHTML = "Sem dados"
        return
    }

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

    peak = peak < 10 ? `0${peak}` : peak
    minimun = minimun < 10 ? `0${minimun}` : minimun
    current = current < 10 ? `0${current}` : current

    peak_label.innerHTML = `${peak}${configGraficoLinha[value]["unidade"]}`
    current_label.innerHTML = `${current}${configGraficoLinha[value]["unidade"]}`
    minimun_label.innerHTML = `${minimun}${configGraficoLinha[value]["unidade"]}`
}

function renderMetrics(metric, value) {
    if (metric.length <= 0) {
        metric_mae.innerHTML = "Sem dados"
        metric_rmse.innerHTML = "Sem dados"
        metric_r2.innerHTML = "Sem dados"
        return
    }

    let uni

    if (value == "cpu") {
        metric = metric[0]
    } else if (value == "ram") {
        metric = metric[2]
    } else {
        metric = metric[1]
    }

    metric_mae.innerHTML = `${metric.mae}${configGraficoLinha[value]["unidade"]}`
    metric_rmse.innerHTML = `${metric.rmse}${configGraficoLinha[value]["unidade"]}`
    metric_r2.innerHTML = `${metric.r2 * 100}%`
}

function joinWords(words) {
    let text = ""

    words.forEach((word, index) => {
        if (index == 0) {
            text = word
        } else if (index == words.length - 1) {
            text += " e " + word
        } else {
            text += ", " + word
        }
    })

    return text
}

function renderKeyKpis(plc) {
    let anomalies_kpi = document.getElementById("anomalies_detected")
    let risk_kpi = document.getElementById("prevision_risk")
    anomalies_kpi.classList.remove("danger", "positve")
    risk_kpi.classList.remove("danger", "positve")

    if (!plc) {
        anomalies_kpi.innerHTML = "Sem dados"
        risk_kpi.innerHTML = "Sem dados"
        return
    }

    if (plc?.acima_limite?.length > 0) {
        anomalies_kpi.innerHTML = joinWords(plc.acima_limite)
        anomalies_kpi.classList.add("danger")
    } else {
        anomalies_kpi.innerHTML = "Sem anomalias"
        anomalies_kpi.classList.add("positve")
    }

    if (plc?.risco_predicao) {
        risk_kpi.innerHTML = "Risco"
        risk_kpi.classList.add("danger")
    } else {
        risk_kpi.innerHTML = "Sem risco"
        risk_kpi.classList.add("positve")
    }

}

async function loadClps() {
    let clps = await getCompanyPlc()
    renderClps(clps)
    let individual_plc = await getIndividualPlc()
    let dataMicro = await getDataMicroPlc()
    let metrics = await getMetricAnalyse()
    let data_performance = await getPerformanceAnalyse()
    let data_predict = await getPredictionAnalyse()

    renderClpInfo(individual_plc[0], dataMicro[0].timestamp)
    renderKpiPerformance(dataMicro[0], graph_type.value)
    plotarGraficoPizza(dataMicro[0])
    renderMetrics(metrics, graph_type.value)
    atualizarGraficoLinha(data_performance, data_predict)
    renderKeyKpis(dataMicro[0])
}

// ============================
// Chamando função de obter dados
// ============================
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
    let dataMicro = await getDataMicroPlc()
    let data_performance = await getPerformanceAnalyse()
    let data_predict = await getPredictionAnalyse()
    let metrics = await getMetricAnalyse()

    let timestamp = dataMicro.length > 0 ? dataMicro[0].timestamp : null
    let dataMicroJson = dataMicro.length > 0 ? dataMicro[0] : null

    renderClpInfo(clp[0], timestamp)
    renderKpiPerformance(dataMicroJson, graph_type.value)
    renderKeyKpis(dataMicroJson)
    atualizarGraficoLinha(data_performance, data_predict)
    plotarGraficoPizza(dataMicroJson)
    renderMetrics(metrics, graph_type.value)
})

let graph_type_value = document.getElementById("graph_type")

graph_type_value.addEventListener("change", async () => {
    let data_performance = await getPerformanceAnalyse()
    let data_predict = await getPredictionAnalyse()

    let microData = await getDataMicroPlc()
    let dataMicroJson = microData.length > 0 ? microData[0] : null

    renderKpiPerformance(dataMicroJson, graph_type_value.value)

    let metrics = await getMetricAnalyse()

    renderMetrics(metrics, graph_type.value)
    atualizarGraficoLinha(data_performance, data_predict)
})