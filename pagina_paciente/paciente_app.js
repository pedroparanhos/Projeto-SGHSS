// (PASSO 12 - FASE 3) Auth Guard e Lógica do Paciente
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection("usuarios").doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().tipo === "PACIENTE") {
                showLayout(appLayout);
                inicializarDadosPaciente(user.uid);
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

// --- ESTADO DA APLICAÇÃO ---
let selectedSpecialty = '';
let selectedProfessional = { id: '', name: '', img: '' };
let selectedDate = '22 de Outubro, 2025'; // Data exemplo ou dinâmica
let selectedTime = '';

// --- REFERÊNCIAS GLOBAIS ---
const authLayout = document.getElementById('auth-layout');
const appLayout = document.getElementById('app-layout');

// --- FUNÇÃO PRINCIPAL DE CARREGAMENTO ---
function inicializarDadosPaciente(userId) {
    carregarDashboardPaciente(userId);
    carregarMinhasConsultas(userId);
    carregarHistorico(userId);
    carregarMensagens(userId);
    carregarTelemedicina(userId);
    // CARREGA AS ESPECIALIDADES DINAMICAMENTE
    carregarEspecialidades();
}

// --- AGENDAMENTO DE CONSULTA ---

// 1. ESCOLHA DA ESPECIALIDADE (CARREGAR DO FIREBASE)
function carregarEspecialidades() {
    const grid = document.getElementById('specialty-grid');
    if (!grid) return;

    // Busca médicos no Firestore para listar especialidades disponíveis
    db.collection("usuarios").where("tipo", "==", "PROFISSIONAL").get().then(snap => {
        const especialidadesSet = new Set();

        snap.forEach(doc => {
            const data = doc.data();
            if (data.especialidade) especialidadesSet.add(data.especialidade);
        });

        grid.innerHTML = ''; // Limpa o loading

        if (especialidadesSet.size === 0) {
            grid.innerHTML = '<p class="col-span-full text-center text-texto-secundario">Nenhuma especialidade encontrada.</p>';
            return;
        }

        especialidadesSet.forEach(esp => {
            const icon = getIconForSpecialty(esp);
            const btn = document.createElement('button');
            btn.className = "specialty-card bg-fundo-secundario p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-2 hover:bg-campo transition-colors";
            btn.innerHTML = `
                <div class="bg-ciano-vibrante/20 p-3 rounded-full"> 
                    <i data-lucide="${icon}" class="text-ciano-vibrante w-6 h-6"></i> 
                </div>
                <p class="font-semibold text-texto-principal text-sm">${esp}</p>
             `;

            // Clique na especialidade
            btn.addEventListener('click', () => {
                selectedSpecialty = esp;
                showAppScreen(document.getElementById('professional-screen'));

                // Atualiza título da próxima tela
                const title = document.getElementById('professional-specialty-title');
                if (title) title.textContent = esp;

                // Carrega médicos dessa especialidade
                carregarProfissionais(esp);
            });

            grid.appendChild(btn);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
}

function getIconForSpecialty(name) {
    const map = {
        'Cardiologia': 'heart-pulse',
        'Dermatologia': 'user',
        'Ortopedia': 'bone',
        'Pediatria': 'baby',
        'Fisioterapia': 'activity',
        'Oftalmologia': 'eye',
        'Clínica Geral': 'stethoscope',
        'Nutrição': 'utensils-crossed',
        'Psicologia': 'brain'
    };
    return map[name] || 'stethoscope'; // Ícone padrão
}

// 2. ESCOLHA DO PROFISSIONAL
function carregarProfissionais(especialidade) {
    const listaContainer = document.getElementById('lista-profissionais');
    if (!listaContainer) return;

    listaContainer.innerHTML = '<p class="text-center text-texto-secundario mt-10">A procurar profissionais...</p>';

    db.collection("usuarios")
        .where("tipo", "==", "PROFISSIONAL")
        .where("especialidade", "==", especialidade)
        .get()
        .then((querySnapshot) => {
            listaContainer.innerHTML = '';

            if (querySnapshot.empty) {
                listaContainer.innerHTML = '<p class="text-center text-texto-principal p-6">Não há profissionais disponíveis.</p>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const medico = doc.data();
                const medicoId = doc.id;
                const iniciais = getInitials(medico.nome);

                const card = document.createElement('button');
                card.className = "professional-card w-full bg-fundo-secundario p-4 rounded-xl flex items-center space-x-4 hover:bg-campo transition-colors text-left";
                card.innerHTML = `
                    <div class="w-12 h-12 rounded-full bg-ciano-vibrante/20 flex items-center justify-center text-ciano-vibrante font-bold text-lg">${iniciais}</div>
                    <div class="flex-1">
                        <p class="font-bold text-texto-principal">${medico.nome}</p>
                        <p class="text-sm text-texto-secundario">Disponível</p>
                    </div>
                    <i data-lucide="chevron-right" class="text-texto-secundario w-5 h-5"></i>
                `;

                card.addEventListener('click', () => {
                    selectedProfessional.id = medicoId;
                    selectedProfessional.name = medico.nome;

                    document.getElementById('datetime-professional-name').textContent = medico.nome;
                    document.getElementById('datetime-professional-specialty').textContent = especialidade;
                    const img = document.getElementById('datetime-professional-img');
                    if (img) img.src = `https://placehold.co/40x40/7DD3FC/FFFFFF?text=${iniciais}`;

                    showAppScreen(document.getElementById('datetime-screen'));
                });

                listaContainer.appendChild(card);
            });
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
}

// 3. DATA E HORA
const timeSlotsGrid = document.getElementById('time-slots-grid');
const goToConfirmationBtn = document.getElementById('go-to-confirmation');
if (timeSlotsGrid) {
    timeSlotsGrid.addEventListener('click', (e) => {
        const target = e.target.closest('.time-slot');
        if (target) {
            timeSlotsGrid.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
            target.classList.add('selected');
            selectedTime = target.textContent;
            if (goToConfirmationBtn) goToConfirmationBtn.classList.remove('hidden');
        }
    });
}
if (goToConfirmationBtn) goToConfirmationBtn.addEventListener('click', () => {
    if (!selectedTime) return;
    document.getElementById('confirm-professional-name').textContent = selectedProfessional.name;
    document.getElementById('confirm-specialty').textContent = selectedSpecialty;
    document.getElementById('confirm-date').textContent = selectedDate;
    document.getElementById('confirm-time').textContent = selectedTime;
    showAppScreen(document.getElementById('confirmation-screen'));
});

// 4. CONFIRMAR AGENDAMENTO
const confirmAppointmentBtn = document.getElementById('confirm-appointment-btn');
if (confirmAppointmentBtn) confirmAppointmentBtn.addEventListener('click', () => {
    const userId = auth.currentUser.uid;
    // Data fictícia para teste (amanhã)
    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 1);

    db.collection("consultas").add({
        pacienteId: userId,
        profissionalId: selectedProfessional.id,
        nomeMedico: selectedProfessional.name,
        especialidade: selectedSpecialty,
        data: firebase.firestore.Timestamp.fromDate(dataFutura),
        status: "Agendada"
    }).then(() => {
        document.getElementById('success-professional-name').textContent = selectedProfessional.name;
        document.getElementById('success-date-time').textContent = `${selectedDate} às ${selectedTime}`;
        showAppScreen(document.getElementById('success-screen'));
        carregarMinhasConsultas(userId);
    });
});

function resetAppointmentState() {
    selectedSpecialty = '';
    selectedProfessional = { id: '', name: '', img: '' };
    selectedTime = '';
    if (timeSlotsGrid) timeSlotsGrid.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    if (goToConfirmationBtn) goToConfirmationBtn.classList.add('hidden');
}


// --- CARREGAMENTO DE DADOS (Dashboard, Consultas, Histórico) ---

function carregarDashboardPaciente(userId) {
    // Avatar e Nome
    db.collection("usuarios").doc(userId).get().then(doc => {
        if (doc.exists) {
            const nome = doc.data().nome;
            const initials = getInitials(nome);
            document.getElementById('sidebar-avatar-name').textContent = nome;
            document.getElementById('dashboard-nome-paciente').textContent = nome;
            const url = `https://placehold.co/40x40/06B6D4/FFFFFF?text=${initials}`;
            document.getElementById('sidebar-avatar-img').src = url;
            document.getElementById('mobile-avatar-img').src = url;
        }
    });
    // Próxima Consulta
    db.collection("consultas").where("pacienteId", "==", userId).where("data", ">=", new Date()).orderBy("data").limit(1).get().then(snap => {
        const divDet = document.getElementById('detalhes-consulta');
        const divMsg = document.getElementById('sem-consulta-msg');
        if (snap.empty) {
            divDet?.classList.add('hidden'); divMsg?.classList.remove('hidden');
        } else {
            divDet?.classList.remove('hidden'); divMsg?.classList.add('hidden');
            const data = snap.docs[0].data();
            const dateObj = data.data.toDate();
            document.getElementById('proxima-consulta-medico').textContent = data.nomeMedico;
            document.getElementById('proxima-consulta-especialidade').textContent = data.especialidade;
            document.getElementById('proxima-consulta-data').textContent = dateObj.toLocaleDateString('pt-PT');
            document.getElementById('proxima-consulta-hora').textContent = dateObj.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
        }
    });
}

function carregarMinhasConsultas(userId) {
    const listaProx = document.getElementById('lista-consultas-proximas');
    const listaPass = document.getElementById('lista-consultas-passadas');
    if (!listaProx || !listaPass) return;

    db.collection("consultas").where("pacienteId", "==", userId).orderBy("data", "desc").onSnapshot(snap => {
        listaProx.innerHTML = ''; listaPass.innerHTML = '';
        if (snap.empty) { listaProx.innerHTML = '<p class="text-center text-texto-secundario text-sm">Sem consultas.</p>'; return; }
        const agora = new Date();
        snap.forEach(doc => {
            const c = doc.data();
            const dataObj = c.data.toDate();
            const isFuture = dataObj >= agora;
            const html = `
             <div class="bg-fundo-secundario p-4 rounded-xl space-y-3 shadow-lg">
                 <div class="flex items-start space-x-3">
                     <div class="w-10 h-10 rounded-full bg-ciano-vibrante/20 flex items-center justify-center text-ciano-vibrante font-bold">${getInitials(c.nomeMedico)}</div>
                     <div class="flex-1">
                         <p class="font-semibold text-texto-principal text-sm">${c.nomeMedico}</p>
                         <p class="text-xs text-texto-secundario">${c.especialidade}</p>
                         <div class="flex items-center space-x-2 mt-1 text-xs text-texto-secundario">
                             <i data-lucide="calendar" class="w-3 h-3"></i> <span>${dataObj.toLocaleDateString('pt-PT')}</span>
                             <i data-lucide="clock" class="w-3 h-3 ml-2"></i> <span>${dataObj.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                     </div>
                 </div>
             </div>`;
            if (isFuture) listaProx.innerHTML += html; else listaPass.innerHTML += html;
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
}

function carregarHistorico(userId) {
    const listaExames = document.getElementById('lista-exames');
    if (listaExames) {
        db.collection("exames").where("pacienteId", "==", userId).get().then(snap => {
            listaExames.innerHTML = snap.empty ? '<p class="text-center text-texto-secundario text-sm">Sem exames.</p>' : '';
            snap.forEach(doc => {
                const e = doc.data();
                listaExames.innerHTML += `<div class="bg-fundo-secundario p-4 rounded-xl flex items-center justify-between shadow-lg"><div class="flex items-center space-x-3"><div class="bg-ciano-vibrante/20 p-2 rounded-lg"><i data-lucide="flask-conical" class="text-ciano-vibrante w-5 h-5"></i></div><div><p class="font-semibold text-texto-principal text-sm">${e.tipo}</p><p class="text-xs text-texto-secundario">${e.data}</p></div></div></div>`;
            });
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }
    const listaReceitas = document.getElementById('lista-receitas');
    if (listaReceitas) {
        db.collection("receitas").where("pacienteId", "==", userId).get().then(snap => {
            listaReceitas.innerHTML = snap.empty ? '<p class="text-center text-texto-secundario text-sm">Sem receitas.</p>' : '';
            snap.forEach(doc => {
                const r = doc.data();
                listaReceitas.innerHTML += `<div class="bg-fundo-secundario p-4 rounded-xl flex items-center justify-between shadow-lg"><div class="flex items-center space-x-3"><div class="bg-ciano-vibrante/20 p-2 rounded-lg"><i data-lucide="pilcrow" class="text-ciano-vibrante w-5 h-5"></i></div><div><p class="font-semibold text-texto-principal text-sm">${r.medicamento}</p><p class="text-xs text-texto-secundario">Emitida por ${r.medico}</p></div></div></div>`;
            });
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }
}

function carregarMensagens(userId) {
    const listaMsg = document.getElementById('lista-mensagens');
    if (!listaMsg) return;
    db.collection("mensagens").where("pacienteId", "==", userId).orderBy("data", "desc").get().then(snap => {
        listaMsg.innerHTML = snap.empty ? '<p class="text-center text-texto-secundario text-sm">Sem mensagens.</p>' : '';
        snap.forEach(doc => {
            const m = doc.data();
            listaMsg.innerHTML += `<div class="bg-fundo-secundario p-4 rounded-xl flex items-center space-x-3 shadow-lg"><div class="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-bold">${getInitials(m.remetente)}</div><div class="flex-1"><p class="font-semibold text-texto-principal text-sm">${m.remetente}</p><p class="text-xs text-texto-secundario">${m.texto}</p></div></div>`;
        });
    });
}

function carregarTelemedicina(userId) {
    db.collection("consultas").where("pacienteId", "==", userId).where("data", ">=", new Date()).orderBy("data").limit(1).get().then(snap => {
        const boxInfo = document.getElementById('tele-info-box');
        const boxSem = document.getElementById('tele-sem-consulta');
        const btnJoin = document.getElementById('join-call-btn');
        if (snap.empty) { boxInfo.classList.add('hidden'); btnJoin.classList.add('hidden'); boxSem.classList.remove('hidden'); return; }
        const c = snap.docs[0].data();
        boxInfo.classList.remove('hidden'); btnJoin.classList.remove('hidden'); boxSem.classList.add('hidden');
        document.getElementById('tele-medico-nome').textContent = c.nomeMedico;
        document.getElementById('tele-medico-esp').textContent = c.especialidade;
        document.getElementById('tele-hora').textContent = c.data.toDate().toLocaleString('pt-PT');
    });
}

function getInitials(name) {
    if (!name) return "??";
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// --- NAVEGAÇÃO BÁSICA ---
const loginScreen = document.getElementById('login-screen');
const registerScreen = document.getElementById('register-screen');
const authScreens = [loginScreen, registerScreen];
const appScreens = document.querySelectorAll('.app-screen');

function showAppScreen(screenToShow) {
    if (screenToShow && screenToShow.id === 'telemedicine-screen') document.body.classList.add('overflow-hidden');
    else document.body.classList.remove('overflow-hidden');
    appScreens.forEach(screen => screen.classList.add('hidden'));
    if (screenToShow) screenToShow.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

document.querySelectorAll('[data-target]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        const screen = document.getElementById(targetId);
        if (screen) {
            if (targetId === 'dashboard-screen') resetAppointmentState();
            showAppScreen(screen);
        }
    });
});

// Tabs (Consultas)
const tabUpcoming = document.getElementById('tab-upcoming');
const tabPast = document.getElementById('tab-past');
const upcomingList = document.getElementById('upcoming-list');
const pastList = document.getElementById('past-list');
if (tabUpcoming) {
    tabUpcoming.addEventListener('click', () => {
        tabUpcoming.classList.add('active'); tabPast.classList.remove('active');
        upcomingList.classList.remove('hidden'); pastList.classList.add('hidden');
    });
    tabPast.addEventListener('click', () => {
        tabPast.classList.add('active'); tabUpcoming.classList.remove('active');
        pastList.classList.remove('hidden'); upcomingList.classList.add('hidden');
    });
}

// Telemedicina buttons
const joinBtn = document.getElementById('join-call-btn');
const endBtn = document.getElementById('end-call-btn');
if (joinBtn) joinBtn.addEventListener('click', () => {
    document.getElementById('waiting-room-view').classList.add('hidden');
    document.getElementById('call-view').classList.remove('hidden');
    document.getElementById('call-view').classList.add('flex');
});
if (endBtn) endBtn.addEventListener('click', () => {
    document.getElementById('call-view').classList.add('hidden');
    document.getElementById('call-view').classList.remove('flex');
    document.getElementById('waiting-room-view').classList.remove('hidden');
    showAppScreen(document.getElementById('dashboard-screen'));
});

// Logout
const logoutBtn = document.getElementById('logout-btn-desktop');
if (logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());