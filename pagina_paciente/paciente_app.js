// --- ESTADO DA APLICAÇÃO ---
let selectedSpecialty = '';
let selectedProfessional = { name: '', img: '' };
let selectedDate = '22 de Outubro, 2025';
let selectedTime = '';

// --- REFERÊNCIAS AOS LAYOUTS E ECRÃS ---
const authLayout = document.getElementById('auth-layout');
const appLayout = document.getElementById('app-layout');

// Ecrãs de Autenticação
const loginScreen = document.getElementById('login-screen');
const registerScreen = document.getElementById('register-screen');
const authScreens = [loginScreen, registerScreen];

// Ecrãs da Aplicação (dentro do layout principal)
const dashboardScreen = document.getElementById('dashboard-screen');
const specialtyScreen = document.getElementById('specialty-screen');
const professionalScreen = document.getElementById('professional-screen');
const datetimeScreen = document.getElementById('datetime-screen');
const confirmationScreen = document.getElementById('confirmation-screen');
const successScreen = document.getElementById('success-screen');
const myAppointmentsScreen = document.getElementById('my-appointments-screen');
const myHistoryScreen = document.getElementById('my-history-screen');
const telemedicineScreen = document.getElementById('telemedicine-screen');
const notificationsScreen = document.getElementById('notifications-screen');
const messagesScreen = document.getElementById('messages-screen');

const appScreens = [dashboardScreen, specialtyScreen, professionalScreen, datetimeScreen, confirmationScreen, successScreen, myAppointmentsScreen, myHistoryScreen, telemedicineScreen, notificationsScreen, messagesScreen];

// --- REFERÊNCIAS AOS ELEMENTOS DE NAVEGAÇÃO ---
const goToRegisterLink = document.getElementById('go-to-register');
const goToLoginLink = document.getElementById('go-to-login');
const loginForm = document.getElementById('login-form');
const logoutBtnDesktop = document.getElementById('logout-btn-desktop');

const goToScheduleBtn = document.getElementById('go-to-schedule');
const goToTelemedicineBtn = document.getElementById('go-to-telemedicine-dash');
const goToNotificationsBtnMobile = document.getElementById('go-to-notifications-mobile');
const goToNotificationsBtnDesktop = document.getElementById('go-to-notifications-desktop');
const viewAllAppointmentsLink = document.getElementById('view-all-appointments');

// Botões Voltar
const backBtns = {
    'specialty-screen': document.getElementById('back-specialty-to-dashboard'),
    'professional-screen': document.getElementById('back-professional-to-specialty'),
    'datetime-screen': document.getElementById('back-datetime-to-professional'),
    'confirmation-screen': document.getElementById('back-confirmation-to-datetime'),
    'my-appointments-screen': document.getElementById('back-myappointments-to-dashboard'),
    'my-history-screen': document.getElementById('back-myhistory-to-dashboard'),
    'telemedicine-screen': document.getElementById('back-telemedicine-to-dashboard'),
    'notifications-screen': document.getElementById('back-notifications-to-dashboard'),
    'messages-screen': document.getElementById('back-messages-to-dashboard'),
};
const backToHomeBtn = document.getElementById('back-to-home-btn');

// Navegação (Móbil e Desktop)
const bottomNavLinks = document.querySelectorAll('#bottom-nav .nav-link');
const sidebarLinks = document.querySelectorAll('aside .sidebar-link');

// --- FUNÇÕES DE NAVEGAÇÃO PRINCIPAL ---

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
     // Controlo especial para telemedicina (travar scroll)
     if (screenToShow && screenToShow.id === 'telemedicine-screen') {
         document.body.classList.add('overflow-hidden');
    } else {
         document.body.classList.remove('overflow-hidden');
    }
    
    appScreens.forEach(screen => {
        if(screen) screen.classList.add('hidden');
    });
    if(screenToShow) {
        screenToShow.classList.remove('hidden');
        // Re-renderiza os ícones Lucide sempre que um novo ecrã é mostrado
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    // Atualiza o estado ativo da navegação
    updateNavActiveState(screenToShow ? screenToShow.id : 'dashboard-screen');
}

// Navegação inicial
showLayout(authLayout);
showAppScreen(null); // Esconde todos os ecrãs da app

