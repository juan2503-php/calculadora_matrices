/* ============================================
   App Logic — Matrix Condition Generator
   ============================================ */

// ---- State ----
let selectedCells = new Set();
let isPainting = false;
let paintMode = null; // 'select' or 'deselect'
let currentLang = 'java';
let latestCondition = '';
const lastCellTapTimes = new Map();
const DOUBLE_TAP_DELAY = 400; // ms para detectar doble toque

// ---- Letter Presets (5x5) ----
const LETTER_PRESETS = {
    'A': [[0,1],[0,2],[0,3],[1,0],[1,4],[2,0],[2,1],[2,2],[2,3],[2,4],[3,0],[3,4],[4,0],[4,4]],
    'B': [[0,0],[0,1],[0,2],[0,3],[1,0],[1,4],[2,0],[2,1],[2,2],[2,3],[3,0],[3,4],[4,0],[4,1],[4,2],[4,3]],
    'C': [[0,1],[0,2],[0,3],[0,4],[1,0],[2,0],[3,0],[4,1],[4,2],[4,3],[4,4]],
    'D': [[0,0],[0,1],[0,2],[0,3],[1,0],[1,4],[2,0],[2,4],[3,0],[3,4],[4,0],[4,1],[4,2],[4,3]],
    'E': [[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[2,0],[2,1],[2,2],[3,0],[4,0],[4,1],[4,2],[4,3],[4,4]],
    'F': [[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[2,0],[2,1],[2,2],[3,0],[4,0]],
    'G': [[0,1],[0,2],[0,3],[1,0],[2,0],[2,2],[2,3],[2,4],[3,0],[3,4],[4,1],[4,2],[4,3]],
    'H': [[0,0],[0,4],[1,0],[1,4],[2,0],[2,1],[2,2],[2,3],[2,4],[3,0],[3,4],[4,0],[4,4]],
    'I': [[0,0],[0,1],[0,2],[0,3],[0,4],[1,2],[2,2],[3,2],[4,0],[4,1],[4,2],[4,3],[4,4]],
    'J': [[0,0],[0,1],[0,2],[0,3],[0,4],[1,3],[2,3],[3,0],[3,3],[4,1],[4,2]],
    'K': [[0,0],[0,4],[1,0],[1,3],[2,0],[2,1],[2,2],[3,0],[3,3],[4,0],[4,4]],
    'L': [[0,0],[1,0],[2,0],[3,0],[4,0],[4,1],[4,2],[4,3],[4,4]],
    'M': [[0,0],[0,4],[1,0],[1,1],[1,3],[1,4],[2,0],[2,2],[2,4],[3,0],[3,4],[4,0],[4,4]],
    'N': [[0,0],[0,4],[1,0],[1,1],[1,4],[2,0],[2,2],[2,4],[3,0],[3,3],[3,4],[4,0],[4,4]],
    'O': [[0,1],[0,2],[0,3],[1,0],[1,4],[2,0],[2,4],[3,0],[3,4],[4,1],[4,2],[4,3]],
    'P': [[0,0],[0,1],[0,2],[0,3],[1,0],[1,4],[2,0],[2,1],[2,2],[2,3],[3,0],[4,0]],
    'Q': [[0,1],[0,2],[0,3],[1,0],[1,4],[2,0],[2,4],[3,0],[3,3],[4,1],[4,2],[4,4]],
    'R': [[0,0],[0,1],[0,2],[0,3],[1,0],[1,4],[2,0],[2,1],[2,2],[2,3],[3,0],[3,3],[4,0],[4,4]],
    'S': [[0,1],[0,2],[0,3],[0,4],[1,0],[2,1],[2,2],[2,3],[3,4],[4,0],[4,1],[4,2],[4,3]],
    'T': [[0,0],[0,1],[0,2],[0,3],[0,4],[1,2],[2,2],[3,2],[4,2]],
    'U': [[0,0],[0,4],[1,0],[1,4],[2,0],[2,4],[3,0],[3,4],[4,1],[4,2],[4,3]],
    'V': [[0,0],[0,4],[1,0],[1,4],[2,1],[2,3],[3,1],[3,3],[4,2]],
    'W': [[0,0],[0,4],[1,0],[1,4],[2,0],[2,2],[2,4],[3,0],[3,1],[3,3],[3,4],[4,0],[4,4]],
    'X': [[0,0],[0,4],[1,1],[1,3],[2,2],[3,1],[3,3],[4,0],[4,4]],
    'Y': [[0,0],[0,4],[1,1],[1,3],[2,2],[3,2],[4,2]],
    'Z': [[0,0],[0,1],[0,2],[0,3],[0,4],[1,3],[2,2],[3,1],[4,0],[4,1],[4,2],[4,3],[4,4]],
};

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
    buildPresets();
    rebuildMatrix();
    initPresetsAccordion();
});

function initPresetsAccordion() {
    const panel = document.getElementById('presetsPanel');
    if (!panel) return;
    panel.open = window.innerWidth > 960;
}

