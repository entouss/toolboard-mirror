// Color Picker Tool Plugin
// Color wheel with alpha support, hex/rgb/hsl values

(function() {
    if (document.getElementById('color-picker-styles')) return;
    const style = document.createElement('style');
    style.id = 'color-picker-styles';
    style.textContent = `
.tool-content:has(.cpk-widget) { display: flex; flex-direction: column; }
.cpk-widget { padding: 10px; font-size: 12px; display: flex; flex-direction: column; flex: 1; width: 100%; box-sizing: border-box; min-height: 0; gap: 8px; }
.cpk-canvas-row { display: flex; gap: 8px; flex-shrink: 0; }
.cpk-wheel-wrap { position: relative; width: 180px; height: 180px; flex-shrink: 0; }
.cpk-wheel-canvas, .cpk-wheel-cursor { position: absolute; top: 0; left: 0; }
.cpk-wheel-canvas { border-radius: 50%; cursor: crosshair; }
.cpk-wheel-cursor { pointer-events: none; width: 12px; height: 12px; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 2px rgba(0,0,0,0.6); transform: translate(-8px, -8px); }
.cpk-sv-wrap { position: relative; flex: 1; min-width: 80px; height: 180px; }
.cpk-sv-canvas { width: 100%; height: 100%; border-radius: 4px; cursor: crosshair; }
.cpk-sv-cursor { position: absolute; pointer-events: none; width: 12px; height: 12px; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 2px rgba(0,0,0,0.6); transform: translate(-8px, -8px); }
.cpk-alpha-row { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.cpk-alpha-label { font-size: 11px; font-weight: 600; color: var(--text-heading); width: 14px; }
.cpk-alpha-track { position: relative; flex: 1; height: 16px; border-radius: 3px; cursor: pointer; overflow: hidden; border: 1px solid var(--border-color); }
.cpk-alpha-checker { position: absolute; inset: 0; background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%); background-size: 8px 8px; background-position: 0 0, 0 4px, 4px -4px, -4px 0; }
.cpk-alpha-gradient { position: absolute; inset: 0; }
.cpk-alpha-thumb { position: absolute; top: -1px; width: 6px; height: 18px; background: #fff; border: 1px solid #888; border-radius: 2px; transform: translateX(-3px); pointer-events: none; }
.cpk-alpha-input { width: 44px; padding: 3px 4px; border: 1px solid var(--border-color); border-radius: 3px; font-size: 11px; font-family: monospace; background: var(--input-bg); color: var(--text-primary); text-align: center; }
.cpk-alpha-input:focus { outline: none; border-color: #3498db; }
.cpk-preview-row { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.cpk-swatch { width: 40px; height: 40px; border-radius: 4px; border: 1px solid var(--border-color); position: relative; overflow: hidden; flex-shrink: 0; }
.cpk-swatch-checker { position: absolute; inset: 0; background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%); background-size: 10px 10px; background-position: 0 0, 0 5px, 5px -5px, -5px 0; }
.cpk-swatch-color { position: absolute; inset: 0; }
.cpk-values { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.cpk-val-row { display: flex; align-items: center; gap: 4px; }
.cpk-val-label { font-size: 10px; font-weight: 600; color: var(--text-secondary); width: 30px; flex-shrink: 0; }
.cpk-val-input { flex: 1; padding: 4px 6px; border: 1px solid var(--border-color); border-radius: 3px; font-size: 11px; font-family: monospace; background: var(--input-bg); color: var(--text-primary); min-width: 0; }
.cpk-val-input:focus { outline: none; border-color: #3498db; }
.cpk-copy-btn { padding: 3px 8px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-primary); cursor: pointer; font-size: 10px; border-radius: 3px; flex-shrink: 0; }
.cpk-copy-btn:hover { background: var(--table-hover); }
.cpk-saved-row { display: flex; gap: 4px; flex-wrap: wrap; flex-shrink: 0; align-items: center; }
.cpk-saved-label { font-size: 10px; font-weight: 600; color: var(--text-secondary); }
.cpk-saved-swatch { width: 20px; height: 20px; border-radius: 3px; border: 1px solid var(--border-color); cursor: pointer; position: relative; overflow: hidden; }
.cpk-saved-swatch:hover { border-color: #3498db; }
.cpk-saved-checker { position: absolute; inset: 0; background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%); background-size: 6px 6px; background-position: 0 0, 0 3px, 3px -3px, -3px 0; }
.cpk-saved-color { position: absolute; inset: 0; }
.cpk-save-btn { width: 20px; height: 20px; border-radius: 3px; border: 1px dashed var(--border-color); background: var(--bg-tertiary); cursor: pointer; font-size: 14px; line-height: 18px; text-align: center; color: var(--text-muted); }
.cpk-save-btn:hover { border-color: #3498db; color: #3498db; }
`;
    document.head.appendChild(style);
})();

