import { db } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Pega o formulário que tenha o atributo data-atividade (definido em cada página)
const form = document.querySelector("form[data-atividade]");
const atividade = form.dataset.atividade; // "sinuca", "xadrez" ou "pingpong"

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

  // Verifica se já existe alguém agendado nesse mesmo dia + horário + atividade
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

  // Cria o agendamento de verdade no banco de dados
  await addDoc(collection(db, "agendamentos"), {
    nome, ano, curso, dia, horario, atividade,
    criadoEm: serverTimestamp()
  });

  alert("Agendamento realizado com sucesso!");
  form.reset();
  document.getElementById("data-selecionada").value = "";
  document.querySelectorAll(".dia-selecionado").forEach((el) => el.classList.remove("dia-selecionado"));
});