// ---- Presets ----
function buildPresets() {
    const grid = document.getElementById('presetsGrid');
    grid.innerHTML = '';
    for (const letter of Object.keys(LETTER_PRESETS)) {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.textContent = letter;
        btn.title = `Letra ${letter}`;
        btn.addEventListener('click', () => applyPreset(letter));
        grid.appendChild(btn);
    }
}

function applyPreset(letter) {
    const numRows = parseInt(document.getElementById('numRows').value);
    const numCols = parseInt(document.getElementById('numCols').value);

    // Presets are designed for 5x5 — adjust if needed
    if (numRows !== 5 || numCols !== 5) {
        document.getElementById('numRows').value = 5;
        document.getElementById('numCols').value = 5;
        rebuildMatrix();
    }

    selectedCells.clear();
    const preset = LETTER_PRESETS[letter];
    if (preset) {
        preset.forEach(([f, c]) => selectedCells.add(`${f},${c}`));
    }
    updateAllCellVisuals();
    generateCondition();
    updateCounter();
}

// ---- Cell Click & Touch Interaction ----
function handleCellInteraction(cell, key, coordEvent, isRightClick = false) {
    if (isRightClick) {
        selectedCells.delete(key);
        lastCellTapTimes.delete(key);
        paintMode = 'deselect';
        isPainting = true;
        updateCellVisual(cell, key);
        addRipple(cell, coordEvent);
        generateCondition();
        updateCounter();
        return;
    }

    const now = Date.now();
    const lastTime = lastCellTapTimes.get(key) || 0;
    const isDouble = (now - lastTime) < DOUBLE_TAP_DELAY;

    if (!selectedCells.has(key)) {
        // 1 toque: seleccionar
        selectedCells.add(key);
        lastCellTapTimes.set(key, now);
        paintMode = 'select';
        isPainting = true;
        updateCellVisual(cell, key);
        addRipple(cell, coordEvent);
        generateCondition();
        updateCounter();
    } else {
        // Celda ya seleccionada
        if (isDouble) {
            // 2 toques rápidos: deseleccionar
            selectedCells.delete(key);
            lastCellTapTimes.delete(key);
            paintMode = 'deselect';
            isPainting = true;
            updateCellVisual(cell, key);
            addRipple(cell, coordEvent);
            generateCondition();
            updateCounter();
        } else {
            // Primer toque en celda seleccionada: guardar timestamp
            lastCellTapTimes.set(key, now);
            paintMode = null;
            isPainting = false;
            addRipple(cell, coordEvent);
        }
    }
}

// ---- Matrix Building ----
function rebuildMatrix() {
    const numRows = parseInt(document.getElementById('numRows').value) || 5;
    const numCols = parseInt(document.getElementById('numCols').value) || 5;

    // Clamp values
    const rows = Math.max(2, Math.min(15, numRows));
    const cols = Math.max(2, Math.min(15, numCols));
    document.getElementById('numRows').value = rows;
    document.getElementById('numCols').value = cols;

    // Update label
    document.getElementById('matrixSizeLabel').textContent = `${rows}×${cols}`;

    // Adjust cell size based on matrix size and available space
    const maxCellSize = calculateCellSize(rows, cols);
    document.documentElement.style.setProperty('--cell-size', `${maxCellSize}px`);

    // Set grid layout only on matrixGrid
    const grid = document.getElementById('matrixGrid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
    grid.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;

    // Build cells
    for (let f = 0; f < rows; f++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'matrix-cell';
            cell.dataset.row = f;
            cell.dataset.col = c;
            cell.id = `cell-${f}-${c}`;

            const key = `${f},${c}`;

            const indexLabel = document.createElement('span');
            indexLabel.className = 'cell-index';
            indexLabel.textContent = `${f}.${c}`;

            const dot = document.createElement('span');
            dot.className = 'cell-dot';

            cell.appendChild(indexLabel);
            cell.appendChild(dot);

            // Pointer Events — un solo evento para mouse Y touch, sin duplicados
            cell.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                const key = `${f},${c}`;
                handleCellInteraction(cell, key, e, e.button === 2);
            });

            // Drag-painting en desktop (mouse hover mientras se arrastra)
            cell.addEventListener('mouseenter', () => {
                if (!isPainting || !paintMode) return;
                const key = `${f},${c}`;
                if (paintMode === 'select' && !selectedCells.has(key)) {
                    selectedCells.add(key);
                    updateCellVisual(cell, key);
                    generateCondition();
                    updateCounter();
                } else if (paintMode === 'deselect' && selectedCells.has(key)) {
                    selectedCells.delete(key);
                    updateCellVisual(cell, key);
                    generateCondition();
                    updateCounter();
                }
            });

            cell.addEventListener('contextmenu', (e) => e.preventDefault());

            // Check if previously selected
            if (selectedCells.has(`${f},${c}`)) {
                cell.classList.add('selected');
            }

            grid.appendChild(cell);
        }
    }

    // Grid pointermove for dragging across cells on mobile
    grid.addEventListener('pointermove', (e) => {
        if (!isPainting || !paintMode) return;
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const cellEl = target ? target.closest('.matrix-cell') : null;
        if (cellEl && cellEl.dataset.row !== undefined) {
            const k = `${cellEl.dataset.row},${cellEl.dataset.col}`;
            if (paintMode === 'select' && !selectedCells.has(k)) {
                selectedCells.add(k);
                updateCellVisual(cellEl, k);
                generateCondition();
                updateCounter();
            } else if (paintMode === 'deselect' && selectedCells.has(k)) {
                selectedCells.delete(k);
                updateCellVisual(cellEl, k);
                generateCondition();
                updateCounter();
            }
        }
    });

    // Clean up selections that are out of bounds
    const toRemove = [];
    selectedCells.forEach(key => {
        const [f, c] = key.split(',').map(Number);
        if (f >= rows || c >= cols) toRemove.push(key);
    });
    toRemove.forEach(k => selectedCells.delete(k));

    generateCondition();
    updateCounter();
}

