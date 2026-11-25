const mockDashboardData = {
    header: {
        title: "Visão macro da planta",
        lastUpdatePrefix: "Última atualização às"
    },
    filters: {
        sectors: [
            { value: "todos", label: "Setor: Todos" },
            { value: "usinagem", label: "Setor: Usinagem" },
            { value: "pintura", label: "Setor: Pintura" },
            { value: "fundicao", label: "Setor: Fundição" },
            { value: "montagem", label: "Setor: Montagem" },
            { value: "solda", label: "Setor: Solda" }
        ],
        periods: [
            { value: "24h", label: "Últimas 24 horas" },
            { value: "7d", label: "Últimos 7 dias" },
            { value: "30d", label: "Últimos 30 dias" }
        ]
    },
    kpis: [
        {
            type: "sector",
            tone: "danger",
            title: "Setor mais preocupante",
            sector: "USINAGEM",
            status: { label: "Crítico", tone: "danger" },
            details: "Setor com menor health médio (32 de 100)."
        },
        {
            type: "health",
            tone: "warning",
            title: "Health geral da planta",
            value: 47,
            unit: "/100",
            status: { label: "Atenção", tone: "warning" },
            details: "health score médio dos seus 20 CLPs online. "
        },
        {
            type: "availability",
            tone: "warning",
            title: "Disponibilidade",
            value: "67%",
            details: "20 de 30 CLPs estão online."
        },
        {
            type: "criticalUnits",
            tone: "danger",
            title: "CLPs críticos",
            value: 7,
            status: { label: "Requer ação", tone: "danger" },
            details: "Risco de microparada ou parada da linha."
        }
    ],
    sectorsChart: {
        title: "5 setores com pior health médio",
        subtitle: "Média de health dos CLPs online de cada setor, de 0 a 100",
        totalSectors: 42,
        minOtherHealth: 62,
        linkLabel: "Ver todos os setores e valores →",
        items: [
            { name: "USINAGEM", health: 32, online: 5, total: 8 },
            { name: "PINTURA", health: 44, online: 5, total: 7 },
            { name: "FUNDIÇÃO", health: 49, online: 4, total: 6 },
            { name: "MONTAGEM", health: 58, online: 4, total: 6 },
            { name: "SOLDA", health: 61, online: 5, total: 5 }
        ],
        outlier: {
            enabled: true,
            message: "Há CLP fora da curva em USINAGEM.",
            detailsLinkLabel: "Ver detalhes dos fora da curva →"
        },
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
        values: {
            estavel: 7,
            atencao: 6,
            critico: 7,
            offline: 10
        },
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
        rows: [
            {
                nickname: "CLP-07",
                sectorLabel: "USINAGEM",
                model: "SIEMENS-S7-1200",
                health: 18,
                status: "Crítico",
                statusTone: "danger",
                alerts: 15,
                component: "CPU",
                sector: "usinagem"
            },
            {
                nickname: "CLP-01",
                sectorLabel: "USINAGEM",
                model: "SIEMENS-S7-1500",
                health: 40,
                status: "Atenção",
                statusTone: "warning",
                alerts: 12,
                component: "CPU",
                sector: "usinagem"
            },
            {
                nickname: "CLP-02",
                sectorLabel: "PINTURA",
                model: "COMPACT-LOGIX",
                health: 60,
                status: "Estável",
                statusTone: "positive",
                alerts: 7,
                component: "CPU",
                sector: "pintura"
            },
            {
                nickname: "CLP-03",
                sectorLabel: "MONTAGEM",
                model: "MICRO800",
                health: 75,
                status: "Estável",
                statusTone: "positive",
                alerts: 4,
                component: "RAM",
                sector: "montagem"
            }
        ]
    }
};
