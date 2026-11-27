;(function () {
    const FAIXAS_PADRAO = {
        criticoAbaixoDe: 40,
        estavelAPartirDe: 60
    };

    const STALE_MINUTES = 60;
    const HINT_RANKING = "Do menor para o maior health · role para ver todos · clique em uma linha para ver o detalhe";
    const COLUNAS_RANKING = ["Apelido", "Setor", "Modelo", "Health médio", "Status", "Alertas", "Componente mais problemático"];

    // null/undefined/"" NÃO viram 0
    function numero(value) {
        if (value === null || value === undefined || value === "") return null;
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }

    function inteiro(value, fallback) {
        const n = numero(value);
        return n === null ? fallback : Math.round(n);
    }

    function arredondar1Casa(valor) {
        if (valor === null || valor === undefined || !Number.isFinite(valor)) return null;
        return Math.round(valor * 10) / 10;
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
        if (!geradoEm || Number.isNaN(data.getTime())) {
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

    function criarFiltrosSetor(goldJson, rows) {
        const filtros = [{ value: "todos", label: "Setor: Todos" }];
        const vistos = { todos: true };

        const setoresGold = Array.isArray(goldJson && goldJson.setores) ? goldJson.setores : [];
        for (let i = 0; i < setoresGold.length; i++) {
            const nome = setoresGold[i] && setoresGold[i].nome;
            if (!nome || !ehSetorValido(nome)) continue;
            const value = slugify(nome);
            if (!value || vistos[value]) continue;
            vistos[value] = true;
            filtros.push({ value: value, label: "Setor: " + nome });
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const setor = row.sectorLabel || "-";
            if (!ehSetorValido(setor)) continue;
            const value = row.sector || slugify(setor);
            if (!value || vistos[value]) continue;
            vistos[value] = true;
            filtros.push({ value: value, label: "Setor: " + setor });
        }

        return filtros;
    }

    function montarOutlier(setoresParaChecar) {
        const nomes = [];
        const itens = [];

        for (let i = 0; i < setoresParaChecar.length; i++) {
            const setor = setoresParaChecar[i];
            const foraDaCurva = Array.isArray(setor.foraDaCurva) ? setor.foraDaCurva : [];
            if (foraDaCurva.length > 0) {
                nomes.push(setor.nome || "setor sem nome");
                for (let j = 0; j < foraDaCurva.length; j++) {
                    const clp = foraDaCurva[j] || {};
                    const nomeSetor = clp.setor || setor.nome || "-";
                    itens.push({
                        idClp: clp.idClp ?? clp.id_clp ?? clp.id ?? "",
                        apelido: clp.apelido || clp.nickname || clp.nome || "CLP sem nome",
                        setor: nomeSetor,
                        setorSlug: slugify(nomeSetor),
                        health: arredondar1Casa(numero(clp.health))
                    });
                }
            }
        }

        const rotuloLink = "Ver detalhes dos fora da curva →";

        if (nomes.length === 0) {
            return { enabled: false, message: "", detailsLinkLabel: rotuloLink, items: [] };
        }

        let mensagem;
        if (nomes.length === 1) {
            mensagem = "Há CLP fora da curva em " + nomes[0] + ".";
        } else if (nomes.length === 2) {
            mensagem = "Há CLP fora da curva em " + nomes[0] + " e " + nomes[1] + ".";
        } else {
            mensagem = "Há CLP fora da curva em " + nomes[0] + ", " + nomes[1] + " e mais " + (nomes.length - 2) + ".";
        }

        return { enabled: true, message: mensagem, detailsLinkLabel: rotuloLink, items: itens };
    }

    function ordenarSetoresPorHealth(a, b) {
        const sa = numero(a.health);
        const sb = numero(b.health);

        if (sa === null && sb !== null) return 1;
        if (sa !== null && sb === null) return -1;
        if (sa === null && sb === null) return 0;
        return sa - sb;
    }

    // Menor health primeiro. Só quem NÃO tem health vai ao final.
    function ordenarRowsRanking(rows) {
        return rows.slice().sort(function (a, b) {
            const ha = numero(a.healthNum);
            const hb = numero(b.healthNum);

            if (ha === null && hb !== null) return 1;
            if (ha !== null && hb === null) return -1;
            if (ha !== null && ha !== hb) return ha - hb;
            return inteiro(b.alerts, 0) - inteiro(a.alerts, 0);
        });
    }

    function montarRowsRanking(goldJson, faixas) {
        const ranking = Array.isArray(goldJson && goldJson.ranking) ? goldJson.ranking : [];
        const rows = [];

        for (let i = 0; i < ranking.length; i++) {
            const item = ranking[i] || {};
            const health = arredondar1Casa(numero(item.health));
            const semHealth = health === null;
            const idClpRaw = numero(item.idClp ?? item.id_clp);
            const idClp = idClpRaw !== null && Number.isInteger(idClpRaw) && idClpRaw > 0 ? idClpRaw : null;
            const offline = item.online === false || String(item.status || "").toLowerCase() === "offline";
            const toneHealth = semHealth ? null : tonePorHealth(health, faixas);
            const tone = offline ? "offline" : (toneHealth || "warning");
            const statusBase = item.status || (offline ? "Offline" : (semHealth ? "Sem health" : statusPorHealth(health, faixas)));
            const statusTexto = offline && !/offline/i.test(statusBase)
                ? (statusBase + " · offline")
                : statusBase;

            rows.push({
                idClp: idClp,
                nickname: item.apelido || (idClp ? "CLP-" + idClp : "CLP sem nome"),
                sectorLabel: item.setor || "Sem setor",
                model: item.modelo || "Sem modelo",
                health: semHealth ? "-" : health,
                healthNum: health,
                healthTone: toneHealth,
                status: statusTexto,
                statusTone: tone,
                offline: offline,
                alerts: inteiro(item.alertas, 0),
                component: item.componenteMaisProblematico || "-",
                sector: slugify(item.setor || "sem-setor")
            });
        }

        return ordenarRowsRanking(rows);
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

        const comHealth = validos.filter(function (s) { return numero(s.health) !== null; });

        // Top 5 piores setores gerais da planta (nunca depende do filtro)
        const pioresGerais = comHealth.slice(0, 5);

        function paraItem(item) {
            return {
                name: item.nome,
                slug: slugify(item.nome),
                health: arredondar1Casa(numero(item.health)),
                online: inteiro(item.online, 0),
                total: inteiro(item.total, 0),
                foraDaCurva: Array.isArray(item.foraDaCurva) ? item.foraDaCurva : []
            };
        }

        const items = pioresGerais.map(paraItem);

        const outrosSetores = validos.filter(function (s) { return pioresGerais.indexOf(s) === -1; });
        const outrosComHealth = [];
        for (let i = 0; i < outrosSetores.length; i++) {
            const health = arredondar1Casa(numero(outrosSetores[i].health));
            if (health !== null) outrosComHealth.push(health);
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
            allSectors: validos.map(paraItem),
            footer: { visible: footerVisible, text: footerText },
            outlier: montarOutlier(validos)
        };
    }

    function montarKpis(goldJson, setoresChart, faixas) {
        const kpis = (goldJson && goldJson.kpis) || {};
        const total = inteiro(kpis.clpsTotal, 0);
        const online = inteiro(kpis.clpsOnline, 0);
        const naMedia = inteiro(kpis.clpsNaMedia, online);
        const disponibilidade = numero(kpis.disponibilidadePct);
        const disponibilidadeInt = disponibilidade === null ? 0 : Math.round(disponibilidade);
        const healthGeral = arredondar1Casa(numero(kpis.healthGeral));
        const healthGeralStatus = kpis.healthGeralStatus || statusPorHealth(healthGeral, faixas);
        const criticosOnline = inteiro(kpis.clpsCriticos, 0);

        // Setor mais preocupante: sempre o pior da planta, independente do filtro
        const setorMaisPreocupante = setoresChart.items.length > 0 ? setoresChart.items[0] : null;
        const toneSetor = setorMaisPreocupante ? tonePorHealth(setorMaisPreocupante.health, faixas) : "warning";

        return [
            {
                type: "sector",
                tone: toneSetor,
                title: "Setor mais preocupante",
                sector: setorMaisPreocupante ? setorMaisPreocupante.name : "Sem dados",
                status: {
                    label: setorMaisPreocupante ? statusPorHealth(setorMaisPreocupante.health, faixas) : "Sem dados",
                    tone: toneSetor
                },
                details: setorMaisPreocupante
                    ? ("Setor com menor health médio (" + setorMaisPreocupante.health + " de 100).")
                    : "Sem dados de setor para o período selecionado."
            },
            {
                type: "health",
                tone: healthGeral === null ? "warning" : tonePorHealth(healthGeral, faixas),
                title: "Health geral da planta",
                value: healthGeral === null ? "-" : healthGeral,
                unit: "/100",
                status: {
                    label: healthGeral === null ? "Sem dados" : healthGeralStatus,
                    tone: healthGeral === null ? "warning" : tonePorHealth(healthGeral, faixas)
                },
                details: "Média de " + naMedia + " CLPs com dados no período.",
                scale: {
                    marker: healthGeral === null ? 0 : Math.max(0, Math.min(100, healthGeral)),
                    breakpoints: [faixas.criticoAbaixoDe, faixas.estavelAPartirDe],
                    labels: ["0", String(faixas.criticoAbaixoDe), String(faixas.estavelAPartirDe), "100"]
                }
            },
            {
                type: "availability",
                tone: tonePorHealth(disponibilidadeInt, { criticoAbaixoDe: 40, estavelAPartirDe: 80 }),
                title: "Disponibilidade",
                value: disponibilidadeInt + "%",
                details: online + " de " + total + " CLPs estão online agora."
            },
            {
                type: "criticalUnits",
                tone: criticosOnline > 0 ? "danger" : "positive",
                title: "CLPs críticos",
                value: criticosOnline,
                status: criticosOnline > 0
                    ? { label: "Requer ação", tone: "danger" }
                    : { label: "Sob controle", tone: "positive" },
                details: "CLPs online com health abaixo de " + faixas.criticoAbaixoDe + ". Risco de parada."
            }
        ];
    }

    function periodosPadrao() {
        return [
            { value: "agora", label: "Agora" },
            { value: "7-dias", label: "Últimos 7 dias" },
            { value: "30-dias", label: "Últimos 30 dias" }
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
            { label: "Estável (" + faixas.estavelAPartirDe + " ou mais)", tone: "positive" }
        ];

        return {
            header: {
                title: "Visão macro da planta",
                lastUpdatePrefix: "Última atualização às",
                lastUpdateText: formatarHoraAtualizacao(goldJson && goldJson.geradoEm, options || {})
            },
            filters: {
                sectors: criarFiltrosSetor(goldJson || {}, rankingRows),
                periods: periodosPadrao()
            },
            kpis: kpis,
            sectorsChart: {
                title: "5 setores com pior health médio",
                subtitle: "Média de health dos CLPs de cada setor, de 0 a 100",
                totalSectors: setoresChartBase.totalSectors,
                minOtherHealth: setoresChartBase.minOtherHealth,
                linkLabel: "Ver todos os setores e valores →",
                items: setoresChartBase.items,
                allSectors: setoresChartBase.allSectors,
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
                hint: HINT_RANKING,
                columns: COLUNAS_RANKING,
                // Todos os CLPs, do pior para o melhor. A tela decide quantos mostrar (scroll).
                rows: rankingRows,
                allRows: rankingRows
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
                periods: periodosPadrao()
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
                subtitle: "Média de health dos CLPs de cada setor, de 0 a 100",
                totalSectors: 0,
                minOtherHealth: null,
                linkLabel: "Ver todos os setores e valores →",
                items: [],
                allSectors: [],
                footer: { visible: false, text: "" },
                otherSectorsCount: 0,
                outlier: { enabled: false, message: "", detailsLinkLabel: "Ver detalhes dos fora da curva →", items: [] },
                legend: [
                    { label: "Crítico (abaixo de 40)", tone: "danger" },
                    { label: "Atenção (40 a 59)", tone: "warning" },
                    { label: "Estável (60 ou mais)", tone: "positive" }
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
                hint: HINT_RANKING,
                columns: COLUNAS_RANKING,
                rows: [],
                allRows: []
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
