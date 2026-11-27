// ===== CONTROLLER: recebe o pedido, valida e responde =====
const macroClpModel = require("../models/macroClpModel");

async function obterMacroClp(req, res) {
    // 1. Lê os parâmetros da URL
    const periodo = req.query.periodo || "agora";    // agora | 7-dias | 30-dias
    const idEmpresa = req.query.idEmpresa;

    // 2. Valida: idEmpresa só pode ter números inteiros positivos (ele entra no caminho do arquivo no S3)
    if (!idEmpresa) {
        return res.status(400).json({ message: "idEmpresa inválido." });
    }

    const id = Number(idEmpresa);
    if (Number.isNaN(id) || !Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "idEmpresa inválido." });
    }

    if (!macroClpModel.PERIODOS_VALIDOS.includes(periodo)) {
        return res.status(400).json({ message: "Período inválido. Use: agora, 7-dias ou 30-dias." });
    }

    // 3. Busca os dados e responde
    try {
        const dados = await macroClpModel.buscarUltimoResultado(id, periodo);

        if (dados === null) {
            return res.status(404).json({
                semDados: true,
                message: "Ainda não há dados para essa empresa e período."
            });
        }

        return res.status(200).json(dados);
    } catch (erro) {
        console.error("Erro ao buscar Macro CLP:", erro);
        return res.status(500).json({ message: "Erro ao buscar os dados da planta." });
    }
}

module.exports = { obterMacroClp };
