// ==========================================================
// LÓGICA DE FIESTA PRÓDIGO 2026 - LOGIN INICIAL & FLUJO PERSONALIZADO
// ==========================================================

// ==========================================================
// FIREBASE — inline (sin módulos externos)
// ==========================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
    getFirestore, doc, getDoc, setDoc, getDocs,
    deleteDoc, collection, query, orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const _fbApp = initializeApp({
    apiKey: "AIzaSyDrKwVwHtTh0KbuPplCSpq0GvBDU0HtgMI",
    authDomain: "fiesta-prodigo-2026.firebaseapp.com",
    projectId: "fiesta-prodigo-2026",
    storageBucket: "fiesta-prodigo-2026.firebasestorage.app",
    messagingSenderId: "404912982263",
    appId: "1:404912982263:web:56fe4d3f485b8513c0abf2"
});
const _fbDb = getFirestore(_fbApp);

function _fbKey(name) {
    return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

async function fbGetAllResponses() {
    try {
        const snap = await getDocs(query(collection(_fbDb, 'responses'), orderBy('timestamp', 'desc')));
        return snap.docs.map(d => d.data());
    } catch(e) { console.warn('[FB] fbGetAllResponses:', e.message); return null; }
}
async function fbGetResponse(guestName) {
    try {
        const snap = await getDoc(doc(_fbDb, 'responses', _fbKey(guestName)));
        return snap.exists() ? snap.data() : null;
    } catch(e) { console.warn('[FB] fbGetResponse:', e.message); return null; }
}
async function fbSaveResponse(entry) {
    try {
        console.log('[FB] Guardando:', _fbKey(entry.guestName));
        await setDoc(doc(_fbDb, 'responses', _fbKey(entry.guestName)), entry);
        console.log('[FB] Guardado OK');
        return true;
    } catch(e) { console.error('[FB] fbSaveResponse ERROR:', e.code, e.message); return false; }
}
async function fbDeleteResponse(guestName) {
    try {
        await deleteDoc(doc(_fbDb, 'responses', _fbKey(guestName)));
        return true;
    } catch(e) { return false; }
}
async function fbGetUsuarios() {
    try {
        const snap = await getDocs(collection(_fbDb, 'usuarios'));
        return snap.docs.map(d => d.data());
    } catch(e) { return null; }
}
async function fbSaveUsuario(userObj) {
    try {
        await setDoc(doc(_fbDb, 'usuarios', _fbKey(userObj.name)), userObj);
        return true;
    } catch(e) { return false; }
}
async function fbDeleteUsuario(name) {
    try {
        await deleteDoc(doc(_fbDb, 'usuarios', _fbKey(name)));
        return true;
    } catch(e) { return false; }
}
async function fbGetPersonaje(sfn) {
    try {
        const snap = await getDoc(doc(_fbDb, 'personajes', sfn));
        return snap.exists() ? snap.data() : null;
    } catch(e) { return null; }
}
async function fbSavePersonaje(sfn, data) {
    try {
        await setDoc(doc(_fbDb, 'personajes', sfn), data);
        return true;
    } catch(e) { return false; }
}
async function fbGetItinerario() {
    try {
        const snap = await getDoc(doc(_fbDb, 'config', 'itinerario'));
        return snap.exists() ? snap.data().items : null;
    } catch(e) { return null; }
}
async function fbSaveItinerario(items) {
    try {
        await setDoc(doc(_fbDb, 'config', 'itinerario'), { items });
        return true;
    } catch(e) { return false; }
}
async function fbGetSettings() {
    try {
        const snap = await getDoc(doc(_fbDb, 'config', 'settings'));
        return snap.exists() ? snap.data() : null;
    } catch(e) { return null; }
}
async function fbSaveSettings(data) {
    try {
        await setDoc(doc(_fbDb, 'config', 'settings'), data);
        return true;
    } catch(e) { return false; }
}
// ==========================================================

const STORAGE_KEY = 'prodigo_2026_responses_v4';
const SESSION_USER_KEY = 'prodigo_2026_active_user';
const MAX_EDITS = 3;           // máximo de cambios de votación por usuario
const MAX_EDITS_ASIST = 2;     // máximo de cambios de asistencia por usuario
const USERS_KEY = 'prodigo_2026_users_v1';

// Listado Oficial de Integrantes y Personajes de "El Pródigo" — ordenado alfabéticamente
const ACTORS_AND_CREW = [
    "Abogado de Tristo (Pablo)",
    "Cristina Suarez Quintana (Nora)",
    "Custodio 1 (Francisco)",
    "Director (Omar)",
    "Elias Mainor (Nicolas)",
    "Elena Ramirez (Cecilia)",
    "Fabiana Otrosky (Karina)",
    "Fernando Tristo (Sergio)",
    "Fotografo Forense (Cristian)",
    "Hipolito Fusco (Diego)",
    "Julián Vitolo (Gerardo)",
    "Kiran Sultan Khan (Alejandro)",
    "Luis Dreiper (Javier)",
    "Marco Salas (Fabian)",
    "Mario Distefano (Thomas)",
    "Maximo Grecco (Agustin)",
    "Mercedes Fusco (Lorena)",
    "Otto Hahn Nienstein (Julio)",
    "Pedro Torash (Hugo)",
    "Productora (Laura)",
    "Rosalia Fernandez (Mariela)",
    "Selin Tarkan (Hazal)",
    "Sofia Fusco (Romina)",
    "Teresa Juarez (Victoria)",
    "Tobias Miranda (Gabriel)",
    'Victor Fusco (Salvador "El Tano")',
    "Vecino 1 (Julian)",
];

// Metadatos de las 11 Ternas
const TERNAS_CONFIG = [
    { id: "terna1",  title: "Terna 1: Actor más responsable (sabía la letra)", isPerson: true },
    { id: "terna2",  title: "Terna 2: Menos responsable (nunca sabía la letra)", isPerson: true },
    { id: "terna3",  title: "Terna 3: Repitió más veces una toma", isPerson: true },
    { id: "terna4",  title: "Terna 4: Pasó por todos los roles", isPerson: true },
    { id: "terna5",  title: "Terna 5: Revelación del set", isPerson: true },
    { id: "terna6",  title: "Terna 6: Siempre se quiere ir temprano", isPerson: true },
    { id: "terna7",  title: "Terna 7: Peor Artista", isPerson: true },
    { id: "terna8",  title: "Terna 8: Mejor actor", isPerson: true },
    { id: "terna9",  title: "Terna 9: Mejor actriz", isPerson: true },
    { id: "terna10", title: "Terna 10: Mejor momento del proyecto", isPerson: false },
    { id: "terna11", title: "✨ PROD1G0 DE PLATINO — Máximo reconocimiento del proyecto", isPerson: true, isPlatino: true }
];

let currentStep = 0;
let loggedUser = null; // { name: string, isAdmin: boolean }
let ternasMode = 'wizard'; // 'wizard' (de a una) | 'scroll' (todas visibles)
let currentTernaStep = 1;  // terna activa en modo wizard (1–10)
let userHasCompleted = false; // true cuando el usuario ya envió sus datos al menos una vez

document.addEventListener('DOMContentLoaded', () => {
    initLoginSystem();
    populateActorDropdowns();
    initWizardNavigation();
    initGuestForm();
    initAdminModal();
    initAdminTabs();
    initAdminActions();
    initCountdown();
    renderTimelineFromStorage();
});

// ----------------------------------------------------------
// 1. SISTEMA DE LOGIN INICIAL (CLAVE 0000 / OMAR 1111)
// ----------------------------------------------------------
function initLoginSystem() {
    const userSelect = document.getElementById('login-user-select');
    const loginForm = document.getElementById('initial-login-form');
    const loginError = document.getElementById('initial-login-error');
    const btnLogoutApp = document.getElementById('btn-logout-app');

    // Poblar desplegable de login (incluye usuarios custom del DB)
    function refreshLoginDropdown() {
        userSelect.innerHTML = '<option value="" disabled selected>Selecciona quién eres...</option>';
        getActiveUserList().forEach(user => {
            const opt = document.createElement('option');
            opt.value = user;
            opt.textContent = user;
            userSelect.appendChild(opt);
        });
    }
    refreshLoginDropdown();

    // Validar Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedUser = userSelect.value;
        const passwordInput = document.getElementById('login-password-input').value.trim();

        // Leer usuarios desde Firestore (con fallback a localStorage)
        const usersDB = await getUsuariosDB();
        const userRecord = usersDB.find(u => u.name === selectedUser);

        let isValid = false;
        let isAdmin = false;

        if (userRecord) {
            if (passwordInput === userRecord.clave) {
                isValid = true;
                isAdmin = userRecord.isAdmin || false;
            }
        } else {
            // Fallback: reglas originales
            const isOmar = selectedUser.includes("Omar") || selectedUser.includes("Director (Omar)");
            if (isOmar) {
                if (passwordInput === "1111") { isValid = true; isAdmin = true; }
            } else {
                if (passwordInput === "0000") { isValid = true; }
            }
        }

        if (isValid) {
            loginError.style.display = 'none';
            loggedUser = { name: selectedUser, isAdmin: isAdmin };
            sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(loggedUser));
            applyUserSession(loggedUser);
        } else {
            loginError.style.display = 'block';
            loginError.innerText = '❌ Clave incorrecta. Verificá tu clave de acceso e intentá nuevamente.';
        }
    });

    // Logout
    btnLogoutApp.addEventListener('click', () => {
        if (confirm('¿Deseas cerrar la sesión actual?')) {
            sessionStorage.removeItem(SESSION_USER_KEY);
            loggedUser = null;
            // Limpiar formulario para que no queden datos del usuario anterior
            const surveyForm = document.getElementById('wrap-survey-form');
            if (surveyForm) surveyForm.reset();
            populateActorDropdowns();
            document.getElementById('main-app-container').style.display = 'none';
            document.getElementById('initial-login-screen').style.display = 'flex';
            document.getElementById('initial-login-form').reset();
            document.getElementById('login-password-input').value = '';
            goToStep(0);
        }
    });

    // Revisar si ya había una sesión activa en la pestaña
    const savedSession = sessionStorage.getItem(SESSION_USER_KEY);
    if (savedSession) {
        try {
            loggedUser = JSON.parse(savedSession);
            applyUserSession(loggedUser);
        } catch(err) {
            sessionStorage.removeItem(SESSION_USER_KEY);
        }
    }
}

async function applyUserSession(user) {
    document.getElementById('initial-login-screen').style.display = 'none';
    document.getElementById('main-app-container').style.display = 'block';

    document.getElementById('header-user-name').innerText = user.name;
    document.getElementById('welcome-user-display').innerText = user.name;

    const adminBadge = document.getElementById('header-admin-badge');
    const btnAdminNav = document.getElementById('btn-open-admin-modal');

    if (user.isAdmin) {
        adminBadge.style.display = 'inline-block';
        btnAdminNav.style.display = 'inline-block';
        maxAllowedStep = 5;
        userHasCompleted = true;
        document.getElementById('main-nav').style.display = 'flex';
        document.getElementById('timeline-section').style.display = 'block';
        setTernasMode('scroll');
        setNavMode('site');
        updateNavLockState();
        initPersonajesPage();
        goToStep(0);
        return;
    }

    adminBadge.style.display = 'none';
    btnAdminNav.style.display = 'none';

    const existing = await fbGetResponse(user.name)
        || getStoredData().find(d => d.guestName === user.name); // fallback local

    const heroStartBtn = document.getElementById('btn-hero-start');

    if (existing) {
        const editCount = existing.editCount || 0;
        userHasCompleted = true;

        if (heroStartBtn) heroStartBtn.style.display = 'none';

        prefillFormWithExisting(existing);
        initPersonajesPage();

        if (editCount >= MAX_EDITS) {
            maxAllowedStep = 5;
            document.getElementById('main-nav').style.display = 'flex';
            document.getElementById('timeline-section').style.display = 'block';
            setTernasMode('scroll');
            setNavMode('site');
            updateNavLockState();
            goToStep(0);
            document.getElementById('max-changes-modal').classList.add('active');
        } else {
            maxAllowedStep = 5;
            document.getElementById('main-nav').style.display = 'flex';
            document.getElementById('timeline-section').style.display = 'block';
            setTernasMode('scroll');
            setNavMode('site');
            updateNavLockState();
            goToStep(0);
            showPreviousDataModal(existing, editCount);
        }
        // Mostrar modal de fecha si nunca votó (usuario que ya completó el wizard)
        maybeShowFechaVoteModal(user, existing);
    } else {
        // Usuario nuevo — limpiar cualquier dato previo del formulario
        const surveyForm = document.getElementById('wrap-survey-form');
        if (surveyForm) surveyForm.reset();
        populateActorDropdowns();
        if (heroStartBtn) heroStartBtn.style.display = '';
        userHasCompleted = false;
        maxAllowedStep = 0;
        currentTernaStep = 1;
        document.getElementById('main-nav').style.display = 'none';
        document.getElementById('timeline-section').style.display = 'none';
        setTernasMode('wizard');
        setNavMode('wizard');
        updateNavLockState();
        goToStep(0);
        // Mostrar modal de fecha para usuario nuevo que nunca votó
        maybeShowFechaVoteModal(user, null);
    }
}

// Alterna qué pestañas del nav son visibles
// mode='wizard' → muestra pestañas 1-4 del form; mode='site' → muestra Personajes + Cambiar Datos
function setNavMode(mode) {
    document.querySelectorAll('.wizard-only-btn').forEach(btn => {
        btn.style.display = mode === 'wizard' ? '' : 'none';
    });
    document.querySelectorAll('.site-only-btn').forEach(btn => {
        btn.style.display = mode === 'site' ? '' : 'none';
    });
    // Ocultar la barra de progreso del wizard cuando ya completó
    const progressBar = document.querySelector('.wizard-progress-container');
    if (progressBar) progressBar.style.display = mode === 'wizard' ? 'flex' : 'none';
}

// Actualiza visualmente qué botones del nav están habilitados
function updateNavLockState() {
    document.querySelectorAll('.nav-tab-btn[data-step]').forEach(btn => {
        const step    = parseInt(btn.getAttribute('data-step'), 10);
        const isAdmin = loggedUser && loggedUser.isAdmin;
        // Los botones site-only (Personajes, Cambiar Votación) siempre desbloqueados
        // cuando el usuario ya completó (están visibles solo en modo site)
        const isSiteOnly = btn.classList.contains('site-only-btn');
        if (isAdmin || isSiteOnly || step <= maxAllowedStep) {
            btn.classList.add('unlocked');
        } else {
            btn.classList.remove('unlocked');
        }
    });
}

// Muestra el modal con los datos cargados previamente
function showPreviousDataModal(existing, editCount) {
    const remaining = MAX_EDITS - editCount;
    const infoEl = document.getElementById('prev-data-changes-info');
    const summaryEl = document.getElementById('prev-data-summary');

    infoEl.innerHTML = `Realizaste <strong>${editCount}</strong> de <strong>${MAX_EDITS}</strong> cambios permitidos.
        Te quedan <strong class="highlight-gold">${remaining} cambio${remaining !== 1 ? 's' : ''}</strong>.`;

    // Resumen de lo que cargó
    summaryEl.innerHTML = `
        <div class="prev-row"><span class="prev-label">🗯️ Descargo:</span><span class="prev-val">${escapeHTML(existing.descargo || '-')}</span></div>
        <div class="prev-row"><span class="prev-label">💖 Gratitud:</span><span class="prev-val">${escapeHTML(existing.gratitud || '-')}</span></div>
        <div class="prev-row"><span class="prev-label">🎬 Películas:</span><span class="prev-val">${escapeHTML(existing.favMovies || '-')}</span></div>
        <div class="prev-row"><span class="prev-label">🎶 Música:</span><span class="prev-val">${escapeHTML(existing.favMusic || '-')}</span></div>
    `;

    const modal = document.getElementById('previous-data-modal');
    modal.classList.add('active');

    document.getElementById('btn-prev-keep').onclick = () => {
        modal.classList.remove('active');
        // Se queda en el inicio con todo desbloqueado
    };

    document.getElementById('btn-prev-edit').onclick = () => {
        modal.classList.remove('active');
        // Pre-rellena el formulario con los datos previos
        prefillFormWithExisting(existing);
        goToStep(1);
    };
}

// Pre-rellena los campos del wizard con los datos guardados
function prefillFormWithExisting(data) {
    // Paso 1: Color y Asistencia
    if (data.colorEvento) {
        const colorRadio = document.querySelector(`input[name="colorEvento"][value="${data.colorEvento}"]`);
        if (colorRadio) colorRadio.checked = true;
    }
    if (data.asistencia) {
        const asistRadio = document.querySelector(`input[name="asistencia"][value="${data.asistencia}"]`);
        if (asistRadio) { asistRadio.checked = true; toggleAcompaniantes(); }
    }
    const cant = document.getElementById('cant-acompaniantes');
    const noms = document.getElementById('nombres-acompaniantes');
    if (cant) cant.value = data.cantAcompaniantes || '';
    if (noms) noms.value = data.nombresAcompaniantes || '';

    // Paso 2: Descargos
    const descargo = document.getElementById('descargo-text');
    const gratitud = document.getElementById('gratitud-text');
    if (descargo) descargo.value = data.descargo || '';
    if (gratitud) gratitud.value = data.gratitud || '';

    // Ternas 1-9 (selects)
    for (let i = 1; i <= 9; i++) {
        const v1 = document.querySelector(`select[name="terna${i}_voto1"]`);
        const v2 = document.querySelector(`select[name="terna${i}_voto2"]`);
        if (v1) v1.value = data[`terna${i}_voto1`] || '';
        if (v2) v2.value = data[`terna${i}_voto2`] || '';
    }
    // Terna 10
    const t10 = document.getElementById('terna-10');
    if (t10) t10.value = data.terna10 || '';
    // Terna 11 Platino
    const p1 = document.querySelector('select[name="terna11_voto1"]');
    const p2 = document.querySelector('select[name="terna11_voto2"]');
    if (p1) p1.value = data.terna11_voto1 || '';
    if (p2) p2.value = data.terna11_voto2 || '';

    // Paso 3 - Cultura
    const movies   = document.getElementById('fav-movies');
    const actors   = document.getElementById('fav-actors');
    const paintings = document.getElementById('fav-paintings');
    const music    = document.getElementById('fav-music');
    if (movies)    movies.value    = data.favMovies    || '';
    if (actors)    actors.value    = data.favActors    || '';
    if (paintings) paintings.value = data.favPaintings || '';
    if (music)     music.value     = data.favMusic     || '';
}

