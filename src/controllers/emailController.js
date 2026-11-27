const nodemailer = require("nodemailer");
require("dotenv").config();

function escapar(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

 async function enviarEmail(req, res) {
    let remetente = req.body.remetente;
    let assunto = req.body.assunto;
    let texto = req.body.texto;
    let nome = req.body.nome;
    
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const site = process.env.SITE_URL || "http://localhost:3333";

        // Mensagem para a caixa do projeto (o "Responder" vai para o visitante)
        await transporter.sendMail({
            from: `"MIND" <${process.env.SMTP_USER}>`,
            to: "mindProject403@gmail.com",
            replyTo: remetente,
            subject: `Eu, ${nome}, representante da ${assunto}, quero saber mais sobre o projeto`,
            text: `${texto}\n\nContato: ${remetente}`,
        });

        // Resposta automática para o email digitado, com o link do cadastro de fornecedor.
        // Se falhar, a mensagem para a equipe já foi enviada, então não derruba a resposta.
        try {
            await transporter.sendMail({
                from: `"MIND" <${process.env.SMTP_USER}>`,
                to: remetente,
                subject: "Recebemos o seu contato - MIND",
                text: `Olá, ${nome}! Recebemos a sua mensagem e a nossa equipe entrará em contato.\n\nPara cadastrar a sua empresa, acesse: ${site}/cadastro_empresa.html`,
                html: `<p>Olá, <b>${escapar(nome)}</b>! Recebemos a sua mensagem e a nossa equipe entrará em contato.</p>
                       <p><a href="${site}/cadastro_empresa.html">Cadastrar a minha empresa</a></p>`,
            });
        } catch (erroConfirmacao) {
            console.log("Falha ao enviar a resposta automática:", erroConfirmacao);
        }

        return res.status(200).json("Deu certo, email enviado");
    } catch (err) {
        console.log("Erro ao enviar email:", err);
        return res.status(500).json("Deu algum erro, email não enviado");
    }

    
}

module.exports = {
    enviarEmail
};
