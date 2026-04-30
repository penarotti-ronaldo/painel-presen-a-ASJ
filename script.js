// ==================== VARIÁVEIS GLOBAIS ====================
let dadosAtuais = [];
let slidesPlayer = [];
let midias = [];
let slideIndex = 0;
let playerTimeout = null;
let isPlaying = true;

// ==================== FUNÇÃO PRINCIPAL - PROCESSAR QUALQUER PLANILHA ====================
function processarDados(dados) {
    try {
        console.log("📊 Iniciando processamento...");
        console.log("📋 Total de linhas na planilha:", dados.length);
        
        if (!dados || dados.length === 0) {
            console.error("❌ Planilha vazia");
            alert("A planilha está vazia!");
            return false;
        }
        
        // Mostrar a primeira linha para debug
        console.log("📋 Primeira linha da planilha:", dados[0]);
        console.log("📋 Nomes das colunas:", Object.keys(dados[0]));
        
        // Tentar encontrar as colunas de forma flexível
        let colunaTurma = null;
        let colunaAlunos = null;
        let colunaPresenca = null;
        let colunaFaltas = null;
        let colunaCurso = null;
        
        // Lista de possíveis nomes para cada campo
        const possiveisTurma = ['turma', 'Turma', 'TURMA', 'classe', 'Classe', 'CLASSE', 'serie', 'Serie', 'SERIE', 'série', 'Série', 'turma/curso'];
        const possiveisAlunos = ['alunos ativos', 'Alunos Ativos', 'ALUNOS ATIVOS', 'alunos', 'Alunos', 'ALUNOS', 'total alunos', 'quantidade', 'matriculados'];
        const possiveisPresenca = ['(%) presença', '(%) Presença', '% presença', '% Presença', 'presença', 'Presença', 'PRESENÇA', 'percentual presença', 'frequência'];
        const possiveisFaltas = ['% faltas amparadas', '% Faltas Amparadas', 'faltas amparadas', 'Faltas Amparadas', '% faltas', 'faltas'];
        const possiveisCurso = ['curso', 'Curso', 'CURSO', 'modalidade', 'série', 'turma'];
        
        // Percorrer todas as colunas para encontrar matches
        const colunas = Object.keys(dados[0]);
        
        for (let coluna of colunas) {
            const colunaLower = coluna.toLowerCase().trim();
            
            // Verificar Turma
            if (!colunaTurma && possiveisTurma.some(p => colunaLower.includes(p))) {
                colunaTurma = coluna;
                console.log(`✅ Coluna Turma detectada: "${coluna}"`);
            }
            
            // Verificar Alunos
            if (!colunaAlunos && possiveisAlunos.some(p => colunaLower.includes(p))) {
                colunaAlunos = coluna;
                console.log(`✅ Coluna Alunos detectada: "${coluna}"`);
            }
            
            // Verificar Presença
            if (!colunaPresenca && possiveisPresenca.some(p => colunaLower.includes(p))) {
                colunaPresenca = coluna;
                console.log(`✅ Coluna Presença detectada: "${coluna}"`);
            }
            
            // Verificar Faltas
            if (!colunaFaltas && possiveisFaltas.some(p => colunaLower.includes(p))) {
                colunaFaltas = coluna;
                console.log(`✅ Coluna Faltas detectada: "${coluna}"`);
            }
            
            // Verificar Curso
            if (!colunaCurso && possiveisCurso.some(p => colunaLower.includes(p))) {
                colunaCurso = coluna;
                console.log(`✅ Coluna Curso detectada: "${coluna}"`);
            }
        }
        
        // Se não encontrou, usar a primeira coluna como turma
        if (!colunaTurma && colunas.length > 0) {
            colunaTurma = colunas[0];
            console.log(`⚠️ Usando primeira coluna como Turma: "${colunaTurma}"`);
        }
        
        // Se não encontrou alunos, tentar encontrar qualquer coluna numérica
        if (!colunaAlunos) {
            for (let coluna of colunas) {
                const valor = dados[0][coluna];
                if (typeof valor === 'number' || (typeof valor === 'string' && !isNaN(parseFloat(valor)))) {
                    colunaAlunos = coluna;
                    console.log(`⚠️ Usando coluna numérica como Alunos: "${colunaAlunos}"`);
                    break;
                }
            }
        }
        
        // Se não encontrou presença, tentar encontrar qualquer coluna com %
        if (!colunaPresenca) {
            for (let coluna of colunas) {
                const colunaLower = coluna.toLowerCase();
                if (colunaLower.includes('%') || colunaLower.includes('percent') || colunaLower.includes('porcent')) {
                    colunaPresenca = coluna;
                    console.log(`⚠️ Usando coluna com % como Presença: "${colunaPresenca}"`);
                    break;
                }
            }
        }
        
        // Validar se encontrou o mínimo necessário
        if (!colunaTurma) {
            console.error("❌ Não foi possível identificar a coluna de Turma");
            alert("Não foi possível identificar a coluna de Turma na sua planilha.\n\nColunas encontradas: " + colunas.join(", "));
            return false;
        }
        
        if (!colunaAlunos) {
            console.error("❌ Não foi possível identificar a coluna de Alunos");
            alert("Não foi possível identificar a coluna de Alunos na sua planilha.\n\nColunas encontradas: " + colunas.join(", "));
            return false;
        }
        
        if (!colunaPresenca) {
            console.error("❌ Não foi possível identificar a coluna de Presença");
            alert("Não foi possível identificar a coluna de Presença na sua planilha.\n\nColunas encontradas: " + colunas.join(", "));
            return false;
        }
        
        // Processar cada linha
        const turmasProcessadas = [];
        
        for (let i = 0; i < dados.length; i++) {
            const row = dados[i];
            
            try {
                // Pular linhas vazias
                if (!row || Object.keys(row).length === 0) continue;
                
                // Extrair valores
                let nomeTurma = row[colunaTurma];
                if (!nomeTurma || String(nomeTurma).trim() === '') continue;
                
                // Pular linhas de totais ou resumos
                const nomeStr = String(nomeTurma).toLowerCase();
                if (nomeStr.includes('total') || nomeStr.includes('média') || nomeStr.includes('media') || 
                    nomeStr.includes('resumo') || nomeStr.includes('geral')) {
                    console.log(`⏭️ Pulando linha de total: ${nomeTurma}`);
                    continue;
                }
                
                // Extrair número de alunos
                let alunos = row[colunaAlunos];
                if (typeof alunos === 'string') {
                    alunos = alunos.replace(/[^0-9.-]/g, ''); // Remove caracteres não numéricos
                }
                alunos = parseFloat(alunos);
                if (isNaN(alunos)) alunos = 0;
                
                // Extrair presença
                let presenca = row[colunaPresenca];
                if (typeof presenca === 'string') {
                    // Remove o símbolo % se existir
                    presenca = presenca.replace('%', '').trim();
                    presenca = presenca.replace(',', '.'); // Vírgula para ponto
                }
                presenca = parseFloat(presenca);
                if (isNaN(presenca)) presenca = 0;
                
                // Se a presença estiver entre 0 e 1, multiplica por 100
                if (presenca > 0 && presenca <= 1) {
                    presenca = presenca * 100;
                }
                
                // Extrair faltas amparadas (opcional)
                let faltasAmparadas = 0;
                if (colunaFaltas && row[colunaFaltas] !== undefined && row[colunaFaltas] !== null && row[colunaFaltas] !== '') {
                    let faltas = row[colunaFaltas];
                    if (typeof faltas === 'string') {
                        faltas = faltas.replace('%', '').trim();
                        faltas = faltas.replace(',', '.');
                    }
                    faltasAmparadas = parseFloat(faltas);
                    if (isNaN(faltasAmparadas)) faltasAmparadas = 0;
                    if (faltasAmparadas > 0 && faltasAmparadas <= 1) {
                        faltasAmparadas = faltasAmparadas * 100;
                    }
                }
                
                // Extrair curso (opcional)
                let curso = 'N/A';
                if (colunaCurso && row[colunaCurso] !== undefined && row[colunaCurso] !== null && row[colunaCurso] !== '') {
                    curso = String(row[colunaCurso]);
                }
                
                // Adicionar turma processada
                turmasProcessadas.push({
                    turma: String(nomeTurma).trim(),
                    alunos: alunos,
                    presenca: presenca,
                    faltasAmparadas: faltasAmparadas,
                    curso: curso
                });
                
                console.log(`✅ Turma ${turmasProcessadas.length}: ${nomeTurma} - ${alunos} alunos - ${presenca.toFixed(1)}%`);
                
            } catch (err) {
                console.warn(`⚠️ Erro ao processar linha ${i}:`, err);
            }
        }
        
        if (turmasProcessadas.length === 0) {
            console.error("❌ Nenhuma turma válida encontrada");
            alert("Nenhuma turma válida foi encontrada na planilha.\n\nVerifique se há dados nas linhas.");
            return false;
        }
        
        // Ordenar por nome da turma
        turmasProcessadas.sort((a, b) => a.turma.localeCompare(b.turma));
        
        dadosAtuais = turmasProcessadas;
        
        console.log(`✅ SUCESSO! ${dadosAtuais.length} turmas carregadas:`);
        dadosAtuais.forEach(t => {
            console.log(`   📚 ${t.turma} - ${t.alunos} alunos - ${t.presenca.toFixed(1)}% presença`);
        });
        
        return true;
        
    } catch (error) {
        console.error("❌ Erro fatal ao processar planilha:", error);
        alert("Erro ao processar planilha: " + error.message);
        return false;
    }
}