// ----------------------------------------------------------
// 2. POBLAR SELECTORES DESPLEGABLES CON LA LISTA OFICIAL
// ----------------------------------------------------------
function populateActorDropdowns() {
    const selects = document.querySelectorAll('.actor-select');
    selects.forEach(select => {
        select.innerHTML = '<option value="" disabled selected>Selecciona una persona...</option>';
        getActiveUserList().forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            select.appendChild(opt);
        });
    });
}

// ----------------------------------------------------------
// 3. NAVEGACIÓN ENTRE PÁGINAS (WIZARD SPA)
// ----------------------------------------------------------
// maxAllowedStep: el paso más alto al que el usuario ha llegado (controla el bloqueo)
let maxAllowedStep = 0;

function goToStep(stepIndex) {
    // Paso 6 = Personajes: re-renderizar siempre al entrar
    if (stepIndex === 6) {
        initPersonajesPage();
    }
    // Paso 7 = Cambiar Votación: lógica especial
    if (stepIndex === 7) {
        renderCambiarDatosPage();
    }

    // Páginas válidas: 0-7
    if (stepIndex < 0 || stepIndex > 7) return;

    // Bloqueo wizard: no saltar pasos no desbloqueados (solo aplica a pasos 1-5)
    const isAdmin = loggedUser && loggedUser.isAdmin;
    if (!isAdmin && stepIndex >= 1 && stepIndex <= 5 && stepIndex > maxAllowedStep) return;

    // Mostrar la página activa (pages 0-6 en orden en el DOM)
    document.querySelectorAll('.wizard-page').forEach((page, idx) => {
        page.classList.toggle('active', idx === stepIndex);
    });

    // Actualizar activo en los botones del nav (por data-step)
    document.querySelectorAll('.nav-tab-btn[data-step]').forEach(btn => {
        const s = parseInt(btn.getAttribute('data-step'), 10);
        btn.classList.toggle('active', s === stepIndex);
    });

    // Indicadores de progreso del wizard (solo relevantes en modo wizard)
    document.querySelectorAll('.wizard-step-indicator').forEach((ind, idx) => {
        ind.classList.toggle('active', idx === stepIndex);
        ind.classList.toggle('completed', idx < stepIndex);
    });

    currentStep = stepIndex;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Llamar cuando el usuario avanza al siguiente paso para desbloquearlo
function unlockNextStep(nextStep) {
    if (nextStep > maxAllowedStep) {
        maxAllowedStep = nextStep;
    }
    updateNavLockState();
    goToStep(nextStep);
}

// Valida campos del paso actual antes de avanzar
function validateAndNext(currentPage) {
    const errorEl = document.getElementById(`step${currentPage}-error`)
                 || document.getElementById(`step${currentPage}-descargo-error`)
                 || document.getElementById(`step${currentPage}b-error`);
    const missing = [];

    if (currentPage === 1) {
        // Paso 1: Color y Asistencia
        const color = document.querySelector('input[name="colorEvento"]:checked');
        const asist = document.querySelector('input[name="asistencia"]:checked');
        if (!color) missing.push('Color representativo');
        if (!asist) missing.push('Tipo de asistencia (Solo/a o Acompañado/a)');
        if (asist && asist.value === 'ACOMPAÑADO') {
            const cant = document.getElementById('cant-acompaniantes');
            const noms = document.getElementById('nombres-acompaniantes');
            if (!cant || !cant.value || parseInt(cant.value) < 1) missing.push('Cantidad de acompañantes');
            if (!noms || !noms.value.trim()) missing.push('Nombres de los acompañantes');
        }
    }

    if (currentPage === 2) {
        // Paso 2: Descargos y Gratitud
        const descargo = document.getElementById('descargo-text');
        const gratitud = document.getElementById('gratitud-text');
        if (!descargo || !descargo.value.trim()) missing.push('Descargos');
        if (!gratitud || !gratitud.value.trim()) missing.push('Gratitud');
    }

    if (currentPage === 3) {
        // Paso 3: Ternas 1-9 (voto1 y voto2) + Terna 10 + Terna 11 Platino
        for (let i = 1; i <= 9; i++) {
            const v1 = document.querySelector(`select[name="terna${i}_voto1"]`);
            const v2 = document.querySelector(`select[name="terna${i}_voto2"]`);
            if (!v1 || !v1.value) missing.push(`Terna ${i} — 1er nominado`);
            if (!v2 || !v2.value) missing.push(`Terna ${i} — 2do nominado`);
        }
        const t10 = document.getElementById('terna-10');
        if (!t10 || !t10.value.trim()) missing.push('Terna 10 — Mejor momento');
        // Terna 11 Platino
        const p1 = document.querySelector('select[name="terna11_voto1"]');
        const p2 = document.querySelector('select[name="terna11_voto2"]');
        if (!p1 || !p1.value) missing.push('✨ Prod1g0 de Platino — 1er nominado');
        if (!p2 || !p2.value) missing.push('✨ Prod1g0 de Platino — 2do nominado');
    }

    if (currentPage === 4) {
        // Paso 4: Gustos Culturales
        const fields = [
            { id: 'fav-movies',    label: 'Películas favoritas' },
            { id: 'fav-actors',    label: 'Actores/Actrices favoritos' },
            { id: 'fav-paintings', label: 'Cuadros / Arte favorito' },
            { id: 'fav-music',     label: 'Música para el baile' },
        ];
        fields.forEach(f => {
            const el = document.getElementById(f.id);
            if (!el || !el.value.trim()) missing.push(f.label);
        });
    }

    if (missing.length > 0) {
        const errTarget = document.getElementById('step' + currentPage + '-error')
                       || document.getElementById('step' + currentPage + '-descargo-error')
                       || document.getElementById('step' + currentPage + 'b-error');
        if (errTarget) {
            errTarget.style.display = 'block';
            errTarget.innerHTML = `⚠️ Completá los siguientes campos antes de continuar:<br>
                <ul>${missing.map(m => `<li>${m}</li>`).join('')}</ul>`;
            errTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    if (errorEl) errorEl.style.display = 'none';
    unlockNextStep(currentPage + 1);
}

// Muestra/oculta los campos de acompañantes según la elección de asistencia
function toggleAcompaniantes() {
    const asist = document.querySelector('input[name="asistencia"]:checked');
    const fields = document.getElementById('acompaniantes-fields');
    const soloCard  = document.getElementById('asist-solo-card');
    const acompCard = document.getElementById('asist-acomp-card');
    if (!fields) return;
    const isAcomp = asist && asist.value === 'ACOMPAÑADO';
    fields.style.display = isAcomp ? 'block' : 'none';
    if (soloCard)  soloCard.classList.toggle('asistencia-selected',  !isAcomp && asist);
    if (acompCard) acompCard.classList.toggle('asistencia-selected', isAcomp);
}

function initWizardNavigation() {
    // Nav superior: solo navega si el paso está desbloqueado (o es admin)
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const step      = parseInt(btn.getAttribute('data-step'), 10);
            const isAdmin   = loggedUser && loggedUser.isAdmin;
            const isSiteOnly = btn.classList.contains('site-only-btn');
            if (isAdmin || isSiteOnly || step <= maxAllowedStep) {
                goToStep(step);
            }
        });
    });

    // Indicadores de progreso: solo navegables si están desbloqueados
    document.querySelectorAll('.wizard-step-indicator').forEach(ind => {
        ind.addEventListener('click', () => {
            const step = parseInt(ind.getAttribute('data-step-target'), 10);
            const isAdmin = loggedUser && loggedUser.isAdmin;
            if (isAdmin || step <= maxAllowedStep) {
                goToStep(step);
            }
        });
    });
}

// ----------------------------------------------------------
// 4. ENVÍO DEL FORMULARIO DE INVITADOS
// ----------------------------------------------------------
function initGuestForm() {
    const form = document.getElementById('wrap-survey-form');
    const successModal = document.getElementById('success-modal');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('[SUBMIT] Inicio del envío');

        try {

        // Verificar en tiempo real si el usuario ya alcanzó el límite de cambios
        if (loggedUser && !loggedUser.isAdmin) {
            const liveData = await fbGetResponse(loggedUser.name)
                || getStoredData().find(d => d.guestName === loggedUser.name);
            if (liveData && (liveData.editCount || 0) >= MAX_EDITS) {
                document.getElementById('max-changes-modal').classList.add('active');
                return;
            }
        }

        const formData = new FormData(form);
        const confirmGiftChecked = document.getElementById('confirm-gift').checked;

        if (!confirmGiftChecked) {
            alert('Debes confirmar que llevarás tu regalo absurdo para enviar el formulario.');
            return;
        }

        const asistenciaVal = formData.get('asistencia') || '';
        const cantAcomp     = parseInt(formData.get('cantAcompaniantes') || '0', 10) || 0;
        const nombresRaw    = (formData.get('nombresAcompaniantes') || '').trim();

        // Asignación balanceada de colores a acompañantes
        const COLORS = ['ROJO', 'AMARILLO', 'VERDE'];
        function assignBalancedColors(numCompanions, nombresTexto) {
            if (numCompanions === 0) return [];
            const allData = getStoredData();
            const counts  = { ROJO: 0, AMARILLO: 0, VERDE: 0 };
            allData.forEach(item => {
                if (item.colorEvento && counts[item.colorEvento] !== undefined) counts[item.colorEvento]++;
                if (Array.isArray(item.coloresAcompaniantes)) {
                    item.coloresAcompaniantes.forEach(ac => {
                        if (ac.color && counts[ac.color] !== undefined) counts[ac.color]++;
                    });
                }
            });
            const nombres = nombresTexto.split(',').map(s => s.trim()).filter(Boolean);
            const result  = [];
            for (let i = 0; i < numCompanions; i++) {
                const chosen = COLORS.reduce((a, b) => counts[a] <= counts[b] ? a : b);
                counts[chosen]++;
                result.push({ nombre: nombres[i] || `Acompañante ${i + 1}`, color: chosen });
            }
            return result;
        }

        const coloresAcompaniantes = asistenciaVal === 'ACOMPAÑADO'
            ? assignBalancedColors(cantAcomp, nombresRaw)
            : [];

        const g = (field) => (formData.get(field) || '').trim();

        const newEntry = {
            id: 'resp_' + Date.now(),
            timestamp: new Date().toLocaleString(),
            guestName: loggedUser ? loggedUser.name : 'Invitado',
            confirmGift: 'Sí',

            colorEvento:           formData.get('colorEvento') || '',
            asistencia:            asistenciaVal,
            cantAcompaniantes:     cantAcomp || '',
            nombresAcompaniantes:  nombresRaw,
            coloresAcompaniantes:  coloresAcompaniantes,

            descargo: g('descargo'),
            gratitud: g('gratitud'),

            terna1_voto1: formData.get('terna1_voto1') || '',
            terna1_voto2: formData.get('terna1_voto2') || '',
            terna2_voto1: formData.get('terna2_voto1') || '',
            terna2_voto2: formData.get('terna2_voto2') || '',
            terna3_voto1: formData.get('terna3_voto1') || '',
            terna3_voto2: formData.get('terna3_voto2') || '',
            terna4_voto1: formData.get('terna4_voto1') || '',
            terna4_voto2: formData.get('terna4_voto2') || '',
            terna5_voto1: formData.get('terna5_voto1') || '',
            terna5_voto2: formData.get('terna5_voto2') || '',
            terna6_voto1: formData.get('terna6_voto1') || '',
            terna6_voto2: formData.get('terna6_voto2') || '',
            terna7_voto1: formData.get('terna7_voto1') || '',
            terna7_voto2: formData.get('terna7_voto2') || '',
            terna8_voto1: formData.get('terna8_voto1') || '',
            terna8_voto2: formData.get('terna8_voto2') || '',
            terna9_voto1: formData.get('terna9_voto1') || '',
            terna9_voto2: formData.get('terna9_voto2') || '',
            terna10: g('terna10'),
            terna11_voto1: formData.get('terna11_voto1') || '',
            terna11_voto2: formData.get('terna11_voto2') || '',

            favMovies:    g('favMovies'),
            favActors:    g('favActors'),
            favPaintings: g('favPaintings'),
            favMusic:     g('favMusic')
        };

        console.log('[SUBMIT] newEntry armado para:', newEntry.guestName);

        const prev = await fbGetResponse(newEntry.guestName)
            || getStoredData().find(d => d.guestName === newEntry.guestName);

        if (prev) {
            newEntry.editCount = (prev.editCount || 0) + 1;
            const asistCambia = (prev.colorEvento         !== newEntry.colorEvento)    ||
                                 (prev.asistencia           !== newEntry.asistencia)     ||
                                 (prev.cantAcompaniantes    !== String(newEntry.cantAcompaniantes)) ||
                                 (prev.nombresAcompaniantes !== newEntry.nombresAcompaniantes);
            newEntry.editCountAsistencia = (prev.editCountAsistencia || 0) + (asistCambia ? 1 : 0);
        } else {
            newEntry.editCount           = 1;
            newEntry.editCountAsistencia = 1;
        }

        console.log('[SUBMIT] Llamando fbSaveResponse...');
        const fbOk = await fbSaveResponse(newEntry);
        console.log('[SUBMIT] fbSaveResponse resultado:', fbOk);

        const data = getStoredData().filter(d => d.guestName !== newEntry.guestName);
        data.unshift(newEntry);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        // Mostrar Modal de éxito con info de cambios restantes (votación)
        const remaining = MAX_EDITS - newEntry.editCount;
        const remAsist  = MAX_EDITS_ASIST - (newEntry.editCountAsistencia || 0);
        const modalP = document.querySelector('#success-modal .modal-content p:first-of-type');
        if (modalP && remaining > 0) {
            modalP.innerHTML = `Tus datos quedaron guardados en producción de <strong>"Prod1g0 2026"</strong>.<br>
                <small style="color:var(--text-muted);">Podés modificar tu votación hasta ${remaining} vez${remaining !== 1 ? 'es' : ''} más
                · Asistencia hasta ${Math.max(0,remAsist)} vez${remAsist !== 1 ? 'es' : ''} más.</small>`;
        } else if (modalP && remaining <= 0) {
            modalP.innerHTML = `Tus datos quedaron guardados en producción de <strong>"Prod1g0 2026"</strong>.<br>
                <small style="color:#f87171;">🔒 Alcanzaste el límite de cambios de votación.</small>`;
        }

        successModal.classList.add('active');

        } catch(submitErr) {
            console.error('[SUBMIT] ERROR INESPERADO:', submitErr);
            alert('Ocurrió un error al guardar. Abrí la consola (F12) y avisá el mensaje de error:\n\n' + submitErr.message);
        }
    });
}

async function resetWizardAndCloseModal() {
    const successModal = document.getElementById('success-modal');
    successModal.classList.remove('active');
    document.getElementById('wrap-survey-form').reset();
    populateActorDropdowns();

    maxAllowedStep = 5;
    userHasCompleted = true;

    // Ocultar el botón de inicio una vez que el usuario envió sus datos
    const heroStartBtn = document.getElementById('btn-hero-start');
    if (heroStartBtn) heroStartBtn.style.display = 'none';

    if (loggedUser && !loggedUser.isAdmin) {
        document.getElementById('main-nav').style.display = 'flex';
        document.getElementById('timeline-section').style.display = 'block';
        setNavMode('site');
        initPersonajesPage();
    }

    if (loggedUser) refreshSessionState();
    goToStep(0);

    // Mostrar modal de fecha si nunca votó (usuario que acaba de completar el wizard)
    if (loggedUser && !loggedUser.isAdmin) {
        const freshResponse = await fbGetResponse(loggedUser.name)
            || getStoredData().find(d => d.guestName === loggedUser.name);
        maybeShowFechaVoteModal(loggedUser, freshResponse || null);
    }
}

// Refresca el estado de la sesión activa (contador de intentos, bloqueo, pre-relleno)
// sin volver a mostrar la pantalla de login. Se llama después de cada envío.
async function refreshSessionState() {
    if (!loggedUser || loggedUser.isAdmin) return;
    const existing = await fbGetResponse(loggedUser.name)
        || getStoredData().find(d => d.guestName === loggedUser.name);
    if (!existing) return;

    const editCount = existing.editCount || 0;

    if (editCount >= MAX_EDITS) {
        // Llegó al límite: bloquear re-edición
        document.getElementById('main-nav').style.display = 'flex';
        document.getElementById('timeline-section').style.display = 'block';
        setTernasMode('scroll');
        maxAllowedStep = 4;
        updateNavLockState();
        // Interceptar cualquier intento de ir al formulario
        sessionStorage.setItem('prodigo_locked_' + loggedUser.name, '1');
    } else {
        // Aún puede editar: actualizar pre-relleno con los datos recién guardados
        prefillFormWithExisting(existing);
        sessionStorage.removeItem('prodigo_locked_' + loggedUser.name);
    }
}

// ----------------------------------------------------------
// HELPERS DE NOMBRE DE ARCHIVO
// ----------------------------------------------------------
function safeFileName(guestName) {
    return (guestName || 'invitado')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_\- ]/g, '')
        .trim()
        .replace(/\s+/g, '_');
}

// ----------------------------------------------------------
// CUENTA REGRESIVA — condicional según config de admin
// ----------------------------------------------------------
let _countdownInterval = null;

function startCountdownDisplay(targetDateStr) {
    if (_countdownInterval) clearInterval(_countdownInterval);
    const TARGET_DATE = new Date(targetDateStr);

    function formatUnit(n) { return String(n).padStart(2, '0'); }

    function buildCountdownHTML(diff) {
        if (diff <= 0) return `<span class="cd-label">🎉 ¡HOY ES LA FIESTA!</span>`;
        const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const label   = TARGET_DATE.toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric' }).toUpperCase();
        return `
            <span class="cd-label">🎬 ${label} — ${String(TARGET_DATE.getHours()).padStart(2,'0')}:${String(TARGET_DATE.getMinutes()).padStart(2,'0')} HS</span>
            <span class="cd-units">
                <span class="cd-block"><span class="cd-num">${formatUnit(days)}</span><span class="cd-sub">días</span></span>
                <span class="cd-sep">:</span>
                <span class="cd-block"><span class="cd-num">${formatUnit(hours)}</span><span class="cd-sub">hs</span></span>
                <span class="cd-sep">:</span>
                <span class="cd-block"><span class="cd-num">${formatUnit(minutes)}</span><span class="cd-sub">min</span></span>
                <span class="cd-sep">:</span>
                <span class="cd-block"><span class="cd-num">${formatUnit(seconds)}</span><span class="cd-sub">seg</span></span>
            </span>
        `;
    }

    function tick() {
        const html = buildCountdownHTML(TARGET_DATE - new Date());
        const headerEl = document.getElementById('header-countdown');
        const bannerEl = document.getElementById('main-countdown-banner');
        if (headerEl) headerEl.innerHTML = html;
        if (bannerEl) bannerEl.innerHTML = html;
    }
    tick();
    _countdownInterval = setInterval(tick, 1000);
}