// --- NAVEGAÇÃO DE AUTENTICAÇÃO ---
if(goToRegisterLink) goToRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    authScreens.forEach(s => s.classList.add('hidden'));
    if(registerScreen) registerScreen.classList.remove('hidden');
});
if(goToLoginLink) goToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    authScreens.forEach(s => s.classList.add('hidden'));
    if(loginScreen) loginScreen.classList.remove('hidden');
});
if(loginForm) loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showLayout(appLayout);
    showAppScreen(dashboardScreen);
});
if(logoutBtnDesktop) logoutBtnDesktop.addEventListener('click', (e) => {
    e.preventDefault();
    showLayout(authLayout);
    showAppScreen(null);
    authScreens.forEach(s => s.classList.add('hidden'));
    if(loginScreen) loginScreen.classList.remove('hidden');
});

// --- NAVEGAÇÃO DA APLICAÇÃO ---

function handleNavLinkClick(e) {
    e.preventDefault();
    const targetScreenId = e.currentTarget.getAttribute('data-target');
    if (targetScreenId) {
        const targetScreen = document.getElementById(targetScreenId);
        if (targetScreen) {
            if (targetScreenId === 'dashboard-screen') resetAppointmentState();
            showAppScreen(targetScreen);
        } else { console.warn(`Ecrã com ID '${targetScreenId}' não encontrado.`); }
    }
}

bottomNavLinks.forEach(link => link.addEventListener('click', handleNavLinkClick));
sidebarLinks.forEach(link => link.addEventListener('click', handleNavLinkClick));

function updateNavActiveState(activeScreenId) {
     const isConsultasFlow = ['specialty-screen', 'professional-screen', 'datetime-screen', 'confirmation-screen', 'my-appointments-screen'].includes(activeScreenId);
     const isTelemedicinaActive = activeScreenId === 'telemedicine-screen';

     [...bottomNavLinks, ...sidebarLinks].forEach(link => {
         const target = link.getAttribute('data-target');
         const text = link.querySelector('span');
         
         const isActive = (target === activeScreenId) ||
                          (target === 'my-appointments-screen' && isConsultasFlow) ||
                          (target === 'telemedicine-screen' && isTelemedicinaActive);

         link.classList.toggle('active', isActive); // Para sidebar
         link.classList.toggle('text-ciano-vibrante', isActive); // Para bottom nav
         link.classList.toggle('text-texto-secundario', !isActive); // Para bottom nav
         if(text) text.classList.toggle('font-bold', isActive); // Para bottom nav
     });
}

// Navegação do Dashboard
if(goToScheduleBtn) goToScheduleBtn.addEventListener('click', (e) => { e.preventDefault(); showAppScreen(specialtyScreen); });
if(goToTelemedicineBtn) goToTelemedicineBtn.addEventListener('click', (e) => { e.preventDefault(); showAppScreen(telemedicineScreen); resetTelemedicineView(); });
if(goToNotificationsBtnMobile) goToNotificationsBtnMobile.addEventListener('click', (e) => { e.preventDefault(); showAppScreen(notificationsScreen); });
if(goToNotificationsBtnDesktop) goToNotificationsBtnDesktop.addEventListener('click', (e) => { e.preventDefault(); showAppScreen(notificationsScreen); });
if(viewAllAppointmentsLink) viewAllAppointmentsLink.addEventListener('click', (e) => { e.preventDefault(); showAppScreen(myAppointmentsScreen); });

// Botões Voltar (para Dashboard)
if(backToHomeBtn) backToHomeBtn.addEventListener('click', () => { resetAppointmentState(); showAppScreen(dashboardScreen); });
if(backBtns['my-appointments-screen']) backBtns['my-appointments-screen'].addEventListener('click', (e) => { e.preventDefault(); showAppScreen(dashboardScreen); });
if(backBtns['my-history-screen']) backBtns['my-history-screen'].addEventListener('click', (e) => { e.preventDefault(); showAppScreen(dashboardScreen); });
if(backBtns['telemedicine-screen']) backBtns['telemedicine-screen'].addEventListener('click', (e) => { e.preventDefault(); showAppScreen(dashboardScreen); });
if(backBtns['notifications-screen']) backBtns['notifications-screen'].addEventListener('click', (e) => { e.preventDefault(); showAppScreen(dashboardScreen); });
if(backBtns['messages-screen']) backBtns['messages-screen'].addEventListener('click', (e) => { e.preventDefault(); showAppScreen(dashboardScreen); });

