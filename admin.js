import { db, auth, firebaseConfig } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc,
  query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  signInWithEmailAndPassword, onAuthStateChanged, signOut, getAuth, createUserWithEmailAndPassword,
  setPersistence, browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail, updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const CLOUDINARY_CLOUD_NAME = "bkwfwviq";
const CLOUDINARY_UPLOAD_PRESET = "Site-IFMG";

// Ícones de olho (SVG simples, sem emoji)
const ICONE_OLHO_ABERTO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICONE_OLHO_FECHADO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.6 21.6 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a21.6 21.6 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

// Pop-up centralizado, reaproveitado no admin (mensagens de aviso/sucesso)
function mostrarPopupAdmin(mensagem) {
  const overlay = document.getElementById("popup-overlay");
  const texto = document.getElementById("popup-mensagem");
  const botaoOk = document.getElementById("popup-ok");

  texto.textContent = mensagem;
  overlay.style.display = "flex";
  botaoOk.onclick = () => overlay.style.display = "none";
}

// --- Elementos da tela ---
const loginArea = document.getElementById("login-area");
const menuArea = document.getElementById("menu-area");
const criarArea = document.getElementById("criar-area");
const postadasArea = document.getElementById("postadas-area");
const usuarioArea = document.getElementById("usuario-area");

const formLogin = document.getElementById("form-login");
const erroLogin = document.getElementById("erro-login");
const btnSair = document.getElementById("btn-sair");

const btnIrCriar = document.getElementById("btn-ir-criar");
const btnIrPostadas = document.getElementById("btn-ir-postadas");
const btnIrUsuario = document.getElementById("btn-ir-usuario");
const btnVoltarCriar = document.getElementById("btn-voltar-criar");
const btnVoltarPostadas = document.getElementById("btn-voltar-postadas");
const btnVoltarUsuario = document.getElementById("btn-voltar-usuario");

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
const inputVideoConteudo = document.getElementById("input-video-conteudo");
const seletorFonte = document.getElementById("seletor-fonte");
const btnFormatoElementos = document.querySelectorAll(".btn-formato");

const listaPostadas = document.getElementById("lista-postadas");

const formUsuario = document.getElementById("form-usuario");
const usuarioStatus = document.getElementById("usuario-status");

let capaUrlAtual = "";

// --- Navegação entre telas ---
function mostrarTela(tela) {
  [menuArea, criarArea, postadasArea, usuarioArea, document.getElementById("perfil-area"), document.getElementById("imagens-area")].forEach((secao) => secao.style.display = "none");
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

btnIrUsuario.addEventListener("click", () => {
  formUsuario.reset();
  usuarioStatus.textContent = "";
  mostrarTela(usuarioArea);
});

btnVoltarCriar.addEventListener("click", () => mostrarTela(menuArea));
btnVoltarPostadas.addEventListener("click", () => mostrarTela(menuArea));
btnVoltarUsuario.addEventListener("click", () => mostrarTela(menuArea));

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
    loginArea.style.display = "flex";
    [menuArea, criarArea, postadasArea, usuarioArea].forEach((secao) => secao.style.display = "none");
  }
});

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const manterLogin = document.getElementById("manter-login").checked;

  try {
    await setPersistence(auth, manterLogin ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, senha);
    erroLogin.textContent = "";
  } catch (erro) {
    erroLogin.textContent = "E-mail ou senha incorretos.";
  }
});

// Mostrar/esconder a senha digitada, trocando o ícone junto
const iconeOlho = document.getElementById("icone-olho");
iconeOlho.innerHTML = ICONE_OLHO_ABERTO;

document.getElementById("btn-mostrar-senha").addEventListener("click", () => {
  const campoSenha = document.getElementById("senha");
  const mostrando = campoSenha.type === "password";
  campoSenha.type = mostrando ? "text" : "password";
  iconeOlho.innerHTML = mostrando ? ICONE_OLHO_FECHADO : ICONE_OLHO_ABERTO;
});

// Esqueceu a senha
document.getElementById("link-esqueceu-senha").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  if (!email) {
    erroLogin.textContent = "Digite seu e-mail no campo acima primeiro.";
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    erroLogin.textContent = "";
    mostrarPopupAdmin("E-mail de redefinição enviado! Confira sua caixa de entrada (e o spam).");
  } catch (erro) {
    erroLogin.textContent = "Não foi possível enviar o e-mail: " + erro.message;
  }
});