PluginRegistry.registerTool({
    id: 'color-picker',
    name: 'Color Picker',
    description: 'Color wheel with alpha, hex/rgba/hsla values',
    icon: '🎨',
    version: '1.0.0',
    toolbox: 'developer-tools',
    tags: ['color', 'colour', 'picker', 'wheel', 'hex', 'rgb', 'hsl', 'alpha', 'css'],
    title: 'Color Picker',
    content: `<div class="cpk-widget">
<div class="cpk-canvas-row">
<div class="cpk-wheel-wrap">
<canvas class="cpk-wheel-canvas" width="180" height="180"></canvas>
<div class="cpk-wheel-cursor"></div>
</div>
<div class="cpk-sv-wrap">
<canvas class="cpk-sv-canvas"></canvas>
<div class="cpk-sv-cursor"></div>
</div>
</div>
<div class="cpk-alpha-row">
<span class="cpk-alpha-label">A</span>
<div class="cpk-alpha-track">
<div class="cpk-alpha-checker"></div>
<div class="cpk-alpha-gradient"></div>
<div class="cpk-alpha-thumb"></div>
</div>
<input type="text" class="cpk-alpha-input" value="100%" oninput="cpkAlphaTyped(this)">
</div>
<div class="cpk-preview-row">
<div class="cpk-swatch"><div class="cpk-swatch-checker"></div><div class="cpk-swatch-color"></div></div>
<div class="cpk-values">
<div class="cpk-val-row"><span class="cpk-val-label">HEX</span><input class="cpk-val-input cpk-hex-input" spellcheck="false" oninput="cpkHexTyped(this)"><button class="cpk-copy-btn" onclick="cpkCopyVal(this)">Copy</button></div>
<div class="cpk-val-row"><span class="cpk-val-label">RGBA</span><input class="cpk-val-input cpk-rgba-input" spellcheck="false" oninput="cpkRgbaTyped(this)"><button class="cpk-copy-btn" onclick="cpkCopyVal(this)">Copy</button></div>
<div class="cpk-val-row"><span class="cpk-val-label">HSLA</span><input class="cpk-val-input cpk-hsla-input" spellcheck="false" oninput="cpkHslaTyped(this)"><button class="cpk-copy-btn" onclick="cpkCopyVal(this)">Copy</button></div>
</div>
</div>
<div class="cpk-saved-row">
<span class="cpk-saved-label">Saved:</span>
<button class="cpk-save-btn" onclick="cpkSaveColor(this)" title="Save current color">+</button>
</div>
</div>`,
    contentType: 'html',
    onInit: 'cpkInit',
    source: 'external',
    defaultWidth: 340,
    defaultHeight: 420
});

// ── Color conversion helpers ──

function cpkHsvToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360;
    const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
    let r, g, b;
    if (h < 60)       { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else               { r = c; g = 0; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function cpkRgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0, s = max === 0 ? 0 : d / max, v = max;
    if (d !== 0) {
        if (max === r) h = 60 * (((g - b) / d) % 6);
        else if (max === g) h = 60 * ((b - r) / d + 2);
        else h = 60 * ((r - g) / d + 4);
    }
    if (h < 0) h += 360;
    return [h, s, v];
}

function cpkRgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0, s = 0, l = (max + min) / 2;
    if (d !== 0) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = 60 * (((g - b) / d) % 6);
        else if (max === g) h = 60 * ((b - r) / d + 2);
        else h = 60 * ((r - g) / d + 4);
    }
    if (h < 0) h += 360;
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function cpkHslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    let r, g, b;
    if (h < 60)       { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else               { r = c; g = 0; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// ── State per widget ──

const _cpkState = new WeakMap();

function cpkGetState(widget) {
    if (!_cpkState.has(widget)) {
        _cpkState.set(widget, { h: 0, s: 1, v: 1, a: 1, saved: [] });
    }
    return _cpkState.get(widget);
}

// ── Drawing ──

function cpkDrawWheel(widget) {
    const canvas = widget.querySelector('.cpk-wheel-canvas');
    const ctx = canvas.getContext('2d');
    const cx = 90, cy = 90, outerR = 88, innerR = 62;
    ctx.clearRect(0, 0, 180, 180);
    for (let angle = 0; angle < 360; angle += 0.5) {
        const rad1 = (angle - 0.5) * Math.PI / 180;
        const rad2 = (angle + 1) * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(cx + innerR * Math.cos(rad1), cy + innerR * Math.sin(rad1));
        ctx.lineTo(cx + outerR * Math.cos(rad1), cy + outerR * Math.sin(rad1));
        ctx.arc(cx, cy, outerR, rad1, rad2);
        ctx.lineTo(cx + innerR * Math.cos(rad2), cy + innerR * Math.sin(rad2));
        ctx.arc(cx, cy, innerR, rad2, rad1, true);
        ctx.closePath();
        ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
        ctx.fill();
    }
}

function cpkDrawSV(widget) {
    const st = cpkGetState(widget);
    const canvas = widget.querySelector('.cpk-sv-canvas');
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = Math.max(rect.width, 80);
    const h = 180;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    // White-to-hue horizontal
    const gradH = ctx.createLinearGradient(0, 0, w, 0);
    gradH.addColorStop(0, '#fff');
    gradH.addColorStop(1, `hsl(${st.h}, 100%, 50%)`);
    ctx.fillStyle = gradH;
    ctx.fillRect(0, 0, w, h);
    // Transparent-to-black vertical
    const gradV = ctx.createLinearGradient(0, 0, 0, h);
    gradV.addColorStop(0, 'rgba(0,0,0,0)');
    gradV.addColorStop(1, '#000');
    ctx.fillStyle = gradV;
    ctx.fillRect(0, 0, w, h);
}

function cpkUpdateCursors(widget) {
    const st = cpkGetState(widget);
    // Wheel cursor
    const wheelCursor = widget.querySelector('.cpk-wheel-cursor');
    const midR = 75;
    const rad = st.h * Math.PI / 180;
    wheelCursor.style.left = (90 + midR * Math.cos(rad)) + 'px';
    wheelCursor.style.top = (90 + midR * Math.sin(rad)) + 'px';
    // SV cursor
    const svCanvas = widget.querySelector('.cpk-sv-canvas');
    const svCursor = widget.querySelector('.cpk-sv-cursor');
    svCursor.style.left = (st.s * svCanvas.width) + 'px';
    svCursor.style.top = ((1 - st.v) * 180) + 'px';
}

function cpkUpdateAlpha(widget) {
    const st = cpkGetState(widget);
    const [r, g, b] = cpkHsvToRgb(st.h, st.s, st.v);
    const grad = widget.querySelector('.cpk-alpha-gradient');
    grad.style.background = `linear-gradient(to right, rgba(${r},${g},${b},0), rgba(${r},${g},${b},1))`;
    const thumb = widget.querySelector('.cpk-alpha-thumb');
    const track = widget.querySelector('.cpk-alpha-track');
    thumb.style.left = (st.a * (track.offsetWidth - 2)) + 'px';
    widget.querySelector('.cpk-alpha-input').value = Math.round(st.a * 100) + '%';
}

function cpkUpdateValues(widget) {
    const st = cpkGetState(widget);
    const [r, g, b] = cpkHsvToRgb(st.h, st.s, st.v);
    const [hh, ss, ll] = cpkRgbToHsl(r, g, b);
    // Swatch
    widget.querySelector('.cpk-swatch-color').style.background = `rgba(${r},${g},${b},${st.a})`;
    // Hex
    const hexR = r.toString(16).padStart(2, '0');
    const hexG = g.toString(16).padStart(2, '0');
    const hexB = b.toString(16).padStart(2, '0');
    const hexA = st.a < 1 ? Math.round(st.a * 255).toString(16).padStart(2, '0') : '';
    widget.querySelector('.cpk-hex-input').value = `#${hexR}${hexG}${hexB}${hexA}`.toUpperCase();
    // RGBA
    const aRound = Math.round(st.a * 100) / 100;
    widget.querySelector('.cpk-rgba-input').value = st.a < 1
        ? `rgba(${r}, ${g}, ${b}, ${aRound})`
        : `rgb(${r}, ${g}, ${b})`;
    // HSLA
    widget.querySelector('.cpk-hsla-input').value = st.a < 1
        ? `hsla(${hh}, ${ss}%, ${ll}%, ${aRound})`
        : `hsl(${hh}, ${ss}%, ${ll}%)`;
}

function cpkFullUpdate(widget) {
    cpkDrawSV(widget);
    cpkUpdateCursors(widget);
    cpkUpdateAlpha(widget);
    cpkUpdateValues(widget);
}

// ── Interaction ──

function cpkWheelEvent(widget, e) {
    const canvas = widget.querySelector('.cpk-wheel-canvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - 90;
    const y = e.clientY - rect.top - 90;
    const st = cpkGetState(widget);
    st.h = ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
    cpkFullUpdate(widget);
}

function cpkSVEvent(widget, e) {
    const canvas = widget.querySelector('.cpk-sv-canvas');
    const rect = canvas.getBoundingClientRect();
    const st = cpkGetState(widget);
    st.s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    st.v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    cpkUpdateCursors(widget);
    cpkUpdateAlpha(widget);
    cpkUpdateValues(widget);
}

function cpkAlphaEvent(widget, e) {
    const track = widget.querySelector('.cpk-alpha-track');
    const rect = track.getBoundingClientRect();
    const st = cpkGetState(widget);
    st.a = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    cpkUpdateAlpha(widget);
    cpkUpdateValues(widget);
}

function cpkMakeDraggable(widget, selector, handler) {
    const el = widget.querySelector(selector);
    const onMove = (e) => { e.preventDefault(); handler(widget, e); };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        handler(widget, e);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
}

// ── Input handlers ──

function cpkHexTyped(input) {
    const widget = input.closest('.cpk-widget');
    const val = input.value.trim().replace(/^#/, '');
    let r, g, b, a = 1;
    if (/^[0-9a-f]{6}$/i.test(val)) {
        r = parseInt(val.slice(0, 2), 16); g = parseInt(val.slice(2, 4), 16); b = parseInt(val.slice(4, 6), 16);
    } else if (/^[0-9a-f]{8}$/i.test(val)) {
        r = parseInt(val.slice(0, 2), 16); g = parseInt(val.slice(2, 4), 16); b = parseInt(val.slice(4, 6), 16);
        a = parseInt(val.slice(6, 8), 16) / 255;
    } else if (/^[0-9a-f]{3}$/i.test(val)) {
        r = parseInt(val[0] + val[0], 16); g = parseInt(val[1] + val[1], 16); b = parseInt(val[2] + val[2], 16);
    } else return;
    const st = cpkGetState(widget);
    [st.h, st.s, st.v] = cpkRgbToHsv(r, g, b);
    st.a = a;
    cpkDrawSV(widget); cpkUpdateCursors(widget); cpkUpdateAlpha(widget);
    // Update other fields but not hex
    const [rr, gg, bb] = cpkHsvToRgb(st.h, st.s, st.v);
    const [hh, ss, ll] = cpkRgbToHsl(rr, gg, bb);
    const aRound = Math.round(st.a * 100) / 100;
    widget.querySelector('.cpk-swatch-color').style.background = `rgba(${rr},${gg},${bb},${st.a})`;
    widget.querySelector('.cpk-rgba-input').value = st.a < 1 ? `rgba(${rr}, ${gg}, ${bb}, ${aRound})` : `rgb(${rr}, ${gg}, ${bb})`;
    widget.querySelector('.cpk-hsla-input').value = st.a < 1 ? `hsla(${hh}, ${ss}%, ${ll}%, ${aRound})` : `hsl(${hh}, ${ss}%, ${ll}%)`;
}

function cpkRgbaTyped(input) {
    const widget = input.closest('.cpk-widget');
    const m = input.value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
    if (!m) return;
    const r = Math.min(255, parseInt(m[1])), g = Math.min(255, parseInt(m[2])), b = Math.min(255, parseInt(m[3]));
    const a = m[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(m[4]))) : 1;
    const st = cpkGetState(widget);
    [st.h, st.s, st.v] = cpkRgbToHsv(r, g, b);
    st.a = a;
    cpkDrawSV(widget); cpkUpdateCursors(widget); cpkUpdateAlpha(widget);
    const hexR = r.toString(16).padStart(2, '0'), hexG = g.toString(16).padStart(2, '0'), hexB = b.toString(16).padStart(2, '0');
    const hexA = st.a < 1 ? Math.round(st.a * 255).toString(16).padStart(2, '0') : '';
    widget.querySelector('.cpk-swatch-color').style.background = `rgba(${r},${g},${b},${st.a})`;
    widget.querySelector('.cpk-hex-input').value = `#${hexR}${hexG}${hexB}${hexA}`.toUpperCase();
    const [hh, ss, ll] = cpkRgbToHsl(r, g, b);
    const aRound = Math.round(st.a * 100) / 100;
    widget.querySelector('.cpk-hsla-input').value = st.a < 1 ? `hsla(${hh}, ${ss}%, ${ll}%, ${aRound})` : `hsl(${hh}, ${ss}%, ${ll}%)`;
}

function cpkHslaTyped(input) {
    const widget = input.closest('.cpk-widget');
    const m = input.value.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*(?:,\s*([\d.]+))?\s*\)/i);
    if (!m) return;
    const h = parseInt(m[1]) % 360, s = Math.min(100, parseInt(m[2])), l = Math.min(100, parseInt(m[3]));
    const a = m[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(m[4]))) : 1;
    const [r, g, b] = cpkHslToRgb(h, s, l);
    const st = cpkGetState(widget);
    [st.h, st.s, st.v] = cpkRgbToHsv(r, g, b);
    st.a = a;
    cpkDrawSV(widget); cpkUpdateCursors(widget); cpkUpdateAlpha(widget);
    widget.querySelector('.cpk-swatch-color').style.background = `rgba(${r},${g},${b},${st.a})`;
    const hexR = r.toString(16).padStart(2, '0'), hexG = g.toString(16).padStart(2, '0'), hexB = b.toString(16).padStart(2, '0');
    const hexA = st.a < 1 ? Math.round(st.a * 255).toString(16).padStart(2, '0') : '';
    widget.querySelector('.cpk-hex-input').value = `#${hexR}${hexG}${hexB}${hexA}`.toUpperCase();
    const aRound = Math.round(st.a * 100) / 100;
    widget.querySelector('.cpk-rgba-input').value = st.a < 1 ? `rgba(${r}, ${g}, ${b}, ${aRound})` : `rgb(${r}, ${g}, ${b})`;
}

