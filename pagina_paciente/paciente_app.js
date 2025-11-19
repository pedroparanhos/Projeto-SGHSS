// --- VERIFICAÇÃO INICIAL ---
if (typeof firebase === 'undefined') console.error("Firebase não carregado!");

// --- REFERÊNCIAS GLOBAIS ---
const authLayout = document.getElementById('auth-layout');
const appLayout = document.getElementById('app-layout');
const loginForm = document.getElementById('login-form');
const appScreens = document.querySelectorAll('.app-screen');
const navLinks = document.querySelectorAll('.nav-link, .sidebar-link');

// ESTADO DO AGENDAMENTO
let selectedSpecialty = '';
let selectedProfessional = { id: '', name: '' };
let selectedTime = '';

// (PASSO 12) AUTH GUARD
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection("usuarios").doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().tipo === "PACIENTE") {
                showLayout(appLayout);
                inicializarDadosPaciente(user.uid);
                updateNavSelection('dashboard-screen');
            } else {
                auth.signOut();
                showLayout(authLayout);
            }
        });
    } else {
        showLayout(authLayout);
        showAppScreen(null);
    }
});

function showLayout(layout) {
    authLayout.classList.add('hidden');
    appLayout.classList.add('hidden');
    if (layout) layout.classList.remove('hidden');
    if (layout === appLayout) layout.classList.add('flex');
}

// --- NAVEGAÇÃO CENTRALIZADA (Correção 1) ---
function showAppScreen(screenToShow) {
    if (!screenToShow) return;
    
    // 1. Esconde todos
    appScreens.forEach(s => s.classList.add('hidden'));
    
    // 2. Mostra o alvo
    screenToShow.classList.remove('hidden');
    updateNavSelection(screenToShow.id);
    
    // Lógica específica de atualização ao entrar na tela
    if(screenToShow.id === 'telemedicine-screen') {
        carregarTelemedicina(auth.currentUser.uid);
    }
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function updateNavSelection(targetId) {
    // Remove classes ativas de todos
    navLinks.forEach(link => {
        link.classList.remove('text-ciano-vibrante', 'active'); 
        link.classList.add('text-texto-secundario'); 
        
        if(link.classList.contains('sidebar-link')) {
            link.classList.remove('bg-ciano-vibrante/10', 'text-ciano-vibrante', 'font-bold');
        }
    });

    // Adiciona ao alvo
    const targets = document.querySelectorAll(`[data-target="${targetId}"]`);
    targets.forEach(link => {
        link.classList.remove('text-texto-secundario');
        link.classList.add('text-ciano-vibrante'); 
        
        if(link.classList.contains('sidebar-link')) {
            link.classList.add('bg-ciano-vibrante/10', 'text-ciano-vibrante', 'font-bold');
        }
    });
}

// Listeners de Navegação
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        const screen = document.getElementById(targetId);
        if(screen) showAppScreen(screen);
    });
});

// --- LÓGICA DE CADASTRO (RESTAURADA) ---
const steps = [document.getElementById('step-1'), document.getElementById('step-2'), document.getElementById('step-3')];
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressIndicator = document.getElementById('progress-indicator');
const stepTitle = document.getElementById('step-title');
const titles = [ "Vamos começar.", "Seus contatos.", "Segurança." ];
let currentStep = 0;

function updateStep() {
    if (!steps[0]) return;
    steps.forEach((step, index) => { 
        if(step) step.classList.toggle('hidden', index !== currentStep); 
    });
    if(progressIndicator) progressIndicator.textContent = `Passo ${currentStep + 1} de ${steps.length}`;
    if(stepTitle) stepTitle.textContent = titles[currentStep];
    
    if(prevBtn) prevBtn.classList.toggle('hidden', currentStep === 0);
    if(nextBtn) nextBtn.textContent = currentStep === steps.length - 1 ? 'Finalizar' : 'Avançar';
}

