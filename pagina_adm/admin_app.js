// (PASSO 12 - FASE 3) Auth Guard
auth.onAuthStateChanged((user) => {
    if (user) {
        // O utilizador está logado.
        db.collection("usuarios").doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().tipo === "ADMIN") {
                showLayout(appLayout);
                showAppScreen(dashboardScreen); // Mostra o dashboard por padrão
                iniciarListenerMapaDeLeitos(); // Inicia o listener do mapa
            } else {
                // Logado, mas não é admin. Expulsar.
                console.warn("Tentativa de acesso não autorizada (não-admin)");
                auth.signOut();
            }
        });

    } else {
        // O utilizador não está logado.
        showLayout(authLayout); 
        showAppScreen(null); 
    }
});


// --- REFERÊNCIAS AOS LAYOUTS E ECRÃS ---
const authLayout = document.getElementById('auth-layout');
const appLayout = document.getElementById('app-layout');
const loginForm = document.getElementById('login-form-admin');
const logoutBtn = document.getElementById('logout-btn-desktop');

// Ecrãs
const dashboardScreen = document.getElementById('admin-dashboard-screen');
const gestaoHubScreen = document.getElementById('admin-gestao-hub-screen');
const managementScreen = document.getElementById('admin-management-screen');
const fluxosScreen = document.getElementById('admin-fluxos-screen');
const relatoriosScreen = document.getElementById('admin-relatorios-screen');
const appScreens = [dashboardScreen, gestaoHubScreen, managementScreen, fluxosScreen, relatoriosScreen];

// Navegação
const sidebarLinks = document.querySelectorAll('aside .sidebar-link');
const quickAccessBtns = document.querySelectorAll('.btn-go-to-management');
const gestaoHubBtns = document.querySelectorAll('#admin-gestao-hub-screen .btn-go-to-screen');

// --- FUNÇÕES DE NAVEGAÇÃO ---

function showLayout(layoutToShow) {
    if (authLayout) { authLayout.classList.add('hidden'); authLayout.classList.remove('flex'); }
    if (appLayout) { appLayout.classList.add('hidden'); appLayout.classList.remove('flex'); }
    
    if(layoutToShow) {
        layoutToShow.classList.remove('hidden');
        if (layoutToShow === authLayout) { layoutToShow.classList.add('flex'); } 
        else if (layoutToShow === appLayout) { layoutToShow.classList.add('flex'); }
    }
}

function showAppScreen(screenToShow) {
    appScreens.forEach(screen => { if(screen) screen.classList.add('hidden'); });
    if(screenToShow) screenToShow.classList.remove('hidden');

    sidebarLinks.forEach(link => {
        const target = link.getAttribute('data-target');
        const isManagementScreen = (screenToShow && (
            screenToShow.id === 'admin-gestao-hub-screen' ||
            screenToShow.id === 'admin-management-screen' || 
            screenToShow.id === 'admin-fluxos-screen' || 
            screenToShow.id === 'admin-relatorios-screen'
        ));
        
        if (target === 'admin-gestao-hub-screen') {
            link.classList.toggle('active', isManagementScreen);
        } else {
            link.classList.toggle('active', target === (screenToShow ? screenToShow.id : ''));
        }
    });
    
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

// --- LÓGICA DAS ABAS (TELA 16.1 - CADASTROS) ---
const subTabNavCadastros = document.getElementById('sub-tabs-nav-cadastros');
if (subTabNavCadastros) {
    subTabNavCadastros.addEventListener('click', (e) => {
        const target = e.target.closest('.subtab-btn');
        if (target) {
            const targetSubTab = target.getAttribute('data-subtab');
            
            const subTabButtons = subTabNavCadastros.querySelectorAll('.subtab-btn');
            const subTabContents = document.querySelectorAll('#admin-management-screen .subtab-content-cadastros');

            subTabButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-subtab') === targetSubTab));
            subTabContents.forEach(c => c.classList.toggle('hidden', c.id !== `subtab-${targetSubTab}`));
            
            if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        }
    });
}

// --- LÓGICA DAS ABAS (TELA 16.2 - FLUXOS) (Sugestão 3) ---
const subTabNavFluxos = document.getElementById('sub-tabs-nav-fluxos');
if (subTabNavFluxos) {
    subTabNavFluxos.addEventListener('click', (e) => {
        const target = e.target.closest('.subtab-btn');
        if (target) {
            const targetSubTab = target.getAttribute('data-subtab');
            
            const subTabButtons = subTabNavFluxos.querySelectorAll('.subtab-btn');
            const subTabContents = document.querySelectorAll('#admin-fluxos-screen .subtab-content-fluxos');

            subTabButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-subtab') === targetSubTab));
            subTabContents.forEach(c => c.classList.toggle('hidden', c.id !== `subtab-${targetSubTab}`));
            
            if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        }
    });
}

// --- LÓGICA DOS FILTROS (TELA 16.2 - FLUXOS) (Sugestão 4) ---
const filterButtons = document.querySelectorAll('#leito-filters .filter-btn');
const leitosGrid = document.getElementById('mapa-leitos-grid');
if (filterButtons.length > 0 && leitosGrid) {
    // const leitoCards = leitosGrid.querySelectorAll('.leito-card'); // Removido, pois os cards são dinâmicos
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.currentTarget.getAttribute('data-filter');
            
            // Atualiza botão ativo
            filterButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Lógica de filtro (AGORA ATUA SOBRE OS FILHOS DO GRID)
            const leitoCardsAtuais = leitosGrid.querySelectorAll('.leito-card');
            leitoCardsAtuais.forEach(card => {
                const status = card.getAttribute('data-status');
                if (filter === 'todos') {
                    card.classList.remove('hidden');
                } else {
                    card.classList.toggle('hidden', status !== filter);
                }
            });
        });
    });
}

