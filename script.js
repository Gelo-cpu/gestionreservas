// Diccionarios estáticos
const escuelasPorFacultad = {
    "Ingeniería": ["Sistemas", "Industrial", "Civil"],
    "Derecho": ["Derecho Civil", "Derecho Penal"],
    "Medicina": ["Enfermería", "Odontología", "General"]
};

const detallesPorTipo = {
    "Teatro": ["Romeo y Julieta", "Hamlet", "La Vida es Sueño"],
    "Danza": ["Marinera", "Salsa", "Folklore"],
    "Taller": ["Robótica", "Pintura", "Programación"],
    "Club de Lectura": ["Novelas Clásicas", "Poesía Contemporánea"],
    "Excursión": ["Museo Nacional", "Centro Histórico"],
    "Música": ["Coro", "Orquesta", "Guitarra"]
};

const lugarPorDetalle = {
    "Romeo y Julieta": "Sala de Teatro",
    "Hamlet": "Sala de Teatro",
    "La Vida es Sueño": "Sala de Teatro",
    "Marinera": "Auditorio Principal",
    "Salsa": "Sala Multiusos",
    "Folklore": "Auditorio Principal",
    "Robótica": "Laboratorio 1",
    "Pintura": "Sala de Arte",
    "Programación": "Laboratorio 2",
    "Novelas Clásicas": "Biblioteca Central",
    "Poesía Contemporánea": "Sala de Lectura",
    "Museo Nacional": "Museo Nacional",
    "Centro Histórico": "Plaza Mayor",
    "Coro": "Sala de Música",
    "Orquesta": "Auditorio Principal",
    "Guitarra": "Sala de Música"
};

// Variables de estado
let reservas = [];
let editIndex = -1;
const PAGE_SIZE = 10;
let currentPage = 1;

// Selectores del DOM
const tabs = document.querySelectorAll('#formTabs .nav-link');
const sectionEstudiante = document.getElementById('section-estudiante');
const sectionActividad = document.getElementById('section-actividad');
const sectionComplementaria = document.getElementById('section-complementaria');

const btnToActividad = document.getElementById('btnToActividad');
const btnBackEstudiante = document.getElementById('btnBackEstudiante');
const btnToComplementaria = document.getElementById('btnToComplementaria');
const btnBackActividad = document.getElementById('btnBackActividad');

const form = document.getElementById('reservaForm');

const inputNombre = document.getElementById('nombre');
const inputMatricula = document.getElementById('matricula');
const inputCorreo = document.getElementById('correo');
const inputTelefono = document.getElementById('telefono');
const selectFacultad = document.getElementById('facultad');
const selectEscuela = document.getElementById('escuela');
const selectCiclo = document.getElementById('ciclo');
const inputEdad = document.getElementById('edad');
const selectGenero = document.getElementById('genero');

const selectActividad = document.getElementById('actividad');
const selectDetalle = document.getElementById('detalle');
const inputFecha = document.getElementById('fecha');
const inputHoraInicio = document.getElementById('horaInicio');
const inputHoraFin = document.getElementById('horaFin');
const selectLugar = document.getElementById('lugar');

const inputMotivo = document.getElementById('motivo');
const inputNecesidades = document.getElementById('necesidades');
const chkNotificaciones = document.getElementById('notificaciones');
const chkTerminos = document.getElementById('terminos');

const tablaBody = document.getElementById('reservaTable');
const paginationUL = document.getElementById('pagination');


// Inicialización: popular selects
function init() {
    // Cargar facultades
    selectFacultad.innerHTML = '<option value="">Seleccione...</option>';
    Object.keys(escuelasPorFacultad).forEach(f => {
        const o = document.createElement('option');
        o.value = f;
        o.textContent = f;
        selectFacultad.appendChild(o);
    });

    // Inicial detalle y lugar vacíos
    selectDetalle.innerHTML = '<option value="">Seleccione...</option>';
    selectLugar.innerHTML = '<option value="">Seleccione...</option>';

    attachListeners();

    renderTabla();
    renderPagination();
}
init();

