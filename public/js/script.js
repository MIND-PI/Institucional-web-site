function showSidebar() {
  const container = document.querySelector('header .container');
  container.classList.add('active');
}

function hideSidebar() {
  const container = document.querySelector('header .container');
  container.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  // Lógica do FAQ (Expandir / Recolher)
  const botoes = document.querySelectorAll('.botao-expandir');

  botoes.forEach((botao) => {
    botao.addEventListener('click', () => {
      const pergunta = botao.parentElement;
      const texto = pergunta.querySelector('.texto-escondido');

      if (texto.style.maxHeight && texto.style.maxHeight !== '0px') {
        texto.style.maxHeight = '0px';
        texto.style.padding = '0 20px';
      } else {
        texto.style.maxHeight = `${texto.scrollHeight + 40}px`;
        texto.style.padding = '0 20px 20px 20px';
      }
    });
  });

  // Lógica da Calculadora
  const range = document.getElementById("range");
  const custoInatividade = document.getElementById("custoInatividade");
  const min = document.getElementById("minutos");
  const minutoPlural = document.getElementById("min");
  const economia = document.getElementById("economia");

  function atualizarValor() {
    const valorRange = Number(range.value);
    const custoMinuto = 4500 * valorRange;
    const reducao = 0.40 * custoMinuto;

    const custoFormatado = custoMinuto.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const reducaoFormatado = reducao.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    // Ajusta o texto para singular ou plural
    minutoPlural.textContent = valorRange === 1 ? "Minuto" : "Minutos";

    // Atualiza os valores na tela
    custoInatividade.innerHTML = `<span>${custoFormatado}</span>`;
    min.textContent = valorRange;
    economia.innerHTML = `<span>${reducaoFormatado}</span>`;
  }

  // Escuta o evento de alteração no range e executa no carregamento inicial
  range.addEventListener("input", atualizarValor);
  atualizarValor();
});

function enviarEmail() {
  let nome = nome_completo.value;
  let email = email_corporativo.value;
  let email1 = document.getElementById("email_corporativo");
  let empresa = empresa_input.value;
  let texto = textoMensagem.value;
  let teste = /^[a-zA-Zà-úÀ-ÚçÇ\s]+$/;
  let podeEnviar = true;

  erroNome.innerHTML = "";
  erroEmail.innerHTML = "";
  erroEmpresa.innerHTML = "";
  erroMensagem.innerHTML = "";

  if (nome == "" || !teste.test(nome)) {
    erroNome.innerHTML = `<span style="color:red; font-size: 0.5rem">Nome inválido. Não pode ter número nem caractere especial</span>`;
    podeEnviar = false
  }
  if (email == "" || !email1.checkValidity()) {
    erroEmail.innerHTML = `<span style="color:red; font-size: 0.5rem">Email inválido. Não pode ter caractere especial e o formato precisa ser válido</span>`;
    podeEnviar = false
  }
  if (empresa == "" || !teste.test(empresa)) {
    erroEmpresa.innerHTML = `<span style="color:red; font-size: 0.5rem">Empresa inválida. Não pode ter número nem caractere especial</span>`;
    podeEnviar = false
  }
  
  
  if(!podeEnviar){
    return;
  }

  erroMensagem.innerHTML = `<span style="color:black; font-size: 0.5rem">Email sendo enviado...</span>`
  fetch("/email/enviarEmail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      remetente: email,
      assunto: empresa,
      texto: texto,
      nome: nome
    })
  }).then((resposta) => {
    if(resposta.ok){
      erroMensagem.innerHTML = `<span style="color:green; font-size: 0.5rem">Email enviado com sucesso. Email utilizado: ${email} </span>`
    }
    

  }).catch((erro) => {
    console.log(erro)
    erroMensagem.innerHTML = `<span style="color:red; font-size: 0.5rem">Email não enviado </span>`
  })


  }