// Botões Voltar (Fluxo de Agendamento)
if(backBtns['specialty-screen']) backBtns['specialty-screen'].addEventListener('click', (e) => { e.preventDefault(); showAppScreen(dashboardScreen); });
if(backBtns['professional-screen']) backBtns['professional-screen'].addEventListener('click', (e) => { e.preventDefault(); showAppScreen(specialtyScreen); });
if(backBtns['datetime-screen']) backBtns['datetime-screen'].addEventListener('click', (e) => { e.preventDefault(); showAppScreen(professionalScreen); });
if(backBtns['confirmation-screen']) backBtns['confirmation-screen'].addEventListener('click', (e) => { e.preventDefault(); showAppScreen(datetimeScreen); });


// --- LÓGICA DO FLUXO DE AGENDAMENTO ---
const specialtyCards = document.querySelectorAll('.specialty-card');
const professionalCards = document.querySelectorAll('.professional-card');
const timeSlotsGrid = document.getElementById('time-slots-grid');
const goToConfirmationBtn = document.getElementById('go-to-confirmation');

specialtyCards.forEach(card => {
    card.addEventListener('click', () => {
        selectedSpecialty = card.getAttribute('data-specialty');
        if(document.getElementById('professional-specialty-title')) {
            document.getElementById('professional-specialty-title').textContent = selectedSpecialty;
        }
        showAppScreen(professionalScreen);
    });
});
professionalCards.forEach(card => {
    card.addEventListener('click', () => {
        selectedProfessional.name = card.querySelector('.font-bold').textContent;
        selectedProfessional.img = card.querySelector('img').src;
        if(document.getElementById('datetime-professional-name')) {
            document.getElementById('datetime-professional-name').textContent = selectedProfessional.name;
            document.getElementById('datetime-professional-specialty').textContent = selectedSpecialty;
            document.getElementById('datetime-professional-img').src = selectedProfessional.img;
        }
        showAppScreen(datetimeScreen);
    });
});

 if (timeSlotsGrid) {
     timeSlotsGrid.addEventListener('click', (e) => {
         const target = e.target.closest('.time-slot');
         if (target && !target.disabled) {
             timeSlotsGrid.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
             target.classList.add('selected');
             selectedTime = target.textContent;
             if (goToConfirmationBtn) goToConfirmationBtn.classList.remove('hidden');
         }
     });
 }

 if(goToConfirmationBtn) goToConfirmationBtn.addEventListener('click', () => {
     if (!selectedTime) { console.error("Por favor, selecione um horário."); return; }
     if(document.getElementById('confirm-professional-name')) {
         document.getElementById('confirm-professional-name').textContent = selectedProfessional.name;
         document.getElementById('confirm-specialty').textContent = selectedSpecialty;
         document.getElementById('confirm-professional-img').src = selectedProfessional.img;
         document.getElementById('confirm-date').textContent = selectedDate;
         document.getElementById('confirm-time').textContent = selectedTime;
     }
     showAppScreen(confirmationScreen);
 });
const confirmAppointmentBtn = document.getElementById('confirm-appointment-btn');
if(confirmAppointmentBtn) confirmAppointmentBtn.addEventListener('click', () => {
    if(document.getElementById('success-professional-name')) {
         document.getElementById('success-professional-name').textContent = selectedProfessional.name;
         document.getElementById('success-date-time').textContent = `${selectedDate} às ${selectedTime}`;
     }
     showAppScreen(successScreen);
});
function resetAppointmentState() {
     selectedSpecialty = ''; selectedProfessional = { name: '', img: '' }; selectedTime = '';
     if (timeSlotsGrid) {
         timeSlotsGrid.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
     }
     if (goToConfirmationBtn) goToConfirmationBtn.classList.add('hidden');
}

// --- LÓGICA DAS ABAS EM "MINHAS CONSULTAS" ---
const tabUpcoming = document.getElementById('tab-upcoming');
const tabPast = document.getElementById('tab-past');
const upcomingList = document.getElementById('upcoming-list');
const pastList = document.getElementById('past-list');
if (tabUpcoming && tabPast && upcomingList && pastList) {
    tabUpcoming.addEventListener('click', () => {
        tabUpcoming.classList.add('active'); tabPast.classList.remove('active');
        upcomingList.classList.remove('hidden'); pastList.classList.add('hidden');
    });
    tabPast.addEventListener('click', () => {
        tabPast.classList.add('active'); tabUpcoming.classList.remove('active');
        pastList.classList.remove('hidden'); upcomingList.classList.add('hidden');
    });
     tabUpcoming.classList.add('active'); tabPast.classList.remove('active');
     upcomingList.classList.remove('hidden'); pastList.classList.add('hidden');
}

