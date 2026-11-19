let container_chat_bot = document.getElementById("container_chat_bot")
let menu_mobile = document.getElementById("menuMobile")

document.getElementById("btn_ia").addEventListener("click", () => {
    container_chat_bot.classList.toggle("active")
    menu_mobile.classList.toggle("menu-none")
})

document.getElementById("btn_close_chat").addEventListener("click", () => {
    container_chat_bot.classList.toggle("active")
    menu_mobile.classList.toggle("menu-none")
})

// -------------------------
// ELEMENTOS DO CHAT
// -------------------------
const chatInput = document.getElementById("chat_input")
const chatMessages = document.querySelector(".content-chat")
const btnSend = document.getElementById("btn_send_chat")

/**
 * scrollChatToBottom
 * Garante que o container de mensagens role até o final.
 */
function scrollChatToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight
    }
}

/**
 * appendUserMessage
 * Insere a mensagem do usuário na UI do chat.
 */
function appendUserMessage(text) {
    const div = document.createElement("div")
    div.className = "user-message"
    div.innerHTML = `<p>${text}</p>
        <div class="img-card">
            <img src="../assets/imgs/fotosUsuarios/foto_padrao.png" alt="Foto do usuário" id="imgUser"
                                 onerror="this.onerror=null; this.src='../assets/imgs/fotosUsuarios/foto_padrao.png'">
        </div>`
    chatMessages.appendChild(div)
    scrollChatToBottom()
}

/**
 * appendBotMessage
 * Insere a mensagem do bot. Se isLoading=true, mostra "..." como placeholder.
 * Retorna o elemento criado para permitir atualização posterior.
 */
function appendBotMessage(text, isLoading = false) {
    const div = document.createElement("div")
    div.className = "ia-message"
    const innerText = isLoading ? "..." : text
    div.innerHTML = `<div><img src="../assets/icon/MIND .png" alt="Logo do bot da mind"></div><p>${innerText}</p>`
    chatMessages.appendChild(div)
    scrollChatToBottom()
    return div
}


/**
 * sendMessage
 * Envia a pergunta do usuário para o backend junto com o payload 'dados'.
 * Exibe loader e atualiza o bloco do bot com a resposta.
 */
async function sendMessage() {
    const text = chatInput.value && chatInput.value.trim()

    if (!text) {
        return
    }

    // Mostrar mensagem do usuário na UI
    appendUserMessage(text)
    chatInput.value = ""

    // nome do usuario
    const nomeUsuario = sessionStorage.getItem("NOME_USUARIO")

    // obter diretamente o snapshot salvo em sessionStorage
    const dados = sessionStorage.getItem("DASHBOARD_PAYLOAD")

    // inserir placeholder de loading
    const botElem = appendBotMessage("", true)

    try {
        const resp = await fetch("/ia/response-micro/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nomeUsuario: nomeUsuario,
                pergunta: text,
                dados: dados
            })
        })

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}))
            botElem.querySelector("p").innerText = err.erro || "Erro ao obter resposta"
            return
        }

        const json = await resp.json()
        const reply = json.reply || "Sem resposta"
        botElem.querySelector("p").innerText = reply
        scrollChatToBottom()
    } catch (e) {
        botElem.querySelector("p").innerText = "Erro na conexão com a IA"
        console.error(e)
    }
}

async function sendMessageHtml() {
    // nome do usuario
    const nomeUsuario = sessionStorage.getItem("NOME_USUARIO")

    // obter diretamente o snapshot salvo em sessionStorage
    const dados = sessionStorage.getItem("DASHBOARD_PAYLOAD")

    // inserir placeholder de loading na div
    const text_ia = document.getElementById("text_suport_ia")
    text_ia.innerHTML = "Carregando mensagem..."

    try {
        const resp = await fetch("/ia/response-micro/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nomeUsuario: nomeUsuario,
                pergunta: text,
                dados: dados
            })
        })

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}))
            botElem.querySelector("p").innerText = err.erro || "Sem dados para uma resposta elaborada"
            return
        }

        const json = await resp.json()
        const reply = json.reply || "Sem dados para uma resposta elaborada"
        botElem.querySelector("p").innerText = reply
    } catch (e) {
        botElem.querySelector("p").innerText = "Erro na conexão com a IA"
        console.error(e)
    }
}

// listeners: botão Enviar e tecla Enter
btnSend.addEventListener("click", sendMessage)
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault()
        sendMessage()
    }
})
