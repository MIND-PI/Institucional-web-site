var client = require("../config/iaConfig");

async function responseDashMicro(req, res) {
    let nome_usuario = req.body.nomeUsuario
    let pergunta = req.body.pergunta
    let dados = req.body.dados

    if (!nome_usuario || nome_usuario.trim() == "") {
        res.status(400).json({
            erro: "Todos os dados precisam estar preenchidos"
        });
    }

    if (!pergunta || pergunta.trim() == "") {
        res.status(400).json({
            erro: "Todos os dados precisam estar preenchidos"
        });
    }

    if (!dados || dados.trim() == "") {
        res.status(400).json({
            erro: "Todos os dados precisam estar preenchidos"
        });
    }

    let input = `
    # Informações importantes para experiência do usuario

    ## Dados coletados pelo nosso sistema
    dados coletados = ${dados}
    ## Nome do usuario
    nome do usuario = ${nome_usuario}
    ## Pergunta do usuario
    pergunta do usuario = ${pergunta}

    No momento esponda com "oi" e meu nome, estou testando
    `
    try {
        let response = await client.responses.create({
            model: "openai/gpt-oss-20b",
            input: input,
            temperature: 0.1
        });

        console.log(response)


    } catch (erro) {
        console.error("Erro ao enviar resposta para a ia:", erro.message);
        res.status(500).json({
            erro: "Não foi possível fazer a requisição na api"
        });
    }
}

async function responseDashJira(req, res) {
    const nome_usuario = req.body.nomeUsuario;
    const dados = req.body.dados;

    if (
        typeof nome_usuario !== 'string' ||
        nome_usuario.trim() === ''
    ) {
        return res.status(400).json({
            erro: 'Nome do usuário não informado.'
        });
    }

    if (dados === undefined || dados === null) {
        return res.status(400).json({
            erro: 'Dados da dashboard não informados.'
        });
    }

    const dadosFormatados = typeof dados === 'string'
        ? dados
        : JSON.stringify(dados, null, 2);

    const input = `
Você é o assistente inteligente da MIND, especializado
na análise de chamados relacionados ao monitoramento
de CLPs industriais.

Seu objetivo é auxiliar o gerente da operação industrial
a interpretar os dados apresentados na dashboard do Jira.

## Nome do usuário
${nome_usuario}

## Dados da dashboard
${dadosFormatados}

## Instruções de análise

1. Analise os dados fornecidos pela dashboard.
2. Identifique os principais problemas observados.
3. Identifique CLPs e recursos com maior recorrência de chamados.
4. Procure padrões relevantes nos chamados.
5. Sugira ações práticas para os responsáveis pela operação.
6. Utilize uma linguagem profissional, clara e objetiva.
7. Não invente informações, métricas ou causas.
8. Não afirme que existe uma falha física em um CLP
   sem evidências suficientes nos dados.
9. Caso os dados sejam insuficientes, informe essa limitação.

## Formato da resposta

Retorne exclusivamente um JSON válido, sem Markdown,
seguindo exatamente esta estrutura:

{
    "diagnostico": "Descrição dos principais pontos identificados.",
    "acao": "Ação recomendada ao responsável pela operação.",
    "justificativa": "Informações da dashboard que justificam a recomendação."
}
`;

    try {

        const response = await client.responses.create({
            model: "openai/gpt-oss-20b",
            input: input,
            temperature: 0.1
        });

        const respostaIA = response.output_text;

        if (!respostaIA) {
            throw new Error('A IA não retornou uma resposta.');
        }

        const resultado = JSON.parse(respostaIA);

        return res.status(200).json({
            sucesso: true,
            diagnostico: resultado.diagnostico,
            acao: resultado.acao,
            justificativa: resultado.justificativa
        });

    } catch (erro) {
        console.error('Erro ao consultar a IA:', erro);
        return res.status(500).json({
            erro: 'Não foi possível gerar a recomendação da IA.'
        });

    }
}



module.exports = {
    responseDashMicro,
    responseDashJira
}