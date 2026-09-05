import { db } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Inicia o EmailJS com sua chave pública
emailjs.init("Y2p4-JQhyVwsirKI7");

// Lista de e-mails que recebem a notificação de cada agendamento.
// Pra adicionar mais, é só colocar entre aspas, separado por vírgula:
// ["email1@exemplo.com", "email2@exemplo.com"]
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
    nome, ano, curso, dia, horario, atividade,
    criadoEm: serverTimestamp()
  });

  // Manda um e-mail de notificação pra cada endereço da lista
  EMAILS_DESTINO.forEach(function (email) {
    emailjs.send("service_irheu35", "template_war4di4", {
      to_email: email,
      nome: nome,
      ano: ano,
      curso: curso,