function stopCountdownDisplay() {
    if (_countdownInterval) { clearInterval(_countdownInterval); _countdownInterval = null; }
    const headerEl = document.getElementById('header-countdown');
    const bannerEl = document.getElementById('main-countdown-banner');
    if (headerEl) { headerEl.innerHTML = ''; headerEl.style.display = 'none'; }
    if (bannerEl) { bannerEl.innerHTML = ''; bannerEl.style.display = 'none'; }
}

// Actualiza fecha y hora en la claqueta de la página de inicio
function updateClapperFecha(countdownDate, countdownFechaLabel) {
    const fechaEl = document.getElementById('clapper-fecha');
    const horaEl  = document.getElementById('clapper-hora');
    if (!fechaEl || !horaEl) return;

    // Si hay una fecha label (ej: "31/10/2026") usarla directamente
    if (countdownFechaLabel) {
        fechaEl.textContent = countdownFechaLabel.toUpperCase();
    } else if (countdownDate) {
        // Parsear desde el ISO datetime-local (ej: "2026-10-31T21:00")
        const d = new Date(countdownDate);
        if (!isNaN(d)) {
            fechaEl.textContent = d.toLocaleDateString('es-AR', {
                day: '2-digit', month: 'short', year: 'numeric'
            }).toUpperCase();
        } else {
            fechaEl.textContent = 'A CONFIRMAR';
        }
    } else {
        fechaEl.textContent = 'A CONFIRMAR';
    }

    // Hora
    if (countdownDate) {
        const d = new Date(countdownDate);
        if (!isNaN(d)) {
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            horaEl.textContent = `${hh}:${mm} HS`;
        } else {
            horaEl.textContent = 'A CONFIRMAR';
        }
    } else {
        horaEl.textContent = 'A CONFIRMAR';
    }
}

async function initCountdown() {
    const settings = await fbGetSettings();
    if (settings && settings.countdownEnabled && settings.countdownDate) {
        const headerEl = document.getElementById('header-countdown');
        const bannerEl = document.getElementById('main-countdown-banner');
        if (headerEl) headerEl.style.display = '';
        if (bannerEl) bannerEl.style.display = '';
        startCountdownDisplay(settings.countdownDate);
    } else {
        stopCountdownDisplay();
    }
    // Siempre actualizar la claqueta con la fecha configurada (aunque el countdown esté off)
    if (settings) updateClapperFecha(settings.countdownDate || '', settings.countdownFechaLabel || '');
}

// ----------------------------------------------------------
// VOTACIÓN DE FECHA DEL EVENTO
// ----------------------------------------------------------
const MAX_FECHA_EDITS = 3; // máximo de veces que puede cambiar su voto de fecha
const DEFAULT_FECHAS  = ['10/10/2026', '17/10/2026', '31/10/2026'];

// Muestra el modal de votación de fecha si corresponde
async function maybeShowFechaVoteModal(user, existingResponse) {
    const settings = await fbGetSettings();

    // Si la votación fue explícitamente deshabilitada por el admin, no mostrar
    if (settings && settings.fechaVoteEnabled === false) return;

    // Si ya votó alguna vez, no mostrar automáticamente al entrar
    const yaVoto = existingResponse && Array.isArray(existingResponse.fechasVotadas) && existingResponse.fechasVotadas.length > 0;
    if (yaVoto) return;

    // Mostrar con las fechas configuradas (o las por defecto si no hay config)
    const fechasDisponibles = (settings && settings.fechasOpciones && settings.fechasOpciones.length > 0)
        ? settings.fechasOpciones
        : DEFAULT_FECHAS;

    openFechaVoteModal(fechasDisponibles, existingResponse, user);
}

function openFechaVoteModal(fechasDisponibles, existingResponse, user) {
    const modal    = document.getElementById('fecha-vote-modal');
    const optsDiv  = document.getElementById('fecha-vote-opciones');
    const hintEl   = document.getElementById('fecha-vote-hint');
    const remEl    = document.getElementById('fecha-vote-remaining');
    const confirmBtn = document.getElementById('btn-fecha-vote-confirm');

    const yaVotadas = existingResponse && Array.isArray(existingResponse.fechasVotadas)
        ? existingResponse.fechasVotadas : [];
    const fechaVotoCount = existingResponse ? (existingResponse.fechaVotoCount || 0) : 0;
    const remaining = Math.max(0, MAX_FECHA_EDITS - fechaVotoCount);

    // Renderizar opciones
    optsDiv.innerHTML = '';
    fechasDisponibles.forEach(fecha => {
        const label = document.createElement('label');
        label.className = 'fecha-vote-option' + (yaVotadas.includes(fecha) ? ' selected' : '');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = fecha;
        cb.checked = yaVotadas.includes(fecha);
        cb.addEventListener('change', () => {
            label.classList.toggle('selected', cb.checked);
            hintEl.style.display = 'none';
        });
        const txt = document.createElement('span');
        txt.className = 'fecha-vote-option-text';
        txt.textContent = '📅 ' + fecha;
        label.appendChild(cb);
        label.appendChild(txt);
        // Click en el label completo
        label.addEventListener('click', (e) => {
            if (e.target !== cb) {
                cb.checked = !cb.checked;
                label.classList.toggle('selected', cb.checked);
                hintEl.style.display = 'none';
            }
        });
        optsDiv.appendChild(label);
    });

    remEl.textContent = remaining > 0
        ? `Podés cambiar tu elección ${remaining} vez${remaining !== 1 ? 'ces' : ''} más.`
        : 'No tenés más cambios disponibles para la votación de fecha.';

    hintEl.style.display = 'none';

    // Si no quedan cambios, deshabilitar
    if (remaining <= 0) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = '🔒 Sin cambios disponibles';
    } else {
        confirmBtn.disabled = false;
        confirmBtn.textContent = '✅ Confirmar mi elección';
    }

    // Guardar referencia al handler anterior para poder removerlo
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', async () => {
        const seleccionadas = Array.from(optsDiv.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        if (seleccionadas.length === 0) {
            hintEl.style.display = 'block';
            return;
        }
        // Guardar en Firestore dentro del response del usuario
        const updatedCount = fechaVotoCount + 1;
        const updatedResponse = {
            ...(existingResponse || { guestName: user.name, timestamp: new Date().toISOString() }),
            fechasVotadas: seleccionadas,
            fechaVotoCount: updatedCount
        };
        await fbSaveResponse(updatedResponse);

        // Actualizar localStorage
        const allLocal = getStoredData();
        const idx = allLocal.findIndex(d => d.guestName === user.name);
        if (idx >= 0) { allLocal[idx] = { ...allLocal[idx], fechasVotadas: seleccionadas, fechaVotoCount: updatedCount }; }
        else { allLocal.push(updatedResponse); }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allLocal));

        modal.classList.remove('active');
    });

    modal.classList.add('active');
}

// Abre el modal de cambio de fecha desde el paso 7 (Cambiar Votación)
async function abrirCambioFechaVoto() {
    if (!loggedUser) return;
    const settings = await fbGetSettings();
    if (!settings || !settings.fechaVoteEnabled) {
        alert('La votación de fechas no está habilitada en este momento.');
        return;
    }
    const existing = await fbGetResponse(loggedUser.name)
        || getStoredData().find(d => d.guestName === loggedUser.name);
    const fechasDisponibles = (settings.fechasOpciones && settings.fechasOpciones.length > 0)
        ? settings.fechasOpciones
        : DEFAULT_FECHAS;
    openFechaVoteModal(fechasDisponibles, existing, loggedUser);
}

// ----------------------------------------------------------
// PANEL ADMIN — CONFIGURACIÓN DE FECHAS
// ----------------------------------------------------------
async function renderAdminFechas(allData) {
    const settings = await fbGetSettings() || {};

    // Toggles
    const toggleVote = document.getElementById('toggle-fecha-vote-enabled');
    const toggleCD   = document.getElementById('toggle-countdown-enabled');
    const cdInput    = document.getElementById('admin-countdown-date-input');
    if (toggleVote) toggleVote.checked = !!settings.fechaVoteEnabled;
    if (toggleCD)   toggleCD.checked   = !!settings.countdownEnabled;
    if (cdInput && settings.countdownDate) {
        // datetime-local espera formato YYYY-MM-DDTHH:MM
        cdInput.value = settings.countdownDate.slice(0, 16);
    }

    // Lista de fechas configuradas
    const fechasList = document.getElementById('admin-fechas-list');
    if (fechasList) {
        const fechas = settings.fechasOpciones || DEFAULT_FECHAS;
        renderAdminFechasList(fechas);
    }

    // Toggle "usar fecha más votada"
    const toggleUsarVotada = document.getElementById('toggle-usar-fecha-votada');
    if (toggleUsarVotada) {
        toggleUsarVotada.checked = !!settings.usarFechaVotada;
        // Render del estado inicial
        if (settings.usarFechaVotada) renderFechaGanadoraInfo(allData, settings);
    }

    // Resultados de votación
    renderFechasResults(allData, settings);
}

function renderAdminFechasList(fechas) {
    const container = document.getElementById('admin-fechas-list');
    if (!container) return;
    if (fechas.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;">Sin fechas configuradas.</p>';
        return;
    }
    container.innerHTML = '';
    fechas.forEach((f, idx) => {
        const row = document.createElement('div');
        row.className = 'admin-fecha-item';
        row.innerHTML = `<span>📅 ${escapeHTML(f)}</span><button onclick="adminEliminarFecha(${idx})" title="Eliminar">🗑️</button>`;
        container.appendChild(row);
    });
}

async function adminAgregarFecha() {
    const input = document.getElementById('admin-nueva-fecha-input');
    if (!input || !input.value.trim()) return;
    const settings = await fbGetSettings() || {};
    const fechas = settings.fechasOpciones ? [...settings.fechasOpciones] : [...DEFAULT_FECHAS];
    const nueva = input.value.trim();
    if (fechas.includes(nueva)) { alert('Esa fecha ya está en la lista.'); return; }
    fechas.push(nueva);
    await fbSaveSettings({ ...settings, fechasOpciones: fechas });
    input.value = '';
    renderAdminFechasList(fechas);
}

async function adminEliminarFecha(idx) {
    const settings = await fbGetSettings() || {};
    const fechas = settings.fechasOpciones ? [...settings.fechasOpciones] : [...DEFAULT_FECHAS];
    if (fechas.length <= 1) { alert('Debe quedar al menos una fecha.'); return; }
    fechas.splice(idx, 1);
    await fbSaveSettings({ ...settings, fechasOpciones: fechas });
    renderAdminFechasList(fechas);
}

// Calcula la fecha más votada. Devuelve { ganadora, empate, candidatas }
function calcFechaGanadora(allData) {
    const counts = {};
    allData.forEach(item => {
        if (Array.isArray(item.fechasVotadas)) {
            item.fechasVotadas.forEach(f => { counts[f] = (counts[f] || 0) + 1; });
        }
    });
    if (Object.keys(counts).length === 0) return { ganadora: null, empate: false, candidatas: [] };
    const maxVotos = Math.max(...Object.values(counts));
    const candidatas = Object.entries(counts)
        .filter(([, v]) => v === maxVotos)
        .map(([f]) => f);
    return {
        ganadora: candidatas.length === 1 ? candidatas[0] : null,
        empate:   candidatas.length > 1,
        candidatas,
        maxVotos
    };
}

// Renderiza el info-box de fecha ganadora/empate en el admin
async function renderFechaGanadoraInfo(allData, settings) {
    const infoEl      = document.getElementById('fecha-ganadora-info');
    const manualWrap  = document.getElementById('fecha-manual-wrap');
    const manualSel   = document.getElementById('admin-fecha-ganadora-select');
    const cdWrap      = document.getElementById('admin-countdown-date-wrap');
    if (!infoEl) return;

    const usarVotada = document.getElementById('toggle-usar-fecha-votada')?.checked;

    if (!usarVotada) {
        infoEl.innerHTML = '';
        if (manualWrap) manualWrap.style.display = 'none';
        if (cdWrap) cdWrap.style.display = '';
        return;
    }

    const { ganadora, empate, candidatas } = calcFechaGanadora(allData);

    if (!ganadora && !empate) {
        infoEl.innerHTML = '<span style="color:var(--text-muted);">Sin votos de fecha todavía — ingresá la fecha manualmente.</span>';
        if (manualWrap) manualWrap.style.display = 'none';
        if (cdWrap) cdWrap.style.display = '';
        return;
    }

    if (empate) {
        infoEl.innerHTML = `<span style="color:#f59e0b;">⚠️ Empate entre ${candidatas.length} fechas (${candidatas.join(', ')}). Elegí manualmente cuál usar.</span>`;
        if (manualWrap) manualWrap.style.display = '';
        if (cdWrap) cdWrap.style.display = 'none';
        // Poblar el selector con las candidatas empatadas
        if (manualSel) {
            manualSel.innerHTML = candidatas.map(f => `<option value="${escapeHTML(f)}">${escapeHTML(f)}</option>`).join('');
            // Pre-seleccionar la que estaba guardada si aplica
            if (settings && settings.countdownFechaLabel && candidatas.includes(settings.countdownFechaLabel)) {
                manualSel.value = settings.countdownFechaLabel;
            }
        }
    } else {
        infoEl.innerHTML = `<span style="color:#4ade80;">✅ Fecha ganadora: <strong>${escapeHTML(ganadora)}</strong> — se usará para la cuenta regresiva.</span>`;
        if (manualWrap) manualWrap.style.display = 'none';
        if (cdWrap) cdWrap.style.display = 'none';
    }
}

// Handler del toggle "usar fecha más votada"
async function onToggleUsarFechaVotada() {
    const allData  = await fbGetAllResponses() || getStoredData();
    const settings = await fbGetSettings() || {};
    renderFechaGanadoraInfo(allData, settings);
    // Mostrar/ocultar el input manual de fecha
    const cdWrap = document.getElementById('admin-countdown-date-wrap');
    const usarVotada = document.getElementById('toggle-usar-fecha-votada')?.checked;
    if (cdWrap) cdWrap.style.display = usarVotada ? 'none' : '';
}

async function adminGuardarConfigFechas() {
    const toggleVote    = document.getElementById('toggle-fecha-vote-enabled');
    const toggleCD      = document.getElementById('toggle-countdown-enabled');
    const toggleVotada  = document.getElementById('toggle-usar-fecha-votada');
    const cdInput       = document.getElementById('admin-countdown-date-input');
    const manualSel     = document.getElementById('admin-fecha-ganadora-select');
    const settings      = await fbGetSettings() || {};
    const allData       = await fbGetAllResponses() || getStoredData();

    const usarVotada = toggleVotada ? toggleVotada.checked : !!settings.usarFechaVotada;

    // Determinar la fecha a usar para el countdown
    let countdownDate    = settings.countdownDate || '';
    let countdownFechaLabel = settings.countdownFechaLabel || '';

    if (usarVotada) {
        const { ganadora, empate, candidatas } = calcFechaGanadora(allData);
        if (empate) {
            // Admin eligió manualmente entre las empatadas
            const elegida = manualSel ? manualSel.value : candidatas[0];
            countdownFechaLabel = elegida;
            // No modificamos countdownDate — debe ingresarse manualmente
            // (la fecha de texto no tiene hora, el admin debe completar el datetime)
            if (cdInput && cdInput.value) countdownDate = cdInput.value;
            else {
                alert('⚠️ Hay un empate. Elegiste "' + elegida + '" pero también tenés que ingresar la fecha y hora exacta del evento en el campo de arriba.');
            }
        } else if (ganadora) {
            countdownFechaLabel = ganadora;
            // Intentar parsear la fecha ganadora como datetime (formato dd/mm/yyyy)
            const parts = ganadora.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (parts) {
                const iso = `${parts[3]}-${parts[2].padStart(2,'0')}-${parts[1].padStart(2,'0')}T21:00`;
                countdownDate = iso;
                if (cdInput) cdInput.value = iso;
            } else if (cdInput && cdInput.value) {
                countdownDate = cdInput.value;
            }
        } else {
            // Sin votos — usar el input manual
            if (cdInput && cdInput.value) countdownDate = cdInput.value;
        }
    } else {
        if (cdInput && cdInput.value) countdownDate = cdInput.value;
        countdownFechaLabel = '';
    }

    const updated = {
        ...settings,
        fechaVoteEnabled:    toggleVote   ? toggleVote.checked   : !!settings.fechaVoteEnabled,
        countdownEnabled:    toggleCD     ? toggleCD.checked     : !!settings.countdownEnabled,
        usarFechaVotada:     usarVotada,
        countdownDate,
        countdownFechaLabel,
    };

    await fbSaveSettings(updated);

    // Aplicar countdown en tiempo real
    if (updated.countdownEnabled && updated.countdownDate) {
        const headerEl = document.getElementById('header-countdown');
        const bannerEl = document.getElementById('main-countdown-banner');
        if (headerEl) headerEl.style.display = '';
        if (bannerEl) bannerEl.style.display = '';
        startCountdownDisplay(updated.countdownDate);
    } else {
        stopCountdownDisplay();
    }

    // Refrescar el info de fecha ganadora y la claqueta
    renderFechaGanadoraInfo(allData, updated);
    updateClapperFecha(updated.countdownDate || '', updated.countdownFechaLabel || '');
    alert('✅ Configuración guardada.');
}

