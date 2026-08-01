const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");
const session = require("express-session");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- CONFIGURACIÓN DE SESIÓN ----------
app.use(
  session({
    secret: "meraki-sistem-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- MIDDLEWARE DE AUTENTICACIÓN ----------
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: "No autorizado" });
}

// ---------- BASE DE DATOS ----------
const dbPath = process.env.DB_PATH || "./database/meraki.db";
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

// ---------- CREAR TABLAS E INSERTAR DATOS ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE,
    nombre TEXT,
    categoria TEXT,
    precio REAL,
    existencia REAL DEFAULT 0,
    estado TEXT DEFAULT 'Activo',
    unidad TEXT DEFAULT 'unidad'
  );

  CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT,
    metodo_pago TEXT,
    descuento REAL,
    subtotal REAL,
    total REAL
  );

  CREATE TABLE IF NOT EXISTS detalle_ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER,
    producto_id INTEGER,
    cantidad INTEGER,
    precio REAL,
    subtotal REAL
  );

  CREATE TABLE IF NOT EXISTS gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT,
    descripcion TEXT,
    categoria TEXT,
    monto REAL
  );

  CREATE TABLE IF NOT EXISTS caja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT,
    apertura REAL,
    ingresos REAL DEFAULT 0,
    egresos REAL DEFAULT 0,
    cierre REAL DEFAULT 0,
    estado TEXT DEFAULT 'abierta',
    detalle_efectivo TEXT
  );

  CREATE TABLE IF NOT EXISTS recetas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER,
    ingrediente_id INTEGER,
    cantidad REAL,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (ingrediente_id) REFERENCES productos(id)
  );
`);

// Productos de venta
db.exec(`
  INSERT OR IGNORE INTO productos (codigo, nombre, categoria, precio, existencia, estado, unidad)
  VALUES
    ('1','Cubano Especial','Panes/Salados',35,0,'Activo','unidad'),
    ('2','Dorado Meraki','Panes/Salados',25,0,'Activo','unidad'),
    ('3','Nachos de la Casa','Panes/Salados',35,0,'Activo','unidad'),
    ('4','Quesa Lovers','Panes/Salados',30,0,'Activo','unidad'),
    ('5','Smoothie Tropical','Bebidas Frías',20,0,'Activo','unidad'),
    ('6','Coco & Piña','Bebidas Frías',20,0,'Activo','unidad'),
    ('7','Iced Latte','Bebidas Frías',18,0,'Activo','unidad'),
    ('8','Susent Up','Bebidas Frías',15,0,'Activo','unidad'),
    ('9','Gaseosa','Bebidas Frías',5,0,'Activo','unidad'),
    ('10','Café Americano Pequeño','Bebidas Calientes',12,0,'Activo','unidad'),
    ('11','Café Americano Grande','Bebidas Calientes',18,0,'Activo','unidad'),
    ('12','Capuchino Pequeño','Bebidas Calientes',20,0,'Activo','unidad'),
    ('13','Capuchino Grande','Bebidas Calientes',25,0,'Activo','unidad'),
    ('14','Cocoa Pequeño','Bebidas Calientes',15,0,'Activo','unidad'),
    ('15','Cocoa Grande','Bebidas Calientes',20,0,'Activo','unidad'),
    ('16','Postre del día','Postres',25,0,'Activo','unidad'),
    ('17','Agua Pura (botella)','Bebidas Frías',5,0,'Activo','unidad'),
    ('18','Coca Cola (botella)','Bebidas Frías',8,0,'Activo','unidad'),
    ('19','Porción de Papas','Panes/Salados',8,0,'Activo','oz'),
    ('20','Combo Postre+Café','Postres',30,0,'Activo','unidad'),
    ('21','Papas Meraki','Panes/Salados',35,0,'Activo','unidad')
