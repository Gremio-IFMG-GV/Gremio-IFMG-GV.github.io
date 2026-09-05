import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Pega o "id" que vem no final do link, tipo noticia.html?id=ABC123
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

  let midia = "";
  if (noticia.tipo === "imagem") {
    midia = `<img src="${noticia.conteudo}" alt="${noticia.titulo}" class="noticia-midia">`;
  } else if (noticia.tipo === "video") {
    midia = `<div class="noticia-midia noticia-video-completo">${noticia.conteudo}</div>`;
  }

  container.innerHTML = `
    <h2>${noticia.titulo}</h2>
    <span class="noticia-data">${formatarData(noticia.criadoEm)}</span>
    ${midia}
    <p>${noticia.resumo}</p>
    ${noticia.tipo === "texto" ? `<p>${noticia.conteudo}</p>` : ""}
  `;
}

function formatarData(timestamp) {
  if (!timestamp) return "";
  const data = timestamp.toDate();
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

carregarNoticia();
