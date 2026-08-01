const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");

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
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Crear tablas
  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE,
      nombre TEXT,
      categoria TEXT,
      precio REAL,
      existencia REAL DEFAULT 0,
      estado TEXT DEFAULT 'Activo',
      unidad TEXT DEFAULT 'unidad'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT,
      metodo_pago TEXT,
      descuento REAL,
      subtotal REAL,
      total REAL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS detalle_ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER,
      producto_id INTEGER,
      cantidad INTEGER,
      precio REAL,
      subtotal REAL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT,
      descripcion TEXT,
      categoria TEXT,
      monto REAL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS caja (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT,
      apertura REAL,
      ingresos REAL DEFAULT 0,
      egresos REAL DEFAULT 0,
      cierre REAL DEFAULT 0,
      estado TEXT DEFAULT 'abierta',
      detalle_efectivo TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS recetas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER,
      ingrediente_id INTEGER,
      cantidad REAL,
      FOREIGN KEY (producto_id) REFERENCES productos(id),
      FOREIGN KEY (ingrediente_id) REFERENCES productos(id)
    )
  `);

  // ---------- INSERTAR PRODUCTOS DE VENTA ----------
  db.run(`
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

  // ---------- INSERTAR INSUMOS ----------
  db.run(`
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

  // ---------- RECETAS ----------
  db.run(`DELETE FROM recetas`);
  db.run(`
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
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '10'), (SELECT id FROM productos WHERE nombre = 'Café en Grano'), 1
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '10'), (SELECT id FROM productos WHERE nombre = 'Vasos Café Pequeño'), 1
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '10'), (SELECT id FROM productos WHERE nombre = 'Hielo'), 2
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '11'), (SELECT id FROM productos WHERE nombre = 'Café en Grano'), 2
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '11'), (SELECT id FROM productos WHERE nombre = 'Vasos Café Grande'), 1
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '11'), (SELECT id FROM productos WHERE nombre = 'Hielo'), 4
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '12'), (SELECT id FROM productos WHERE nombre = 'Café en Grano'), 1
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '12'), (SELECT id FROM productos WHERE nombre = 'Leche Verde'), 5
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '12'), (SELECT id FROM productos WHERE nombre = 'Vasos Café Pequeño'), 1
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '13'), (SELECT id FROM productos WHERE nombre = 'Café en Grano'), 2
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '13'), (SELECT id FROM productos WHERE nombre = 'Leche Verde'), 8
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '13'), (SELECT id FROM productos WHERE nombre = 'Vasos Café Grande'), 1
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '14'), (SELECT id FROM productos WHERE nombre = 'Leche Verde'), 4
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '14'), (SELECT id FROM productos WHERE nombre = 'Salsa Dulce'), 2
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '14'), (SELECT id FROM productos WHERE nombre = 'Vasos Café Pequeño'), 1
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '15'), (SELECT id FROM productos WHERE nombre = 'Leche Verde'), 6
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '15'), (SELECT id FROM productos WHERE nombre = 'Salsa Dulce'), 3
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '15'), (SELECT id FROM productos WHERE nombre = 'Vasos Café Grande'), 1
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '20'), (SELECT id FROM productos WHERE nombre = 'Café en Grano'), 1
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '20'), (SELECT id FROM productos WHERE nombre = 'Vasos Café Pequeño'), 1
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '20'), (SELECT id FROM productos WHERE nombre = 'Hielo'), 2
    UNION ALL
    SELECT (SELECT id FROM productos WHERE codigo = '20'), (SELECT id FROM productos WHERE nombre = 'Postre del día'), 1
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
});

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
  db.all(
    "SELECT * FROM productos WHERE categoria != 'Insumos' AND estado='Activo' ORDER BY categoria, nombre",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Obtener todos los productos (incluyendo insumos)
app.get("/api/inventario", isAuthenticated, (req, res) => {
  db.all(
    "SELECT * FROM productos WHERE estado='Activo' ORDER BY categoria, nombre",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Actualizar existencia
app.put("/api/productos/:id/existencia", isAuthenticated, (req, res) => {
  const { id } = req.params;
  const { cantidad } = req.body;
  db.run(
    "UPDATE productos SET existencia = existencia + ? WHERE id = ?",
    [cantidad, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res.json({ mensaje: "Existencia actualizada correctamente" });
    }
  );
});

// Registrar venta
app.post("/api/ventas", isAuthenticated, (req, res) => {
  const venta = req.body;
  const subtotal = venta.productos.reduce((sum, p) => sum + p.cantidad * p.precio, 0);
  const total = subtotal - (venta.descuento || 0);
  const fecha = venta.fecha || new Date().toISOString();

  db.run(
    `INSERT INTO ventas (fecha, metodo_pago, descuento, subtotal, total)
     VALUES (?, ?, ?, ?, ?)`,
    [fecha, venta.metodo_pago, venta.descuento || 0, subtotal, total],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const ventaId = this.lastID;

      // Insertar detalle de ventas
      const detalleQueries = venta.productos.map((p) => {
        const sub = p.cantidad * p.precio;
        return new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio, subtotal)
             VALUES (?, ?, ?, ?, ?)`,
            [ventaId, p.producto_id, p.cantidad, p.precio, sub],
            (err2) => {
              if (err2) reject(err2);
              else resolve();
            }
          );
        });
      });

      Promise.all(detalleQueries)
        .then(() => {
          const productoIds = venta.productos.map(p => p.producto_id);
          const placeholders = productoIds.map(() => '?').join(',');

          // Obtener recetas para los productos vendidos
          db.all(
            `SELECT r.producto_id, r.ingrediente_id, r.cantidad
             FROM recetas r
             WHERE r.producto_id IN (${placeholders})`,
            productoIds,
            (err3, recetasRows) => {
              if (err3) {
                console.error(err3);
                return res.status(500).json({ error: err3.message });
              }

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

              // Obtener categorías para saber qué es insumo
              db.all(
                `SELECT id, categoria FROM productos WHERE id IN (${placeholders})`,
                productoIds,
                (err4, categoriasRows) => {
                  if (err4) return res.status(500).json({ error: err4.message });
                  const categoriasPorProducto = {};
                  categoriasRows.forEach(row => {
                    categoriasPorProducto[row.id] = row.categoria;
                  });

                  // Productos simples (sin recetas y que no son insumos)
                  const productosSimples = venta.productos.filter(p => {
                    const tieneReceta = productosConRecetas.has(p.producto_id);
                    const esInsumo = categoriasPorProducto[p.producto_id] === 'Insumos';
                    return !tieneReceta && !esInsumo;
                  });

                  const updatePromises = [];

                  // Descontar ingredientes
                  Object.keys(ingredientes).forEach(ingredienteId => {
                    const cantidadADescontar = ingredientes[ingredienteId];
                    updatePromises.push(new Promise((resolve, reject) => {
                      db.get(
                        "SELECT existencia FROM productos WHERE id = ?",
                        [ingredienteId],
                        (err5, row) => {
                          if (err5) return reject(err5);
                          if (!row) return reject(new Error(`Ingrediente ${ingredienteId} no encontrado`));
                          if (row.existencia < cantidadADescontar) {
                            return reject(new Error(`Stock insuficiente para ingrediente ID ${ingredienteId}. Disponible: ${row.existencia}, necesario: ${cantidadADescontar}`));
                          }
                          db.run(
                            "UPDATE productos SET existencia = existencia - ? WHERE id = ?",
                            [cantidadADescontar, ingredienteId],
                            function (err6) {
                              if (err6) reject(err6);
                              else {
                                console.log(`✅ Descontado ${cantidadADescontar} del ingrediente ID ${ingredienteId}`);
                                resolve();
                              }
                            }
                          );
                        }
                      );
                    }));
                  });

                  // Descontar productos simples
                  productosSimples.forEach(p => {
                    const cantidadADescontar = p.cantidad;
                    updatePromises.push(new Promise((resolve, reject) => {
                      db.get(
                        "SELECT existencia FROM productos WHERE id = ?",
                        [p.producto_id],
                        (err7, row) => {
                          if (err7) return reject(err7);
                          if (!row) return reject(new Error(`Producto ${p.producto_id} no encontrado`));
                          if (row.existencia < cantidadADescontar) {
                            return reject(new Error(`Stock insuficiente para producto ID ${p.producto_id}. Disponible: ${row.existencia}, necesario: ${cantidadADescontar}`));
                          }
                          db.run(
                            "UPDATE productos SET existencia = existencia - ? WHERE id = ?",
                            [cantidadADescontar, p.producto_id],
                            function (err8) {
                              if (err8) reject(err8);
                              else {
                                console.log(`✅ Descontado ${cantidadADescontar} del producto simple ID ${p.producto_id}`);
                                resolve();
                              }
                            }
                          );
                        }
                      );
                    }));
                  });

                  Promise.all(updatePromises)
                    .then(() => {
                      // Actualizar caja (ingresos) si es efectivo
                      if (venta.metodo_pago === 'Efectivo') {
                        db.get(
                          "SELECT id FROM caja WHERE date(fecha) = date(?) AND estado = 'abierta'",
                          [fecha],
                          (err9, row) => {
                            if (row) {
                              db.run(
                                "UPDATE caja SET ingresos = ingresos + ? WHERE id = ?",
                                [total, row.id]
                              );
                            }
                          }
                        );
                      }
                      res.json({ mensaje: "Venta guardada correctamente", id: ventaId });
                    })
                    .catch(err => {
                      console.error(err);
                      res.status(500).json({ error: err.message });
                    });
                }
              );
            }
          );
        })
        .catch(err => {
          console.error(err);
          res.status(500).json({ error: err.message });
        });
    }
  );
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
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Detalle de venta
app.get("/api/ventas/:id/detalle", isAuthenticated, (req, res) => {
  const { id } = req.params;
  db.all(
    `SELECT d.*, p.nombre as producto_nombre
     FROM detalle_ventas d
     JOIN productos p ON d.producto_id = p.id
     WHERE d.venta_id = ?`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Eliminar venta (con reversión de inventario)
app.delete("/api/ventas/:id", isAuthenticated, (req, res) => {
  const ventaId = req.params.id;

  db.all(
    `SELECT d.producto_id, d.cantidad, p.categoria
     FROM detalle_ventas d
     JOIN productos p ON d.producto_id = p.id
     WHERE d.venta_id = ?`,
    [ventaId],
    (err, detalles) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!detalles || detalles.length === 0) {
        return res.status(404).json({ error: "Venta no encontrada o sin detalles" });
      }

      const productoIds = detalles.map(d => d.producto_id);
      const placeholders = productoIds.map(() => '?').join(',');

      db.all(
        `SELECT producto_id, ingrediente_id, cantidad FROM recetas WHERE producto_id IN (${placeholders})`,
        productoIds,
        (err2, recetas) => {
          if (err2) return res.status(500).json({ error: err2.message });

          const recetasPorProducto = {};
          recetas.forEach(r => {
            if (!recetasPorProducto[r.producto_id]) recetasPorProducto[r.producto_id] = [];
            recetasPorProducto[r.producto_id].push(r);
          });

          const revertPromises = [];

          detalles.forEach(det => {
            const esInsumo = det.categoria === 'Insumos';
            const tieneReceta = recetasPorProducto[det.producto_id] && recetasPorProducto[det.producto_id].length > 0;

            if (esInsumo) return;

            if (tieneReceta) {
              recetasPorProducto[det.producto_id].forEach(rec => {
                const cantidad = rec.cantidad * det.cantidad;
                revertPromises.push(new Promise((resolve, reject) => {
                  db.run(
                    "UPDATE productos SET existencia = existencia + ? WHERE id = ?",
                    [cantidad, rec.ingrediente_id],
                    function (err3) {
                      if (err3) reject(err3);
                      else {
                        console.log(`↩️ Revertido ${cantidad} del ingrediente ID ${rec.ingrediente_id}`);
                        resolve();
                      }
                    }
                  );
                }));
              });
            } else {
              revertPromises.push(new Promise((resolve, reject) => {
                db.run(
                  "UPDATE productos SET existencia = existencia + ? WHERE id = ?",
                  [det.cantidad, det.producto_id],
                  function (err4) {
                    if (err4) reject(err4);
                    else {
                      console.log(`↩️ Revertido ${det.cantidad} del producto simple ID ${det.producto_id}`);
                      resolve();
                    }
                  }
                );
              }));
            }
          });

          Promise.all(revertPromises)
            .then(() => {
              db.run("DELETE FROM detalle_ventas WHERE venta_id = ?", [ventaId], (err5) => {
                if (err5) return res.status(500).json({ error: err5.message });
                db.run("DELETE FROM ventas WHERE id = ?", [ventaId], function (err6) {
                  if (err6) return res.status(500).json({ error: err6.message });
                  if (this.changes === 0) {
                    return res.status(404).json({ error: "Venta no encontrada" });
                  }
                  db.get("SELECT metodo_pago, total, fecha FROM ventas WHERE id = ?", [ventaId], (err7, venta) => {
                    if (err7) console.error(err7);
                    if (venta && venta.metodo_pago === 'Efectivo') {
                      db.get(
                        "SELECT id FROM caja WHERE date(fecha) = date(?) AND estado = 'abierta'",
                        [venta.fecha],
                        (err8, row) => {
                          if (row) {
                            db.run(
                              "UPDATE caja SET ingresos = ingresos - ? WHERE id = ?",
                              [venta.total, row.id]
                            );
                          }
                        }
                      );
                    }
                    res.json({ mensaje: "Venta eliminada correctamente" });
                  });
                });
              });
            })
            .catch(err => {
              console.error(err);
              res.status(500).json({ error: err.message });
            });
        }
      );
    }
  );
});

// Dashboard
app.get("/api/dashboard", isAuthenticated, (req, res) => {
  const hoy = new Date().toISOString().slice(0, 10);
  const respuesta = {};

  db.all(
    `SELECT p.id, p.nombre, SUM(d.cantidad) as total_vendido
     FROM detalle_ventas d
     JOIN ventas v ON d.venta_id = v.id
     JOIN productos p ON d.producto_id = p.id
     WHERE v.fecha >= date('now', '-30 days')
     GROUP BY p.id
     ORDER BY total_vendido DESC
     LIMIT 5`,
    [],
    (err, rows) => {
      if (!err) respuesta.mas_vendidos = rows;
      else respuesta.mas_vendidos = [];

      db.get(
        `SELECT COALESCE(SUM(total),0) as total_ventas FROM ventas WHERE date(fecha) = date(?)`,
        [hoy],
        (err2, row) => {
          respuesta.ganancias_hoy = row ? row.total_ventas : 0;

          db.all(
            "SELECT id, nombre, existencia FROM productos WHERE existencia < 10 AND estado='Activo'",
            [],
            (err3, rows3) => {
              respuesta.inventario_bajo = rows3 || [];

              db.get(
                `SELECT * FROM caja WHERE date(fecha) = date(?) ORDER BY id DESC LIMIT 1`,
                [hoy],
                (err4, row4) => {
                  respuesta.caja_dia = row4 || null;

                  db.all(
                    "SELECT * FROM ventas ORDER BY fecha DESC LIMIT 5",
                    [],
                    (err5, rows5) => {
                      respuesta.ultimas_ventas = rows5 || [];
                      res.json(respuesta);
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// Gastos
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
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/gastos", isAuthenticated, (req, res) => {
  const { descripcion, categoria, monto } = req.body;
  const fecha = new Date().toISOString();
  db.run(
    "INSERT INTO gastos (fecha, descripcion, categoria, monto) VALUES (?, ?, ?, ?)",
    [fecha, descripcion, categoria, monto],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get(
        "SELECT id FROM caja WHERE date(fecha) = date(?) AND estado = 'abierta'",
        [fecha],
        (err2, row) => {
          if (row) {
            db.run("UPDATE caja SET egresos = egresos + ? WHERE id = ?", [monto, row.id]);
          }
        }
      );
      res.json({ mensaje: "Gasto registrado", id: this.lastID });
    }
  );
});

// Caja - Resumen
app.get("/api/caja/resumen", isAuthenticated, (req, res) => {
  const { fecha } = req.query;
  const hoy = fecha || new Date().toISOString().slice(0, 10);

  db.get(
    `SELECT * FROM caja WHERE date(fecha) = date(?) ORDER BY id DESC LIMIT 1`,
    [hoy],
    (err, caja) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(
        `SELECT metodo_pago, SUM(total) as total FROM ventas WHERE date(fecha) = date(?) GROUP BY metodo_pago`,
        [hoy],
        (err2, rows) => {
          if (err2) return res.status(500).json({ error: err2.message });

          let totalEfectivo = 0, totalTransferencia = 0, totalPedidosYa = 0;
          rows.forEach(row => {
            if (row.metodo_pago === 'Efectivo') totalEfectivo = row.total || 0;
            else if (row.metodo_pago === 'Transferencia') totalTransferencia = row.total || 0;
            else if (row.metodo_pago === 'Pedidos Ya') totalPedidosYa = row.total || 0;
          });

          const totalVentas = totalEfectivo + totalTransferencia + totalPedidosYa;

          db.get(
            `SELECT COALESCE(SUM(monto),0) as total_gastos FROM gastos WHERE date(fecha) = date(?)`,
            [hoy],
            (err3, gastosRow) => {
              if (err3) return res.status(500).json({ error: err3.message });
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
            }
          );
        }
      );
    }
  );
});

// Abrir caja
app.post("/api/caja/apertura", isAuthenticated, (req, res) => {
  const { monto_apertura } = req.body;
  const fecha = new Date().toISOString();
  db.get(
    "SELECT id FROM caja WHERE date(fecha) = date(?) AND estado = 'abierta'",
    [fecha],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) return res.status(400).json({ error: "Ya hay una caja abierta para hoy" });

      db.run(
        "INSERT INTO caja (fecha, apertura, ingresos, egresos, cierre, estado, detalle_efectivo) VALUES (?, ?, 0, 0, 0, 'abierta', '[]')",
        [fecha, monto_apertura],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ mensaje: "Caja abierta correctamente", id: this.lastID });
        }
      );
    }
  );
});

// Cerrar caja
app.post("/api/caja/cierre", isAuthenticated, (req, res) => {
  const { detalle_efectivo } = req.body;
  const fecha = new Date().toISOString();

  let totalContado = 0;
  if (detalle_efectivo && Array.isArray(detalle_efectivo)) {
    detalle_efectivo.forEach(item => {
      totalContado += item.denominacion * item.cantidad;
    });
  }

  db.get(
    "SELECT id FROM caja WHERE date(fecha) = date(?) AND estado = 'abierta'",
    [fecha],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(400).json({ error: "No hay caja abierta para hoy" });

      const detalleJSON = JSON.stringify(detalle_efectivo || []);
      db.run(
        "UPDATE caja SET cierre = ?, estado = 'cerrada', detalle_efectivo = ? WHERE id = ?",
        [totalContado, detalleJSON, row.id],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ mensaje: "Caja cerrada correctamente", totalContado });
        }
      );
    }
  );
});

// Reporte de ganancias
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
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
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
