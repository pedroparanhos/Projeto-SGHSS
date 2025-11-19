// --- VERIFICAÇÃO ---
if (typeof firebase === 'undefined') console.error("Firebase erro!");

// --- GLOBAIS ---
const authLayout = document.getElementById('auth-layout');
const appLayout = document.getElementById('app-layout');
const loginForm = document.getElementById('login-form-profissional');
let currentConsultaId = null;
let currentPacienteId = null;

// AUTH GUARD
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection("usuarios").doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().tipo === "PROFISSIONAL") {
                showLayout(appLayout);
                inicializarMedico(user.uid);
                updateNavSelection('dashboard-screen');
            } else {
                auth.signOut();
                showLayout(authLayout);
                alert("Acesso restrito a médicos.");
            }
        });
    } else {
        showLayout(authLayout);
    }
});

function showLayout(layout) {
    authLayout.classList.add('hidden');
    appLayout.classList.add('hidden');
    if(layout) layout.classList.remove('hidden');
    if(layout === appLayout) layout.classList.add('flex');
}

// --- NAVEGAÇÃO ---
function showAppScreen(screen) {
    document.querySelectorAll('.app-screen').forEach(s => s.classList.add('hidden'));
    screen.classList.remove('hidden');
    updateNavSelection(screen.id);
    lucide.createIcons();
}

function updateNavSelection(targetId) {
    // Remove active classes
    document.querySelectorAll('.sidebar-link, .nav-link').forEach(link => {
        // Desktop
        link.classList.remove('bg-ciano-vibrante/10', 'text-ciano-vibrante');
        // Mobile
        if(link.classList.contains('nav-link')) {
             link.classList.remove('text-ciano-vibrante');
             link.classList.add('text-texto-secundario');
        }
    });

    // Add active class
    const links = document.querySelectorAll(`[data-target="${targetId}"]`);
    links.forEach(link => {
        if(link.classList.contains('sidebar-link')) {
            link.classList.add('bg-ciano-vibrante/10', 'text-ciano-vibrante');
        } else {
            link.classList.remove('text-texto-secundario');
            link.classList.add('text-ciano-vibrante');
        }
    });
}

document.querySelectorAll('.sidebar-link, .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        showAppScreen(document.getElementById(link.getAttribute('data-target')));
    });
});

// --- LÓGICA PRINCIPAL ---
function inicializarMedico(uid) {
    // 1. Perfil
    db.collection("usuarios").doc(uid).get().then(doc => {
        const nome = doc.data().nome;
        document.getElementById('dash-nome').textContent = nome.split(' ')[0];
        document.getElementById('sidebar-nome').textContent = nome;
        document.getElementById('sidebar-avatar').textContent = nome[0];
    });

    // 2. Monitorização em Tempo Real (Consultas)
    // Apanha TODAS as consultas agendadas (hoje ou futuro) para métricas
    const now = new Date();
    
    db.collection("consultas")
        .where("profissionalId", "==", uid)
        .where("status", "==", "Agendada")
        .orderBy("data", "asc")
        .onSnapshot(snap => {
            let totalMarcadas = 0;
            const pacientesUnicos = new Set();
            let proximaConsulta = null;
            const agendaHoje = [];

            snap.forEach(doc => {
                const data = doc.data();
                const dataDate = data.data.toDate();
                
                // Filtra apenas datas futuras ou hoje (ignora passadas não concluídas por segurança)
                if (dataDate >= new Date(new Date().setHours(0,0,0,0))) {
                    totalMarcadas++;
                    pacientesUnicos.add(data.pacienteId);
                    
                    // A primeira que encontrar (já que está ordenado ASC) é a próxima
                    if (!proximaConsulta && dataDate >= now) {
                        proximaConsulta = { id: doc.id, ...data, dataDate };
                    }

                    // Se for hoje, adiciona à lista da agenda
                    if (dataDate.toDateString() === now.toDateString()) {
                        agendaHoje.push({ id: doc.id, ...data, dataDate });
                    }
                }
            });

            // Atualiza UI
            document.getElementById('metric-consultas-marcadas').textContent = totalMarcadas;
            document.getElementById('metric-pacientes').textContent = pacientesUnicos.size;
            
            atualizarCardProximo(proximaConsulta);
            renderizarAgenda(agendaHoje);
        });

    // 3. Carregar Pacientes (Para a aba Pacientes)
    carregarListaPacientes();
}

