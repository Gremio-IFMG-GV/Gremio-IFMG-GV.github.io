// Importa as ferramentas do Firebase direto da internet (sem precisar instalar nada)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// As chaves do seu projeto (as mesmas que você me mandou)
export const firebaseConfig = {
  apiKey: "AIzaSyA-E3VbgqkelY-eB8jZ65EZJjxDySk46eM",
  authDomain: "gremio-ifmg.firebaseapp.com",
  projectId: "gremio-ifmg",
  storageBucket: "gremio-ifmg.firebasestorage.app",
  messagingSenderId: "79701581150",
  appId: "1:79701581150:web:a2ef411b143332f65b43cf"
};

// Inicia a conexão
const app = initializeApp(firebaseConfig);

// Deixa pronto pra outras páginas usarem: o banco de dados (db), o login (auth)
// e a configuração (firebaseConfig, usada pra criar contas sem perder sua sessão)
export const db = getFirestore(app);
export const auth = getAuth(app);