// --- LÓGICA DO ECRÃ DE TELEMEDICINA ---
const waitingRoomView = document.getElementById('waiting-room-view');
const callView = document.getElementById('call-view');
const joinCallBtn = document.getElementById('join-call-btn');
const endCallBtn = document.getElementById('end-call-btn');
if(joinCallBtn && waitingRoomView && callView) {
     joinCallBtn.addEventListener('click', () => {
         waitingRoomView.classList.add('hidden');
         callView.classList.remove('hidden');
         callView.classList.add('flex'); // Garante que o layout flex é aplicado
         if (typeof lucide !== 'undefined') {
             lucide.createIcons(); // Recria os ícones na vista da chamada
         }
     });
}
if(endCallBtn && waitingRoomView && callView) {
     endCallBtn.addEventListener('click', () => {
         showAppScreen(dashboardScreen);
         resetTelemedicineView();
     });
}
function resetTelemedicineView() {
    if(waitingRoomView && callView) {
         waitingRoomView.classList.remove('hidden');
         callView.classList.add('hidden');
         callView.classList.remove('flex');
    }
}

// --- LÓGICA DO FORMULÁRIO DE CADASTRO MULTI-PASSO ---
const steps = [document.getElementById('step-1'), document.getElementById('step-2'), document.getElementById('step-3')];
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressIndicator = document.getElementById('progress-indicator');
const stepTitle = document.getElementById('step-title');
const titles = [ "Vamos começar. Quem é você?", "Onde podemos te encontrar?", "Para sua segurança, crie uma senha" ];
let currentStep = 0;
function updateStep() {
    if (!steps[0] || !progressIndicator || !stepTitle || !prevBtn || !nextBtn) return;
    steps.forEach((step, index) => { if(step) step.classList.toggle('hidden', index !== currentStep); });
    progressIndicator.textContent = `Passo ${currentStep + 1} de ${steps.length}`; stepTitle.textContent = titles[currentStep];
    prevBtn.classList.toggle('hidden', currentStep === 0); nextBtn.textContent = currentStep === steps.length - 1 ? 'Finalizar Cadastro' : 'Avançar';
    
    const btnContainer = nextBtn.parentElement;
    if (currentStep === 0) {
         prevBtn.classList.add('hidden'); nextBtn.classList.add('w-full');
         if (btnContainer.classList.contains('justify-between')) { btnContainer.classList.remove('justify-between'); }
    } else {
         prevBtn.classList.remove('hidden'); nextBtn.classList.remove('w-full');
         if (!btnContainer.classList.contains('justify-between')) { btnContainer.classList.add('justify-between'); }
    }
}
if(nextBtn) nextBtn.addEventListener('click', () => {
    let valid = true; const currentStepElement = steps[currentStep]; if (!currentStepElement) return;
    const currentStepInputs = currentStepElement.querySelectorAll('input[required], select[required]');
    currentStepInputs.forEach(input => {
         if (!input.value) { valid = false; input.classList.add('border-red-500', 'border'); }
         else { input.classList.remove('border-red-500', 'border'); }
    });
    if (!valid) { console.error('Por favor, preencha todos os campos obrigatórios.'); return; }
    if (currentStep < steps.length - 1) { currentStep++; updateStep(); }
    else { console.log("Submetendo formulário..."); /* document.getElementById('registration-form').submit(); */ }
});
if(prevBtn) prevBtn.addEventListener('click', () => {
    if (currentStep > 0) {
        const currentStepElement = steps[currentStep]; if (!currentStepElement) return;
        const currentStepInputs = currentStepElement.querySelectorAll('input, select');
        currentStepInputs.forEach(input => input.classList.remove('border-red-500', 'border'));
        currentStep--; updateStep();
    }
});

// --- LÓGICA DE PESQUISA DE ESPECIALIDADES ---
const specialtySearchInput = document.getElementById('specialty-search');
const specialtyGrid = document.getElementById('specialty-grid');
const specialtyCardsQuery = specialtyGrid ? specialtyGrid.querySelectorAll('.specialty-card') : [];
if(specialtySearchInput) specialtySearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    specialtyCardsQuery.forEach(card => {
        const specialtyName = card.getAttribute('data-specialty').toLowerCase();
        card.classList.toggle('hidden', !specialtyName.includes(searchTerm));
    });
});

// Inicializa o estado do formulário e ativa os ícones
updateStep();
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}