function atualizarCardProximo(consulta) {
    const card = document.getElementById('proximo-atendimento-card');
    
    if (!consulta) {
        card.innerHTML = '<p class="text-center text-texto-secundario">Nenhuma consulta pendente.</p>';
        return;
    }

    const dataFormatada = consulta.dataDate.toLocaleDateString();
    const horaFormatada = consulta.horario || consulta.dataDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    card.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            <div class="flex items-center gap-4 w-full md:w-auto">
                <div class="w-14 h-14 bg-ciano-vibrante/20 rounded-full flex items-center justify-center font-bold text-ciano-vibrante text-2xl">
                    ${consulta.nomeMedico ? 'P' : 'P'} 
                </div>
                <div>
                    <p class="text-texto-secundario text-xs uppercase font-bold tracking-wider mb-1">Próximo Paciente</p>
                    <p class="font-bold text-xl text-texto-principal mb-1">Paciente (ID ...${consulta.pacienteId.slice(-4)})</p>
                    <div class="flex items-center gap-3 text-sm text-ciano-vibrante bg-ciano-vibrante/10 px-3 py-1 rounded-full w-fit">
                         <i data-lucide="calendar" class="w-4 h-4"></i> ${dataFormatada}
                         <i data-lucide="clock" class="w-4 h-4 ml-2"></i> ${horaFormatada}
                    </div>
                </div>
            </div>
            <button onclick="iniciarAtendimento('${consulta.id}', '${consulta.pacienteId}', 'Paciente ...${consulta.pacienteId.slice(-4)}')" class="w-full md:w-auto bg-ciano-vibrante px-8 py-3 rounded-xl font-bold text-white hover:bg-azul-suave transition-all shadow-lg shadow-ciano-vibrante/20">
                Iniciar Atendimento
            </button>
        </div>
    `;
    lucide.createIcons();
}

function renderizarAgenda(consultas) {
    const lista = document.getElementById('lista-agenda-hoje');
    lista.innerHTML = '';
    if (consultas.length === 0) {
        lista.innerHTML = '<p class="text-center text-texto-secundario py-6 bg-campo/20 rounded-lg">Agenda livre hoje.</p>';
        return;
    }

    consultas.forEach(c => {
        const div = document.createElement('div');
        div.className = "flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-fundo-secundario rounded-xl border border-gray-700 hover:border-ciano-vibrante transition-colors gap-4";
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="bg-campo p-3 rounded-lg text-texto-principal font-bold text-center min-w-[70px]">
                    ${c.horario || '00:00'}
                </div>
                <div>
                    <p class="font-bold text-texto-principal">Paciente ID: ...${c.pacienteId.slice(-5)}</p>
                    <p class="text-xs text-texto-secundario mt-1 flex items-center gap-1"><i data-lucide="tag" class="w-3 h-3"></i> ${c.especialidade}</p>
                </div>
            </div>
            <button onclick="iniciarAtendimento('${c.id}', '${c.pacienteId}', 'Paciente ...${c.pacienteId.slice(-5)}')" class="w-full sm:w-auto text-ciano-vibrante hover:text-white hover:bg-ciano-vibrante font-medium text-sm border border-ciano-vibrante px-4 py-2 rounded-lg transition-all">
                Prontuário
            </button>
        `;
        lista.appendChild(div);
    });
    lucide.createIcons();
}

