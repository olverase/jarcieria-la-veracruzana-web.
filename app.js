// --- CONFIGURACIÓN ---
// ¡OJO! Aquí pega LA MISMA URL DEL SCRIPT que usas en la App Móvil
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyeJoBDgELinOsstLnU7bQ83BOjk10x9IRs9r0OzEK5xHrc_jSTQquBgqPsKv112nQQ/exec"; 
const MI_TELEFONO_WHATSAPP = "525534018113"; 

// Variables Globales
let todosLosProductos = [];
let colorSeleccionadoActual = null;
let tallaSeleccionadaActual = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
});

// --- NUEVA LÓGICA: Cargar directo del Script (JSON) ---
async function cargarProductos() {
    try {
        const respuesta = await fetch(`${SCRIPT_URL}?action=read`);
        const datos = await respuesta.json();

        if (datos.status === "success") {
            // Filtramos filas vacías si las hubiera
            todosLosProductos = datos.data.filter(p => p.sku && p.nombre);
            
            if (todosLosProductos.length === 0) {
                console.warn("No hay productos en la base de datos.");
            }

            generarMenuNavbar(); 
            filtrarPor('destacados');
        } else {
            console.error("Error del script:", datos);
        }
    } catch (error) {
        console.error("Error cargando productos:", error);
        document.getElementById('contenedor-productos').innerHTML = 
            '<p class="text-center text-danger mt-5">Error al cargar el catálogo. Intenta recargar.</p>';
    }
}

// --- MENÚ DE ARRIBA (NAVBAR) ---
function generarMenuNavbar() {
    const contenedorNav = document.getElementById('lista-categorias-nav');
    if (!contenedorNav) return;

    contenedorNav.innerHTML = '';
    
    // Obtenemos categorías únicas
    const categorias = [...new Set(todosLosProductos.map(p => p.categoria ? p.categoria.trim() : 'Otros'))].sort();

    // 1. Destacados
    contenedorNav.appendChild(crearLinkNav('Destacados', 'destacados'));

    // 2. Dinámicas
    categorias.forEach(cat => {
        contenedorNav.appendChild(crearLinkNav(cat, cat));
    });

    // 3. Ver Todo
    contenedorNav.appendChild(crearLinkNav('Ver Todo', 'todo'));
}

function crearLinkNav(texto, filtro) {
    const li = document.createElement('li');
    li.className = 'nav-item';
    const a = document.createElement('a');
    a.className = 'nav-link text-white mx-2'; 
    a.textContent = texto;
    a.href = "#";
    
    a.onclick = (e) => {
        e.preventDefault();
        filtrarPor(filtro);
        // Cerrar menú móvil
        const menuCelular = document.getElementById('navbarNav');
        if (menuCelular && menuCelular.classList.contains('show')) {
            const bsCollapse = new bootstrap.Collapse(menuCelular, {toggle: false});
            bsCollapse.hide();
        }
    };
    li.appendChild(a);
    return li;
}

// --- FILTRADO Y TARJETAS ---
function filtrarPor(filtro) {
    const contenedor = document.getElementById('contenedor-productos');
    const titulo = document.getElementById('titulo-seccion');
    contenedor.innerHTML = '';

    let filtrados = [];
    
    if (filtro === 'destacados') {
        titulo.textContent = 'Productos Destacados';
        // Buscamos "si", "sí", "true" o "destacado"
        filtrados = todosLosProductos.filter(p => {
            const dest = p.destacado ? p.destacado.toString().toLowerCase().trim() : "";
            return dest === 'si' || dest === 'sí' || dest === 'true';
        });
        // Si no hay destacados, mostramos los últimos 6
        if (filtrados.length === 0) filtrados = todosLosProductos.slice(-6);
    } else if (filtro === 'todo') {
        titulo.textContent = 'Catálogo Completo';
        filtrados = todosLosProductos;
    } else {
        titulo.textContent = filtro;
        filtrados = todosLosProductos.filter(p => p.categoria && p.categoria.trim() === filtro);
    }
    renderizarTarjetas(filtrados, contenedor);
}