function renderFechasResults(allData, settings) {
    const container = document.getElementById('admin-fechas-results');
    if (!container) return;

    const counts = {};
    let totalVoters = 0;
    allData.forEach(item => {
        if (Array.isArray(item.fechasVotadas) && item.fechasVotadas.length > 0) {
            totalVoters++;
            item.fechasVotadas.forEach(f => {
                counts[f] = (counts[f] || 0) + 1;
            });
        }
    });

    if (Object.keys(counts).length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;padding:.5rem 0;">Sin votos de fecha aún.</p>';
        return;
    }

    const maxCount = Math.max(...Object.values(counts));
    const sorted   = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    let html = `<p style="color:var(--text-muted);font-size:.82rem;margin-bottom:.8rem;">
        ${totalVoters} participante${totalVoters !== 1 ? 's' : ''} votaron.
        (Un participante puede votar más de una fecha)
    </p>`;

    sorted.forEach(([fecha, count]) => {
        const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
        html += `
            <div class="fecha-result-row">
                <span class="fecha-result-label">📅 ${escapeHTML(fecha)}</span>
                <div class="fecha-result-bar-wrap">
                    <div class="fecha-result-bar" style="width:${pct}%"></div>
                </div>
                <span class="fecha-result-count">${count} voto${count !== 1 ? 's' : ''}</span>
            </div>`;
    });

    container.innerHTML = html;
}

// ----------------------------------------------------------
// PÁGINA 5: PERSONAJES — Fichas del Elenco & Equipo
// ----------------------------------------------------------

// Datos de los personajes (nombre de usuario → ficha con info del personaje)
const PERSONAJES_DATA = {
    'Abogado de Tristo (Pablo)': {
        nombre: 'Pablo',
        personaje: 'Abogado de Tristo',
        descripcion: 'El letrado más astuto del set. Apareció en una sola escena y se convirtió en la leyenda jurídica de la producción.',
        fun_fact: 'Se sabe que memorizó su discurso en el taxi camino al rodaje.',
        emoji: '⚖️',
        color: '#6a1b9a'
    },
    'Cristina Suarez Quintana (Nora)': {
        nombre: 'Cristina Suarez Quintana',
        personaje: 'Nora',
        descripcion: 'Nora es el corazón emocional de la historia. La actriz que le dio vida tiene una presencia que ilumina cada escena.',
        fun_fact: 'Siempre tenía el texto perfecto y también la solución para todos los problemas del set.',
        emoji: '💫',
        color: '#9e1b24'
    },
    'Custodio 1 (Francisco)': {
        nombre: 'Francisco',
        personaje: 'Custodio 1',
        descripcion: 'El guardián silencioso. Su mirada dice más que mil líneas de diálogo.',
        fun_fact: 'Logró que la cámara lo siguiera en cada toma sin moverse más de dos pasos.',
        emoji: '🛡️',
        color: '#1565c0'
    },
    'Director (Omar)': {
        nombre: 'Omar',
        personaje: 'Director',
        descripcion: 'El visionario detrás de El Pródigo. Con una sola mirada podía reorganizar todo un set.',
        fun_fact: 'Dicen que en plena filmación ya estaba pensando en la próxima escena.',
        emoji: '🎬',
        color: '#e5a93c'
    },
    'Elias Mainor (Nicolas)': {
        nombre: 'Elias Mainor',
        personaje: 'Nicolás',
        descripcion: 'Nicolás trae una energía única al proyecto. Comprometido, presente y lleno de recursos.',
        fun_fact: 'Capaz de entrar en personaje en menos de diez segundos.',
        emoji: '⚡',
        color: '#00796b'
    },
    'Elena Ramirez (Cecilia)': {
        nombre: 'Elena Ramirez',
        personaje: 'Cecilia',
        descripcion: 'Cecilia es la revelación de la historia. Elena la construyó capa por capa hasta hacerla irresistible.',
        fun_fact: 'Su improvisación en la escena del living fue la que más aplausos generó en el set.',
        emoji: '🌟',
        color: '#ad1457'
    },
    'Fabiana Otrosky (Karina)': {
        nombre: 'Fabiana Otrosky',
        personaje: 'Karina',
        descripcion: 'Karina llena el espacio con su presencia. Fabiana sabe exactamente cuándo hablar y cuándo guardar silencio.',
        fun_fact: 'Tiene el récord de tomas buenas consecutivas del rodaje.',
        emoji: '🎯',
        color: '#6a1b9a'
    },
    'Fernando Tristo (Sergio)': {
        nombre: 'Fernando Tristo',
        personaje: 'Sergio',
        descripcion: 'Sergio carga el peso de la trama con una naturalidad pasmosa. Fernando lo hace parecer fácil.',
        fun_fact: 'Se aprendió las escenas de otros actores para poder reaccionar mejor.',
        emoji: '🏋️',
        color: '#1565c0'
    },
    'Fotografo Forense (Cristian)': {
        nombre: 'Cristian',
        personaje: 'Fotógrafo Forense',
        descripcion: 'El ojo frío de la investigación. Su aparición cambia el tono de toda la historia.',
        fun_fact: 'Llegó al set con su propia cámara de utilería.',
        emoji: '📷',
        color: '#37474f'
    },
    'Hipolito Fusco (Diego)': {
        nombre: 'Hipolito Fusco',
        personaje: 'Diego',
        descripcion: 'Diego navega entre la lealtad y el conflicto familiar. Hipolito lo interpretó con una honestidad brutal.',
        fun_fact: 'Creó un backstory de 3 páginas para su personaje antes de la primera lectura.',
        emoji: '🔥',
        color: '#e65100'
    },
    'Julián Vitolo (Gerardo)': {
        nombre: 'Julián Vitolo',
        personaje: 'Gerardo',
        descripcion: 'Gerardo es el protagonista, el hijo pródigo. Julián construyó su arco con una intensidad que no deja a nadie indiferente.',
        fun_fact: 'Cada vez que terminaba una toma difícil, aplaudía al equipo de producción.',
        emoji: '👑',
        color: '#e5a93c'
    },
    'Kiran Sultan Khan (Alejandro)': {
        nombre: 'Kiran Sultan Khan',
        personaje: 'Alejandro',
        descripcion: 'Alejandro irrumpe en la trama con una presencia magnética. Kiran trajo una energía completamente nueva al elenco.',
        fun_fact: 'Aprendió frases clave en el acento de su personaje en tiempo récord.',
        emoji: '🌊',
        color: '#0288d1'
    },
    'Luis Dreiper (Javier)': {
        nombre: 'Luis Dreiper',
        personaje: 'Javier',
        descripcion: 'Javier es el personaje que todos quieren pero nadie puede predecir. Luis le dio una profundidad inesperada.',
        fun_fact: 'Sus gestos en silencio son más expresivos que cualquier diálogo.',
        emoji: '🎭',
        color: '#7b1fa2'
    },
    'Marco Salas (Fabian)': {
        nombre: 'Marco Salas',
        personaje: 'Fabián',
        descripcion: 'Fabián lleva la tensión dramática en cada aparición. Marco domina el timing con precisión quirúrgica.',
        fun_fact: 'Tuvo que repetir más tomas que nadie... y cada una fue mejor que la anterior.',
        emoji: '⚔️',
        color: '#c62828'
    },
    'Mario Distefano (Thomas)': {
        nombre: 'Mario Distefano',
        personaje: 'Thomas',
        descripcion: 'Thomas es el personaje más impredecible del set. Mario lo interpretó siempre al borde del caos controlado.',
        fun_fact: 'Siempre llegaba al set con ganas de irse temprano pero era el último en salir.',
        emoji: '🌀',
        color: '#00695c'
    },
    'Maximo Grecco (Agustin)': {
        nombre: 'Agustín',
        personaje: 'Máximo Grecco',
        descripcion: 'Máximo es el analista principal del Departamento de Investigaciones Federales. Es la mente detrás de cada detalle técnico y el soporte analítico indispensable en los casos más complejos. Detrás de su apariencia frágil y retraída, se esconde el integrante con mayor coraje del equipo, demostrando una valentía inquebrantable a la hora de tomar decisiones cruciales en situaciones límite.',
        fun_fact: 'Agustín compuso a Máximo de una manera sublime y magistral en cada detalle. Aportó un carisma único que le hace pleno honor al personaje, logrando deslumbrar a la producción en cada toma con una presencia en cámara entrañable y potente.',
        emoji: '😈',
        color: '#6a1b9a'
    },
    'Mercedes Fusco (Lorena)': {
        nombre: 'Lorena',
        personaje: 'Mercedes Fusco',
        descripcion: 'Mercedes es la hija mayor de Víctor Fusco (la víctima) y la figura más desconcertante de toda la trama. Su perfil aparentemente naïf y su aire de inocencia actúan como un escudo opaco que hace dudar constantemente al espectador sobre sus verdaderas intenciones. Es un enigma constante: una presencia amigable que guarda secretos que podrían redefinir todo el caso.',
        fun_fact: 'Lorena abordó el papel con una practicidad y contundencia admirables. Su actuación destaca por la riqueza de sus matices, manejando con absoluta precisión las transiciones emocionales del personaje para construir en cada escena el clima de tensión e incertidumbre que la historia requiere.',
        emoji: '💎',
        color: '#880e4f'
    },
    'Otto Hahn Nienstein (Julio)': {
        nombre: 'Otto Hahn Nienstein',
        personaje: 'Julio',
        descripcion: 'Julio es el enigma de la trama. Otto le dio una densidad que el guion apenas insinuaba.',
        fun_fact: 'Tiene la mirada más difícil de descifrar de todo el elenco.',
        emoji: '🔮',
        color: '#283593'
    },
    'Pedro Torash (Hugo)': {
        nombre: 'Pedro Torash',
        personaje: 'Hugo',
        descripcion: 'Hugo es el personaje que conecta mundos. Pedro encontró el corazón del rol desde la primera lectura.',
        fun_fact: 'Traía algo diferente a cada ensayo sin que nadie se lo pidiera.',
        emoji: '🌍',
        color: '#2e7d32'
    },
    'Productora (Laura)': {
        nombre: 'Laura',
        personaje: 'Productora',
        descripcion: 'La arquitecta del proyecto. Sin Laura, El Pródigo no existiría tal como se conoce.',
        fun_fact: 'Resolvió más de 50 imprevistos de producción sin que el elenco se enterara de ninguno.',
        emoji: '🎪',
        color: '#e5a93c'
    },
    'Rosalia Fernandez (Mariela)': {
        nombre: 'Rosalia Fernandez',
        personaje: 'Mariela',
        descripcion: 'Mariela aparece como un rayo y lo cambia todo. Rosalia la trajo con una naturalidad que enamora.',
        fun_fact: 'Su entrada en escena fue la que más silencio generó en el set.',
        emoji: '🌹',
        color: '#b71c1c'
    },
    'Selin Tarkan (Hazal)': {
        nombre: 'Selin Tarkan',
        personaje: 'Hazal',
        descripcion: 'Hazal tiene una historia de vida que se lee en los ojos. Selin construyó ese peso con cada escena.',
        fun_fact: 'Su debut en el proyecto fue inmediatamente memorable para todo el equipo.',
        emoji: '🌙',
        color: '#4a148c'
    },
    'Sofia Fusco (Romina)': {
        nombre: 'Sofia Fusco',
        personaje: 'Romina',
        descripcion: 'Romina aporta frescura y conflicto a la familia. Sofia la trajo con una energía que contagia.',
        fun_fact: 'Tenía siempre una sonrisa lista para romper la tensión entre escenas.',
        emoji: '☀️',
        color: '#f57f17'
    },
    'Teresa Juarez (Victoria)': {
        nombre: 'Teresa Juarez',
        personaje: 'Victoria',
        descripcion: 'Victoria es la voz de la razón en un mundo que se desmorona. Teresa la cargó con una elegancia sobria y poderosa.',
        fun_fact: 'Nunca necesitó más de dos tomas para clavar una escena difícil.',
        emoji: '🕊️',
        color: '#1a237e'
    },
    'Tobias Miranda (Gabriel)': {
        nombre: 'Tobias Miranda',
        personaje: 'Gabriel',
        descripcion: 'Gabriel es un personaje que vive entre dos mundos. Tobias le dio una vulnerabilidad que nadie esperaba.',
        fun_fact: 'Su química con el resto del elenco fue inmediata desde la primera lectura.',
        emoji: '🌿',
        color: '#1b5e20'
    },
    'Victor Fusco (Salvador "El Tano")': {
        nombre: 'Victor Fusco',
        personaje: 'Salvador "El Tano"',
        descripcion: 'El Tano es la figura patriarcal que domina con su sola presencia. Victor lo construyó desde los pies hasta la mirada.',
        fun_fact: 'Siempre se quería ir temprano... pero sus escenas eran las que más se extrañaban cuando no estaba.',
        emoji: '🦁',
        color: '#bf360c'
    },
    'Vecino 1 (Julian)': {
        nombre: 'Julian',
        personaje: 'Vecino 1',
        descripcion: 'El vecino que lo ve todo. Julian le dio vida con una discreción que habla más que cualquier parlamento.',
        fun_fact: 'Su nombre de personaje es Vecino 1, pero en el set todos lo conocían por su nombre real.',
        emoji: '👀',
        color: '#4e342e'
    },
};

// Inicializa la grilla de personajes (se llama cuando el usuario ya completó)
async function initPersonajesPage() {
    const grid = document.getElementById('personajes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const name of getActiveUserList()) {
        const data = await getPersonajeData(name);
        const emoji = data.emoji;
        const color = data.color;
        const nombreReal  = data.nombre;
        const personaje   = data.personaje;
        const photoKey    = 'prodigo_photo_' + safeFileName(name);
        // Foto: primero desde Firestore (data.photo), luego localStorage como caché
        const storedPhoto = data.photo || localStorage.getItem(photoKey);
        if (data.photo && !localStorage.getItem(photoKey)) localStorage.setItem(photoKey, data.photo);

        const card = document.createElement('div');
        card.className = 'personaje-card';
        card.style.borderTopColor = color;
        card.innerHTML = `
            ${storedPhoto
                ? `<div class="personaje-photo-wrap"><img class="personaje-photo" src="${storedPhoto}" alt="${escapeHTML(nombreReal)}"></div>`
                : `<div class="personaje-emoji" style="color:${color}">${emoji}</div>`}
            <div class="personaje-card-name">${escapeHTML(nombreReal)}</div>
            <div class="personaje-card-role"><span class="role-como">como</span>${escapeHTML(personaje)}</div>
        `;
        card.addEventListener('click', () => openPersonajeModal(name));
        grid.appendChild(card);
    }
}

// Abre el modal con la ficha completa del personaje
async function openPersonajeModal(name) {
    const data = await getPersonajeData(name);

    const photoKey    = 'prodigo_photo_' + safeFileName(name);
    // Foto: primero desde Firestore (data.photo), luego localStorage como caché
    const storedPhoto = data.photo || localStorage.getItem(photoKey);
    if (data.photo && !localStorage.getItem(photoKey)) localStorage.setItem(photoKey, data.photo);

    const body = document.getElementById('personaje-modal-body');
    body.innerHTML = `
        <div class="personaje-ficha" style="--char-color: ${data.color}">
            ${storedPhoto
                ? `<div class="ficha-photo-wrap"><img class="ficha-photo" src="${storedPhoto}" alt="${escapeHTML(data.nombre)}"></div>`
                : `<div class="ficha-emoji">${data.emoji}</div>`}
            <div class="ficha-badge" style="background:${data.color}">ELENCO</div>
            <h2 class="ficha-personaje">${escapeHTML(data.nombre)}</h2>
            <h3 class="ficha-actor">interpreta a <span style="color:${data.color}">${escapeHTML(data.personaje)}</span></h3>
            <p class="ficha-descripcion">${escapeHTML(data.descripcion)}</p>
            <div class="ficha-fun-fact">
                <span class="ficha-fun-icon">🎬</span>
                <span>${escapeHTML(data.fun_fact)}</span>
            </div>
        </div>
    `;

    document.getElementById('personaje-modal').classList.add('active');
}

// ----------------------------------------------------------
// PÁGINA 6: CAMBIAR VOTACIÓN
// ----------------------------------------------------------
async function renderCambiarDatosPage() {
    if (!loggedUser || loggedUser.isAdmin) return;

    const existing = await fbGetResponse(loggedUser.name)
        || getStoredData().find(d => d.guestName === loggedUser.name);
    const infoEl    = document.getElementById('cambiar-datos-info');
    const actionsEl = document.getElementById('cambiar-datos-actions');
    if (!infoEl || !actionsEl) return;

    if (!existing) {
        infoEl.innerHTML = 'No encontramos datos cargados para tu usuario. Completá el formulario primero.';
        actionsEl.innerHTML = `
            <button type="button" class="cd-btn-no" onclick="goToStep(0)">⬅ Volver al Inicio</button>
        `;
        return;
    }

    const editCount = existing.editCount || 0;
    const remaining = MAX_EDITS - editCount;

    if (remaining <= 0) {
        infoEl.innerHTML = `Ya realizaste <strong>${editCount}</strong> cambios (máximo permitido: <strong>${MAX_EDITS}</strong>). 🔒 Tu votación está bloqueada.`;
        actionsEl.innerHTML = `
            <button type="button" class="cd-btn-no" onclick="goToStep(0)">⬅ Volver al Inicio</button>
        `;
        return;
    }

    infoEl.innerHTML = `
        Realizaste <strong>${editCount}</strong> de <strong>${MAX_EDITS}</strong> cambios permitidos.
        Te quedan <strong class="highlight-gold">${remaining} cambio${remaining !== 1 ? 's' : ''}</strong>.
        <br><br>¿Querés modificar tu votación actual?
    `;

    actionsEl.innerHTML = `
        <button type="button" class="cd-btn-yes" onclick="startEditFromCambiarDatos()">✏️ Sí, quiero modificar mi votación</button>
        <button type="button" class="cd-btn-no" onclick="goToStep(0)">✅ No, mantener mi votación y volver al inicio</button>
    `;

    // Card de votación de fecha
    const fechaCard = document.getElementById('cambiar-fecha-card');
    const fechaInfo = document.getElementById('cambiar-fecha-info');
    if (fechaCard) {
        const settings = await fbGetSettings();
        if (settings && settings.fechaVoteEnabled) {
            fechaCard.style.display = '';
            const fechaCount = existing.fechaVotoCount || 0;
            const fechaRem   = Math.max(0, MAX_FECHA_EDITS - fechaCount);
            const yaVotadas  = Array.isArray(existing.fechasVotadas) ? existing.fechasVotadas : [];
            if (fechaInfo) {
                fechaInfo.innerHTML = yaVotadas.length > 0
                    ? `Tu elección actual: <strong class="highlight-gold">${yaVotadas.join(', ')}</strong>.<br>
                       Cambios restantes: <strong class="highlight-gold">${fechaRem}</strong>.`
                    : 'Todavía no votaste por ninguna fecha.';
            }
        } else {
            fechaCard.style.display = 'none';
        }
    }
}