// Listeners y navegación
function attachListeners() {
    // Tabs: permitir click si está habilitada
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            if (tab.classList.contains('disabled')) return;
            const section = tab.dataset.section;
            showSection(section);
        });
    });

    // Dependencia Facultad -> Escuela
    selectFacultad.addEventListener('change', (e) => {
        const fac = e.target.value;
        selectEscuela.innerHTML = '<option value="">Seleccione...</option>';
        if (fac && escuelasPorFacultad[fac]) {
            escuelasPorFacultad[fac].forEach(esc => {
                const o = document.createElement('option');
                o.value = esc;
                o.textContent = esc;
                selectEscuela.appendChild(o);
            });
        }
    });

    // Dependencia Actividad -> Detalle
    selectActividad.addEventListener('change', () => {
        populateDetalle();
        selectLugar.innerHTML = '<option value="">Seleccione...</option>';
    });

    // Detalle -> Lugar (autocompletar)
    selectDetalle.addEventListener('change', () => {
        const det = selectDetalle.value;
        selectLugar.innerHTML = '<option value="">Seleccione...</option>';
        if (det && lugarPorDetalle[det]) {
            const o = document.createElement('option');
            o.value = lugarPorDetalle[det];
            o.textContent = lugarPorDetalle[det];
            selectLugar.appendChild(o);
        }
    });

    // Botones de navegación
    btnToActividad.addEventListener('click', (e) => {
        clearValidation();
        if (validarEstudiante()) {
            enableTab('actividad');
            showSection('actividad');
        } else {
            indicateMissingFields('estudiante');
        }
    });

    btnBackEstudiante.addEventListener('click', (e) => {
        showSection('estudiante');
    });

    btnToComplementaria.addEventListener('click', (e) => {
        clearValidation();
        if (validarActividad()) {
            enableTab('complementaria');
            showSection('complementaria');
        } else {
            indicateMissingFields('actividad');
        }
    });

    btnBackActividad.addEventListener('click', (e) => {
        showSection('actividad');
    });

    // Submit del formulario (Registrar o Actualizar)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearValidation();
        if (!validarComplementaria()) {
            indicateMissingFields('complementaria');
            return;
        }

        // construir objeto reserva
        const reservaObj = {
            nombre: inputNombre.value.trim(),
            matricula: inputMatricula.value.trim(),
            correo: inputCorreo.value.trim(),
            telefono: inputTelefono.value.trim(),
            facultad: selectFacultad.value,
            escuela: selectEscuela.value,
            ciclo: selectCiclo.value,
            edad: inputEdad.value,
            genero: selectGenero.value,
            tipoActividad: selectActividad.value,
            detalleActividad: selectDetalle.value,
            fecha: inputFecha.value,
            horaInicio: inputHoraInicio.value,
            horaFin: inputHoraFin.value,
            lugar: selectLugar.value,
            motivo: inputMotivo.value.trim(),
            necesidades: inputNecesidades.value.trim(),
            notificaciones: chkNotificaciones.checked
        };

        if (editIndex === -1) {
            reservas.push(reservaObj);
            currentPage = Math.ceil(reservas.length / PAGE_SIZE); // ir a última página
            alert('Reserva registrada correctamente.');
        } else {
            reservas[editIndex] = reservaObj;
            editIndex = -1;
            alert('Reserva actualizada correctamente.');
        }

        form.reset();
        // deshabilitar tabs posteriores
        disableTab('actividad');
        disableTab('complementaria');
        showSection('estudiante');
        renderTabla();
        renderPagination();
    });
}

// Secciones / Tabs helpers
function showSection(section) {
    // ocultar todas
    sectionEstudiante.classList.add('d-none');
    sectionActividad.classList.add('d-none');
    sectionComplementaria.classList.add('d-none');

    // activar la correspondiente
    if (section === 'estudiante') sectionEstudiante.classList.remove('d-none');
    if (section === 'actividad') sectionActividad.classList.remove('d-none');
    if (section === 'complementaria') sectionComplementaria.classList.remove('d-none');

    // actualizar pestañas visuales
    tabs.forEach(t => {
        t.classList.remove('active');
        if (t.dataset.section === section) t.classList.add('active');
    });
}

function enableTab(section) {
    tabs.forEach(t => { if (t.dataset.section === section) t.classList.remove('disabled'); });
}

