import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const lista = document.getElementById("noticias-lista-todas");
const campoBusca = document.getElementById("busca-noticia");
const campoDataDe = document.getElementById("filtro-data-de");
const campoDataAte = document.getElementById("filtro-data-ate");
const campoOrdem = document.getElementById("filtro-ordem");
const btnLimpar = document.getElementById("btn-limpar-filtros");

let todasAsNoticias = [];

function normalizar(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

async function carregarTodas() {
  lista.innerHTML = "Carregando notícias...";

  const q = query(collection(db, "noticias"), orderBy("criadoEm", "desc"));
  const resultado = await getDocs(q);

  todasAsNoticias = [];
  resultado.forEach((docSnap) => {
    todasAsNoticias.push({ id: docSnap.id, ...docSnap.data() });
  });

  aplicarFiltros();
}

function aplicarFiltros() {
  const textoBusca = normalizar(campoBusca.value.trim());
  const dataDe = campoDataDe.value ? new Date(campoDataDe.value + "T00:00:00") : null;
  const dataAte = campoDataAte.value ? new Date(campoDataAte.value + "T23:59:59") : null;

  let filtradas = todasAsNoticias.filter((noticia) => {
    const bateBusca = !textoBusca ||
      normalizar(noticia.titulo).includes(textoBusca) ||
      normalizar(noticia.resumo).includes(textoBusca);

    const dataNoticia = noticia.criadoEm ? noticia.criadoEm.toDate() : null;
    const bateDataDe = !dataDe || (dataNoticia && dataNoticia >= dataDe);
    const bateDataAte = !dataAte || (dataNoticia && dataNoticia <= dataAte);

    return bateBusca && bateDataDe && bateDataAte;
  });

  if (campoOrdem.value === "antigas") {
    filtradas.reverse();
  }

  renderizar(filtradas);
}

function renderizar(noticias) {
  lista.innerHTML = "";

  if (noticias.length === 0) {
    lista.innerHTML = "<p>Nenhuma notícia encontrada com esses filtros.</p>";
    return;
  }

  noticias.forEach((noticia) => {
    const card = document.createElement("article");
    card.className = "noticia-card";
    card.innerHTML = `
      <a href="noticia.html?id=${noticia.id}">
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

campoBusca.addEventListener("input", aplicarFiltros);
campoDataDe.addEventListener("change", aplicarFiltros);
campoDataAte.addEventListener("change", aplicarFiltros);
campoOrdem.addEventListener("change", aplicarFiltros);

btnLimpar.addEventListener("click", () => {
  campoBusca.value = "";
  campoDataDe.value = "";
  campoDataAte.value = "";
  campoOrdem.value = "recentes";
  aplicarFiltros();
});

document.getElementById("btn-toggle-filtros").addEventListener("click", () => {
  const painel = document.getElementById("painel-filtros");
  painel.style.display = painel.style.display === "none" ? "flex" : "none";
});

carregarTodas();
