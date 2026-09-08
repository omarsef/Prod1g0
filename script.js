// ==========================================================
// LÓGICA DE FIESTA PRÓDIGO 2026 - LOGIN INICIAL & FLUJO PERSONALIZADO
// ==========================================================

const STORAGE_KEY = 'prodigo_2026_responses_v4';
const SESSION_USER_KEY = 'prodigo_2026_active_user';
const MAX_EDITS = 3; // máximo de cambios permitidos por usuario
const USERS_KEY   = 'prodigo_2026_users_v1'; // storage para usuarios y claves custom

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

// Metadatos de las 10 Ternas
const TERNAS_CONFIG = [
    { id: "terna1", title: "Terna 1: Actor más responsable (sabía la letra)", isPerson: true },
    { id: "terna2", title: "Terna 2: Menos responsable (nunca sabía la letra)", isPerson: true },
    { id: "terna3", title: "Terna 3: Repitió más veces una toma", isPerson: true },
    { id: "terna4", title: "Terna 4: Pasó por todos los roles", isPerson: true },
    { id: "terna5", title: "Terna 5: Revelación del set", isPerson: true },
    { id: "terna6", title: "Terna 6: Siempre se quiere ir temprano", isPerson: true },
    { id: "terna7", title: "Terna 7: Peor Artista", isPerson: true },
    { id: "terna8", title: "Terna 8: Mejor actor", isPerson: true },
    { id: "terna9", title: "Terna 9: Mejor actriz", isPerson: true },
    { id: "terna10", title: "Terna 10: Mejor momento del proyecto", isPerson: false }
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
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedUser = userSelect.value;
        const passwordInput = document.getElementById('login-password-input').value.trim();

        // Leer usuarios custom del localStorage
        const usersDB = getUsuariosDB();
        const userRecord = usersDB.find(u => u.name === selectedUser);

        let isValid = false;
        let isAdmin = false;

        if (userRecord) {
            // Usuario en la BD custom
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

function applyUserSession(user) {
    document.getElementById('initial-login-screen').style.display = 'none';
    document.getElementById('main-app-container').style.display = 'block';

    document.getElementById('header-user-name').innerText = user.name;
    document.getElementById('welcome-user-display').innerText = user.name;

    const adminBadge = document.getElementById('header-admin-badge');
    const btnAdminNav = document.getElementById('btn-open-admin-modal');

    if (user.isAdmin) {
        adminBadge.style.display = 'inline-block';
        btnAdminNav.style.display = 'inline-block';
        maxAllowedStep = 4;
        userHasCompleted = true;
        document.getElementById('main-nav').style.display = 'flex';
        document.getElementById('timeline-section').style.display = 'block';
        setTernasMode('scroll');
        setNavMode('site'); // admin ve el nav de site
        updateNavLockState();
        initPersonajesPage();
        goToStep(0);
        return;
    }

    adminBadge.style.display = 'none';
    btnAdminNav.style.display = 'none';

    const existing = getStoredData().find(d => d.guestName === user.name);

    if (existing) {
        const editCount = existing.editCount || 0;
        userHasCompleted = true;

        prefillFormWithExisting(existing);
        initPersonajesPage();

        if (editCount >= MAX_EDITS) {
            maxAllowedStep = 4;
            document.getElementById('main-nav').style.display = 'flex';
            document.getElementById('timeline-section').style.display = 'block';
            setTernasMode('scroll');
            setNavMode('site');
            updateNavLockState();
            goToStep(0);
            document.getElementById('max-changes-modal').classList.add('active');
        } else {
            maxAllowedStep = 4;
            document.getElementById('main-nav').style.display = 'flex';
            document.getElementById('timeline-section').style.display = 'block';
            setTernasMode('scroll');
            setNavMode('site');
            updateNavLockState();
            goToStep(0);
            showPreviousDataModal(existing, editCount);
        }
    } else {
        // Primera vez: wizard paso a paso
        userHasCompleted = false;
        maxAllowedStep = 0;
        currentTernaStep = 1;
        document.getElementById('main-nav').style.display = 'none';
        document.getElementById('timeline-section').style.display = 'none';
        setTernasMode('wizard');
        setNavMode('wizard');
        updateNavLockState();
        goToStep(0);
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
        const step = parseInt(btn.getAttribute('data-step'), 10);
        const isAdmin = loggedUser && loggedUser.isAdmin;
        if (isAdmin || step <= maxAllowedStep) {
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
    // Paso 1
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
    // Paso 6 = Cambiar Datos: lógica especial
    if (stepIndex === 6) {
        renderCambiarDatosPage();
    }

    // Páginas válidas: 0-6
    if (stepIndex < 0 || stepIndex > 6) return;

    // Bloqueo wizard: no saltar pasos no desbloqueados (solo aplica a pasos 1-4)
    const isAdmin = loggedUser && loggedUser.isAdmin;
    if (!isAdmin && stepIndex >= 1 && stepIndex <= 4 && stepIndex > maxAllowedStep) return;

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
    const errorId = `step${currentPage}-error`;
    const errorEl = document.getElementById(errorId);
    const missing = [];

    if (currentPage === 1) {
        // Paso 1: Descargos y Gratitud
        const descargo = document.getElementById('descargo-text');
        const gratitud = document.getElementById('gratitud-text');
        if (!descargo || !descargo.value.trim()) missing.push('Descargos');
        if (!gratitud || !gratitud.value.trim()) missing.push('Gratitud');
    }

    if (currentPage === 2) {
        // Paso 2: Ternas 1-9 (voto1 y voto2) + Terna 10
        for (let i = 1; i <= 9; i++) {
            const v1 = document.querySelector(`select[name="terna${i}_voto1"]`);
            const v2 = document.querySelector(`select[name="terna${i}_voto2"]`);
            if (!v1 || !v1.value) missing.push(`Terna ${i} — 1er nominado`);
            if (!v2 || !v2.value) missing.push(`Terna ${i} — 2do nominado`);
        }
        const t10 = document.getElementById('terna-10');
        if (!t10 || !t10.value.trim()) missing.push('Terna 10 — Mejor momento');
    }

    if (currentPage === 3) {
        // Paso 3: Gustos Culturales
        const fields = [
            { id: 'fav-movies',   label: 'Películas favoritas' },
            { id: 'fav-actors',   label: 'Actores/Actrices favoritos' },
            { id: 'fav-paintings', label: 'Cuadros / Arte favorito' },
            { id: 'fav-music',   label: 'Música para el baile' },
        ];
        fields.forEach(f => {
            const el = document.getElementById(f.id);
            if (!el || !el.value.trim()) missing.push(f.label);
        });
    }

    if (missing.length > 0) {
        if (errorEl) {
            errorEl.style.display = 'block';
            errorEl.innerHTML = `⚠️ Completá los siguientes campos antes de continuar:<br>
                <ul>${missing.map(m => `<li>${m}</li>`).join('')}</ul>`;
            errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return; // no avanza
    }

    // Sin errores: ocultar mensaje y avanzar
    if (errorEl) errorEl.style.display = 'none';
    unlockNextStep(currentPage + 1);
}

function initWizardNavigation() {
    // Nav superior: solo navega si el paso está desbloqueado (o es admin)
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const step = parseInt(btn.getAttribute('data-step'), 10);
            const isAdmin = loggedUser && loggedUser.isAdmin;
            if (isAdmin || step <= maxAllowedStep) {
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

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Verificar en tiempo real si el usuario ya alcanzó el límite de cambios
        // (cubre el caso de re-envío sin cerrar sesión)
        if (loggedUser && !loggedUser.isAdmin) {
            const liveData = getStoredData().find(d => d.guestName === loggedUser.name);
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

        const newEntry = {
            id: 'resp_' + Date.now(),
            timestamp: new Date().toLocaleString(),
            guestName: loggedUser ? loggedUser.name : 'Invitado',
            confirmGift: 'Sí',

            // Descargos y Gratitud (Paso 1)
            descargo: formData.get('descargo').trim(),
            gratitud: formData.get('gratitud').trim(),

            // Ternas 1 a 9 con 2 nominados (Voto 1: 2 pts, Voto 2: 1 pt)
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

            // Terna 10 texto descriptivo
            terna10: formData.get('terna10').trim(),

            // Gustos Culturales (Paso 3)
            favMovies: formData.get('favMovies').trim(),
            favActors: formData.get('favActors').trim(),
            favPaintings: formData.get('favPaintings').trim(),
            favMusic: formData.get('favMusic').trim()
        };

        // Calcular editCount: primer envío = 1, re-envíos = incrementar
        const data = getStoredData();
        const existingIndex = data.findIndex(d => d.guestName === newEntry.guestName);
        if (existingIndex !== -1) {
            const prevCount = data[existingIndex].editCount || 0;
            newEntry.editCount = prevCount + 1;
            data[existingIndex] = newEntry; // reemplaza
        } else {
            newEntry.editCount = 1;         // primera vez
            data.unshift(newEntry);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        // Descargar JSON individual (nombre fijo por usuario → reemplazable en repositorio2)
        downloadResponseJSON(newEntry);

        // Mostrar Modal de éxito con info de cambios restantes
        const remaining = MAX_EDITS - newEntry.editCount;
        const modalP = document.querySelector('#success-modal .modal-content p:first-of-type');
        if (modalP && remaining > 0) {
            modalP.innerHTML = `Tus datos quedaron guardados en producción de <strong>"Prod1g0 2026"</strong>.<br>
                <small style="color:var(--text-muted);">Podés modificarlos hasta ${remaining} vez${remaining !== 1 ? 'es' : ''} más.</small>`;
        } else if (modalP && remaining <= 0) {
            modalP.innerHTML = `Tus datos quedaron guardados en producción de <strong>"Prod1g0 2026"</strong>.<br>
                <small style="color:#f87171;">🔒 Alcanzaste el límite de cambios. Ya no podrás modificar tus datos.</small>`;
        }

        successModal.classList.add('active');
    });
}

function resetWizardAndCloseModal() {
    const successModal = document.getElementById('success-modal');
    successModal.classList.remove('active');
    document.getElementById('wrap-survey-form').reset();
    populateActorDropdowns();

    maxAllowedStep = 4;
    userHasCompleted = true;

    if (loggedUser && !loggedUser.isAdmin) {
        document.getElementById('main-nav').style.display = 'flex';
        document.getElementById('timeline-section').style.display = 'block';
        // Cambiar al nav de site: ocultar tabs del wizard, mostrar Personajes + Cambiar Datos
        setNavMode('site');
        initPersonajesPage();
    }

    if (loggedUser) refreshSessionState();
    goToStep(0);
}

// Refresca el estado de la sesión activa (contador de intentos, bloqueo, pre-relleno)
// sin volver a mostrar la pantalla de login. Se llama después de cada envío.
function refreshSessionState() {
    if (!loggedUser || loggedUser.isAdmin) return;
    const existing = getStoredData().find(d => d.guestName === loggedUser.name);
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
// DESCARGA DE JSON INDIVIDUAL POR RESPUESTA
// ----------------------------------------------------------
// Nombre seguro de archivo (sin tildes ni caracteres raros)
function safeFileName(guestName) {
    return (guestName || 'invitado')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_\- ]/g, '')
        .trim()
        .replace(/\s+/g, '_');
}

// Guarda el JSON en repositorio2 usando File System Access API (Chrome/Edge ≥86)
// Si el browser no la soporta, hace la descarga clásica como fallback.
// La primera vez le pide al usuario seleccionar la carpeta repositorio2;
// la guarda en sessionStorage para no volver a preguntar en la misma sesión.
async function downloadResponseJSON(entry) {
    const filename  = `prod1g0_${safeFileName(entry.guestName)}.json`;
    const content   = JSON.stringify(entry, null, 2);

    // ── Intento 1: File System Access API (escribe directo en disco) ──────────
    if ('showDirectoryPicker' in window) {
        try {
            // Reutilizar directorio elegido en esta sesión
            let dirHandle = window._repo2DirHandle || null;

            if (!dirHandle) {
                dirHandle = await window.showDirectoryPicker({
                    id: 'prodigo-repo2',
                    mode: 'readwrite',
                    startIn: 'downloads',
                });
                window._repo2DirHandle = dirHandle;
            }

            const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
            const writable   = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            return; // éxito → no hace falta el fallback
        } catch (err) {
            // Usuario canceló el picker o error de permisos → fallback silencioso
            console.warn('File System Access API falló, usando descarga clásica:', err);
            window._repo2DirHandle = null; // resetear para la próxima vez
        }
    }

    // ── Fallback: descarga clásica al directorio de Descargas del browser ─────
    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ----------------------------------------------------------
// CUENTA REGRESIVA — 31 de Octubre de 2026, 21:00 hs
// ----------------------------------------------------------
function initCountdown() {
    const TARGET_DATE = new Date('2026-10-31T21:00:00');

    function formatUnit(n) {
        return String(n).padStart(2, '0');
    }

    function buildCountdownHTML(diff) {
        if (diff <= 0) {
            return `<span class="cd-label">🎉 ¡HOY ES LA FIESTA!</span>`;
        }
        const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `
            <span class="cd-label">🎬 31 OCT 2026 — 21:00 HS</span>
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
        const now  = new Date();
        const diff = TARGET_DATE - now;
        const html = buildCountdownHTML(diff);

        const headerEl = document.getElementById('header-countdown');
        const bannerEl = document.getElementById('main-countdown-banner');

        if (headerEl) headerEl.innerHTML = html;
        if (bannerEl) bannerEl.innerHTML = html;
    }

    tick();
    setInterval(tick, 1000);
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
        nombre: 'Maximo Grecco',
        personaje: 'Agustín',
        descripcion: 'Agustín es el personaje que el espectador ama odiar. Maximo lo construyó con un placer evidente.',
        fun_fact: 'No siempre se sabía la letra... pero lo que hacía con eso era puro arte.',
        emoji: '😈',
        color: '#6a1b9a'
    },
    'Mercedes Fusco (Lorena)': {
        nombre: 'Mercedes Fusco',
        personaje: 'Lorena',
        descripcion: 'Lorena es la columna vertebral de la familia Fusco. Mercedes la cargó con una dignidad que emociona.',
        fun_fact: 'Sus escenas más emotivas se filmaron con calor extremo, y nadie lo hubiera notado.',
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
function initPersonajesPage() {
    const grid = document.getElementById('personajes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    getActiveUserList().forEach(name => {
        const data = getPersonajeData(name);
        const emoji = data.emoji;
        const color = data.color;
        // nombre real (actor/crew) es el protagonista
        const nombreReal  = data.nombre;
        const personaje   = data.personaje;
        const photoKey    = 'prodigo_photo_' + safeFileName(name);
        const storedPhoto = localStorage.getItem(photoKey);

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
    });
}

// Abre el modal con la ficha completa del personaje
function openPersonajeModal(name) {
    const data = getPersonajeData(name);

    const photoKey    = 'prodigo_photo_' + safeFileName(name);
    const storedPhoto = localStorage.getItem(photoKey);

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
function renderCambiarDatosPage() {
    if (!loggedUser || loggedUser.isAdmin) return;

    const existing = getStoredData().find(d => d.guestName === loggedUser.name);
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
}

function startEditFromCambiarDatos() {
    const existing = getStoredData().find(d => d.guestName === loggedUser.name);
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
    const pct = Math.round((n / 10) * 100);
    const bar = document.getElementById('terna-wizard-bar');
    const lbl = document.getElementById('terna-wizard-label');
    if (bar) bar.style.width = pct + '%';
    if (lbl) lbl.textContent = `Terna ${n} de 10`;

    // Botón anterior: ocultar en terna 1
    const prevBtn = document.getElementById('btn-terna-prev');
    if (prevBtn) prevBtn.style.visibility = n === 1 ? 'hidden' : 'visible';

    // Botón siguiente: cambiar texto en última terna
    const nextBtn = document.getElementById('btn-terna-next');
    if (nextBtn) nextBtn.textContent = n === 10 ? 'Finalizar votación ✓' : 'Siguiente terna ➔';

    // Limpiar error
    const err = document.getElementById('terna-step-error');
    if (err) err.style.display = 'none';
}

function ternaWizardNext() {
    const err = document.getElementById('terna-step-error');
    // Validar la terna actual
    let missing = [];
    if (currentTernaStep <= 9) {
        const v1 = document.querySelector(`select[name="terna${currentTernaStep}_voto1"]`);
        const v2 = document.querySelector(`select[name="terna${currentTernaStep}_voto2"]`);
        if (!v1 || !v1.value) missing.push('1er Nominado');
        if (!v2 || !v2.value) missing.push('2do Nominado');
    } else {
        const t10 = document.getElementById('terna-10');
        if (!t10 || !t10.value.trim()) missing.push('Descripción del mejor momento');
    }

    if (missing.length > 0) {
        if (err) {
            err.style.display = 'block';
            err.innerHTML = `⚠️ Completá: <strong>${missing.join(', ')}</strong> antes de continuar.`;
        }
        return;
    }
    if (err) err.style.display = 'none';

    if (currentTernaStep < 10) {
        showTernaStep(currentTernaStep + 1);
    } else {
        // Terminó todas las ternas → avanzar al paso 3
        unlockNextStep(3);
    }
}

function ternaWizardPrev() {
    if (currentTernaStep > 1) showTernaStep(currentTernaStep - 1);
}

// ----------------------------------------------------------
// 5. PANEL DE CONTROL DE PRODUCCIÓN (ACCESO DIRECTO PARA OMAR)
// ----------------------------------------------------------
function initAdminModal() {
    const btnOpenAdmin = document.getElementById('btn-open-admin-modal');
    const adminPanelModal = document.getElementById('admin-panel-modal');
    const btnCloseAdmin = document.getElementById('btn-close-admin');

    btnOpenAdmin.addEventListener('click', () => {
        renderAdminPanel();
        adminPanelModal.classList.add('active');
    });

    btnCloseAdmin.addEventListener('click', () => {
        adminPanelModal.classList.remove('active');
    });
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

function renderAdminPanel() {
    const data = getStoredData();

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
function renderFotosAdminGrid() {
    const grid = document.getElementById('fotos-admin-grid');
    if (!grid) return;
    grid.innerHTML = '';

    getActiveUserList().forEach(name => {
        const pdata       = getPersonajeData(name);
        const nombreReal  = pdata.nombre;
        const personaje   = pdata.personaje;
        const color       = pdata.color;
        const emoji       = pdata.emoji;
        const photoKey    = 'prodigo_photo_' + safeFileName(name);
        const stored      = localStorage.getItem(photoKey);
        const sfn         = safeFileName(name);

        const cell = document.createElement('div');
        cell.className = 'foto-admin-cell';
        // Usamos data-name para evitar problemas con comillas en nombres como Victor Fusco
        cell.dataset.name = name;

        cell.innerHTML = `
            <div class="foto-admin-preview" id="prev-${sfn}">
                ${stored
                    ? `<img src="${stored}" alt="${escapeHTML(nombreReal)}">`
                    : `<span class="foto-admin-emoji" style="color:${color}">${emoji}</span>`}
            </div>

            <div class="foto-edit-fields">
                <label class="foto-edit-label">Nombre real</label>
                <input class="foto-edit-input" id="edit-nombre-${sfn}" type="text" value="${escapeHTML(nombreReal)}" placeholder="Nombre real">
                <label class="foto-edit-label" style="margin-top:.4rem;">Personaje</label>
                <input class="foto-edit-input" id="edit-personaje-${sfn}" type="text" value="${escapeHTML(personaje)}" placeholder="Nombre del personaje">
                <button type="button" class="foto-save-btn foto-save-personaje">💾 Guardar</button>
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
    });
}

function handleFotoUpload(input, name, sfn) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
        alert('La imagen es demasiado grande. Usá una foto de menos de 800 KB.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const photoKey = 'prodigo_photo_' + (sfn || safeFileName(name));
        localStorage.setItem(photoKey, e.target.result);
        renderFotosAdminGrid();
        initPersonajesPage();
    };
    reader.readAsDataURL(file);
}

function deleteFoto(name, sfn) {
    if (!confirm('¿Eliminar la foto de ' + name + '?')) return;
    const photoKey = 'prodigo_photo_' + (sfn || safeFileName(name));
    localStorage.removeItem(photoKey);
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
        const used      = item.editCount || 1;
        const remaining = Math.max(0, MAX_EDITS - used);
        const locked    = remaining === 0;
        const pct       = Math.round((used / MAX_EDITS) * 100);
        return `
            <div class="intentos-row">
                <div class="intentos-name">${escapeHTML(item.guestName)}</div>
                <div class="intentos-bar-wrap">
                    <div class="intentos-bar" style="width:${pct}%;background:${locked ? '#f87171' : 'var(--gold-primary)'}"></div>
                </div>
                <div class="intentos-count ${locked ? 'intentos-locked' : ''}">
                    ${locked ? '🔒 BLOQUEADO' : `${remaining} cambio${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`}
                    <small>(${used}/${MAX_EDITS} usados)</small>
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

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted);">No hay registros aún.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const ch  = item.editCount || 1;
        const rem = Math.max(0, MAX_EDITS - ch);
        const tr  = document.createElement('tr');
        tr.innerHTML = `
            <td><small>${escapeHTML(item.timestamp)}</small></td>
            <td><strong>${escapeHTML(item.guestName)}</strong></td>
            <td style="text-align:center;">
                <span style="color:${rem === 0 ? '#f87171' : 'var(--gold-primary)'}">
                    ${rem === 0 ? '🔒' : ch + '/' + MAX_EDITS}
                </span>
            </td>
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

function loadDemoData() {
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

    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    renderAdminPanel();
    alert('¡Datos de prueba cargados con éxito! Puedes ver el ranking ponderado en la pestaña de Ternas.');
}

function clearAllData() {
    const data = getStoredData();
    if (data.length === 0) {
        alert('No hay datos almacenados para borrar.');
        return;
    }
    if (confirm(`⚠️ ¿Estás seguro?\n\nSe borrarán los datos de ${data.length} usuario(s).\nEsta acción no se puede deshacer.`)) {
        if (confirm('🔴 SEGUNDA CONFIRMACIÓN: ¿Confirmas el borrado total y definitivo de todos los datos?')) {
            localStorage.removeItem(STORAGE_KEY);
            renderAdminPanel();
            alert('✅ Todos los datos han sido eliminados. El sistema está en cero.');
        }
    }
}

function deleteUserData() {
    const sel = document.getElementById('admin-delete-user-select');
    const userName = sel ? sel.value : '';
    if (!userName) {
        alert('Seleccioná un usuario primero.');
        return;
    }
    if (confirm(`⚠️ ¿Estás seguro de que querés borrar TODOS los datos de:\n\n"${userName}"?\n\nSe eliminará su encuesta y su contador de cambios. Esta acción no se puede deshacer.`)) {
        if (confirm(`🔴 SEGUNDA CONFIRMACIÓN: ¿Confirmas el borrado de "${userName}"?`)) {
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

// Devuelve la lista de usuarios (ACTORS_AND_CREW + extras del DB)
function getActiveUserList() {
    const db = getUsuariosDB();
    const extra = db.filter(u => !ACTORS_AND_CREW.includes(u.name)).map(u => u.name);
    return [...ACTORS_AND_CREW, ...extra].sort((a, b) => a.localeCompare(b));
}

// Lee la DB de usuarios del localStorage
function getUsuariosDB() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    } catch(e) { return []; }
}

function saveUsuariosDB(db) {
    localStorage.setItem(USERS_KEY, JSON.stringify(db));
}

// Devuelve los datos de personaje para un nombre de usuario,
// combinando los datos estáticos con las ediciones guardadas en localStorage.
function getPersonajeData(name) {
    const base = PERSONAJES_DATA[name] || {
        nombre:      name.split('(')[0].trim(),
        personaje:   name.includes('(') ? name.match(/\(([^)]+)\)/)?.[1] || name : name,
        descripcion: 'Integrante del elenco y equipo de Prod1g0.',
        fun_fact:    '',
        emoji:       '🎭',
        color:       '#363b4e'
    };
    const overrideKey = 'prodigo_personaje_edit_' + safeFileName(name);
    try {
        const stored = JSON.parse(localStorage.getItem(overrideKey));
        if (stored) return { ...base, ...stored };
    } catch(e) {}
    return base;
}

// ===========================================================
// EDICIÓN DE NOMBRE/PERSONAJE DESDE EL PANEL ADMIN
// ===========================================================

function guardarEdicionPersonaje(name, sfn, btn) {
    const useSfn = sfn || safeFileName(name);
    const nombreInput    = document.getElementById('edit-nombre-' + useSfn);
    const personajeInput = document.getElementById('edit-personaje-' + useSfn);
    if (!nombreInput || !personajeInput) return;

    const nuevoNombre    = nombreInput.value.trim();
    const nuevoPersonaje = personajeInput.value.trim();
    if (!nuevoNombre || !nuevoPersonaje) {
        alert('El nombre y el personaje no pueden estar vacíos.');
        return;
    }

    const overrideKey = 'prodigo_personaje_edit_' + useSfn;
    const current = getPersonajeData(name);
    localStorage.setItem(overrideKey, JSON.stringify({
        ...current,
        nombre:    nuevoNombre,
        personaje: nuevoPersonaje
    }));

    // Feedback visual en el botón
    if (btn) { btn.textContent = '✅ Guardado'; setTimeout(() => { btn.textContent = '💾 Guardar'; }, 1800); }

    initPersonajesPage();
}

// ===========================================================
// GESTIÓN DE USUARIOS Y CLAVES
// ===========================================================

function renderUsuariosAdminList() {
    const container = document.getElementById('usuarios-admin-list');
    if (!container) return;

    const db = getUsuariosDB();
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
        const nameEsc   = name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");

        html += `
        <div class="usuario-row" id="urow-${sfn}">
            <div class="usuario-info">
                <span class="usuario-nombre">${escapeHTML(name)}</span>
                ${isAdminU ? '<span class="usuario-badge-admin">👑 ADMIN</span>' : ''}
                ${!isBase ? '<span class="usuario-badge-extra">nuevo</span>' : ''}
            </div>
            <div class="usuario-clave-wrap">
                <input class="usuario-clave-input" id="uclave-${sfn}" type="text"
                    value="${escapeHTML(clave)}" maxlength="20" placeholder="Clave">
                <button class="foto-save-btn" onclick="guardarClave('${nameEsc}')">💾</button>
            </div>
            <div class="usuario-acciones">
                <label class="usuario-admin-toggle" title="Es admin">
                    <input type="checkbox" ${isAdminU ? 'checked' : ''}
                        onchange="toggleAdminFlag('${nameEsc}', this.checked)">
                    Admin
                </label>
                <button class="foto-delete-btn" onclick="eliminarUsuario('${nameEsc}')" title="Eliminar usuario">🗑️</button>
            </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

function guardarClave(name) {
    const sfn = safeFileName(name);
    const input = document.getElementById('uclave-' + sfn);
    if (!input) return;
    const nuevaClave = input.value.trim();
    if (!nuevaClave) { alert('La clave no puede estar vacía.'); return; }

    const db = getUsuariosDB();
    const idx = db.findIndex(u => u.name === name);
    const isAdm = name.includes('Director (Omar)');
    if (idx !== -1) {
        db[idx].clave = nuevaClave;
    } else {
        db.push({ name, clave: nuevaClave, isAdmin: isAdm });
    }
    saveUsuariosDB(db);

    const btn = input.nextElementSibling;
    if (btn) { btn.textContent = '✅'; setTimeout(() => { btn.textContent = '💾'; }, 1800); }
}

function toggleAdminFlag(name, isAdmin) {
    const db = getUsuariosDB();
    const idx = db.findIndex(u => u.name === name);
    if (idx !== -1) {
        db[idx].isAdmin = isAdmin;
    } else {
        db.push({ name, clave: '0000', isAdmin });
    }
    saveUsuariosDB(db);
}

function eliminarUsuario(name) {
    if (!confirm('¿Eliminar al usuario "' + name + '"?\n\nSi es un usuario base del elenco, solo se eliminarán sus ajustes de clave custom; el nombre seguirá en la lista. Si es un usuario nuevo, se eliminará completamente.')) return;

    // Eliminar de la DB de usuarios
    const db = getUsuariosDB().filter(u => u.name !== name);
    saveUsuariosDB(db);

    // Si no es base, también eliminar sus datos de encuesta
    if (!ACTORS_AND_CREW.includes(name)) {
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

function confirmarAgregarUsuario() {
    const nombre = document.getElementById('nuevo-user-nombre').value.trim();
    const clave  = document.getElementById('nuevo-user-clave').value.trim();
    const errEl  = document.getElementById('nuevo-user-error');

    errEl.style.display = 'none';
    if (!nombre) { errEl.textContent = '⚠️ El nombre no puede estar vacío.'; errEl.style.display = 'block'; return; }
    if (!clave)  { errEl.textContent = '⚠️ La clave no puede estar vacía.'; errEl.style.display = 'block'; return; }

    const db = getUsuariosDB();
    if ([...ACTORS_AND_CREW, ...db.map(u => u.name)].includes(nombre)) {
        errEl.textContent = '⚠️ Ya existe un usuario con ese nombre.';
        errEl.style.display = 'block';
        return;
    }

    db.push({ name: nombre, clave, isAdmin: false });
    saveUsuariosDB(db);
    cerrarModalAgregarUsuario();
    renderUsuariosAdminList();
    // Refrescar dropdown de login
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

function getItinerario() {
    try {
        const stored = JSON.parse(localStorage.getItem(ITINERARIO_KEY));
        if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch(e) {}
    return ITINERARIO_DEFAULT.map(i => ({ ...i }));
}

function saveItinerario(items) {
    localStorage.setItem(ITINERARIO_KEY, JSON.stringify(items));
}

// Renderiza el timeline en la página principal a partir del storage
function renderTimelineFromStorage() {
    const container = document.querySelector('#timeline-section .timeline-container');
    if (!container) return;
    const items = getItinerario();
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
function renderItinerarioAdminList() {
    const container = document.getElementById('itinerario-admin-list');
    if (!container) return;
    const items = getItinerario();
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

        row.querySelector('.itin-save-btn').addEventListener('click', () => {
            const badge = row.querySelector('[data-field="badge"]').value.trim();
            const titulo = row.querySelector('[data-field="titulo"]').value.trim();
            const descripcion = row.querySelector('[data-field="descripcion"]').value.trim();
            const clase = row.querySelector('[data-field="clase"]').value;
            if (!titulo) { alert('El título no puede estar vacío.'); return; }
            const all = getItinerario();
            all[idx] = { badge, titulo, descripcion, clase };
            saveItinerario(all);
            renderTimelineFromStorage();
            const btn = row.querySelector('.itin-save-btn');
            btn.textContent = '✅'; setTimeout(() => { btn.textContent = '💾'; }, 1600);
        });

        row.querySelector('.itin-delete-btn').addEventListener('click', () => {
            if (items.length <= 1) return;
            if (!confirm('¿Eliminar este ítem del itinerario?')) return;
            const all = getItinerario();
            all.splice(idx, 1);
            saveItinerario(all);
            renderItinerarioAdminList();
            renderTimelineFromStorage();
        });

        container.appendChild(row);
    });
}

function agregarItemItinerario() {
    const all = getItinerario();
    all.push({ badge: '★', titulo: 'Nuevo momento', descripcion: 'Descripción del momento.', clase: '' });
    saveItinerario(all);
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
