// ==========================================
// SCRIPT DE GESTIÓN DE CURSOS Y AULA VIRTUAL
// ==========================================

const SUPABASE_URL = 'TU_SUPABASE_URL'; 
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let cursoActual = null;
let moduloSeleccionado = null;
let modulosActuales = [];
let alumnoActual = { dni: '12345678' }; // Simulación de usuario logueado[cite: 8]
let progresoCursos = JSON.parse(localStorage.getItem('renmcycf_progreso')) || {};

// ==========================================
// 1. CARGA INICIAL
// ==========================================
async function cargarConfiguracionInicial() {
    await cargarCursosDisponibles();
}

// ==========================================
// 2. DASHBOARD / CURSOS
// ==========================================
async function cargarCursosDisponibles() {
    const grid = document.getElementById('cursos-grid');
    if (!grid) return;
    
    grid.innerHTML = `<div class="col-span-full text-center py-10 text-slate-400 text-xs flex items-center justify-center gap-2"><i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Cargando cursos...</div>`;
    lucide.createIcons();

    try {
        const { data: cursos, error } = await db.from('renmcycf_cursos').select('*');
        if (error) throw error;

        if (!cursos || cursos.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center py-10 text-slate-400 text-xs">No hay cursos disponibles en este momento.</div>`;
            return;
        }

        grid.innerHTML = '';
        cursos.forEach(c => {
            grid.innerHTML += `
            <div onclick="abrirCurso('${c.id}', '${c.titulo}', '${c.descripcion || ''}')" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col">
                <div class="h-40 bg-slate-900 relative overflow-hidden flex items-center justify-center text-[#d4af37]">
                    <i data-lucide="graduation-cap" class="w-12 h-12 group-hover:scale-110 transition-transform"></i>
                </div>
                <div class="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <h4 class="font-black text-lg text-[#0a1128] leading-tight mb-2 group-hover:text-[#d4af37] transition-colors">${c.titulo}</h4>
                        <p class="text-xs text-slate-500 line-clamp-2 mb-4">${c.descripcion || ''}</p>
                    </div>
                    <div class="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-bold">
                        <span class="text-slate-400 flex items-center gap-1"><i data-lucide="book-open" class="w-3.5 h-3.5 text-[#d4af37]"></i> Ver Clases</span>
                        <span class="text-[#0a1128] group-hover:translate-x-1 transition-transform flex items-center gap-1">Acceder →</span>
                    </div>
                </div>
            </div>`;
        });
        lucide.createIcons();
    } catch (err) {
        grid.innerHTML = `<div class="col-span-full text-center py-10 text-red-500 font-bold text-xs">Error al cargar los cursos: ${err.message}</div>`;
    }
}

// ==========================================
// 3. AULA Y MÓDULOS DEL CURSO
// ==========================================
async function abrirCurso(cursoId, titulo, desc) {
    cursoActual = cursoId;
    document.getElementById('aula-curso-titulo').innerText = titulo;
    document.getElementById('aula-titulo-desc').innerText = titulo;
    document.getElementById('aula-desc').innerText = desc || 'Seleccione un módulo del índice lateral para comenzar.';
    
    cambiarPantalla('screen-aula');
    await cargarModulosCurso(cursoId);
    actualizarProgresoUI();
}

async function cargarModulosCurso(cursoId) {
    const container = document.getElementById('aula-modulos');
    container.innerHTML = `<div class="text-center text-slate-400 py-10 text-xs flex flex-col items-center gap-2"><i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i> Cargando módulos...</div>`;
    
    try {
        const { data: modulos, error } = await db.from('renmcycf_modulos').select('*').eq('curso_id', cursoId).order('orden', { ascending: true });
        if (error) throw error;
        
        modulosActuales = modulos || [];
        if (modulosActuales.length === 0) {
            container.innerHTML = `<div class="text-center text-slate-400 py-6 text-xs">No hay módulos cargados para este curso.</div>`;
            return;
        }

        renderizarIndiceModulos();
    } catch (err) {
        container.innerHTML = `<div class="text-center text-red-500 py-6 text-xs">Error al cargar índice.</div>`;
    }
}

