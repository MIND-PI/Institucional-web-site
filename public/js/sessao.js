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
    let nome = iptNome.value;
    let senha = iptSenha.value;
    let imagemPerfil = iptImagemPerfil.files[0];

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
            if(nome.length === 0) {
                console.log("Nickname inalterado")
            } else {
                sessionStorage.USER_USUARIO = nome; 
            }
            
            window.location = "./dashboard.html";
        } else if (resposta.status == 409) {
            msgErroNick.style.display = "block";
        } else {
            throw("Houve um erro ao tentar atualizar o perfil!");
        }
    }).catch(function (resposta) {
        console.log(`#ERRO: ${resposta}`);
    });

    return false;
}


// Inserir script no dashboard.html
if (sessionStorage.USER_USUARIO == undefined) {
        span_nome_usuario.innerHTML = "Indefinido"
    } else {
        span_nome_usuario.innerHTML = sessionStorage.USER_USUARIO
    }

    fetch(`/usuarios/${sessionStorage.ID_USUARIO}`, {
      method: "GET"
    })
      .then(res => {
        res.json().then(json => {
          const usuario = json[0];
          if (usuario.imagemPerfil == undefined) {
            foto_perfil.src = `/assets/imgs/fotosUsuarios/foto_padrao.png`
          } else {
          foto_perfil.src = `/assets/imgs/fotosUsuarios/${usuario.imagemPerfil}`
          }
        })
      })
      .catch(err => {
        console.log(err);
      })