// Global pointer events for paint mode
document.addEventListener('pointerup', () => {
    isPainting = false;
    paintMode = null;
});

document.addEventListener('pointercancel', () => {
    isPainting = false;
    paintMode = null;
});

function calculateCellSize(rows, cols) {
    if (window.innerWidth >= 1024) {
        // Desktop single-screen encuadre principal
        const availH = Math.max(180, window.innerHeight - 170);
        const containerW = Math.min(window.innerWidth, 1560) - 40;
        const centerColW = containerW * 0.33;
        const availW = Math.max(220, centerColW - 40);

        const sizeH = Math.floor((availH - (rows * 6)) / rows);
        const sizeW = Math.floor((availW - (cols * 6)) / cols);
        return Math.max(22, Math.min(50, Math.min(sizeH, sizeW)));
    } else {
        // Mobile / tablet
        const containerWidth = Math.min(window.innerWidth - (window.innerWidth < 600 ? 44 : 80), 540);
        const calculatedSize = Math.floor((containerWidth - (cols * 6)) / cols);
        return Math.max(24, Math.min(48, calculatedSize));
    }
}

window.addEventListener('resize', () => {
    const rows = parseInt(document.getElementById('numRows').value) || 5;
    const cols = parseInt(document.getElementById('numCols').value) || 5;
    const maxCellSize = calculateCellSize(rows, cols);
    document.documentElement.style.setProperty('--cell-size', `${maxCellSize}px`);
    initPresetsAccordion();
});

// ---- Visual Helpers ----
function updateCellVisual(cell, key) {
    if (selectedCells.has(key)) {
        cell.classList.add('selected');
    } else {
        cell.classList.remove('selected');
    }
}

function updateAllCellVisuals() {
    document.querySelectorAll('.matrix-cell').forEach(cell => {
        const key = `${cell.dataset.row},${cell.dataset.col}`;
        updateCellVisual(cell, key);
    });
}

function addRipple(cell, e) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = cell.getBoundingClientRect();
    const clientX = e && e.clientX !== undefined ? e.clientX : (rect.left + rect.width / 2);
    const clientY = e && e.clientY !== undefined ? e.clientY : (rect.top + rect.height / 2);
    ripple.style.left = `${clientX - rect.left - 16}px`;
    ripple.style.top = `${clientY - rect.top - 16}px`;
    cell.appendChild(ripple);
    setTimeout(() => ripple.remove(), 350);
}

function updateCounter() {
    document.getElementById('selectionCount').textContent = selectedCells.size;
}


// ---- Stepper Buttons ----
function adjustValue(inputId, delta) {
    const input = document.getElementById(inputId);
    let val = parseInt(input.value) + delta;
    val = Math.max(2, Math.min(15, val));
    input.value = val;
    rebuildMatrix();
}

// ---- Actions ----
function clearAll() {
    selectedCells.clear();
    updateAllCellVisuals();
    generateCondition();
    updateCounter();
}

function invertSelection() {
    const numRows = parseInt(document.getElementById('numRows').value);
    const numCols = parseInt(document.getElementById('numCols').value);
    const newSelection = new Set();
    for (let f = 0; f < numRows; f++) {
        for (let c = 0; c < numCols; c++) {
            const key = `${f},${c}`;
            if (!selectedCells.has(key)) {
                newSelection.add(key);
            }
        }
    }
    selectedCells = newSelection;
    updateAllCellVisuals();
    generateCondition();
    updateCounter();
}

function fillAll() {
    const numRows = parseInt(document.getElementById('numRows').value);
    const numCols = parseInt(document.getElementById('numCols').value);
    selectedCells.clear();
    for (let f = 0; f < numRows; f++) {
        for (let c = 0; c < numCols; c++) {
            selectedCells.add(`${f},${c}`);
        }
    }
    updateAllCellVisuals();
    generateCondition();
    updateCounter();
}

