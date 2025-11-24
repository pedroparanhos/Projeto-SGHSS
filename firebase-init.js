// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAl1QEJg8AERxTm8_Cm4cBYbeX6qp6s7mg",
  authDomain: "sghss-vidaplus-f175a.firebaseapp.com",
  projectId: "sghss-vidaplus-f175a",
  storageBucket: "sghss-vidaplus-f175a.firebasestorage.app",
  messagingSenderId: "151536461686",
  appId: "1:151536461686:web:8b93cb3f04dbd3f683bc57",
  measurementId: "G-4JS87LGS8Y"
};

// 2. Inicializa o Firebase (usando o 'firebase' global que virá da CDN)
const app = firebase.initializeApp(firebaseConfig);

// 3. Cria as variáveis GLOBAIS que os seus outros scripts (admin_app.js, etc.) vão usar
var auth = firebase.auth();
var db = firebase.firestore();