function disableTab(section) {
    tabs.forEach(t => { if (t.dataset.section === section) t.classList.add('disabled'); });
}

// Validaciones (retornan true/false)
function clearValidation() {
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(i => {
        i.classList.remove('is-invalid');
        const next = i.nextElementSibling;
        if (next && next.classList && next.classList.contains('invalid-feedback')) {
            next.remove();
        }
    });
}

function markInvalid(el, message) {
    if (!el) return;
    el.classList.add('is-invalid');
    // insertar pequeño mensaje
    const small = document.createElement('div');
    small.className = 'invalid-feedback';
    small.textContent = message;
    // si hay ya un feedback, no duplicar
    if (!el.nextElementSibling || !el.nextElementSibling.classList || !el.nextElementSibling.classList.contains('invalid-feedback')) {
        el.parentNode.appendChild(small);
    }
}

function validarEstudiante() {
    let ok = true;
    clearValidation();

    if (!inputNombre.value.trim()) { markInvalid(inputNombre, 'Nombre es obligatorio');
        ok = false; }
    if (!/^[A-Za-z0-9]{8}$/.test(inputMatricula.value.trim())) { markInvalid(inputMatricula, 'Matrícula debe tener 8 caracteres alfanuméricos');
        ok = false; }
    if (!inputCorreo.value.trim() || !inputCorreo.value.trim().endsWith('@uch.pe')) { markInvalid(inputCorreo, 'Correo institucional válido (@uch.pe) requerido');
        ok = false; }
    if (!/^[0-9]{9}$/.test(inputTelefono.value.trim())) { markInvalid(inputTelefono, 'Teléfono debe tener 9 dígitos');
        ok = false; }
    if (!selectFacultad.value) { markInvalid(selectFacultad, 'Seleccione facultad');
        ok = false; }
    if (!selectEscuela.value) { markInvalid(selectEscuela, 'Seleccione escuela');
        ok = false; }
    if (!selectCiclo.value) { markInvalid(selectCiclo, 'Seleccione ciclo');
        ok = false; }
    if (!inputEdad.value || Number(inputEdad.value) < 15) { markInvalid(inputEdad, 'Edad inválida');
        ok = false; }
    if (!selectGenero.value) { markInvalid(selectGenero, 'Seleccione género');
        ok = false; }

    return ok;
}

function validarActividad() {
    let ok = true;
    clearValidation();

    if (!selectActividad.value) { markInvalid(selectActividad, 'Seleccione tipo de actividad');
        ok = false; }
    if (!selectDetalle.value) { markInvalid(selectDetalle, 'Seleccione detalle');
        ok = false; }
    if (!inputFecha.value) { markInvalid(inputFecha, 'Seleccione fecha');
        ok = false; }
    if (!inputHoraInicio.value) { markInvalid(inputHoraInicio, 'Seleccione hora inicio');
        ok = false; }
    if (!inputHoraFin.value) { markInvalid(inputHoraFin, 'Seleccione hora fin');
        ok = false; }
    if (!selectLugar.value) { markInvalid(selectLugar, 'Seleccione lugar');
        ok = false; }

    if (!ok) return false;

    // fecha >= hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSel = new Date(inputFecha.value + 'T00:00:00');
    if (fechaSel < hoy) { markInvalid(inputFecha, 'La fecha debe ser hoy o futura');
        ok = false; }

    // hora fin > hora inicio (comparar HH:MM)
    if (inputHoraFin.value <= inputHoraInicio.value) {
        markInvalid(inputHoraFin, 'Hora fin debe ser mayor que hora inicio');
        ok = false;
    }

    return ok;
}

function validarComplementaria() {
    clearValidation();
    if (!chkTerminos.checked) {
        markInvalid(chkTerminos, 'Debe aceptar términos y condiciones');
        return false;
    }
    return true;
}

// Helper UI: indicar campos faltantes cuando el usuario intenta avanzar
function indicateMissingFields(section) {
    const firstError = form.querySelector('.is-invalid');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        alert('Complete los campos obligatorios.');
    }
}