function renderizarIndiceModulos() {
    const container = document.getElementById('aula-modulos');
    const pUser = progresoCursos[alumnoActual.dni] || {};
    const completadosCurso = pUser[cursoActual] || [];

    container.innerHTML = modulosActuales.map((m, idx) => {
        const completado = completadosCurso.includes(m.id);
        const activo = moduloSeleccionado && moduloSeleccionado.id === m.id;
        
        let claseExtra = '';
        if (activo) claseExtra = 'active';
        if (completado) claseExtra += ' modulo-completado';

        return `
        <div class="modulo-item ${claseExtra}" onclick='seleccionarModulo(${JSON.stringify(m).replace(/'/g, "&apos;")})'>
            <div class="flex items-center gap-3 overflow-hidden">
                <div class="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-black text-xs text-[#0a1128] border border-slate-200">
                    ${completado ? '<i data-lucide="check" class="w-4 h-4 text-emerald-600"></i>' : (idx + 1)}
                </div>
                <div class="truncate">
                    <p class="text-xs font-black text-[#0a1128] truncate">${m.titulo}</p>
                    <p class="text-[9px] text-slate-400 font-semibold uppercase">${m.duracion || 'Módulo de estudio'}</p>
                </div>
            </div>
            <i data-lucide="${completado ? 'check-circle-2' : 'play-circle'}" class="w-4 h-4 ${completado ? 'text-emerald-600' : 'text-slate-400'} shrink-0"></i>
        </div>`;
    }).join('');
    lucide.createIcons();
}

function seleccionarModulo(modulo) {
    moduloSeleccionado = modulo;
    renderizarIndiceModulos();

    document.getElementById('aula-welcome').classList.add('hidden');
    document.getElementById('aula-player-container').classList.remove('hidden');
    document.getElementById('aula-control-panel').classList.remove('hidden');
    document.getElementById('aula-modulo-nombre').innerText = modulo.titulo;

    const iframe = document.getElementById('aula-iframe');
    let videoUrl = modulo.video_url || '';

    if (videoUrl.includes('youtube.com/watch?v=')) {
        videoUrl = videoUrl.replace('watch?v=', 'embed/');
    } else if (videoUrl.includes('youtu.be/')) {
        videoUrl = videoUrl.replace('youtu.be/', 'www.youtube.com/embed/');
    }

    iframe.src = videoUrl;
}

// ==========================================
// 4. GAMIFICACIÓN Y PROGRESO
// ==========================================
function marcarCompletado() {
    if (!moduloSeleccionado) return;
    
    if (!progresoCursos[alumnoActual.dni]) progresoCursos[alumnoActual.dni] = {};
    if (!progresoCursos[alumnoActual.dni][cursoActual]) progresoCursos[alumnoActual.dni][cursoActual] = [];

    const completados = progresoCursos[alumnoActual.dni][cursoActual];
    if (!completados.includes(moduloSeleccionado.id)) {
        completados.push(moduloSeleccionado.id);
        localStorage.setItem('renmcycf_progreso', JSON.stringify(progresoCursos));
        
        if (typeof confetti === 'function') {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        }
    }

    renderizarIndiceModulos();
    actualizarProgresoUI();
}

function actualizarProgresoUI() {
    if (!modulosActuales.length) return;
    const pUser = progresoCursos[alumnoActual.dni] || {};
    const completados = pUser[cursoActual] || [];
    
    const porcentaje = Math.round((completados.length / modulosActuales.length) * 100);
    
    document.getElementById('progreso-text').innerText = porcentaje + '%';
    document.getElementById('progreso-bar').style.width = porcentaje + '%';

    if (porcentaje >= 25) document.getElementById('insignia-1').classList.add('unlocked');
    if (porcentaje >= 70) document.getElementById('insignia-2').classList.add('unlocked');
    if (porcentaje === 100) document.getElementById('insignia-3').classList.add('unlocked');
}

// ==========================================
// 5. UTILIDADES
// ==========================================
function cambiarPantalla(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function volverAlDashboard() {
    moduloSeleccionado = null;
    document.getElementById('aula-player-container').classList.add('hidden');
    document.getElementById('aula-control-panel').classList.add('hidden');
    document.getElementById('aula-welcome').classList.remove('hidden');
    document.getElementById('aula-iframe').src = '';
    cambiarPantalla('screen-dashboard');
}

window.addEventListener('DOMContentLoaded', () => {
    cargarConfiguracionInicial();
});
