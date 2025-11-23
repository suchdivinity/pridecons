const FLAGS = {
    'rainbow': { name: 'Rainbow', colors: ['#ff0018', '#ffa52c', '#ffff41', '#008018', '#0000f9', '#86007d'] },
    'agender': { name: 'Agender', colors: ['#000000', '#BCC4C7', '#FFFFFF', '#B5F5CC', '#FFFFFF', '#BCC4C7', '#000000'] },
    'androgyne': { name: 'Androgyne', colors: ['#FF0090', '#9833CC', '#00D4FF'] },
    'aromantic': { name: 'Aromantic', colors: ['#3DA542', '#A7D379', '#FFFFFF', '#A9A9A9', '#000000'] },
    'asexual': { name: 'Asexual', colors: ['#000000', '#A3A3A3', '#FFFFFF', '#800080'] },
    'bigender': { name: 'Bigender', colors: ['#C479A0', '#EDA5CD', '#D6C7E8', '#FFFFFF', '#D6C7E8', '#9AC7E8', '#6D82D1'] },
    'bisexual': { name: 'Bisexual', colors: ['#D60270', '#D60270', '#9B4F96', '#0038A8', '#0038A8'] },
    'gay': { name: 'Gay (MLM)', colors: ['#078D70', '#26CEAA', '#98E8C1', '#FFFFFF', '#7BADE2', '#5049CC', '#3D1A78'] },
    'genderfluid': { name: 'Genderfluid', colors: ['#FF75A2', '#FFFFFF', '#BE185D', '#000000', '#333EBD'] },
    'lesbian': { name: 'Lesbian', colors: ['#D52D00', '#EF7627', '#FF9A56', '#FFFFFF', '#D162A4', '#B55690', '#A30262'] },
    'nonbinary': { name: 'Non-Binary', colors: ['#FCF434', '#FFFFFF', '#9C59D1', '#2C2C2C'] },
    'pansexual': { name: 'Pansexual', colors: ['#FF218C', '#FFD800', '#21B1FF'] },
    'transgender': { name: 'Transgender', colors: ['#5bcefa', '#f5a9b8', '#ffffff', '#f5a9b8', '#5bcefa'] },
    'xenogender': { name: 'Xenogender', colors: ['#F5A2A2', '#F5C6A2', '#F5EBA2', '#D6F5A2', '#A2F5D6', '#A2D6F5', '#A2A2F5', '#D6A2F5', '#F5A2EB'] }
};

const state = {
    image: null,
    flag: 'rainbow',
    shape: 'circle',
    mode: 'border',
    flagStyle: 'solid',
    borderWidth: 10,
    opacity: 40,
    rotation: 0,
    zoom: 100,
    filter: 'color',
    panX: 0,
    panY: 0,
    isDragging: false,
    startX: 0,
    startY: 0
};

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const placeholder = document.getElementById('placeholder');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

function init() {
    populateDropdown();
    setupEventListeners();
    setupCursor();
    setupCanvasInteractions();
}

function populateDropdown() {
    const container = document.querySelector('.custom-options');

    const keys = Object.keys(FLAGS).sort((a, b) => {
        if (a === 'rainbow') return -1;
        if (b === 'rainbow') return 1;
        return FLAGS[a].name.localeCompare(FLAGS[b].name);
    });

    keys.forEach(key => {
        const div = document.createElement('div');
        div.className = 'custom-option';
        if (key === 'rainbow') div.classList.add('selected');
        div.textContent = FLAGS[key].name;
        div.dataset.value = key;
        div.addEventListener('click', () => selectFlag(key, div));
        container.appendChild(div);
    });
}

function selectFlag(key, element) {
    state.flag = key;
    document.getElementById('selectedFlagText').textContent = FLAGS[key].name;
    document.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    document.querySelector('.custom-select-wrapper').classList.remove('open');
    render();
}

