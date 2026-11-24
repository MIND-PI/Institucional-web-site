;(function () {
    const FAIXAS_PADRAO = {
        criticoAbaixoDe: 40,
        estavelAPartirDe: 60
    };

    const STALE_MINUTES = 60;

    function numero(value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }

    function inteiro(value, fallback) {
        const n = Number(value);
        return Number.isFinite(n) ? Math.round(n) : fallback;
    }

    function normalizarFaixas(goldJson) {
        const faixas = goldJson && goldJson.faixas ? goldJson.faixas : {};
        const critico = numero(faixas.criticoAbaixoDe);
        const estavel = numero(faixas.estavelAPartirDe);

        if (critico === null || estavel === null || estavel <= critico) {
            return FAIXAS_PADRAO;
        }

        return {
            criticoAbaixoDe: critico,
            estavelAPartirDe: estavel
        };
    }

    function tonePorHealth(health, faixas) {
        const n = numero(health);
        if (n === null) return "warning";
        if (n < faixas.criticoAbaixoDe) return "danger";
        if (n < faixas.estavelAPartirDe) return "warning";
        return "positive";
    }

    function statusPorHealth(health, faixas) {
        const tone = tonePorHealth(health, faixas);
        if (tone === "danger") return "Crítico";
        if (tone === "warning") return "Atenção";
        return "Estável";
    }

    function slugify(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }

    function ehSetorValido(nome) {
        return slugify(nome) !== "sem-setor";
    }

    function formatarHoraAtualizacao(geradoEm, options) {
        const data = new Date(geradoEm);
        if (Number.isNaN(data.getTime())) {
            return "Última atualização indisponível";
        }

        const staleMinutes = options && Number.isFinite(options.staleMinutes)
            ? Number(options.staleMinutes)
            : STALE_MINUTES;
        const agora = options && options.now ? new Date(options.now) : new Date();
        const diffMs = agora.getTime() - data.getTime();
        const diffMin = Math.max(0, Math.floor(diffMs / 60000));
        const estaVelho = diffMin > staleMinutes;

        const horario = data.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        if (estaVelho) {
            return "Última atualização em " + horario + " · dado possivelmente desatualizado (" + diffMin + " min)";
        }

        return "Última atualização em " + horario;
    }

    function criarFiltrosSetor(rows) {
        const filtros = [{ value: "todos", label: "Setor: Todos" }];
        const vistos = { todos: true };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const setor = row.sectorLabel || "-";
            const value = row.sector || slugify(setor);
            if (!value || vistos[value]) continue;
            vistos[value] = true;
            filtros.push({ value: value, label: "Setor: " + setor });
        }

        return filtros;
    }

    function montarOutlier(setoresDoGrafico) {
        const nomes = [];

        for (let i = 0; i < setoresDoGrafico.length; i++) {
            const setor = setoresDoGrafico[i];
            const foraDaCurva = Array.isArray(setor.foraDaCurva) ? setor.foraDaCurva : [];
            if (foraDaCurva.length > 0) {
                nomes.push(setor.nome || "setor sem nome");
            }
        }

        if (nomes.length === 0) {
            return {
                enabled: false,
                message: "",
                detailsLinkLabel: "Ver detalhes dos fora da curva →"
            };
        }

        if (nomes.length === 1) {
            return {
                enabled: true,
                message: "Há CLP fora da curva em " + nomes[0] + ".",
                detailsLinkLabel: "Ver detalhes dos fora da curva →"
            };
        }

        if (nomes.length === 2) {
            return {
                enabled: true,
                message: "Há CLP fora da curva em " + nomes[0] + " e " + nomes[1] + ".",
                detailsLinkLabel: "Ver detalhes dos fora da curva →"
            };
        }

        return {
            enabled: true,
            message: "Há CLP fora da curva em " + nomes[0] + ", " + nomes[1] + " e mais " + (nomes.length - 2) + ".",
            detailsLinkLabel: "Ver detalhes dos fora da curva →"
        };
    }

    function ordenarSetoresPorHealth(a, b) {
        const sa = numero(a.health);
        const sb = numero(b.health);

        if (sa === null && sb !== null) return 1;
        if (sa !== null && sb === null) return -1;
        if (sa === null && sb === null) return 0;
        return sa - sb;
    }

    function montarRowsRanking(goldJson, faixas) {
        const ranking = Array.isArray(goldJson && goldJson.ranking) ? goldJson.ranking : [];
        const rows = [];

        for (let i = 0; i < ranking.length; i++) {
            const item = ranking[i] || {};
            const health = numero(item.health);
            const tone = tonePorHealth(health, faixas);
            const statusBase = item.status || statusPorHealth(health, faixas);
            const offline = item.online === false;

            rows.push({
                nickname: item.apelido || ("CLP-" + (item.idClp || "")),
                sectorLabel: item.setor || "Sem setor",
                model: item.modelo || "Sem modelo",
                health: health === null ? "-" : health,
                status: offline ? (statusBase + " · offline") : statusBase,
                statusTone: tone,
                alerts: inteiro(item.alertas, 0),
                component: item.componenteMaisProblematico || "-",
                sector: slugify(item.setor || "sem-setor")
            });
        }

        return rows;
    }

    function montarSetores(goldJson) {
        const setores = Array.isArray(goldJson && goldJson.setores) ? goldJson.setores : [];
        const validos = [];

        for (let i = 0; i < setores.length; i++) {
            const setor = setores[i] || {};
            if (ehSetorValido(setor.nome)) {
                validos.push(setor);
            }
        }

        validos.sort(ordenarSetoresPorHealth);

        const comHealth = [];
        for (let i = 0; i < validos.length; i++) {
            if (numero(validos[i].health) !== null) {
                comHealth.push(validos[i]);
            }
        }

        const piores = comHealth.slice(0, 5);

        const items = [];
        for (let i = 0; i < piores.length; i++) {
            const item = piores[i];
            items.push({
                name: item.nome,
                health: numero(item.health),
                online: inteiro(item.online, 0),
                total: inteiro(item.total, 0)
            });
        }

        const outrosSetores = validos.slice(piores.length);
        const outrosComHealth = [];
        for (let i = 0; i < outrosSetores.length; i++) {
            const health = numero(outrosSetores[i].health);
            if (health !== null) {
                outrosComHealth.push(health);
            }
        }

        let footerVisible = true;
        let footerText = "";
        let minOtherHealth = null;
        if (outrosSetores.length <= 0) {
            footerVisible = false;
        } else if (outrosComHealth.length <= 0) {
            footerText = "Os outros " + outrosSetores.length + " setores ainda não têm health";
        } else {
            minOtherHealth = Math.min.apply(null, outrosComHealth);
            footerText = "Os outros " + outrosSetores.length + " setores estão com health médio ≥ " + minOtherHealth;
        }

        return {
            totalSectors: validos.length,
            minOtherHealth: minOtherHealth,
            otherSectorsCount: outrosSetores.length,
            items: items,
            footer: {
                visible: footerVisible,
                text: footerText
            },
            outlier: montarOutlier(piores)
        };
    }

    function montarKpis(goldJson, setoresChart, faixas) {
        const kpis = (goldJson && goldJson.kpis) || {};
        const total = inteiro(kpis.clpsTotal, 0);
        const online = inteiro(kpis.clpsOnline, 0);
        const disponibilidade = numero(kpis.disponibilidadePct);
        const disponibilidadeInt = disponibilidade === null ? 0 : Math.round(disponibilidade);
        const healthGeral = numero(kpis.healthGeral);
        const healthGeralStatus = kpis.healthGeralStatus || statusPorHealth(healthGeral, faixas);

        let setorMaisPreocupante = null;
        if (setoresChart.items.length > 0) {
            setorMaisPreocupante = setoresChart.items[0];
        }

        return [
            {
                type: "sector",
                tone: setorMaisPreocupante ? tonePorHealth(setorMaisPreocupante.health, faixas) : "warning",
                title: "Setor mais preocupante",
                sector: setorMaisPreocupante ? setorMaisPreocupante.name : "Sem dados",
                status: {
                    label: setorMaisPreocupante ? statusPorHealth(setorMaisPreocupante.health, faixas) : "Sem dados",
                    tone: setorMaisPreocupante ? tonePorHealth(setorMaisPreocupante.health, faixas) : "warning"
                },
                details: setorMaisPreocupante
                    ? ("Setor com menor health médio (" + setorMaisPreocupante.health + " de 100).")
                    : "Sem dados de setor para o período selecionado."
            },
            {
                type: "health",
                tone: tonePorHealth(healthGeral, faixas),
                title: "Health geral da planta",
                value: healthGeral === null ? "-" : healthGeral,
                unit: "/100",
                status: {
                    label: healthGeralStatus,
                    tone: tonePorHealth(healthGeral, faixas)
                },
                details: "health score médio dos seus " + online + " CLPs online.",
                scale: {
                    marker: healthGeral === null ? 0 : Math.max(0, Math.min(100, healthGeral)),
                    breakpoints: [faixas.criticoAbaixoDe, faixas.estavelAPartirDe],
                    labels: [
                        "0",
                        String(faixas.criticoAbaixoDe),
                        String(faixas.estavelAPartirDe),
                        "100"
                    ]
                }
            },
            {
                type: "availability",
                tone: tonePorHealth(disponibilidadeInt, {
                    criticoAbaixoDe: 40,
                    estavelAPartirDe: 80
                }),
                title: "Disponibilidade",
                value: disponibilidadeInt + "%",
                details: online + " de " + total + " CLPs estão online."
            },
            {
                type: "criticalUnits",
                tone: "danger",
                title: "CLPs críticos",
                value: inteiro(kpis.clpsCriticos, 0),
                status: { label: "Requer ação", tone: "danger" },
                details: "Risco de microparada ou parada da linha."
            }
        ];
    }

    function adaptGoldToDashboardData(goldJson, options) {
        const faixas = normalizarFaixas(goldJson || {});
        const rankingRows = montarRowsRanking(goldJson || {}, faixas);
        const setoresChartBase = montarSetores(goldJson || {});
        const kpis = montarKpis(goldJson || {}, setoresChartBase, faixas);
        const frota = (goldJson && goldJson.frota) || {};
        const totalClps = inteiro(goldJson && goldJson.kpis ? goldJson.kpis.clpsTotal : null, 0);
        const semHealth = inteiro(frota.semHealth, 0);

        const legendaFaixas = [
            { label: "Crítico (abaixo de " + faixas.criticoAbaixoDe + ")", tone: "danger" },
            { label: "Atenção (" + faixas.criticoAbaixoDe + " a " + (faixas.estavelAPartirDe - 1) + ")", tone: "warning" },
            { label: "Bom (" + faixas.estavelAPartirDe + " ou mais)", tone: "positive" }
        ];

        return {
            header: {
                title: "Visão macro da planta",
                lastUpdatePrefix: "Última atualização às",
                lastUpdateText: formatarHoraAtualizacao(goldJson && goldJson.geradoEm, options || {})
            },
            filters: {
                sectors: criarFiltrosSetor(rankingRows),
                periods: [
                    { value: "agora", label: "Agora" },
                    { value: "7-dias", label: "Últimos 7 dias" },
                    { value: "30-dias", label: "Últimos 30 dias" }
                ]
            },
            kpis: kpis,
            sectorsChart: {
                title: "5 setores com pior health médio",
                subtitle: "Média de health dos CLPs online de cada setor, de 0 a 100",
                totalSectors: setoresChartBase.totalSectors,
                minOtherHealth: setoresChartBase.minOtherHealth,
                linkLabel: "Ver todos os setores e valores →",
                items: setoresChartBase.items,
                footer: setoresChartBase.footer,
                otherSectorsCount: setoresChartBase.otherSectorsCount,
                outlier: setoresChartBase.outlier,
                legend: legendaFaixas
            },
            fleet: {
                title: "Situação da frota",
                summaryPrefix: "Apenas",
                totalLabel: "CLPs",
                totalClps: totalClps,
                semHealth: semHealth,
                values: {
                    estavel: inteiro(frota.estavel, 0),
                    atencao: inteiro(frota.atencao, 0),
                    critico: inteiro(frota.critico, 0),
                    offline: inteiro(frota.offline, 0)
                },
                legend: [
                    { key: "estavel", label: "Estável", detail: "health de " + faixas.estavelAPartirDe + " ou mais", tone: "positive" },
                    { key: "atencao", label: "Atenção", detail: "health de " + faixas.criticoAbaixoDe + " a " + (faixas.estavelAPartirDe - 1), tone: "warning" },
                    { key: "critico", label: "Crítico", detail: "health abaixo de " + faixas.criticoAbaixoDe, tone: "danger" },
                    { key: "offline", label: "Offline", detail: "sem comunicação", tone: "offline" }
                ]
            },
            ranking: {
                title: "Ranking de CLPs",
                hint: "Do menor para o maior health score · clique em uma linha para ver o detalhe",
                columns: ["Apelido", "Setor", "Modelo", "Health médio", "Status", "Alertas", "Componente mais problemático"],
                rows: rankingRows
            },
            meta: {
                faixas: faixas
            }
        };
    }

    function buildSemDadosDashboardData() {
        return {
            header: {
                title: "Visão macro da planta",
                lastUpdatePrefix: "Última atualização às",
                lastUpdateText: "Sem dados para este período."
            },
            filters: {
                sectors: [{ value: "todos", label: "Setor: Todos" }],
                periods: [
                    { value: "agora", label: "Agora" },
                    { value: "7-dias", label: "Últimos 7 dias" },
                    { value: "30-dias", label: "Últimos 30 dias" }
                ]
            },
            kpis: [
                {
                    type: "sector",
                    tone: "warning",
                    title: "Setor mais preocupante",
                    sector: "Sem dados",
                    status: { label: "Sem dados", tone: "warning" },
                    details: "Sem dados de setor para o período selecionado."
                },
                {
                    type: "health",
                    tone: "warning",
                    title: "Health geral da planta",
                    value: "-",
                    unit: "/100",
                    status: { label: "Sem dados", tone: "warning" },
                    details: "Sem dados de health para o período selecionado."
                },
                {
                    type: "availability",
                    tone: "warning",
                    title: "Disponibilidade",
                    value: "-",
                    details: "Sem dados de disponibilidade para o período selecionado."
                },
                {
                    type: "criticalUnits",
                    tone: "warning",
                    title: "CLPs críticos",
                    value: 0,
                    status: { label: "Sem dados", tone: "warning" },
                    details: "Sem dados de alertas para o período selecionado."
                }
            ],
            sectorsChart: {
                title: "5 setores com pior health médio",
                subtitle: "Média de health dos CLPs online de cada setor, de 0 a 100",
                totalSectors: 0,
                minOtherHealth: null,
                linkLabel: "Ver todos os setores e valores →",
                items: [],
                footer: { visible: false, text: "" },
                otherSectorsCount: 0,
                outlier: { enabled: false, message: "", detailsLinkLabel: "Ver detalhes dos fora da curva →" },
                legend: [
                    { label: "Crítico (abaixo de 40)", tone: "danger" },
                    { label: "Atenção (40 a 59)", tone: "warning" },
                    { label: "Bom (60 ou mais)", tone: "positive" }
                ]
            },
            fleet: {
                title: "Situação da frota",
                summaryPrefix: "Apenas",
                totalLabel: "CLPs",
                totalClps: 0,
                semHealth: 0,
                values: { estavel: 0, atencao: 0, critico: 0, offline: 0 },
                legend: [
                    { key: "estavel", label: "Estável", detail: "health de 60 ou mais", tone: "positive" },
                    { key: "atencao", label: "Atenção", detail: "health de 40 a 59", tone: "warning" },
                    { key: "critico", label: "Crítico", detail: "health abaixo de 40", tone: "danger" },
                    { key: "offline", label: "Offline", detail: "sem comunicação", tone: "offline" }
                ]
            },
            ranking: {
                title: "Ranking de CLPs",
                hint: "Do menor para o maior health score · clique em uma linha para ver o detalhe",
                columns: ["Apelido", "Setor", "Modelo", "Health médio", "Status", "Alertas", "Componente mais problemático"],
                rows: []
            },
            meta: {
                faixas: FAIXAS_PADRAO
            }
        };
    }

    window.macroClpAdapter = {
        adaptGoldToDashboardData: adaptGoldToDashboardData,
        buildSemDadosDashboardData: buildSemDadosDashboardData
    };
})();