function cpkAlphaTyped(input) {
    const widget = input.closest('.cpk-widget');
    const val = parseFloat(input.value.replace('%', ''));
    if (isNaN(val)) return;
    const st = cpkGetState(widget);
    st.a = Math.max(0, Math.min(1, val / 100));
    cpkUpdateAlpha(widget);
    cpkUpdateValues(widget);
}

function cpkCopyVal(btn) {
    const input = btn.previousElementSibling;
    navigator.clipboard.writeText(input.value).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = orig, 800);
    });
}

function cpkSaveColor(btn) {
    const widget = btn.closest('.cpk-widget');
    const st = cpkGetState(widget);
    const [r, g, b] = cpkHsvToRgb(st.h, st.s, st.v);
    const color = { r, g, b, a: st.a, h: st.h, s: st.s, v: st.v };
    st.saved.push(color);
    const swatch = document.createElement('div');
    swatch.className = 'cpk-saved-swatch';
    swatch.title = widget.querySelector('.cpk-hex-input').value;
    swatch.innerHTML = `<div class="cpk-saved-checker"></div><div class="cpk-saved-color" style="background:rgba(${r},${g},${b},${st.a})"></div>`;
    swatch.onclick = () => {
        st.h = color.h; st.s = color.s; st.v = color.v; st.a = color.a;
        cpkFullUpdate(widget);
    };
    btn.parentElement.insertBefore(swatch, btn);
}

// ── Init ──

function cpkInit() {
    document.querySelectorAll('.cpk-widget').forEach(widget => {
        const st = cpkGetState(widget);
        st.h = 210; st.s = 0.8; st.v = 0.9; st.a = 1;

        cpkDrawWheel(widget);
        cpkFullUpdate(widget);

        cpkMakeDraggable(widget, '.cpk-wheel-canvas', cpkWheelEvent);
        cpkMakeDraggable(widget, '.cpk-sv-canvas', cpkSVEvent);
        cpkMakeDraggable(widget, '.cpk-alpha-track', cpkAlphaEvent);
    });
}

console.log('Color Picker plugin loaded');