function render() {
    if (!state.image) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.save();

    ctx.beginPath();
    if (state.shape === 'circle') {
        ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
    } else {
        ctx.rect(0, 0, width, height);
    }
    ctx.closePath();
    ctx.clip();

    drawFlag(width, height);

    if (state.mode === 'border') {
        const borderPx = (width * state.borderWidth) / 100;
        const innerSize = width - (borderPx * 2);
        const offset = borderPx;

        ctx.beginPath();
        if (state.shape === 'circle') {
            ctx.arc(width / 2, height / 2, innerSize / 2, 0, Math.PI * 2);
        } else {
            ctx.rect(offset, offset, innerSize, innerSize);
        }
        ctx.closePath();
        ctx.clip(); 

        drawImageBounded(state.image, offset, offset, innerSize, innerSize);
    } else {
        drawImageBounded(state.image, 0, 0, width, height);
        ctx.globalAlpha = state.opacity / 100;
        drawFlag(width, height);
    }

    ctx.restore();
    updateDownload();
}

function drawFlag(w, h) {
    const colors = FLAGS[state.flag].colors;
    ctx.save();

    const cx = w / 2;
    const cy = h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((state.rotation * Math.PI) / 180);

    const diag = Math.sqrt(w*w + h*h);

    if (state.flagStyle === 'dashed') {

        const radius = diag / 2;
        const sliceAngle = (2 * Math.PI) / colors.length;
        const startOffset = -Math.PI / 2;

        colors.forEach((color, i) => {
            ctx.beginPath();
            ctx.moveTo(0, 0); 
            ctx.arc(0, 0, radius, startOffset + (i * sliceAngle), startOffset + ((i + 1) * sliceAngle));
            ctx.fillStyle = color;
            ctx.fill();
            ctx.closePath();
        });

    } else {

        const size = diag; 
        const offset = size / 2;
        const stripeH = size / colors.length;

        colors.forEach((color, i) => {
            ctx.fillStyle = color;
            ctx.fillRect(-offset, -offset + (i * stripeH) - 1, size, stripeH + 2);
        });
    }

    ctx.restore();
}

function drawImageBounded(img, viewX, viewY, viewW, viewH) {
    if (state.filter === 'gray') ctx.filter = 'grayscale(100%)';
    else ctx.filter = 'none';

    const zoomFactor = state.zoom / 100;

    const imgRatio = img.width / img.height;
    const viewRatio = viewW / viewH;

    let baseW, baseH;

    if (imgRatio > viewRatio) {
        baseH = viewH;
        baseW = viewH * imgRatio;
    } else {
        baseW = viewW;
        baseH = viewW / imgRatio;
    }

    const finalW = baseW * zoomFactor;
    const finalH = baseH * zoomFactor;

    const centerX = viewX + (viewW - finalW) / 2;
    const centerY = viewY + (viewH - finalH) / 2;

    let dx = centerX + state.panX;
    let dy = centerY + state.panY;

    if (dx + finalW < viewX + viewW) dx = (viewX + viewW) - finalW;
    if (dy + finalH < viewY + viewH) dy = (viewY + viewH) - finalH;
    if (dx > viewX) dx = viewX;
    if (dy > viewY) dy = viewY;

    state.panX = dx - centerX;
    state.panY = dy - centerY;

    ctx.drawImage(img, dx, dy, finalW, finalH);
    ctx.filter = 'none';
}

function updateDownload() {
    downloadBtn.classList.remove('disabled');
    downloadBtn.href = canvas.toDataURL('image/png');
    downloadBtn.download = `pride_${state.shape}_${state.flag}.png`;
}

resetBtn.addEventListener('click', () => {
    state.panX = 0;
    state.panY = 0;
    state.zoom = 100;
    document.getElementById('zoom').value = 100;
    render();
});

function setupCanvasInteractions() {
    canvas.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', drag); 
    window.addEventListener('mouseup', stopDrag);
    canvas.addEventListener('touchstart', (e) => startDrag(e.touches[0]));
    window.addEventListener('touchmove', (e) => drag(e.touches[0]));
    window.addEventListener('touchend', stopDrag);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
}

function handleWheel(e) {
    if (!state.image) return;
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * 10;
    let newZoom = state.zoom + delta;
    newZoom = Math.min(Math.max(newZoom, 10), 500);
    state.zoom = newZoom;
    document.getElementById('zoom').value = newZoom;
    render(); 
}

