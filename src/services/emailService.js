// "importando" o nodemailer e criando a relação das variáveis do .env
const nodemailer = require("nodemailer");
require("dotenv").config();

/*
O transporter guarda a configuração da conexão com o servidor de email:
o host é o servidor SMTP (protocolo padrão para enviar emails), a porta 587
é usada por ter autenticação e segurança, e o auth são as credenciais do .env.
Sem SMTP_HOST/SMTP_PORT no .env, usa o Gmail.
*/
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // porta 587 usa STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/* Substitui os caracteres <, > e & para que um nome como "<script>"
não seja interpretado como HTML pelo email. */
function escapar(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

/* Envia o código de ativação para o email do cliente cadastrado.
O link leva para a tela de cadastro de empresa, com o id do fornecedor na URL. */
async function enviarEmailAtivacao(destino, nomeCliente, codigo, idFornecedor) {
    // Recupera a URL do site pelas variáveis de ambiente.
    // Caso não exista, utiliza o endereço local para desenvolvimento.
    const site = process.env.SITE_URL || "http://localhost:3333";

    // Monta o link de cadastro incluindo o ID do fornecedor.
    // encodeURIComponent protege o parâmetro para uso na URL.
    const link = `${site}/cadastro.html?id_empresa=${encodeURIComponent(idFornecedor)}`;

    const info = await transporter.sendMail({
        from: `"MIND" <${process.env.SMTP_USER}>`,
        to: destino,
        subject: "Seu código de ativação MIND",
        text: `Olá! O cadastro da ${nomeCliente} foi realizado.\n\nCódigo de ativação: ${codigo}\n\nPara continuar o cadastro da sua empresa, acesse: ${link}`,
        html: `<p>Olá! O cadastro da <b>${escapar(nomeCliente)}</b> foi realizado.</p>
               <p>Seu código de ativação é: <b>${escapar(codigo)}</b></p>
               <p><a href="${link}">Continuar o cadastro da empresa</a></p>`,
    });

    
}

module.exports = { enviarEmailAtivacao };