btnSair.addEventListener("click", () => signOut(auth));

// --- Upload no Cloudinary (imagem e vídeo) ---
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

async function enviarVideoParaCloudinary(arquivo) {
  const dadosForm = new FormData();
  dadosForm.append("file", arquivo);
  dadosForm.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const resposta = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
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

function atualizarEstadoBotoes() {
  btnFormatoElementos.forEach((botao) => {
    const ativo = document.queryCommandState(botao.dataset.comando);
    botao.classList.toggle("formato-ativo", ativo);
  });

  const fonteAtual = document.queryCommandValue("fontName").replace(/['"]/g, "");
  const opcaoExistente = Array.from(seletorFonte.options).find((op) => op.value === fonteAtual);
  seletorFonte.value = opcaoExistente ? fonteAtual : "";
}

function aoMexerNoEditor() {
  salvarSelecao();
  atualizarEstadoBotoes();
}

editorConteudo.addEventListener("keyup", aoMexerNoEditor);
editorConteudo.addEventListener("mouseup", aoMexerNoEditor);
editorConteudo.addEventListener("click", aoMexerNoEditor);

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

// --- Inserir imagem ---
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

// --- Inserir vídeo (link ou arquivo, via pop-up de escolha) ---
btnInserirVideo.addEventListener("click", () => {
  salvarSelecao();
  document.getElementById("popup-video-overlay").style.display = "flex";
});

document.getElementById("popup-video-link").addEventListener("click", () => {
  document.getElementById("popup-video-overlay").style.display = "none";
  const link = prompt("Cole o link do vídeo (YouTube ou link direto de um arquivo de vídeo):");
  if (!link) return;

  const wrapper = document.createElement("div");
  wrapper.className = "video-inserido";
  wrapper.contentEditable = "false";
  wrapper.innerHTML = converterParaEmbed(link);
  inserirNoEditor(wrapper);
});

document.getElementById("popup-video-arquivo").addEventListener("click", () => {
  document.getElementById("popup-video-overlay").style.display = "none";
  inputVideoConteudo.click();
});

inputVideoConteudo.addEventListener("change", async (e) => {
  const arquivo = e.target.files[0];
  if (!arquivo) return;

  const url = await enviarVideoParaCloudinary(arquivo);
  const wrapper = document.createElement("div");
  wrapper.className = "video-inserido";
  wrapper.contentEditable = "false";
  wrapper.innerHTML = `<video controls width="100%" src="${url}"></video>`;
  inserirNoEditor(wrapper);

  e.target.value = "";
});

function converterParaEmbed(link) {
  const youtubeMatch = link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) {
    const id = youtubeMatch[1];
    return `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`;
  }
  return `<video controls width="100%" src="${link}"></video>`;
}

// --- Botões de negrito, itálico e sublinhado ---
btnFormatoElementos.forEach((botao) => {
  botao.addEventListener("mousedown", (e) => {
    e.preventDefault();
    document.execCommand(botao.dataset.comando, false, null);
    atualizarEstadoBotoes();
  });
});

// --- Trocar a fonte do trecho selecionado ---
seletorFonte.addEventListener("mousedown", () => salvarSelecao());
seletorFonte.addEventListener("change", (e) => {
  const fonte = e.target.value;
  if (!fonte) return;

  editorConteudo.focus();
  if (ultimaSelecaoRange) {
    const selecao = window.getSelection();
    selecao.removeAllRanges();
    selecao.addRange(ultimaSelecaoRange);
  }
  document.execCommand("fontName", false, fonte);
  salvarSelecao();
  atualizarEstadoBotoes();
});

// --- Publicar ou editar notícia (com autor e data de atualização) ---
formNoticia.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!capaUrlAtual) {
    mostrarPopupAdmin("Escolha uma imagem de capa antes de publicar.");
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
    dadosNoticia.atualizadoEm = serverTimestamp();
    dadosNoticia.autorAtualizacao = auth.currentUser.displayName || auth.currentUser.email;
    await updateDoc(doc(db, "noticias", id), dadosNoticia);
  } else {
    dadosNoticia.criadoEm = serverTimestamp();
    dadosNoticia.autorCriacao = auth.currentUser.displayName || auth.currentUser.email;
    await addDoc(collection(db, "noticias"), dadosNoticia);
  }

  mostrarPopupAdmin("Notícia salva com sucesso!");
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
  const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dataFormatada} às ${horaFormatada}`;
}

// --- Criar Usuário (sem perder a própria sessão) ---
formUsuario.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("novo-nome").value;
  const email = document.getElementById("novo-email").value;
  const senha = document.getElementById("nova-senha").value;

  usuarioStatus.textContent = "Criando conta...";

  const appSecundario = initializeApp(firebaseConfig, "secundario-" + Date.now());
  const authSecundario = getAuth(appSecundario);

  try {
    const credencial = await createUserWithEmailAndPassword(authSecundario, email, senha);
    await updateProfile(credencial.user, { displayName: nome });
    usuarioStatus.textContent = "Usuário criado com sucesso!";
    formUsuario.reset();
  } catch (erro) {
    usuarioStatus.textContent = "Erro ao criar usuário: " + erro.message;
  } finally {
    await deleteApp(appSecundario);
  }
});
// --- Meu Perfil ---
const btnIrPerfil = document.getElementById("btn-ir-perfil");
const btnVoltarPerfil = document.getElementById("btn-voltar-perfil");
const formPerfil = document.getElementById("form-perfil");
const perfilNome = document.getElementById("perfil-nome");
const perfilStatus = document.getElementById("perfil-status");

btnIrPerfil.addEventListener("click", () => {
  perfilNome.value = auth.currentUser.displayName || "";
  perfilStatus.textContent = "";
  mostrarTela(document.getElementById("perfil-area"));
});

btnVoltarPerfil.addEventListener("click", () => mostrarTela(menuArea));

formPerfil.addEventListener("submit", async (e) => {
  e.preventDefault();
  perfilStatus.textContent = "Salvando...";
  try {
    await updateProfile(auth.currentUser, { displayName: perfilNome.value });
    perfilStatus.textContent = "Nome atualizado com sucesso!";
  } catch (erro) {
    perfilStatus.textContent = "Erro: " + erro.message;
  }
});
// --- Imagens do Agendamento ---
import { setDoc, getDoc as getDocConfig } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const btnIrImagens = document.getElementById("btn-ir-imagens");
const btnVoltarImagens = document.getElementById("btn-voltar-imagens");
const btnSalvarImagens = document.getElementById("btn-salvar-imagens");
const imagensStatus = document.getElementById("imagens-status");

const atividadesImagem = ["sinuca", "xadrez", "pingpong"];
const urlsImagensAtuais = {};

btnIrImagens.addEventListener("click", async () => {
  imagensStatus.textContent = "Carregando...";
  mostrarTela(document.getElementById("imagens-area"));

  const referencia = doc(db, "configuracoes", "imagens-agendamento");
  const snap = await getDocConfig(referencia);
  const dados = snap.exists() ? snap.data() : {};

  atividadesImagem.forEach((atividade) => {
    const url = dados[atividade];
    urlsImagensAtuais[atividade] = url || "";
    const preview = document.getElementById(`imagem-${atividade}-preview`);
    if (url) {
      preview.src = url;
      preview.style.display = "block";
    }
  });

  imagensStatus.textContent = "";
});

btnVoltarImagens.addEventListener("click", () => mostrarTela(menuArea));

atividadesImagem.forEach((atividade) => {
  document.getElementById(`imagem-${atividade}-arquivo`).addEventListener("change", async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    imagensStatus.textContent = `Enviando imagem (${atividade})...`;
    const url = await enviarImagemParaCloudinary(arquivo);
    urlsImagensAtuais[atividade] = url;

    const preview = document.getElementById(`imagem-${atividade}-preview`);
    preview.src = url;
    preview.style.display = "block";
    imagensStatus.textContent = "Imagem pronta (não esqueça de clicar em Salvar).";
  });
});

btnSalvarImagens.addEventListener("click", async () => {
  imagensStatus.textContent = "Salvando...";
  const referencia = doc(db, "configuracoes", "imagens-agendamento");
  await setDoc(referencia, urlsImagensAtuais, { merge: true });
  imagensStatus.textContent = "Imagens salvas com sucesso!";
});