function renderizarTarjetas(lista, contenedor) {
    if (lista.length === 0) {
        contenedor.innerHTML = '<p class="text-center w-100 mt-5">No hay productos aquí todavía.</p>';
        return;
    }

    lista.forEach(producto => {
        let rawImg = producto.imagen ? producto.imagen.toString() : '';
        let imgUrl = rawImg.split(',')[0].trim() || 'https://via.placeholder.com/300x300?text=Sin+Foto';

        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <div class="card h-100 shadow-sm producto-card" onclick="abrirModal('${producto.sku}')" style="cursor: pointer; transition: transform 0.2s;">
                <div style="position: relative; overflow: hidden;">
                    <img src="${imgUrl}" class="card-img-top" loading="lazy" alt="${producto.nombre}" style="height: 250px; object-fit: cover;">
                    <span class="sku-badge">SKU: ${producto.sku}</span>
                </div>
                <div class="card-body text-center">
                    <h5 class="card-title text-dark fs-6 fw-bold">${producto.nombre}</h5>
                    <p class="small text-muted mb-0">${producto.categoria || 'Artesanía'}</p>
                    <p class="small text-success fw-bold mt-2">Ver detalles</p>
                </div>
            </div>
        `;
        contenedor.appendChild(col);
    });
}

// --- MODAL Y LÓGICA DE DETALLES (Se mantiene igual de sólida) ---
function abrirModal(skuRecibido) {
    const producto = todosLosProductos.find(p => p.sku.toString() === skuRecibido.toString());
    if (!producto) return;

    colorSeleccionadoActual = null;
    tallaSeleccionadaActual = null;
    document.getElementById('color-seleccionado-msg').textContent = "";
    
    // Imágenes
    const rawImg = producto.imagen ? producto.imagen.toString() : '';
    const listaImg = rawImg.split(',').map(s => s.trim()).filter(s => s);
    const imgMain = document.getElementById('modal-img');
    const galeria = document.getElementById('contenedor-miniaturas');
    
    imgMain.src = listaImg[0] || 'https://via.placeholder.com/300x300';
    galeria.innerHTML = '';
    
    if (listaImg.length > 1) {
        listaImg.forEach((src, idx) => {
            const thumb = document.createElement('img');
            thumb.src = src;
            thumb.className = `img-miniatura ${idx === 0 ? 'activa' : ''}`;
            thumb.onclick = () => {
                imgMain.src = src;
                document.querySelectorAll('.img-miniatura').forEach(t => t.classList.remove('activa'));
                thumb.classList.add('activa');
            };
            galeria.appendChild(thumb);
        });
    }

    // Datos Texto
    document.getElementById('modal-titulo').textContent = producto.nombre;
    document.getElementById('modal-descripcion').textContent = producto.descripcion || "Sin descripción detallada.";
    document.getElementById('modal-sku').textContent = `SKU: ${producto.sku}`;
    document.getElementById('modal-categoria').textContent = producto.categoria;

    // Ficha Técnica Inteligente
    const filaMedidas = document.getElementById('fila-medidas');
    const datoMedidasEl = document.getElementById('dato-medidas');
    const filaMaterial = document.getElementById('fila-material');
    const datoMaterialEl = document.getElementById('dato-material');
    const filaForma = document.getElementById('fila-forma'); // Asegúrate de tener este ID en HTML
    const datoFormaEl = document.getElementById('dato-forma');

    // Forma
    if(producto.forma && producto.forma !== "STD") {
        if(datoFormaEl) {
             datoFormaEl.textContent = producto.forma;
             filaForma.style.display = 'table-row';
        }
    } else {
        if(filaForma) filaForma.style.display = 'none';
    }

    // Material
    if (producto.material) {
        datoMaterialEl.textContent = producto.material;
        filaMaterial.style.display = 'table-row';
    } else {
        filaMaterial.style.display = 'none';
    }

    // Medidas iniciales
    if (producto.medidas) {
        datoMedidasEl.textContent = producto.medidas;
        filaMedidas.style.display = 'table-row';
    } else {
        filaMedidas.style.display = 'none';
    }

    // Mostrar ficha si algo existe
    document.getElementById('ficha-tecnica').style.display = 'block';

    renderizarOpciones(producto);
    actualizarBotonWhatsApp(producto);
    document.getElementById('modal-producto').style.display = 'flex';
}

function renderizarOpciones(producto) {
    const contenedorTallas = document.getElementById('contenedor-tallas');
    const seccionTallas = document.getElementById('seccion-tallas');
    const datoMedidasEl = document.getElementById('dato-medidas');
    
    const listaTallas = producto.tallas ? producto.tallas.toString().split(',').map(s=>s.trim()) : [];
    const listaMedidas = producto.medidas ? producto.medidas.toString().split(',').map(s=>s.trim()) : [];
    const medidaOriginal = producto.medidas || '---';

    contenedorTallas.innerHTML = '';

    if (listaTallas.length > 0 && listaTallas[0] !== "") {
        seccionTallas.style.display = 'block';
        listaTallas.forEach((t, index) => {
            const btn = document.createElement('span');
            btn.className = 'badge-talla';
            btn.textContent = t;
            btn.onclick = () => {
                document.querySelectorAll('.badge-talla').forEach(b => b.classList.remove('seleccionado'));
                btn.classList.add('seleccionado');
                tallaSeleccionadaActual = t;
                
                // Lógica inteligente de medidas
                if (listaMedidas[index]) {
                    datoMedidasEl.textContent = listaMedidas[index];
                    datoMedidasEl.style.color = "#198754";
                    setTimeout(() => datoMedidasEl.style.color = "", 500);
                } else {
                    datoMedidasEl.textContent = medidaOriginal;
                }
                actualizarBotonWhatsApp(producto);
            };
            contenedorTallas.appendChild(btn);
        });
    } else {
        seccionTallas.style.display = 'none';
        datoMedidasEl.textContent = medidaOriginal;
    }
    
    // Colores (Simplificado)
    const contenedorColores = document.getElementById('contenedor-colores');
    if(producto.colores) {
        document.getElementById('seccion-colores').style.display = 'block';
        contenedorColores.innerHTML = '';
        producto.colores.split(',').forEach(c => {
             const btn = document.createElement('span');
             btn.className = 'badge-color';
             btn.textContent = c.trim();
             btn.onclick = () => {
                document.querySelectorAll('.badge-color').forEach(b => b.classList.remove('seleccionado'));
                btn.classList.add('seleccionado');
                colorSeleccionadoActual = c.trim();
                document.getElementById('color-seleccionado-msg').textContent = `Color: ${c.trim()}`;
                actualizarBotonWhatsApp(producto);
             };
             contenedorColores.appendChild(btn);
        });
    } else {
        document.getElementById('seccion-colores').style.display = 'none';
    }
}

function actualizarBotonWhatsApp(producto) {
    let msg = `Hola, me interesa: ${producto.nombre} (SKU: ${producto.sku})`;
    if (tallaSeleccionadaActual) msg += `\nTamaño: ${tallaSeleccionadaActual}`;
    if (colorSeleccionadoActual) msg += `\nColor: ${colorSeleccionadoActual}`;
    const link = `https://wa.me/${MI_TELEFONO_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    document.getElementById('modal-btn-whatsapp').href = link;
}

function cerrarModal() {
    document.getElementById('modal-producto').style.display = 'none';
}