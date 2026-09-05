import nodemailer from "nodemailer";
import "dotenv/config";


export async function enviarEmail(req, res) {
    let remetente = req.body.remetente;
    let assunto = req.body.assunto;
    let texto = req.body.texto;
    let nome = req.body.nome;
    
    try {
        console.log("Criando um trasporter")
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, 
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        console.log(process.env.SMTP_USER,process.env.SMTP_PASS )
        console.log("Verificando a conexão")
        await transporter.verify();
        console.log("COnexão deu certo")
        console.log("enviando email")
        const info = await transporter.sendMail({
            from: remetente, 
            to: 'mindProject403@gmail.com', 
            subject: `Eu, ${nome}, representante da ${assunto}, quero saber mais sobre o projeto`, 
            text: texto, 
            html: `${texto}`,
        });

        console.log("deu certo, email enviado com sucesso")
        res.status(200).json("Deu certo, email enviado")
        return true;
    } catch (err) {
        console.log("Deu algum erro, chefe", err)
        res.status(400).json("Deu algum erro, email não enviado")
        return false;
    }

}