// ==================== MONTAR SLIDES ====================
function montarSlidesPlayer() {
    slidesPlayer = [];
    
    console.log("🔄 Montando slides...");
    console.log(`📚 Turmas disponíveis: ${dadosAtuais.length}`);
    console.log(`🎬 Mídias disponíveis: ${midias.length}`);

    // Adicionar slides de turmas
    dadosAtuais.forEach((t, index) => {
        slidesPlayer.push({ tipo: 'turma', dados: t });
        console.log(`  + Slide ${index + 1}: Turma ${t.turma}`);
    });

    // Adicionar slides de mídias
    midias.forEach((m, index) => {
        slidesPlayer.push({ tipo: 'midia', dados: m });
        console.log(`  + Slide ${dadosAtuais.length + index + 1}: Mídia (${m.tipo})`);
    });

    console.log(`✅ Total de slides montados: ${slidesPlayer.length}`);
    
    renderizarSlides();
    iniciarPlayer();
}

// ==================== RENDERIZAR SLIDES ====================
function renderizarSlides() {
    const container = document.getElementById('playerSlidesContainer');
    if (!container) {
        console.error("❌ Container não encontrado");
        return;
    }

    container.innerHTML = '';
    const totalSlides = slidesPlayer.length;
    document.getElementById('totalSlidesPlayer').textContent = totalSlides;

    if (totalSlides === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h2>📭 Nenhum dado para exibir</h2>
                <p>Faça upload de uma planilha ou mídias</p>
                <p style="font-size: 0.9em; margin-top: 20px;">Formatos aceitos: .xlsx, .xls, .csv</p>
            </div>
        `;
        return;
    }

    slidesPlayer.forEach((item, idx) => {
        const slide = document.createElement('div');
        slide.className = 'turma-slide-player';
        slide.id = `playerSlide_${idx}`;

        if (item.tipo === 'turma') {
            const t = item.dados;
            slide.innerHTML = `
                <div class="turma-nome-player">🏫 ${t.turma}</div>
                <div class="presenca-destaque-player" id="presencaNumPlayer_${idx}">0%</div>
                <div class="presenca-bar-player">
                    <div id="presencaBarPlayer_${idx}" class="presenca-bar-fill-player"></div>
                </div>
                <div class="info-grid-player">
                    <div class="info-card-player">
                        <div class="info-label-player">👨‍🎓 ALUNOS</div>
                        <div class="info-value-player">${t.alunos}</div>
                    </div>
                    <div class="info-card-player">
                        <div class="info-label-player">⚠️ FALTAS AMPARADAS</div>
                        <div class="info-value-player">${t.faltasAmparadas.toFixed(1)}%</div>
                    </div>
                    <div class="info-card-player">
                        <div class="info-label-player">📚 CURSO</div>
                        <div class="info-value-player">${t.curso}</div>
                    </div>
                </div>
            `;
        } else {
            if (item.dados.tipo === 'imagem') {
                slide.innerHTML = `<img src="${item.dados.src}" class="media-content" alt="Mídia">`;
            } else {
                slide.innerHTML = `
                    <video class="media-video" id="video_${idx}" controls>
                        <source src="${item.dados.src}">
                        Seu navegador não suporta vídeo.
                    </video>
                `;
            }
        }

        container.appendChild(slide);
    });
    
    console.log("🎨 Slides renderizados na tela");
}

// ==================== INICIAR PLAYER ====================
function iniciarPlayer() {
    if (slidesPlayer.length === 0) {
        console.warn("⚠️ Nenhum slide para exibir");
        return;
    }
    
    slideIndex = 0;
    mostrarSlidePlayer(slideIndex);
}

// ==================== MOSTRAR SLIDE ====================
function mostrarSlidePlayer(index) {
    if (!slidesPlayer || slidesPlayer.length === 0) return;
    if (index >= slidesPlayer.length) index = 0;

    clearTimeout(playerTimeout);

    // Parar todos os vídeos
    document.querySelectorAll('.media-video').forEach(video => {
        video.pause();
        video.currentTime = 0;
    });

    const slides = document.querySelectorAll('.turma-slide-player');
    slides.forEach(s => s.classList.remove('active'));

    const slide = document.getElementById(`playerSlide_${index}`);
    if (!slide) return;

    slide.classList.add('active');
    document.getElementById('slideAtualPlayer').textContent = index + 1;
    
    // Atualizar barra de progresso
    const progressoFill = document.getElementById('progressoFillPlayer');
    if (progressoFill) {
        progressoFill.style.width = `${((index + 1) / slidesPlayer.length) * 100}%`;
    }

    const item = slidesPlayer[index];

    if (item.tipo === 'turma') {
        // Animação da barra de presença
        const turma = item.dados;
        const bar = document.getElementById(`presencaBarPlayer_${index}`);
        const num = document.getElementById(`presencaNumPlayer_${index}`);
        
        if (bar && num) {
            let val = 0;
            const target = turma.presenca;
            const duration = 40;
            let frame = 0;
            
            const anim = setInterval(() => {
                frame++;
                val = (target / duration) * frame;
                if (frame >= duration) {
                    val = target;
                    clearInterval(anim);
                }
                bar.style.width = `${val}%`;
                num.textContent = `${val.toFixed(1)}%`;
            }, 25);
        }
        
        playerTimeout = setTimeout(() => proximoSlide(), 5000);
    } 
    else if (item.dados.tipo === 'imagem') {
        playerTimeout = setTimeout(() => proximoSlide(), 5000);
    } 
    else {
        const video = document.getElementById(`video_${index}`);
        if (video) {
            video.currentTime = 0;
            video.play().catch(e => console.log("Autoplay bloqueado:", e));
            video.onended = () => proximoSlide();
        } else {
            playerTimeout = setTimeout(() => proximoSlide(), 5000);
        }
    }
}

// ==================== PRÓXIMO SLIDE ====================
function proximoSlide() {
    if (!isPlaying) return;
    slideIndex = (slideIndex + 1) % slidesPlayer.length;
    mostrarSlidePlayer(slideIndex);
}

// ==================== UPLOAD PLANILHA ====================
function setupUploadPlanilha() {
    const input = document.getElementById('fileInputPrincipal');
    if (!input) return;
    
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        console.log(`📁 Arquivo selecionado: ${file.name}`);
        console.log(`📏 Tamanho: ${(file.size / 1024).toFixed(2)} KB`);
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const primeiraAba = workbook.SheetNames[0];
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[primeiraAba]);
                
                console.log(`📄 Primeira aba: ${primeiraAba}`);
                console.log(`📊 Total de linhas lidas: ${jsonData.length}`);
                
                if (jsonData.length === 0) {
                    alert("❌ A planilha parece estar vazia!");
                    return;
                }
                
                const ok = processarDados(jsonData);
                if (ok) {
                    montarSlidesPlayer();
                    alert(`✅ Planilha carregada com sucesso!\n\n📚 ${dadosAtuais.length} turmas encontradas.\n🎬 ${midias.length} mídias carregadas.`);
                }
                
            } catch (error) {
                console.error("❌ Erro ao ler planilha:", error);
                alert(`❌ Erro ao ler o arquivo: ${error.message}\n\nVerifique se o arquivo é uma planilha válida (.xlsx, .xls, .csv)`);
            }
        };
        
        reader.onerror = function() {
            alert("❌ Erro ao ler o arquivo. Tente novamente.");
        };
        
        reader.readAsArrayBuffer(file);
    });
}

// ==================== UPLOAD MÍDIA ====================
function setupUploadMidia() {
    const input = document.getElementById('mediaInput');
    if (!input) return;
    
    input.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        
        files.forEach(file => {
            midias.push({
                tipo: file.type.startsWith('video') ? 'video' : 'imagem',
                src: URL.createObjectURL(file),
                nome: file.name
            });
        });
        
        if (dadosAtuais.length > 0) {
            montarSlidesPlayer();
        }
        alert(`✅ ${files.length} mídia(s) adicionada(s)!`);
    });
}

// ==================== FULLSCREEN ====================
function setupFullscreen() {
    const playerElement = document.getElementById('fullscreenPlayer');
    if (!playerElement) return;
    
    playerElement.addEventListener('click', (e) => {
        if (e.target.closest('.upload-area-principal')) return;
        
        if (!document.fullscreenElement) {
            playerElement.requestFullscreen().catch(err => {
                console.log("Erro ao entrar em fullscreen:", err);
            });
        } else {
            document.exitFullscreen();
        }
    });
}

// ==================== CONTROLES DE TECLADO ====================
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            isPlaying = !isPlaying;
            if (!isPlaying) {
                clearTimeout(playerTimeout);
                document.querySelectorAll('.media-video').forEach(v => v.pause());
                console.log("⏸️ Player pausado");
            } else {
                proximoSlide();
                console.log("▶️ Player retomado");
            }
        }
        
        if (e.code === 'ArrowRight') {
            e.preventDefault();
            clearTimeout(playerTimeout);
            proximoSlide();
        }
        
        if (e.code === 'ArrowLeft') {
            e.preventDefault();
            clearTimeout(playerTimeout);
            slideIndex = (slideIndex - 1 + slidesPlayer.length) % slidesPlayer.length;
            mostrarSlidePlayer(slideIndex);
        }
    });
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Sistema iniciado - Dashboard Escolar");
    console.log("💡 IMPORTANTE: Abra o console (F12) para ver os logs detalhados");
    console.log("📋 Formatos aceitos: .xlsx, .xls, .csv");
    
    // Configurar eventos
    setupUploadPlanilha();
    setupUploadMidia();
    setupFullscreen();
    setupKeyboardControls();
    
    console.log("✅ Sistema pronto! Faça upload de uma planilha.");
});

// ==================== LIMPEZA DE MEMÓRIA ====================
window.addEventListener('beforeunload', () => {
    midias.forEach(midia => {
        if (midia.src) {
            URL.revokeObjectURL(midia.src);
        }
    });
});