// ===============================================
// CONDITION GENERATION ENGINE
// ===============================================

function generateCondition() {
    const numRows = parseInt(document.getElementById('numRows').value);
    const numCols = parseInt(document.getElementById('numCols').value);
    const varRow = document.getElementById('varRow').value.trim() || 'f';
    const varCol = document.getElementById('varCol').value.trim() || 'c';

    const noSelMsg = document.getElementById('noSelectionMsg');
    const codeWrapper = document.querySelector('.code-output-wrapper');
    const fullDetails = document.getElementById('fullCodeDetails');

    if (selectedCells.size === 0) {
        noSelMsg.classList.add('visible');
        codeWrapper.style.display = 'none';
        fullDetails.style.display = 'none';
        return;
    }

    noSelMsg.classList.remove('visible');
    codeWrapper.style.display = 'block';
    fullDetails.style.display = 'block';

    // Parse cells
    const cells = [];
    selectedCells.forEach(key => {
        const [f, c] = key.split(',').map(Number);
        cells.push({ f, c });
    });

    // Generate raw condition string
    const condition = buildOptimizedCondition(cells, numRows, numCols, varRow, varCol);
    latestCondition = condition;

    // Set outputs for each language
    setCodeOutput('conditionJava', highlightSyntax(`if (${condition})`));
    
    // Python
    const pyCond = condition.replace(/&&/g, 'and').replace(/\|\|/g, 'or');
    setCodeOutput('conditionPython', highlightSyntax(`if ${pyCond}:`));

    // JavaScript
    setCodeOutput('conditionJavascript', highlightSyntax(`if (${condition})`));

    // PHP
    const phpVarRow = varRow.startsWith('$') ? varRow : '$' + varRow;
    const phpVarCol = varCol.startsWith('$') ? varCol : '$' + varCol;
    const phpCond = condition
        .replace(new RegExp(`\\b${escapeRegExp(varRow)}\\b`, 'g'), phpVarRow)
        .replace(new RegExp(`\\b${escapeRegExp(varCol)}\\b`, 'g'), phpVarCol);
    setCodeOutput('conditionPhp', highlightSyntax(`if (${phpCond})`));

    // Full code snippet updated for the selected language
    updateFullCodeSnippet();
    updateCopyButtonLabel();
}

function buildOptimizedCondition(cells, numRows, numCols, varRow, varCol) {
    if (cells.length === 0) return 'false';
    if (cells.length === numRows * numCols) return 'true';

    const selectedSet = new Set(cells.map(({ f, c }) => `${f},${c}`));

    // --- Detect full rows and columns ---
    const fullCols = [];
    for (let c = 0; c < numCols; c++) {
        let full = true;
        for (let f = 0; f < numRows; f++) {
            if (!selectedSet.has(`${f},${c}`)) { full = false; break; }
        }
        if (full) fullCols.push(c);
    }

    const fullRows = [];
    for (let f = 0; f < numRows; f++) {
        let full = true;
        for (let c = 0; c < numCols; c++) {
            if (!selectedSet.has(`${f},${c}`)) { full = false; break; }
        }
        if (full) fullRows.push(f);
    }

    // Cells not covered by full rows/cols
    const remaining = cells.filter(({ f, c }) => {
        return !fullCols.includes(c) && !fullRows.includes(f);
    });

    // --- Strategy 1: Column-first grouping ---
    const colFirstResult = buildGroupedResult(remaining, fullCols, fullRows, numRows, numCols, varRow, varCol, 'col');

    // --- Strategy 2: Row-first grouping ---
    const rowFirstResult = buildGroupedResult(remaining, fullCols, fullRows, numRows, numCols, varRow, varCol, 'row');

    // --- Strategy 3: Math patterns (diagonals, anti-diagonals) + grouping ---
    const mathResult = buildMathResult(cells, selectedSet, numRows, numCols, varRow, varCol);

    // Pick the shortest valid result
    let best = colFirstResult;
    if (rowFirstResult.length < best.length) best = rowFirstResult;
    if (mathResult && mathResult.length < best.length) best = mathResult;

    return best;
}