`);

// Insumos
db.exec(`
  INSERT OR IGNORE INTO productos (codigo, nombre, categoria, precio, existencia, estado, unidad)
  VALUES
    ('22','Leche Verde','Insumos',0,0,'Activo','ml'),
    ('23','Leche Azul','Insumos',0,0,'Activo','ml'),
    ('24','Leche Deslactosada','Insumos',0,0,'Activo','ml'),
    ('25','Salsa de Queso','Insumos',0,0,'Activo','oz'),
    ('26','Queso Mozzarella','Insumos',0,0,'Activo','oz'),
    ('27','Papas','Insumos',0,0,'Activo','oz'),
    ('28','Fruta SM','Insumos',0,0,'Activo','oz'),
    ('29','Base de piña','Insumos',0,0,'Activo','oz'),
    ('30','Nachos','Insumos',0,0,'Activo','oz'),
    ('31','Vasos Transparente','Insumos',0,0,'Activo','unidad'),
    ('32','Bandejas','Insumos',0,0,'Activo','unidad'),
    ('33','Lechuga','Insumos',0,0,'Activo','unidad'),
    ('34','Pollo','Insumos',0,0,'Activo','oz'),
    ('35','Carne de Res','Insumos',0,0,'Activo','oz'),
    ('36','Tortillas de Harina','Insumos',0,0,'Activo','unidad'),
    ('37','Crema Batida','Insumos',0,0,'Activo','unidad'),
    ('38','Queso Crema','Insumos',0,0,'Activo','unidad'),
    ('39','Crema','Insumos',0,0,'Activo','unidad'),
    ('40','Servilletas','Insumos',0,0,'Activo','unidad'),
    ('41','Recipientes Grandes','Insumos',0,0,'Activo','unidad'),
    ('42','Recipientes Salseros','Insumos',0,0,'Activo','unidad'),
    ('43','Jamón','Insumos',0,0,'Activo','unidad'),
    ('44','Salami','Insumos',0,0,'Activo','unidad'),
    ('45','Granadina','Insumos',0,0,'Activo','ml'),
    ('46','Jugo de Naranja Rabinal','Insumos',0,0,'Activo','ml'),
    ('47','Jugo de Naranja Granja','Insumos',0,0,'Activo','ml'),
    ('48','Sirope','Insumos',0,0,'Activo','ml'),
    ('49','Carne de Cerdo','Insumos',0,0,'Activo','oz'),
    ('50','Pico de Gallo','Insumos',0,0,'Activo','oz'),
    ('51','Pan Francés','Insumos',0,0,'Activo','unidad'),
    ('52','Rodaja de Sándwich','Insumos',0,0,'Activo','unidad'),
    ('53','Cereza','Insumos',0,0,'Activo','unidad'),
    ('54','Café en Grano','Insumos',0,0,'Activo','oz'),
    ('55','Hielo','Insumos',0,0,'Activo','oz'),
    ('56','Refresco de limón','Insumos',0,0,'Activo','oz'),
    ('57','Vasos Café Grande','Insumos',0,0,'Activo','unidad'),
    ('58','Vasos Café Pequeño','Insumos',0,0,'Activo','unidad'),
    ('59','Quesillo','Insumos',0,0,'Activo','unidad'),
    ('60','Salsa Dulce','Insumos',0,0,'Activo','unidad'),
    ('61','Mayonesa','Insumos',0,0,'Activo','unidad')