async function startEditFromCambiarDatos() {
    const existing = await fbGetResponse(loggedUser.name)
        || getStoredData().find(d => d.guestName === loggedUser.name);
    if (existing) {
        prefillFormWithExisting(existing);
        setTernasMode('scroll');
        // Temporalmente mostrar las pestañas del wizard para navegar al formulario
        document.querySelectorAll('.wizard-only-btn').forEach(btn => { btn.style.display = ''; });
        document.querySelectorAll('.site-only-btn').forEach(btn => { btn.style.display = 'none'; });
        const progressBar = document.querySelector('.wizard-progress-container');
        if (progressBar) progressBar.style.display = 'flex';
    }
    goToStep(1);
}


// ----------------------------------------------------------
// MINI-WIZARD DE TERNAS (modo primera vez: de a una terna)
// ----------------------------------------------------------

function setTernasMode(mode) {
    ternasMode = mode;
    const allTernas = document.querySelectorAll('[id^="terna-step-"]');
    const wizardNav = document.getElementById('terna-wizard-nav');
    const step2Nav  = document.getElementById('step2-nav');
    const progress  = document.getElementById('terna-wizard-progress');
    const descEl    = document.getElementById('ternas-mode-desc');

    if (mode === 'wizard') {
        // Mostrar solo la terna activa, ocultar navegación final
        allTernas.forEach(el => { el.style.display = 'none'; });
        wizardNav.style.display  = 'block';
        step2Nav.style.display   = 'none';
        progress.style.display   = 'block';
        if (descEl) descEl.innerHTML = `Completá cada terna de a una. <strong>👑 1er Nominado = 2 PUNTOS</strong> | <strong>⭐ 2do Nominado = 1 PUNTO</strong>.`;
        showTernaStep(currentTernaStep);
    } else {
        // Scroll: mostrar todas
        allTernas.forEach(el => { el.style.display = 'block'; });
        wizardNav.style.display  = 'none';
        step2Nav.style.display   = 'flex';
        progress.style.display   = 'none';
        if (descEl) descEl.innerHTML = `Podés editar cualquier terna. <strong>👑 1er Nominado = 2 PUNTOS</strong> | <strong>⭐ 2do Nominado = 1 PUNTO</strong>.`;
    }
}

function showTernaStep(n) {
    currentTernaStep = n;
    document.querySelectorAll('[id^="terna-step-"]').forEach(el => { el.style.display = 'none'; });
    const active = document.getElementById(`terna-step-${n}`);
    if (active) active.style.display = 'block';

    // Actualizar barra y label
    const pct = Math.round((n / 11) * 100);
    const bar = document.getElementById('terna-wizard-bar');
    const lbl = document.getElementById('terna-wizard-label');
    if (bar) bar.style.width = pct + '%';
    if (lbl) lbl.textContent = n === 11 ? '✨ Premio Prod1g0 de Platino' : `Terna ${n} de 10`;

    // Botón anterior: ocultar en terna 1
    const prevBtn = document.getElementById('btn-terna-prev');
    if (prevBtn) prevBtn.style.visibility = n === 1 ? 'hidden' : 'visible';

    // Botón siguiente: cambiar texto en última terna
    const nextBtn = document.getElementById('btn-terna-next');
    if (nextBtn) nextBtn.textContent = n === 11 ? '✨ Finalizar y enviar ✓' : 'Siguiente terna ➔';

    // Limpiar error
    const err = document.getElementById('terna-step-error');
    if (err) err.style.display = 'none';
}

function ternaWizardNext() {
    const err = document.getElementById('terna-step-error');
    // Validar la terna actual
    let missing = [];
    if (currentTernaStep <= 9) {
        // Ternas 1-9: dos selects de persona
        const v1 = document.querySelector(`select[name="terna${currentTernaStep}_voto1"]`);
        const v2 = document.querySelector(`select[name="terna${currentTernaStep}_voto2"]`);
        if (!v1 || !v1.value) missing.push('1er Nominado');
        if (!v2 || !v2.value) missing.push('2do Nominado');
    } else if (currentTernaStep === 10) {
        // Terna 10: texto libre
        const t10 = document.getElementById('terna-10');
        if (!t10 || !t10.value.trim()) missing.push('Descripción del mejor momento');
    } else if (currentTernaStep === 11) {
        // Terna 11 Platino: dos selects de persona
        const p1 = document.querySelector('select[name="terna11_voto1"]');
        const p2 = document.querySelector('select[name="terna11_voto2"]');
        if (!p1 || !p1.value) missing.push('1er Nominado al Platino');
        if (!p2 || !p2.value) missing.push('2do Nominado al Platino');
    }

    if (missing.length > 0) {
        if (err) {
            err.style.display = 'block';
            err.innerHTML = `⚠️ Completá: <strong>${missing.join(', ')}</strong> antes de continuar.`;
        }
        return;
    }
    if (err) err.style.display = 'none';

    if (currentTernaStep < 11) {
        showTernaStep(currentTernaStep + 1);
    } else {
        // Terminó todas las ternas → avanzar al paso 4 (Cultura)
        unlockNextStep(4);
    }
}

function ternaWizardPrev() {
    if (currentTernaStep > 1) showTernaStep(currentTernaStep - 1);
}

// ----------------------------------------------------------
// 5. PANEL DE CONTROL DE PRODUCCIÓN (ACCESO DIRECTO PARA OMAR)
// ----------------------------------------------------------
function initAdminModal() {
    const btnOpenAdmin      = document.getElementById('btn-open-admin-modal');
    const adminPanelModal   = document.getElementById('admin-panel-modal');
    const btnCloseAdmin     = document.getElementById('btn-close-admin');
    const btnSaveCloseAdmin = document.getElementById('btn-save-close-admin');

    btnOpenAdmin.addEventListener('click', () => {
        renderAdminPanel();
        adminPanelModal.classList.add('active');
    });

    btnCloseAdmin.addEventListener('click', () => {
        adminPanelModal.classList.remove('active');
    });

    // 💾 Guardar y Cerrar: simplemente cierra el panel (los datos ya están en Firestore)
    if (btnSaveCloseAdmin) {
        btnSaveCloseAdmin.addEventListener('click', () => {
            adminPanelModal.classList.remove('active');
        });
    }
}

function initAdminTabs() {
    // El acordeón reemplaza las tabs. Esta función queda vacía por compatibilidad.
}

// Abre/cierra un acordeón
function toggleAccord(sectionId) {
    const section = document.getElementById(sectionId);
    const body    = section.querySelector('.accord-body');
    const arrow   = section.querySelector('.accord-arrow');
    const isOpen  = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    arrow.textContent  = isOpen ? '▼' : '▲';
    section.classList.toggle('accord-open', !isOpen);
}

// Cambia de sub-pestaña dentro de un acordeón
function toggleSubTab(btn, sectionId) {
    const section = document.getElementById(sectionId);
    section.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
    section.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const targetId = btn.getAttribute('data-sub');
    const target   = document.getElementById(targetId);
    if (target) target.classList.add('active');
}

// ----------------------------------------------------------
// 6. RENDERIZADO DEL PANEL ADMIN CON RECUENTO PONDERADO (2 PTS / 1 PT)
// ----------------------------------------------------------
function getStoredData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

async function renderAdminPanel() {
    // Leer desde Firestore; si falla, usar localStorage como respaldo
    let data = await fbGetAllResponses();
    if (!data) data = getStoredData();
    // Actualizar localStorage con los datos frescos de Firestore
    if (data.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // Stats
    document.getElementById('stat-total').innerText      = data.length;
    document.getElementById('stat-gifts').innerText      = data.filter(d => d.confirmGift === 'Sí').length;
    document.getElementById('stat-descargos').innerText  = data.filter(d => d.descargo && d.descargo.length > 0).length;
    document.getElementById('stat-gratitudes').innerText = data.filter(d => d.gratitud && d.gratitud.length > 0).length;

    // Acordeón Encuesta — votación general
    renderTernasPointsRecount(data);

    // Acordeón Encuesta — votación por usuario (selector)
    const userVoteSel = document.getElementById('admin-user-vote-select');
    if (userVoteSel) {
        userVoteSel.innerHTML = '<option value="" disabled selected>Selecciona un usuario...</option>';
        data.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.guestName;
            opt.textContent = item.guestName;
            userVoteSel.appendChild(opt);
        });
        userVoteSel.onchange = () => renderUserVoteDetail(userVoteSel.value, data);
    }
    document.getElementById('admin-user-votes-detail').innerHTML =
        '<p style="color:var(--text-muted);padding:1rem;">Seleccioná un usuario para ver sus votos.</p>';

    // Acordeón Encuesta — intentos por usuario
    renderIntentosTable(data);

    // Acordeón Descargos & Gratitud
    renderFeedbackStreams(data);

    // Acordeón Cultura
    renderCultureStreams(data);

    // Acordeón Tabla completa
    renderFullTable(data);

    // Acordeón Asistencia & Colores
    renderAsistenciaColoresTabla(data);

    // Acordeón Prod1g0 de Platino
    renderPlatinoAdmin(data);

    // Acordeón Fechas & Countdown
    renderAdminFechas(data);

    // Acordeón Ranking Global
    renderRankingGlobal(data);

    // Acordeón Itinerario
    renderItinerarioAdminList();

    // Acordeón Usuarios & Claves
    renderUsuariosAdminList();

    // Acordeón Gestión — selector de usuarios y contador
    const sel = document.getElementById('admin-delete-user-select');
    if (sel) {
        sel.innerHTML = '<option value="" disabled selected>Selecciona un usuario...</option>';
        data.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.guestName;
            const ch = item.editCount || 1;
            opt.textContent = `${item.guestName}  [${ch}/${MAX_EDITS}${ch >= MAX_EDITS ? ' 🔒' : ''}]`;
            sel.appendChild(opt);
        });
    }
    const totalGestion = document.getElementById('stat-total-gestion');
    if (totalGestion) totalGestion.textContent = data.length;

    // Renderizar grilla de fotos del elenco
    renderFotosAdminGrid();
}

// ----------------------------------------------------------
// FOTOS DEL ELENCO — Subida y gestión desde el Panel Admin
// ----------------------------------------------------------
async function renderFotosAdminGrid() {
    const grid = document.getElementById('fotos-admin-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const name of getActiveUserList()) {
        const pdata       = await getPersonajeData(name);
        const nombreReal  = pdata.nombre;
        const personaje   = pdata.personaje;
        const color       = pdata.color;
        const emoji       = pdata.emoji;
        const sfn         = safeFileName(name);
        const photoKey    = 'prodigo_photo_' + sfn;
        // Foto: primero desde Firestore (pdata.photo), luego localStorage como caché
        const stored      = pdata.photo || localStorage.getItem(photoKey);
        // Sincronizar al localStorage para tenerlo disponible offline
        if (pdata.photo && !localStorage.getItem(photoKey)) localStorage.setItem(photoKey, pdata.photo);

        const cell = document.createElement('div');
        cell.className = 'foto-admin-cell';
        // Usamos data-name para evitar problemas con comillas en nombres como Victor Fusco
        cell.dataset.name = name;

        const desc    = escapeHTML(pdata.descripcion || '');
        const funfact = escapeHTML(pdata.fun_fact || '');

        cell.innerHTML = `
            <div class="foto-admin-preview" id="prev-${sfn}">
                ${stored
                    ? `<img src="${stored}" alt="${escapeHTML(nombreReal)}">`
                    : `<span class="foto-admin-emoji" style="color:${color}">${emoji}</span>`}
            </div>

            <div class="foto-edit-fields foto-edit-fields-full">
                <div class="foto-edit-row2">
                    <div class="foto-edit-col">
                        <label class="foto-edit-label">Nombre real</label>
                        <input class="foto-edit-input" id="edit-nombre-${sfn}" type="text" value="${escapeHTML(nombreReal)}" placeholder="Nombre real">
                    </div>
                    <div class="foto-edit-col">
                        <label class="foto-edit-label">Personaje</label>
                        <input class="foto-edit-input" id="edit-personaje-${sfn}" type="text" value="${escapeHTML(personaje)}" placeholder="Personaje">
                    </div>
                    <div class="foto-edit-col foto-edit-col-sm">
                        <label class="foto-edit-label">Emoji</label>
                        <input class="foto-edit-input" id="edit-emoji-${sfn}" type="text" value="${escapeHTML(emoji)}" placeholder="🎭" maxlength="4">
                    </div>
                    <div class="foto-edit-col foto-edit-col-sm">
                        <label class="foto-edit-label">Color</label>
                        <input class="foto-edit-input foto-edit-color" id="edit-color-${sfn}" type="color" value="${color}">
                    </div>
                </div>
                <label class="foto-edit-label" style="margin-top:.5rem;">Descripción</label>
                <textarea class="foto-edit-input" id="edit-desc-${sfn}" rows="2" placeholder="Descripción del personaje...">${desc}</textarea>
                <label class="foto-edit-label" style="margin-top:.4rem;">Fun fact 🎬</label>
                <textarea class="foto-edit-input" id="edit-funfact-${sfn}" rows="2" placeholder="Dato curioso o anécdota...">${funfact}</textarea>
                <button type="button" class="foto-save-btn foto-save-personaje" style="margin-top:.6rem;">💾 Guardar cambios</button>
            </div>

            <div class="foto-admin-btns" style="margin-top:.5rem;">
                <label class="foto-upload-label" title="Subir foto">
                    📤 Foto
                    <input type="file" accept="image/*" style="display:none">
                </label>
                ${stored ? `<button type="button" class="foto-delete-btn foto-delete-photo">🗑️</button>` : ''}
            </div>
        `;

        // Event listeners (evita onclick inline con nombres que tienen comillas)
        cell.querySelector('.foto-save-personaje').addEventListener('click', function() {
            guardarEdicionPersonaje(name, sfn, this);
        });
        cell.querySelector('input[type="file"]').addEventListener('change', function() {
            handleFotoUpload(this, name, sfn);
        });
        const delBtn = cell.querySelector('.foto-delete-photo');
        if (delBtn) delBtn.addEventListener('click', () => deleteFoto(name, sfn));

        grid.appendChild(cell);
    }
}

async function handleFotoUpload(input, name, sfn) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
        alert('La imagen es demasiado grande. Usá una foto de menos de 800 KB.');
        return;
    }
    const reader = new FileReader();
    reader.onload = async function(e) {
        const useSfn   = sfn || safeFileName(name);
        const photoKey = 'prodigo_photo_' + useSfn;
        const dataUrl  = e.target.result;

        // Guardar en localStorage (cache rápida)
        localStorage.setItem(photoKey, dataUrl);

        // Guardar en Firestore para que persista en todos los dispositivos
        const current = await getPersonajeData(name);
        await fbSavePersonaje(useSfn, { ...current, photo: dataUrl });
        localStorage.setItem('prodigo_personaje_edit_' + useSfn, JSON.stringify({ ...current, photo: dataUrl }));

        renderFotosAdminGrid();
        initPersonajesPage();
    };
    reader.readAsDataURL(file);
}

async function deleteFoto(name, sfn) {
    if (!confirm('¿Eliminar la foto de ' + name + '?')) return;
    const useSfn   = sfn || safeFileName(name);
    const photoKey = 'prodigo_photo_' + useSfn;

    // Borrar de localStorage
    localStorage.removeItem(photoKey);

    // Borrar de Firestore
    const current = await getPersonajeData(name);
    const updated  = { ...current };
    delete updated.photo;
    await fbSavePersonaje(useSfn, updated);
    localStorage.setItem('prodigo_personaje_edit_' + useSfn, JSON.stringify(updated));

    renderFotosAdminGrid();
    initPersonajesPage();
}

// Muestra los votos de un usuario en detalle
function renderUserVoteDetail(userName, data) {
    const container = document.getElementById('admin-user-votes-detail');
    const entry = data.find(d => d.guestName === userName);
    if (!entry) { container.innerHTML = '<p style="color:var(--text-muted)">Sin datos.</p>'; return; }

    let html = `<div class="user-vote-detail-grid">`;
    TERNAS_CONFIG.forEach(terna => {
        if (terna.isPerson) {
            const v1 = entry[`${terna.id}_voto1`] || '—';
            const v2 = entry[`${terna.id}_voto2`] || '—';
            html += `
                <div class="user-vote-card">
                    <div class="user-vote-title">${terna.title}</div>
                    <div class="user-vote-row"><span class="uv-pts uv-2pts">👑 2 pts</span><span>${escapeHTML(v1)}</span></div>
                    <div class="user-vote-row"><span class="uv-pts uv-1pt">⭐ 1 pt</span><span>${escapeHTML(v2)}</span></div>
                </div>`;
        } else {
            html += `
                <div class="user-vote-card" style="grid-column:1/-1;">
                    <div class="user-vote-title">${terna.title}</div>
                    <div class="user-vote-row">${escapeHTML(entry.terna10 || '—')}</div>
                </div>`;
        }
    });
    html += `</div>`;
    container.innerHTML = html;
}

// Tabla de intentos restantes por usuario
function renderIntentosTable(data) {
    const container = document.getElementById('admin-intentos-table');
    if (!container) return;
    if (data.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Sin datos aún.</p>';
        return;
    }
    let rows = data.map(item => {
        // Votación
        const usedV      = item.editCount || 1;
        const remV       = Math.max(0, MAX_EDITS - usedV);
        const lockedV    = remV === 0;
        const pctV       = Math.round((usedV / MAX_EDITS) * 100);

        // Asistencia
        const usedA   = item.editCountAsistencia != null ? item.editCountAsistencia : 1;
        const remA    = Math.max(0, MAX_EDITS_ASIST - usedA);
        const lockedA = remA === 0;
        const pctA    = Math.round((usedA / MAX_EDITS_ASIST) * 100);

        return `
            <div class="intentos-row">
                <div class="intentos-name">${escapeHTML(item.guestName)}</div>
                <div style="display:flex;flex-direction:column;gap:.35rem;flex:1;">
                    <div>
                        <small style="color:var(--text-muted);">🗳️ Votación</small>
                        <div class="intentos-bar-wrap">
                            <div class="intentos-bar" style="width:${pctV}%;background:${lockedV ? '#f87171' : 'var(--gold-primary)'}"></div>
                        </div>
                    </div>
                    <div>
                        <small style="color:var(--text-muted);">🎨 Asistencia</small>
                        <div class="intentos-bar-wrap">
                            <div class="intentos-bar" style="width:${pctA}%;background:${lockedA ? '#f87171' : '#60a5fa'}"></div>
                        </div>
                    </div>
                </div>
                <div class="intentos-count">
                    <div class="${lockedV ? 'intentos-locked' : ''}">
                        ${lockedV ? '🔒 Votación bloqueada' : `🗳️ ${remV} cambio${remV !== 1 ? 's' : ''} de votación`}
                        <small>(${usedV}/${MAX_EDITS})</small>
                    </div>
                    <div class="${lockedA ? 'intentos-locked' : ''}" style="margin-top:.2rem;">
                        ${lockedA ? '🔒 Asistencia bloqueada' : `🎨 ${remA} cambio${remA !== 1 ? 's' : ''} de asistencia`}
                        <small>(${usedA}/${MAX_EDITS_ASIST})</small>
                    </div>
                </div>
            </div>`;
    }).join('');
    container.innerHTML = `<div class="intentos-list">${rows}</div>`;
}

