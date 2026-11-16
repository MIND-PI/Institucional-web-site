// ============================
// FUNÇÕES AUXILIARES
// ============================

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


// ============================
// CRIAÇÃO DOS GRÁFICOS
// ============================

const configGraficoLinha = {
    scanTime: { campo: 'scan_time_ms', nome: 'Scan Time', unidade: 'ms', pico: "scan_time_pico", minimo: "scan_time_minimo", atual: "scan_time_atual" },
    cpu: { campo: 'porcentagem_uso_cpu', nome: 'CPU', unidade: '%', pico: 'pico_porcentagem_uso_cpu', minimo: "minimo_porcentagem_uso_cpu", atual: "porcentagem_uso_cpu" },
    ram: { campo: 'porcentagem_uso_ram', nome: 'RAM', unidade: '%', pico: 'pico_consumo_memoria_ram_porcentagem', minimo: 'minimo_consumo_memoria_ram_porcentagem', atual: "porcentagem_uso_ram" }
};

let graficoLinha = null;
let graficoPizza = null

// ============================
// Funções de gráfico
// ============================

// Gráfico de linha dinâmico
function atualizarGraficoLinha(performance, predict) {
    // Sem dados: limpa o gráfico (antes quebrava se graficoLinha fosse null)
    if (!performance || performance.length === 0) {
        if (graficoLinha) {
            graficoLinha.destroy()
            graficoLinha = null
        }
        return
    }

    const tipo = document.getElementById('graph_type').value
    const config = configGraficoLinha[tipo]
    const periodo = Number(period_filter.value)

    const dados = [...performance].reverse()

    const serie = periodo === 24
        ? montarSerie24h(dados, predict, config)
        : montarSerieDiaria(dados, config)

    desenharGraficoLinha(serie, config)
}