// --- Grouping strategy (column-first or row-first) ---
function buildGroupedResult(remaining, fullCols, fullRows, numRows, numCols, varRow, varCol, direction) {
    const parts = [];

    if (fullCols.length > 0) {
        const expr = expressValues(varCol, fullCols, numCols);
        if (expr) parts.push(expr.str);
    }
    if (fullRows.length > 0) {
        const expr = expressValues(varRow, fullRows, numRows);
        if (expr) parts.push(expr.str);
    }

    if (remaining.length > 0) {
        const primary = direction === 'col' ? 'c' : 'f';
        const byPrimary = {};

        remaining.forEach(({ f, c }) => {
            const key = primary === 'c' ? c : f;
            const val = primary === 'c' ? f : c;
            if (!byPrimary[key]) byPrimary[key] = [];
            byPrimary[key].push(val);
        });

        // Merge groups with same value pattern
        const patternToKeys = {};
        for (const [k, vals] of Object.entries(byPrimary)) {
            const sorted = [...vals].sort((a, b) => a - b).join(',');
            if (!patternToKeys[sorted]) patternToKeys[sorted] = [];
            patternToKeys[sorted].push(Number(k));
        }

        for (const [valPattern, keys] of Object.entries(patternToKeys)) {
            const vals = valPattern.split(',').map(Number);

            let colExpr, rowExpr;
            if (primary === 'c') {
                colExpr = expressValues(varCol, keys, numCols, fullCols);
                rowExpr = expressValues(varRow, vals, numRows, fullRows);
            } else {
                rowExpr = expressValues(varRow, keys, numRows, fullRows);
                colExpr = expressValues(varCol, vals, numCols, fullCols);
            }

            if (colExpr && rowExpr) {
                const cStr = colExpr.needsParens ? `(${colExpr.str})` : colExpr.str;
                const rStr = rowExpr.needsParens ? `(${rowExpr.str})` : rowExpr.str;
                if (primary === 'col') {
                    parts.push(`(${cStr} && ${rStr})`);
                } else {
                    parts.push(`(${rStr} && ${cStr})`);
                }
            } else if (colExpr) {
                parts.push(colExpr.str);
            } else if (rowExpr) {
                parts.push(rowExpr.str);
            }
        }
    }

    return parts.join(' || ');
}

// --- Math pattern strategy (diagonals, anti-diagonals, full rows/cols) ---
function buildMathResult(cells, selectedSet, numRows, numCols, varRow, varCol) {
    const patterns = [];

    // Full columns
    for (let c = 0; c < numCols; c++) {
        let full = true;
        const keys = [];
        for (let f = 0; f < numRows; f++) {
            if (selectedSet.has(`${f},${c}`)) keys.push(`${f},${c}`);
            else full = false;
        }
        if (full) patterns.push({ type: 'col', value: c, keys });
    }

    // Full rows
    for (let f = 0; f < numRows; f++) {
        let full = true;
        const keys = [];
        for (let c = 0; c < numCols; c++) {
            if (selectedSet.has(`${f},${c}`)) keys.push(`${f},${c}`);
            else full = false;
        }
        if (full) patterns.push({ type: 'row', value: f, keys });
    }

    // Diagonals: f - c == K  (K=0 is main diagonal → f == c)
    for (let K = -(numCols - 1); K < numRows; K++) {
        let full = true;
        const keys = [];
        for (let f = 0; f < numRows; f++) {
            const c = f - K;
            if (c >= 0 && c < numCols) {
                if (selectedSet.has(`${f},${c}`)) keys.push(`${f},${c}`);
                else full = false;
            }
        }
        if (full && keys.length >= 2) patterns.push({ type: 'diag', value: K, keys });
    }

    // Anti-diagonals: f + c == K
    const maxSum = (numRows - 1) + (numCols - 1);
    for (let K = 0; K <= maxSum; K++) {
        let full = true;
        const keys = [];
        for (let f = 0; f < numRows; f++) {
            const c = K - f;
            if (c >= 0 && c < numCols) {
                if (selectedSet.has(`${f},${c}`)) keys.push(`${f},${c}`);
                else full = false;
            }
        }
        if (full && keys.length >= 2) patterns.push({ type: 'antiDiag', value: K, keys });
    }

    if (patterns.length === 0) return null;

    // --- Greedy set cover: pick patterns that cover the most uncovered cells ---
    const uncovered = new Set(cells.map(({ f, c }) => `${f},${c}`));
    const chosen = [];

    while (uncovered.size > 0) {
        let best = null;
        let bestCov = 0;
        for (const p of patterns) {
            const cov = p.keys.filter(k => uncovered.has(k)).length;
            if (cov > bestCov || (cov === bestCov && best && p.keys.length > best.keys.length)) {
                bestCov = cov;
                best = p;
            }
        }
        if (!best || bestCov < 2) break;
        chosen.push(best);
        best.keys.forEach(k => uncovered.delete(k));
    }

    if (chosen.length === 0) return null;

    // --- Build expression from chosen patterns ---
    const parts = [];

    // Group chosen patterns by type for compact expression
    const colValues = chosen.filter(p => p.type === 'col').map(p => p.value);
    const rowValues = chosen.filter(p => p.type === 'row').map(p => p.value);
    const diagValues = chosen.filter(p => p.type === 'diag').map(p => p.value);
    const antiDiagValues = chosen.filter(p => p.type === 'antiDiag').map(p => p.value);

    if (colValues.length > 0) {
        const expr = expressValues(varCol, colValues, numCols);
        if (expr) parts.push(expr.str);
    }
    if (rowValues.length > 0) {
        const expr = expressValues(varRow, rowValues, numRows);
        if (expr) parts.push(expr.str);
    }
    if (diagValues.length > 0) {
        parts.push(expressDiagonals(varRow, varCol, diagValues));
    }
    if (antiDiagValues.length > 0) {
        parts.push(expressAntiDiagonals(varRow, varCol, antiDiagValues, numRows, numCols));
    }

    // --- Handle remaining uncovered cells with column grouping ---
    if (uncovered.size > 0) {
        const remainingCells = [...uncovered].map(k => {
            const [f, c] = k.split(',').map(Number);
            return { f, c };
        });

        const byCol = {};
        remainingCells.forEach(({ f, c }) => {
            if (!byCol[c]) byCol[c] = [];
            byCol[c].push(f);
        });

        const patternToCols = {};
        for (const [col, rows] of Object.entries(byCol)) {
            const sorted = [...rows].sort((a, b) => a - b).join(',');
            if (!patternToCols[sorted]) patternToCols[sorted] = [];
            patternToCols[sorted].push(Number(col));
        }

        for (const [rowPattern, cols] of Object.entries(patternToCols)) {
            const rows = rowPattern.split(',').map(Number);
            const colExpr = expressValues(varCol, cols, numCols, colValues);
            const rowExpr = expressValues(varRow, rows, numRows, rowValues);

            if (colExpr && rowExpr) {
                const cStr = colExpr.needsParens ? `(${colExpr.str})` : colExpr.str;
                const rStr = rowExpr.needsParens ? `(${rowExpr.str})` : rowExpr.str;
                parts.push(`(${cStr} && ${rStr})`);
            } else if (colExpr) {
                parts.push(colExpr.str);
            } else if (rowExpr) {
                parts.push(rowExpr.str);
            }
        }
    }

    return parts.join(' || ');
}

