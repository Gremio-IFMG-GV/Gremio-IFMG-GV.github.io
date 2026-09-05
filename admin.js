// Pega a conexão com o banco de dados (db) e o login (auth)
// que já preparamos no firebase-config.js
import { db, auth } from "./firebase-config.js";

// Ferramentas do Firestore que vamos usar
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc,
  query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Ferramentas de login
import {
  signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const loginArea = document.getElementById("login-area");
const painelArea = document.getElementById("painel-area");
const formLogin = document.getElementById("form-login");
const erroLogin = document.getElementById("erro-login");
const btnSair = document.getElementById("btn-sair");
const formNoticia = document.getElementById("form-noticia");
const listaNoticias = document.getElementById("lista-noticias");
const btnSalvar = document.getElementById("btn-salvar");

// Roda automaticamente sempre que o login muda (carrega, loga, ou desloga)
onAuthStateChanged(auth, (usuario) => {
  if (usuario) {
    loginArea.style.display = "none";
    painelArea.style.display = "block";
    carregarNoticias();
  } else {
    loginArea.style.display = "block";
    painelArea.style.display = "none";
  }
});

// Login
formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {
    await signInWithEmailAndPassword(auth, email, senha);
    erroLogin.textContent = "";
  } catch (erro) {
    erroLogin.textContent = "E-mail ou senha incorretos.";
  }
});

// Sair
btnSair.addEventListener("click", () => {
  signOut(auth);
});

// Publicar (criar) ou editar (atualizar) uma notícia
formNoticia.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("noticia-id").value;

  const dadosNoticia = {
    titulo: document.getElementById("titulo").value,
    capa: document.getElementById("capa").value,
    resumo: document.getElementById("resumo").value,
    tipo: document.getElementById("tipo").value,
    conteudo: document.getElementById("conteudo").value
  };

  if (id) {
    // Já existe: atualiza, sem mexer no criadoEm original
    await updateDoc(doc(db, "noticias", id), dadosNoticia);
  } else {
    // Não existe: cria nova, com a data/hora automática do servidor
    dadosNoticia.criadoEm = serverTimestamp();
    await addDoc(collection(db, "noticias"), dadosNoticia);
  }

  formNoticia.reset();
  document.getElementById("noticia-id").value = "";
  btnSalvar.textContent = "Publicar";
  carregarNoticias();
});

// Busca e mostra a lista de notícias já publicadas
async function carregarNoticias() {
  listaNoticias.innerHTML = "Carregando...";

  const q = query(collection(db, "noticias"), orderBy("criadoEm", "desc"));
  const resultado = await getDocs(q);

  listaNoticias.innerHTML = "";

  resultado.forEach((docSnap) => {
    const noticia = docSnap.data();
    const id = docSnap.id;

    const item = document.createElement("div");
    item.className = "item-lista-noticia";
    item.innerHTML = `
      <strong>${noticia.titulo}</strong> — ${formatarData(noticia.criadoEm)}
      <button class="btn-editar">Editar</button>
      <button class="btn-excluir">Excluir</button>
    `;

    item.querySelector(".btn-editar").addEventListener("click", () => {
      document.getElementById("noticia-id").value = id;
      document.getElementById("titulo").value = noticia.titulo;
      document.getElementById("capa").value = noticia.capa;
      document.getElementById("resumo").value = noticia.resumo;
      document.getElementById("tipo").value = noticia.tipo;
      document.getElementById("conteudo").value = noticia.conteudo;
      btnSalvar.textContent = "Salvar alterações";
      window.scrollTo(0, 0);
    });

    item.querySelector(".btn-excluir").addEventListener("click", async () => {
      const confirmar = confirm("Tem certeza que quer excluir essa notícia?");
      if (confirmar) {
        await deleteDoc(doc(db, "noticias", id));
        carregarNoticias();
      }
    });

    listaNoticias.appendChild(item);
  });
}

// Transforma o "criadoEm" (formato técnico do Firebase) numa data legível
function formatarData(timestamp) {
  if (!timestamp) return "publicando...";
  const data = timestamp.toDate();
  const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dataFormatada} às ${horaFormatada}`;
}
