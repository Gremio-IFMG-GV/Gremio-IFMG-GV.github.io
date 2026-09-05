// Pega a conexão com o banco de dados
import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

async function carregarDestaques() {
  const grid = document.getElementById("noticias-grid-home");
  grid.innerHTML = "Carregando notícias...";

  // Busca só as 3 notícias mais recentes (limit(3))
  const q = query(collection(db, "noticias"), orderBy("criadoEm", "desc"), limit(3));
  const resultado = await getDocs(q);

  grid.innerHTML = "";

  resultado.forEach((docSnap) => {
    const noticia = docSnap.data();
    const id = docSnap.id;

    const card = document.createElement("article");
    card.className = "noticia-card";
    // O card inteiro vira um link pra página individual da notícia (noticia.html?id=...)
    card.innerHTML = `
      <a href="noticia.html?id=${id}">
        <img src="${noticia.capa}" alt="${noticia.titulo}">
        <span class="noticia-data">${formatarData(noticia.criadoEm)}</span>
        <h3>${noticia.titulo}</h3>
        <p>${noticia.resumo}</p>
      </a>
    `;
    grid.appendChild(card);
  });
}

function formatarData(timestamp) {
  if (!timestamp) return "";
  const data = timestamp.toDate();
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

carregarDestaques();
