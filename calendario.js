import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const form = document.querySelector("form[data-atividade]");
const atividade = form.dataset.atividade;
const selectHorario = form.querySelector("[name=horario]");

const TODOS_HORARIOS = ["13h-14h", "14h-15h", "15h-16h"];

// Guarda os horários já reservados por dia dessa atividade,
// tipo: { "09/09/2026": ["13h-14h", "14h-15h"] }
let reservasPorDia = {};

async function carregarReservas() {
  const q = query(collection(db, "agendamentos"), where("atividade", "==", atividade));
  const resultado = await getDocs(q);

  reservasPorDia = {};
  resultado.forEach((docSnap) => {
    const dados = docSnap.data();
    if (!reservasPorDia[dados.dia]) {
      reservasPorDia[dados.dia] = [];
    }
    reservasPorDia[dados.dia].push(dados.horario);
  });
}

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

  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + 30);

  for (let dia = 1; dia <= totalDiasNoMes; dia++) {
    const dataDoDia = new Date(ano, mes, dia);
    const diaDaSemana = dataDoDia.getDay();

    const celula = document.createElement("button");
    celula.type = "button";
    celula.textContent = dia;
    celula.className = "dia-calendario";

    const dataFormatada = String(dia).padStart(2, "0") + "/" +
                           String(mes + 1).padStart(2, "0") + "/" + ano;

    const ehDiaUtil = diaDaSemana >= 1 && diaDaSemana <= 4;
    const jaPassou = dataDoDia < hoje;
    const passouDoLimite = dataDoDia > limite;

    // NOVO: dia "completo" = os 3 horários dessa atividade já estão reservados nesse dia
    const horariosDoDia = reservasPorDia[dataFormatada] || [];
    const diaCompleto = horariosDoDia.length >= TODOS_HORARIOS.length;

    if (!ehDiaUtil || jaPassou || passouDoLimite || diaCompleto) {
      celula.disabled = true;
      celula.classList.add("dia-desabilitado");
    } else {
      celula.addEventListener("click", function () {
        document.querySelectorAll(".dia-selecionado").forEach(function (el) {
          el.classList.remove("dia-selecionado");
        });
        celula.classList.add("dia-selecionado");
        document.getElementById("data-selecionada").value = dataFormatada;

        atualizarHorariosDisponiveis(dataFormatada);
      });
    }

    grade.appendChild(celula);
  }

  container.appendChild(grade);

  document.getElementById("mes-anterior").addEventListener("click", function () {
    montarCalendario(new Date(ano, mes - 1, 1));
  });

  const btnSeguinte = document.getElementById("mes-seguinte");
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

// NOVO: desabilita, no menu de horário, as opções já reservadas no dia escolhido
function atualizarHorariosDisponiveis(dataFormatada) {
  const horariosOcupados = reservasPorDia[dataFormatada] || [];

  Array.from(selectHorario.options).forEach(function (opcao) {
    opcao.disabled = horariosOcupados.includes(opcao.value || opcao.textContent);
  });

  const selecionadaOcupada = selectHorario.selectedOptions[0] && selectHorario.selectedOptions[0].disabled;
  if (selecionadaOcupada) {
    const primeiraLivre = Array.from(selectHorario.options).find(function (o) {
      return !o.disabled;
    });
    if (primeiraLivre) {
      selectHorario.value = primeiraLivre.value || primeiraLivre.textContent;
    }
  }
}

// Busca as reservas PRIMEIRO, e só depois desenha o calendário —
// assim os dias já completos já aparecem travados desde o início
carregarReservas().then(function () {
  montarCalendario();
});
