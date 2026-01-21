require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || "facuautoriza";
const fetch = require("node-fetch");
const express = require("express");
const cors = require("cors");
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const multer = require("multer"); 
const path = require("path");
const app = express();

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar PostgreSQL (Neon)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Configurar Multer para memory storage (Cloudinary lo maneja)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// RUTAS CORRECTAS PARA RENDER
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ...existing code...

// --- RUTAS DE PÁGINAS ---
app.get('/login-page', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html')));
app.get('/registro', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'registro.html')));
app.get('/admin-panel', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'admin.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));

// ...existing code... (el resto del código igual)

// --- INICIALIZACIÓN DE TABLAS ---
async function initDB() {
    try {
        // Tabla usuarios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255),
                email VARCHAR(255) UNIQUE,
                password VARCHAR(255),
                rol VARCHAR(50) DEFAULT 'user',
                permiso_nivel VARCHAR(50) DEFAULT 'ver',
                estado VARCHAR(50) DEFAULT 'pendiente',
                expira_en TIMESTAMP DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla cierres
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cierres (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES usuarios(id),
                direccion VARCHAR(255),
                barrio VARCHAR(255),
                localidad VARCHAR(255),
                precio_publicacion DECIMAL,
                precio_cierre DECIMAL,
                tipo_propiedad VARCHAR(50),
                es_ph INTEGER DEFAULT 0,
                piso VARCHAR(50),
                disposicion VARCHAR(50),
                m2_cubiertos DECIMAL,
                m2_terreno DECIMAL,
                antiguedad INTEGER,
                banios INTEGER,
                cocheras INTEGER,
                dormitorios INTEGER,
                credito INTEGER DEFAULT 0,
                dias_mercado VARCHAR(50),
                gas INTEGER DEFAULT 0,
                cloacas INTEGER DEFAULT 0,
                pavimento INTEGER DEFAULT 0,
                pileta INTEGER DEFAULT 0,
                amenities INTEGER DEFAULT 0,
                observaciones TEXT,
                foto VARCHAR(500),
                lat DECIMAL(10, 6),
                lng DECIMAL(10, 6),
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla reportes
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reportes (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES usuarios(id),
                nombre_usuario VARCHAR(255),
                tipo VARCHAR(50),
                mensaje TEXT,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("✅ Tablas verificadas/creadas");
    } catch (err) {
        console.error("❌ Error al inicializar BD:", err);
    }
}

// Crear usuario admin automáticamente
async function createAdminUser() {
    try {
        const result = await pool.query(`SELECT id FROM usuarios WHERE rol = 'admin'`);
        if (result.rows.length === 0) {
            const adminEmail = "admin@inmobiliaria.local";
            const adminPass = await bcrypt.hash("AdminSecure2024!", 10);
            await pool.query(
                `INSERT INTO usuarios (nombre, email, password, estado, rol, permiso_nivel) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                ["Administrador", adminEmail, adminPass, "activo", "admin", "cargar"]
            );
            console.log("✅ Usuario admin creado automáticamente");
        }
    } catch (err) {
        console.error("Error al crear admin:", err);
    }
}

// Inicializar BD
initDB().then(() => createAdminUser());

// --- FUNCIÓN PARA LIMPIAR NÚMEROS ---
// Convierte strings vacíos a null, y strings numéricos a numbers
const limpiarNum = (val) => {
    if (val === undefined || val === null || val === "") return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
};

// --- FUNCIÓN PARA LIMPIAR BOOLEANOS ---
// Asegura que los checkboxes sean 0 o 1
const limpiarBool = (val) => {
    // Si viene como string "0" o "1" desde FormData, convertir a int
    if (val === "0" || val === 0 || !val || val === false) return 0;
    if (val === "1" || val === 1 || val === true) return 1;
    return 0;
};

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
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(`SELECT * FROM usuarios WHERE email = $1`, [email]);
        const user = result.rows[0];
        if (!user) return res.status(401).json({ error: "Usuario no encontrado" });
        if (user.estado === 'pendiente') return res.status(403).json({ error: "Cuenta no aprobada" });
        const esValida = await bcrypt.compare(password, user.password);
        if (!esValida) return res.status(401).json({ error: "Contraseña incorrecta" });
        const token = jwt.sign({ 
            id: user.id, 
            nombre: user.nombre, 
            rol: user.rol, 
            permiso_nivel: user.permiso_nivel 
        }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/registrar', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            `INSERT INTO usuarios (nombre, email, password, estado, rol, permiso_nivel) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [nombre, email, hash, 'pendiente', 'user', 'ver']
        );
        res.json({ message: "✅ Registrado - Aguardando aprobación del administrador" });
    } catch (err) {
        res.status(400).json({ error: "Email ya registrado" });
    }
});

// --- API ADMIN ---
app.get('/admin/usuarios', soloAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                usuarios.id, usuarios.nombre, usuarios.email, usuarios.estado, 
                usuarios.permiso_nivel, usuarios.rol, usuarios.expira_en,
                COUNT(cierres.id) as total_cierres
            FROM usuarios
            LEFT JOIN cierres ON cierres.usuario_id = usuarios.id
            GROUP BY usuarios.id
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/admin/cierres-usuario/:id', soloAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM cierres WHERE usuario_id = $1`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/admin/usuarios/permisos', soloAdmin, async (req, res) => {
    const { id, estado, permiso_nivel, rol, horas_temporales } = req.body;
    try {
        const userResult = await pool.query(`SELECT * FROM usuarios WHERE id = $1`, [id]);
        const user = userResult.rows[0];
        if (!user) return res.status(404).json({ error: "No encontrado" });
        
        const nEstado = estado !== undefined ? estado : user.estado;
        const nPermiso = permiso_nivel !== undefined ? permiso_nivel : user.permiso_nivel;
        const nRol = rol !== undefined ? rol : user.rol;
        let nExpira = user.expira_en;
        
        if (horas_temporales && horas_temporales !== "0") {
            let d = new Date();
            d.setHours(d.getHours() + parseInt(horas_temporales));
            nExpira = d.toISOString();
        } else if (horas_temporales === "0") {
            nExpira = null;
        }
        
        await pool.query(
            `UPDATE usuarios SET estado=$1, permiso_nivel=$2, rol=$3, expira_en=$4 WHERE id=$5`,
            [nEstado, nPermiso, nRol, nExpira, id]
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/admin/usuarios/:id', soloAdmin, async (req, res) => {
    try {
        await pool.query(`DELETE FROM cierres WHERE usuario_id = $1`, [req.params.id]);
        await pool.query(`DELETE FROM usuarios WHERE id = $1`, [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API CIERRES ---
app.get("/cierres", verificarToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT cierres.*, usuarios.nombre as cargado_por 
            FROM cierres 
            LEFT JOIN usuarios ON cierres.usuario_id = usuarios.id
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/cierres", verificarToken, upload.single('foto'), async (req, res) => {
    const d = req.body;
    let fotoUrl = null;

    try {
        // Subir foto a Cloudinary si existe
        if (req.file) {
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { 
                        resource_type: "auto",
                        folder: "mapa-cierres"
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(req.file.buffer);
            });
            fotoUrl = uploadResult.secure_url;
        }

        // Geocodificar dirección
        const queryGeo = encodeURIComponent(`${d.direccion}, ${d.localidad}, Cordoba, Argentina`);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${queryGeo}`, 
            { headers: { 'User-Agent': 'App' } }
        );
        const geoData = await response.json();
        const lat = geoData.length > 0 ? parseFloat(geoData[0].lat) : -31.4241;
        const lng = geoData.length > 0 ? parseFloat(geoData[0].lon) : -64.4978;

        // Insertar en BD
        await pool.query(
            `INSERT INTO cierres 
             (usuario_id, direccion, barrio, localidad, precio_publicacion, precio_cierre, tipo_propiedad, 
              es_ph, piso, disposicion, m2_cubiertos, m2_terreno, antiguedad, banios, cocheras, dormitorios, 
              credito, dias_mercado, gas, cloacas, pavimento, pileta, amenities, observaciones, foto, lat, lng) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)`,
            [
                req.usuario.id, 
                d.direccion, 
                d.barrio, 
                d.localidad, 
                limpiarNum(d.precio_publicacion),
                limpiarNum(d.precio_cierre), 
                d.tipo_propiedad, 
                limpiarBool(d.es_ph), 
                d.piso, 
                d.disposicion, 
                limpiarNum(d.m2_cubiertos), 
                limpiarNum(d.m2_terreno), 
                limpiarNum(d.antiguedad), 
                limpiarNum(d.banios), 
                limpiarNum(d.cocheras), 
                limpiarNum(d.dormitorios), 
                limpiarBool(d.credito), 
                d.dias_mercado, 
                limpiarBool(d.gas), 
                limpiarBool(d.cloacas), 
                limpiarBool(d.pavimento), 
                limpiarBool(d.pileta), 
                limpiarBool(d.amenities), 
                d.observaciones, 
                fotoUrl, 
                lat, 
                lng
            ]
        );
        res.json({ ok: true });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});

app.delete('/cierres/:id', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(`SELECT usuario_id, foto FROM cierres WHERE id = $1`, [req.params.id]);
        const cierre = result.rows[0];
        
        if (!cierre || (cierre.usuario_id !== req.usuario.id && req.usuario.rol !== 'admin')) {
            return res.status(403).json({ error: "No permitido" });
        }
        
        // Eliminar de Cloudinary si existe
        if (cierre.foto) {
            try {
                const publicId = cierre.foto.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`mapa-cierres/${publicId}`);
            } catch(e) {}
        }
        
        await pool.query(`DELETE FROM cierres WHERE id = $1`, [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/activar-mi-usuario', async (req, res) => {
    try {
        await pool.query(`UPDATE usuarios SET estado = 'activo', rol = 'admin' WHERE email = 'denunfacu98@gmail.com'`);
        res.send("OK Admin");
    } catch (err) {
        res.send("Error");
    }
});

// --- API REPORTES ---
app.post('/reportes', verificarToken, async (req, res) => {
    const { tipo, mensaje } = req.body;
    if (!tipo || !mensaje) {
        return res.status(400).json({ error: "Faltan datos" });
    }
    try {
        await pool.query(
            `INSERT INTO reportes (usuario_id, nombre_usuario, tipo, mensaje) VALUES ($1, $2, $3, $4)`,
            [req.usuario.id, req.usuario.nombre, tipo, mensaje]
        );
        res.json({ ok: true, message: "Reporte enviado exitosamente" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/reportes', soloAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, usuario_id, nombre_usuario, tipo, mensaje, creado_en FROM reportes ORDER BY creado_en DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/reportes/:id', soloAdmin, async (req, res) => {
    try {
        await pool.query(`DELETE FROM reportes WHERE id = $1`, [req.params.id]);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
