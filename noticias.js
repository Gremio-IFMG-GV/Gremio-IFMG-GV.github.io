import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

async function carregarTodas() {
  const lista = document.getElementById("noticias-lista-todas");
  lista.innerHTML = "Carregando notícias...";

  const q = query(collection(db, "noticias"), orderBy("criadoEm", "desc"));
  const resultado = await getDocs(q);

  lista.innerHTML = "";

  resultado.forEach((docSnap) => {
    const noticia = docSnap.data();
    const id = docSnap.id;

    const card = document.createElement("article");
    card.className = "noticia-card";
    card.innerHTML = `
      <a href="noticia.html?id=${id}">
        <img src="${noticia.capa}" alt="${noticia.titulo}">
        <span class="noticia-data">${formatarData(noticia.criadoEm)}</span>
        <h3>${noticia.titulo}</h3>
        <p>${noticia.resumo}</p>
      </a>
    `;
    lista.appendChild(card);
  });
}

function formatarData(timestamp) {
  if (!timestamp) return "";
  const data = timestamp.toDate();
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

carregarTodas();
