import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const form = document.querySelector("form[data-atividade]");
const atividade = form.dataset.atividade;
const selectHorario = form.querySelector("[name=horario]");

const TODOS_HORARIOS = ["13h-14h", "14h-15h", "15h-16h"];

// Feriados nacionais fixos + feriados de Governador Valadares (2026).
// Pra adicionar um feriado móvel (Carnaval, Sexta-feira Santa, Corpus Christi)
// ou um recesso do IFMG, é só acrescentar uma linha nova, no formato "dd/mm/aaaa".
const FERIADOS = [
  "01/01/2026", // Confraternização Universal
  "30/01/2026", // Aniversário de Governador Valadares
  "21/04/2026", // Tiradentes
  "01/05/2026", // Dia do Trabalho
  "13/06/2026", // Padroeiro de Governador Valadares (Santo Antônio)
  "07/09/2026", // Independência do Brasil
  "12/10/2026", // Nossa Senhora Aparecida
  "02/11/2026", // Finados
  "15/11/2026", // Proclamação da República
  "20/11/2026", // Consciência Negra
  "25/12/2026"  // Natal
];

// Transforma "dd/mm/aaaa" num objeto Date de verdade
function paraData(dataTexto) {
  const [dia, mes, ano] = dataTexto.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
}

// Transforma um objeto Date de volta pra "dd/mm/aaaa"
function paraTexto(data) {
  return String(data.getDate()).padStart(2, "0") + "/" +
         String(data.getMonth() + 1).padStart(2, "0") + "/" +
         data.getFullYear();
}

// NOVO: pra cada feriado que cai numa terça-feira (getDay() === 2),
// adiciona a segunda-feira anterior numa lista extra de dias bloqueados
const SEGUNDAS_APOS_FERIADO_TERCA = FERIADOS
  .map(paraData)
  .filter(function (data) { return data.getDay() === 2; })
  .map(function (data) {
    const segunda = new Date(data);
    segunda.setDate(segunda.getDate() - 1);
    return paraTexto(segunda);
  });

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

    const dataFormatada = paraTexto(dataDoDia);

    const ehDiaUtil = diaDaSemana >= 1 && diaDaSemana <= 4;
    const jaPassou = dataDoDia < hoje;
    const passouDoLimite = dataDoDia > limite;
    const ehFeriado = FERIADOS.includes(dataFormatada);
    const ehSegundaAposFeriadoTerca = SEGUNDAS_APOS_FERIADO_TERCA.includes(dataFormatada); // NOVO

    const horariosDoDia = reservasPorDia[dataFormatada] || [];
    const diaCompleto = horariosDoDia.length >= TODOS_HORARIOS.length;

    if (!ehDiaUtil || jaPassou || passouDoLimite || diaCompleto || ehFeriado || ehSegundaAposFeriadoTerca) {
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

carregarReservas().then(function () {
  montarCalendario();
});
