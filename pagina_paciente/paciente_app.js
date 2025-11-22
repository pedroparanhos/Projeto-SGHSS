// --- UTILITÁRIO: MODAL PERSONALIZADO ---
function showCustomAlert(title, message, type = 'info') {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-message');
    const iconEl = document.getElementById('modal-icon');
    const iconBg = document.getElementById('modal-icon-bg');
    const btn = document.getElementById('modal-btn');

    if (!modal) { alert(message); return; } 

    titleEl.textContent = title;
    msgEl.textContent = message;

    if (type === 'error') {
        iconBg.className = 'mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 mb-4';
        iconEl.className = 'h-6 w-6 text-red-500';
        btn.className = 'w-full inline-flex justify-center rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors px-4 py-3';
        iconEl.setAttribute('data-lucide', 'alert-circle');
    } else if (type === 'success') {
        iconBg.className = 'mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-500/20 mb-4';
        iconEl.className = 'h-6 w-6 text-green-500';
        btn.className = 'w-full inline-flex justify-center rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors px-4 py-3';
        iconEl.setAttribute('data-lucide', 'check');
    } else {
        iconBg.className = 'mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-ciano-vibrante/20 mb-4';
        iconEl.className = 'h-6 w-6 text-ciano-vibrante';
        btn.className = 'w-full inline-flex justify-center rounded-xl bg-ciano-vibrante text-white hover:bg-azul-suave transition-colors px-4 py-3';
        iconEl.setAttribute('data-lucide', 'info');
    }

    modal.classList.remove('hidden');
    if(typeof lucide !== 'undefined') lucide.createIcons();
    btn.onclick = () => modal.classList.add('hidden');
}

// --- GLOBAIS ---
if (typeof firebase === 'undefined') console.error("Firebase não carregado!");

const authLayout = document.getElementById('auth-layout');
const appLayout = document.getElementById('app-layout');
const appScreens = document.querySelectorAll('.app-screen');
const navLinks = document.querySelectorAll('.nav-link, .sidebar-link');

// ESTADO
let selectedSpecialty = '';
let selectedProfessional = { id: '', name: '' };
let selectedDateObj = null;
let selectedTime = '';
let currentDetailAppointmentId = null;

// --- AUTH GUARD ---
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection("usuarios").doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().tipo === "PACIENTE") {
                showLayout(appLayout);
                inicializarDadosPaciente(user.uid);
                updateNavSelection('dashboard-screen');
                setTimeout(() => { if(typeof lucide !== 'undefined') lucide.createIcons(); }, 100);
            } else {
                auth.signOut();
                showLayout(authLayout);
            }
        });
    } else {
        showLayout(authLayout);
    }
});

function showLayout(layout) {
    if(authLayout) authLayout.classList.add('hidden');
    if(appLayout) appLayout.classList.add('hidden');
    if (layout) layout.classList.remove('hidden');
    if (layout === appLayout) layout.classList.add('flex');
}

// --- NAVEGAÇÃO ---
function showAppScreen(screenToShow) {
    if (!screenToShow) return;
    
    appScreens.forEach(s => s.classList.add('hidden'));
    screenToShow.classList.remove('hidden');
    updateNavSelection(screenToShow.id);
    
    if(screenToShow.id === 'telemedicine-screen') {
        carregarTelemedicina(auth.currentUser.uid);
    }
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function updateNavSelection(targetId) {
    navLinks.forEach(link => {
        link.classList.remove('text-ciano-vibrante', 'active'); 
        link.classList.add('text-texto-secundario'); 
        if(link.classList.contains('sidebar-link')) link.classList.remove('bg-ciano-vibrante/10', 'text-ciano-vibrante', 'font-bold');
    });

    let activeId = targetId;
    if (targetId === 'appointment-details-screen') activeId = 'my-appointments-screen';
    if (['datetime-screen', 'professional-screen', 'specialty-screen', 'confirmation-screen'].includes(targetId)) activeId = 'dashboard-screen';

    const targets = document.querySelectorAll(`[data-target="${activeId}"]`);
    targets.forEach(link => {
        link.classList.remove('text-texto-secundario');
        link.classList.add('text-ciano-vibrante'); 
        if(link.classList.contains('sidebar-link')) link.classList.add('bg-ciano-vibrante/10', 'text-ciano-vibrante', 'font-bold');
    });
}

navLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); showAppScreen(document.getElementById(link.getAttribute('data-target'))); }));