// --- Express diagonal values (f - c == K) ---
function expressDiagonals(varRow, varCol, values) {
    const sorted = [...values].sort((a, b) => a - b);

    if (sorted.length === 1) {
        const K = sorted[0];
        if (K === 0) return `${varRow} == ${varCol}`;
        if (K > 0) return `${varRow} - ${varCol} == ${K}`;
        return `${varCol} - ${varRow} == ${-K}`;
    }

    // Multiple diagonals — express individually and join
    const exprs = sorted.map(K => {
        if (K === 0) return `${varRow} == ${varCol}`;
        if (K > 0) return `${varRow} - ${varCol} == ${K}`;
        return `${varCol} - ${varRow} == ${-K}`;
    });

    return exprs.length === 1 ? exprs[0] : `(${exprs.join(' || ')})`;
}

// --- Express anti-diagonal values (f + c == K) ---
function expressAntiDiagonals(varRow, varCol, values, numRows, numCols) {
    const sorted = [...values].sort((a, b) => a - b);
    const maxSum = (numRows - 1) + (numCols - 1);

    if (sorted.length === 1) {
        return `${varRow} + ${varCol} == ${sorted[0]}`;
    }

    // Check if values form a contiguous range for compact expression
    const ranges = findRanges(sorted);
    const rangeExprs = ranges.map(([s, e]) => {
        if (s === e) return `${varRow} + ${varCol} == ${s}`;
        if (s === 0) return `${varRow} + ${varCol} <= ${e}`;
        if (e === maxSum) return `${varRow} + ${varCol} >= ${s}`;
        return `${varRow} + ${varCol} >= ${s} && ${varRow} + ${varCol} <= ${e}`;
    });

    if (rangeExprs.length === 1) return rangeExprs[0];
    return rangeExprs.map(e => e.includes('&&') ? `(${e})` : e).join(' || ');
}

// --- Find consecutive ranges in a sorted array ---
function findRanges(sorted) {
    const ranges = [];
    let start = sorted[0], end = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === end + 1) {
            end = sorted[i];
        } else {
            ranges.push([start, end]);
            start = sorted[i];
            end = sorted[i];
        }
    }
    ranges.push([start, end]);
    return ranges;
}

/**
 * Express a set of integer values as a condition on a variable.
 * coveredValues: values already guaranteed by full row/column conditions,
 *   so ranges can extend through them for simpler expressions
 *   (e.g., [1,2,3] with covered [0] → c <= 3 instead of c >= 1 && c <= 3)
 * Returns { str, needsParens } or null if all values are covered.
 */