// Populate detalle select según actividad
function populateDetalle() {
    const tipo = selectActividad.value;
    selectDetalle.innerHTML = '<option value="">Seleccione...</option>';
    if (tipo && detallesPorTipo[tipo]) {
        detallesPorTipo[tipo].forEach(d => {
            const o = document.createElement('option');
            o.value = d;
            o.textContent = d;
            selectDetalle.appendChild(o);
        });
    }
}

// Render Tabla + CRUD
function renderTabla() {
    tablaBody.innerHTML = '';

    // paginación: calcular slice de reservas
    const total = reservas.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageItems = reservas.slice(start, end);

    pageItems.forEach((r, idx) => {
        const realIndex = start + idx;
        const tr = document.createElement('tr');

        const horario = `${r.horaInicio} – ${r.horaFin}`;
        tr.innerHTML = `
      <td>${realIndex + 1}</td>
      <td>${r.nombre}</td>
      <td>${r.matricula}</td>
      <td>${r.facultad} / ${r.escuela}</td>
      <td>${r.tipoActividad}</td>
      <td>${r.detalleActividad}</td>
      <td>${r.fecha}</td>
      <td>${r.horaInicio} – ${r.horaFin}</td>
      <td>${r.lugar}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" onclick="editarReserva(${realIndex})">Editar</button>
        <button class="btn btn-sm btn-danger me-1" onclick="eliminarReserva(${realIndex})">Eliminar</button>
        <button class="btn btn-sm btn-info" onclick="comprobanteReserva(${realIndex})">Comprobante</button>
      </td>
    `;
        tablaBody.appendChild(tr);
    });

    // attach buttons' listeners (delegation preferred)
    tablaBody.querySelectorAll('button').forEach(btn => {
        const action = btn.dataset.action;
        const index = Number(btn.dataset.index);
        if (action === 'edit') btn.addEventListener('click', () => editarReserva(index));
        if (action === 'delete') btn.addEventListener('click', () => eliminarReserva(index));
        if (action === 'pdf') btn.addEventListener('click', () => comprobanteReserva(index));
    });
}

// Paginación
function renderPagination() {
    paginationUL.innerHTML = '';
    const total = reservas.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // Prev
    const liPrev = document.createElement('li');
    liPrev.className = 'page-item' + (currentPage === 1 ? ' disabled' : '');
    liPrev.innerHTML = `<a class="page-link" href="#">Anterior</a>`;
    liPrev.addEventListener('click', (e) => { e.preventDefault(); if (currentPage > 1) { currentPage--;
            renderTabla();
            renderPagination(); } });
    paginationUL.appendChild(liPrev);

    // Números (si hay muchas páginas, mostrar ventana)
    const maxButtons = 7;
    let start = 1,
        end = totalPages;
    if (totalPages > maxButtons) {
        const half = Math.floor(maxButtons / 2);
        start = Math.max(1, currentPage - half);
        end = Math.min(totalPages, currentPage + half);
        if (start === 1) end = maxButtons;
        if (end === totalPages) start = totalPages - maxButtons + 1;
    }
    for (let i = start; i <= end; i++) {
        const li = document.createElement('li');
        li.className = 'page-item' + (i === currentPage ? ' active' : '');
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => { e.preventDefault();
            currentPage = i;
            renderTabla();
            renderPagination(); });
        paginationUL.appendChild(li);
    }

    // Next
    const liNext = document.createElement('li');
    liNext.className = 'page-item' + (currentPage === totalPages ? ' disabled' : '');
    liNext.innerHTML = `<a class="page-link" href="#">Siguiente</a>`;
    liNext.addEventListener('click', (e) => { e.preventDefault(); if (currentPage < totalPages) { currentPage++;
            renderTabla();
            renderPagination(); } });
    paginationUL.appendChild(liNext);
}

