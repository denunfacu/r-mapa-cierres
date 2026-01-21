const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || "facuautoriza";
const fetch = require("node-fetch");
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const multer = require("multer"); 
const fs = require("fs");
const app = express();

// Crear directorios necesarios si no existen
const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';
if (!fs.existsSync(UPLOADS_DIR)) { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); }

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR + '/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const DB_PATH = process.env.DB_PATH || "./cierres.db";
const db = new sqlite3.Database(DB_PATH);


// --- INICIALIZACIÓN DE TABLAS ---
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT, email TEXT UNIQUE, password TEXT,
        rol TEXT DEFAULT 'user', permiso_nivel TEXT DEFAULT 'ver', 
        estado TEXT DEFAULT 'pendiente', expira_en DATETIME DEFAULT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS cierres (
        id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER,
        direccion TEXT, barrio TEXT, localidad TEXT, precio_publicacion INTEGER, precio_cierre INTEGER,
        tipo_propiedad TEXT, es_ph INTEGER, piso TEXT, disposicion TEXT,
        m2_cubiertos REAL, m2_terreno REAL,
        antiguedad INTEGER, banios INTEGER, cocheras INTEGER, dormitorios INTEGER,
        credito INTEGER, dias_mercado TEXT, gas INTEGER, cloacas INTEGER, pavimento INTEGER,
        pileta INTEGER, amenities INTEGER, observaciones TEXT,
        foto TEXT, lat REAL, lng REAL, creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reportes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        nombre_usuario TEXT,
        tipo TEXT,
        mensaje TEXT,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )`);
});

// --- CREAR USUARIO ADMIN AUTOMÁTICAMENTE (solo si no existe) ---
db.serialize(() => {
    db.get(`SELECT id FROM usuarios WHERE rol = 'admin'`, async (err, row) => {
        if (!row) {
            const adminEmail = "admin@inmobiliaria.local";
            const adminPass = await bcrypt.hash("AdminSecure2024!", 10);
            db.run(
                `INSERT INTO usuarios (nombre, email, password, estado, rol, permiso_nivel) VALUES (?, ?, ?, ?, ?, ?)`,
                ["Administrador", adminEmail, adminPass, "activo", "admin", "cargar"],
                (err) => {
                    if (!err) console.log("✅ Usuario admin creado automáticamente");
                }
            );
        }
    });
});

// --- MIDDLEWARES ---
function verificarToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: "No hay token" });
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Sesión expirada" });
        req.usuario = decoded;
        next();
    });
}

function soloAdmin(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: "No hay token" });
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err || decoded.rol !== 'admin') return res.status(403).json({ error: "Acceso denegado" });
        req.usuario = decoded;
        next();
    });
}

// --- RUTAS DE PÁGINAS ---
app.get('/login-page', (req, res) => res.sendFile(path.join(__dirname, '../frontend/login.html')));
app.get('/registro', (req, res) => res.sendFile(path.join(__dirname, '../frontend/registro.html')));
app.get('/admin-panel', (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

// --- API USUARIOS ---
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], async (err, user) => {
        if (!user) return res.status(401).json({ error: "Usuario no encontrado" });
        if (user.estado === 'pendiente') return res.status(403).json({ error: "Cuenta no aprobada" });
        const esValida = await bcrypt.compare(password, user.password);
        if (!esValida) return res.status(401).json({ error: "Contraseña incorrecta" });
        const token = jwt.sign({ id: user.id, nombre: user.nombre, rol: user.rol, permiso_nivel: user.permiso_nivel }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token });
    });
});

app.post('/registrar', async (req, res) => {
    const { nombre, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    
    // Todos los nuevos usuarios registrados quedan en pendiente de aprobación
    db.run(
        `INSERT INTO usuarios (nombre, email, password, estado, rol, permiso_nivel) VALUES (?, ?, ?, ?, ?, ?)`, 
        [nombre, email, hash, 'pendiente', 'user', 'ver'], 
        (err) => {
            if (err) {
                console.error("Error al registrar:", err);
                return res.status(400).json({ error: "Email ya registrado" });
            }
            res.json({ message: "✅ Registrado - Aguardando aprobación del administrador" });
        }
    );
});

// --- API ADMIN ---

// 1. Obtener lista de usuarios
app.get('/admin/usuarios', soloAdmin, (req, res) => {
    const sql = `SELECT id, nombre, email, estado, permiso_nivel, rol, expira_en,
        (SELECT COUNT(*) FROM cierres WHERE usuario_id = usuarios.id) as total_cierres FROM usuarios`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// 2. MODO ESPÍA 
app.get('/admin/cierres-usuario/:id', soloAdmin, (req, res) => {
    db.all(
        "SELECT * FROM cierres WHERE usuario_id = ?",
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            return res.json(rows || []); 
        }
    );
});


// 3. Actualizar permisos
app.put('/admin/usuarios/permisos', soloAdmin, (req, res) => {
    const { id, estado, permiso_nivel, rol, horas_temporales } = req.body;
    db.get("SELECT * FROM usuarios WHERE id = ?", [id], (err, user) => {
        if (err || !user) return res.status(404).json({ error: "No encontrado" });
        const nEstado = estado !== undefined ? estado : user.estado;
        const nPermiso = permiso_nivel !== undefined ? permiso_nivel : user.permiso_nivel;
        const nRol = rol !== undefined ? rol : user.rol;
        let nExpira = user.expira_en;
        if (horas_temporales && horas_temporales !== "0") {
            let d = new Date(); d.setHours(d.getHours() + parseInt(horas_temporales));
            nExpira = d.toISOString();
        } else if (horas_temporales === "0") { nExpira = null; }
        db.run(`UPDATE usuarios SET estado=?, permiso_nivel=?, rol=?, expira_en=? WHERE id=?`, 
        [nEstado, nPermiso, nRol, nExpira, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ok: true });
        });
    });
});

// 4. Eliminar Usuario
app.delete('/admin/usuarios/:id', soloAdmin, (req, res) => {
    db.run("DELETE FROM cierres WHERE usuario_id = ?", [req.params.id], () => {
        db.run("DELETE FROM usuarios WHERE id = ?", [req.params.id], () => res.json({ ok: true }));
    });
});

// --- API CIERRES ---
app.get("/cierres", verificarToken, (req, res) => {
    db.all(`SELECT cierres.*, usuarios.nombre as cargado_por FROM cierres LEFT JOIN usuarios ON cierres.usuario_id = usuarios.id`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.post("/cierres", verificarToken, upload.single('foto'), async (req, res) => {
    const d = req.body;
    const fotoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    try {
        const queryGeo = encodeURIComponent(`${d.direccion}, ${d.localidad}, Cordoba, Argentina`);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${queryGeo}`, { headers: { 'User-Agent': 'App' } });
        const data = await response.json();
        const lat = data.length > 0 ? parseFloat(data[0].lat) : -31.4241;
        const lng = data.length > 0 ? parseFloat(data[0].lon) : -64.4978;
        const sql = `INSERT INTO cierres (usuario_id, direccion, barrio, localidad, precio_publicacion, precio_cierre, tipo_propiedad, es_ph, piso, disposicion, m2_cubiertos, m2_terreno, antiguedad, banios, cocheras, dormitorios, credito, dias_mercado, gas, cloacas, pavimento, pileta, amenities, observaciones, foto, lat, lng) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
        db.run(sql, [req.usuario.id, d.direccion, d.barrio, d.localidad, d.precio_publicacion, d.precio_cierre, d.tipo_propiedad, d.es_ph ? 1 : 0, d.piso, d.disposicion, d.m2_cubiertos, d.m2_terreno, d.antiguedad, d.banios, d.cocheras, d.dormitorios, d.credito ? 1 : 0, d.dias_mercado, d.gas ? 1 : 0, d.cloacas ? 1 : 0, d.pavimento ? 1 : 0, d.pileta ? 1 : 0, d.amenities ? 1 : 0, d.observaciones, fotoUrl, lat, lng], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ok: true });
        });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.delete('/cierres/:id', verificarToken, (req, res) => {
    db.get("SELECT usuario_id, foto FROM cierres WHERE id = ?", [req.params.id], (err, c) => {
        if (c && (c.usuario_id === req.usuario.id || req.usuario.rol === 'admin')) {
            if (c.foto) { try { fs.unlinkSync(path.join(__dirname, '..', c.foto)); } catch(e){} }
            db.run(`DELETE FROM cierres WHERE id = ?`, [req.params.id], () => res.json({ ok: true }));
        } else { res.status(403).json({ error: "No permitido" }); }
    });
});

app.get('/activar-mi-usuario', (req, res) => {
    db.run(`UPDATE usuarios SET estado = 'activo', rol = 'admin' WHERE email = 'denunfacu98@gmail.com'`, () => res.send("OK Admin"));
});

// --- API REPORTES ---

// Crear reporte (accesible para todos los usuarios)
app.post('/reportes', verificarToken, (req, res) => {
    const { tipo, mensaje } = req.body;
    if (!tipo || !mensaje) {
        return res.status(400).json({ error: "Faltan datos" });
    }
    db.run(
        `INSERT INTO reportes (usuario_id, nombre_usuario, tipo, mensaje) VALUES (?, ?, ?, ?)`,
        [req.usuario.id, req.usuario.nombre, tipo, mensaje],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ok: true, message: "Reporte enviado exitosamente" });
        }
    );
});

// Obtener todos los reportes (solo admin)
app.get('/reportes', soloAdmin, (req, res) => {
    db.all(
        `SELECT id, usuario_id, nombre_usuario, tipo, mensaje, creado_en FROM reportes ORDER BY creado_en DESC`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows || []);
        }
    );
});

// Eliminar reporte (solo admin)
app.delete('/reportes/:id', soloAdmin, (req, res) => {
    db.run(
        `DELETE FROM reportes WHERE id = ?`,
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ok: true });
        }
    );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));