// --- PRONTUÁRIO / ATENDIMENTO ---
window.iniciarAtendimento = function(consultaId, pacienteId, nomePaciente) {
    currentConsultaId = consultaId;
    currentPacienteId = pacienteId;
    
    document.getElementById('notas-medicas').value = '';
    document.getElementById('prescricao-input').value = '';
    document.getElementById('exame-input').value = '';
    document.getElementById('prontuario-nome').textContent = nomePaciente || "Paciente";

    const histDiv = document.getElementById('historico-clinico');
    histDiv.innerHTML = '<p class="text-center py-4"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2"></i> Buscando histórico...</p>';
    lucide.createIcons();
    
    db.collection("consultas")
        .where("pacienteId", "==", pacienteId)
        .where("status", "==", "Concluída")
        .orderBy("data", "desc")
        .limit(5)
        .get()
        .then(snap => {
            histDiv.innerHTML = '';
            if (snap.empty) {
                histDiv.innerHTML = '<div class="text-center p-4 bg-campo/20 rounded-lg text-texto-secundario">Nenhum histórico anterior.</div>';
                return;
            }
            
            snap.forEach(doc => {
                const d = doc.data();
                const dataFormatada = d.data.toDate().toLocaleDateString();
                histDiv.innerHTML += `
                    <div class="bg-campo p-4 rounded-lg border-l-4 border-purple-500 mb-3">
                        <div class="flex justify-between items-center mb-2">
                            <p class="font-bold text-xs text-texto-secundario uppercase tracking-wider">${dataFormatada}</p>
                            <span class="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Concluída</span>
                        </div>
                        <p class="text-sm text-texto-principal leading-relaxed">${d.notas_medicas || 'Sem anotações.'}</p>
                    </div>
                `;
            });
        });

    showAppScreen(document.getElementById('atendimento-screen'));
};

// Finalizar Consulta
document.getElementById('btn-finalizar-consulta').addEventListener('click', () => {
    if (!currentConsultaId) return;
    
    const notas = document.getElementById('notas-medicas').value;
    const remedio = document.getElementById('prescricao-input').value;
    const exame = document.getElementById('exame-input').value;
    const btn = document.getElementById('btn-finalizar-consulta');

    if (!notas) { alert("Por favor, adicione uma evolução clínica."); return; }

    btn.disabled = true;
    btn.textContent = "Salvando...";

    const batch = db.batch();

    // 1. Atualiza consulta
    const consultaRef = db.collection("consultas").doc(currentConsultaId);
    batch.update(consultaRef, { status: "Concluída", notas_medicas: notas });

    // 2. Cria receita
    if (remedio) {
        const receitaRef = db.collection("receitas").doc();
        batch.set(receitaRef, {
            pacienteId: currentPacienteId,
            medicamento: remedio,
            medico: document.getElementById('sidebar-nome').textContent,
            data: new Date().toLocaleDateString()
        });
    }

    // 3. Cria exame
    if (exame) {
        const exameRef = db.collection("exames").doc();
        batch.set(exameRef, {
            pacienteId: currentPacienteId,
            tipo: exame,
            data: new Date().toLocaleDateString(),
            status: "Solicitado"
        });
    }

    batch.commit().then(() => {
        alert("Atendimento finalizado com sucesso!");
        btn.disabled = false;
        btn.textContent = "Finalizar Atendimento e Salvar";
        showAppScreen(document.getElementById('dashboard-screen'));
    }).catch(err => {
        alert("Erro ao salvar: " + err.message);
        btn.disabled = false;
    });
});

// --- LISTA DE PACIENTES ---
function carregarListaPacientes() {
    db.collection("usuarios").where("tipo", "==", "PACIENTE").limit(20).get().then(snap => {
        const grid = document.getElementById('lista-pacientes');
        grid.innerHTML = '';
        snap.forEach(doc => {
            const p = doc.data();
            const card = document.createElement('div');
            card.className = "bg-fundo-secundario p-4 rounded-xl flex items-center gap-4 border border-gray-700 hover:border-ciano-vibrante transition-colors cursor-pointer group";
            card.innerHTML = `
                <div class="w-12 h-12 bg-gradient-to-br from-ciano-vibrante to-blue-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform">
                    ${p.nome ? p.nome[0] : 'P'}
                </div>
                <div class="flex-1 overflow-hidden">
                    <p class="font-bold text-texto-principal truncate">${p.nome}</p>
                    <p class="text-xs text-texto-secundario truncate flex items-center gap-1"><i data-lucide="mail" class="w-3 h-3"></i> ${p.email}</p>
                </div>
            `;
            grid.appendChild(card);
        });
        lucide.createIcons();
    });
}

// Busca de Pacientes (Filtro local simples)
document.getElementById('paciente-search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('#lista-pacientes > div');
    cards.forEach(card => {
        const name = card.querySelector('p').textContent.toLowerCase();
        card.style.display = name.includes(term) ? 'flex' : 'none';
    });
});

// Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    auth.signInWithEmailAndPassword(email, pass).catch(err => alert("Erro: " + err.message));
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());