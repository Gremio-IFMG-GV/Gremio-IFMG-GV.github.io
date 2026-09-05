// Monta o calendário de um mês específico (por padrão, o mês atual)
function montarCalendario(mesReferencia = new Date()) {
  const container = document.getElementById("calendario");
  container.innerHTML = ""; // limpa o que tinha antes (ao trocar de mês)

  const ano = mesReferencia.getFullYear();
  const mes = mesReferencia.getMonth(); // 0 = janeiro ... 11 = dezembro

  const nomesMes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                     "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  // Cabeçalho: setinha voltar, nome do mês/ano, setinha avançar
  const cabecalho = document.createElement("div");
  cabecalho.className = "calendario-cabecalho";
  cabecalho.innerHTML = `
    <button type="button" id="mes-anterior">&larr;</button>
    <span>${nomesMes[mes]} de ${ano}</span>
    <button type="button" id="mes-seguinte">&rarr;</button>
  `;
  container.appendChild(cabecalho);

  // Linha com as abreviações dos dias da semana (Dom, Seg, Ter...)
  const diasSemana = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const linhaDias = document.createElement("div");
  linhaDias.className = "calendario-dias-semana";
  diasSemana.forEach(function (dia) {
    const span = document.createElement("span");
    span.textContent = dia;
    linhaDias.appendChild(span);
  });
  container.appendChild(linhaDias);

  // A grade com os números dos dias em si
  const grade = document.createElement("div");
  grade.className = "calendario-grade";

  const primeiroDiaDoMes = new Date(ano, mes, 1).getDay(); // em que dia da semana cai o dia 1
  const totalDiasNoMes = new Date(ano, mes + 1, 0).getDate(); // quantos dias tem esse mês

  // Espaços vazios antes do dia 1, só pra alinhar embaixo do dia da semana certo
  for (let i = 0; i < primeiroDiaDoMes; i++) {
    grade.appendChild(document.createElement("span"));
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // zera a hora, pra comparar só a data

  for (let dia = 1; dia <= totalDiasNoMes; dia++) {
    const dataDoDia = new Date(ano, mes, dia);
    const diaDaSemana = dataDoDia.getDay(); // 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sáb

    const celula = document.createElement("button");
    celula.type = "button";
    celula.textContent = dia;
    celula.className = "dia-calendario";

    const ehDiaUtil = diaDaSemana >= 1 && diaDaSemana <= 4; // só segunda a quinta
    const jaPassou = dataDoDia < hoje; // não deixa marcar dia que já passou

    if (!ehDiaUtil || jaPassou) {
      celula.disabled = true;
      celula.classList.add("dia-desabilitado");
    } else {
      celula.addEventListener("click", function () {
        document.querySelectorAll(".dia-selecionado").forEach(function (el) {
          el.classList.remove("dia-selecionado");
        });
        celula.classList.add("dia-selecionado");

        const dataFormatada = String(dia).padStart(2, "0") + "/" +
                               String(mes + 1).padStart(2, "0") + "/" + ano;
        document.getElementById("data-selecionada").value = dataFormatada;
      });
    }

    grade.appendChild(celula);
  }

  container.appendChild(grade);

  // Liga as setinhas de navegação a trocar de mês (chamando a função de novo)
  document.getElementById("mes-anterior").addEventListener("click", function () {
    montarCalendario(new Date(ano, mes - 1, 1));
  });
  document.getElementById("mes-seguinte").addEventListener("click", function () {
    montarCalendario(new Date(ano, mes + 1, 1));
  });
}

// Roda assim que a página carrega, mostrando o mês atual
montarCalendario();
