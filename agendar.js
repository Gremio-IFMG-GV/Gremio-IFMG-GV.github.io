import { db } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

function mostrarPopup(mensagem, redirecionarParaHome) {
  const overlay = document.getElementById("popup-overlay");
  const texto = document.getElementById("popup-mensagem");
  const botaoOk = document.getElementById("popup-ok");

  texto.textContent = mensagem;
  overlay.style.display = "flex";

  botaoOk.onclick = function () {
    overlay.style.display = "none";
    if (redirecionarParaHome) window.location.href = "index.html";
  };
}

emailjs.init("Y2p4-JQhyVwsirKI7");

const EMAILS_DESTINO = [
  "0117389@academico.ifmg.edu.br"
];

const form = document.querySelector("form[data-atividade]");
const atividade = form.dataset.atividade;
const campoTabuleiro = form.querySelector("[name=tabuleiro]");

function calcularExpiraEm(diaTexto, horarioTexto) {
  const [dia, mes, ano] = diaTexto.split("/").map(Number);
  const horaFim = parseInt(horarioTexto.split("-")[1], 10);
  return new Date(ano, mes - 1, dia, horaFim, 0, 0);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = form.querySelector("[name=nome]").value;
  const ano = form.querySelector("[name=ano]").value;
  const curso = form.querySelector("[name=curso]").value;
  const dia = document.getElementById("data-selecionada").value;
  const horario = form.querySelector("[name=horario]").value;
  const tabuleiro = campoTabuleiro ? campoTabuleiro.value : null;

  if (!dia) {
    mostrarPopup("Escolha um dia no calendário antes de agendar.", false);
    return;
  }

  // Monta a checagem de conflito: se tiver tabuleiro, checa o tabuleiro específico;
  // se não (sinuca/ping-pong), checa só dia+horário mesmo
  const condicoes = [
    where("atividade", "==", atividade),
    where("dia", "==", dia),
    where("horario", "==", horario)
  ];
  if (tabuleiro) condicoes.push(where("tabuleiro", "==", tabuleiro));

  const q = query(collection(db, "agendamentos"), ...condicoes);
  const jaExiste = await getDocs(q);

  if (!jaExiste.empty) {
    mostrarPopup("Esse horário já está reservado. Escolha outro dia ou horário.", false);
    return;
  }

  const dadosAgendamento = {
    nome, ano, curso, dia, horario, atividade,
    criadoEm: serverTimestamp(),
    expiraEm: Timestamp.fromDate(calcularExpiraEm(dia, horario))
  };
  if (tabuleiro) dadosAgendamento.tabuleiro = tabuleiro;

  await addDoc(collection(db, "agendamentos"), dadosAgendamento);

  EMAILS_DESTINO.forEach(function (email) {
    emailjs.send("service_irheu35", "template_war4di4", {
      to_email: email,
      nome: nome,
      ano: ano,
      curso: curso,
      atividade: atividade,
      dia: dia,
      horario: horario,
      tabuleiro: tabuleiro || ""
    });
  });

  mostrarPopup("Agendamento realizado com sucesso!", true);

  form.reset();
  document.getElementById("data-selecionada").value = "";
  document.querySelectorAll(".dia-selecionado").forEach(function (el) {
    el.classList.remove("dia-selecionado");
  });
});
