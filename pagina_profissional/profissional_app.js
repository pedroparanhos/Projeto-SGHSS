// (PASSO 12 - FASE 3) Auth Guard
auth.onAuthStateChanged((user) => {
    if (user) {
        // O utilizador está logado.
        db.collection("usuarios").doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().tipo === "PROFISSIONAL") {
                showLayout(appLayout);
                // (Função a ser criada para carregar dados do profissional)
                carregarDashboardProfissional(user.uid); 
            } else {
                // Logado, mas não é profissional. Expulsar.
                console.warn("Tentativa de acesso não autorizada (não-profissional)");
                auth.signOut();
            }
        });

    } else {
        // O utilizador não está logado.
        showLayout(authLayout); 
        showAppScreen(null); 
    }
});


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

// (FASE 1 - Passo 6.2) Lógica de Login do Profissional com Firebase
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-crm').value; // (Assumindo que o login é por email)
        const password = document.getElementById('login-password-prof').value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const uid = userCredential.user.uid;
                
                // VERIFICAR SE É PROFISSIONAL
                db.collection("usuarios").doc(uid).get().then(doc => {
                    if (!doc.exists || doc.data().tipo !== "PROFISSIONAL") {
                        alert("Acesso negado. Portal apenas para profissionais.");
                        auth.signOut();
                        return;
                    }
                    console.log("Login de profissional bem-sucedido!");
                    // (O onAuthStateChanged fará o resto)
                });
            })
            .catch((error) => { 
                console.error("Erro no login:", error);
                alert("Erro no login: " + error.message);
             });
    });
}

// (FASE 1 - Passo 7) Lógica de Logout do Profissional com Firebase
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut().then(() => {
            console.log("Logout feito com sucesso.");
            // (O onAuthStateChanged do Passo 12 vai tratar de mostrar o authLayout)
        });
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

// (PASSO 12 - FASE 3) Nova função (placeholder)
function carregarDashboardProfissional(userId) {
    console.log("Carregando dashboard para o profissional:", userId);
    
    // Carregar nome do profissional na sidebar
    db.collection("usuarios").doc(userId).get().then(doc => {
        if (doc.exists) {
            const nome = doc.data().nome;
            const nomeSidebar = document.querySelector('#app-layout aside .font-semibold');
            if(nomeSidebar) nomeSidebar.textContent = nome;
        }
    });

    // TODO: Adicionar lógica para carregar agenda e métricas do profissional
    // (Por agora, apenas mostra o dashboard)
    showAppScreen(dashboardScreen);
}


// Estado inicial (REMOVIDO PELO PASSO 12)
// showLayout(authLayout);
// showAppScreen(null); 

// Ativa os ícones no carregamento inicial
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}