if(nextBtn) {
    nextBtn.addEventListener('click', () => {
        const currentStepElement = steps[currentStep];
        const inputs = currentStepElement.querySelectorAll('input[required]');
        let valid = true;
        
        inputs.forEach(input => {
            if (!input.value) {
                valid = false;
                input.classList.add('border-red-500', 'border-2');
            } else {
                input.classList.remove('border-red-500', 'border-2');
            }
        });

        if (!valid) {
            alert("Preencha os campos obrigatórios.");
            return;
        }

        if (currentStep === 2) { // Finalizar
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const nomeCompleto = document.getElementById('fullName').value;
            const cpf = document.getElementById('cpf').value;
            const dataNasc = document.getElementById('birthDate').value;
            const phone = document.getElementById('phone').value;

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    return db.collection("usuarios").doc(userCredential.user.uid).set({
                        nome: nomeCompleto,
                        cpf: cpf,
                        dataNascimento: dataNasc,
                        telefone: phone,
                        email: email,
                        tipo: "PACIENTE"
                    });
                })
                .then(() => {
                    alert("Conta criada com sucesso!");
                    // Auth state changed fará o resto
                })
                .catch((error) => {
                    alert("Erro ao cadastrar: " + error.message);
                });

        } else {
            currentStep++;
            updateStep();
        }
    });
}

if(prevBtn) prevBtn.addEventListener('click', () => {
    if (currentStep > 0) {
        currentStep--;
        updateStep();
    }
});

// --- NAVEGAÇÃO AUTH ---
const goToRegister = document.getElementById('go-to-register');
const goToLogin = document.getElementById('go-to-login');
const loginScreen = document.getElementById('login-screen');
const registerScreen = document.getElementById('register-screen');

if(goToRegister) goToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginScreen.classList.add('hidden');
    registerScreen.classList.remove('hidden');
});

if(goToLogin) goToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
});

// --- LÓGICA DE AGENDAMENTO (Correção 2) ---
document.getElementById('go-to-schedule').addEventListener('click', () => {
    showAppScreen(document.getElementById('specialty-screen'));
    carregarEspecialidades();
});

function carregarEspecialidades() {
    const grid = document.getElementById('specialty-grid');
    grid.innerHTML = '<p class="col-span-full text-center text-texto-secundario">A carregar...</p>';
    
    db.collection("usuarios").where("tipo", "==", "PROFISSIONAL").get().then(snap => {
        const set = new Set();
        snap.forEach(doc => { if(doc.data().especialidade) set.add(doc.data().especialidade); });
        
        grid.innerHTML = '';
        if(set.size === 0) grid.innerHTML = '<p class="col-span-full text-center">Nenhum médico encontrado.</p>';
        
        set.forEach(esp => {
            const btn = document.createElement('button');
            btn.className = "bg-fundo-secundario p-4 rounded-xl flex flex-col items-center justify-center hover:bg-campo transition-all cursor-pointer shadow-md";
            btn.innerHTML = `<div class="bg-ciano-vibrante/20 p-3 rounded-full mb-2"><i data-lucide="stethoscope" class="text-ciano-vibrante"></i></div><span class="font-semibold">${esp}</span>`;
            btn.onclick = () => {
                selectedSpecialty = esp;
                document.getElementById('professional-specialty-title').textContent = esp;
                showAppScreen(document.getElementById('professional-screen'));
                carregarProfissionais(esp);
            };
            grid.appendChild(btn);
        });
        lucide.createIcons();
    });
}

function carregarProfissionais(esp) {
    const list = document.getElementById('lista-profissionais');
    list.innerHTML = '<p class="text-center">A procurar...</p>';
    
    db.collection("usuarios").where("tipo", "==", "PROFISSIONAL").where("especialidade", "==", esp).get().then(snap => {
        list.innerHTML = '';
        if(snap.empty) list.innerHTML = '<p class="text-center">Nenhum profissional disponível nesta especialidade.</p>';
        
        snap.forEach(doc => {
            const d = doc.data();
            const btn = document.createElement('button');
            btn.className = "w-full bg-fundo-secundario p-4 rounded-xl flex items-center gap-4 hover:bg-campo transition-all text-left cursor-pointer shadow-md";
            btn.innerHTML = `<div class="w-10 h-10 bg-ciano-vibrante/20 rounded-full flex items-center justify-center font-bold text-ciano-vibrante">${d.nome ? d.nome[0] : 'M'}</div><div class="flex-1"><p class="font-bold">${d.nome}</p><p class="text-sm text-texto-secundario">Disponível</p></div><i data-lucide="chevron-right"></i>`;
            btn.onclick = () => {
                selectedProfessional = { id: doc.id, name: d.nome };
                document.getElementById('datetime-professional-name').textContent = d.nome;
                document.getElementById('datetime-professional-specialty').textContent = esp;
                showAppScreen(document.getElementById('datetime-screen'));
            };
            list.appendChild(btn);
        });
        lucide.createIcons();
    });
}

