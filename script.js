// ==========================================================
// LÓGICA DE FIESTA PRÓDIGO 2026 - LOGIN INICIAL & FLUJO PERSONALIZADO
// ==========================================================

const STORAGE_KEY = 'prodigo_2026_responses_v4';
const SESSION_USER_KEY = 'prodigo_2026_active_user';
const MAX_EDITS = 3; // máximo de cambios permitidos por usuario

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
});

// ----------------------------------------------------------
// 1. SISTEMA DE LOGIN INICIAL (CLAVE 0000 / OMAR 1111)
// ----------------------------------------------------------
function initLoginSystem() {
    const userSelect = document.getElementById('login-user-select');
    const loginForm = document.getElementById('initial-login-form');
    const loginError = document.getElementById('initial-login-error');
    const btnLogoutApp = document.getElementById('btn-logout-app');

    // Poblar desplegable de login
    userSelect.innerHTML = '<option value="" disabled selected>Selecciona quién eres...</option>';
    ACTORS_AND_CREW.forEach(user => {
        const opt = document.createElement('option');
        opt.value = user;
        opt.textContent = user;
        userSelect.appendChild(opt);
    });

    // Validar Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedUser = userSelect.value;
        const passwordInput = document.getElementById('login-password-input').value.trim();

        // Validación de Claves:
        // Omar (Director) => Clave "1111" (Admin)
        // Todos los demás => Clave "0000"
        const isOmar = selectedUser.includes("Omar") || selectedUser.includes("Director (Omar)");
        let isValid = false;
        let isAdmin = false;

        if (isOmar) {
            if (passwordInput === "1111") {
                isValid = true;
                isAdmin = true;
            }
        } else {
            if (passwordInput === "0000") {
                isValid = true;
                isAdmin = false;
            }
        }

        if (isValid) {
            loginError.style.display = 'none';
            loggedUser = { name: selectedUser, isAdmin: isAdmin };
            sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(loggedUser));
            applyUserSession(loggedUser);
        } else {
            loginError.style.display = 'block';
            loginError.innerText = isOmar 
                ? '❌ Clave incorrecta para Director (Omar). Recuerda que tu clave de admin es 1111.' 
                : '❌ Clave incorrecta. Recuerda que la clave por defecto es 0000.';
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
        ACTORS_AND_CREW.forEach(name => {
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
    // Tras enviar: desbloquear nav, mostrar timeline
    maxAllowedStep = 4;
    if (loggedUser && !loggedUser.isAdmin) {
        document.getElementById('main-nav').style.display = 'flex';
        document.getElementById('timeline-section').style.display = 'block';
    }
    // Re-aplicar la sesión para refrescar estado de bloqueo SIN pasar por el login
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
