// ===== CONTROLLER: recebe o pedido, valida e responde =====
const macroClpModel = require("../models/macroClpModel");

async function obterMacroClp(req, res) {
    // 1. lê os parâmetros da URL
    const periodo = req.query.periodo || "agora";    // agora | 7-dias | 30-dias
    const idEmpresa = req.query.idEmpresa;

    // TODO (importante): quando o login estiver ligado, pegue a empresa do USUÁRIO LOGADO
    // (sessão) e ignore o que vem na URL. Senão, qualquer pessoa troca o número e vê outra empresa.

    // 2. valida: idEmpresa só pode ter números (ele entra no caminho do arquivo no S3)
    if (!idEmpresa) {
    return res.status(400).json({ erro: "idEmpresa inválido" });
    }

    const id = Number(idEmpresa);

    if (Number.isNaN(id) || !Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: "idEmpresa inválido" });
    }

    if (!macroClpModel.PERIODOS_VALIDOS.includes(periodo)) {
        return res.status(400).json({ erro: "periodo inválido. Use: agora, 7-dias ou 30-dias" });
    }

    // 3. busca os dados e responde
    try {
        const dados = await macroClpModel.buscarUltimoResultado(idEmpresa, periodo);

        if (dados === null) {
            return res.status(404).json({ erro: "Ainda não há dados para essa empresa e período" });
        }

        return res.status(200).json(dados);
    } catch (erro) {
        console.error("Erro ao buscar Macro CLP:", erro);
        return res.status(500).json({ erro: "Erro ao buscar os dados" });
    }
}

module.exports = { obterMacroClp };