function expressValues(varName, values, total, coveredValues = []) {
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);

    // All values selected — no constraint needed
    if (sorted.length === total) return null;

    // Merge original values with covered values to find extended ranges
    // This is safe because covered values are from full rows/columns
    // (already selected), so including them in sub-conditions just creates
    // harmless overlap in the outer OR.
    const coveredSet = new Set(coveredValues);
    const originalSet = new Set(sorted);
    const allRelevant = [...new Set([...sorted, ...coveredValues])]
        .filter(v => v >= 0 && v < total)
        .sort((a, b) => a - b);

    // Find consecutive ranges from the extended set
    const extendedRanges = [];
    let start = allRelevant[0], end = allRelevant[0];
    for (let i = 1; i < allRelevant.length; i++) {
        if (allRelevant[i] === end + 1) {
            end = allRelevant[i];
        } else {
            extendedRanges.push([start, end]);
            start = allRelevant[i];
            end = allRelevant[i];
        }
    }
    extendedRanges.push([start, end]);

    // Keep only ranges that contain at least one original (non-covered) value
    const ranges = extendedRanges.filter(([s, e]) => {
        for (let v = s; v <= e; v++) {
            if (originalSet.has(v)) return true;
        }
        return false;
    });

    if (ranges.length === 0) return null;

    // Check if all values are now covered
    const totalInRanges = ranges.reduce((sum, [s, e]) => sum + (e - s + 1), 0);
    if (totalInRanges >= total) return null;

    // Express each range
    const rangeExprs = [];
    for (const [s, e] of ranges) {
        if (s === e) {
            rangeExprs.push({ str: `${varName} == ${s}`, isCompound: false });
        } else if (s === 0 && e === total - 1) {
            return null; // full range
        } else if (s === 0) {
            rangeExprs.push({ str: `${varName} <= ${e}`, isCompound: false });
        } else if (e === total - 1) {
            rangeExprs.push({ str: `${varName} >= ${s}`, isCompound: false });
        } else {
            rangeExprs.push({ str: `${varName} >= ${s} && ${varName} <= ${e}`, isCompound: true });
        }
    }

    if (rangeExprs.length === 0) return null;

    if (rangeExprs.length === 1) {
        return {
            str: rangeExprs[0].str,
            needsParens: rangeExprs[0].isCompound
        };
    }

    // Multiple ranges — join with ||
    const parts = rangeExprs.map(r => r.isCompound ? `(${r.str})` : r.str);
    return {
        str: parts.join(' || '),
        needsParens: true
    };
}

// ---- Full Code Generation (Language-Aware) ----
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updateFullCodeSnippet() {
    if (!latestCondition) return;
    const numRows = parseInt(document.getElementById('numRows').value) || 5;
    const numCols = parseInt(document.getElementById('numCols').value) || 5;
    const varRow = document.getElementById('varRow').value.trim() || 'f';
    const varCol = document.getElementById('varCol').value.trim() || 'c';

    const fullCode = generateFullCodeForLang(currentLang, latestCondition, numRows, numCols, varRow, varCol);
    setCodeOutput('fullCodeSnippet', highlightSyntax(fullCode));
}

function generateFullCodeForLang(lang, condition, numRows, numCols, varRow, varCol) {
    if (lang === 'python') {
        const pyCond = condition.replace(/&&/g, 'and').replace(/\|\|/g, 'or');
        return `for ${varRow} in range(${numRows}):\n` +
               `    for ${varCol} in range(${numCols}):\n` +
               `        if ${pyCond}:\n` +
               `            print("* ", end="")\n` +
               `        else:\n` +
               `            print("  ", end="")\n` +
               `    print()`;
    }

    if (lang === 'javascript') {
        return `for (let ${varRow} = 0; ${varRow} < ${numRows}; ${varRow}++) {\n` +
               `    let row = "";\n` +
               `    for (let ${varCol} = 0; ${varCol} < ${numCols}; ${varCol}++) {\n` +
               `        if (${condition}) {\n` +
               `            row += "* ";\n` +
               `        } else {\n` +
               `            row += "  ";\n` +
               `        }\n` +
               `    }\n` +
               `    console.log(row);\n` +
               `}`;
    }

    if (lang === 'php') {
        const phpVarRow = varRow.startsWith('$') ? varRow : '$' + varRow;
        const phpVarCol = varCol.startsWith('$') ? varCol : '$' + varCol;
        const phpCond = condition
            .replace(new RegExp(`\\b${escapeRegExp(varRow)}\\b`, 'g'), phpVarRow)
            .replace(new RegExp(`\\b${escapeRegExp(varCol)}\\b`, 'g'), phpVarCol);
        return `for (${phpVarRow} = 0; ${phpVarRow} < ${numRows}; ${phpVarRow}++) {\n` +
               `    for (${phpVarCol} = 0; ${phpVarCol} < ${numCols}; ${phpVarCol}++) {\n` +
               `        if (${phpCond}) {\n` +
               `            echo "* ";\n` +
               `        } else {\n` +
               `            echo "  ";\n` +
               `        }\n` +
               `    }\n` +
               `    echo "\\n";\n` +
               `}`;
    }

    // Default: Java / C / C++
    return `for (int ${varRow} = 0; ${varRow} < ${numRows}; ${varRow}++) {\n` +
           `    for (int ${varCol} = 0; ${varCol} < ${numCols}; ${varCol}++) {\n` +
           `        if (${condition}) {\n` +
           `            System.out.print("* ");\n` +
           `        } else {\n` +
           `            System.out.print("  ");\n` +
           `        }\n` +
           `    }\n` +
           `    System.out.println();\n` +
           `}`;
}

