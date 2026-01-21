// ===== FUNCIONES PARA REPORTES DE ERRORES Y SUGERENCIAS =====

function abrirModalReportar() {
    document.getElementById('modal-reportar').classList.add('activo');
}

function cerrarModalReportar() {
    document.getElementById('modal-reportar').classList.remove('activo');
    document.getElementById('texto-reporte').value = '';
    document.querySelector('input[name="tipo-reporte"][value="error"]').checked = true;
    document.getElementById('char-count-reporte').textContent = '0 / 500';
}

document.getElementById('btn-reportar').onclick = abrirModalReportar;

document.getElementById('texto-reporte').addEventListener('input', function() {
    const count = this.value.length;
    document.getElementById('char-count-reporte').innerText = `${count} / 500`;
});

document.getElementById('btn-enviar-reporte').onclick = async () => {
    const tipo = document.querySelector('input[name="tipo-reporte"]:checked').value;
    const texto = document.getElementById('texto-reporte').value.trim();

    if (!texto) {
        alert('Por favor escribe tu reporte o sugerencia');
        return;
    }

    const btn = document.getElementById('btn-enviar-reporte');
    btn.disabled = true;
    btn.innerText = 'Enviando...';

    try {
        const res = await fetch('/api/reportes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo: tipo,
                texto: texto,
                usuario_id: datosUsuario.id,
                usuario_nombre: localStorage.getItem('usuario_nombre') || 'Anónimo'
            })
        });

        if (res.ok) {
            alert('✅ Reporte enviado correctamente. ¡Gracias por tu feedback!');
            cerrarModalReportar();
        } else {
            alert('❌ Error al enviar el reporte');
        }
    } catch (e) {
        alert('❌ Error de conexión: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = 'ENVIAR';
    }
};

// Cerrar modal al presionar Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        cerrarModalReportar();
    }
});