// CRUD Actions
function editarReserva(index) {
    const r = reservas[index];
    if (!r) return alert('Reserva no encontrada.');

    editIndex = index;

    // rellenar estudiante
    inputNombre.value = r.nombre;
    inputMatricula.value = r.matricula;
    inputCorreo.value = r.correo;
    inputTelefono.value = r.telefono;
    selectFacultad.value = r.facultad;
    // popular escuela según facultad
    selectEscuela.innerHTML = '<option value="">Seleccione...</option>';
    if (escuelasPorFacultad[r.facultad]) {
        escuelasPorFacultad[r.facultad].forEach(esc => {
            const o = document.createElement('option');
            o.value = esc;
            o.textContent = esc;
            if (esc === r.escuela) o.selected = true;
            selectEscuela.appendChild(o);
        });
    }
    selectCiclo.value = r.ciclo;
    inputEdad.value = r.edad;
    selectGenero.value = r.genero;

    // actividad
    selectActividad.value = r.tipoActividad;
    populateDetalle();
    selectDetalle.value = r.detalleActividad;

    // lugar
    selectLugar.innerHTML = '<option value="">Seleccione...</option>';
    const optLugar = document.createElement('option');
    optLugar.value = r.lugar;
    optLugar.textContent = r.lugar;
    optLugar.selected = true;
    selectLugar.appendChild(optLugar);

    inputFecha.value = r.fecha;
    inputHoraInicio.value = r.horaInicio;
    inputHoraFin.value = r.horaFin;

    // complementaria
    inputMotivo.value = r.motivo || '';
    inputNecesidades.value = r.necesidades || '';
    chkNotificaciones.checked = !!r.notificaciones;

    // habilitar y mostrar la primera pestaña (usuario puede navegar)
    enableTab('actividad');
    enableTab('complementaria');
    showSection('estudiante');
    // scroll to top of form
    sectionEstudiante.scrollIntoView({ behavior: 'smooth' });
}

function eliminarReserva(index) {
    const r = reservas[index];
    if (!r) return;
    const confirmDel = confirm(`Eliminar reserva de ${r.nombre} (${r.matricula})?`);
    if (!confirmDel) return;
    reservas.splice(index, 1);
    // ajustar página si estamos en última y quedó vacío
    const totalPages = Math.max(1, Math.ceil(reservas.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    renderTabla();
    renderPagination();
}

function comprobanteReserva(index) {
    const r = reservas[index];
    if (!r) return alert('Reserva no encontrada.');

    // crear ventana imprimible simple con estilo básico
    const win = window.open('', '_blank', 'width=800,height=600');
    const horario = `${r.horaInicio} - ${r.horaFin}`;
    const html = `
    <html>
    <head>
      <title>Comprobante - ${escapeHtml(r.nombre)}</title>
      <meta charset="utf-8">
      <style>
        body{font-family: Arial, sans-serif; padding:20px; color:#111}
        h2{margin-bottom:8px}
        .box{border:1px solid #ddd;padding:12px;border-radius:6px}
        .kv{margin:6px 0}
        .kv strong{display:inline-block; width:160px}
      </style>
    </head>
    <body>
      <h2>Comprobante de Reserva</h2>
      <div class="box">
        <div class="kv"><strong>Estudiante:</strong> ${escapeHtml(r.nombre)} (${escapeHtml(r.matricula)})</div>
        <div class="kv"><strong>Facultad / Escuela:</strong> ${escapeHtml(r.facultad)} / ${escapeHtml(r.escuela)}</div>
        <div class="kv"><strong>Actividad:</strong> ${escapeHtml(r.tipoActividad)} - ${escapeHtml(r.detalleActividad)}</div>
        <div class="kv"><strong>Fecha:</strong> ${escapeHtml(r.fecha)}</div>
        <div class="kv"><strong>Horario:</strong> ${escapeHtml(horario)}</div>
        <div class="kv"><strong>Lugar:</strong> ${escapeHtml(r.lugar)}</div>
        <hr>
        <div class="kv"><strong>Motivo:</strong> ${escapeHtml(r.motivo || 'N/A')}</div>
        <div class="kv"><strong>Necesidades:</strong> ${escapeHtml(r.necesidades || 'N/A')}</div>
        <div class="kv"><strong>Notificaciones:</strong> ${r.notificaciones ? 'Sí' : 'No'}</div>
      </div>
      <p style="margin-top:18px;font-size:0.9rem;color:#555">Emitido: ${new Date().toLocaleString()}</p>
      <script>window.onload = function(){ window.print(); }</script>
    </body>
    </html>
  `;
    win.document.open();
    win.document.write(html);
    win.document.close();
}

// Utility: escapar HTML para insertar en DOM/ventana imprimible
function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}