const btnConfig = document.getElementById('btn_config');
const overlayConfig = document.getElementById('overlay_config');
const btnFechar = document.getElementById('btn_fechar_config');
const formConfig = document.getElementById('form_config');

btnConfig.addEventListener('click', () => {
    overlayConfig.classList.add('ativo');
});

btnFechar.addEventListener('click', () => {
    overlayConfig.classList.remove('ativo');
});

overlayConfig.addEventListener('click', (event) => {
    if (event.target === overlayConfig) {
        overlayConfig.classList.remove('ativo');
    }
});


if (sessionStorage.NOME_USUARIO == undefined) {
    nomeUsuario.innerHTML = "Indefinido";
} else {
    nomeUsuario.innerHTML = sessionStorage.NOME_USUARIO;
}

if (sessionStorage.IMG_URL != "null") {
    imgUser.src = sessionStorage.getItem("IMG_URL");
    preview_foto_modal.src = sessionStorage.getItem("IMG_URL");
} else {
    let nome = pegarIniciais(sessionStorage.getItem("NOME_USUARIO"))
    img_card.innerHTML = `<p class="profile_name">${nome}</p>`
}

function pegarIniciais(nome) {
    var partes = nome.trim().split(" ");
    var primeira = partes[0].charAt(0);
    var ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : "";
    return (primeira + ultima).toUpperCase();
}