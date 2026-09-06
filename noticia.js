import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const parametros = new URLSearchParams(window.location.search);
const id = parametros.get("id");

const container = document.getElementById("noticia-conteudo");

async function carregarNoticia() {
  if (!id) {
    container.innerHTML = "<p>Notícia não encontrada.</p>";
    return;
  }

  const referencia = doc(db, "noticias", id);
  const snap = await getDoc(referencia);

  if (!snap.exists()) {
    container.innerHTML = "<p>Notícia não encontrada.</p>";
    return;
  }

  const noticia = snap.data();

  // O campo "conteudo" já vem pronto (texto + imagens + vídeos misturados),
  // então só precisamos inserir ele como HTML de verdade
  container.innerHTML = `
    <h2>${noticia.titulo}</h2>
    <span class="noticia-data">${formatarData(noticia.criadoEm)}</span>
    <img src="${noticia.capa}" alt="${noticia.titulo}" class="noticia-midia">
    <p class="resumo-destaque">${noticia.resumo}</p>
    <div class="conteudo-rico">${noticia.conteudo}</div>
  `;
}

function formatarData(timestamp) {
  if (!timestamp) return "";
  const data = timestamp.toDate();
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

carregarNoticia();