`);

// Recetas
db.exec(`DELETE FROM recetas`);
db.exec(`
  INSERT INTO recetas (producto_id, ingrediente_id, cantidad)
  SELECT (SELECT id FROM productos WHERE codigo = '1'), (SELECT id FROM productos WHERE nombre = 'Carne de Cerdo'), 6
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '1'), (SELECT id FROM productos WHERE nombre = 'Salami'), 3
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '1'), (SELECT id FROM productos WHERE nombre = 'Jamón'), 1
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '1'), (SELECT id FROM productos WHERE nombre = 'Papas'), 4
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '1'), (SELECT id FROM productos WHERE nombre = 'Pan Francés'), 1
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '1'), (SELECT id FROM productos WHERE nombre = 'Queso Mozzarella'), 4
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '2'), (SELECT id FROM productos WHERE nombre = 'Rodaja de Sándwich'), 2
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '2'), (SELECT id FROM productos WHERE nombre = 'Jamón'), 1
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '2'), (SELECT id FROM productos WHERE nombre = 'Salami'), 2
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '2'), (SELECT id FROM productos WHERE nombre = 'Queso Mozzarella'), 3
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '2'), (SELECT id FROM productos WHERE nombre = 'Lechuga'), 1
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '2'), (SELECT id FROM productos WHERE nombre = 'Papas'), 4
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '3'), (SELECT id FROM productos WHERE nombre = 'Nachos'), 5
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '3'), (SELECT id FROM productos WHERE nombre = 'Pollo'), 3
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '3'), (SELECT id FROM productos WHERE nombre = 'Carne de Res'), 3
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '3'), (SELECT id FROM productos WHERE nombre = 'Salsa de Queso'), 4
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '3'), (SELECT id FROM productos WHERE nombre = 'Pico de Gallo'), 6
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '4'), (SELECT id FROM productos WHERE nombre = 'Tortillas de Harina'), 1
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '4'), (SELECT id FROM productos WHERE nombre = 'Queso Mozzarella'), 4
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '4'), (SELECT id FROM productos WHERE nombre = 'Carne de Res'), 4
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '4'), (SELECT id FROM productos WHERE nombre = 'Pico de Gallo'), 2
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '4'), (SELECT id FROM productos WHERE nombre = 'Papas'), 4
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '5'), (SELECT id FROM productos WHERE nombre = 'Fruta SM'), 5
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '5'), (SELECT id FROM productos WHERE nombre = 'Sirope'), 2
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '5'), (SELECT id FROM productos WHERE nombre = 'Jugo de Naranja Rabinal'), 4
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '5'), (SELECT id FROM productos WHERE nombre = 'Hielo'), 4
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '6'), (SELECT id FROM productos WHERE nombre = 'Base de piña'), 6
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '6'), (SELECT id FROM productos WHERE nombre = 'Leche Verde'), 2
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '6'), (SELECT id FROM productos WHERE nombre = 'Cereza'), 1
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '6'), (SELECT id FROM productos WHERE nombre = 'Hielo'), 4
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '7'), (SELECT id FROM productos WHERE nombre = 'Café en Grano'), 2
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '7'), (SELECT id FROM productos WHERE nombre = 'Sirope'), 2
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '7'), (SELECT id FROM productos WHERE nombre = 'Leche Verde'), 8
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '7'), (SELECT id FROM productos WHERE nombre = 'Hielo'), 8
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '7'), (SELECT id FROM productos WHERE nombre = 'Crema Batida'), 2
  -- Café Americano Pequeño (10)
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '10'), (SELECT id FROM productos WHERE nombre = 'Café en Grano'), 1
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '10'), (SELECT id FROM productos WHERE nombre = 'Vasos Café Pequeño'), 1
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '10'), (SELECT id FROM productos WHERE nombre = 'Hielo'), 2
  -- Café Americano Grande (11)
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '11'), (SELECT id FROM productos WHERE nombre = 'Café en Grano'), 2
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '11'), (SELECT id FROM productos WHERE nombre = 'Vasos Café Grande'), 1
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '11'), (SELECT id FROM productos WHERE nombre = 'Hielo'), 4
  -- Capuchino Pequeño (12)
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '12'), (SELECT id FROM productos WHERE nombre = 'Café en Grano'), 1
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '12'), (SELECT id FROM productos WHERE nombre = 'Leche Verde'), 5
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '12'), (SELECT id FROM productos WHERE nombre = 'Vasos Café Pequeño'), 1
  -- Capuchino Grande (13)
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '13'), (SELECT id FROM productos WHERE nombre = 'Café en Grano'), 2
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '13'), (SELECT id FROM productos WHERE nombre = 'Leche Verde'), 8
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '13'), (SELECT id FROM productos WHERE nombre = 'Vasos Café Grande'), 1
  -- Cocoa Pequeño (14)
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '14'), (SELECT id FROM productos WHERE nombre = 'Leche Verde'), 4
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '14'), (SELECT id FROM productos WHERE nombre = 'Salsa Dulce'), 2
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '14'), (SELECT id FROM productos WHERE nombre = 'Vasos Café Pequeño'), 1
  -- Cocoa Grande (15)
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '15'), (SELECT id FROM productos WHERE nombre = 'Leche Verde'), 6
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '15'), (SELECT id FROM productos WHERE nombre = 'Salsa Dulce'), 3
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '15'), (SELECT id FROM productos WHERE nombre = 'Vasos Café Grande'), 1
  -- Combo Postre+Café (20)
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '20'), (SELECT id FROM productos WHERE nombre = 'Café en Grano'), 1
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '20'), (SELECT id FROM productos WHERE nombre = 'Vasos Café Pequeño'), 1
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '20'), (SELECT id FROM productos WHERE nombre = 'Hielo'), 2
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '20'), (SELECT id FROM productos WHERE nombre = 'Postre del día'), 1
  -- Papas Meraki (21)
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '21'), (SELECT id FROM productos WHERE nombre = 'Papas'), 8
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '21'), (SELECT id FROM productos WHERE nombre = 'Salsa de Queso'), 3
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '21'), (SELECT id FROM productos WHERE nombre = 'Queso Mozzarella'), 2
  UNION ALL
  SELECT (SELECT id FROM productos WHERE codigo = '21'), (SELECT id FROM productos WHERE nombre = 'Pico de Gallo'), 2
