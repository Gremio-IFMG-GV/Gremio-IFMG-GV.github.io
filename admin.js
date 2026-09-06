import { db, auth } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc,
  query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Dados do Cloudinary (upload de imagem sem precisar de servidor próprio)
const CLOUDINARY_CLOUD_NAME = "bkwfwviq";
const CLOUDINARY_UPLOAD_PRESET = "Site-IFMG";

// --- Elementos da tela ---
const loginArea = document.getElementById("login-area");
const menuArea = document.getElementById("menu-area");
const criarArea = document.getElementById("criar-area");
const postadasArea = document.getElementById("postadas-area");

const formLogin = document.getElementById("form-login");
const erroLogin = document.getElementById("erro-login");
const btnSair = document.getElementById("btn-sair");

const btnIrCriar = document.getElementById("btn-ir-criar");
const btnIrPostadas = document.getElementById("btn-ir-postadas");
const btnVoltarCriar = document.getElementById("btn-voltar-criar");
const btnVoltarPostadas = document.getElementById("btn-voltar-postadas");

const formNoticia = document.getElementById("form-noticia");
const btnSalvar = document.getElementById("btn-salvar");
const tituloTelaCriar = document.getElementById("titulo-tela-criar");

const capaArquivo = document.getElementById("capa-arquivo");
const capaStatus = document.getElementById("capa-status");
const capaPreview = document.getElementById("capa-preview");

const editorConteudo = document.getElementById("editor-conteudo");
const btnInserirImagem = document.getElementById("btn-inserir-imagem");
const btnInserirVideo = document.getElementById("btn-inserir-video");
const inputImagemConteudo = document.getElementById("input-imagem-conteudo");

const listaPostadas = document.getElementById("lista-postadas");

// Guarda o link da capa já enviada ao Cloudinary
let capaUrlAtual = "";

// --- Navegação entre telas ---
function mostrarTela(tela) {
  [menuArea, criarArea, postadasArea].forEach((secao) => secao.style.display = "none");
  tela.style.display = "block";
}

btnIrCriar.addEventListener("click", () => {
  limparFormulario();
  tituloTelaCriar.textContent = "Criar Notícia";
  btnSalvar.textContent = "Publicar";
  mostrarTela(criarArea);
});

btnIrPostadas.addEventListener("click", () => {
  mostrarTela(postadasArea);
  carregarPostadas();
});

btnVoltarCriar.addEventListener("click", () => mostrarTela(menuArea));
btnVoltarPostadas.addEventListener("click", () => mostrarTela(menuArea));

function limparFormulario() {
  formNoticia.reset();
  document.getElementById("noticia-id").value = "";
  editorConteudo.innerHTML = "";
  capaUrlAtual = "";
  capaPreview.style.display = "none";
  capaStatus.textContent = "";
}

// --- Login ---
onAuthStateChanged(auth, (usuario) => {
  if (usuario) {
    loginArea.style.display = "none";
    mostrarTela(menuArea);
  } else {
    loginArea.style.display = "block";
    [menuArea, criarArea, postadasArea].forEach((secao) => secao.style.display = "none");
  }
});

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

btnSair.addEventListener("click", () => signOut(auth));

// --- Upload de imagem no Cloudinary (reaproveitado pra capa e pro conteúdo) ---
async function enviarImagemParaCloudinary(arquivo) {
  const dadosForm = new FormData();
  dadosForm.append("file", arquivo);
  dadosForm.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const resposta = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: dadosForm }
  );
  const dados = await resposta.json();
  return dados.secure_url;
}

// --- Upload da capa ---
capaArquivo.addEventListener("change", async () => {
  const arquivo = capaArquivo.files[0];
  if (!arquivo) return;

  capaStatus.textContent = "Enviando imagem...";
  const url = await enviarImagemParaCloudinary(arquivo);
  capaUrlAtual = url;

  capaPreview.src = url;
  capaPreview.style.display = "block";
  capaStatus.textContent = "Imagem enviada!";
});

// --- Inserir conteúdo no editor rico, na posição do cursor ---
let ultimaSelecaoRange = null;

function salvarSelecao() {
  const selecao = window.getSelection();
  if (selecao.rangeCount > 0 && editorConteudo.contains(selecao.anchorNode)) {
    ultimaSelecaoRange = selecao.getRangeAt(0).cloneRange();
  }
}
editorConteudo.addEventListener("keyup", salvarSelecao);
editorConteudo.addEventListener("mouseup", salvarSelecao);
editorConteudo.addEventListener("click", salvarSelecao);

