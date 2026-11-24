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

        if (minutos % 30 == 0) {
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
    if (json.length <= 0) {
        return {}
    }

    sessionStorage.setItem("NOME_CLP", json[0].nome_clp)
    sessionStorage.setItem("MAC_ADDRESS", json[0].mac_address)
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

async function getClpAlert(period) {
    let nome_clp = sessionStorage.getItem("NOME_CLP")
    let mac_address = sessionStorage.getItem("MAC_ADDRESS")
    if (period == 24) {
        period += "h"
    } else {
        period += "d"
    }
    // Chamando a api 
    let response = await fetch(`/jira/listar-alertas-clp/${nome_clp}/${mac_address}/${period}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
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

// Buscar medições / parâmetros do CLP (limites)
async function getMedicoes() {
    let id_plc = select_clps.value
    let id_empresa = sessionStorage.getItem("ID_EMPRESA")

    // Segue o padrão das outras chamadas: rota /clp/listarMedicoes/:idClp/:idEmpresa
    let response = await fetch(`/clp/listarMedicoes/${id_plc}/${id_empresa}`, {
        method: "GET"
    })

    if (!response.ok) {
        console.log("Não foi possível listar medições do clp")
        return []
    }

    let json = await response.json()
    return json
}

// ============================
// CHAMANDO FUNÇÕES DE CARREGAMENTO DE TELA
// ============================
function renderClps(clps) {
    const params = new URLSearchParams(window.location.search);
    let select_clps = document.getElementById("select_clps")
    const id = params.get("id")
    clps.forEach(clp => {
        select_clps.innerHTML += `<option value="${clp.idClp}" class="filter-option">${clp.nome}</option>`
    });


    if (id == null) {
        return
    }
    
    select_clps.value = id
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

function renderMetrics(metric, value, period) {
    if (metric.length <= 0 && period != "24h") {
        metric_mae.innerHTML = "Apenas no 24h"
        metric_rmse.innerHTML = "Apenas no 24h"
        metric_r2.innerHTML = "Apenas no 24h"
        return
    }


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
    } else if (!plc?.risco_predicao) {
        risk_kpi.innerHTML = "Sem risco"
        risk_kpi.classList.add("positve")
    } else {
        risk_kpi.innerHTML = "Analise apenas 24 horas"
    }

}

function renderKpiAlert(alerts, period) {
    console.log(alerts)
    kpi_alert.innerHTML = alerts.length
    kpi_alert_time.innerHTML = period == 24 ? `Nas últimas ${period} horas` : `Nos últimos ${period} dias`
}

async function loadClps() {
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

    let dataAlert = await getClpAlert(period)
    // obter medições/limites configurados para o CLP
    let medicoes = await getMedicoes()
    // filtrar apenas as medições monitoradas (monitorado == 1) e mapear os campos solicitados
    let parametros_liberados = []

    parametros_liberados = (Array.isArray(medicoes) ? medicoes : []).filter(m => Number(m.monitorado) === 1).map(m => {
        return {
            nome: m.nome,
            unidade_medida: m.unidade_medida,
            parametro: m.parametro
        }
    })

    renderClpInfo(clp[0], timestamp)
    renderKpiPerformance(dataMicroJson, graph_type.value, data_performance)
    renderKeyKpis(dataMicroJson)
    atualizarGraficoLinha(data_performance, data_predict)
    plotarGraficoPizza(dataMicroJson)
    renderMetrics(metrics, graph_type.value, period)
    renderKpiAlert(dataAlert, period)


    // Montar payload enxuto com apenas os campos essenciais para o chatbot,
    // evitando enviar arrays grandes (economiza tokens).
    const metricKeys = ["scanTime", "cpu", "ram"]

    const snapshotMetrics = {}
    metricKeys.forEach(key => {
        const cfg = configGraficoLinha[key]
        const campo = cfg.campo
        const pico_field = cfg.pico
        const min_field = cfg.minimo
        const atual_field = cfg.atual

        const perf_last = (data_performance && data_performance.length > 0) ? Number(data_performance[0][campo]) : null
        const perf_first = (data_performance && data_performance.length > 0) ? Number(data_performance[data_performance.length - 1][campo]) : null
        const pred_first = (data_predict && data_predict.length > 0) ? Number(data_predict[0][campo]) : null
        const pred_last = (data_predict && data_predict.length > 0) ? Number(data_predict[data_predict.length - 1][campo]) : null

        const minimo = dataMicroJson ? Number(dataMicroJson[min_field]) : null
        const pico = dataMicroJson ? Number(dataMicroJson[pico_field]) : null
        const atual = dataMicroJson ? Number(dataMicroJson[atual_field]) : null

        snapshotMetrics[key] = {
            minimo,
            pico,
            atual,
            pred_first,
            pred_last,
            perf_first,
            perf_last
        }
    })

    const dashboardPayload = {
        essentials: {
            metrics: snapshotMetrics,
            alertas_count: (dataAlert && dataAlert.length) ? dataAlert.length : 0,
            anomalias: dataMicroJson?.acima_limite || null,
            previsao_risco: dataMicroJson?.risco_predicao || null,
            health_score: dataMicroJson?.health_score || null,
            health_score_status: dataMicroJson?.health_score_status || null
        },
        indicadores_modelo: metrics || null,
        parametros_limite: parametros_liberados,
        meta: {
            nome_modelo: clp && clp[0] ? clp[0].nome_modelo : null,
            setor: clp && clp[0] ? clp[0].localizacao : null,
            mac_address: clp && clp[0] ? clp[0].mac_address : null,
            ultima_atualizacao: timestamp
        }
    }

    sessionStorage.setItem("DASHBOARD_PAYLOAD", JSON.stringify(dashboardPayload))

    sendMessageHtml()
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
let container_chat_bot = document.getElementById("container_chat_bot")
let menu_mobile = document.getElementById("menuMobile")

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

// CHAT BOT
document.getElementById("btn_ia").addEventListener("click", () => {
    container_chat_bot.classList.toggle("active")
    menu_mobile.classList.toggle("menu-none")
})

document.getElementById("btn_close_chat").addEventListener("click", () => {
    container_chat_bot.classList.toggle("active")
    menu_mobile.classList.toggle("menu-none")
})


// -------------------------
// ELEMENTOS DO CHAT
// -------------------------
const chatInput = document.getElementById("chat_input")
const chatMessages = document.querySelector(".content-chat")
const btnSend = document.getElementById("btn_send_chat")

/**
 * scrollChatToBottom
 * Garante que o container de mensagens role até o final.
 */
function scrollChatToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight
    }
}

/**
 * appendUserMessage
 * Insere a mensagem do usuário na UI do chat.
 */
function appendUserMessage(text) {
    const div = document.createElement("div")
    div.className = "user-message"
    div.innerHTML = `<p>${text}</p>
        <div class="img-card">
            <img src="../assets/imgs/fotosUsuarios/foto_padrao.png" alt="Foto do usuário" id="imgUser"
                                 onerror="this.onerror=null; this.src='../assets/imgs/fotosUsuarios/foto_padrao.png'">
        </div>`
    chatMessages.appendChild(div)
    scrollChatToBottom()
}

/**
 * appendBotMessage
 * Insere a mensagem do bot. Se isLoading=true, mostra "..." como placeholder.
 * Retorna o elemento criado para permitir atualização posterior.
 */
function appendBotMessage(text, isLoading = false) {
    const div = document.createElement("div")
    div.className = "ia-message"
    const innerText = isLoading ? "..." : text
    div.innerHTML = `<div><img src="../assets/icon/MIND .png" alt="Logo do bot da mind"></div><p>${innerText}</p>`
    chatMessages.appendChild(div)
    scrollChatToBottom()
    return div
}


/**
 * sendMessage
 * Envia a pergunta do usuário para o backend junto com o payload 'dados'.
 * Exibe loader e atualiza o bloco do bot com a resposta.
 */
async function sendMessage() {
    const text = chatInput.value && chatInput.value.trim()

    if (!text) {
        return
    }

    // obter histórico (array) do sessionStorage ou criar novo
    let history = JSON.parse(sessionStorage.getItem("HISTORICO_IA") || "[]")
    history.push({ userMessage: text })

    // Mostrar mensagem do usuário na UI
    appendUserMessage(text)
    chatInput.value = ""

    // nome do usuario
    const nomeUsuario = sessionStorage.getItem("NOME_USUARIO")

    // obter diretamente o snapshot salvo em sessionStorage
    const dados = sessionStorage.getItem("DASHBOARD_PAYLOAD")

    // inserir placeholder de loading
    const botElem = appendBotMessage("", true)

    try {
        const resp = await fetch("/ia/response-micro/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nomeUsuario: nomeUsuario,
                pergunta: text,
                dados: dados,
                history: history
            })
        })

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}))
            botElem.querySelector("p").innerText = err.erro || "Erro ao obter resposta"
            return
        }

        const json = await resp.json()
        const reply = json.reply || "Sem resposta"
        botElem.querySelector("p").innerHTML = reply
        scrollChatToBottom()

        history.push({ ia: { reply } })
        sessionStorage.setItem("HISTORICO_IA", JSON.stringify(history))
    } catch (e) {
        botElem.querySelector("p").innerText = "Erro na conexão com a IA"
        console.error(e)
    }
}

async function sendMessageHtml() {
    // nome do usuario
    const nomeUsuario = sessionStorage.getItem("NOME_USUARIO")

    // obter diretamente o snapshot salvo em sessionStorage
    const dados = sessionStorage.getItem("DASHBOARD_PAYLOAD")

    // inserir placeholder de loading na div
    const text_ia = document.getElementById("text_suport_ia")
    text_ia.innerHTML = "Carregando mensagem..."


    try {
        const resp = await fetch("/ia/response-micro/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nomeUsuario: nomeUsuario,
                pergunta: null,
                dados: dados,
            })
        })

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}))
            text_ia.innerText = err.erro || "Sem dados para uma resposta elaborada"
            return
        }

        const json = await resp.json()
        const reply = json.reply || "Sem dados para uma resposta elaborada"
        text_ia.innerHTML = reply

        // salvar/atualizar histórico com a resposta gerada
        let history = JSON.parse(sessionStorage.getItem("HISTORICO_IA") || "[]")

        history.push({ ia: reply })

        sessionStorage.setItem("HISTORICO_IA", JSON.stringify(history))
        console.log("HISTORICO_IA:", sessionStorage.getItem("HISTORICO_IA"))
    } catch (e) {
        text_ia.innerText = "Erro na conexão com a IA"
        console.error(e)
    }
}

// listeners: botão Enviar e tecla Enter
btnSend.addEventListener("click", sendMessage)
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault()
        sendMessage()
    }
})