// Seleção de Hora
document.querySelectorAll('.time-slot').forEach(slot => {
    slot.addEventListener('click', () => {
        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('bg-ciano-vibrante', 'text-white', 'border-ciano-vibrante'));
        slot.classList.add('bg-ciano-vibrante', 'text-white', 'border-ciano-vibrante');
        selectedTime = slot.textContent;
        document.getElementById('go-to-confirmation').classList.remove('hidden');
    });
});

document.getElementById('go-to-confirmation').addEventListener('click', () => {
    document.getElementById('confirm-professional-name').textContent = selectedProfessional.name;
    document.getElementById('confirm-specialty').textContent = selectedSpecialty;
    document.getElementById('confirm-date').textContent = "Amanhã"; 
    document.getElementById('confirm-time').textContent = selectedTime;
    showAppScreen(document.getElementById('confirmation-screen'));
});

document.getElementById('confirm-appointment-btn').addEventListener('click', () => {
    const data = new Date();
    data.setDate(data.getDate() + 1); 
    
    db.collection("consultas").add({
        pacienteId: auth.currentUser.uid,
        profissionalId: selectedProfessional.id,
        nomeMedico: selectedProfessional.name,
        especialidade: selectedSpecialty,
        data: firebase.firestore.Timestamp.fromDate(data),
        horario: selectedTime,
        status: "Agendada"
    }).then(() => {
        showAppScreen(document.getElementById('success-screen'));
    }).catch(err => alert("Erro ao agendar: " + err.message));
});

document.getElementById('back-to-home-btn').addEventListener('click', () => showAppScreen(document.getElementById('dashboard-screen')));

// --- TELEMEDICINA (Correção 3) ---
document.getElementById('go-to-telemedicine-dash').addEventListener('click', () => showAppScreen(document.getElementById('telemedicine-screen')));