function inserirNoEditor(node) {
  editorConteudo.focus();
  const selecao = window.getSelection();
  selecao.removeAllRanges();

  let range;
  if (ultimaSelecaoRange) {
    range = ultimaSelecaoRange;
  } else {
    range = document.createRange();
    range.selectNodeContents(editorConteudo);
    range.collapse(false);
  }
  selecao.addRange(range);

  range.deleteContents();
  range.insertNode(node);

  range.setStartAfter(node);
  range.setEndAfter(node);
  selecao.removeAllRanges();
  selecao.addRange(range);

  salvarSelecao();
}

// Botão "Inserir imagem aqui"
btnInserirImagem.addEventListener("click", () => {
  salvarSelecao();
  inputImagemConteudo.click();
});

inputImagemConteudo.addEventListener("change", async () => {
  const arquivo = inputImagemConteudo.files[0];
  if (!arquivo) return;

  const url = await enviarImagemParaCloudinary(arquivo);
  const imagem = document.createElement("img");
  imagem.src = url;
  imagem.className = "imagem-inserida";
  inserirNoEditor(imagem);

  inputImagemConteudo.value = "";
});

// Botão "Inserir vídeo aqui"
btnInserirVideo.addEventListener("click", () => {
  salvarSelecao();
  const link = prompt("Cole o link do vídeo (YouTube ou link direto de um arquivo de vídeo):");
  if (!link) return;

  const wrapper = document.createElement("div");
  wrapper.className = "video-inserido";
  wrapper.contentEditable = "false"; // impede editar por dentro do player
  wrapper.innerHTML = converterParaEmbed(link);
  inserirNoEditor(wrapper);
});

function converterParaEmbed(link) {
  const youtubeMatch = link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) {
    const id = youtubeMatch[1];
    return `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`;
  }
  return `<video controls width="100%" src="${link}"></video>`;
}

// --- Publicar ou editar notícia ---
formNoticia.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!capaUrlAtual) {
    alert("Escolha uma imagem de capa antes de publicar.");
    return;
  }

  const id = document.getElementById("noticia-id").value;

  const dadosNoticia = {
    titulo: document.getElementById("titulo").value,
    resumo: document.getElementById("resumo").value,
    capa: capaUrlAtual,
    conteudo: editorConteudo.innerHTML
  };

  if (id) {
    await updateDoc(doc(db, "noticias", id), dadosNoticia);
  } else {
    dadosNoticia.criadoEm = serverTimestamp();
    await addDoc(collection(db, "noticias"), dadosNoticia);
  }

  alert("Notícia salva com sucesso!");
  mostrarTela(menuArea);
});

// --- Notícias Postadas ---
async function carregarPostadas() {
  listaPostadas.innerHTML = "Carregando...";

  const q = query(collection(db, "noticias"), orderBy("criadoEm", "desc"));
  const resultado = await getDocs(q);

  listaPostadas.innerHTML = "";

  resultado.forEach((docSnap) => {
    const noticia = docSnap.data();
    const id = docSnap.id;

    const card = document.createElement("article");
    card.className = "noticia-card";
    card.innerHTML = `
      <img src="${noticia.capa}" alt="${noticia.titulo}">
      <span class="noticia-data">${formatarData(noticia.criadoEm)}</span>
      <h3>${noticia.titulo}</h3>
      <p>${noticia.resumo}</p>
      <div class="card-postada-botoes">
        <button class="btn-editar-postada">Editar</button>
        <button class="btn-excluir-postada">Excluir</button>
      </div>
    `;

    card.querySelector(".btn-editar-postada").addEventListener("click", () => {
      document.getElementById("noticia-id").value = id;
      document.getElementById("titulo").value = noticia.titulo;
      document.getElementById("resumo").value = noticia.resumo;
      capaUrlAtual = noticia.capa;
      capaPreview.src = noticia.capa;
      capaPreview.style.display = "block";
      capaStatus.textContent = "";
      editorConteudo.innerHTML = noticia.conteudo || "";
      tituloTelaCriar.textContent = "Editar Notícia";
      btnSalvar.textContent = "Salvar alterações";
      mostrarTela(criarArea);
    });

    card.querySelector(".btn-excluir-postada").addEventListener("click", async () => {
      const confirmar = confirm("Tem certeza que quer excluir essa notícia?");
      if (confirmar) {
        await deleteDoc(doc(db, "noticias", id));
        carregarPostadas();
      }
    });

    listaPostadas.appendChild(card);
  });
}

function formatarData(timestamp) {
  if (!timestamp) return "publicando...";
  const data = timestamp.toDate();
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
