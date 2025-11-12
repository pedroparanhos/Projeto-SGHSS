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
    const leitoCards = leitosGrid.querySelectorAll('.leito-card');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.currentTarget.getAttribute('data-filter');
            
            // Atualiza botão ativo
            filterButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Lógica de filtro
            leitoCards.forEach(card => {
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
if (leitosGrid) {
    leitosGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.leito-card');
        if (card) {
            const leito = card.getAttribute('data-leito');
            const status = card.getAttribute('data-status');
            const paciente = card.getAttribute('data-paciente');
            openLeitoModal(leito, status, paciente);
        }
    });
}
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeLeitoModal);
if (leitoModal) {
    leitoModal.addEventListener('click', (e) => {
        if (e.target === leitoModal) { // Fecha se clicar no backdrop
            closeLeitoModal();
        }
    });
}


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
            if (targetScreenId === 'admin-management-screen') {
                // Não é mais necessário, pois a aba já vem ativa por padrão
            }
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
            if (targetScreenId === 'admin-management-screen') {
                // Ativa a primeira aba por padrão
                const firstTabBtn = document.querySelector('#sub-tabs-nav-cadastros .subtab-btn');
                if(firstTabBtn) showSubTab(firstTabBtn.getAttribute('data-subtab'));
            }
            if (targetScreenId === 'admin-fluxos-screen') {
                // Ativa a primeira aba por padrão
                const firstTabBtn = document.querySelector('#sub-tabs-nav-fluxos .subtab-btn');
                if(firstTabBtn) showSubTab(firstTabBtn.getAttribute('data-subtab'));
            }
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
            if (targetScreenId === 'admin-management-screen') {
                const firstTabBtn = document.querySelector('#sub-tabs-nav-cadastros .subtab-btn');
                if(firstTabBtn) showSubTab(firstTabBtn.getAttribute('data-subtab'));
            }
             if (targetScreenId === 'admin-fluxos-screen') {
                const firstTabBtn = document.querySelector('#sub-tabs-nav-fluxos .subtab-btn');
                if(firstTabBtn) showSubTab(firstTabBtn.getAttribute('data-subtab'));
            }
        }
    });
});

// Simula o login
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showLayout(appLayout);
        showAppScreen(dashboardScreen);
    });
}

// Simula o logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showLayout(authLayout);
        showAppScreen(null);
    });
}

// Estado inicial
showLayout(authLayout);
showAppScreen(null); 

// Ativa os ícones no carregamento inicial
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}