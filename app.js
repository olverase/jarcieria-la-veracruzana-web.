// --- CONFIGURACIÓN ---
const GOOGLE_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTIhh6linOzlYkLcL4l0edGjEm7k0Z6LnzhIRveVZSJHCQG5W7Ntw14QfCxSWFy6gSyHGzRQKipVO3x/pub?output=csv";
const MI_TELEFONO_WHATSAPP = "525534018113";

// Variables Globales
let todosLosProductos = [];
let colorSeleccionadoActual = null;
let tallaSeleccionadaActual = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
});

function cargarProductos() {
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            todosLosProductos = results.data.filter(p => p.nombre && p.sku);
            
            if (todosLosProductos.length === 0) {
                console.error("No se encontraron productos.");
                return;
            }

            // Llamamos a la nueva función del Navbar
            generarMenuNavbar(); 
            filtrarPor('destacados');
        },
        error: (err) => console.error("Error CSV:", err)
    });
}

// --- NUEVA LÓGICA PARA EL MENÚ DE ARRIBA ---
function generarMenuNavbar() {
    const contenedorNav = document.getElementById('lista-categorias-nav');
    
    // Verificación de seguridad
    if (!contenedorNav) {
        console.error("Error: No encontré el elemento <ul id='lista-categorias-nav'> en el HTML.");
        return;
    }

    contenedorNav.innerHTML = '';
    const categorias = [...new Set(todosLosProductos.map(p => p.categoria ? p.categoria.trim() : 'Otros'))].sort();

    // 1. Enlace Destacados
    contenedorNav.appendChild(crearLinkNav('Destacados', 'destacados'));

    // 2. Enlaces Categorías
    categorias.forEach(cat => {
        contenedorNav.appendChild(crearLinkNav(cat, cat));
    });

    // 3. Enlace Ver Todo
    contenedorNav.appendChild(crearLinkNav('Ver Todo', 'todo'));
}