// --- CADASTRO E LOGIN ---
const steps = [document.getElementById('step-1'), document.getElementById('step-2'), document.getElementById('step-3')];
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
let currentStep = 0;

function updateStep() {
    if (!steps[0]) return;
    steps.forEach((step, index) => step.classList.toggle('hidden', index !== currentStep));
    const prog = document.getElementById('progress-indicator');
    if(prog) prog.textContent = `Passo ${currentStep + 1} de 3`;
    
    if(prevBtn) prevBtn.classList.toggle('hidden', currentStep === 0);
    if(nextBtn) nextBtn.textContent = currentStep === 2 ? 'Finalizar' : 'Avançar';
}

if(nextBtn) {
    nextBtn.addEventListener('click', () => {
        const inputs = steps[currentStep].querySelectorAll('input[required]');
        let valid = true;
        inputs.forEach(input => {
            if (!input.value) { valid = false; input.classList.add('border-red-500'); } 
            else { input.classList.remove('border-red-500'); }
        });

        if (!valid) { showCustomAlert("Atenção", "Preencha os campos obrigatórios.", "error"); return; }

        if (currentStep === 2) {
            auth.createUserWithEmailAndPassword(document.getElementById('email').value, document.getElementById('password').value)
                .then((uc) => {
                    return db.collection("usuarios").doc(uc.user.uid).set({
                        nome: document.getElementById('fullName').value,
                        cpf: document.getElementById('cpf').value,
                        tipo: "PACIENTE"
                    });
                })
                .then(() => showCustomAlert("Sucesso", "Conta criada!", "success"))
                .catch(err => showCustomAlert("Erro", err.message, "error"));
        } else {
            currentStep++; updateStep();
        }
    });
}
if(prevBtn) prevBtn.addEventListener('click', () => { if (currentStep > 0) { currentStep--; updateStep(); } });

const goToReg = document.getElementById('go-to-register');
const goToLog = document.getElementById('go-to-login');
if(goToReg) goToReg.onclick = (e) => { e.preventDefault(); document.getElementById('login-screen').classList.add('hidden'); document.getElementById('register-screen').classList.remove('hidden'); };
if(goToLog) goToLog.onclick = (e) => { e.preventDefault(); document.getElementById('register-screen').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); };

const loginForm = document.getElementById('login-form');
if(loginForm) loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    auth.signInWithEmailAndPassword(document.getElementById('login-email').value, document.getElementById('login-password').value).catch(err => showCustomAlert("Erro", err.message, "error"));
});
const logoutBtn = document.getElementById('logout-btn-desktop');
if(logoutBtn) logoutBtn.onclick = () => auth.signOut();


// --- AGENDAMENTO ---
const btnSchedule = document.getElementById('go-to-schedule');
if(btnSchedule) btnSchedule.addEventListener('click', () => {
    showAppScreen(document.getElementById('specialty-screen'));
    carregarEspecialidades();
});

function carregarEspecialidades() {
    const grid = document.getElementById('specialty-grid');
    grid.innerHTML = '<p class="col-span-full text-center">A carregar...</p>';
    db.collection("usuarios").where("tipo", "==", "PROFISSIONAL").get().then(snap => {
        const set = new Set();
        snap.forEach(doc => { if(doc.data().especialidade) set.add(doc.data().especialidade); });
        grid.innerHTML = '';
        if(set.size === 0) grid.innerHTML = '<p class="col-span-full text-center">Sem médicos disponíveis.</p>';
        set.forEach(esp => {
            const btn = document.createElement('button');
            btn.className = "bg-fundo-secundario p-4 rounded-xl flex flex-col items-center hover:bg-campo transition-all";
            btn.innerHTML = `<div class="bg-ciano-vibrante/20 p-3 rounded-full mb-2"><i data-lucide="stethoscope" class="text-ciano-vibrante"></i></div><span class="font-semibold">${esp}</span>`;
            btn.onclick = () => {
                selectedSpecialty = esp;
                const title = document.getElementById('professional-specialty-title');
                if(title) title.textContent = esp;
                showAppScreen(document.getElementById('professional-screen'));
                carregarProfissionais(esp);
            };
            grid.appendChild(btn);
        });
        if(typeof lucide !== 'undefined') lucide.createIcons();
    });
}

