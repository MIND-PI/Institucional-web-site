function showSidebar() {
  const container = document.querySelector('header .container');
  container.classList.add('active');
}

function hideSidebar() {
  const container = document.querySelector('header .container');
  container.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  const botoes = document.querySelectorAll('.botao-expandir');

  botoes.forEach(function (botao) {
    botao.addEventListener('click', function () {
      const pergunta = botao.parentElement;
      const texto = pergunta.querySelector('.texto-escondido');

      if (texto.style.maxHeight && texto.style.maxHeight !== '0px') {
        texto.style.maxHeight = '0px';
        texto.style.padding = '0 20px';
      } else {
        texto.style.maxHeight = texto.scrollHeight + 40 + 'px';
        texto.style.padding = '0 20px 20px 20px';
      }
    });
  });

  const range = document.getElementById("range");
  const custoInatividade = document.getElementById("custoInatividade");
  const min = document.getElementById("minutos");
  const minutoPlural = document.getElementById("min");
  const economia = document.getElementById("economia");

  function atualizarValor() {
    let custoMinuto = 10500 * Number(range.value);
    let reducao = 0.40 * custoMinuto;

    const custoFormatado = custoMinuto.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const reducaoFormatado = reducao.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    if (Number(range.value) === 1) {
      minutoPlural.textContent = "Minuto";
    } else {
      minutoPlural.textContent = "Minutos";
    }

    custoInatividade.innerHTML = `<span>${custoFormatado}</span>`;
    min.textContent = range.value;
    economia.innerHTML = `<span>${reducaoFormatado}</span>`;
  }

  range.addEventListener("input", atualizarValor);
  atualizarValor();
});