import { db } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

emailjs.init("Y2p4-JQhyVwsirKI7");

const EMAILS_DESTINO = [
  "0117389@academico.ifmg.edu.br"
];

const form = document.querySelector("form[data-atividade]");
const atividade = form.dataset.atividade;

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
    criadoEm: serverTimestamp()
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
