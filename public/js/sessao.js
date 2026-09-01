// sessão
function validarSessao() {
    var email = sessionStorage.getItem("EMAIL_USUARIO");
    var nome = sessionStorage.getItem("NOME_USUARIO");

    var b_usuario = document.getElementById("b_usuario");

    if (email != null && nome != null && b_usuario) {
        b_usuario.innerHTML = nome;
    } else {
        window.location.href = "../login.html";
    }
}

function limparSessao() {
    sessionStorage.clear();
    window.location.href = "../login.html";
}

// carregamento (loading)
function aguardar() {
    var divAguardar = document.getElementById("div_aguardar");
    if (divAguardar) {
        divAguardar.style.display = "flex";
    }
}

function finalizarAguardar(texto) {
    var divAguardar = document.getElementById("div_aguardar");
    if (divAguardar) {
        divAguardar.style.display = "none";
    }

    var divErrosLogin = document.getElementById("div_erros_login");
    if (texto && divErrosLogin) {
        divErrosLogin.style.display = "flex";
        divErrosLogin.innerHTML = texto;
    }
}

