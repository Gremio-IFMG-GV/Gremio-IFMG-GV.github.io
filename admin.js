// Pega a conexão com o banco de dados (db) e o login (auth)
// que já preparamos no firebase-config.js
import { db, auth } from "./firebase-config.js";

// Ferramentas do Firestore que vamos usar:
// collection = aponta pra uma "pasta" de documentos (aqui, "noticias")
// addDoc = cria um documento novo
// getDocs = busca vários documentos de uma vez
// deleteDoc = apaga um documento
// doc = aponta pra UM documento específico (pelo id)
// updateDoc = atualiza um documento já existente
// query + orderBy = permite buscar os documentos JÁ ORDENADOS (mais novos primeiro)
// serverTimestamp = pega a data/hora atual do servidor do Google (usada pra ordenar)
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc,
  query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Ferramentas de login:
// signInWithEmailAndPassword = tenta logar com o que a pessoa digitou
// onAuthStateChanged = fica "de olho" se tem alguém logado ou não
// signOut = desloga
import {
  signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Aqui a gente "pega" cada elemento do HTML pelo id, pra poder
// ler o que tem dentro deles ou mudar o que aparece na tela
const loginArea = document.getElementById("login-area");
const painelArea = document.getElementById("painel-area");
const formLogin = document.getElementById("form-login");
const erroLogin = document.getElementById("erro-login");
const btnSair = document.getElementById("btn-sair");
const formNoticia = document.getElementById("form-noticia");
const listaNoticias = document.getElementById("lista-noticias");
const btnSalvar = document.getElementById("btn-salvar");

// Essa função roda AUTOMATICAMENTE toda vez que o estado de login muda
// (a página carrega, alguém loga, ou alguém desloga)
onAuthStateChanged(auth, (usuario) => {
  if (usuario) {
    // Existe alguém logado: esconde a tela de login, mostra o painel
    loginArea.style.display = "none";
    painelArea.style.display = "block";
    carregarNoticias(); // já busca as notícias existentes
  } else {
    // Ninguém logado: mostra a tela de login, esconde o painel
    loginArea.style.display = "block";
    painelArea.style.display = "none";
  }
});

// Isso roda quando a pessoa clica em "Entrar" no formulário de login
formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  // preventDefault() impede o comportamento padrão do navegador
  // (que seria recarregar a página inteira ao enviar um formulário)

  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  // .value pega o que a pessoa digitou em cada campo

  try {
    // "try" tenta fazer o login; se der certo, segue em frente
    await signInWithEmailAndPassword(auth, email, senha);
    erroLogin.textContent = "";
  } catch (erro) {
    // "catch" pega o erro se o login falhar (senha errada, etc.)
    // e escreve uma mensagem pra pessoa ver
    erroLogin.textContent = "E-mail ou senha incorretos.";
  }
});

// Clique no botão "Sair": desloga a pessoa
btnSair.addEventListener("click", () => {
  signOut(auth);
});

// Isso roda quando a pessoa clica em "Publicar" (ou "Salvar alterações")
formNoticia.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("noticia-id").value;
  // Se esse campo escondido tiver algum valor, significa que estamos
  // EDITANDO uma notícia existente. Se estiver vazio, é uma notícia NOVA.

  // Monta um "pacote" com todos os dados do formulário
  const dadosNoticia = {
    titulo: document.getElementById("titulo").value,
    data: document.getElementById("data").value,
    capa: document.getElementById("capa").value,
    resumo: document.getElementById("resumo").value,
    tipo: document.getElementById("tipo").value,
    conteudo: document.getElementById("conteudo").value
  };

  if (id) {
    // Já tem id: atualiza o documento que já existe no Firestore
    await updateDoc(doc(db, "noticias", id), dadosNoticia);
  } else {
    // Não tem id: cria um documento novo na coleção "noticias"
    dadosNoticia.criadoEm = serverTimestamp();
    // guarda a data/hora de criação, só pra conseguirmos ordenar depois
    await addDoc(collection(db, "noticias"), dadosNoticia);
  }

  // Depois de salvar, limpa o formulário e volta o botão pro texto padrão
  formNoticia.reset();
  document.getElementById("noticia-id").value = "";
  btnSalvar.textContent = "Publicar";

  carregarNoticias(); // atualiza a lista na tela
});

// Função que busca todas as notícias no Firestore e monta a listinha
async function carregarNoticias() {
  listaNoticias.innerHTML = "Carregando...";

  // Pede os documentos da coleção "noticias", ordenados
  // pelos mais recentes primeiro ("desc" = decrescente)
  const q = query(collection(db, "noticias"), orderBy("criadoEm", "desc"));
  const resultado = await getDocs(q);

  listaNoticias.innerHTML = "";
  // limpa o "Carregando..." antes de preencher de verdade

  // .forEach roda um bloco de código PRA CADA notícia encontrada
  resultado.forEach((docSnap) => {
    const noticia = docSnap.data(); // os dados da notícia (título, data, etc.)
    const id = docSnap.id;          // o "código" único desse documento

    // Cria uma <div> nova na memória (ainda não está na página)
    const item = document.createElement("div");
    item.className = "item-lista-noticia";
    item.innerHTML = `
      <strong>${noticia.titulo}</strong> — ${noticia.data}
      <button class="btn-editar">Editar</button>
      <button class="btn-excluir">Excluir</button>
    `;
    // innerHTML monta o conteúdo de dentro dessa div usando os dados da notícia

    // Quando clicar em "Editar": preenche o formulário com os dados
    // dessa notícia específica, pra pessoa poder alterar e salvar
    item.querySelector(".btn-editar").addEventListener("click", () => {
      document.getElementById("noticia-id").value = id;
      document.getElementById("titulo").value = noticia.titulo;
      document.getElementById("data").value = noticia.data;
      document.getElementById("capa").value = noticia.capa;
      document.getElementById("resumo").value = noticia.resumo;
      document.getElementById("tipo").value = noticia.tipo;
      document.getElementById("conteudo").value = noticia.conteudo;
      btnSalvar.textContent = "Salvar alterações";
      window.scrollTo(0, 0); // rola a página pro topo, onde está o formulário
    });

    // Quando clicar em "Excluir": pergunta se tem certeza, e se sim, apaga
    item.querySelector(".btn-excluir").addEventListener("click", async () => {
      const confirmar = confirm("Tem certeza que quer excluir essa notícia?");
      if (confirmar) {
        await deleteDoc(doc(db, "noticias", id));
        carregarNoticias(); // atualiza a lista depois de excluir
      }
    });

    listaNoticias.appendChild(item);
    // appendChild "planta" essa div de fato dentro da página
  });
}
