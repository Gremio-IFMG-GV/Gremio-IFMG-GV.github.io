import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const form = document.querySelector("form[data-atividade]");
const atividade = form.dataset.atividade;
const selectHorario = form.querySelector("[name=horario]");
const selectTabuleiro = form.querySelector("[name=tabuleiro]"); // só existe no xadrez

const TODOS_HORARIOS = ["13h-14h", "14h-15h", "15h-16h"];

// Quantas pessoas cabem no MESMO horário: xadrez tem 4 tabuleiros,
// sinuca e ping-pong têm 1 unidade só.
const CAPACIDADE = atividade === "xadrez" ? 4 : 1;

const FERIADOS = [
  "01/01/2026", "30/01/2026", "21/04/2026", "01/05/2026", "13/06/2026",
  "07/09/2026", "12/10/2026", "02/11/2026", "15/11/2026", "20/11/2026", "25/12/2026"
];

function paraData(dataTexto) {
  const [dia, mes, ano] = dataTexto.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
}

function paraTexto(data) {
  return String(data.getDate()).padStart(2, "0") + "/" +
         String(data.getMonth() + 1).padStart(2, "0") + "/" + data.getFullYear();
}

const SEGUNDAS_APOS_FERIADO_TERCA = FERIADOS
  .map(paraData)
  .filter((data) => data.getDay() === 2)
  .map((data) => {
    const segunda = new Date(data);
    segunda.setDate(segunda.getDate() - 1);
    return paraTexto(segunda);
  });

// Ex: { "09/09/2026": [{horario:"13h-14h", tabuleiro:"1"}, {horario:"13h-14h", tabuleiro:"2"}] }
let reservasPorDia = {};

async function carregarReservas() {
  const q = query(collection(db, "agendamentos"), where("atividade", "==", atividade));
  const resultado = await getDocs(q);

  reservasPorDia = {};
  resultado.forEach((docSnap) => {
    const dados = docSnap.data();
    if (!reservasPorDia[dados.dia]) reservasPorDia[dados.dia] = [];
    reservasPorDia[dados.dia].push({ horario: dados.horario, tabuleiro: dados.tabuleiro || null });
  });
}

function contarReservas(dia, horario) {
  const lista = reservasPorDia[dia] || [];
  return lista.filter((r) => r.horario === horario).length;
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
  diasSemana.forEach((dia) => {
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
    const ehSegundaAposFeriadoTerca = SEGUNDAS_APOS_FERIADO_TERCA.includes(dataFormatada);

    // Só fica "completo" se TODOS os horários bateram a capacidade máxima
    const diaCompleto = TODOS_HORARIOS.every((h) => contarReservas(dataFormatada, h) >= CAPACIDADE);

    if (!ehDiaUtil || jaPassou || passouDoLimite || ehFeriado || ehSegundaAposFeriadoTerca || diaCompleto) {
      celula.disabled = true;
      celula.classList.add("dia-desabilitado");
    } else {
      celula.addEventListener("click", () => {
        document.querySelectorAll(".dia-selecionado").forEach((el) => el.classList.remove("dia-selecionado"));
        celula.classList.add("dia-selecionado");
        document.getElementById("data-selecionada").value = dataFormatada;
        atualizarHorariosDisponiveis(dataFormatada);
      });
    }

    grade.appendChild(celula);
  }

  container.appendChild(grade);

  document.getElementById("mes-anterior").addEventListener("click", () => {
    montarCalendario(new Date(ano, mes - 1, 1));
  });

  const btnSeguinte = document.getElementById("mes-seguinte");
  const primeiroDiaProximoMes = new Date(ano, mes + 1, 1);
  if (primeiroDiaProximoMes > limite) {
    btnSeguinte.disabled = true;
    btnSeguinte.classList.add("dia-desabilitado");
  } else {
    btnSeguinte.addEventListener("click", () => {
      montarCalendario(new Date(ano, mes + 1, 1));
    });
  }
}

function atualizarHorariosDisponiveis(dataFormatada) {
  Array.from(selectHorario.options).forEach((opcao) => {
    const horario = opcao.value || opcao.textContent;
    opcao.disabled = contarReservas(dataFormatada, horario) >= CAPACIDADE;
  });

  const selecionadaOcupada = selectHorario.selectedOptions[0] && selectHorario.selectedOptions[0].disabled;
  if (selecionadaOcupada) {
    const primeiraLivre = Array.from(selectHorario.options).find((o) => !o.disabled);
    if (primeiraLivre) selectHorario.value = primeiraLivre.value || primeiraLivre.textContent;
  }

  if (selectTabuleiro) {
    atualizarTabuleirosDisponiveis(dataFormatada, selectHorario.value);
  }
}

// Só roda no xadrez: desabilita os tabuleiros já ocupados naquele dia+horário
function atualizarTabuleirosDisponiveis(dataFormatada, horario) {
  const lista = reservasPorDia[dataFormatada] || [];
  const tabuleirosOcupados = lista.filter((r) => r.horario === horario).map((r) => r.tabuleiro);

  Array.from(selectTabuleiro.options).forEach((opcao) => {
    opcao.disabled = tabuleirosOcupados.includes(opcao.value);
  });

  const selecionadoOcupado = selectTabuleiro.selectedOptions[0] && selectTabuleiro.selectedOptions[0].disabled;
  if (selecionadoOcupado) {
    const primeiroLivre = Array.from(selectTabuleiro.options).find((o) => !o.disabled);
    if (primeiroLivre) selectTabuleiro.value = primeiroLivre.value;
  }
}

if (selectTabuleiro) {
  selectHorario.addEventListener("change", () => {
    const dia = document.getElementById("data-selecionada").value;
    if (dia) atualizarTabuleirosDisponiveis(dia, selectHorario.value);
  });
}

carregarReservas().then(() => {
  montarCalendario();
});
