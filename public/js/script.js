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
    const custoMinuto = 10500 * valorRange;
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