// --- LÓGICA DO MODAL (TELA 16.2 - FLUXOS) (Sugestão 1 e 6) ---
const leitoModal = document.getElementById('leito-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalLeitoNumero = document.getElementById('modal-leito-numero');
const modalLeitoStatus = document.getElementById('modal-leito-status');
const modalPacienteNome = document.getElementById('modal-paciente-nome');

// Botões de ação do Modal
const btnModalAlocar = document.getElementById('btn-modal-alocar');
const btnModalVerProntuario = document.getElementById('btn-modal-ver-prontuario');
const btnModalProgramarAlta = document.getElementById('btn-modal-programar-alta');
const btnModalMarcarLivre = document.getElementById('btn-modal-marcar-livre');
const pModalBloqueado = document.getElementById('p-modal-bloqueado');
const btnModalDesbloquear = document.getElementById('btn-modal-desbloquear');
const allModalActions = [btnModalAlocar, btnModalVerProntuario, btnModalProgramarAlta, btnModalMarcarLivre, pModalBloqueado, btnModalDesbloquear];

function openLeitoModal(leito, status, paciente) {
    if (!leitoModal) return;

    // Esconde todas as ações
    allModalActions.forEach(btn => btn.classList.add('hidden'));

    // Preenche info
    modalLeitoNumero.textContent = leito;
    modalLeitoStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    modalPacienteNome.textContent = paciente || "Nenhum";

    // Mostra ações contextuais
    switch (status) {
        case 'livre':
            btnModalAlocar.classList.remove('hidden');
            break;
        case 'ocupado':
            btnModalVerProntuario.classList.remove('hidden');
            btnModalProgramarAlta.classList.remove('hidden');
            break;
        case 'limpeza':
            btnModalMarcarLivre.classList.remove('hidden');
            break;
        case 'bloqueado':
            pModalBloqueado.classList.remove('hidden');
            btnModalDesbloquear.classList.remove('hidden');
            break;
    }

    // Mostra o modal
    leitoModal.classList.remove('hidden');
}

function closeLeitoModal() {
    if (leitoModal) leitoModal.classList.add('hidden');
}

// Event Listeners do Modal
// (O listener de clique no 'leitosGrid' foi movido para a função 'iniciarListenerMapaDeLeitos' no Passo 10)
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeLeitoModal);
if (leitoModal) {
    leitoModal.addEventListener('click', (e) => {
        if (e.target === leitoModal) { // Fecha se clicar no backdrop
            closeLeitoModal();
        }
    });
}

// (PASSO 11 - FASE 2) Lógica de atualização dos botões do modal
if (btnModalMarcarLivre) {
    btnModalMarcarLivre.addEventListener('click', () => {
        const leitoId = modalLeitoNumero.textContent; // Pega o ID do leito do modal
        if (!leitoId) return;

        // Atualiza o documento no Firestore
        db.collection("leitos").doc(leitoId).update({
            status: "livre",
            paciente: "", // Limpa o ID do paciente
            pacienteNome: "" // Limpa o nome do paciente
        })
        .then(() => {
            console.log("Leito atualizado para LIVRE");
            closeLeitoModal(); // Fecha o modal
            // NÃO PRECISA FAZER MAIS NADA! O onSnapshot vai atualizar a UI sozinho.
        })
        .catch((error) => console.error("Erro ao atualizar leito: ", error));
    });
}
// (Adicione aqui a lógica para os outros botões: Alocar, Programar Alta, Desbloquear...)