function carregarProfissionais(esp) {
    const list = document.getElementById('lista-profissionais');
    list.innerHTML = '<p class="text-center">A procurar...</p>';
    db.collection("usuarios").where("tipo", "==", "PROFISSIONAL").where("especialidade", "==", esp).get().then(snap => {
        list.innerHTML = '';
        snap.forEach(doc => {
            const d = doc.data();
            const btn = document.createElement('button');
            btn.className = "w-full bg-fundo-secundario p-4 rounded-xl flex items-center gap-4 hover:bg-campo text-left";
            btn.innerHTML = `<div class="w-10 h-10 bg-ciano-vibrante/20 rounded-full flex items-center justify-center font-bold text-ciano-vibrante">${d.nome ? d.nome[0] : 'M'}</div><div class="flex-1"><p class="font-bold">${d.nome}</p><p class="text-sm text-texto-secundario">Disponível</p></div><i data-lucide="chevron-right"></i>`;
            btn.onclick = () => {
                selectedProfessional = { id: doc.id, name: d.nome };
                document.getElementById('datetime-professional-name').textContent = d.nome;
                document.getElementById('datetime-professional-specialty').textContent = esp;
                gerarDiasDisponiveis(); 
                showAppScreen(document.getElementById('datetime-screen'));
            };
            list.appendChild(btn);
        });
        if(typeof lucide !== 'undefined') lucide.createIcons();
    });
}

// Calendário Dinâmico
function gerarDiasDisponiveis() {
    const container = document.getElementById('date-selection-container');
    if(!container) return;
    container.innerHTML = '';
    
    let count = 0;
    let dateIter = new Date();
    dateIter.setDate(dateIter.getDate() + 1); 

    while (count < 10) { 
        const day = dateIter.getDay();
        if (day !== 0 && day !== 6) { 
            const btn = document.createElement('button');
            const dateCopy = new Date(dateIter);
            const diaSemana = dateCopy.toLocaleDateString('pt-PT', { weekday: 'short' }).toUpperCase().replace('.', '');
            
            btn.className = "min-w-[70px] p-3 rounded-xl bg-fundo-secundario border-2 border-transparent flex flex-col items-center justify-center cursor-pointer date-option";
            btn.innerHTML = `<span class="text-xs text-texto-secundario">${diaSemana}</span><span class="text-lg font-bold">${dateCopy.getDate()}</span>`;
            
            btn.onclick = () => {
                document.querySelectorAll('.date-option').forEach(b => { b.classList.remove('bg-ciano-vibrante', 'text-white', 'border-ciano-vibrante'); b.classList.add('bg-fundo-secundario'); });
                btn.classList.remove('bg-fundo-secundario'); btn.classList.add('bg-ciano-vibrante', 'text-white', 'border-ciano-vibrante');
                selectedDateObj = dateCopy;
                verificarSelecao();
            };
            container.appendChild(btn);
            count++;
        }
        dateIter.setDate(dateIter.getDate() + 1);
    }
}

document.querySelectorAll('.time-slot').forEach(slot => {
    slot.addEventListener('click', () => {
        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('bg-ciano-vibrante', 'text-white', 'border-ciano-vibrante'));
        slot.classList.add('bg-ciano-vibrante', 'text-white', 'border-ciano-vibrante');
        selectedTime = slot.textContent;
        verificarSelecao();
    });
});

function verificarSelecao() {
    const btn = document.getElementById('go-to-confirmation');
    if (selectedDateObj && selectedTime) btn.classList.remove('hidden'); else btn.classList.add('hidden');
}

const btnGoConf = document.getElementById('go-to-confirmation');
if(btnGoConf) btnGoConf.addEventListener('click', () => {
    document.getElementById('confirm-professional-name').textContent = selectedProfessional.name;
    document.getElementById('confirm-specialty').textContent = selectedSpecialty;
    document.getElementById('confirm-date').textContent = selectedDateObj.toLocaleDateString('pt-PT');
    document.getElementById('confirm-time').textContent = selectedTime;
    showAppScreen(document.getElementById('confirmation-screen'));
});