function renderTernasPointsRecount(data) {
    const container = document.getElementById('ternas-summary-container');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem;">No hay votos registrados aún.</div>`;
        return;
    }

    TERNAS_CONFIG.forEach(terna => {
        const card = document.createElement('div');
        card.className = 'admin-terna-card';

        if (terna.isPerson) {
            const scores = {};

            data.forEach(item => {
                const voto1 = item[`${terna.id}_voto1`]; // 2 Puntos
                const voto2 = item[`${terna.id}_voto2`]; // 1 Punto

                if (voto1) {
                    if (!scores[voto1]) scores[voto1] = { totalPoints: 0, firstVotes: 0, secondVotes: 0 };
                    scores[voto1].totalPoints += 2;
                    scores[voto1].firstVotes += 1;
                }
                if (voto2) {
                    if (!scores[voto2]) scores[voto2] = { totalPoints: 0, firstVotes: 0, secondVotes: 0 };
                    scores[voto2].totalPoints += 1;
                    scores[voto2].secondVotes += 1;
                }
            });

            const sorted = Object.entries(scores).sort((a, b) => b[1].totalPoints - a[1].totalPoints);

            let listHtml = '';
            if (sorted.length === 0) {
                listHtml = '<li style="color:var(--text-muted); font-size: 0.85rem;">Sin votos aún.</li>';
            } else {
                sorted.forEach(([name, stats], index) => {
                    const isWinner = index === 0 && stats.totalPoints > 0;
                    listHtml += `
                        <li class="vote-rank-item ${isWinner ? 'top-winner' : ''}">
                            <div>
                                <span>${isWinner ? '👑 ' : ''}${escapeHTML(name)}</span>
                                <div class="vote-subcounts">(${stats.firstVotes} votos de 2 pts + ${stats.secondVotes} votos de 1 pt)</div>
                            </div>
                            <div class="vote-rank-details">
                                <span class="vote-points-badge">${stats.totalPoints} PTS</span>
                            </div>
                        </li>
                    `;
                });
            }

            card.innerHTML = `
                <div class="admin-terna-title">${terna.title}</div>
                <ul class="vote-rank-list">
                    ${listHtml}
                </ul>
            `;
        } else {
            let momentsHtml = '';
            const moments = data.filter(d => d.terna10);
            if (moments.length === 0) {
                momentsHtml = '<li style="color:var(--text-muted); font-size: 0.85rem;">Sin momentos registrados aún.</li>';
            } else {
                moments.forEach(m => {
                    momentsHtml += `
                        <li class="vote-rank-item" style="flex-direction: column; align-items: flex-start; gap: 0.3rem;">
                            <strong style="color:var(--gold-primary); font-size: 0.85rem;">${escapeHTML(m.guestName)}:</strong>
                            <div style="font-size: 0.9rem; color: #f3f4f6;">"${escapeHTML(m.terna10)}"</div>
                        </li>
                    `;
                });
            }

            card.innerHTML = `
                <div class="admin-terna-title">${terna.title}</div>
                <ul class="vote-rank-list">
                    ${momentsHtml}
                </ul>
            `;
        }

        container.appendChild(card);
    });
}

function renderFeedbackStreams(data) {
    const descargosList = document.getElementById('admin-descargos-list');
    const gratitudList = document.getElementById('admin-gratitud-list');

    descargosList.innerHTML = '';
    gratitudList.innerHTML = '';

    const descargos = data.filter(d => d.descargo);
    const gratitudes = data.filter(d => d.gratitud);

    if (descargos.length === 0) {
        descargosList.innerHTML = '<div style="color:var(--text-muted); padding: 1rem;">No hay descargos registrados.</div>';
    } else {
        descargos.forEach(item => {
            const card = document.createElement('div');
            card.className = 'stream-card';
            card.style.borderLeftColor = '#f87171';
            card.innerHTML = `
                <div class="stream-author">${escapeHTML(item.guestName)}</div>
                <div class="stream-text">"${escapeHTML(item.descargo)}"</div>
            `;
            descargosList.appendChild(card);
        });
    }

    if (gratitudes.length === 0) {
        gratitudList.innerHTML = '<div style="color:var(--text-muted); padding: 1rem;">No hay agradecimientos registrados.</div>';
    } else {
        gratitudes.forEach(item => {
            const card = document.createElement('div');
            card.className = 'stream-card';
            card.style.borderLeftColor = '#34d399';
            card.innerHTML = `
                <div class="stream-author">${escapeHTML(item.guestName)}</div>
                <div class="stream-text">"${escapeHTML(item.gratitud)}"</div>
            `;
            gratitudList.appendChild(card);
        });
    }
}

function renderCultureStreams(data) {
    const list = document.getElementById('admin-culture-list');
    list.innerHTML = '';

    if (data.length === 0) {
        list.innerHTML = '<div style="color:var(--text-muted); padding: 1rem;">No hay gustos culturales cargados.</div>';
        return;
    }

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'stream-card';
        card.innerHTML = `
            <div class="stream-author">${escapeHTML(item.guestName)}</div>
            <div class="stream-text">
                <p>🎬 <strong>Películas:</strong> ${escapeHTML(item.favMovies || '-')}</p>
                <p>⭐ <strong>Actores/Actrices:</strong> ${escapeHTML(item.favActors || '-')}</p>
                <p>🖼️ <strong>Cuadros / Arte:</strong> ${escapeHTML(item.favPaintings || '-')}</p>
                <p>🎶 <strong>Música para el baile:</strong> ${escapeHTML(item.favMusic || '-')}</p>
            </div>
        `;
        list.appendChild(card);
    });
}

function renderFullTable(data) {
    const tbody = document.getElementById('full-admin-tbody');
    tbody.innerHTML = '';

    // Actualizar encabezados para incluir los nuevos campos
    const thead = document.querySelector('#full-admin-table thead tr');
    if (thead) {
        thead.innerHTML = `
            <th>Fecha</th><th>Invitado</th><th>Cambios</th>
            <th>Color</th><th>Asistencia</th><th>Acomp.</th>
            <th>Regalo</th><th>Descargo</th><th>Gratitud</th>
            <th>Películas</th><th>Música</th>
        `;
    }

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:2rem;color:var(--text-muted);">No hay registros aún.</td></tr>`;
        return;
    }

    const colorEmoji = { 'ROJO': '🔴', 'AMARILLO': '🟡', 'VERDE': '🟢' };

    data.forEach(item => {
        const ch  = item.editCount || 1;
        const rem = Math.max(0, MAX_EDITS - ch);
        const tr  = document.createElement('tr');
        const cEmoji = colorEmoji[item.colorEvento] || '';
        const asistLabel = item.asistencia === 'ACOMPAÑADO'
            ? `👥 Acomp. (${item.cantAcompaniantes || '?'})`
            : item.asistencia === 'SOLO' ? '🧍 Solo/a' : '—';
        tr.innerHTML = `
            <td><small>${escapeHTML(item.timestamp)}</small></td>
            <td><strong>${escapeHTML(item.guestName)}</strong></td>
            <td style="text-align:center;">
                <span style="color:${rem === 0 ? '#f87171' : 'var(--gold-primary)'}">
                    ${rem === 0 ? '🔒' : ch + '/' + MAX_EDITS}
                </span>
            </td>
            <td style="text-align:center;">${cEmoji} <small>${escapeHTML(item.colorEvento || '—')}</small></td>
            <td><small>${escapeHTML(asistLabel)}</small></td>
            <td><small style="font-size:.75rem;color:var(--text-muted)">${escapeHTML(item.nombresAcompaniantes || '—')}</small></td>
            <td><span style="color:${item.confirmGift === 'Sí' ? '#34d399' : '#f87171'}">${item.confirmGift === 'Sí' ? '🎁 Sí' : 'No'}</span></td>
            <td><small>${escapeHTML(item.descargo ? item.descargo.substring(0, 40) + '...' : '-')}</small></td>
            <td><small>${escapeHTML(item.gratitud ? item.gratitud.substring(0, 40) + '...' : '-')}</small></td>
            <td><small>${escapeHTML(item.favMovies || '-')}</small></td>
            <td><small>${escapeHTML(item.favMusic || '-')}</small></td>
        `;
        tbody.appendChild(tr);
    });
}

