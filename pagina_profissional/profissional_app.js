// --- NAVEGAÇÃO BÁSICA ---
const authLayout = document.getElementById('auth-layout');
const appLayout = document.getElementById('app-layout');
const loginForm = document.getElementById('login-form-profissional');
const logoutBtn = document.getElementById('logout-btn-desktop');

// Referências aos ecrãs
const dashboardScreen = document.getElementById('dashboard-screen');
const agendaScreen = document.getElementById('agenda-screen');
const pacientesScreen = document.getElementById('pacientes-screen');
const atendimentoScreen = document.getElementById('atendimento-screen');
const mensagensScreen = document.getElementById('mensagens-screen');
const notificationsScreen = document.getElementById('notifications-screen'); // Ecrã adicionado

const appScreens = [dashboardScreen, agendaScreen, pacientesScreen, atendimentoScreen, mensagensScreen, notificationsScreen]; // Ecrã adicionado

// Referências à Navegação
const sidebarLinks = document.querySelectorAll('aside .sidebar-link');
const btnsVerProntuario = document.querySelectorAll('.btn-ver-prontuario');
const btnVoltarAtendimento = document.getElementById('back-atendimento-to-pacientes');
const btnGoToNotifications = document.getElementById('go-to-notifications-desktop'); // Botão do sino
const btnBackFromNotifications = document.getElementById('back-notifications-to-dashboard'); // Botão voltar das notificações

function showLayout(layoutToShow) {
    // Esconde ambos os layouts primeiro
    if (authLayout) {
        authLayout.classList.add('hidden');
        authLayout.classList.remove('flex'); // Remove 'flex'
    }
    if (appLayout) {
        appLayout.classList.add('hidden');
        appLayout.classList.remove('lg:flex'); // Remove 'lg:flex'
    }
    
    // Mostra o layout desejado e aplica a classe de display correta
    if(layoutToShow) {
        layoutToShow.classList.remove('hidden');
        if (layoutToShow === authLayout) {
            layoutToShow.classList.add('flex'); // Adiciona 'flex' para o auth
        } else if (layoutToShow === appLayout) {
            layoutToShow.classList.add('lg:flex'); // Adiciona 'lg:flex' para o app
        }
    }
}

function showAppScreen(screenToShow) {
    // Esconde todos os ecrãs
    appScreens.forEach(screen => {
        if(screen) screen.classList.add('hidden');
    });
    // Mostra o ecrã alvo
    if(screenToShow) screenToShow.classList.remove('hidden');

    // Atualiza o estado ativo da sidebar
    sidebarLinks.forEach(link => {
        const target = link.getAttribute('data-target');
        let isActive = target === (screenToShow ? screenToShow.id : '');
        
        // Lógica especial para manter "Pacientes" ativo durante o atendimento
        if (screenToShow && screenToShow.id === 'atendimento-screen' && target === 'pacientes-screen') {
            isActive = true;
        }

        link.classList.toggle('active', isActive);
    });
    
    // Re-renderiza os ícones
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Navegação da Sidebar
sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetScreenId = e.currentTarget.getAttribute('data-target');
        const targetScreen = document.getElementById(targetScreenId);
        
        if (targetScreen) {
            showAppScreen(targetScreen);
        } else {
            console.warn(`Ecrã com ID '${targetScreenId}' não encontrado.`);
        }
    });
});

// Simula o login
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showLayout(appLayout);
        showAppScreen(dashboardScreen); // Mostra o dashboard ao logar
    });
}

// Simula o logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showLayout(authLayout);
        showAppScreen(null); // Esconde todos os ecrãs
    });
}

// --- Lógica Específica dos Ecrãs ---

// Navegação para Notificações
if (btnGoToNotifications) {
    btnGoToNotifications.addEventListener('click', (e) => {
        e.preventDefault();
        showAppScreen(notificationsScreen);
    });
}
if (btnBackFromNotifications) {
    btnBackFromNotifications.addEventListener('click', (e) => {
        e.preventDefault();
        showAppScreen(dashboardScreen);
    });
}


// Navegação para o Prontuário (Tela 12)
const prontuarioPacienteNome = document.getElementById('prontuario-paciente-nome');
btnsVerProntuario.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const nomePaciente = e.currentTarget.getAttribute('data-paciente');
        if (prontuarioPacienteNome) {
            prontuarioPacienteNome.textContent = nomePaciente;
        }
        showAppScreen(atendimentoScreen);
    });
});

// Voltar do Prontuário para a Lista de Pacientes
if (btnVoltarAtendimento) {
    btnVoltarAtendimento.addEventListener('click', (e) => {
        e.preventDefault();
        showAppScreen(pacientesScreen);
    });
}

// Lógica da Pesquisa de Pacientes (Tela 13)
const pacienteSearch = document.getElementById('paciente-search');
const pacientesList = document.getElementById('pacientes-list');
if (pacienteSearch && pacientesList) {
    const pacientesItems = pacientesList.querySelectorAll('.paciente-item');
    pacienteSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        pacientesItems.forEach(item => {
            const nome = item.getAttribute('data-nome').toLowerCase();
            item.classList.toggle('hidden', !nome.includes(searchTerm));
        });
    });
}

// Lógica das Abas do Prontuário (Tela 12)
const tabButtons = document.querySelectorAll('#atendimento-screen .tab-btn');
const tabContents = document.querySelectorAll('#atendimento-screen .tab-content');
if (tabButtons.length > 0) {
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Desativa todos
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.add('hidden'));
            
            // Ativa o clicado
            const targetTab = e.currentTarget.getAttribute('data-tab');
            e.currentTarget.classList.add('active');
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }
        });
    });
}


// Estado inicial
showLayout(authLayout);
showAppScreen(null); // Esconde todos os ecrãs da app se estiver no login

// Ativa os ícones no carregamento inicial
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}