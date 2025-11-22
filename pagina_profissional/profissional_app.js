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
                // Pequeno delay para garantir que o DOM está pronto para a seleção inicial
                setTimeout(() => updateNavSelection('dashboard-screen'), 50);
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

// --- NAVEGAÇÃO (CORRIGIDA - PONTO 2) ---
function showAppScreen(screen) {
    // 1. Esconde todas as telas
    document.querySelectorAll('.app-screen').forEach(s => s.classList.add('hidden'));
    
    // 2. Mostra a tela desejada
    screen.classList.remove('hidden');
    
    // 3. Atualiza o menu
    updateNavSelection(screen.id);
    
    // 4. Ícones
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function updateNavSelection(targetId) {
    // A. LIMPEZA TOTAL (CSS + Tailwind)
    const allLinks = document.querySelectorAll('.sidebar-link, .nav-link');
    allLinks.forEach(link => {
        // Remove a classe 'active' do CSS (que causa o fundo azul fixo)
        link.classList.remove('active'); 
        
        // Remove classes Tailwind de estado ativo
        link.classList.remove('bg-ciano-vibrante/10', 'text-ciano-vibrante');
        
        // Reseta estilo Mobile
        if(link.classList.contains('nav-link')) {
             link.classList.remove('text-ciano-vibrante');
             link.classList.add('text-texto-secundario');
        }
    });

    // B. MAPEAMENTO (Sub-telas mantêm o menu pai ativo)
    let menuId = targetId;
    if (targetId === 'detalhes-paciente-screen') menuId = 'pacientes-screen';
    if (targetId === 'atendimento-screen') menuId = 'dashboard-screen';

    // C. ATIVAÇÃO DO ALVO
    const activeLinks = document.querySelectorAll(`[data-target="${menuId}"]`);
    activeLinks.forEach(link => {
        // Adiciona a classe 'active' para consistência com o CSS
        link.classList.add('active');

        if (link.classList.contains('sidebar-link')) {
            // Desktop (Tailwind extra)
            link.classList.add('bg-ciano-vibrante/10', 'text-ciano-vibrante');
        } else {
            // Mobile
            link.classList.remove('text-texto-secundario');
            link.classList.add('text-ciano-vibrante');
        }
    });
}

// Adiciona Click Listeners uma única vez
document.querySelectorAll('.sidebar-link, .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        const screen = document.getElementById(targetId);
        if(screen) showAppScreen(screen);
    });
});

// --- LÓGICA PRINCIPAL ---
function inicializarMedico(uid) {
    // 1. Perfil
    db.collection("usuarios").doc(uid).get().then(doc => {
        if(doc.exists) {
            const nome = doc.data().nome;
            document.getElementById('dash-nome').textContent = nome.split(' ')[0];
            document.getElementById('sidebar-nome').textContent = nome;
            document.getElementById('sidebar-avatar').textContent = nome[0];
        }
    });

    // 2. Consultas em Tempo Real
    db.collection("consultas")
        .where("profissionalId", "==", uid)
        .where("status", "==", "Agendada")
        .onSnapshot(snap => {
            const todasConsultasFuturas = [];
            const pacientesUnicos = new Set();
            
            snap.forEach(doc => {
                const data = doc.data();
                const dataDate = data.data.toDate();
                
                // Filtra passado (mantém hoje e futuro)
                if (dataDate >= new Date(new Date().setHours(0,0,0,0))) {
                    todasConsultasFuturas.push({ id: doc.id, ...data, dataDate });
                    pacientesUnicos.add(data.pacienteId);
                }
            });

            // Ordena por data
            todasConsultasFuturas.sort((a, b) => a.dataDate - b.dataDate);

            // Atualiza Contadores
            document.getElementById('metric-consultas-marcadas').textContent = todasConsultasFuturas.length;
            document.getElementById('metric-pacientes').textContent = pacientesUnicos.size;

            // Atualiza Cards
            atualizarCardProximo(todasConsultasFuturas.length > 0 ? todasConsultasFuturas[0] : null);
            renderizarAgenda(todasConsultasFuturas);
            carregarListaPacientes(Array.from(pacientesUnicos));
        });
}

// --- FUNÇÃO PARA BUSCAR NOME DO PACIENTE ---
async function getNomePaciente(pacienteId) {
    try {
        const doc = await db.collection("usuarios").doc(pacienteId).get();
        if (doc.exists) {
            return doc.data().nome;
        }
        return "Paciente Desconhecido";
    } catch (e) {
        console.error("Erro ao buscar nome", e);
        return "Erro ao carregar";
    }
}