function carregarTelemedicina(userId) {
    const boxInfo = document.getElementById('tele-info-box');
    const boxSem = document.getElementById('tele-sem-consulta');
    const btnJoin = document.getElementById('join-call-btn');

    boxInfo.classList.add('hidden');
    boxSem.classList.remove('hidden');
    btnJoin.classList.add('hidden');

    db.collection("consultas")
        .where("pacienteId", "==", userId)
        .orderBy("data", "asc")
        .limit(1)
        .get()
        .then(snap => {
            if(!snap.empty) {
                const c = snap.docs[0].data();
                const d = c.data.toDate();
                
                // Mostra info
                boxInfo.classList.remove('hidden');
                boxSem.classList.add('hidden');
                btnJoin.classList.remove('hidden'); // Sempre mostra para teste
                
                document.getElementById('tele-medico-nome').textContent = c.nomeMedico;
                document.getElementById('tele-hora').textContent = d.toLocaleDateString() + ' às ' + (c.horario || d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
            }
        });
}

document.getElementById('join-call-btn').addEventListener('click', () => {
    document.getElementById('waiting-room-view').classList.add('hidden');
    document.getElementById('call-view').classList.remove('hidden');
    document.getElementById('call-view').classList.add('flex');
});

document.getElementById('end-call-btn').addEventListener('click', () => {
    document.getElementById('call-view').classList.remove('flex');
    document.getElementById('call-view').classList.add('hidden');
    document.getElementById('waiting-room-view').classList.remove('hidden');
});


// --- ABAS DE CONSULTAS ---
const tabUpcoming = document.getElementById('tab-upcoming');
const tabPast = document.getElementById('tab-past');
const listUp = document.getElementById('lista-consultas-proximas');
const listPast = document.getElementById('lista-consultas-passadas');

tabUpcoming.addEventListener('click', () => {
    tabUpcoming.classList.replace('border-transparent', 'border-ciano-vibrante');
    tabUpcoming.classList.replace('text-texto-secundario', 'text-ciano-vibrante');
    tabPast.classList.replace('border-ciano-vibrante', 'border-transparent');
    tabPast.classList.replace('text-ciano-vibrante', 'text-texto-secundario');
    listUp.classList.remove('hidden');
    listPast.classList.add('hidden');
});

tabPast.addEventListener('click', () => {
    tabPast.classList.replace('border-transparent', 'border-ciano-vibrante');
    tabPast.classList.replace('text-texto-secundario', 'text-ciano-vibrante');
    tabUpcoming.classList.replace('border-ciano-vibrante', 'border-transparent');
    tabUpcoming.classList.replace('text-ciano-vibrante', 'text-texto-secundario');
    listPast.classList.remove('hidden');
    listUp.classList.add('hidden');
});

// --- CARREGAMENTO GERAL ---
function inicializarDadosPaciente(uid) {
    // Dashboard (Próxima Consulta)
    db.collection("consultas").where("pacienteId", "==", uid).orderBy("data", "asc").limit(1).onSnapshot(snap => {
        if(!snap.empty) {
            const c = snap.docs[0].data();
            document.getElementById('sem-consulta-msg').classList.add('hidden');
            document.getElementById('detalhes-consulta').classList.remove('hidden');
            document.getElementById('proxima-consulta-medico').textContent = c.nomeMedico;
            document.getElementById('proxima-consulta-especialidade').textContent = c.especialidade;
            const d = c.data.toDate();
            document.getElementById('proxima-consulta-data').textContent = d.toLocaleDateString();
            document.getElementById('proxima-consulta-hora').textContent = c.horario || d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        }
    });

    // Minhas Consultas (Lista)
    db.collection("consultas").where("pacienteId", "==", uid).onSnapshot(snap => {
        listUp.innerHTML = ''; listPast.innerHTML = '';
        if(snap.empty) listUp.innerHTML = '<p class="text-center py-4 col-span-full">Sem consultas.</p>';
        
        const now = new Date();
        snap.forEach(doc => {
            const c = doc.data();
            const d = c.data.toDate();
            const isFuture = d >= now; // Lógica simples de tempo
            
            const html = `
            <div class="bg-fundo-secundario p-4 rounded-xl shadow flex gap-4 items-start">
                <div class="w-10 h-10 bg-ciano-vibrante/20 rounded-full flex items-center justify-center text-ciano-vibrante font-bold">${c.nomeMedico ? c.nomeMedico[0] : 'M'}</div>
                <div>
                    <p class="font-bold">${c.nomeMedico}</p>
                    <p class="text-sm text-ciano-vibrante">${c.especialidade}</p>
                    <p class="text-xs text-texto-secundario mt-1">${d.toLocaleDateString()} às ${c.horario || '--:--'}</p>
                </div>
            </div>`;
            if(isFuture) listUp.innerHTML += html; else listPast.innerHTML += html;
        });
    });

    // Dados do Utilizador (Nome)
    db.collection("usuarios").doc(uid).get().then(doc => {
        if(doc.exists) {
            const nome = doc.data().nome.split(' ')[0];
            const inicial = nome[0] || 'U';
            document.getElementById('dashboard-nome-paciente').textContent = nome;
            document.getElementById('sidebar-avatar-name').textContent = nome;
            document.getElementById('sidebar-avatar-img').src = `https://placehold.co/40x40/06B6D4/FFFFFF?text=${inicial}`;
            document.getElementById('mobile-avatar-img').src = `https://placehold.co/40x40/06B6D4/FFFFFF?text=${inicial}`;
        }
    });
}

// Login listener
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    auth.signInWithEmailAndPassword(email, pass).catch(err => alert("Erro no login: " + err.message));
});

// Logout
document.getElementById('logout-btn-desktop').addEventListener('click', () => auth.signOut());