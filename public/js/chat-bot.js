
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

