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


// Atualizar Usuário

function salvarConfiguracoes() {
    let idUsuario = sessionStorage.ID_USUARIO;
    let nome = input_nome.value;
    let senha = input_senha.value;
    let imagemPerfil = input_foto.files[0];

    const formData = new FormData();
    formData.append("idUsuario", idUsuario);
    formData.append("nomeServer", nome);
    formData.append("senhaServer", senha);
    formData.append("imagemPerfil", imagemPerfil);  

    fetch(`/usuarios/atualizar/${idUsuario}`, {
        method: "PUT",
        body: formData
    }).then(function (resposta) {
        if (resposta.ok) {
            alert("Perfil atualizado com sucesso!");
            if(nome && nome.trim() !== "") {
                sessionStorage.NOME_USUARIO = nome; 
            }
            window.location.reload(true);            
        } else {
            throw("Houve um erro ao tentar atualizar o perfil!");
        }
    }).catch(function (resposta) {
        console.log(`#ERRO: ${resposta}`);
    });

    return false;
}