function crearLinkNav(texto, filtro) {
    const li = document.createElement('li');
    li.className = 'nav-item';

    const a = document.createElement('a');
    a.className = 'nav-link text-white mx-2'; // Clases Bootstrap para estilo
    a.textContent = texto;
    a.href = "#"; // Para que parezca enlace
    
    a.onclick = (e) => {
        e.preventDefault(); // Evita que la página salte
        filtrarPor(filtro);
        
        // Cerrar menú en celular automáticamente
        const menuCelular = document.getElementById('navbarNav');
        if (menuCelular.classList.contains('show')) {
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
        filtrados = todosLosProductos.filter(p => p.destacado && p.destacado.toString().toLowerCase() === 'si');
        if (filtrados.length === 0) filtrados = todosLosProductos.slice(0, 6);
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
        contenedor.innerHTML = '<p class="text-center w-100 mt-5">No hay productos en esta categoría.</p>';
        return;
    }

    lista.forEach(producto => {
        let rawImg = producto.imagen ? producto.imagen.toString() : '';
        let imgUrl = rawImg.split(',')[0].trim() || 'https://via.placeholder.com/300x300';

        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <div class="card h-100 shadow-sm" onclick="abrirModal('${producto.sku}')">
                <div style="position: relative;">
                    <img src="${imgUrl}" class="card-img-top" loading="lazy" alt="${producto.nombre}">
                    <span class="sku-badge">SKU: ${producto.sku}</span>
                </div>
                <div class="card-body text-center">
                    <h5 class="card-title text-dark fs-6">${producto.nombre}</h5>
                    <p class="small text-success fw-bold">Ver detalles</p>
                </div>
            </div>
        `;
        contenedor.appendChild(col);
    });
}

// --- MODAL (POP-UP) ---
function abrirModal(skuRecibido) {
    const producto = todosLosProductos.find(p => p.sku.toString() === skuRecibido.toString());
    if (!producto) return;

    colorSeleccionadoActual = null;
    tallaSeleccionadaActual = null;
    document.getElementById('color-seleccionado-msg').textContent = "";
    
    // --- 1. IMÁGENES ---
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

    // --- 2. TEXTOS BÁSICOS ---
    document.getElementById('modal-titulo').textContent = producto.nombre;
    document.getElementById('modal-descripcion').textContent = producto.descripcion;
    document.getElementById('modal-sku').textContent = `SKU: ${producto.sku}`;
    document.getElementById('modal-categoria').textContent = producto.categoria;

    // --- 3. FICHA TÉCNICA (MEDIDAS Y MATERIAL) ---
    // --- 3. FICHA TÉCNICA (MEDIDAS, MATERIAL Y FORMA) ---
    const filaMedidas = document.getElementById('fila-medidas');
    const datoMedidasEl = document.getElementById('dato-medidas');
    const filaMaterial = document.getElementById('fila-material');
    const datoMaterialEl = document.getElementById('dato-material');
    // Definimos los nuevos elementos para FORMA
    const filaForma = document.getElementById('fila-forma');
    const datoFormaEl = document.getElementById('dato-forma');

    // A) Lógica para MEDIDAS
    if (producto.medidas) {
        datoMedidasEl.textContent = producto.medidas;
        filaMedidas.style.display = 'table-row';
    } else {
        filaMedidas.style.display = 'none';
    }

    // B) Lógica para MATERIAL
    const valorMaterial = producto.material || producto.Material || producto.MATERIAL;
    if (valorMaterial) {
        datoMaterialEl.textContent = valorMaterial.toString().trim();
        filaMaterial.style.display = 'table-row';
    } else {
        filaMaterial.style.display = 'none';
    }

    // C) NUEVA Lógica para FORMA
    // Busca 'forma', 'Forma' o 'FORMA'
    const valorForma = producto.forma || producto.Forma || producto.FORMA;
    if (valorForma) {
        datoFormaEl.textContent = valorForma.toString().trim();
        filaForma.style.display = 'table-row';
    } else {
        filaForma.style.display = 'none';
    }

    // D) Mostrar u Ocultar la caja completa
    // Ahora revisamos si ALGUNA de las 3 filas está visible
    const hayFicha = (
        filaMedidas.style.display !== 'none' || 
        filaMaterial.style.display !== 'none' || 
        filaForma.style.display !== 'none'
    );
    document.getElementById('ficha-tecnica').style.display = hayFicha ? 'block' : 'none';

    // ... (El resto de Tallas, Colores y WhatsApp sigue igual) ...

    // --- 4. TALLAS Y COLORES ---
    renderizarOpciones(producto);
    
    // --- 5. MOSTRAR MODAL ---
    actualizarBotonWhatsApp(producto);
    document.getElementById('modal-producto').style.display = 'flex';
}

function renderizarOpciones(producto) {
    const contenedorTallas = document.getElementById('contenedor-tallas');
    const seccionTallas = document.getElementById('seccion-tallas');
    const datoMedidasEl = document.getElementById('dato-medidas');
    
    // Obtenemos las medidas originales para poder "resetear" si hace falta
    const medidasOriginales = producto.medidas ? producto.medidas.toString() : '---';
    
    // Preparamos las listas (Arrays) separando por comas
    const listaTallas = producto.tallas ? producto.tallas.toString().split(',') : [];
    const listaMedidas = producto.medidas ? producto.medidas.toString().split(',') : [];

    contenedorTallas.innerHTML = '';
    
    if (listaTallas.length > 0 && listaTallas[0] !== "") {
        seccionTallas.style.display = 'block';
        
        listaTallas.forEach((t, index) => {
            const btn = document.createElement('span');
            btn.className = 'badge-talla';
            btn.textContent = t.trim();
            
            btn.onclick = () => {
                // 1. Estilo Visual del botón
                document.querySelectorAll('.badge-talla').forEach(b => b.classList.remove('seleccionado'));
                btn.classList.add('seleccionado');
                
                // 2. Guardar selección para WhatsApp
                tallaSeleccionadaActual = t.trim();
                actualizarBotonWhatsApp(producto);

                // 3. MAGIA: Actualizar la Medida según la posición (índice)
                // Si existe una medida en la posición 'index', la mostramos.
                if (listaMedidas[index]) {
                    datoMedidasEl.textContent = listaMedidas[index].trim();
                    // Efecto visual para que se note el cambio
                    datoMedidasEl.style.color = "#198754"; // Verde momentáneo
                    setTimeout(() => datoMedidasEl.style.color = "", 500);
                } else {
                    // Si no coincide (ej. hay 3 tallas pero solo 1 medida), dejamos la original
                    datoMedidasEl.textContent = medidasOriginales;
                }
            };
            contenedorTallas.appendChild(btn);
        });
    } else {
        seccionTallas.style.display = 'none';
        // Si no hay tallas, mostramos las medidas completas por defecto
        datoMedidasEl.textContent = medidasOriginales;
    }

    // --- SECCIÓN COLORES (Se queda igual) ---
    const contenedorColores = document.getElementById('contenedor-colores');
    const seccionColores = document.getElementById('seccion-colores');
    contenedorColores.innerHTML = '';

    if (producto.colores) {
        seccionColores.style.display = 'block';
        producto.colores.toString().split(',').forEach(c => {
            const btn = document.createElement('span');
            btn.className = 'badge-color';
            btn.textContent = c.trim();
            btn.onclick = () => {
                document.querySelectorAll('.badge-color').forEach(b => b.classList.remove('seleccionado'));
                btn.classList.add('seleccionado');
                colorSeleccionadoActual = c.trim();
                document.getElementById('color-seleccionado-msg').textContent = `Seleccionado: ${c.trim()}`;
                actualizarBotonWhatsApp(producto);
            };
            contenedorColores.appendChild(btn);
        });
    } else {
        seccionColores.style.display = 'none';
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