function startDrag(e) {
    if (!state.image) return;
    state.isDragging = true;
    state.startX = e.clientX;
    state.startY = e.clientY;
    canvas.style.cursor = 'grabbing';
}

function drag(e) {
    if (!state.isDragging) return;
    e.preventDefault(); 

    const deltaX = e.clientX - state.startX;
    const deltaY = e.clientY - state.startY;
    const scaleFactor = canvas.width / canvas.getBoundingClientRect().width;

    state.panX += deltaX * scaleFactor;
    state.panY += deltaY * scaleFactor;

    state.startX = e.clientX;
    state.startY = e.clientY;

    render(); 
}

function stopDrag() {
    state.isDragging = false;
    canvas.style.cursor = 'grab';
}

function setupEventListeners() {
    const dropdown = document.querySelector('.custom-select-wrapper');
    dropdown.addEventListener('click', () => dropdown.classList.toggle('open'));
    window.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
    });

    document.getElementById('uploadTrigger').addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('click', (e) => {
        if(e.target === dropZone || e.target === placeholder) fileInput.click();
    });

    fileInput.addEventListener('change', handleFile);

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--accent-pink)'; });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--border)'; });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); dropZone.style.borderColor = 'var(--border)';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFile({ target: { files: e.dataTransfer.files } });
    });

    const bindSlider = (id, prop, suffix = '') => {
        const el = document.getElementById(id);
        if(!el) return;
        el.addEventListener('input', (e) => {
            state[prop] = parseInt(e.target.value);
            const displayId = id.replace('Width', '').replace('tion', 'te') + 'Val'; 
            const disp = document.getElementById(displayId);
            if(disp) disp.innerText = e.target.value + suffix;
            render();
        });
    };
    bindSlider('borderWidth', 'borderWidth', '%');
    bindSlider('opacity', 'opacity', '%');
    bindSlider('rotation', 'rotation', '°');

    const zoomSl = document.getElementById('zoom');
    if(zoomSl) {
        zoomSl.addEventListener('input', (e) => {
            state.zoom = parseInt(e.target.value);
            render();
        });
    }
}

function handleFile(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                state.image = img;
                state.panX = 0; state.panY = 0; state.zoom = 100;
                document.getElementById('zoom').value = 100;
                placeholder.classList.add('hidden');
                canvas.classList.remove('hidden');
                document.querySelector('.canvas-container').classList.add('has-image');
                document.getElementById('zoomRow').classList.remove('hidden');
                render();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    }
}

window.updateShape = (val) => { state.shape = val; toggleActive('updateShape', val); render(); };
window.updateMode = (val) => { 
    state.mode = val; toggleActive('updateMode', val); 
    const bCtrl = document.getElementById('borderControl');
    const oCtrl = document.getElementById('opacityControl');
    if (val === 'border') { bCtrl.classList.remove('hidden'); oCtrl.classList.add('hidden'); } 
    else { bCtrl.classList.add('hidden'); oCtrl.classList.remove('hidden'); }
    render();
};
window.updateFilter = (val) => { state.filter = val; toggleActive('updateFilter', val); render(); }
window.updateFlagStyle = (val) => { state.flagStyle = val; toggleActive('updateFlagStyle', val); render(); }

function toggleActive(fnName, val) {
    document.querySelectorAll(`[onclick*="${fnName}"]`).forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-val="${val}"]`).classList.add('active');
}

function setupCursor() {

    if (window.matchMedia("(hover: hover)").matches) {
        document.body.classList.add('custom-cursor-active');
        const cursor = document.getElementById('cursor');
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX - 10 + 'px';
            cursor.style.top = e.clientY - 10 + 'px';
        });
        const interactive = 'a, button, input, .custom-select-wrapper, .canvas-container, .toggle-btn';
        document.body.addEventListener('mouseover', (e) => {
            if (e.target.closest(interactive)) {
                cursor.style.transform = 'scale(2.5)';
                cursor.style.background = 'var(--accent-blue)';
            }
        });
        document.body.addEventListener('mouseout', (e) => {
            if (e.target.closest(interactive)) {
                cursor.style.transform = 'scale(1)';
                cursor.style.background = 'transparent';
            }
        });
    }
}

init();