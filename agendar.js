import { db } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

emailjs.init("Y2p4-JQhyVwsirKI7");

// Lista de e-mails que recebem a notificação de cada agendamento.
// Pra adicionar mais, é só colocar entre aspas, separado por vírgula:
// ["email1@exemplo.com", "email2@exemplo.com"]
const EMAILS_DESTINO = [
  "0117389@academico.ifmg.edu.br"
];

const form = document.querySelector("form[data-atividade]");
const atividade = form.dataset.atividade;

// Calcula o momento exato (dia + hora final) em que o agendamento vence,
// usado pelo Firestore TTL pra apagar automaticamente depois
function calcularExpiraEm(diaTexto, horarioTexto) {
  const [dia, mes, ano] = diaTexto.split("/").map(Number);
  const horaFim = parseInt(horarioTexto.split("-")[1], 10); // "13h-14h" -> pega o "14h" -> 14
  return new Date(ano, mes - 1, dia, horaFim, 0, 0);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = form.querySelector("[name=nome]").value;
  const ano = form.querySelector("[name=ano]").value;
  const curso = form.querySelector("[name=curso]").value;
  const dia = document.getElementById("data-selecionada").value;
  const horario = form.querySelector("[name=horario]").value;

  if (!dia) {
    alert("Escolha um dia no calendário antes de agendar.");
    return;
  }

  const q = query(
    collection(db, "agendamentos"),
    where("atividade", "==", atividade),
    where("dia", "==", dia),
    where("horario", "==", horario)
  );
  const jaExiste = await getDocs(q);

  if (!jaExiste.empty) {
    alert("Esse horário já está reservado. Escolha outro dia ou horário.");
    return;
  }

  await addDoc(collection(db, "agendamentos"), {
    nome: nome,
    ano: ano,
    curso: curso,
    dia: dia,
    horario: horario,
    atividade: atividade,
    criadoEm: serverTimestamp(),
    expiraEm: Timestamp.fromDate(calcularExpiraEm(dia, horario))
  });

  EMAILS_DESTINO.forEach(function (email) {
    emailjs.send("service_irheu35", "template_war4di4", {
      to_email: email,
      nome: nome,
      ano: ano,
      curso: curso,
      atividade: atividade,
      dia: dia,
      horario: horario
    });
  });

  alert("Agendamento realizado com sucesso!");
  form.reset();
  document.getElementById("data-selecionada").value = "";
  document.querySelectorAll(".dia-selecionado").forEach(function (el) {
    el.classList.remove("dia-selecionado");
  });
});