// ----------------------------------------------------------
// ASISTENCIA & COLORES — Tabla de invitados con colores asignados
// ----------------------------------------------------------
function renderAsistenciaColoresTabla(data) {
    const container = document.getElementById('asistencia-colores-tabla');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Sin datos aún.</p>';
        return;
    }

    const colorEmoji = { ROJO: '🔴', AMARILLO: '🟡', VERDE: '🟢' };
    const colorBg    = { ROJO: '#fee2e2', AMARILLO: '#fef9c3', VERDE: '#dcfce7' };
    const colorBdr   = { ROJO: '#f87171', AMARILLO: '#facc15', VERDE: '#4ade80' };

    // Conteo global de colores (titulares + acompañantes)
    const totals = { ROJO: 0, AMARILLO: 0, VERDE: 0 };
    data.forEach(item => {
        if (totals[item.colorEvento] !== undefined) totals[item.colorEvento]++;
        if (Array.isArray(item.coloresAcompaniantes)) {
            item.coloresAcompaniantes.forEach(ac => {
                if (totals[ac.color] !== undefined) totals[ac.color]++;
            });
        }
    });

    // Resumen de totales
    let html = `
        <div class="ac-totals">
            ${['ROJO','AMARILLO','VERDE'].map(c => `
                <div class="ac-total-pill" style="background:${colorBg[c]};border:1px solid ${colorBdr[c]};">
                    <span style="font-size:1.3rem;">${colorEmoji[c]}</span>
                    <span style="font-weight:700;">${c}</span>
                    <span class="ac-total-num">${totals[c]}</span>
                </div>`).join('')}
        </div>
        <div class="ac-table-wrap">
            <table class="data-table ac-table">
                <thead>
                    <tr>
                        <th>Invitado</th>
                        <th>Color</th>
                        <th>Asistencia</th>
                        <th>Acompañantes y colores</th>
                        <th>Cambios asist.</th>
                    </tr>
                </thead>
                <tbody>`;

    data.forEach(item => {
        const cE   = colorEmoji[item.colorEvento] || '—';
        const asistLabel = item.asistencia === 'ACOMPAÑADO'
            ? `👥 Acompañado (${item.cantAcompaniantes || '?'})`
            : item.asistencia === 'SOLO' ? '🧍 Solo/a' : '—';

        // Acompañantes con colores asignados
        let acompHtml = '—';
        if (Array.isArray(item.coloresAcompaniantes) && item.coloresAcompaniantes.length > 0) {
            acompHtml = item.coloresAcompaniantes.map(ac =>
                `<span class="ac-companion-pill" style="background:${colorBg[ac.color]};border:1px solid ${colorBdr[ac.color]};">
                    ${colorEmoji[ac.color]} ${escapeHTML(ac.nombre)}
                </span>`
            ).join(' ');
        } else if (item.nombresAcompaniantes) {
            acompHtml = `<span style="color:var(--text-muted);font-size:.8rem;">${escapeHTML(item.nombresAcompaniantes)} <em>(sin color asignado aún)</em></span>`;
        }

        const usedAsist = item.editCountAsistencia || (item.editCount ? 1 : 0);
        const remAsist  = Math.max(0, MAX_EDITS_ASIST - usedAsist);
        const lockAsist = remAsist === 0;

        html += `
            <tr>
                <td><strong>${escapeHTML(item.guestName)}</strong></td>
                <td style="text-align:center;font-size:1.2rem;">${cE} <small>${escapeHTML(item.colorEvento || '—')}</small></td>
                <td><small>${escapeHTML(asistLabel)}</small></td>
                <td class="ac-companions-cell">${acompHtml}</td>
                <td style="text-align:center;">
                    <span style="color:${lockAsist ? '#f87171' : 'var(--gold-primary)'};">
                        ${lockAsist ? '🔒 BLOQUEADO' : `${remAsist} restante${remAsist !== 1 ? 's' : ''}`}
                    </span>
                    <small style="color:var(--text-muted);display:block;">(${usedAsist}/${MAX_EDITS_ASIST})</small>
                </td>
            </tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}




// ----------------------------------------------------------
// PROD1G0 DE PLATINO — Votaciones del Premio Especial (Terna 11)
// ----------------------------------------------------------
function renderPlatinoAdmin(data) {
    const container = document.getElementById('platino-admin-container');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Sin votos aún.</p>';
        return;
    }

    // Calcular puntos terna11 (voto1=2pts, voto2=1pt)
    const scores = {};
    data.forEach(item => {
        const v1 = item['terna11_voto1'];
        const v2 = item['terna11_voto2'];
        if (v1) {
            if (!scores[v1]) scores[v1] = { pts: 0, primeros: 0, segundos: 0 };
            scores[v1].pts += 2;
            scores[v1].primeros++;
        }
        if (v2) {
            if (!scores[v2]) scores[v2] = { pts: 0, primeros: 0, segundos: 0 };
            scores[v2].pts += 1;
            scores[v2].segundos++;
        }
    });

    const sorted = Object.entries(scores).sort((a, b) => b[1].pts - a[1].pts || b[1].primeros - a[1].primeros);
    const votaron = data.filter(d => d['terna11_voto1'] || d['terna11_voto2']).length;

    let html = `
        <div style="background:var(--card-bg,#1a1a2e);border:1px solid var(--gold-primary,#e5a93c);border-radius:10px;padding:1.2rem;margin-bottom:1.2rem;">
            <p style="color:var(--gold-primary,#e5a93c);font-weight:700;margin:0 0 .3rem;">
                ✨ Premio PROD1G0 DE PLATINO
            </p>
            <p style="color:var(--text-muted);font-size:.85rem;margin:0;">
                ${votaron} de ${data.length} participante${data.length !== 1 ? 's' : ''} votaron este premio especial.
            </p>
        </div>`;

    if (sorted.length === 0) {
        html += '<p style="color:var(--text-muted);padding:1rem;">Sin votos registrados para este premio.</p>';
        container.innerHTML = html;
        return;
    }

    html += `<div class="terna-results-list">`;

    const medals = ['🥇', '🥈', '🥉'];
    sorted.forEach(([name, stat], idx) => {
        const medal  = medals[idx] || `<span style="color:var(--text-muted);font-weight:700;">#${idx + 1}</span>`;
        const isFirst = idx === 0;
        html += `
            <div class="terna-result-row ${isFirst ? 'terna-result-winner' : ''}"
                 style="${isFirst ? 'border:1px solid var(--gold-primary,#e5a93c);background:rgba(229,169,60,.08);' : ''}border-radius:8px;padding:.75rem 1rem;margin-bottom:.5rem;display:flex;align-items:center;gap:.8rem;">
                <div style="font-size:1.4rem;width:2rem;text-align:center;">${medal}</div>
                <div style="flex:1;">
                    <strong style="color:${isFirst ? 'var(--gold-primary,#e5a93c)' : 'inherit'};font-size:${isFirst ? '1.05rem' : '.95rem'};">
                        ${escapeHTML(name)}
                    </strong>
                </div>
                <div style="text-align:right;line-height:1.3;">
                    <span style="font-size:1.2rem;font-weight:700;color:var(--gold-primary,#e5a93c);">${stat.pts}</span>
                    <span style="color:var(--text-muted);font-size:.78rem;"> pts</span>
                    <div style="color:var(--text-muted);font-size:.75rem;">
                        👑 ${stat.primeros} &nbsp; ⭐ ${stat.segundos}
                    </div>
                </div>
            </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
}



// ----------------------------------------------------------
// RANKING GLOBAL — Suma de puntos de todas las ternas
// ----------------------------------------------------------
function renderRankingGlobal(data) {
    const container = document.getElementById('ranking-global-container');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Sin votos aún.</p>';
        return;
    }

    // Acumular puntos de todas las ternas 1-9 (voto1=2pts, voto2=1pt)
    const scores = {};
    for (let i = 1; i <= 9; i++) {
        data.forEach(item => {
            const v1 = item[`terna${i}_voto1`];
            const v2 = item[`terna${i}_voto2`];
            if (v1) {
                if (!scores[v1]) scores[v1] = { pts: 0, primeros: 0, segundos: 0, ternas: [] };
                scores[v1].pts += 2;
                scores[v1].primeros++;
                if (!scores[v1].ternas.includes(i)) scores[v1].ternas.push(i);
            }
            if (v2) {
                if (!scores[v2]) scores[v2] = { pts: 0, primeros: 0, segundos: 0, ternas: [] };
                scores[v2].pts += 1;
                scores[v2].segundos++;
                if (!scores[v2].ternas.includes(i)) scores[v2].ternas.push(i);
            }
        });
    }

    const sorted = Object.entries(scores)
        .sort((a, b) => b[1].pts - a[1].pts || b[1].primeros - a[1].primeros);

    if (sorted.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Sin votos aún.</p>';
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    let html = `<div class="ranking-global-list">`;

    sorted.forEach(([name, stat], idx) => {
        const medal  = medals[idx] || `<span style="color:var(--text-muted);font-weight:700;">#${idx+1}</span>`;
        const isTop3 = idx < 3;
        html += `
            <div class="ranking-row ${isTop3 ? 'ranking-top3' : ''}">
                <div class="ranking-pos">${medal}</div>
                <div class="ranking-name">${escapeHTML(name)}</div>
                <div class="ranking-pts">
                    <span class="ranking-pts-num">${stat.pts}</span>
                    <span class="ranking-pts-label">pts</span>
                </div>
                <div class="ranking-detail">
                    <span title="Votos de 2 pts">👑 ${stat.primeros}</span>
                    <span title="Votos de 1 pt" style="margin-left:.6rem;">⭐ ${stat.segundos}</span>
                    <span style="margin-left:.6rem;color:var(--text-muted);font-size:.78rem;">
                        Ternas: ${stat.ternas.sort((a,b)=>a-b).map(t=>'T'+t).join(', ')}
                    </span>
                </div>
            </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
}

// ----------------------------------------------------------
// IMPRIMIR — Genera ventana de impresión con secciones seleccionadas
// ----------------------------------------------------------
function abrirVistaPreviaImpresion() {
    const data = getStoredData();
    if (data.length === 0) {
        alert('No hay datos para imprimir.');
        return;
    }

    const opts = {
        ganadores: document.getElementById('print-opt-ganadores')?.checked,
        ranking:   document.getElementById('print-opt-ranking')?.checked,
        platino:   document.getElementById('print-opt-platino')?.checked,
        descargos: document.getElementById('print-opt-descargos')?.checked,
        gratitud:  document.getElementById('print-opt-gratitud')?.checked,
        colores:   document.getElementById('print-opt-colores')?.checked,
        cultura:   document.getElementById('print-opt-cultura')?.checked,
    };

    const colorEmoji = { ROJO: '🔴', AMARILLO: '🟡', VERDE: '🟢' };

    let html = `<!DOCTYPE html><html lang="es"><head>
        <meta charset="UTF-8">
        <title>Prod1g0 2026 — Reporte de la Noche</title>
        <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 2rem; max-width: 900px; margin: 0 auto; }
            h1 { text-align:center; font-size: 1.8rem; border-bottom: 3px solid #e5a93c; padding-bottom: .5rem; margin-bottom: 2rem; }
            h2 { font-size: 1.2rem; background: #f3f4f6; padding: .5rem 1rem; border-left: 4px solid #e5a93c; margin: 2rem 0 1rem; }
            table { width:100%; border-collapse:collapse; margin-bottom:1.5rem; }
            th { background:#1a1a2e; color:#e5a93c; padding:.5rem .8rem; text-align:left; font-size:.85rem; }
            td { padding:.45rem .8rem; border-bottom:1px solid #e5e7eb; font-size:.88rem; vertical-align:top; }
            tr:nth-child(even) td { background:#f9fafb; }
            .medal { font-size:1.3rem; }
            .pts { font-weight:700; color:#e5a93c; font-size:1.1rem; }
            .winner-row td { background:#fffbeb !important; font-weight:600; }
            .quote { font-style:italic; color:#374151; }
            @media print {
                body { padding: .5rem; }
                button { display:none; }
                h2 { break-before: avoid; }
            }
        </style>
    </head><body>
    <h1>🎬 PROD1G0 2026 — Reporte de la Noche</h1>
    <p style="text-align:center;color:#6b7280;margin-top:-1rem;margin-bottom:2rem;">
        Generado el ${new Date().toLocaleDateString('es-AR', {day:'2-digit',month:'long',year:'numeric'})} · ${data.length} participantes
    </p>`;

    // ── GANADORES POR TERNA ─────────────────────────────────────────────
    if (opts.ganadores) {
        html += `<h2>🏆 Ganadores por Terna</h2>
        <table><thead><tr><th>Terna</th><th>🥇 Ganador (1°)</th><th>Pts</th><th>🥈 Subcampeón (2°)</th><th>Pts</th></tr></thead><tbody>`;

        TERNAS_CONFIG.forEach(terna => {
            if (!terna.isPerson) return;
            const scores = {};
            data.forEach(item => {
                const v1 = item[`${terna.id}_voto1`];
                const v2 = item[`${terna.id}_voto2`];
                if (v1) { if (!scores[v1]) scores[v1]=0; scores[v1]+=2; }
                if (v2) { if (!scores[v2]) scores[v2]=0; scores[v2]+=1; }
            });
            const sorted = Object.entries(scores).sort((a,b)=>b[1]-a[1]);
            const g1 = sorted[0] || ['—', 0];
            const g2 = sorted[1] || ['—', 0];
            html += `<tr class="winner-row">
                <td>${escapeHTML(terna.title)}</td>
                <td>👑 ${escapeHTML(g1[0])}</td><td class="pts">${g1[1]}</td>
                <td>⭐ ${escapeHTML(g2[0])}</td><td class="pts">${g2[1]}</td>
            </tr>`;
        });
        // Terna 10
        const t10moments = data.filter(d => d.terna10);
        if (t10moments.length > 0) {
            html += `<tr><td colspan="5"><strong>Terna 10 — Mejores momentos:</strong><br>`;
            t10moments.forEach(m => { html += `<span class="quote">"${escapeHTML(m.terna10)}"</span> <small>— ${escapeHTML(m.guestName)}</small><br>`; });
            html += `</td></tr>`;
        }
        html += `</tbody></table>`;
    }

    // ── RANKING GLOBAL ──────────────────────────────────────────────────
    if (opts.ranking) {
        const scores = {};
        for (let i = 1; i <= 9; i++) {
            data.forEach(item => {
                const v1 = item[`terna${i}_voto1`];
                const v2 = item[`terna${i}_voto2`];
                if (v1) { if (!scores[v1]) scores[v1]=0; scores[v1]+=2; }
                if (v2) { if (!scores[v2]) scores[v2]=0; scores[v2]+=1; }
            });
        }
        const sorted = Object.entries(scores).sort((a,b)=>b[1]-a[1]);
        const medals = ['🥇','🥈','🥉'];
        html += `<h2>🥇 Ranking Global — Más votados (todas las ternas)</h2>
        <table><thead><tr><th>#</th><th>Nombre</th><th>Puntos totales</th></tr></thead><tbody>`;
        sorted.forEach(([name, pts], idx) => {
            html += `<tr ${idx<3?'class="winner-row"':''}>
                <td class="medal">${medals[idx]||'#'+(idx+1)}</td>
                <td>${escapeHTML(name)}</td>
                <td class="pts">${pts} pts</td>
            </tr>`;
        });
        html += `</tbody></table>`;
    }

    // ── PROD1G0 DE PLATINO ──────────────────────────────────────────────
    if (opts.platino) {
        const pScores = {};
        data.forEach(item => {
            const v1 = item['terna11_voto1'];
            const v2 = item['terna11_voto2'];
            if (v1) { if (!pScores[v1]) pScores[v1] = 0; pScores[v1] += 2; }
            if (v2) { if (!pScores[v2]) pScores[v2] = 0; pScores[v2] += 1; }
        });
        const pSorted = Object.entries(pScores).sort((a, b) => b[1] - a[1]);
        const pMedals = ['🥇', '🥈', '🥉'];
        html += `<h2>✨ PROD1G0 DE PLATINO — Premio Especial</h2>
        <table><thead><tr><th>#</th><th>Nombre</th><th>Puntos</th></tr></thead><tbody>`;
        if (pSorted.length === 0) {
            html += `<tr><td colspan="3" style="color:#9ca3af;font-style:italic;">Sin votos registrados.</td></tr>`;
        } else {
            pSorted.forEach(([name, pts], idx) => {
                html += `<tr ${idx === 0 ? 'class="winner-row"' : ''}>
                    <td class="medal">${pMedals[idx] || '#' + (idx + 1)}</td>
                    <td>${escapeHTML(name)}</td>
                    <td class="pts">${pts} pts</td>
                </tr>`;
            });
        }
        html += `</tbody></table>`;
    }

    // ── DESCARGOS ───────────────────────────────────────────────────────
    if (opts.descargos) {
        html += `<h2>🗯️ Descargos</h2><table><thead><tr><th>Participante</th><th>Descargo</th></tr></thead><tbody>`;
        data.filter(d => d.descargo).forEach(item => {
            html += `<tr><td><strong>${escapeHTML(item.guestName)}</strong></td><td class="quote">"${escapeHTML(item.descargo)}"</td></tr>`;
        });
        html += `</tbody></table>`;
    }

    // ── GRATITUDES ──────────────────────────────────────────────────────
    if (opts.gratitud) {
        html += `<h2>💖 Gratitudes</h2><table><thead><tr><th>Participante</th><th>Gratitud</th></tr></thead><tbody>`;
        data.filter(d => d.gratitud).forEach(item => {
            html += `<tr><td><strong>${escapeHTML(item.guestName)}</strong></td><td class="quote">"${escapeHTML(item.gratitud)}"</td></tr>`;
        });
        html += `</tbody></table>`;
    }

    // ── COLORES ─────────────────────────────────────────────────────────
    if (opts.colores) {
        html += `<h2>🎨 Lista de Nombres y Colores</h2>
        <table><thead><tr><th>Participante</th><th>Color</th><th>Asistencia</th><th>Acompañantes</th></tr></thead><tbody>`;
        data.forEach(item => {
            const ce = colorEmoji[item.colorEvento] || '';
            const acomp = Array.isArray(item.coloresAcompaniantes) && item.coloresAcompaniantes.length > 0
                ? item.coloresAcompaniantes.map(a => `${colorEmoji[a.color]||''} ${escapeHTML(a.nombre)}`).join(', ')
                : (item.nombresAcompaniantes || '—');
            html += `<tr>
                <td><strong>${escapeHTML(item.guestName)}</strong></td>
                <td>${ce} <strong>${escapeHTML(item.colorEvento||'—')}</strong></td>
                <td>${item.asistencia === 'ACOMPAÑADO' ? `👥 Acomp. (${item.cantAcompaniantes})` : '🧍 Solo/a'}</td>
                <td><small>${acomp}</small></td>
            </tr>`;
        });
        html += `</tbody></table>`;
    }

    // ── CULTURA & MÚSICA ────────────────────────────────────────────────
    if (opts.cultura) {
        html += `<h2>🎬 Gustos Culturales y Música</h2>
        <table><thead><tr><th>Participante</th><th>Películas</th><th>Actores</th><th>Música</th></tr></thead><tbody>`;
        data.forEach(item => {
            html += `<tr>
                <td><strong>${escapeHTML(item.guestName)}</strong></td>
                <td><small>${escapeHTML(item.favMovies||'—')}</small></td>
                <td><small>${escapeHTML(item.favActors||'—')}</small></td>
                <td><small>${escapeHTML(item.favMusic||'—')}</small></td>
            </tr>`;
        });
        html += `</tbody></table>`;
    }

    html += `<p style="text-align:center;color:#9ca3af;font-size:.8rem;margin-top:3rem;border-top:1px solid #e5e7eb;padding-top:1rem;">
        FIESTA PROD1G0 2026 · Producción integral de Omar Sef
    </p></body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
}


// ----------------------------------------------------------
// 7. EXPORTACIONES Y HERRAMIENTAS
// ----------------------------------------------------------
function initAdminActions() {
    document.getElementById('btn-export-csv').addEventListener('click', exportToCSV);
    document.getElementById('btn-export-json').addEventListener('click', exportToJSON);
    document.getElementById('btn-load-demo').addEventListener('click', loadDemoData);
    document.getElementById('btn-clear-all').addEventListener('click', clearAllData);
    document.getElementById('btn-delete-user').addEventListener('click', deleteUserData);
}

function exportToCSV() {
    const data = getStoredData();
    if (data.length === 0) {
        alert('No hay respuestas cargadas para exportar.');
        return;
    }

    const headers = [
        "Fecha", "Invitado", "Regalo Absurdo",
        "Descargo", "Gratitud",
        "Terna 1 (2pts)", "Terna 1 (1pt)",
        "Terna 2 (2pts)", "Terna 2 (1pt)",
        "Terna 3 (2pts)", "Terna 3 (1pt)",
        "Terna 4 (2pts)", "Terna 4 (1pt)",
        "Terna 5 (2pts)", "Terna 5 (1pt)",
        "Terna 6 (2pts)", "Terna 6 (1pt)",
        "Terna 7 (2pts)", "Terna 7 (1pt)",
        "Terna 8 (2pts)", "Terna 8 (1pt)",
        "Terna 9 (2pts)", "Terna 9 (1pt)",
        "Terna 10 (Momento)",
        "Peliculas Favoritas", "Actores Favoritos", "Cuadros Favoritos", "Musica Favorita"
    ];

    const rows = data.map(item => [
        `"${item.timestamp}"`,
        `"${item.guestName}"`,
        `"${item.confirmGift}"`,
        `"${(item.descargo || '').replace(/"/g, '""')}"`,
        `"${(item.gratitud || '').replace(/"/g, '""')}"`,
        `"${(item.terna1_voto1 || '').replace(/"/g, '""')}"`,
        `"${(item.terna1_voto2 || '').replace(/"/g, '""')}"`,
        `"${(item.terna2_voto1 || '').replace(/"/g, '""')}"`,
        `"${(item.terna2_voto2 || '').replace(/"/g, '""')}"`,
        `"${(item.terna3_voto1 || '').replace(/"/g, '""')}"`,
        `"${(item.terna3_voto2 || '').replace(/"/g, '""')}"`,
        `"${(item.terna4_voto1 || '').replace(/"/g, '""')}"`,
        `"${(item.terna4_voto2 || '').replace(/"/g, '""')}"`,
        `"${(item.terna5_voto1 || '').replace(/"/g, '""')}"`,
        `"${(item.terna5_voto2 || '').replace(/"/g, '""')}"`,
        `"${(item.terna6_voto1 || '').replace(/"/g, '""')}"`,
        `"${(item.terna6_voto2 || '').replace(/"/g, '""')}"`,
        `"${(item.terna7_voto1 || '').replace(/"/g, '""')}"`,
        `"${(item.terna7_voto2 || '').replace(/"/g, '""')}"`,
        `"${(item.terna8_voto1 || '').replace(/"/g, '""')}"`,
        `"${(item.terna8_voto2 || '').replace(/"/g, '""')}"`,
        `"${(item.terna9_voto1 || '').replace(/"/g, '""')}"`,
        `"${(item.terna9_voto2 || '').replace(/"/g, '""')}"`,
        `"${(item.terna10 || '').replace(/"/g, '""')}"`,
        `"${(item.favMovies || '').replace(/"/g, '""')}"`,
        `"${(item.favActors || '').replace(/"/g, '""')}"`,
        `"${(item.favPaintings || '').replace(/"/g, '""')}"`,
        `"${(item.favMusic || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Fiesta_Prodigo_2026_VotacionPonderada_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToJSON() {
    const data = getStoredData();
    if (data.length === 0) {
        alert('No hay respuestas cargadas para exportar.');
        return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Fiesta_Prodigo_2026_Backup.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function loadDemoData() {
    const demo = [
        {
            id: 'resp_demo_1',
            timestamp: new Date().toLocaleString(),
            guestName: 'Julián Vitolo (Gerardo)',
            confirmGift: 'Sí',
            descargo: 'El frío en la locación del galpón y los cambios de horario de último momento.',
            gratitud: 'Gracias a Omar y Laura por la confianza y el enorme respeto con los actores.',
            terna1_voto1: 'Cristina Suarez Quintana (Nora)',
            terna1_voto2: 'Teresa Juarez (Victoria)',
            terna2_voto1: 'Maximo Grecco (Agustin)',
            terna2_voto2: 'Hipolito Fusco (Diego)',
            terna3_voto1: 'Marco Salas (Fabian)',
            terna3_voto2: 'Fernando Tristo (Sergio)',
            terna4_voto1: 'Director (Omar)',
            terna4_voto2: 'Productora (Laura)',
            terna5_voto1: 'Elena Ramirez (Cecilia)',
            terna5_voto2: 'Rosalia Fernandez (Mariela)',
            terna6_voto1: 'Victor Fusco (El Tano)',
            terna6_voto2: 'Mario Distefano (Thomas)',
            terna7_voto1: 'Vecino 1 (Julian)',
            terna7_voto2: 'Custodio 1 (Francisco)',
            terna8_voto1: 'Maximo Grecco (Agustin)',
            terna8_voto2: 'Marco Salas (Fabian)',
            terna9_voto1: 'Cristina Suarez Quintana (Nora)',
            terna9_voto2: 'Elena Ramirez (Cecilia)',
            terna10: 'Cuando filmamos el plano secuencia del comedor y todo salió perfecto al primer intento.',
            favMovies: 'Cinema Paradiso, El Padrino, Nueve Reinas',
            favActors: 'Ricardo Darín, Al Pacino, Meryl Streep',
            favPaintings: 'La Noche Estrellada (Van Gogh), Guernica',
            favMusic: 'Queen, Charly García, Soda Stereo'
        },
        {
            id: 'resp_demo_2',
            timestamp: new Date().toLocaleString(),
            guestName: 'Mercedes Fusco (Lorena)',
            confirmGift: 'Sí',
            descargo: 'Tener que esperar horas peinada y maquillada con calor en verano.',
            gratitud: 'El clima hermoso entre los compañeros de elenco y la buena energía de todos.',
            terna1_voto1: 'Cristina Suarez Quintana (Nora)',
            terna1_voto2: 'Elena Ramirez (Cecilia)',
            terna2_voto1: 'Maximo Grecco (Agustin)',
            terna2_voto2: 'Mario Distefano (Thomas)',
            terna3_voto1: 'Fernando Tristo (Sergio)',
            terna3_voto2: 'Marco Salas (Fabian)',
            terna4_voto1: 'Director (Omar)',
            terna4_voto2: 'Fotografo Forense (Cristian)',
            terna5_voto1: 'Selin Tarkan (Hazal)',
            terna5_voto2: 'Sofia Fusco (Romina)',
            terna6_voto1: 'Victor Fusco (El Tano)',
            terna6_voto2: 'Tobias Miranda (Gabriel)',
            terna7_voto1: 'Abogado De Tristo',
            terna7_voto2: 'Vecino 1 (Julian)',
            terna8_voto1: 'Julián Vitolo (Gerardo)',
            terna8_voto2: 'Maximo Grecco (Agustin)',
            terna9_voto1: 'Cristina Suarez Quintana (Nora)',
            terna9_voto2: 'Teresa Juarez (Victoria)',
            terna10: 'El festejo grupal del último día al grito de ¡corte y queda definitivo!',
            favMovies: 'Amélie, Relatos Salvajes, El Secreto de sus Ojos',
            favActors: 'Cate Blanchett, Joaquin Phoenix',
            favPaintings: 'El Beso (Klimt), Frida Kahlo',
            favMusic: 'Dua Lipa, ABBA, David Bowie, Daft Punk'
        }
    ];

    // Guardar demo en Firestore + localStorage
    for (const entry of demo) { await fbSaveResponse(entry); }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    renderAdminPanel();
    alert('¡Datos de prueba cargados con éxito! Puedes ver el ranking ponderado en la pestaña de Ternas.');
}

async function clearAllData() {
    const data = await fbGetAllResponses() || getStoredData();
    if (data.length === 0) {
        alert('No hay datos almacenados para borrar.');
        return;
    }
    if (confirm(`⚠️ ¿Estás seguro?\n\nSe borrarán los datos de ${data.length} usuario(s).\nEsta acción no se puede deshacer.`)) {
        if (confirm('🔴 SEGUNDA CONFIRMACIÓN: ¿Confirmas el borrado total y definitivo de todos los datos?')) {
            for (const entry of data) { await fbDeleteResponse(entry.guestName); }
            localStorage.removeItem(STORAGE_KEY);
            renderAdminPanel();
            alert('✅ Todos los datos han sido eliminados. El sistema está en cero.');
        }
    }
}

async function deleteUserData() {
    const sel = document.getElementById('admin-delete-user-select');
    const userName = sel ? sel.value : '';
    if (!userName) {
        alert('Seleccioná un usuario primero.');
        return;
    }
    if (confirm(`⚠️ ¿Estás seguro de que querés borrar TODOS los datos de:\n\n"${userName}"?\n\nSe eliminará su encuesta y su contador de cambios. Esta acción no se puede deshacer.`)) {
        if (confirm(`🔴 SEGUNDA CONFIRMACIÓN: ¿Confirmas el borrado de "${userName}"?`)) {
            await fbDeleteResponse(userName);
            const data = getStoredData().filter(d => d.guestName !== userName);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            renderAdminPanel();
            alert(`✅ Datos de "${userName}" eliminados correctamente.`);
        }
    }
}

// ===========================================================
// HELPERS: Lista activa de usuarios + datos de personaje
// ===========================================================

// Devuelve la lista de usuarios (ACTORS_AND_CREW + extras del DB) — sync usando caché local
function getActiveUserList() {
    const db = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const extra = db.filter(u => !ACTORS_AND_CREW.includes(u.name)).map(u => u.name);
    return [...ACTORS_AND_CREW, ...extra].sort((a, b) => a.localeCompare(b));
}

// Lee la DB de usuarios: Firestore primero, localStorage como fallback
async function getUsuariosDB() {
    const fbData = await fbGetUsuarios();
    if (fbData !== null) {
        // Sincronizar localStorage con los datos de Firestore
        localStorage.setItem(USERS_KEY, JSON.stringify(fbData));
        return fbData;
    }
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    } catch(e) { return []; }
}

// Guarda un array completo de usuarios (Firestore + localStorage)
async function saveUsuariosDB(db) {
    for (const u of db) { await fbSaveUsuario(u); }
    localStorage.setItem(USERS_KEY, JSON.stringify(db));
}

// Devuelve los datos de personaje: Firestore primero, luego localStorage, luego base estática
async function getPersonajeData(name) {
    const base = PERSONAJES_DATA[name] || {
        nombre:      name.split('(')[0].trim(),
        personaje:   name.includes('(') ? name.match(/\(([^)]+)\)/)?.[1] || name : name,
        descripcion: 'Integrante del elenco y equipo de Prod1g0.',
        fun_fact:    '',
        emoji:       '🎭',
        color:       '#363b4e'
    };
    const sfn = safeFileName(name);
    const stored = await fbGetPersonaje(sfn)
        || (() => { try { return JSON.parse(localStorage.getItem('prodigo_personaje_edit_' + sfn)); } catch(e) { return null; } })();
    return stored ? { ...base, ...stored } : base;
}

// ===========================================================
// EDICIÓN DE NOMBRE/PERSONAJE DESDE EL PANEL ADMIN
// ===========================================================

async function guardarEdicionPersonaje(name, sfn, btn) {
    const useSfn = sfn || safeFileName(name);
    const nombreInput    = document.getElementById('edit-nombre-'    + useSfn);
    const personajeInput = document.getElementById('edit-personaje-' + useSfn);
    const emojiInput     = document.getElementById('edit-emoji-'     + useSfn);
    const colorInput     = document.getElementById('edit-color-'     + useSfn);
    const descInput      = document.getElementById('edit-desc-'      + useSfn);
    const funfactInput   = document.getElementById('edit-funfact-'   + useSfn);
    if (!nombreInput || !personajeInput) return;

    const nuevoNombre    = nombreInput.value.trim();
    const nuevoPersonaje = personajeInput.value.trim();
    if (!nuevoNombre || !nuevoPersonaje) {
        alert('El nombre y el personaje no pueden estar vacíos.');
        return;
    }

    const current = await getPersonajeData(name);
    const updated = {
        ...current,
        nombre:      nuevoNombre,
        personaje:   nuevoPersonaje,
        emoji:       emojiInput   ? emojiInput.value.trim()   : current.emoji,
        color:       colorInput   ? colorInput.value          : current.color,
        descripcion: descInput    ? descInput.value.trim()    : current.descripcion,
        fun_fact:    funfactInput ? funfactInput.value.trim()  : current.fun_fact,
    };
    await fbSavePersonaje(useSfn, updated);
    localStorage.setItem('prodigo_personaje_edit_' + useSfn, JSON.stringify(updated));

    if (btn) { btn.textContent = '✅ Guardado'; setTimeout(() => { btn.textContent = '💾 Guardar cambios'; }, 1800); }

    initPersonajesPage();
}

// ===========================================================
// GESTIÓN DE USUARIOS Y CLAVES
// ===========================================================

async function renderUsuariosAdminList() {
    const container = document.getElementById('usuarios-admin-list');
    if (!container) return;

    const db = await getUsuariosDB();
    // Construir lista completa: ACTORS_AND_CREW base + extras del DB
    const allNames = getActiveUserList();

    if (allNames.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Sin usuarios.</p>';
        return;
    }

    let html = '<div class="usuarios-list-grid">';
    allNames.forEach(name => {
        const record    = db.find(u => u.name === name);
        const isBase    = ACTORS_AND_CREW.includes(name);
        const clave     = record ? record.clave : (name.includes('Director (Omar)') ? '1111' : '0000');
        const isAdminU  = record ? (record.isAdmin || false) : name.includes('Director (Omar)');
        const sfn       = safeFileName(name);

        html += `
        <div class="usuario-row" id="urow-${sfn}" data-name="${escapeHTML(name)}">
            <div class="usuario-info">
                <span class="usuario-nombre">${escapeHTML(name)}</span>
                ${isAdminU ? '<span class="usuario-badge-admin">👑 ADMIN</span>' : ''}
                ${!isBase ? '<span class="usuario-badge-extra">nuevo</span>' : ''}
            </div>
            <div class="usuario-clave-wrap">
                <input class="usuario-clave-input" id="uclave-${sfn}" type="text"
                    value="${escapeHTML(clave)}" maxlength="20" placeholder="Clave">
                <button class="foto-save-btn urow-save-clave">💾</button>
            </div>
            <div class="usuario-acciones">
                <label class="usuario-admin-toggle" title="Es admin">
                    <input type="checkbox" class="urow-admin-chk" ${isAdminU ? 'checked' : ''}>
                    Admin
                </label>
                <button class="foto-delete-btn urow-delete" title="Eliminar usuario">🗑️</button>
            </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;

    // Adjuntar event listeners usando data-name para soportar nombres con comillas
    container.querySelectorAll('.usuario-row').forEach(row => {
        const rowName = row.dataset.name;
        row.querySelector('.urow-save-clave').addEventListener('click', () => guardarClave(rowName));
        row.querySelector('.urow-admin-chk').addEventListener('change', function() { toggleAdminFlag(rowName, this.checked); });
        row.querySelector('.urow-delete').addEventListener('click', () => eliminarUsuario(rowName));
    });
}

async function guardarClave(name) {
    const sfn = safeFileName(name);
    const input = document.getElementById('uclave-' + sfn);
    if (!input) return;
    const nuevaClave = input.value.trim();
    if (!nuevaClave) { alert('La clave no puede estar vacía.'); return; }

    const db = await getUsuariosDB();
    const idx = db.findIndex(u => u.name === name);
    const isAdm = name.includes('Director (Omar)');
    if (idx !== -1) {
        db[idx].clave = nuevaClave;
        await fbSaveUsuario(db[idx]);
    } else {
        const newU = { name, clave: nuevaClave, isAdmin: isAdm };
        db.push(newU);
        await fbSaveUsuario(newU);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(db));

    const btn = input.nextElementSibling;
    if (btn) { btn.textContent = '✅'; setTimeout(() => { btn.textContent = '💾'; }, 1800); }
}

async function toggleAdminFlag(name, isAdmin) {
    const db = await getUsuariosDB();
    const idx = db.findIndex(u => u.name === name);
    if (idx !== -1) {
        db[idx].isAdmin = isAdmin;
        await fbSaveUsuario(db[idx]);
    } else {
        const newU = { name, clave: '0000', isAdmin };
        db.push(newU);
        await fbSaveUsuario(newU);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(db));
}

async function eliminarUsuario(name) {
    if (!confirm('¿Eliminar al usuario "' + name + '"?\n\nSi es un usuario base del elenco, solo se eliminarán sus ajustes de clave custom; el nombre seguirá en la lista. Si es un usuario nuevo, se eliminará completamente.')) return;

    await fbDeleteUsuario(name);
    const db = (await getUsuariosDB()).filter(u => u.name !== name);
    localStorage.setItem(USERS_KEY, JSON.stringify(db));

    if (!ACTORS_AND_CREW.includes(name)) {
        await fbDeleteResponse(name);
        const survey = getStoredData().filter(d => d.guestName !== name);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(survey));
    }

    renderUsuariosAdminList();
    renderAdminPanel();
}

function abrirModalAgregarUsuario() {
    document.getElementById('nuevo-user-nombre').value = '';
    document.getElementById('nuevo-user-clave').value  = '';
    document.getElementById('nuevo-user-error').style.display = 'none';
    document.getElementById('modal-agregar-usuario').classList.add('active');
}

function cerrarModalAgregarUsuario() {
    document.getElementById('modal-agregar-usuario').classList.remove('active');
}

async function confirmarAgregarUsuario() {
    const nombre = document.getElementById('nuevo-user-nombre').value.trim();
    const clave  = document.getElementById('nuevo-user-clave').value.trim();
    const errEl  = document.getElementById('nuevo-user-error');

    errEl.style.display = 'none';
    if (!nombre) { errEl.textContent = '⚠️ El nombre no puede estar vacío.'; errEl.style.display = 'block'; return; }
    if (!clave)  { errEl.textContent = '⚠️ La clave no puede estar vacía.'; errEl.style.display = 'block'; return; }

    const db = await getUsuariosDB();
    if ([...ACTORS_AND_CREW, ...db.map(u => u.name)].includes(nombre)) {
        errEl.textContent = '⚠️ Ya existe un usuario con ese nombre.';
        errEl.style.display = 'block';
        return;
    }

    const newU = { name: nombre, clave, isAdmin: false };
    db.push(newU);
    await fbSaveUsuario(newU);
    localStorage.setItem(USERS_KEY, JSON.stringify(db));
    cerrarModalAgregarUsuario();
    renderUsuariosAdminList();
    const userSelect = document.getElementById('login-user-select');
    if (userSelect) {
        userSelect.innerHTML = '<option value="" disabled selected>Selecciona quién eres...</option>';
        getActiveUserList().forEach(u => {
            const opt = document.createElement('option');
            opt.value = u; opt.textContent = u;
            userSelect.appendChild(opt);
        });
    }
    populateActorDropdowns();
    alert('✅ Usuario "' + nombre + '" agregado correctamente.');
}

// ===========================================================
// ITINERARIO — edición desde el Panel Admin
// ===========================================================

const ITINERARIO_KEY = 'prodigo_2026_itinerario_v1';

const ITINERARIO_DEFAULT = [
    { badge: '1',  titulo: '🍸 Recepción',                    descripcion: 'Alfombra roja, bienvenida, entrega en secreto del regalo absurdo y primeros brindis.',           clase: '' },
    { badge: '2',  titulo: '🎲 Actividad 1',                   descripcion: 'Dinámica sorpresa armada a partir de sus películas, cuadros y gustos compartidos.',              clase: '' },
    { badge: '🪩', titulo: '💃 Tanda de Baile — Pista Abierta', descripcion: 'Música de fiesta y tragos para entrar en calor.',                                              clase: 'highlight-dance' },
    { badge: '4',  titulo: '🎤 Actividad 2',                   descripcion: 'Momento catártico y emotivo: descargos, anécdotas y agradecimientos sinceros.',                  clase: '' },
    { badge: '🪩', titulo: '🕺 Tanda de Baile — Pista Abierta', descripcion: 'Suenan los temas más votados por el equipo.',                                                   clase: 'highlight-dance' },
    { badge: '🏆', titulo: '🎬 Final — Ceremonia de Premiación', descripcion: 'Entrega de las 10 Ternas con los galardones y regalos absurdos aportados por todos.',          clase: 'highlight-awards' },
    { badge: '🔥', titulo: '🎉 Tanda de Baile y Limpieza',      descripcion: 'Fiesta total hasta que se apague la última luz del set.',                                       clase: 'highlight-dance' },
];

async function getItinerario() {
    const fbItems = await fbGetItinerario();
    if (fbItems) {
        localStorage.setItem(ITINERARIO_KEY, JSON.stringify(fbItems));
        return fbItems;
    }
    try {
        const stored = JSON.parse(localStorage.getItem(ITINERARIO_KEY));
        if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch(e) {}
    return ITINERARIO_DEFAULT.map(i => ({ ...i }));
}

async function saveItinerario(items) {
    await fbSaveItinerario(items);
    localStorage.setItem(ITINERARIO_KEY, JSON.stringify(items));
}

// Renderiza el timeline en la página principal a partir del storage
async function renderTimelineFromStorage() {
    const container = document.querySelector('#timeline-section .timeline-container');
    if (!container) return;
    const items = await getItinerario();
    container.innerHTML = items.map(item => `
        <div class="timeline-item ${escapeHTML(item.clase || '')}">
            <div class="timeline-badge">${escapeHTML(item.badge)}</div>
            <div class="timeline-content">
                <h4>${escapeHTML(item.titulo)}</h4>
                <p>${escapeHTML(item.descripcion)}</p>
            </div>
        </div>
    `).join('');
}

// Renderiza la lista editable del itinerario en el panel admin
async function renderItinerarioAdminList() {
    const container = document.getElementById('itinerario-admin-list');
    if (!container) return;
    const items = await getItinerario();
    container.innerHTML = '';

    items.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'itinerario-admin-row';
        row.innerHTML = `
            <div class="itin-row-header">
                <span class="itin-idx">#${idx + 1}</span>
                <input type="text" class="itin-badge-input foto-edit-input" placeholder="Badge (ej: 1, 🏆)" value="${escapeHTML(item.badge)}" data-field="badge">
                <select class="itin-clase-select" data-field="clase">
                    <option value="" ${!item.clase ? 'selected':''}>Normal</option>
                    <option value="highlight-dance" ${item.clase==='highlight-dance'?'selected':''}>💃 Baile</option>
                    <option value="highlight-awards" ${item.clase==='highlight-awards'?'selected':''}>🏆 Premios</option>
                </select>
                <div class="itin-row-actions">
                    <button type="button" class="foto-save-btn itin-save-btn" style="width:auto;padding:.3rem .8rem;">💾</button>
                    <button type="button" class="foto-delete-btn itin-delete-btn" ${items.length <= 1 ? 'disabled' : ''}>🗑️</button>
                </div>
            </div>
            <input type="text" class="itin-titulo-input foto-edit-input" style="margin-top:.4rem;" placeholder="Título del momento" value="${escapeHTML(item.titulo)}" data-field="titulo">
            <textarea class="itin-desc-input foto-edit-input" style="resize:vertical;min-height:52px;margin-top:.3rem;" placeholder="Descripción" data-field="descripcion">${escapeHTML(item.descripcion)}</textarea>
        `;

        row.querySelector('.itin-save-btn').addEventListener('click', async () => {
            const badge = row.querySelector('[data-field="badge"]').value.trim();
            const titulo = row.querySelector('[data-field="titulo"]').value.trim();
            const descripcion = row.querySelector('[data-field="descripcion"]').value.trim();
            const clase = row.querySelector('[data-field="clase"]').value;
            if (!titulo) { alert('El título no puede estar vacío.'); return; }
            const all = await getItinerario();
            all[idx] = { badge, titulo, descripcion, clase };
            await saveItinerario(all);
            renderTimelineFromStorage();
            const btn = row.querySelector('.itin-save-btn');
            btn.textContent = '✅'; setTimeout(() => { btn.textContent = '💾'; }, 1600);
        });

        row.querySelector('.itin-delete-btn').addEventListener('click', async () => {
            if (items.length <= 1) return;
            if (!confirm('¿Eliminar este ítem del itinerario?')) return;
            const all = await getItinerario();
            all.splice(idx, 1);
            await saveItinerario(all);
            renderItinerarioAdminList();
            renderTimelineFromStorage();
        });

        container.appendChild(row);
    });
}

async function agregarItemItinerario() {
    const all = await getItinerario();
    all.push({ badge: '★', titulo: 'Nuevo momento', descripcion: 'Descripción del momento.', clase: '' });
    await saveItinerario(all);
    renderItinerarioAdminList();
    renderTimelineFromStorage();
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Exponer funciones globales para los onclick del HTML (requerido con type="module")
Object.assign(window, {
    goToStep, unlockNextStep, validateAndNext, toggleAcompaniantes,
    resetWizardAndCloseModal, ternaWizardNext, ternaWizardPrev,
    toggleAccord, toggleSubTab, renderAdminPanel,
    startEditFromCambiarDatos, renderCambiarDatosPage,
    openPersonajeModal, guardarEdicionPersonaje,
    guardarClave, toggleAdminFlag, eliminarUsuario,
    abrirModalAgregarUsuario, cerrarModalAgregarUsuario, confirmarAgregarUsuario,
    agregarItemItinerario, handleFotoUpload, deleteFoto,
    setTernasMode, escapeHTML,
    abrirVistaPreviaImpresion,
    adminAgregarFecha, adminEliminarFecha, adminGuardarConfigFechas,
    abrirCambioFechaVoto, onToggleUsarFechaVotada
});
