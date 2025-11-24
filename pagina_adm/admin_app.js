// --- VERIFICAÇÃO ---
if (typeof firebase === 'undefined') console.error("Firebase erro!");

// --- GLOBAIS ---
const authLayout = document.getElementById('auth-layout');
const appLayout = document.getElementById('app-layout');
const loginForm = document.getElementById('login-form-admin');
let currentLeitoId = null;

// AUTH
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection("usuarios").doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().tipo === "ADMIN") {
                showLayout(appLayout);
                inicializarAdmin();
                // Força seleção inicial
                setTimeout(() => updateNavSelection('admin-dashboard-screen'), 50);
            } else {
                auth.signOut();
                showLayout(authLayout);
                alert("Acesso restrito a administradores.");
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

// --- NAVEGAÇÃO E MENU (CORREÇÃO PONTO 1) ---
function showAppScreen(targetId) {
    document.querySelectorAll('.app-screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(targetId).classList.remove('hidden');
    updateNavSelection(targetId);
    lucide.createIcons();
}

function updateNavSelection(targetId) {
    // 1. Limpeza Total
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('bg-ciano-vibrante/10', 'text-ciano-vibrante');
    });

    // 2. Mapeamento de Sub-telas para Menus
    let menuId = targetId;
    if(targetId === 'admin-management-screen' || targetId === 'admin-relatorios-screen' || targetId === 'admin-fluxos-screen') {
        menuId = 'admin-gestao-hub-screen';
    }

    // 3. Ativação
    const link = document.querySelector(`.sidebar-link[data-target="${menuId}"]`);
    if(link) link.classList.add('bg-ciano-vibrante/10', 'text-ciano-vibrante');
}

document.querySelectorAll('.sidebar-link, .btn-nav, .btn-back').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target') || btn.closest('button').getAttribute('data-target');
        showAppScreen(targetId);
    });
});

// --- DASHBOARD E MÉTRICAS ---
function inicializarAdmin() {
    db.collection("usuarios").where("tipo", "==", "PACIENTE").onSnapshot(snap => {
        document.getElementById('metric-total-pacientes').textContent = snap.size;
        renderizarListaPacientes(snap.docs);
    });

    db.collection("leitos").onSnapshot(snap => {
        let ocupados = 0;
        snap.forEach(doc => { if(doc.data().status === 'ocupado') ocupados++; });
        document.getElementById('metric-leitos-ocupados').textContent = ocupados;
        renderizarMapaLeitos(snap.docs);
    });

    db.collection("consultas").where("status", "==", "Concluída").onSnapshot(snap => {
        const total = snap.size * 150; 
        document.getElementById('metric-receita').textContent = `R$ ${total.toLocaleString()}`;
    });

    db.collection("usuarios").where("tipo", "==", "PROFISSIONAL").onSnapshot(snap => {
        renderizarListaProfissionais(snap.docs);
    });
}

// --- GESTÃO DE CADASTROS (COM BUSCA - PONTO 2) ---
function renderizarListaPacientes(docs) {
    const lista = document.getElementById('lista-pacientes-real');
    lista.innerHTML = '';
    docs.forEach(doc => {
        const d = doc.data();
        // Adiciona atributo data-search para filtro fácil
        const div = document.createElement('div');
        div.setAttribute('data-search', (d.nome + ' ' + d.email).toLowerCase());
        div.innerHTML = criarCardUsuario(doc.id, d.nome, d.email, 'PACIENTE', d);
        lista.appendChild(div);
    });
    lucide.createIcons();
}

function renderizarListaProfissionais(docs) {
    const lista = document.getElementById('lista-profissionais-real');
    lista.innerHTML = '';
    docs.forEach(doc => {
        const d = doc.data();
        const div = document.createElement('div');
        div.setAttribute('data-search', (d.nome + ' ' + (d.especialidade || '')).toLowerCase());
        div.innerHTML = criarCardUsuario(doc.id, d.nome, d.especialidade || 'Geral', 'PROFISSIONAL', d);
        lista.appendChild(div);
    });
    lucide.createIcons();
}

function criarCardUsuario(id, titulo, subtitulo, tipo, dadosCompletos) {
    const dadosStr = JSON.stringify(dadosCompletos).replace(/"/g, '&quot;');
    return `
    <div class="bg-fundo-secundario p-4 rounded-lg flex justify-between items-center border border-gray-700 hover:border-ciano-vibrante transition-colors">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-campo rounded-full flex items-center justify-center font-bold text-white">${titulo ? titulo[0] : 'U'}</div>
            <div>
                <p class="font-bold text-white">${titulo}</p>
                <p class="text-xs text-texto-secundario">${subtitulo}</p>
            </div>
        </div>
        <div class="flex gap-2">
            <button onclick="editarUsuario('${id}', '${tipo}', ${dadosStr})" class="p-2 text-ciano-vibrante hover:bg-campo rounded"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
            <button onclick="excluirUsuario('${id}')" class="p-2 text-red-500 hover:bg-campo rounded"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
    </div>`;
}

// Lógica de Busca (PONTO 2)
document.getElementById('search-pacientes').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('#lista-pacientes-real > div').forEach(card => {
        card.style.display = card.getAttribute('data-search').includes(term) ? 'block' : 'none';
    });
});

document.getElementById('search-profissionais').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('#lista-profissionais-real > div').forEach(card => {
        card.style.display = card.getAttribute('data-search').includes(term) ? 'block' : 'none';
    });
});

