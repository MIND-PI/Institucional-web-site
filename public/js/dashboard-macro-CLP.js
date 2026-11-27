(function () {
    const FONTE = "Poppins, Arial, sans-serif";
    const MACRO_CLP_API_BASE = window.MACRO_CLP_API_BASE || "/dashboard/macro-clp";
    const FIXTURE_URL = "/macro-clp-exemplo.json";
    const URL_MICRO_CLP = "./dashboard-micro-clp.html";
    const COR_BARRA = { danger: "--color-danger", warning: "--color-warning", positive: "--color-positive" };
    const COR_TEXTO = { danger: "--color-danger", warning: "--color-warning", positive: "--color-positive-text" };
    const FAIXAS_PADRAO = { criticoAbaixoDe: 40, estavelAPartirDe: 60 };
    const LINHAS_VISIVEIS_TABELA = 5;
    const ALTURA_LINHA_TABELA = 57;
    const ALTURA_CABECALHO_TABELA = 44;
    const HINT_RANKING = "Do menor para o maior health · role para ver todos · clique em uma linha para ver o detalhe";
    const query = new URLSearchParams(window.location.search);
    const MODO_FIXTURE = query.get("fixture") === "1";

    const state = {
        sector: "todos",
        period: "agora"
    };

    let graficoSetores = null;
    let graficoFrota = null;
    let setoresAtuais = [];
    let dadosBaseAtual = null;
    let faixasAtuais = FAIXAS_PADRAO;
    let contadorRequisicao = 0;

    /* ---------- helpers ---------- */

    function slugify(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }

    function cor(variavel) {
        return getComputedStyle(document.documentElement).getPropertyValue(variavel).trim();
    }

    // null/undefined/"" NÃO viram 0
    function numeroOuNull(valor) {
        if (valor === null || valor === undefined || valor === "") return null;
        const n = Number(valor);
        return Number.isFinite(n) ? n : null;
    }

    function arredondar1Casa(valor) {
        const n = numeroOuNull(valor);
        return n === null ? null : Math.round(n * 10) / 10;
    }

    function escaparHtml(texto) {
        return String(texto == null ? "" : texto).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    function rotuloPeriodo(valor) {
        const lista = (dadosBaseAtual.filters && dadosBaseAtual.filters.periods) || [];
        const achado = lista.find(function (p) { return p.value === valor; });
        return achado ? achado.label : valor;
    }

    function faixaDoHealth(health) {
        const valor = numeroOuNull(health);
        if (valor === null) return "warning";
        if (valor < faixasAtuais.criticoAbaixoDe) return "danger";
        if (valor < faixasAtuais.estavelAPartirDe) return "warning";
        return "positive";
    }

    function rotuloStatusDoHealth(health) {
        const tone = faixaDoHealth(health);
        if (tone === "danger") return "Crítico";
        if (tone === "warning") return "Atenção";
        return "Estável";
    }

    function classeStatus(tone) {
        if (tone === "danger") return "is-danger";
        if (tone === "warning") return "is-warning";
        if (tone === "offline") return "is-offline";
        return "is-positive";
    }

    function agoraHoraMinuto() {
        return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }

    function abrirMicroClp(idClp) {
        if (!idClp) return;
        window.location.href = URL_MICRO_CLP + "?id=" + encodeURIComponent(idClp);
    }

    function setorFiltradoSlug() {
        const slug = slugify(state.sector);
        return slug && slug !== "todos" ? slug : null;
    }

    function corDeFundo(el) {
        let atual = el;
        while (atual && atual !== document.documentElement) {
            const fundo = getComputedStyle(atual).backgroundColor;
            if (fundo && fundo !== "transparent" && fundo !== "rgba(0, 0, 0, 0)") return fundo;
            atual = atual.parentElement;
        }
        return "#0f172a";
    }

    /* ---------- fora da curva ---------- */

    function coletarForaDaCurva(setorSlug) {
        const outlier = dadosBaseAtual && dadosBaseAtual.sectorsChart && dadosBaseAtual.sectorsChart.outlier;
        const itens = outlier && Array.isArray(outlier.items) ? outlier.items : [];
        if (!setorSlug) return itens;
        return itens.filter(function (item) {
            return (item.setorSlug || slugify(item.setor)) === setorSlug;
        });
    }

    function rotuloSetorFiltrado(setorSlug) {
        if (!setorSlug) return "Todos os setores";
        const lista = (dadosBaseAtual.filters && dadosBaseAtual.filters.sectors) || [];
        const achado = lista.find(function (s) { return slugify(s.value) === setorSlug; });
        return achado ? String(achado.label).replace(/^Setor:\s*/i, "") : setorSlug;
    }

    // Mesmo padrão dos outros pop-ups: overlay_config + modal_config, aberto/fechado pela classe "ativo"
    function fecharPopupForaDaCurva() {
        const overlay = document.getElementById("macro-clp-outlier-modal");
        if (!overlay) return;
        overlay.id = "";
        overlay.classList.remove("ativo");
        setTimeout(function () { overlay.remove(); }, 300);
    }

    // setorSlug = null -> todos os fora da curva da planta
    function abrirPopupForaDaCurva(setorSlug) {
        fecharPopupForaDaCurva();

        const itens = coletarForaDaCurva(setorSlug);
        const overlay = document.createElement("div");
        overlay.className = "overlay_config";
        overlay.id = "macro-clp-outlier-modal";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");

        const linhasHtml = itens.length
            ? itens.map(function (item) {
                const health = numeroOuNull(item.health);
                const healthTexto = health !== null ? health.toFixed(1) + " / 100" : "Sem health";
                const corHealth = health !== null ? cor(COR_TEXTO[faixaDoHealth(health)]) : "inherit";
                const botaoDetalhe = item.idClp
                    ? '<button type="button" data-abrir-clp="' + escaparHtml(item.idClp) + '" style="background:var(--color-accent);border:none;border-radius:5px;padding:6px 14px;font-family:inherit;font-size:0.75rem;font-weight:700;color:inherit;cursor:pointer;white-space:nowrap;">Abrir CLP</button>'
                    : "";

                return (
                    '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--color-border);border-radius:8px;background:rgba(255,255,255,0.04);">' +
                    "<div>" +
                    '<div style="font-weight:600;font-size:0.9rem;color:var(--color-text-primary);">' + escaparHtml(item.apelido) + "</div>" +
                    '<div style="font-size:0.75rem;color:var(--color-text-secondary);">' + escaparHtml(item.setor) +
                    ' · Health: <span style="color:' + corHealth + ';font-weight:700;">' + escaparHtml(healthTexto) + "</span></div>" +
                    "</div>" +
                    botaoDetalhe +
                    "</div>"
                );
            }).join("")
            : '<p style="margin:0;color:var(--color-text-secondary);font-size:0.9rem;">Nenhum CLP fora da curva encontrado neste período.</p>';

        overlay.innerHTML =
            '<div class="modal_config" style="max-width:480px;width:100%;">' +
            '<div class="modal_header">' +
            "<h2>CLPs fora da curva</h2>" +
            '<button type="button" class="btn_fechar" id="fechar-popup-fora-curva" aria-label="Fechar">✖</button>' +
            "</div>" +
            '<p style="margin:0 0 14px;color:var(--color-text-secondary);font-size:0.8rem;">' +
            escaparHtml(rotuloSetorFiltrado(setorSlug)) + " · Período: " + escaparHtml(rotuloPeriodo(state.period)) + "</p>" +
            '<div style="display:flex;flex-direction:column;gap:8px;max-height:320px;overflow-y:auto;">' +
            linhasHtml +
            "</div>" +
            "</div>";

        overlay.addEventListener("click", function (evento) {
            if (evento.target === overlay || evento.target.closest("#fechar-popup-fora-curva")) {
                fecharPopupForaDaCurva();
                return;
            }
            const btn = evento.target.closest("[data-abrir-clp]");
            if (btn) {
                const id = btn.getAttribute("data-abrir-clp");
                fecharPopupForaDaCurva();
                abrirMicroClp(id);
            }
        });

        document.body.appendChild(overlay);
        void overlay.offsetWidth; // garante a animação do CSS ao adicionar "ativo"
        overlay.classList.add("ativo");
    }

    /* ---------- montagem de HTML ---------- */

    function montarOpcoes(selectId, options, selectedValue) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = options
            .map(function (item) {
                const selected = item.value === selectedValue ? "selected" : "";
                return '<option value="' + escaparHtml(item.value) + '" ' + selected + ">" + escaparHtml(item.label) + "</option>";
            })
            .join("");
    }

    function montarBotaoOutliersKpi() {
        const qtd = coletarForaDaCurva(setorFiltradoSlug()).length;
        if (qtd === 0) return "";
        const corBotao = cor("--color-warning") || "#f59e0b";
        return (
            '<button type="button" data-abrir-outliers="1" style="margin-top:10px;padding:5px 10px;border-radius:6px;border:1px solid ' + corBotao +
            ";background:transparent;color:" + corBotao + ';cursor:pointer;font-size:12px;font-family:inherit;">' +
            "Ver fora da curva (" + qtd + ")</button>"
        );
    }

    function montarKpiCard(kpi) {
        if (kpi.type === "sector") {
            return (
                '<div class="kpi-box is-' + kpi.tone + '">' +
                '<p class="kpi-title">' + escaparHtml(kpi.title) + "</p>" +
                '<p class="kpi-sector">' + escaparHtml(kpi.sector) + "</p>" +
                '<span class="status-pill ' + classeStatus(kpi.status.tone) + '">' + escaparHtml(kpi.status.label) + "</span>" +
                '<p class="kpi-details">' + escaparHtml(kpi.details) + "</p>" +
                "</div>"
            );
        }

        if (kpi.type === "health") {
            const pontoCritico = kpi.scale && Array.isArray(kpi.scale.breakpoints)
                ? kpi.scale.breakpoints[0]
                : faixasAtuais.criticoAbaixoDe;
            const pontoEstavel = kpi.scale && Array.isArray(kpi.scale.breakpoints)
                ? kpi.scale.breakpoints[1]
                : faixasAtuais.estavelAPartirDe;

            const escalaHtml = kpi.scale
                ? (
                    '<div class="scale-bar"><span class="scale-marker" style="left: ' + kpi.scale.marker + '%;"></span></div>' +
                    '<div class="scale-labels">' +
                    '<span class="at-start">' + kpi.scale.labels[0] + "</span>" +
                    '<span style="left: ' + pontoCritico + '%;">' + kpi.scale.labels[1] + "</span>" +
                    '<span style="left: ' + pontoEstavel + '%;">' + kpi.scale.labels[2] + "</span>" +
                    '<span class="at-end">' + kpi.scale.labels[3] + "</span>" +
                    "</div>"
                )
                : "";

            return (
                '<div class="kpi-box is-' + kpi.tone + '">' +
                '<p class="kpi-title">' + escaparHtml(kpi.title) + "</p>" +
                '<div class="kpi-value-row">' +
                '<p class="kpi-result-medium">' + escaparHtml(kpi.value) + '<span class="kpi-unit"> ' + escaparHtml(kpi.unit) + "</span></p>" +
                '<span class="status-pill ' + classeStatus(kpi.status.tone) + '">' + escaparHtml(kpi.status.label) + "</span>" +
                "</div>" +
                '<p class="kpi-details">' + escaparHtml(kpi.details) + "</p>" +
                escalaHtml +
                montarBotaoOutliersKpi() +
                "</div>"
            );
        }

        if (kpi.type === "availability") {
            const statusHtml = kpi.status
                ? '<span class="status-pill ' + classeStatus(kpi.status.tone) + '">' + escaparHtml(kpi.status.label) + "</span>"
                : "";

            const progressoHtml = kpi.progress
                ? (
                    '<div class="progress-track">' +
                    '<div class="progress-fill" style="width: ' + kpi.progress.value + '%;"></div>' +
                    '<span class="progress-goal" style="left: ' + kpi.progress.goal + '%;"></span>' +
                    "</div>" +
                    '<div class="scale-labels">' +
                    '<span class="at-start">' + escaparHtml(kpi.progress.startLabel) + "</span>" +
                    '<span class="at-end">' + escaparHtml(kpi.progress.endLabel) + "</span>" +
                    "</div>"
                )
                : "";

            return (
                '<div class="kpi-box is-' + kpi.tone + '">' +
                '<p class="kpi-title">' + escaparHtml(kpi.title) + "</p>" +
                '<div class="kpi-value-row">' +
                '<p class="kpi-result-medium">' + escaparHtml(kpi.value) + "</p>" +
                statusHtml +
                "</div>" +
                '<p class="kpi-details">' + escaparHtml(kpi.details) + "</p>" +
                progressoHtml +
                "</div>"
            );
        }

        return (
            '<div class="kpi-box is-' + kpi.tone + '">' +
            '<p class="kpi-title">' + escaparHtml(kpi.title) + "</p>" +
            '<div class="kpi-value-row">' +
            '<p class="kpi-result-medium">' + escaparHtml(kpi.value) + "</p>" +
            '<span class="status-pill ' + classeStatus(kpi.status.tone) + '">' + escaparHtml(kpi.status.label) + "</span>" +
            "</div>" +
            '<p class="kpi-details">' + escaparHtml(kpi.details) + "</p>" +
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
                    escaparHtml(item.label) +
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
                    "<b>" + escaparHtml(item.label) + " · " + values[item.key] + "</b>" +
                    "</p>" +
                    '<p class="legend-help">' + escaparHtml(item.detail) + "</p>" +
                    "</div>"
                );
            })
            .join("");
    }

    /* ---------- tabela de CLPs ---------- */

    function aplicarScrollTabela(body) {
        const tabela = body.closest("table");
        if (!tabela || !tabela.parentElement) return;
        const wrapper = tabela.parentElement;
        wrapper.style.maxHeight = (ALTURA_CABECALHO_TABELA + LINHAS_VISIVEIS_TABELA * ALTURA_LINHA_TABELA) + "px";
        wrapper.style.overflowY = "auto";

        const fundo = corDeFundo(wrapper);
        tabela.querySelectorAll("thead th").forEach(function (th) {
            th.style.position = "sticky";
            th.style.top = "0";
            th.style.zIndex = "1";
            th.style.background = fundo;
        });
    }

    function renderRanking(rankingRows, rankingConfig) {
        const head = document.getElementById("ranking-head");
        const body = document.getElementById("ranking-body");
        const hint = document.getElementById("ranking-hint");
        const title = document.getElementById("ranking-title");

        title.textContent = rankingConfig.title;
        hint.textContent = rankingConfig.hint;

        head.innerHTML = "<tr>" + rankingConfig.columns.map(function (col) {
            return '<th scope="col">' + escaparHtml(col) + "</th>";
        }).join("") + "</tr>";

        if (!rankingRows.length) {
            body.innerHTML = '<tr><td colspan="' + rankingConfig.columns.length + '" class="empty-state">Sem CLPs para o filtro selecionado.</td></tr>';
            aplicarScrollTabela(body);
            return;
        }

        body.innerHTML = rankingRows.map(function (row) {
            const healthNum = arredondar1Casa(row.healthNum !== undefined ? row.healthNum : row.health);
            const semHealth = healthNum === null;
            const toneHealth = semHealth ? "warning" : faixaDoHealth(healthNum);
            const toneStatus = row.statusTone || toneHealth;
            const barra = semHealth ? 0 : Math.max(0, Math.min(100, healthNum));
            const healthTexto = semHealth ? "-" : healthNum.toFixed(1);
            const clicavel = !!row.idClp;
            const attrs = clicavel
                ? ' tabindex="0" data-id-clp="' + escaparHtml(row.idClp) + '"'
                : ' style="cursor:default"';

            return (
                '<tr class="ranking-row"' + attrs + ">" +
                '<td class="cell-strong">' + escaparHtml(row.nickname) + "</td>" +
                "<td>" + escaparHtml(row.sectorLabel || "-") + "</td>" +
                "<td>" + escaparHtml(row.model) + "</td>" +
                "<td>" +
                '<div class="health-cell">' +
                '<span class="health-value is-' + toneHealth + '">' + healthTexto + "</span>" +
                '<div class="health-track"><div class="health-fill bg-' + toneHealth + '" style="width: ' + barra + '%;"></div></div>' +
                "</div>" +
                "</td>" +
                '<td><span class="status-pill ' + classeStatus(toneStatus) + '">' + escaparHtml(row.status) + "</span></td>" +
                "<td>" + escaparHtml(row.alerts) + "</td>" +
                "<td>" + escaparHtml(row.component) + "</td>" +
                "</tr>"
            );
        }).join("");

        aplicarScrollTabela(body);
    }

    /* ---------- gráficos ---------- */

    const pluginFundoFaixas = {
        id: "fundoFaixas",
        beforeDatasetsDraw: function (chart) {
            const ctx = chart.ctx;
            const x = chart.scales.x;
            const inicio = x.getPixelForValue(0);
            const xCritico = x.getPixelForValue(faixasAtuais.criticoAbaixoDe);
            const xEstavel = x.getPixelForValue(faixasAtuais.estavelAPartirDe);
            const fim = x.getPixelForValue(100);
            chart.getDatasetMeta(0).data.forEach(function (barra) {
                const topo = barra.y - barra.height / 2;
                ctx.save();
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(inicio, topo, fim - inicio, barra.height, 5);
                else ctx.rect(inicio, topo, fim - inicio, barra.height);
                ctx.clip();
                ctx.fillStyle = cor("--zone-danger");
                ctx.fillRect(inicio, topo, xCritico - inicio, barra.height);
                ctx.fillStyle = cor("--zone-warning");
                ctx.fillRect(xCritico, topo, xEstavel - xCritico, barra.height);
                ctx.fillStyle = cor("--zone-positive");
                ctx.fillRect(xEstavel, topo, fim - xEstavel, barra.height);
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

    // Sempre os 5 piores setores da planta, independente do filtro de setor
    function renderGraficoSetores(sectorsConfig) {
        const lista = (sectorsConfig.items || [])
            .filter(function (s) { return numeroOuNull(s.health) !== null; })
            .sort(function (a, b) { return a.health - b.health; })
            .slice(0, 5);
        setoresAtuais = lista;
        document.getElementById("setores-total").textContent = "de " + sectorsConfig.totalSectors + " setores";
        const footerEl = document.getElementById("setores-footer");
        if (sectorsConfig.footer && sectorsConfig.footer.visible) {
            footerEl.hidden = false;
            footerEl.textContent = sectorsConfig.footer.text || "";
        } else {
            footerEl.hidden = true;
            footerEl.textContent = "";
        }
        const linkSetores = document.getElementById("setores-link");
        if (sectorsConfig.outlier && sectorsConfig.outlier.enabled) {
            linkSetores.hidden = false;
            linkSetores.textContent = sectorsConfig.outlier.detailsLinkLabel || "Ver detalhes dos fora da curva →";
        } else {
            linkSetores.hidden = true;
            linkSetores.textContent = "";
        }
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
        const totalPadrao = valores.reduce(function (acc, n) { return acc + n; }, 0);
        const totalInformado = numeroOuNull(frota.totalClps);
        const total = totalInformado !== null ? totalInformado : totalPadrao;
        const pctEstavel = total ? Math.round((frota.values.estavel / total) * 100) : 0;
        const semHealth = numeroOuNull(frota.semHealth) || 0;
        document.getElementById("frota-title").textContent = frota.title || "Situação da frota";
        document.getElementById("frota-total").textContent = String(total);
        let resumo =
            frota.summaryPrefix + " " + pctEstavel + "% dos " + total + " CLPs estão estáveis";
        if (semHealth > 0) {
            resumo += " · " + semHealth + " sem health no período";
        }
        document.getElementById("frota-resumo").textContent = resumo;
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

    /* ---------- cabeçalho / estrutura ---------- */

    function atualizarCabecalho(header) {
        document.getElementById("page-title").textContent = header.title;
        document.getElementById("last-update").textContent =
            header.lastUpdateText || (header.lastUpdatePrefix + " " + agoraHoraMinuto());
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

    function atualizarFaixas(data) {
        const faixas = data && data.meta ? data.meta.faixas : null;
        if (!faixas) {
            faixasAtuais = FAIXAS_PADRAO;
            return;
        }
        const critico = numeroOuNull(faixas.criticoAbaixoDe);
        const estavel = numeroOuNull(faixas.estavelAPartirDe);
        if (critico === null || estavel === null || estavel <= critico) {
            faixasAtuais = FAIXAS_PADRAO;
            return;
        }
        faixasAtuais = {
            criticoAbaixoDe: critico,
            estavelAPartirDe: estavel
        };
    }

    /* ---------- dados ---------- */

    // Plano B quando a API falha: tela vazia (sem números inventados), usando o adapter
    function montarDadosErro() {
        const dados = window.macroClpAdapter.buildSemDadosDashboardData();
        dados.header.lastUpdateText = "Não foi possível carregar os dados.";
        return dados;
    }

    async function buscarDadosBackend(periodo) {
        const idEmpresa = sessionStorage.getItem("ID_EMPRESA");
        if (!idEmpresa) {
            throw new Error("ID_EMPRESA não encontrado na sessão.");
        }
        const params = new URLSearchParams({
            idEmpresa: idEmpresa,
            periodo: periodo
        });
        const resposta = await fetch(MACRO_CLP_API_BASE + "?" + params.toString(), { method: "GET" });
        if (resposta.status === 404) {
            return window.macroClpAdapter.buildSemDadosDashboardData();
        }
        if (!resposta.ok) {
            throw new Error("Falha ao buscar macro CLP. HTTP " + resposta.status);
        }
        const json = await resposta.json();
        return window.macroClpAdapter.adaptGoldToDashboardData(json);
    }

    async function buscarDadosFixture() {
        const resposta = await fetch(FIXTURE_URL, { method: "GET" });
        if (!resposta.ok) {
            throw new Error("Falha ao buscar fixture. HTTP " + resposta.status);
        }
        const json = await resposta.json();
        const dados = window.macroClpAdapter.adaptGoldToDashboardData(json);
        dados.header.lastUpdateText = "dados de exemplo (fixture)";
        return dados;
    }

    async function carregarDados(periodo) {
        try {
            if (!window.macroClpAdapter) {
                throw new Error("macroClpAdapter não carregado.");
            }
            if (MODO_FIXTURE) {
                return await buscarDadosFixture();
            }
            return await buscarDadosBackend(periodo);
        } catch (erro) {
            console.warn("[Macro CLP] Falha ao buscar API. Exibindo tela sem dados.", erro);
            return montarDadosErro();
        }
    }

    async function recarregarPeriodo(periodo) {
        const requisicaoAtual = ++contadorRequisicao;
        const dados = await carregarDados(periodo);
        if (requisicaoAtual !== contadorRequisicao) return null;
        dadosBaseAtual = dados;
        return dados;
    }

    /* ---------- visões (Todos x setor) ---------- */

    function todasAsRows() {
        return (dadosBaseAtual.ranking && (dadosBaseAtual.ranking.allRows || dadosBaseAtual.ranking.rows)) || [];
    }

    function kpiGlobalDoSetor() {
        const kpis = dadosBaseAtual.kpis || [];
        return kpis.find(function (k) { return k.type === "sector"; }) || kpis[0];
    }

    function montarVisaoPorSetor(setorAlvo) {
        const rowsDoSetor = todasAsRows().filter(function (row) {
            const slugRow = row.sector ? row.sector : slugify(row.sectorLabel);
            return slugRow === setorAlvo;
        });

        const todosSetores = (dadosBaseAtual.sectorsChart && (dadosBaseAtual.sectorsChart.allSectors || dadosBaseAtual.sectorsChart.items)) || [];
        const infoSetor = todosSetores.find(function (s) {
            return (s.slug || slugify(s.name)) === setorAlvo;
        });

        let estavel = 0;
        let atencao = 0;
        let critico = 0;
        let offline = 0;
        let semHealth = 0;
        let somaHealth = 0;
        let qtdHealth = 0;

        rowsDoSetor.forEach(function (row) {
            const h = numeroOuNull(row.healthNum !== undefined ? row.healthNum : row.health);
            if (row.offline) offline += 1;
            if (h === null) {
                if (!row.offline) semHealth += 1;
                return;
            }
            somaHealth += h;
            qtdHealth += 1;
            if (!row.offline) {
                if (h < faixasAtuais.criticoAbaixoDe) critico += 1;
                else if (h < faixasAtuais.estavelAPartirDe) atencao += 1;
                else estavel += 1;
            }
        });

        const totalInfo = infoSetor ? numeroOuNull(infoSetor.total) : null;
        const totalClps = totalInfo !== null && totalInfo > 0 ? totalInfo : rowsDoSetor.length;
        const onlineInfo = infoSetor ? numeroOuNull(infoSetor.online) : null;
        const onlineClps = onlineInfo !== null ? onlineInfo : Math.max(0, totalClps - offline);
        const disponibilidadePct = totalClps > 0 ? Math.round((onlineClps / totalClps) * 100) : 0;

        const healthInfo = infoSetor ? arredondar1Casa(infoSetor.health) : null;
        const healthSetor = healthInfo !== null
            ? healthInfo
            : (qtdHealth > 0 ? arredondar1Casa(somaHealth / qtdHealth) : null);

        const nomeSetor = (infoSetor && infoSetor.name) ||
            (rowsDoSetor[0] && rowsDoSetor[0].sectorLabel) ||
            setorAlvo;

        const toneHealth = healthSetor === null ? "warning" : faixaDoHealth(healthSetor);
        const labelHealth = healthSetor === null ? "Sem dados" : rotuloStatusDoHealth(healthSetor);

        const kpisSetor = [
            // Setor mais preocupante: sempre o pior da planta
            kpiGlobalDoSetor(),
            {
                type: "health",
                tone: toneHealth,
                title: "Health médio do setor",
                value: healthSetor === null ? "-" : healthSetor,
                unit: "/100",
                status: { label: labelHealth, tone: toneHealth },
                details: "Média de " + qtdHealth + " CLPs com leitura no setor.",
                scale: {
                    marker: healthSetor === null ? 0 : Math.max(0, Math.min(100, healthSetor)),
                    breakpoints: [faixasAtuais.criticoAbaixoDe, faixasAtuais.estavelAPartirDe],
                    labels: ["0", String(faixasAtuais.criticoAbaixoDe), String(faixasAtuais.estavelAPartirDe), "100"]
                }
            },
            {
                type: "availability",
                tone: totalClps === 0
                    ? "warning"
                    : (disponibilidadePct < 40 ? "danger" : (disponibilidadePct < 80 ? "warning" : "positive")),
                title: "Disponibilidade do setor",
                value: totalClps === 0 ? "-" : disponibilidadePct + "%",
                details: onlineClps + " de " + totalClps + " CLPs estão online no setor."
            },
            {
                type: "criticalUnits",
                tone: critico > 0 ? "danger" : "positive",
                title: "CLPs críticos no setor",
                value: critico,
                status: critico > 0
                    ? { label: "Requer ação", tone: "danger" }
                    : { label: "Sob controle", tone: "positive" },
                details: "CLPs online com health abaixo de " + faixasAtuais.criticoAbaixoDe + " neste setor."
            }
        ];

        const frotaSetor = {
            title: "Situação da frota · " + nomeSetor,
            summaryPrefix: "Apenas",
            totalLabel: "CLPs",
            totalClps: totalClps,
            semHealth: semHealth,
            values: {
                estavel: estavel,
                atencao: atencao,
                critico: critico,
                offline: offline
            },
            legend: dadosBaseAtual.fleet.legend
        };

        return {
            header: dadosBaseAtual.header,
            filters: dadosBaseAtual.filters,
            kpis: kpisSetor,
            sectorsChart: dadosBaseAtual.sectorsChart,
            fleet: frotaSetor,
            ranking: {
                title: "Ranking de CLPs · " + nomeSetor,
                hint: HINT_RANKING,
                columns: dadosBaseAtual.ranking.columns,
                rows: rowsDoSetor
            },
            meta: dadosBaseAtual.meta
        };
    }

    function getDadosFiltrados(filters) {
        const setorAlvo = slugify(filters.sector);
        if (setorAlvo && setorAlvo !== "todos") {
            return montarVisaoPorSetor(setorAlvo);
        }

        return {
            header: dadosBaseAtual.header,
            filters: dadosBaseAtual.filters,
            kpis: dadosBaseAtual.kpis,
            sectorsChart: dadosBaseAtual.sectorsChart,
            fleet: dadosBaseAtual.fleet,
            ranking: {
                title: dadosBaseAtual.ranking.title,
                hint: HINT_RANKING,
                columns: dadosBaseAtual.ranking.columns,
                rows: todasAsRows()
            },
            meta: dadosBaseAtual.meta
        };
    }

    function renderDashboard(data) {
        atualizarFaixas(data);
        montarOpcoes("sector-filter", data.filters.sectors, state.sector);
        montarOpcoes("period-filter", data.filters.periods, state.period);
        atualizarCabecalho(data.header);
        renderKpis(data.kpis);
        renderGraficoSetores(data.sectorsChart);
        renderLegendaFrota(data.fleet);
        renderGraficoFrota(data.fleet);
        renderRanking(data.ranking.rows, data.ranking);
    }

    /* ---------- eventos ---------- */

    async function onChangeFiltros() {
        const periodoAnterior = state.period;
        const selectSetor = document.getElementById("sector-filter");
        const selectPeriodo = document.getElementById("period-filter");

        state.sector = selectSetor ? selectSetor.value : "todos";
        state.period = selectPeriodo ? selectPeriodo.value : "agora";

        if (state.period !== periodoAnterior) {
            const carregado = await recarregarPeriodo(state.period);
            if (!carregado) return;
            const setoresDisponiveis = dadosBaseAtual.filters && dadosBaseAtual.filters.sectors
                ? dadosBaseAtual.filters.sectors.map(function (item) { return slugify(item.value); })
                : ["todos"];
            if (setoresDisponiveis.indexOf(slugify(state.sector)) === -1) {
                state.sector = "todos";
            }
        }
        renderDashboard(getDadosFiltrados(state));
    }

    function bindEventos() {
        const filtroSetor = document.getElementById("sector-filter");
        const filtroPeriodo = document.getElementById("period-filter");
        const corpoRanking = document.getElementById("ranking-body");
        const linkForaCurva = document.getElementById("setores-link");
        const containerKpis = document.getElementById("kpi-container");

        if (filtroSetor) {
            filtroSetor.addEventListener("change", onChangeFiltros);
        }

        if (filtroPeriodo) {
            filtroPeriodo.addEventListener("change", onChangeFiltros);
        }

        // Link do gráfico de setores: fora da curva de toda a planta
        if (linkForaCurva) {
            linkForaCurva.addEventListener("click", function (evento) {
                evento.preventDefault();
                abrirPopupForaDaCurva(null);
            });
        }

        // Botão do card de Health: respeita o setor filtrado
        if (containerKpis) {
            containerKpis.addEventListener("click", function (evento) {
                const botao = evento.target.closest("[data-abrir-outliers]");
                if (botao) {
                    abrirPopupForaDaCurva(setorFiltradoSlug());
                }
            });
        }

        document.addEventListener("keydown", function (evento) {
            if (evento.key === "Escape") {
                fecharPopupForaDaCurva();
            }
        });

        if (corpoRanking) {
            corpoRanking.addEventListener("click", function (evento) {
                const linha = evento.target.closest("tr.ranking-row");
                if (linha && linha.dataset.idClp) {
                    abrirMicroClp(linha.dataset.idClp);
                }
            });

            corpoRanking.addEventListener("keydown", function (evento) {
                if (evento.key === "Enter" || evento.key === " ") {
                    const linha = evento.target.closest("tr.ranking-row");
                    if (linha && linha.dataset.idClp) {
                        evento.preventDefault();
                        abrirMicroClp(linha.dataset.idClp);
                    }
                }
            });
        }
    }

    async function initDashboardMacroCLP() {
        Chart.defaults.font.family = FONTE;
        const carregado = await recarregarPeriodo(state.period);
        if (!carregado) return;
        montarEstruturaEstatica(dadosBaseAtual);
        bindEventos();
        renderDashboard(getDadosFiltrados(state));
    }

    document.addEventListener("DOMContentLoaded", function () {
        const fontePronta = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        fontePronta.then(initDashboardMacroCLP);
    });
})();
