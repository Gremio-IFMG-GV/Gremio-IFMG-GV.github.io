// Monta o calendário de um mês específico (por padrão, o mês atual)
function montarCalendario(mesReferencia = new Date()) {
  const container = document.getElementById("calendario");
  container.innerHTML = "";

  const ano = mesReferencia.getFullYear();
  const mes = mesReferencia.getMonth();

  const nomesMes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                     "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const cabecalho = document.createElement("div");
  cabecalho.className = "calendario-cabecalho";
  cabecalho.innerHTML = `
    <button type="button" id="mes-anterior">&larr;</button>
    <span>${nomesMes[mes]} de ${ano}</span>
    <button type="button" id="mes-seguinte">&rarr;</button>
  `;
  container.appendChild(cabecalho);

  const diasSemana = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const linhaDias = document.createElement("div");
  linhaDias.className = "calendario-dias-semana";
  diasSemana.forEach(function (dia) {
    const span = document.createElement("span");
    span.textContent = dia;
    linhaDias.appendChild(span);
  });
  container.appendChild(linhaDias);

  const grade = document.createElement("div");
  grade.className = "calendario-grade";

  const primeiroDiaDoMes = new Date(ano, mes, 1).getDay();
  const totalDiasNoMes = new Date(ano, mes + 1, 0).getDate();

  for (let i = 0; i < primeiroDiaDoMes; i++) {
    grade.appendChild(document.createElement("span"));
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // NOVO: data limite = hoje + 30 dias. Nada depois disso pode ser selecionado.
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + 30);

  for (let dia = 1; dia <= totalDiasNoMes; dia++) {
    const dataDoDia = new Date(ano, mes, dia);
    const diaDaSemana = dataDoDia.getDay();

    const celula = document.createElement("button");
    celula.type = "button";
    celula.textContent = dia;
    celula.className = "dia-calendario";

    const ehDiaUtil = diaDaSemana >= 1 && diaDaSemana <= 4;
    const jaPassou = dataDoDia < hoje;
    const passouDoLimite = dataDoDia > limite; // NOVO

    if (!ehDiaUtil || jaPassou || passouDoLimite) {
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

  document.getElementById("mes-anterior").addEventListener("click", function () {
    montarCalendario(new Date(ano, mes - 1, 1));
  });

  const btnSeguinte = document.getElementById("mes-seguinte");
  // NOVO: se o primeiro dia do PRÓXIMO mês já passar do limite de 30 dias,
  // desabilita a setinha de avançar (não adianta mostrar um mês todo bloqueado)
  const primeiroDiaProximoMes = new Date(ano, mes + 1, 1);
  if (primeiroDiaProximoMes > limite) {
    btnSeguinte.disabled = true;
    btnSeguinte.classList.add("dia-desabilitado");
  } else {
    btnSeguinte.addEventListener("click", function () {
      montarCalendario(new Date(ano, mes + 1, 1));
    });
  }
}

montarCalendario();
