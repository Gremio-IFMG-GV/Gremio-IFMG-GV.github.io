import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

async function carregarImagens() {
  const referencia = doc(db, "configuracoes", "imagens-agendamento");
  const snap = await getDoc(referencia);

  if (!snap.exists()) return;

  const dados = snap.data();
  if (dados.sinuca) document.getElementById("img-sinuca").src = dados.sinuca;
  if (dados.xadrez) document.getElementById("img-xadrez").src = dados.xadrez;
  if (dados.pingpong) document.getElementById("img-pingpong").src = dados.pingpong;
}

carregarImagens();