`);

console.log("✅ Base de datos y recetas inicializadas.");

// ---------- RUTAS DE AUTENTICACIÓN ----------
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "Admin" && password === "Milanessa1") {
    req.session.user = { username: "Admin", role: "admin" };
    res.json({ success: true, message: "Login exitoso" });
  } else {
    res.status(401).json({ success: false, message: "Credenciales incorrectas" });
  }
});

app.get("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Sesión cerrada" });
  });
});

app.get("/api/check-auth", (req, res) => {
  if (req.session && req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

// ---------- RUTAS DE VISTAS ----------
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/", (req, res) => {
  if (req.session && req.session.user) {
    res.sendFile(path.join(__dirname, "views", "index.html"));
  } else {
    res.redirect("/login");
  }
});

app.get("/ventas", (req, res) => {
  if (req.session && req.session.user) {
    res.sendFile(path.join(__dirname, "views", "ventas.html"));
  } else {
    res.redirect("/login");
  }
});

app.get("/inventario", (req, res) => {
  if (req.session && req.session.user) {
    res.sendFile(path.join(__dirname, "views", "inventario.html"));
  } else {
    res.redirect("/login");
  }
});

app.get("/caja", (req, res) => {
  if (req.session && req.session.user) {
    res.sendFile(path.join(__dirname, "views", "caja.html"));
  } else {
    res.redirect("/login");
  }
});

app.get("/gastos", (req, res) => {
  if (req.session && req.session.user) {
    res.sendFile(path.join(__dirname, "views", "gastos.html"));
  } else {
    res.redirect("/login");
  }
});

app.get("/reportes", (req, res) => {
  if (req.session && req.session.user) {
    res.sendFile(path.join(__dirname, "views", "reportes.html"));
  } else {
    res.redirect("/login");
  }
});

// ---------- API ----------

// Obtener productos de venta
app.get("/api/productos", isAuthenticated, (req, res) => {
  try {
    const rows = db.prepare(
      "SELECT * FROM productos WHERE categoria != 'Insumos' AND estado='Activo' ORDER BY categoria, nombre"
    ).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todos los productos (incluyendo insumos)
app.get("/api/inventario", isAuthenticated, (req, res) => {
  try {
    const rows = db.prepare(
      "SELECT * FROM productos WHERE estado='Activo' ORDER BY categoria, nombre"
    ).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar existencia
app.put("/api/productos/:id/existencia", isAuthenticated, (req, res) => {
  const { id } = req.params;
  const { cantidad } = req.body;
  try {
    const stmt = db.prepare("UPDATE productos SET existencia = existencia + ? WHERE id = ?");
    const info = stmt.run(cantidad, id);
    if (info.changes === 0) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ mensaje: "Existencia actualizada correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar venta (con logs de depuración)
app.post("/api/ventas", isAuthenticated, (req, res) => {
  const venta = req.body;
  console.log("📝 Venta recibida:", JSON.stringify(venta, null, 2));

  const subtotal = venta.productos.reduce((sum, p) => sum + p.cantidad * p.precio, 0);
  const total = subtotal - (venta.descuento || 0);
  const fecha = venta.fecha || new Date().toISOString();

  try {
    const insertVenta = db.prepare(
      `INSERT INTO ventas (fecha, metodo_pago, descuento, subtotal, total)
       VALUES (?, ?, ?, ?, ?)`
    );
    const result = insertVenta.run(fecha, venta.metodo_pago, venta.descuento || 0, subtotal, total);
    const ventaId = result.lastInsertRowid;
    console.log(`✅ Venta #${ventaId} insertada`);

    const insertDetalle = db.prepare(
      `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio, subtotal)
       VALUES (?, ?, ?, ?, ?)`
    );
    const updateExistencia = db.prepare(
      `UPDATE productos SET existencia = existencia - ? WHERE id = ?`
    );

    // Obtener recetas
    const productoIds = venta.productos.map(p => p.producto_id);
    const placeholders = productoIds.map(() => '?').join(',');
    const recetasStmt = db.prepare(
      `SELECT r.producto_id, r.ingrediente_id, r.cantidad
       FROM recetas r
       WHERE r.producto_id IN (${placeholders})`
    );
    const recetasRows = recetasStmt.all(...productoIds);
    console.log("📋 Recetas encontradas:", recetasRows);

    const productosConRecetas = new Set(recetasRows.map(r => r.producto_id));
    const cantidadesPorProducto = {};
    venta.productos.forEach(p => {
      cantidadesPorProducto[p.producto_id] = p.cantidad;
    });

    // Descontar ingredientes (productos con recetas)
    const ingredientes = {};
    recetasRows.forEach(row => {
      const cantidadVendida = cantidadesPorProducto[row.producto_id] || 0;
      if (cantidadVendida === 0) return;
      const totalIngrediente = row.cantidad * cantidadVendida;
      ingredientes[row.ingrediente_id] = (ingredientes[row.ingrediente_id] || 0) + totalIngrediente;
    });

    for (const [ingredienteId, cantidad] of Object.entries(ingredientes)) {
      const row = db.prepare("SELECT existencia FROM productos WHERE id = ?").get(ingredienteId);
      if (!row) throw new Error(`Ingrediente ${ingredienteId} no encontrado`);
      if (row.existencia < cantidad) {
        throw new Error(`Stock insuficiente para ingrediente ID ${ingredienteId}. Disponible: ${row.existencia}, necesario: ${cantidad}`);
      }
      updateExistencia.run(cantidad, ingredienteId);
      console.log(`✅ Descontado ${cantidad} del ingrediente ID ${ingredienteId}`);
    }

    // Descontar productos simples (sin recetas y que NO son insumos)
    const productosSimples = venta.productos.filter(p => {
      const tieneReceta = productosConRecetas.has(p.producto_id);
      const productoInfo = db.prepare("SELECT categoria FROM productos WHERE id = ?").get(p.producto_id);
      const esInsumo = productoInfo && productoInfo.categoria === 'Insumos';
      return !tieneReceta && !esInsumo;
    });

    console.log(`📦 Productos simples a descontar: ${productosSimples.map(p => p.producto_id).join(', ')}`);

    for (const p of productosSimples) {
      const row = db.prepare("SELECT existencia FROM productos WHERE id = ?").get(p.producto_id);
      if (!row) throw new Error(`Producto ${p.producto_id} no encontrado`);
      if (row.existencia < p.cantidad) {
        throw new Error(`Stock insuficiente para producto ID ${p.producto_id}. Disponible: ${row.existencia}, necesario: ${p.cantidad}`);
      }
      updateExistencia.run(p.cantidad, p.producto_id);
      console.log(`✅ Descontado ${p.cantidad} del producto simple ID ${p.producto_id}`);
    }

    // Insertar detalle de ventas
    for (const p of venta.productos) {
      const sub = p.cantidad * p.precio;
      insertDetalle.run(ventaId, p.producto_id, p.cantidad, p.precio, sub);
    }

    // Actualizar caja (ingresos) si es efectivo
    if (venta.metodo_pago === 'Efectivo') {
      const cajaRow = db.prepare(
        "SELECT id FROM caja WHERE date(fecha) = date(?) AND estado = 'abierta'"
      ).get(fecha);
      if (cajaRow) {
        db.prepare("UPDATE caja SET ingresos = ingresos + ? WHERE id = ?").run(total, cajaRow.id);
      }
    }

    res.json({ mensaje: "Venta guardada correctamente", id: ventaId });
  } catch (err) {
    console.error('❌ Error en venta:', err);
    res.status(500).json({ error: err.message });
  }
});