// --- LÓGICA DO RELATÓRIO (TELA 16.3) ---
const reportPeriodSelect = document.getElementById('report-period');
const reportStartDate = document.getElementById('report-start-date');
const reportEndDate = document.getElementById('report-end-date');
if (reportPeriodSelect) {
    reportPeriodSelect.addEventListener('change', (e) => {
        const isCustom = e.target.value === 'Período Personalizado';
        if(reportStartDate && reportEndDate) {
            reportStartDate.disabled = !isCustom;
            reportEndDate.disabled = !isCustom;
            if(isCustom) {
                reportStartDate.classList.replace('bg-fundo-sidebar', 'bg-campo');
                reportEndDate.classList.replace('bg-fundo-sidebar', 'bg-campo');
                reportStartDate.classList.replace('text-texto-secundario', 'text-texto-principal');
                reportEndDate.classList.replace('text-texto-secundario', 'text-texto-principal');
            } else {
                reportStartDate.classList.replace('bg-campo', 'bg-fundo-sidebar');
                reportEndDate.classList.replace('bg-campo', 'bg-fundo-sidebar');
                reportStartDate.classList.replace('text-texto-principal', 'text-texto-secundario');
                reportEndDate.classList.replace('text-texto-principal', 'text-texto-secundario');
                reportStartDate.value = '';
                reportEndDate.value = '';
            }
        }
    });
}


// --- LIGAÇÕES DE NAVEGAÇÃO ---

// Navegação da Sidebar
sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetScreenId = e.currentTarget.getAttribute('data-target');
        const targetScreen = document.getElementById(targetScreenId);
        if (targetScreen) { 
            showAppScreen(targetScreen);
        }
    });
});

// Botões do HUB de Gestão
gestaoHubBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetScreenId = e.currentTarget.getAttribute('data-target');
        const targetScreen = document.getElementById(targetScreenId);
        if (targetScreen) { 
            showAppScreen(targetScreen);
        }
    });
});

// Botões Voltar para o HUB
document.getElementById('back-management-to-hub').addEventListener('click', (e) => { e.preventDefault(); showAppScreen(gestaoHubScreen); });
document.getElementById('back-fluxos-to-hub').addEventListener('click', (e) => { e.preventDefault(); showAppScreen(gestaoHubScreen); });
document.getElementById('back-relatorios-to-hub').addEventListener('click', (e) => { e.preventDefault(); showAppScreen(gestaoHubScreen); });

// Botão Voltar do HUB para o Dashboard
document.getElementById('back-gestao-hub-to-dashboard').addEventListener('click', (e) => { e.preventDefault(); showAppScreen(dashboardScreen); });


// Navegação dos Botões de Acesso Rápido (Dashboard)
quickAccessBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetScreenId = e.currentTarget.getAttribute('data-target');
        const targetScreen = document.getElementById(targetScreenId);
        
        if (targetScreen) {
            showAppScreen(targetScreen);
        }
    });
});

// (FASE 1 - Passo 6.3) Lógica de Login do Admin com Firebase
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const uid = userCredential.user.uid;
                
                // VERIFICAR SE É ADMIN
                db.collection("usuarios").doc(uid).get().then(doc => {
                    if (!doc.exists || doc.data().tipo !== "ADMIN") {
                        alert("Acesso negado. Portal apenas para administradores.");
                        auth.signOut();
                        return;
                    }
                    console.log("Login de admin bem-sucedido!");
                    // (O onAuthStateChanged da Fase 3 vai assumir o showLayout e o listener)
                });
            })
            .catch((error) => { 
                console.error("Erro no login:", error);
                alert("Erro no login: " + error.message);
             });
    });
}

// (FASE 1 - Passo 7) Lógica de Logout do Admin com Firebase
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut().then(() => {
            console.log("Logout feito com sucesso.");
            // (O onAuthStateChanged do Passo 12 vai tratar de mostrar o authLayout)
        });
    });
}

// (PASSO 10 - FASE 2) Função que ouve o mapa de leitos
function iniciarListenerMapaDeLeitos() {
    const mapaLeitosGrid = document.getElementById('mapa-leitos-grid');
    if (!mapaLeitosGrid) return;

    // Ouve a coleção "leitos" EM TEMPO REAL
    db.collection("leitos").onSnapshot((querySnapshot) => {
        mapaLeitosGrid.innerHTML = ''; // Limpa o mapa a cada atualização

        querySnapshot.forEach((doc) => {
            const leito = doc.data();
            const leitoId = doc.id;
            
            // Cria o HTML do leito dinamicamente
            const leitoDiv = document.createElement('div');
            leitoDiv.className = `leito-card leito-${leito.status}`;
            leitoDiv.setAttribute('data-leito', leitoId);
            leitoDiv.setAttribute('data-status', leito.status);
            // (Vamos assumir que o nome do paciente é guardado no documento do leito)
            const nomePaciente = leito.pacienteNome || 'Nenhum';
            leitoDiv.setAttribute('data-paciente', nomePaciente);
            leitoDiv.textContent = leitoId;

            // Adiciona o clique para abrir o modal
            leitoDiv.addEventListener('click', () => {
                openLeitoModal(leitoId, leito.status, nomePaciente);
            });
            
            mapaLeitosGrid.appendChild(leitoDiv);
        });

        // Re-ativa os ícones, se necessário
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    });
}


// Estado inicial (REMOVIDO PELO PASSO 12)
// showLayout(authLayout);
// showAppScreen(null); 

// Ativa os ícones no carregamento inicial
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}