const btnConfirm = document.getElementById('confirm-appointment-btn');
if(btnConfirm) btnConfirm.addEventListener('click', () => {
    const [h, m] = selectedTime.split(':');
    const finalDate = new Date(selectedDateObj);
    finalDate.setHours(parseInt(h), parseInt(m), 0);

    db.collection("consultas").add({
        pacienteId: auth.currentUser.uid,
        profissionalId: selectedProfessional.id,
        nomeMedico: selectedProfessional.name,
        especialidade: selectedSpecialty,
        data: firebase.firestore.Timestamp.fromDate(finalDate),
        horario: selectedTime,
        status: "Agendada",
        tipo: "Presencial"
    }).then(() => {
        showAppScreen(document.getElementById('success-screen'));
    }).catch(err => showCustomAlert("Erro", err.message, "error"));
});

document.getElementById('back-to-home-btn').addEventListener('click', () => showAppScreen(document.getElementById('dashboard-screen')));


// --- TELEMEDICINA ---
document.getElementById('go-to-telemedicine-dash').addEventListener('click', () => showAppScreen(document.getElementById('telemedicine-screen')));

function carregarTelemedicina(uid) {
    const boxInfo = document.getElementById('tele-info-box');
    const boxSem = document.getElementById('tele-sem-consulta');
    const btnJoin = document.getElementById('join-call-btn');

    boxInfo.classList.add('hidden');
    boxSem.classList.remove('hidden');
    btnJoin.classList.add('hidden');

    const now = new Date();
    db.collection("consultas")
        .where("pacienteId", "==", uid)
        .where("status", "==", "Agendada")
        .get()
        .then(snap => {
            const consultas = [];
            snap.forEach(doc => consultas.push(doc.data()));
            
            const futuras = consultas
                .map(c => ({...c, dataObj: c.data.toDate()}))
                .filter(c => c.tipo === 'Telemedicina' && c.dataObj >= new Date(now.getTime() - 2*60*60*1000))
                .sort((a,b) => a.dataObj - b.dataObj);

            if(futuras.length > 0) {
                const c = futuras[0];
                boxInfo.classList.remove('hidden');
                boxSem.classList.add('hidden');
                btnJoin.classList.remove('hidden');
                document.getElementById('tele-medico-nome').textContent = c.nomeMedico;
                document.getElementById('tele-hora').textContent = c.dataObj.toLocaleDateString() + ' às ' + (c.horario || '---');
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

// --- DASHBOARD & LISTAS ---
function inicializarDadosPaciente(uid) {
    // Nome do Usuário (Tempo Real)
    db.collection("usuarios").doc(uid).onSnapshot(doc => {
        if(doc.exists) {
            const nome = doc.data().nome.split(' ')[0];
            document.getElementById('dashboard-nome-paciente').textContent = nome;
            document.getElementById('sidebar-avatar-name').textContent = nome;
            const url = `https://placehold.co/40x40/06B6D4/FFFFFF?text=${nome[0]}`;
            document.getElementById('sidebar-avatar-img').src = url;
            document.getElementById('mobile-avatar-img').src = url;
        } else {
            document.getElementById('dashboard-nome-paciente').textContent = "Paciente";
        }
    });

    // Dashboard
    db.collection("consultas").where("pacienteId", "==", uid).where("status", "==", "Agendada").onSnapshot(snap => {
        const consultas = [];
        snap.forEach(doc => consultas.push({ id: doc.id, ...doc.data(), dataObj: doc.data().data.toDate() }));
        
        const futuras = consultas.filter(c => c.dataObj >= new Date()).sort((a,b) => a.dataObj - b.dataObj);

        if(futuras.length > 0) {
            const c = futuras[0];
            document.getElementById('sem-consulta-msg').classList.add('hidden');
            document.getElementById('detalhes-consulta').classList.remove('hidden');
            document.getElementById('proxima-consulta-medico').textContent = c.nomeMedico;
            document.getElementById('proxima-consulta-especialidade').textContent = c.especialidade;
            document.getElementById('proxima-consulta-data').textContent = c.dataObj.toLocaleDateString();
            document.getElementById('proxima-consulta-hora').textContent = c.horario || '--:--';
            document.getElementById('proxima-consulta-avatar').textContent = c.nomeMedico ? c.nomeMedico[0] : 'D';
            
            document.getElementById('detalhes-consulta').onclick = () => mostrarDetalhesConsulta(c.id, {data: {toDate: ()=>c.dataObj}, ...c});
        } else {
            document.getElementById('sem-consulta-msg').classList.remove('hidden');
            document.getElementById('detalhes-consulta').classList.add('hidden');
        }
    });
    
    // Carregar Listas
    db.collection("consultas").where("pacienteId", "==", uid).onSnapshot(snap => {
        const listUp = document.getElementById('lista-consultas-proximas');
        const listPast = document.getElementById('lista-consultas-passadas');
        listUp.innerHTML = ''; listPast.innerHTML = '';
        const now = new Date();

        snap.forEach(doc => {
            const c = doc.data();
            const d = c.data.toDate();
            const isFuture = d >= now && c.status !== 'Cancelada';
            
            const html = `
            <div class="bg-fundo-secundario p-4 rounded-xl shadow flex gap-4 items-start cursor-pointer hover:bg-campo transition-colors" onclick="mostrarDetalhesConsulta('${doc.id}', {status: '${c.status}', nomeMedico: '${c.nomeMedico}', especialidade: '${c.especialidade}', data: {toDate: () => new Date('${d}')}, horario: '${c.horario}'})">
                <div class="w-12 h-12 bg-ciano-vibrante/20 rounded-full flex items-center justify-center text-ciano-vibrante font-bold text-lg">${c.nomeMedico ? c.nomeMedico[0] : 'M'}</div>
                <div>
                    <p class="font-bold text-texto-principal">${c.nomeMedico}</p>
                    <p class="text-sm text-ciano-vibrante">${c.especialidade} ${c.tipo === 'Telemedicina' ? '(Vídeo)' : ''}</p>
                    <p class="text-xs text-texto-secundario mt-1">${d.toLocaleDateString()} às ${c.horario || '--:--'}</p>
                </div>
            </div>`;
            
            if(isFuture) listUp.innerHTML += html; else listPast.innerHTML += html;
        });
    });
}

// Detalhes
window.mostrarDetalhesConsulta = function(docId, data) {
    currentDetailAppointmentId = docId;
    const d = data.data.toDate();
    document.getElementById('detail-status').textContent = data.status;
    document.getElementById('detail-medico').textContent = data.nomeMedico;
    document.getElementById('detail-especialidade').textContent = data.especialidade;
    document.getElementById('detail-data').textContent = d.toLocaleDateString('pt-PT');
    document.getElementById('detail-hora').textContent = data.horario || '--:--';
    
    const actions = document.getElementById('detail-actions');
    if(data.status === 'Cancelada' || data.status === 'Concluída') actions.classList.add('hidden'); else actions.classList.remove('hidden');
    
    showAppScreen(document.getElementById('appointment-details-screen'));
};

document.getElementById('btn-cancelar-consulta').onclick = () => {
    if(confirm("Cancelar consulta?")) {
        db.collection("consultas").doc(currentDetailAppointmentId).update({ status: "Cancelada" })
        .then(() => { showCustomAlert("Sucesso", "Consulta cancelada.", "success"); showAppScreen(document.getElementById('my-appointments-screen')); });
    }
};

// Abas
const tUp = document.getElementById('tab-upcoming');
const tPa = document.getElementById('tab-past');
const lUp = document.getElementById('lista-consultas-proximas');
const lPa = document.getElementById('lista-consultas-passadas');

tUp.onclick = () => {
    tUp.className = "flex-1 py-3 text-sm font-medium border-b-2 border-ciano-vibrante text-ciano-vibrante transition-colors";
    tPa.className = "flex-1 py-3 text-sm font-medium border-b-2 border-transparent text-texto-secundario hover:text-texto-principal transition-colors";
    lUp.classList.remove('hidden'); lPa.classList.add('hidden');
};
tPa.onclick = () => {
    tPa.className = "flex-1 py-3 text-sm font-medium border-b-2 border-ciano-vibrante text-ciano-vibrante transition-colors";
    tUp.className = "flex-1 py-3 text-sm font-medium border-b-2 border-transparent text-texto-secundario hover:text-texto-principal transition-colors";
    lPa.classList.remove('hidden'); lUp.classList.add('hidden');
};