// 24 horas
function montarSerie24h(dados, predict, config) {
    let labels = []
    let valores_performance = []
    let valores_predict = []
    let horarios_completos = []

    // tempo total do gráfico, para espalhar uns 6 rótulos
    let primeira_captura = new Date(dados[0].timestamp.replace(' ', 'T'))
    let ultima_captura = new Date(dados[dados.length - 1].timestamp.replace(' ', 'T'))
    let total_minutos = (ultima_captura - primeira_captura) / 60000
    let passo = total_minutos / 6

    let ultima_label = null

    dados.forEach(item => {
        let data = new Date(item.timestamp.replace(' ', 'T'))
        let label = ""

        if (ultima_label == null || (data - ultima_label) / 60000 >= passo) {
            label = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            ultima_label = data
        }

        horarios_completos.push(data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        labels.push(label)
        valores_performance.push(Number(item[config.campo]))
        valores_predict.push(null)
    })

    let ultimo = dados.length - 1

    if ((ultima_captura - ultima_label) / 60000 >= passo / 2) {
        labels[ultimo] = ultima_captura.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

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

    return {
        labels,
        titulos: horarios_completos,
        autoSkip: false,
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
    }
}

// 7 e 30 dias
function montarSerieDiaria(dados, config) {
    const seven_days = dados.length <= 8
    const labels = []
    const title = []

    dados.forEach(item => {
        const [ano, mes, dia] = item.timestamp.slice(0, 10).split('-').map(Number)
        const data = new Date(ano, mes - 1, dia)

        const ddmm = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
        const weekday = data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')

        labels.push(seven_days ? `${weekday} ${ddmm}` : ddmm)
        title.push(data.toLocaleDateString('pt-BR', {
            weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
        }))
    })

    return {
        labels,
        titulos: title,
        autoSkip: !seven_days,
        datasets: [{
            label: 'Média',
            data: dados.map(i => Number(i[config.campo])),
            borderColor: '#06B6D4',
            backgroundColor: '#06B6D4',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3
        }]
    }
}


function desenharGraficoLinha(serie, config) {
    if (graficoLinha != null) {
        graficoLinha.destroy()
    }

    const ctx = document.getElementById('line-chart').getContext('2d')

    graficoLinha = new Chart(ctx, {
        type: 'line',

        data: {
            labels: serie.labels,
            datasets: serie.datasets
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#94A3B8' }
                },
                tooltip: {
                    callbacks: {
                        title: function (itens) {
                            return serie.titulos[itens[0].dataIndex]
                        },
                        label: function (item) {
                            return `${item.dataset.label}: ${item.parsed.y}${config.unidade}`
                        }
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: '#94A3B8',
                        autoSkip: serie.autoSkip,
                        maxTicksLimit: 10,   
                        maxRotation: 0
                    },
                    grid: { display: false }
                },

                y: {
                    ticks: { color: '#94A3B8' },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' }
                }
            }
        }
    })
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

async function getDataMicroPlc(period) {
    // Pegando id do plc pelo select
    let id_plc = select_clps.value
    let id_empresa = sessionStorage.getItem("ID_EMPRESA")

    // Chamando a api 
    let response = await fetch(`/clp/micro-analise/${id_plc}/${id_empresa}/${period}`, {
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

async function getPerformanceAnalyse(period) {
    // Pegando id do plc pelo select
    let id_plc = select_clps.value
    let id_empresa = sessionStorage.getItem("ID_EMPRESA")

    // Chamando a api 
    let response = await fetch(`/clp/performance-analise/${id_plc}/${id_empresa}/${period}`, {
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

async function getPredictionAnalyse(period) {
    if (period != 24) {
        return []
    }

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


async function getMetricAnalyse(period) {

    if (period != 24) {
        return []
    }

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

function renderKpiPerformance(json, value, performance) {
    if (period_filter.value != 24) {
        renderKpiPeriodo(performance, value)
        return
    }


    if (!json) {
        peak_label.innerHTML = "Sem dados"
        current_label.innerHTML = "Sem dados"
        minimun_label.innerHTML = "Sem dados"
        return
    }

    let type = configGraficoLinha[value]

    let name = type["nome"]
    let unit = type["unidade"]
    let peak_field = type["pico"]
    let current_field = type["atual"]
    let min_field = type["minimo"]

    let current = Number(json[current_field])
    let peak = Number(json[peak_field])
    let minimun = Number(json[min_field])

    peak = peak < 10 ? `0${peak}` : peak
    minimun = minimun < 10 ? `0${minimun}` : minimun
    current = current < 10 ? `0${current}` : current

    title_peak.innerHTML = `Pico ${name}`
    title_current.innerHTML = `Atual ${name}`
    title_minimum.innerHTML = `Mínimo ${name}`

    peak_label.innerHTML = `${peak}${unit}`
    current_label.innerHTML = `${current}${unit}`
    minimun_label.innerHTML = `${minimun}${unit}`
}

function renderKpiPeriodo(performance, value) {
    if (!performance || performance.length == 0) {
        peak_label.innerHTML = "Sem dados"
        current_label.innerHTML = "Sem dados"
        minimun_label.innerHTML = "Sem dados"
        return
    }

    let field = configGraficoLinha[value]["campo"]
    let name = configGraficoLinha[value]["nome"]
    let unit = configGraficoLinha[value]["unidade"]

    let peak = Number(performance[0][field])
    let minimun = Number(performance[0][field])
    let sum = 0

    performance.forEach(item => {
        let value = Number(item[field])

        if (value > peak) {
            peak = value
        }

        if (value < minimun) {
            minimun = value
        }

        sum += value
    })

    let media = sum / performance.length

    title_peak.innerHTML = `Pico ${name}`
    title_current.innerHTML = `Média ${name}`
    title_minimum.innerHTML = `Mínimo ${name}`

    peak_label.innerHTML = `${peak.toFixed(1)}${unit}`
    current_label.innerHTML = `${media.toFixed(1)}${unit}`
    minimun_label.innerHTML = `${minimun.toFixed(1)}${unit}`
}

function renderMetrics(metric, value) {
    if (metric.length <= 0) {
        metric_mae.innerHTML = "Sem dados"
        metric_rmse.innerHTML = "Sem dados"
        metric_r2.innerHTML = "Sem dados"
        return
    }


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
    let period = period_filter.value
    let clps = await getCompanyPlc()
    renderClps(clps)
    loadData()
}

async function loadData() {
    let period = period_filter.value
    let clp = await getIndividualPlc()
    let dataMicro = await getDataMicroPlc(period)
    let data_performance = await getPerformanceAnalyse(period)

    let data_predict = await getPredictionAnalyse(period)
    let metrics = await getMetricAnalyse(period)

    let timestamp = dataMicro.length > 0 ? dataMicro[0].timestamp : null
    let dataMicroJson = dataMicro.length > 0 ? dataMicro[0] : null

    renderClpInfo(clp[0], timestamp)
    renderKpiPerformance(dataMicroJson, graph_type.value, data_performance)
    renderKeyKpis(dataMicroJson)
    atualizarGraficoLinha(data_performance, data_predict)
    plotarGraficoPizza(dataMicroJson)
    renderMetrics(metrics, graph_type.value)
}

// ============================
// Chamando função de obter dados
// ============================
loadClps()


// ============================
// EVENTOS SENDO OUVIDOS
// ============================

const periodoSelect = document.getElementById('period_filter');
const btnEtl = document.getElementById('btn-etl');

let periodoAplicado = periodoSelect.value;

periodoSelect.addEventListener('change', function () {
    if (periodoSelect.value != 24) {
        btnEtl.style.display = 'block';
        btnEtl.style.opacity = 1
    } else {
        btnEtl.style.display = 'none';
        btnEtl.style.opacity = 0
    }
    loadData()
});

document.getElementById("select_clps").addEventListener("change", () => {
    loadData()
})

let graph_type_value = document.getElementById("graph_type")

graph_type_value.addEventListener("change", async () => {
    let period = period_filter.value
    let data_performance = await getPerformanceAnalyse(period)
    let data_predict = await getPredictionAnalyse(period)

    let microData = await getDataMicroPlc(period)
    let dataMicroJson = microData.length > 0 ? microData[0] : null

    renderKpiPerformance(dataMicroJson, graph_type_value.value, data_performance)

    let metrics = await getMetricAnalyse(period)

    renderMetrics(metrics, graph_type.value)
    atualizarGraficoLinha(data_performance, data_predict)
})