// Abas Internas
const tabPac = document.getElementById('tab-pacientes');
const tabProf = document.getElementById('tab-profissionais');
tabPac.onclick = () => {
    document.getElementById('view-pacientes').classList.remove('hidden');
    document.getElementById('view-profissionais').classList.add('hidden');
    tabPac.classList.add('border-ciano-vibrante', 'text-ciano-vibrante');
    tabProf.classList.remove('border-ciano-vibrante', 'text-ciano-vibrante');
};
tabProf.onclick = () => {
    document.getElementById('view-profissionais').classList.remove('hidden');
    document.getElementById('view-pacientes').classList.add('hidden');
    tabProf.classList.add('border-ciano-vibrante', 'text-ciano-vibrante');
    tabPac.classList.remove('border-ciano-vibrante', 'text-ciano-vibrante');
};

// CRUD
window.abrirModalCadastro = function(tipo) {
    document.getElementById('modal-cad-titulo').textContent = tipo === 'PACIENTE' ? 'Novo Paciente' : 'Novo Profissional';
    document.getElementById('cad-tipo').value = tipo;
    document.getElementById('cad-id').value = ''; 
    document.getElementById('form-cadastro').reset();
    
    const isPac = tipo === 'PACIENTE';
    document.getElementById('cad-cpf').classList.toggle('hidden', !isPac);
    document.getElementById('cad-especialidade').classList.toggle('hidden', isPac);
    document.getElementById('cad-crm').classList.toggle('hidden', isPac);
    
    document.getElementById('cad-cpf').required = isPac;
    document.getElementById('cad-especialidade').required = !isPac;

    document.getElementById('modal-cadastro').classList.remove('hidden');
};

window.fecharModalCadastro = function() {
    document.getElementById('modal-cadastro').classList.add('hidden');
};

window.editarUsuario = function(id, tipo, dados) {
    abrirModalCadastro(tipo);
    document.getElementById('modal-cad-titulo').textContent = 'Editar Usuário';
    document.getElementById('cad-id').value = id;
    document.getElementById('cad-nome').value = dados.nome;
    document.getElementById('cad-email').value = dados.email;
    
    if (tipo === 'PACIENTE') {
        document.getElementById('cad-cpf').value = dados.cpf || '';
    } else {
        document.getElementById('cad-especialidade').value = dados.especialidade || '';
        document.getElementById('cad-crm').value = dados.crm || '';
    }
};

window.excluirUsuario = function(id) {
    if(confirm("Tem certeza?")) {
        db.collection("usuarios").doc(id).delete().then(() => alert("Excluído.")).catch(err => alert("Erro: " + err.message));
    }
};

document.getElementById('form-cadastro').addEventListener('submit', (e) => {
    e.preventDefault();
    const tipo = document.getElementById('cad-tipo').value;
    const id = document.getElementById('cad-id').value;
    const dados = {
        nome: document.getElementById('cad-nome').value,
        email: document.getElementById('cad-email').value,
        tipo: tipo
    };

    if (tipo === 'PACIENTE') {
        dados.cpf = document.getElementById('cad-cpf').value;
    } else {
        dados.especialidade = document.getElementById('cad-especialidade').value;
        dados.crm = document.getElementById('cad-crm').value;
    }

    const collectionRef = db.collection("usuarios");
    const promessa = id ? collectionRef.doc(id).update(dados) : collectionRef.add(dados);

    promessa.then(() => {
        alert("Salvo!");
        fecharModalCadastro();
    }).catch(err => alert("Erro: " + err.message));
});

// --- CONTROLE DE LEITOS ---
function renderizarMapaLeitos(docs) {
    const grid = document.getElementById('grid-leitos-real');
    grid.innerHTML = '';
    docs.sort((a,b) => a.id - b.id).forEach(doc => {
        const d = doc.data();
        let cor = 'bg-gray-500/20 border-gray-500 text-gray-500';
        if(d.status === 'livre') cor = 'bg-green-500/20 border-green-500 text-green-500';
        else if(d.status === 'ocupado') cor = 'bg-red-500/20 border-red-500 text-red-500';
        else if(d.status === 'limpeza') cor = 'bg-orange-500/20 border-orange-500 text-orange-500';

        const div = document.createElement('div');
        div.className = `border-2 ${cor} rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform h-24`;
        div.innerHTML = `<span class="font-bold text-lg">${doc.id}</span><span class="text-xs uppercase font-bold">${d.status}</span>`;
        div.onclick = () => abrirModalLeito(doc.id, d.status);
        grid.appendChild(div);
    });
}

window.abrirModalLeito = function(id, status) {
    currentLeitoId = id;
    document.getElementById('modal-leito-num').textContent = id;
    document.getElementById('modal-leito-status').textContent = status.toUpperCase();
    document.getElementById('modal-leito').classList.remove('hidden');
};

window.alterarStatusLeito = function(novoStatus) {
    if(!currentLeitoId) return;
    db.collection("leitos").doc(currentLeitoId).update({ status: novoStatus })
        .then(() => { document.getElementById('modal-leito').classList.add('hidden'); });
};

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    auth.signInWithEmailAndPassword(document.getElementById('login-email').value, document.getElementById('login-password').value)
        .catch(err => alert("Erro: " + err.message));
});

document.getElementById('logout-btn-desktop').onclick = () => auth.signOut();