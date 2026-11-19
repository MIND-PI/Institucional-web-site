(function () {
    const FONTE = "Poppins, Arial, sans-serif";
    const COR_BARRA = { danger: "--color-danger", warning: "--color-warning", positive: "--color-positive" };
    const COR_TEXTO = { danger: "--color-danger", warning: "--color-warning", positive: "--color-positive-text" };

    const state = {
        sector: "todos",
        period: "24h"
    };

    let graficoSetores = null;
    let graficoFrota = null;
    let setoresAtuais = [];

    function cor(variavel) {
        return getComputedStyle(document.documentElement).getPropertyValue(variavel).trim();
    }

    function faixaDoHealth(health) {
        if (health < 40) return "danger";
        if (health < 60) return "warning";
        return "positive";
    }

    function classeStatus(tone) {
        if (tone === "danger") return "is-danger";
        if (tone === "warning") return "is-warning";
        return "is-positive";
    }

    function agoraHoraMinuto() {
        return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }

    function montarOpcoes(selectId, options, selectedValue) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = options
            .map(function (item) {
                const selected = item.value === selectedValue ? "selected" : "";
                return '<option value="' + item.value + '" ' + selected + ">" + item.label + "</option>";
            })
            .join("");
    }

    function montarKpiCard(kpi) {
        if (kpi.type === "sector") {
            return (
                '<div class="kpi-box is-' + kpi.tone + '">' +
                '<p class="kpi-title">' + kpi.title + "</p>" +
                '<p class="kpi-sector">' + kpi.sector + "</p>" +
                '<span class="status-pill ' + classeStatus(kpi.status.tone) + '">' + kpi.status.label + "</span>" +
                '<p class="kpi-details">' + kpi.details + "</p>" +
                "</div>"
            );
        }

        if (kpi.type === "health") {
            const escalaHtml = kpi.scale
                ? (
                    '<div class="scale-bar"><span class="scale-marker" style="left: ' + kpi.scale.marker + '%;"></span></div>' +
                    '<div class="scale-labels">' +
                    '<span class="at-start">' + kpi.scale.labels[0] + "</span>" +
                    '<span style="left: 40%;">' + kpi.scale.labels[1] + "</span>" +
                    '<span style="left: 60%;">' + kpi.scale.labels[2] + "</span>" +
                    '<span class="at-end">' + kpi.scale.labels[3] + "</span>" +
                    "</div>"
                )
                : "";

            return (
                '<div class="kpi-box is-' + kpi.tone + '">' +
                '<p class="kpi-title">' + kpi.title + "</p>" +
                '<div class="kpi-value-row">' +
                '<p class="kpi-result-medium">' + kpi.value + '<span class="kpi-unit"> ' + kpi.unit + "</span></p>" +
                '<span class="status-pill ' + classeStatus(kpi.status.tone) + '">' + kpi.status.label + "</span>" +
                "</div>" +
                '<p class="kpi-details">' + kpi.details + "</p>" +
                escalaHtml +
                "</div>"
            );
        }

        if (kpi.type === "availability") {
            const statusHtml = kpi.status
                ? '<span class="status-pill ' + classeStatus(kpi.status.tone) + '">' + kpi.status.label + "</span>"
                : "";

            const progressoHtml = kpi.progress
                ? (
                    '<div class="progress-track">' +
                    '<div class="progress-fill" style="width: ' + kpi.progress.value + '%;"></div>' +
                    '<span class="progress-goal" style="left: ' + kpi.progress.goal + '%;"></span>' +
                    "</div>" +
                    '<div class="scale-labels">' +
                    '<span class="at-start">' + kpi.progress.startLabel + "</span>" +
                    '<span class="at-end">' + kpi.progress.endLabel + "</span>" +
                    "</div>"
                )
                : "";

            return (
                '<div class="kpi-box is-' + kpi.tone + '">' +
                '<p class="kpi-title">' + kpi.title + "</p>" +
                '<div class="kpi-value-row">' +
                '<p class="kpi-result-medium">' + kpi.value + "</p>" +
                statusHtml +
                "</div>" +
                '<p class="kpi-details">' + kpi.details + "</p>" +
                progressoHtml +
                "</div>"
            );
        }

        return (
            '<div class="kpi-box is-' + kpi.tone + '">' +
            '<p class="kpi-title">' + kpi.title + "</p>" +
            '<div class="kpi-value-row">' +
            '<p class="kpi-result-medium">' + kpi.value + "</p>" +
            '<span class="status-pill ' + classeStatus(kpi.status.tone) + '">' + kpi.status.label + "</span>" +
            "</div>" +
            '<p class="kpi-details">' + kpi.details + "</p>" +
            "</div>"
        );
    }

    function renderKpis(kpis) {
        const container = document.getElementById("kpi-container");
        container.innerHTML = kpis.map(montarKpiCard).join("");
    }

    function renderLegendaSetores(legend) {
        const container = document.getElementById("zone-legend");
        container.innerHTML = legend
            .map(function (item) {
                return (
                    '<span class="legend-item">' +
                    '<span class="legend-dot bg-' + item.tone + '"></span>' +
                    item.label +
                    "</span>"
                );
            })
            .join("");
    }

    function renderLegendaFrota(frota) {
        const values = frota.values;
        const container = document.getElementById("fleet-legend");
        container.innerHTML = frota.legend
            .map(function (item) {
                return (
                    '<div class="pizza-text-box">' +
                    '<p class="pizza-text">' +
                    '<span class="legend-dot bg-' + item.tone + '"></span>' +
                    "<b>" + item.label + " · " + values[item.key] + "</b>" +
                    "</p>" +
                    '<p class="legend-help">' + item.detail + "</p>" +
                    "</div>"
                );
            })
            .join("");
    }

    function renderRanking(rankingRows, rankingConfig) {
        const head = document.getElementById("ranking-head");
        const body = document.getElementById("ranking-body");
        const hint = document.getElementById("ranking-hint");
        const title = document.getElementById("ranking-title");

        title.textContent = rankingConfig.title;
        hint.textContent = rankingConfig.hint;

        head.innerHTML = "<tr>" + rankingConfig.columns.map(function (col) { return "<th>" + col + "</th>"; }).join("") + "</tr>";

        if (!rankingRows.length) {
            body.innerHTML = '<tr><td colspan="' + rankingConfig.columns.length + '" class="empty-state">Sem CLPs para o filtro selecionado.</td></tr>';
            return;
        }

        body.innerHTML = rankingRows
            .map(function (row) {
                const tone = row.statusTone || faixaDoHealth(row.health);
                return (
                    '<tr class="ranking-row" tabindex="0" data-clp="' + row.nickname + '">' +
                    '<td class="cell-strong">' + row.nickname + "</td>" +
                    "<td>" + (row.sectorLabel || "-") + "</td>" +
                    "<td>" + row.model + "</td>" +
                    "<td>" +
                    '<div class="health-cell">' +
                    '<span class="health-value is-' + tone + '">' + row.health + "</span>" +
                    '<div class="health-track"><div class="health-fill bg-' + tone + '" style="width: ' + row.health + '%;"></div></div>' +
                    "</div>" +
                    "</td>" +
                    '<td><span class="status-pill ' + classeStatus(tone) + '">' + row.status + "</span></td>" +
                    "<td>" + row.alerts + "</td>" +
                    "<td>" + row.component + "</td>" +
                    "</tr>"
                );
            })
            .join("");
    }

    const pluginFundoFaixas = {
        id: "fundoFaixas",
        beforeDatasetsDraw: function (chart) {
            const ctx = chart.ctx;
            const x = chart.scales.x;
            const inicio = x.getPixelForValue(0);
            const x40 = x.getPixelForValue(40);
            const x60 = x.getPixelForValue(60);
            const fim = x.getPixelForValue(100);

            chart.getDatasetMeta(0).data.forEach(function (barra) {
                const topo = barra.y - barra.height / 2;
                ctx.save();
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(inicio, topo, fim - inicio, barra.height, 5);
                else ctx.rect(inicio, topo, fim - inicio, barra.height);
                ctx.clip();
                ctx.fillStyle = cor("--zone-danger");
                ctx.fillRect(inicio, topo, x40 - inicio, barra.height);
                ctx.fillStyle = cor("--zone-warning");
                ctx.fillRect(x40, topo, x60 - x40, barra.height);
                ctx.fillStyle = cor("--zone-positive");
                ctx.fillRect(x60, topo, fim - x60, barra.height);
                ctx.restore();
            });
        }
    };

    const pluginRotulosSetores = {
        id: "rotulosSetores",
        afterDatasetsDraw: function (chart) {
            const ctx = chart.ctx;
            const direita = chart.chartArea.right;

            chart.getDatasetMeta(0).data.forEach(function (barra, i) {
                const setor = setoresAtuais[i];
                if (!setor) return;

                ctx.save();
                ctx.textBaseline = "middle";
                ctx.textAlign = "left";
                ctx.font = "700 13px " + FONTE;
                ctx.fillStyle = cor(COR_TEXTO[faixaDoHealth(setor.health)]);
                ctx.fillText(setor.health, direita + 12, barra.y);
                ctx.font = "400 11px " + FONTE;
                ctx.fillStyle = cor("--color-text-secondary");
                ctx.fillText(setor.online + "/" + setor.total + " online", direita + 44, barra.y);
                ctx.restore();
            });
        }
    };

    function renderGraficoSetores(sectorsConfig) {
        const lista = (sectorsConfig.items || []).slice().sort(function (a, b) { return a.health - b.health; }).slice(0, 5);
        const restante = sectorsConfig.totalSectors - lista.length;

        setoresAtuais = lista;

        document.getElementById("setores-total").textContent = "de " + sectorsConfig.totalSectors + " setores";
        document.getElementById("setores-footer").textContent =
            "Os outros " + restante + " setores estão com health médio ≥ " + sectorsConfig.minOtherHealth;
        document.getElementById("setores-link").textContent =
            sectorsConfig.outlier && sectorsConfig.outlier.enabled
                ? sectorsConfig.outlier.detailsLinkLabel
                : sectorsConfig.linkLabel;
        document.getElementById("outlier-info").textContent =
            sectorsConfig.outlier && sectorsConfig.outlier.enabled
                ? sectorsConfig.outlier.message
                : "";

        const canvas = document.getElementById("bar-chart");
        canvas.setAttribute(
            "aria-label",
            "Health médio dos " + lista.length + " setores com pior health: " +
            lista.map(function (s) { return s.name + " " + s.health; }).join(", ")
        );

        if (graficoSetores) graficoSetores.destroy();

        graficoSetores = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: lista.map(function (s) { return s.name; }),
                datasets: [{
                    data: lista.map(function (s) { return s.health; }),
                    backgroundColor: lista.map(function (s) { return cor(COR_BARRA[faixaDoHealth(s.health)]); }),
                    borderRadius: 5,
                    borderSkipped: false,
                    barThickness: 18
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { right: 120 } },
                scales: {
                    x: { min: 0, max: 100, display: false },
                    y: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: {
                            color: cor("--color-text-primary"),
                            padding: 12,
                            font: { family: FONTE, size: 12, weight: "600" }
                        }
                    }
                },
                plugins: { legend: { display: false }, tooltip: { displayColors: false } }
            },
            plugins: [pluginFundoFaixas, pluginRotulosSetores]
        });
    }

    function renderGraficoFrota(frota) {
        const nomes = ["Estável", "Atenção", "Crítico", "Offline"];
        const valores = [frota.values.estavel, frota.values.atencao, frota.values.critico, frota.values.offline];
        const total = valores.reduce(function (acc, n) { return acc + n; }, 0);
        const pctEstavel = total ? Math.round((frota.values.estavel / total) * 100) : 0;

        document.getElementById("frota-total").textContent = String(total);
        document.getElementById("frota-resumo").textContent =
            frota.summaryPrefix + " " + pctEstavel + "% dos " + total + " CLPs estão estáveis";

        if (graficoFrota) graficoFrota.destroy();
        graficoFrota = new Chart(document.getElementById("pizza").getContext("2d"), {
            type: "doughnut",
            data: {
                labels: nomes,
                datasets: [{
                    data: valores,
                    backgroundColor: [cor("--color-positive"), cor("--color-warning"), cor("--color-danger"), cor("--color-offline")],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "64%",
                plugins: { legend: { display: false }, tooltip: { displayColors: false } }
            }
        });
    }

    function atualizarCabecalho(header) {
        document.getElementById("page-title").textContent = header.title;
        document.getElementById("last-update").textContent = header.lastUpdatePrefix + " " + agoraHoraMinuto();
    }

    function montarEstruturaEstatica(data) {
        atualizarCabecalho(data.header);

        montarOpcoes("sector-filter", data.filters.sectors, state.sector);
        montarOpcoes("period-filter", data.filters.periods, state.period);

        document.getElementById("sectors-title").textContent = data.sectorsChart.title;
        document.getElementById("sectors-subtitle").textContent = data.sectorsChart.subtitle;
        document.getElementById("frota-title").textContent = data.fleet.title;
        document.getElementById("ranking-title").textContent = data.ranking.title;

        renderLegendaSetores(data.sectorsChart.legend);
    }

    function getDadosFiltrados(filters) {
        // TODO: substituir por fetch() da API usando filters.sector e filters.period
        const rows = mockDashboardData.ranking.rows;
        const rowsFiltradas = filters.sector === "todos" ? rows : rows.filter(function (row) { return row.sector === filters.sector; });

        return {
            header: mockDashboardData.header,
            filters: mockDashboardData.filters,
            kpis: mockDashboardData.kpis,
            sectorsChart: mockDashboardData.sectorsChart,
            fleet: mockDashboardData.fleet,
            ranking: {
                title: mockDashboardData.ranking.title,
                hint: mockDashboardData.ranking.hint,
                columns: mockDashboardData.ranking.columns,
                rows: rowsFiltradas
            }
        };
    }

    function renderDashboard(data) {
        atualizarCabecalho(data.header);
        renderKpis(data.kpis);
        renderGraficoSetores(data.sectorsChart);
        renderLegendaFrota(data.fleet);
        renderGraficoFrota(data.fleet);
        renderRanking(data.ranking.rows, data.ranking);
    }

    function onChangeFiltros() {
        state.sector = document.getElementById("sector-filter").value;
        state.period = document.getElementById("period-filter").value;

        // TODO: substituir por fetch() da API e re-renderizar com os dados retornados
        const dados = getDadosFiltrados(state);
        renderDashboard(dados);
    }

    function onAtualizarClick() {
        // TODO: substituir por fetch() da API para forçar atualização dos dados no backend
        const dados = getDadosFiltrados(state);
        renderDashboard(dados);
    }

    function bindEventos() {
        document.getElementById("sector-filter").addEventListener("change", onChangeFiltros);
        document.getElementById("period-filter").addEventListener("change", onChangeFiltros);
        document.getElementById("btn-etl").addEventListener("click", onAtualizarClick);
    }

    function initDashboardMacroCLP() {
        Chart.defaults.font.family = FONTE;
        montarEstruturaEstatica(mockDashboardData);
        bindEventos();
        renderDashboard(getDadosFiltrados(state));
    }

    document.addEventListener("DOMContentLoaded", function () {
        const fontePronta = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        fontePronta.then(initDashboardMacroCLP);
    });
})();