// ---- Syntax Highlighting (tokenizer-based) ----
// Single-pass tokenizer: processes raw code character by character,
// so HTML spans never collide with each other.
function highlightSyntax(code) {
    const KW = new Set([
        'if', 'else', 'for', 'int', 'true', 'false',
        'and', 'or', 'not', 'in', 'range',
        'print', 'println', 'out', 'echo',
        'def', 'let', 'const', 'var', 'function',
        'console', 'System'
    ]);
    const TWO_CHAR_OPS = new Set(['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=']);
    const ONE_CHAR_OPS = new Set(['<', '>', '!', '+', '-', '=']);
    const PARENS = new Set(['(', ')', '{', '}', '[', ']']);

    let out = '';
    let i = 0;

    while (i < code.length) {
        const ch = code[i];

        // --- String literals ---
        if (ch === '"') {
            let j = i + 1;
            while (j < code.length && code[j] !== '"') j++;
            if (j < code.length) j++; // include closing "
            out += `<span class="str">${esc(code.substring(i, j))}</span>`;
            i = j;
            continue;
        }

        // --- PHP variables starting with $ ---
        if (ch === '$') {
            let j = i + 1;
            while (j < code.length && /[a-zA-Z_0-9]/.test(code[j])) j++;
            out += `<span class="var">${esc(code.substring(i, j))}</span>`;
            i = j;
            continue;
        }

        // --- Words (identifiers / keywords) ---
        if (/[a-zA-Z_]/.test(ch)) {
            let j = i;
            while (j < code.length && /[a-zA-Z_0-9]/.test(code[j])) j++;
            const word = code.substring(i, j);
            if (KW.has(word)) {
                out += `<span class="kw">${esc(word)}</span>`;
            } else {
                out += `<span class="var">${esc(word)}</span>`;
            }
            i = j;
            continue;
        }

        // --- Numbers ---
        if (/\d/.test(ch)) {
            let j = i;
            while (j < code.length && /\d/.test(code[j])) j++;
            out += `<span class="num">${code.substring(i, j)}</span>`;
            i = j;
            continue;
        }

        // --- Two-character operators ---
        if (i + 1 < code.length && TWO_CHAR_OPS.has(code.substring(i, i + 2))) {
            out += `<span class="op">${esc(code.substring(i, i + 2))}</span>`;
            i += 2;
            continue;
        }

        // --- Single-character operators ---
        if (ONE_CHAR_OPS.has(ch)) {
            out += `<span class="op">${esc(ch)}</span>`;
            i++;
            continue;
        }

        // --- Parentheses & braces ---
        if (PARENS.has(ch)) {
            out += `<span class="paren">${esc(ch)}</span>`;
            i++;
            continue;
        }

        // --- Everything else (whitespace, ; , . \n etc.) ---
        out += esc(ch);
        i++;
    }

    return out;
}

/** Escape text for safe HTML insertion */
function esc(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function setCodeOutput(elementId, html) {
    document.getElementById(elementId).innerHTML = html;
}

// ---- Tabs ----
function switchTab(lang) {
    currentLang = lang;
    document.querySelectorAll('.code-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.lang === lang);
    });
    document.querySelectorAll('.code-output-wrapper .code-output').forEach(output => {
        output.classList.add('hidden');
    });
    const target = document.getElementById(`codeOutput${capitalize(lang)}`);
    if (target) {
        target.classList.remove('hidden');
    }

    // Update copy button label and full loop code snippet for the chosen language
    updateCopyButtonLabel();
    updateFullCodeSnippet();
}

function getLangDisplayName(lang) {
    const map = {
        'java': 'Java / C++',
        'python': 'Python',
        'javascript': 'JavaScript',
        'php': 'PHP'
    };
    return map[lang] || capitalize(lang);
}

function updateCopyButtonLabel() {
    const btnText = document.getElementById('btnCopyText');
    const label = getLangDisplayName(currentLang);
    if (btnText) {
        btnText.textContent = `Copiar (${label})`;
    }
    const btn = document.getElementById('btnCopyCondition');
    if (btn) {
        btn.title = `Copiar condición para ${label}`;
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---- Copy ----
function copyCurrentCondition() {
    const codeEl = document.getElementById(`condition${capitalize(currentLang)}`);
    if (!codeEl) return;
    const text = codeEl.textContent;
    const label = getLangDisplayName(currentLang);

    navigator.clipboard.writeText(text).then(() => {
        showToast(`¡Condición (${label}) copiada!`);
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast(`¡Condición (${label}) copiada!`);
    });
}

function copyCondition(lang) {
    if (lang) switchTab(lang);
    copyCurrentCondition();
}

function copyFullCode() {
    const codeEl = document.getElementById('fullCodeSnippet');
    if (!codeEl) return;
    const text = codeEl.textContent;
    const label = getLangDisplayName(currentLang);

    navigator.clipboard.writeText(text).then(() => {
        showToast(`¡Código completo (${label}) copiado!`);
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast(`¡Código completo (${label}) copiado!`);
    });
}

// ---- Toast ----
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastText').textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 2200);
}