async function atualizarCardProximo(consulta) {
    const card = document.getElementById('proximo-atendimento-card');
    
    if (!consulta) {
        card.innerHTML = '<p class="text-center text-texto-secundario">Nenhuma consulta pendente.</p>';
        return;
    }

    const nomePaciente = await getNomePaciente(consulta.pacienteId);
    const dataFormatada = consulta.dataDate.toLocaleDateString();
    // Garante que temos um horário, usando a data se o campo 'horario' faltar
    const horaFormatada = consulta.horario || consulta.dataDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    card.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 w-full">
            <div class="flex items-center gap-4 w-full md:w-auto">
                <div class="w-14 h-14 bg-ciano-vibrante/20 rounded-full flex items-center justify-center font-bold text-ciano-vibrante text-2xl">
                    ${nomePaciente[0]}
                </div>
                <div>
                    <p class="text-texto-secundario text-xs uppercase font-bold tracking-wider mb-1">Próximo Paciente</p>
                    <p class="font-bold text-xl text-texto-principal mb-1">${nomePaciente}</p>
                    <div class="flex items-center gap-3 text-sm text-ciano-vibrante bg-ciano-vibrante/10 px-3 py-1 rounded-full w-fit">
                         <i data-lucide="calendar" class="w-4 h-4"></i> ${dataFormatada}
                         <i data-lucide="clock" class="w-4 h-4 ml-2"></i> ${horaFormatada}
                    </div>
                </div>
            </div>
            <button onclick="iniciarAtendimento('${consulta.id}', '${consulta.pacienteId}', '${nomePaciente}')" class="w-full md:w-auto bg-ciano-vibrante px-8 py-3 rounded-xl font-bold text-white hover:bg-azul-suave transition-all shadow-lg shadow-ciano-vibrante/20">
                Iniciar Atendimento
            </button>
        </div>
    `;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// --- RENDERIZAR AGENDA (CORRIGIDA - PONTO 1) ---
async function renderizarAgenda(consultas) {
    const lista = document.getElementById('lista-agenda-hoje');
    lista.innerHTML = ''; 
    
    if (consultas.length === 0) {
        lista.innerHTML = '<p class="text-center text-texto-secundario py-6 bg-campo/20 rounded-lg">Agenda livre.</p>';
        return;
    }

    for (const c of consultas) {
        const dataF = c.dataDate.toLocaleDateString();
        // Correção Ponto 1: Garante que o horário aparece
        const horaF = c.horario || c.dataDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const div = document.createElement('div');
        const nomeId = `nome-paciente-${c.id}`;
        
        div.className = "flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-fundo-secundario rounded-xl border border-gray-700 hover:border-ciano-vibrante transition-colors gap-4";
        div.innerHTML = `
            <div class="flex items-center gap-4 w-full sm:w-auto">
                <div class="bg-campo p-3 rounded-lg text-texto-principal font-bold text-center min-w-[80px] flex flex-col justify-center">
                    <span class="text-lg">${horaF}</span>
                    <span class="text-[10px] font-normal text-texto-secundario">${dataF}</span>
                </div>
                <div>
                    <p class="font-bold text-texto-principal text-lg" id="${nomeId}">Carregando...</p>
                    <p class="text-xs text-texto-secundario mt-1 flex items-center gap-1"><i data-lucide="tag" class="w-3 h-3"></i> ${c.especialidade}</p>
                </div>
            </div>
            <button id="btn-prontuario-${c.id}" class="w-full sm:w-auto text-ciano-vibrante hover:text-white hover:bg-ciano-vibrante font-medium text-sm border border-ciano-vibrante px-4 py-2 rounded-lg transition-all">
                Prontuário
            </button>
        `;
        lista.appendChild(div);

        getNomePaciente(c.pacienteId).then(nome => {
            const elNome = document.getElementById(nomeId);
            if(elNome) elNome.textContent = nome;
            
            const btn = document.getElementById(`btn-prontuario-${c.id}`);
            if(btn) {
                btn.onclick = () => iniciarAtendimento(c.id, c.pacienteId, nome);
            }
        });
    }
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function carregarListaPacientes(idsPacientes) {
    const grid = document.getElementById('lista-pacientes');
    
    if(!idsPacientes || idsPacientes.length === 0) {
        grid.innerHTML = '<p class="text-center text-texto-secundario col-span-full">Nenhum paciente com consulta agendada.</p>';
        return;
    }

    grid.innerHTML = ''; 
    
    const batchIds = idsPacientes.slice(0, 10);
    db.collection("usuarios").where(firebase.firestore.FieldPath.documentId(), 'in', batchIds).get().then(snap => {
        snap.forEach(doc => {
            const p = doc.data();
            const card = document.createElement('div');
            card.className = "bg-fundo-secundario p-4 rounded-xl flex items-center gap-4 border border-gray-700 hover:border-ciano-vibrante transition-colors cursor-pointer group";
            
            card.onclick = () => abrirDetalhesPaciente(doc.id, p);

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
        if(typeof lucide !== 'undefined') lucide.createIcons();
    });
}

// --- DETALHES DO PACIENTE ---
function abrirDetalhesPaciente(id, dados) {
    document.getElementById('perfil-nome').textContent = dados.nome;
    document.getElementById('perfil-email').textContent = dados.email;
    document.getElementById('perfil-cpf').textContent = dados.cpf || 'Não informado';
    document.getElementById('perfil-nasc').textContent = dados.dataNascimento || '---';
    document.getElementById('perfil-tel').textContent = dados.telefone || '---';
    document.getElementById('perfil-avatar').textContent = dados.nome[0];

    const listaHist = document.getElementById('perfil-historico-lista');
    listaHist.innerHTML = '<p class="text-center text-texto-secundario">A carregar...</p>';

    db.collection("consultas")
        .where("pacienteId", "==", id)
        .where("status", "==", "Concluída")
        .orderBy("data", "desc")
        .limit(5)
        .get()
        .then(snap => {
            listaHist.innerHTML = '';
            if (snap.empty) {
                listaHist.innerHTML = '<p class="text-center text-texto-secundario">Sem histórico.</p>';
                return;
            }
            snap.forEach(doc => {
                const d = doc.data();
                const data = d.data.toDate().toLocaleDateString();
                listaHist.innerHTML += `
                    <div class="bg-campo p-3 rounded-lg border-l-4 border-green-500">
                        <div class="flex justify-between">
                            <span class="font-bold text-white">${data}</span>
                            <span class="text-xs text-green-400">Concluída</span>
                        </div>
                        <p class="text-sm text-texto-secundario mt-1 truncate">${d.notas_medicas || 'Sem notas'}</p>
                    </div>
                `;
            });
        });

    showAppScreen(document.getElementById('detalhes-paciente-screen'));
}

// --- PRONTUÁRIO / ATENDIMENTO ---
window.iniciarAtendimento = function(consultaId, pacienteId, nomePaciente) {
    currentConsultaId = consultaId;
    currentPacienteId = pacienteId;
    
    document.getElementById('notas-medicas').value = '';
    document.getElementById('prescricao-input').value = '';
    document.getElementById('exame-input').value = '';
    document.getElementById('prontuario-nome').textContent = nomePaciente;

    const histDiv = document.getElementById('historico-clinico');
    histDiv.innerHTML = '<p class="text-center py-4">Buscando histórico...</p>';
    
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
                histDiv.innerHTML += `
                    <div class="bg-campo p-4 rounded-lg border-l-4 border-purple-500 mb-3">
                        <div class="flex justify-between items-center mb-2">
                            <p class="font-bold text-xs text-texto-secundario uppercase tracking-wider">${d.data.toDate().toLocaleDateString()}</p>
                        </div>
                        <p class="text-sm text-texto-principal leading-relaxed">${d.notas_medicas || 'Sem anotações.'}</p>
                    </div>
                `;
            });
        });

    showAppScreen(document.getElementById('atendimento-screen'));
};

document.getElementById('btn-finalizar-consulta').addEventListener('click', () => {
    if (!currentConsultaId) return;
    
    const notas = document.getElementById('notas-medicas').value;
    const remedio = document.getElementById('prescricao-input').value;
    const exame = document.getElementById('exame-input').value;
    const btn = document.getElementById('btn-finalizar-consulta');

    if (!notas) { alert("Adicione uma evolução clínica."); return; }

    btn.disabled = true;
    btn.textContent = "Salvando...";

    const batch = db.batch();
    const consultaRef = db.collection("consultas").doc(currentConsultaId);
    batch.update(consultaRef, { status: "Concluída", notas_medicas: notas });

    if (remedio) {
        batch.set(db.collection("receitas").doc(), {
            pacienteId: currentPacienteId, medicamento: remedio, medico: document.getElementById('sidebar-nome').textContent, data: new Date().toLocaleDateString()
        });
    }
    if (exame) {
        batch.set(db.collection("exames").doc(), {
            pacienteId: currentPacienteId, tipo: exame, data: new Date().toLocaleDateString(), status: "Solicitado"
        });
    }

    batch.commit().then(() => {
        alert("Finalizado com sucesso!");
        btn.disabled = false;
        btn.textContent = "Finalizar Atendimento";
        showAppScreen(document.getElementById('dashboard-screen'));
    }).catch(err => {
        alert("Erro: " + err.message);
        btn.disabled = false;
    });
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    auth.signInWithEmailAndPassword(document.getElementById('login-email').value, document.getElementById('login-password').value)
        .catch(err => alert("Erro: " + err.message));
});

document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());