// Historial de ventas
app.get("/api/ventas", isAuthenticated, (req, res) => {
  const { fecha_inicio, fecha_fin, metodo_pago } = req.query;
  let sql = "SELECT * FROM ventas WHERE 1=1";
  const params = [];
  if (fecha_inicio) {
    sql += " AND fecha >= ?";
    params.push(fecha_inicio);
  }
  if (fecha_fin) {
    sql += " AND fecha <= ?";
    params.push(fecha_fin);
  }
  if (metodo_pago) {
    sql += " AND metodo_pago = ?";
    params.push(metodo_pago);
  }
  sql += " ORDER BY fecha DESC LIMIT 100";
  try {
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detalle de venta
app.get("/api/ventas/:id/detalle", isAuthenticated, (req, res) => {
  const { id } = req.params;
  try {
    const rows = db.prepare(
      `SELECT d.*, p.nombre as producto_nombre
       FROM detalle_ventas d
       JOIN productos p ON d.producto_id = p.id
       WHERE d.venta_id = ?`
    ).all(id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar venta (con reversión de inventario)
app.delete("/api/ventas/:id", isAuthenticated, (req, res) => {
  const ventaId = req.params.id;
  console.log(`🗑️ Eliminando venta #${ventaId}`);
  try {
    const detalles = db.prepare(
      `SELECT d.producto_id, d.cantidad, p.categoria
       FROM detalle_ventas d
       JOIN productos p ON d.producto_id = p.id
       WHERE d.venta_id = ?`
    ).all(ventaId);

    if (detalles.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada o sin detalles" });
    }
    console.log("📋 Detalles de la venta:", detalles);

    const updateExistencia = db.prepare("UPDATE productos SET existencia = existencia + ? WHERE id = ?");
    const recetasStmt = db.prepare("SELECT producto_id, ingrediente_id, cantidad FROM recetas WHERE producto_id = ?");

    for (const det of detalles) {
      const esInsumo = det.categoria === 'Insumos';
      if (esInsumo) continue;

      const recetas = recetasStmt.all(det.producto_id);
      if (recetas.length > 0) {
        for (const rec of recetas) {
          const cantidad = rec.cantidad * det.cantidad;
          updateExistencia.run(cantidad, rec.ingrediente_id);
          console.log(`↩️ Revertido ${cantidad} del ingrediente ID ${rec.ingrediente_id}`);
        }
      } else {
        updateExistencia.run(det.cantidad, det.producto_id);
        console.log(`↩️ Revertido ${det.cantidad} del producto simple ID ${det.producto_id}`);
      }
    }

    db.prepare("DELETE FROM detalle_ventas WHERE venta_id = ?").run(ventaId);
    const result = db.prepare("DELETE FROM ventas WHERE id = ?").run(ventaId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const venta = db.prepare("SELECT metodo_pago, total, fecha FROM ventas WHERE id = ?").get(ventaId);
    if (venta && venta.metodo_pago === 'Efectivo') {
      const cajaRow = db.prepare(
        "SELECT id FROM caja WHERE date(fecha) = date(?) AND estado = 'abierta'"
      ).get(venta.fecha);
      if (cajaRow) {
        db.prepare("UPDATE caja SET ingresos = ingresos - ? WHERE id = ?").run(venta.total, cajaRow.id);
      }
    }

    res.json({ mensaje: "Venta eliminada correctamente" });
  } catch (err) {
    console.error('❌ Error al eliminar venta:', err);
    res.status(500).json({ error: err.message });
  }
});

// Dashboard (resumido por brevedad)
app.get("/api/dashboard", isAuthenticated, (req, res) => {
  const hoy = new Date().toISOString().slice(0, 10);
  try {
    const masVendidos = db.prepare(
      `SELECT p.id, p.nombre, SUM(d.cantidad) as total_vendido
       FROM detalle_ventas d
       JOIN ventas v ON d.venta_id = v.id
       JOIN productos p ON d.producto_id = p.id
       WHERE v.fecha >= date('now', '-30 days')
       GROUP BY p.id
       ORDER BY total_vendido DESC
       LIMIT 5`
    ).all();

    const gananciasHoy = db.prepare(
      `SELECT COALESCE(SUM(total),0) as total_ventas
       FROM ventas
       WHERE date(fecha) = date(?)`
    ).get(hoy);

    const inventarioBajo = db.prepare(
      "SELECT id, nombre, existencia FROM productos WHERE existencia < 10 AND estado='Activo'"
    ).all();

    const cajaDia = db.prepare(
      `SELECT * FROM caja
       WHERE date(fecha) = date(?)
       ORDER BY id DESC LIMIT 1`
    ).get(hoy);

    const ultimasVentas = db.prepare(
      "SELECT * FROM ventas ORDER BY fecha DESC LIMIT 5"
    ).all();

    res.json({
      mas_vendidos: masVendidos,
      ganancias_hoy: gananciasHoy.total_ventas,
      inventario_bajo: inventarioBajo,
      caja_dia: cajaDia || null,
      ultimas_ventas: ultimasVentas
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gastos (resumido)
app.get("/api/gastos", isAuthenticated, (req, res) => {
  const { fecha_inicio, fecha_fin, categoria } = req.query;
  let sql = "SELECT * FROM gastos WHERE 1=1";
  const params = [];
  if (fecha_inicio) {
    sql += " AND fecha >= ?";
    params.push(fecha_inicio);
  }
  if (fecha_fin) {
    sql += " AND fecha <= ?";
    params.push(fecha_fin);
  }
  if (categoria) {
    sql += " AND categoria = ?";
    params.push(categoria);
  }
  sql += " ORDER BY fecha DESC LIMIT 100";
  try {
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/gastos", isAuthenticated, (req, res) => {
  const { descripcion, categoria, monto } = req.body;
  const fecha = new Date().toISOString();
  try {
    const insertGasto = db.prepare(
      "INSERT INTO gastos (fecha, descripcion, categoria, monto) VALUES (?, ?, ?, ?)"
    );
    const result = insertGasto.run(fecha, descripcion, categoria, monto);

    const cajaRow = db.prepare(
      "SELECT id FROM caja WHERE date(fecha) = date(?) AND estado = 'abierta'"
    ).get(fecha);
    if (cajaRow) {
      db.prepare("UPDATE caja SET egresos = egresos + ? WHERE id = ?").run(monto, cajaRow.id);
    }

    res.json({ mensaje: "Gasto registrado", id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Caja (resumido)
app.get("/api/caja/resumen", isAuthenticated, (req, res) => {
  const { fecha } = req.query;
  const hoy = fecha || new Date().toISOString().slice(0, 10);
  try {
    const caja = db.prepare(
      `SELECT * FROM caja WHERE date(fecha) = date(?) ORDER BY id DESC LIMIT 1`
    ).get(hoy);

    const ventasPorMetodo = db.prepare(
      `SELECT metodo_pago, SUM(total) as total
       FROM ventas
       WHERE date(fecha) = date(?)
       GROUP BY metodo_pago`
    ).all(hoy);

    let totalEfectivo = 0, totalTransferencia = 0, totalPedidosYa = 0;
    ventasPorMetodo.forEach(row => {
      if (row.metodo_pago === 'Efectivo') totalEfectivo = row.total || 0;
      else if (row.metodo_pago === 'Transferencia') totalTransferencia = row.total || 0;
      else if (row.metodo_pago === 'Pedidos Ya') totalPedidosYa = row.total || 0;
    });

    const totalVentas = totalEfectivo + totalTransferencia + totalPedidosYa;

    const gastosRow = db.prepare(
      `SELECT COALESCE(SUM(monto),0) as total_gastos
       FROM gastos
       WHERE date(fecha) = date(?)`
    ).get(hoy);
    const totalGastos = gastosRow.total_gastos || 0;

    const apertura = caja ? caja.apertura : 0;
    const efectivoEsperado = apertura + totalEfectivo - totalGastos;

    let detalle = [];
    if (caja && caja.estado === 'cerrada' && caja.detalle_efectivo) {
      try {
        detalle = JSON.parse(caja.detalle_efectivo);
      } catch (e) { detalle = []; }
    }

    res.json({
      caja: caja || null,
      totalEfectivo,
      totalTransferencia,
      totalPedidosYa,
      totalVentas,
      totalGastos,
      efectivoEsperado,
      detalleEfectivo: detalle,
      cierre: caja ? caja.cierre : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/caja/apertura", isAuthenticated, (req, res) => {
  const { monto_apertura } = req.body;
  const fecha = new Date().toISOString();
  try {
    const cajaExistente = db.prepare(
      "SELECT id FROM caja WHERE date(fecha) = date(?) AND estado = 'abierta'"
    ).get(fecha);
    if (cajaExistente) {
      return res.status(400).json({ error: "Ya hay una caja abierta para hoy" });
    }

    const insert = db.prepare(
      "INSERT INTO caja (fecha, apertura, ingresos, egresos, cierre, estado, detalle_efectivo) VALUES (?, ?, 0, 0, 0, 'abierta', '[]')"
    );
    const result = insert.run(fecha, monto_apertura);
    res.json({ mensaje: "Caja abierta correctamente", id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/caja/cierre", isAuthenticated, (req, res) => {
  const { detalle_efectivo } = req.body;
  const fecha = new Date().toISOString();

  let totalContado = 0;
  if (detalle_efectivo && Array.isArray(detalle_efectivo)) {
    detalle_efectivo.forEach(item => {
      totalContado += item.denominacion * item.cantidad;
    });
  }

  try {
    const cajaRow = db.prepare(
      "SELECT id FROM caja WHERE date(fecha) = date(?) AND estado = 'abierta'"
    ).get(fecha);
    if (!cajaRow) {
      return res.status(400).json({ error: "No hay caja abierta para hoy" });
    }

    const detalleJSON = JSON.stringify(detalle_efectivo || []);
    db.prepare(
      "UPDATE caja SET cierre = ?, estado = 'cerrada', detalle_efectivo = ? WHERE id = ?"
    ).run(totalContado, detalleJSON, cajaRow.id);
    res.json({ mensaje: "Caja cerrada correctamente", totalContado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reportes/ganancias", isAuthenticated, (req, res) => {
  const { inicio, fin } = req.query;
  let sql = "SELECT date(fecha) as dia, SUM(total) as total_dia FROM ventas";
  const params = [];
  if (inicio) {
    sql += " WHERE fecha >= ?";
    params.push(inicio);
  }
  if (fin) {
    sql += (inicio ? " AND" : " WHERE") + " fecha <= ?";
    params.push(fin);
  }
  sql += " GROUP BY date(fecha) ORDER BY dia";
  try {
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- INICIAR SERVIDOR ----------
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Error en el servidor:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Excepción no capturada:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});