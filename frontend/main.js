// Detectar API URL automáticamente
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : window.location.origin;

// Función para formatear precios con separadores de miles
function formatPrice(price) {
    if (!price && price !== 0) return '';
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price).replace('ARS', 'USD');
}

// Función para formatear números en tiempo real en inputs (con separadores de miles)
function formatNumberInput(input) {
    if (!input) return;
    
    // Guardar el valor sin formatear en un atributo oculto
    const hiddenField = document.createElement('input');
    hiddenField.type = 'hidden';
    hiddenField.id = input.id + '_clean';
    input.parentNode.insertBefore(hiddenField, input.nextSibling);
    
    input.addEventListener('input', () => {
        let val = input.value.replace(/\D/g, '');
        hiddenField.value = val; // Guardar valor limpio
        
        if (val) {
            val = new Intl.NumberFormat('es-AR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(parseInt(val));
        }
        input.value = val;
    });
}

var tokenSeguro = localStorage.getItem('token');
var datosUsuario = { id: null, rol: 'user', permiso: 'ver' };
let todosLosCierres = []; 

if (tokenSeguro) {
    try {
        const payload = JSON.parse(window.atob(tokenSeguro.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        datosUsuario.id = payload.id;
        datosUsuario.rol = payload.rol;
        datosUsuario.permiso = payload.permiso_nivel;
    } catch (e) { console.error("Error decodificando sesión"); }

    if (datosUsuario.rol === 'admin') {
        const contenedor = document.getElementById('contenedor-admin');
        if (contenedor) {
            contenedor.innerHTML = `
                <button onclick="window.location.href='${API_URL}/admin-panel'" style="
                    background: #343a40; color: white; border: none; padding: 10px 15px; 
                    border-radius: 5px; cursor: pointer; font-weight: bold;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 8px;">
                    ⚙️ PANEL ADMIN
                </button>
            `;
        }
    }
}

// Botón Logout 
document.getElementById('btn-logout').onclick = () => {
    if(confirm("¿Cerrar sesión?")) {
        localStorage.removeItem('token');
        window.location.href = `${API_URL}/login-page`;
    }
};

const iconCasa = L.icon({ iconUrl: 'icons/casa-verde.png', iconSize: [20, 20], iconAnchor: [16, 32] });
const iconEdificio = L.icon({ iconUrl: 'icons/edificio-morado.png', iconSize: [32, 32], iconAnchor: [16, 32] });
const iconCochera = L.icon({ iconUrl: 'icons/cochera.png', iconSize: [32, 32], iconAnchor: [16, 32] });

const limitesVCP = [[-31.4800, -64.5800], [-31.3600, -64.4200]];
const map = L.map('map', { maxBounds: limitesVCP, maxBoundsViscosity: 1.0 }).setView([-31.4241, -64.4978], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// OverlappingMarkerSpiderfier: maneja marcadores en la misma ubicación
const oms = new OverlappingMarkerSpiderfier(map, { keepSpiderfied: true, nearbyDistance: 25 });
let markersActivos = []; 

const modalForm = document.getElementById('modal-fondo');
const sidebar = document.getElementById('sidebar-detalle');

document.getElementById('btn-abrir-formulario').onclick = () => {
    if (datosUsuario.rol !== 'admin' && datosUsuario.permiso === 'ver') {
        alert("⛔ TU PLAN NO PERMITE CARGA. Solo puedes ver datos.");
        return;
    }
    modalForm.style.display = 'flex';
    // Inicializar formateo de precios
    formatNumberInput(document.getElementById('precio_publicacion'));
    formatNumberInput(document.getElementById('precio_cierre'));
};
document.getElementById('cancelar-form').onclick = () => modalForm.style.display = 'none';
document.getElementById('cerrar-detalle').onclick = () => sidebar.classList.remove('active');

function toggleCamposExtra() {
    const tipo = document.getElementById('tipo_propiedad').value;
    document.getElementById('extra-casa').style.display = (tipo === 'casa' || tipo === 'duplex') ? 'block' : 'none';
    document.getElementById('extra-depto').style.display = (tipo === 'departamento') ? 'grid' : 'none';
}

function crearPin(cierre) {
    if (!cierre.lat || !cierre.lng) return;

    // 1. Selección de icono según tipo
    const iconosPorTipo = {
        'departamento': iconEdificio,
        'oficina': iconEdificio,
        'cochera': iconCochera,
        'casa': iconCasa,
        'duplex': iconCasa
    };
    
    const icono = iconosPorTipo[cierre.tipo_propiedad] || iconCasa;

    const marker = L.marker([cierre.lat, cierre.lng], { icon: icono });
    marker.bindTooltip(`<b>${formatPrice(cierre.precio_cierre)}</b>`, { direction: 'top', offset: [0, -30] });

    marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        sidebar.classList.add('active');
        map.setView([cierre.lat, cierre.lng], 16, { animate: true });

        // 2. Preparación de datos para mostrar
        // La foto ya viene como URL absoluto de Cloudinary, no necesita prepending
        const imgHtml = cierre.foto ? `<img src="${cierre.foto}" class="foto-portada" loading="lazy">` : '';
        
        // Función auxiliar para mostrar SI/NO con color
        const siNo = (val) => (val == 1 || val == true || val === "true") 
            ? '<span class="valor-si">SI</span>' 
            : '<span class="valor-no">NO</span>';

        const esMio = cierre.usuario_id === datosUsuario.id;
        const btnBorrar = (datosUsuario.rol === 'admin' || esMio)
            ? `<button onclick="borrarPin(${cierre.id})" class="btn-borrar-sidebar">ELIMINAR PUBLICACIÓN</button>` : '';

        // 3. Renderizado del Sidebar
        document.getElementById('detalle').innerHTML = `
            ${imgHtml}
            <div style="padding: 10px 0;">
                <h3 style="margin:0; color:#333;">${cierre.direccion}</h3>
                <p style="margin:5px 0; color:#666; font-size:14px;">${cierre.barrio}, ${cierre.localidad}</p>
            </div>

            <p class="precio-pub-sidebar">Publicación: ${formatPrice(cierre.precio_publicacion) || 'S/D'}</p>
            <p class="precio-cierre-sidebar">Precio Cierre: ${formatPrice(cierre.precio_cierre)}</p>
            
            <div class="detalle-lista">
                <div class="detalle-item"><b>Tipo:</b> <span>${(cierre.tipo_propiedad || 'S/D').toUpperCase()}</span></div>
                <div class="detalle-item"><b>Dormitorios:</b> <span>${cierre.dormitorios || '0'}</span></div>
                <div class="detalle-item"><b>Baños:</b> <span>${cierre.banios || '0'}</span></div>
                <div class="detalle-item"><b>Cocheras:</b> <span>${cierre.cocheras || '0'}</span></div>
                <div class="detalle-item"><b>Antigüedad:</b> <span>${cierre.antiguedad || '0'} años</span></div>
                <div class="detalle-item"><b>M² Cubiertos:</b> <span>${cierre.m2_cubiertos || '0'} m²</span></div>
                <div class="detalle-item"><b>M² Terreno:</b> <span>${cierre.m2_terreno || '0'} m²</span></div>
                
                <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
                
                <div class="detalle-item"><b>Es PH:</b> <span>${siNo(cierre.es_ph)}</span></div>
                <div class="detalle-item"><b>Gas Natural:</b> <span>${siNo(cierre.gas)}</span></div>
                <div class="detalle-item"><b>Pileta:</b> <span>${siNo(cierre.pileta)}</span></div>
                <div class="detalle-item"><b>Amenities:</b> <span>${siNo(cierre.amenities)}</span></div>
                <div class="detalle-item"><b>Apto Crédito:</b> <span>${siNo(cierre.credito)}</span></div>
                <div class="detalle-item"><b>Cloacas:</b> <span>${siNo(cierre.cloacas)}</span></div>
                <div class="detalle-item"><b>Pavimento:</b> <span>${siNo(cierre.pavimento)}</span></div>
                
                <div class="detalle-item" style="margin-top:10px;">
                    <b>Días en Mercado:</b> <span>${cierre.dias_mercado || 'S/D'}</span>
                </div>
                
                <div style="margin-top:15px; padding:10px; background:#f9f9f9; border-radius:8px;">
                    <b style="font-size:13px; color:#444;">Observaciones:</b>
                    <p style="font-size:13px; color:#666; margin:5px 0;">${cierre.observaciones || 'Sin observaciones adicionales.'}</p>
                </div>
            </div>
            ${btnBorrar}
        `;
    });
}
    // Añadir marcador al mapa y registrarlo en OMS para spiderfy en caso de solapamiento
    marker.addTo(map);
    oms.addMarker(marker);
    markersActivos.push(marker);

document.getElementById("guardar").onclick = async () => {
    const btn = document.getElementById("guardar");
    
    // Validación completa
    if(!document.getElementById('direccion').value) return alert("Falta completar: DIRECCIÓN");
    if(!document.getElementById('localidad').value) return alert("Falta completar: LOCALIDAD");
    if(!document.getElementById('barrio').value) return alert("Falta completar: BARRIO");
    if(!document.getElementById('precio_cierre').value) return alert("Falta completar: PRECIO CIERRE");
    if(!document.getElementById('tipo_propiedad').value) return alert("Falta completar: TIPO DE PROPIEDAD");

    const formData = new FormData();
    
    // Recolección de datos - usar valores limpios para precios
    const campos = ['direccion','barrio','localidad','tipo_propiedad','piso','disposicion','m2_cubiertos','m2_terreno','antiguedad','banios','cocheras','dormitorios','observaciones'];
    campos.forEach(c => formData.append(c, document.getElementById(c).value || ''));
    
    // Precios: usar los valores sin formatear si existen, sino el valor del input
    const precioPubli = document.getElementById('precio_publicacion_clean')?.value || document.getElementById('precio_publicacion').value || '';
    const precioCierre = document.getElementById('precio_cierre_clean')?.value || document.getElementById('precio_cierre').value || '';
    formData.append('precio_publicacion', precioPubli);
    formData.append('precio_cierre', precioCierre);

    // Checkboxes
    const checks = ['es_ph','credito','gas','cloacas','pavimento','pileta','amenities'];
    checks.forEach(c => formData.append(c, document.getElementById(c).checked ? 1 : 0));

    const dValue = document.querySelector('input[name="dias"]:checked')?.value;
    formData.append('dias_mercado', dValue || '');

    const foto = document.getElementById('foto').files[0];
    if(foto) formData.append('foto', foto);

    btn.disabled = true;
    try {
        const res = await fetch(`${API_URL}/cierres`, {
            method: "POST",
            headers: { "Authorization": tokenSeguro },
            body: formData
        });
        if (res.ok) { 
            alert("✅ Guardado exitosamente"); 
            location.reload(); 
        } else {
            const error = await res.json();
            alert("❌ Error: " + (error.error || "No se pudo guardar"));
        }
    } catch (e) { 
        alert("❌ Error de conexión: " + e.message); 
    }
    finally { 
        btn.disabled = false; 
    }
};

// ... (Función actualizarBarrios y cargarDatos igual a la anterior) ...
async function borrarPin(id) {
    if(!confirm("¿Borrar este cierre?")) return;
    try {
        const res = await fetch(`${API_URL}/cierres/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': tokenSeguro }
        });
        if(res.ok) location.reload();
    } catch(e) { alert("Error al borrar"); }
}

async function cargarDatos() {
    const filtroId = localStorage.getItem('filtro_usuario_id');
    const filtroNombre = localStorage.getItem('filtro_usuario_nombre');
    let url = `${API_URL}/cierres`;

    if (filtroId && datosUsuario.rol === 'admin') {
        url = `${API_URL}/admin/cierres-usuario/${filtroId}`;
        if (!document.getElementById('aviso-filtro')) {
            document.body.insertAdjacentHTML('beforeend', `
                <div id="aviso-filtro" style="position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.85); color:white; padding:12px 25px; border-radius:30px; z-index:2000; font-weight:bold;">
                    Modo Espía: ${filtroNombre}
                    <button onclick="quitarFiltro()" style="margin-left:15px; background:#dc3545; color:white; border:none; border-radius:50%; width:25px; height:25px; cursor:pointer; font-weight:bold;">X</button>
                </div>
            `);
        }
    }

    try {
        const res = await fetch(url, { headers: { 'Authorization': tokenSeguro } });
        const data = await res.json();
        if (!Array.isArray(data)) return;
        todosLosCierres = data; 
        aplicarFiltrosEfectivos(); 
    } catch (err) { console.error("Error al cargar datos", err); }
}

// --- FUNCIONES DE FILTRADO (LIMPIADAS) ---
function aplicarFiltrosEfectivos() {
    const diasSeleccionados = document.querySelector('input[name="f-dias-radio"]:checked')?.value || 'todos';

    const v = {
        tipo: document.getElementById('filtro-tipo').value,
        localidad: document.getElementById('filtro-localidad').value, 
        barrio: document.getElementById('filtro-barrio').value,
        pDesde: parseFloat(document.getElementById('precio-desde').value) || 0,
        pHasta: parseFloat(document.getElementById('precio-hasta').value) || Infinity,
        dorms: parseInt(document.getElementById('f-dorms').value) || 0,
        banios: parseInt(document.getElementById('f-banios').value) || 0,
        cocheras: parseInt(document.getElementById('f-cocheras').value) || 0,
        antigMax: parseInt(document.getElementById('f-antig-hasta').value) || Infinity,
        m2cDesde: parseFloat(document.getElementById('m2-cub-desde').value) || 0,
        m2cHasta: parseFloat(document.getElementById('m2-cub-hasta').value) || Infinity,
        m2tDesde: parseFloat(document.getElementById('m2-terr-desde').value) || 0,
        m2tHasta: parseFloat(document.getElementById('m2-terr-hasta').value) || Infinity,
        dias: diasSeleccionados, 
        credito: document.getElementById('f-credito').checked,
        gas: document.getElementById('f-gas').checked,
        cloacas: document.getElementById('f-cloacas').checked,
        pavimento: document.getElementById('f-pavimento').checked,
        pileta: document.getElementById('f-pileta').checked,
        amenities: document.getElementById('f-amenities').checked
    };

    // Eliminar todos los marcadores previos (y desregistrarlos de OMS)
    markersActivos.forEach(m => {
        try { oms.removeMarker(m); } catch (e) {}
        if (map.hasLayer(m)) map.removeLayer(m);
    });
    markersActivos = [];

    const filtrados = todosLosCierres.filter(c => {
        return (v.tipo === 'todos' || c.tipo_propiedad === v.tipo) &&
               (v.localidad === 'todos' || c.localidad === v.localidad) &&
               (v.barrio === 'todos' || c.barrio === v.barrio) &&
               (c.precio_cierre >= v.pDesde && c.precio_cierre <= v.pHasta) &&
               (c.dormitorios >= v.dorms) &&
               (c.banios >= v.banios) &&
               (c.cocheras >= v.cocheras) &&
               ((c.antiguedad && c.antiguedad <= v.antigMax) || v.antigMax === Infinity) &&
               (c.m2_cubiertos >= v.m2cDesde && c.m2_cubiertos <= v.m2cHasta) &&
               (c.m2_terreno >= v.m2tDesde && c.m2_terreno <= v.m2tHasta) &&
               (v.dias === 'todos' || (c.dias_mercado && c.dias_mercado === v.dias)) &&
               (!v.credito || c.credito == 1) &&
               (!v.gas || c.gas == 1) &&
               (!v.cloacas || c.cloacas == 1) &&
               (!v.pavimento || c.pavimento == 1) &&
               (!v.pileta || c.pileta == 1) &&
               (!v.amenities || c.amenities == 1);
    });

    // Crear pines para los cierres filtrados
    filtrados.forEach(crearPin);
    
    // Feedback al usuario
    console.log(`Se muestran ${filtrados.length} de ${todosLosCierres.length} propiedades`);
}

function abrirMenuFiltros() {
    document.getElementById('panel-filtros').classList.add('activo');
}

function cerrarMenuFiltros() {
    document.getElementById('panel-filtros').classList.remove('activo');
}

// --- EVENTOS ---
document.getElementById('btn-abrir-filtros').onclick = abrirMenuFiltros;
document.getElementById('aplicar-filtros').onclick = () => { aplicarFiltrosEfectivos(); cerrarMenuFiltros(); };
document.getElementById('limpiar-filtros').onclick = () => {
    // Resetear todos los campos
    document.getElementById('filtro-tipo').value = 'todos';
    document.getElementById('filtro-localidad').value = 'todos';
    document.getElementById('filtro-barrio').value = 'todos';
    document.getElementById('precio-desde').value = '';
    document.getElementById('precio-hasta').value = '';
    document.getElementById('f-dorms').value = '';
    document.getElementById('f-banios').value = '';
    document.getElementById('f-cocheras').value = '';
    document.getElementById('f-antig-hasta').value = '';
    document.getElementById('m2-cub-desde').value = '';
    document.getElementById('m2-cub-hasta').value = '';
    document.getElementById('m2-terr-desde').value = '';
    document.getElementById('m2-terr-hasta').value = '';
    document.querySelector('input[name="f-dias-radio"][value="todos"]').checked = true;
    document.getElementById('f-credito').checked = false;
    document.getElementById('f-gas').checked = false;
    document.getElementById('f-cloacas').checked = false;
    document.getElementById('f-pavimento').checked = false;
    document.getElementById('f-pileta').checked = false;
    document.getElementById('f-amenities').checked = false;
    
    // Aplicar filtros y cerrar panel
    aplicarFiltrosEfectivos();
    cerrarMenuFiltros();
};

function quitarFiltro() {
    localStorage.removeItem('filtro_usuario_id');
    localStorage.removeItem('filtro_usuario_nombre');
    window.location.reload();
}

// --- FUNCIÓN PARA ORDENAR ALFABÉTICAMENTE ---
function ordenarBarrios(idSelect) {
    const select = document.getElementById(idSelect);
    if (!select) return;
    const options = Array.from(select.options);
    const primeraOpcion = options.shift(); 
    options.sort((a, b) => a.text.localeCompare(b.text));
    select.innerHTML = '';
    select.appendChild(primeraOpcion);
    options.forEach(opt => select.appendChild(opt));
}
// 1. Definimos los barrios por localidad
const barriosPorLocalidad = {
    "Villa Carlos Paz": [
        "Altos de las Vertientes", "Altos de Carlos Paz Country", "Altos de San Pedro", 
        "Becciu", "Carlos Paz Sierras", "Centro", "Centro Este", "Centro Oeste", 
        "Centro Viejo", "Costa Azul Norte", "Costa Azul Sur", "El Canal", 
        "El Fantasio", "Jose Muñoz", "La Cuesta", "La Loma", "La Quinta I", 
        "La Quinta II", "La Quinta III", "La Quinta IV", "Colinas", 
        "Las Ensenadas", "Las Malvinas", "Las Rosas", "Las Vertientes", 
        "Los Eucaliptus", "Manantiales", "Mi Refugio", "Miguel Muñoz A", 
        "Miguel Muñoz B", "Miguel Muñoz C", "Playa Perelli", "Playas de Oro", 
        "Santa Rita del Lago", "Sol y Lago", "Solares de las Ensenadas", 
        "Villa Dominguez", "Villa Independencia", "Villa Suiza", 
        "Villa del Lago", "Villa del Rio"
    ],
    "San Antonio": [
        "Centro", "Residencial", "El Dorado", "Riviera", 
        "Gruta de la Virgen", "Playas de Oro (San Antonio)"
    ],
    "Malagueño": [
        "Centro", "Yocsina", "La Perla", 
        "La Pankana", "Tejas 3", "Tejas 4", "Valle del Golf", "Cañitas", "San Sebastian", "La Arbolada Village", "Causana", "La Carmela"
    ],
    "Villa Santa Cruz del Lago": [
        "Sector Lago", "Sector Montaña", "Villa Parque Lago", "Lago Azul"
    ],
    "San Nicolas": [
        "San Nicolas", "Tierra Alta (Reserva Natural Village)"
    ],
    "Mayu Sumaj": [
        "Centro", "Los Algarrobos", "Villa Parque", "La Bancaria"
    ],
    "Villa Río Icho Cruz": [
        "Centro", "Solares de Icho Cruz", "Calle Quebrada"
    ],
    "Tala Huasi": [
        "Centro", "Piedras Negras"
    ],
    "Cuesta Blanca": [
        "Centro", "Eco-Barrio", "Diquecito"
    ],
    "Estancia Vieja": [
        "Lomas de Estancia Vieja", "Zona Monumento al Indio", "Sector Mirador"
    ],
    "Parque Siquiman": [
        "Villa Parque Siquiman", "Las Mojarras", "San Roque"
    ],
    "Cabalango": [
        "Centro", "Pampa de Cabalango", "Lomas de Cabalango"
    ],
    "Tanti": [
        "Centro", "Villa Parque Tanti", "El Pantanillo", "Villa Flor de Lis", 
        "Villa San Juras", "Tanti Nuevo", "Los Chañares"
    ],
    "Bialet Massé": [
        "Centro", "Mirador del Lago", "Villa Liliana", "San Roque (Bialet)"
    ]
};

// 2. Función para actualizar el selector de barrios (Formulario de carga)
function actualizarBarrios() {
    const localidadSeleccionada = document.getElementById("localidad").value;
    const selectBarrio = document.getElementById("barrio");

    // Limpiamos las opciones actuales
    selectBarrio.innerHTML = '<option value="" disabled selected>Seleccione Barrio</option>';

    // Si la localidad tiene barrios definidos, los agregamos
    if (barriosPorLocalidad[localidadSeleccionada]) {
        // Los ordenamos alfabéticamente antes de mostrarlos
        const barriosOrdenados = barriosPorLocalidad[localidadSeleccionada].sort();

        barriosOrdenados.forEach(barrio => {
            const option = document.createElement("option");
            option.value = barrio;
            option.text = barrio;
            selectBarrio.appendChild(option);
        });
        
        // Agregamos la opción "Otro" al final siempre
        const optionOtro = document.createElement("option");
        optionOtro.value = "Otro";
        optionOtro.text = "Otro / No listado";
        selectBarrio.appendChild(optionOtro);
    }
}

// 3. Función para actualizar el selector de barrios en el panel de filtros
function actualizarBarriosFiltro() {
    const localidadSeleccionada = document.getElementById("filtro-localidad").value;
    const selectBarrio = document.getElementById("filtro-barrio");

    // Limpiamos las opciones actuales
    selectBarrio.innerHTML = '<option value="todos">Todos los barrios</option>';

    // Si se selecciona "todos", solo mostramos la opción "Todos los barrios"
    if (localidadSeleccionada === 'todos') {
        return;
    }

    // Si la localidad tiene barrios definidos, los agregamos
    if (barriosPorLocalidad[localidadSeleccionada]) {
        // Los ordenamos alfabéticamente antes de mostrarlos
        const barriosOrdenados = barriosPorLocalidad[localidadSeleccionada].sort();

        barriosOrdenados.forEach(barrio => {
            const option = document.createElement("option");
            option.value = barrio;
            option.text = barrio;
            selectBarrio.appendChild(option);
        });
    }
}
document.getElementById('observaciones').addEventListener('input', function() {
    const count = this.value.length;
    document.getElementById('char-count').innerText = `${count} / 140`;
});

// Ejecución al iniciar
ordenarBarrios('barrio');
ordenarBarrios('filtro-barrio');

// Inicializar select de barrios en filtro con "Todos los barrios"
document.getElementById('filtro-barrio').innerHTML = '<option value="todos">Todos los barrios</option>';

cargarDatos();

// --- FUNCIONES PARA REPORTES ---

// Abrir modal de reportes
document.getElementById('btn-reportar').addEventListener('click', () => {
    document.getElementById('modal-reportar').style.display = 'flex';
});

// Cerrar modal de reportes
function cerrarModalReportar() {
    document.getElementById('modal-reportar').style.display = 'none';
    document.getElementById('texto-reporte').value = '';
    document.querySelector('input[name="tipo-reporte"][value="error"]').checked = true;
    document.getElementById('char-count-reporte').innerText = '0 / 500';
}

// Contar caracteres en textarea de reporte
document.getElementById('texto-reporte').addEventListener('input', function() {
    const count = this.value.length;
    document.getElementById('char-count-reporte').innerText = `${count} / 500`;
});

// Enviar reporte
document.getElementById('btn-enviar-reporte').addEventListener('click', async () => {
    const tipo = document.querySelector('input[name="tipo-reporte"]:checked').value;
    const mensaje = document.getElementById('texto-reporte').value.trim();

    if (!mensaje) {
        alert('⚠️ Por favor, escribe el error o sugerencia');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reportes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': tokenSeguro
            },
            body: JSON.stringify({ tipo, mensaje })
        });

        const data = await response.json();

        if (response.ok) {
            alert('✅ ¡Gracias! Tu reporte ha sido enviado correctamente.');
            cerrarModalReportar();
        } else {
            alert('❌ Error al enviar el reporte: ' + (data.error || 'Intenta nuevamente'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión. Intenta nuevamente.');
    }
});

// Cerrar modal al presionar Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modal-reportar');
        if (modal.style.display === 'flex') {
            cerrarModalReportar();
        }
    }
});