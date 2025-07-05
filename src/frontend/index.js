document.addEventListener('DOMContentLoaded', () => {
    const productosContainer = document.getElementById('productosContainer');
    const busquedaInput = document.getElementById('busquedaProductos');
    const btnBuscar = document.getElementById('btnBuscar');
    const btnLimpiarBusqueda = document.getElementById('btnLimpiarBusqueda');
    
    let productosMostrados = [];
    let todosLosProductos = []; // Para almacenar todos los productos y hacer búsquedas locales

    // --- Mostrar productos en el DOM ---
    function mostrarProductos(productos) {
        productosMostrados = productos;
        if (productos.length === 0) {
            productosContainer.innerHTML = '<p>No se encontraron productos con los filtros aplicados.</p>';
            return;
        }

        productosContainer.innerHTML = productos.map(prod => {
            const stockClass = prod.estado_stock === 'agotado' ? 'sin-stock' : 
                              prod.estado_stock === 'bajo' ? 'stock-bajo' : '';
            const stockText = prod.estado_stock === 'agotado' ? 'Sin stock' : 
                             prod.estado_stock === 'bajo' ? `Stock bajo (${prod.stock})` : '';
            
            return `
                <div class="producto ${stockClass}">
                    <img src="${prod.imagen ? prod.imagen : '../bicicleta1.jpg'}" alt="${prod.nombre}">
                    <div class="producto-nombre">${prod.nombre}</div>
                    <div class="producto-precio">$${prod.precio_venta}</div>
                    ${stockText ? `<div class="stock-info">${stockText}</div>` : ''}
                    <button class="agregar-carrito-btn" data-id="${prod.id_producto}" ${prod.estado_stock === 'agotado' ? 'disabled' : ''}>
                        ${prod.estado_stock === 'agotado' ? 'Sin stock' : 'Agregar al carrito'}
                    </button>
                </div>
            `;
        }).join('');
        
        asignarEventosCarrito();
    }

    // --- Cargar productos ---
    async function cargarProductos() {
        productosContainer.innerHTML = 'Cargando...';

        try {
            const response = await fetch('http://localhost:3000/api/productos');
            const data = await response.json();
            if (response.ok && data.success) {
                todosLosProductos = data.data; // Almacenar todos los productos
                mostrarProductos(todosLosProductos);
            } else {
                productosContainer.innerHTML = '<p>Error al cargar productos.</p>';
            }
        } catch (error) {
            console.error('Error:', error);
            productosContainer.innerHTML = '<p>Error de conexión al cargar productos.</p>';
        }
    }



    // --- Lógica de sesión de usuario ---
    const userSection = document.getElementById('userSection');
    const userName = document.getElementById('userName');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    if (usuario) {
        userName.textContent = `Bienvenido, ${usuario.nombre}`;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('usuario');
            localStorage.removeItem('carrito');
            window.location.href = 'index.html';
        });
    } else {
        userName.textContent = '';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        loginBtn.addEventListener('click', () => {
            window.location.href = 'iniciar.html';
        });
    }

    // --- Lógica del carrito ---
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const carritoBtn = document.getElementById('carritoBtn');
    const carritoCantidad = document.getElementById('carritoCantidad');
    const carritoModal = document.getElementById('carritoModal');
    const cerrarCarrito = document.getElementById('cerrarCarrito');
    const carritoContenido = document.getElementById('carritoContenido');

    function actualizarCarritoCantidad() {
        const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
        carritoCantidad.textContent = total;
    }

    function asignarEventosCarrito() {
        document.querySelectorAll('.agregar-carrito-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const producto = productosMostrados.find(p => p.id_producto === id);
                if (!producto) return;

                // Verificar si el producto tiene stock disponible
                if (producto.estado_stock === 'agotado') {
                    alert(`⚠️ No hay stock disponible para "${producto.nombre}". Por favor, contacta con nosotros para más información.`);
                    return;
                }

                // Verificar si hay stock suficiente
                if (producto.stock <= 0) {
                    alert(`⚠️ No hay stock disponible para "${producto.nombre}". Por favor, contacta con nosotros para más información.`);
                    return;
                }

                const index = carrito.findIndex(item => item.id_producto === id);

                if (index >= 0) {
                    carrito[index].cantidad += 1;
                } else {
                    carrito.push({
                        id_producto: producto.id_producto,
                        nombre: producto.nombre,
                        precio_venta: producto.precio_venta,
                        imagen: producto.imagen,
                        cantidad: 1,
                        stock_disponible: producto.stock
                    });
                }
                localStorage.setItem('carrito', JSON.stringify(carrito));
                actualizarCarritoCantidad();
            });
        });
    }

    carritoBtn.addEventListener('click', () => {
        mostrarCarrito();
        carritoModal.style.display = 'flex';
    });

    cerrarCarrito.addEventListener('click', () => {
        carritoModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === carritoModal) carritoModal.style.display = 'none';
    });

    function mostrarCarrito() {
        if (carrito.length === 0) {
            carritoContenido.innerHTML = '<p>El carrito está vacío.</p>';
            return;
        }
        let total = 0;
        carritoContenido.innerHTML = `
            <table>
                <thead>
                    <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th></th></tr>
                </thead>
                <tbody>
                    ${carrito.map(item => {
                        total += item.precio_venta * item.cantidad;
                        return `<tr>
                            <td><img src="${item.imagen ? item.imagen : '../bicicleta1.jpg'}" alt="${item.nombre}" style="width:40px;vertical-align:middle;"> ${item.nombre}</td>
                            <td><input type="number" class="input-cantidad-carrito" data-id="${item.id_producto}" min="1" value="${item.cantidad}" style="width:50px;text-align:center;"></td>
                            <td>$${(item.precio_venta * item.cantidad).toFixed(2)}</td>
                            <td><button class="eliminar-item" data-id="${item.id_producto}">X</button></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
            <div style="text-align:right;font-weight:bold;">Total: $${total.toFixed(2)}</div>
            <div style="margin:12px 0;">
                <label for="metodoPago">Método de pago:</label>
                <select id="metodoPago">
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="maestro">Maestro</option>
                    <option value="paypal">Paypal</option>
                </select>
            </div>
            <div id="campoTarjeta" style="display:none;margin-bottom:10px;">
                <label for="numeroTarjeta">Número de tarjeta:</label>
                <input type="text" id="numeroTarjeta" maxlength="20" pattern="[0-9]{1,20}">
            </div>
            <button class="finalizar-btn" id="finalizarCompra">Finalizar compra</button>
        `;
        document.querySelectorAll('.eliminar-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                carrito = carrito.filter(item => item.id_producto !== id);
                localStorage.setItem('carrito', JSON.stringify(carrito));
                actualizarCarritoCantidad();
                mostrarCarrito();
            });
        });
        document.querySelectorAll('.input-cantidad-carrito').forEach(input => {
            input.addEventListener('change', function() {
                let val = parseInt(this.value);
                if (isNaN(val) || val < 1) val = 1;
                this.value = val;
                const id = parseInt(this.getAttribute('data-id'));
                const idx = carrito.findIndex(item => item.id_producto === id);
                if (idx >= 0) {
                    carrito[idx].cantidad = val;
                    localStorage.setItem('carrito', JSON.stringify(carrito));
                    mostrarCarrito();
                    actualizarCarritoCantidad();
                }
            });
        });
        const metodoPago = document.getElementById('metodoPago');
        const campoTarjeta = document.getElementById('campoTarjeta');
        metodoPago.addEventListener('change', function() {
            campoTarjeta.style.display = this.value === 'visa' || this.value === 'mastercard' || this.value === 'maestro' ? 'block' : 'none';
        });
        if (metodoPago.value === 'visa' || metodoPago.value === 'mastercard' || metodoPago.value === 'maestro') campoTarjeta.style.display = 'block';
        document.getElementById('finalizarCompra').addEventListener('click', async () => {
            if (carrito.length === 0) return;
            const usuario = JSON.parse(localStorage.getItem('usuario'));
            if (!usuario) {
                alert('Debes iniciar sesión para realizar una compra.');
                window.location.href = 'iniciar.html';
                return;
            }
            const metodoPago = document.getElementById('metodoPago').value;
            const numeroTarjeta = document.getElementById('numeroTarjeta').value;
            if ((metodoPago === 'visa' || metodoPago === 'mastercard' || metodoPago === 'maestro') && !numeroTarjeta) {
                alert('Por favor ingresa el número de tarjeta.');
                return;
            }
            try {
                const venta = {
                    id_usuario: usuario.id_usuario,
                    total: carrito.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0),
                    metodo_pago: metodoPago,
                    numero_tarjeta: numeroTarjeta,
                    productos: carrito.map(item => ({
                        id_producto: item.id_producto,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio_venta
                    }))
                };
                const response = await fetch('http://localhost:3000/api/ventas/registrar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(venta)
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    alert('¡Compra realizada con éxito!');
                    carrito = [];
                    localStorage.removeItem('carrito');
                    actualizarCarritoCantidad();
                    carritoModal.style.display = 'none';
                } else {
                    alert(`Error al procesar la compra: ${data.message || 'Error desconocido'}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión al procesar la compra.');
            }
        });
    }

    // --- Funciones de búsqueda ---
    function buscarProductos() {
        const terminoBusqueda = busquedaInput.value.trim().toLowerCase();
        
        if (terminoBusqueda === '') {
            mostrarProductos(todosLosProductos);
            return;
        }
        
        const productosFiltrados = todosLosProductos.filter(producto => 
            producto.nombre.toLowerCase().includes(terminoBusqueda) ||
            producto.categoria.toLowerCase().includes(terminoBusqueda) ||
            producto.marca.toLowerCase().includes(terminoBusqueda) ||
            producto.descripcion.toLowerCase().includes(terminoBusqueda)
        );
        
        mostrarProductos(productosFiltrados);
    }
    
    function limpiarBusqueda() {
        busquedaInput.value = '';
        mostrarProductos(todosLosProductos);
    }
    
    // Event listeners para búsqueda
    btnBuscar.addEventListener('click', buscarProductos);
    btnLimpiarBusqueda.addEventListener('click', limpiarBusqueda);
    
    // Búsqueda al presionar Enter
    busquedaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            buscarProductos();
        }
    });
    
    // Búsqueda en tiempo real (opcional)
    busquedaInput.addEventListener('input', () => {
        if (busquedaInput.value.trim() === '') {
            mostrarProductos(todosLosProductos);
        }
    });

    // --- Inicialización ---
    actualizarCarritoCantidad();
    cargarProductos(); // Carga inicial de todos los productos
}); 