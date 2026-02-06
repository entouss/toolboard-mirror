// Playback Speed Duration Calculator Tool Plugin
// Calculate adjusted duration and time saved at different playback speeds

(function() {
    if (document.getElementById('pbspeed-styles')) return;
    const style = document.createElement('style');
    style.id = 'pbspeed-styles';
    style.textContent = `
.tool-content:has(.pbs-widget) { display: flex; flex-direction: column; }
.pbs-widget { padding: 10px; font-size: 12px; display: flex; flex-direction: column; flex: 1; width: 100%; box-sizing: border-box; min-height: 0; gap: 10px; }
.pbs-input-row { display: flex; gap: 8px; align-items: flex-end; flex-shrink: 0; flex-wrap: wrap; }
.pbs-field { display: flex; flex-direction: column; gap: 3px; }
.pbs-field label { font-weight: 600; font-size: 11px; color: var(--text-heading); }
.pbs-field input { width: 60px; padding: 6px 8px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 13px; font-family: monospace; background: var(--input-bg); color: var(--text-primary); text-align: center; }
.pbs-field input:focus { outline: none; border-color: #3498db; }
.pbs-colon { font-size: 18px; font-weight: 700; color: var(--text-muted); padding-bottom: 6px; }
.pbs-total { font-size: 11px; color: var(--text-muted); flex-shrink: 0; }
.pbs-speed-section { flex-shrink: 0; display: flex; flex-direction: column; gap: 6px; }
.pbs-speed-label { font-weight: 600; font-size: 11px; color: var(--text-heading); }
.pbs-presets { display: flex; gap: 4px; flex-wrap: wrap; }
.pbs-preset { padding: 5px 10px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-primary); cursor: pointer; font-size: 11px; border-radius: 4px; font-family: monospace; }
.pbs-preset:hover { background: var(--table-hover); border-color: #3498db; }
.pbs-preset.active { background: #3498db; color: white; border-color: #3498db; }
.pbs-custom-row { display: flex; align-items: center; gap: 6px; }
.pbs-custom-row label { font-size: 11px; color: var(--text-secondary); }
.pbs-custom-row input[type="range"] { flex: 1; min-width: 80px; }
.pbs-custom-row .pbs-speed-val { font-family: monospace; font-size: 12px; font-weight: 600; min-width: 40px; color: var(--text-primary); }
.pbs-results { flex: 1; display: flex; flex-direction: column; gap: 6px; min-height: 0; }
.pbs-result-card { padding: 10px 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
.pbs-result-label { font-size: 11px; color: var(--text-secondary); }
.pbs-result-value { font-family: monospace; font-size: 16px; font-weight: 700; color: var(--text-primary); }
.pbs-result-value.saved { color: #27ae60; }
.pbs-result-value.longer { color: #e74c3c; }
.pbs-table-wrap { flex: 1; overflow: auto; min-height: 0; border: 1px solid var(--border-color); border-radius: 4px; }
.pbs-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.pbs-table th { position: sticky; top: 0; background: var(--bg-tool-header); color: white; padding: 6px 10px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; }
.pbs-table td { padding: 5px 10px; border-bottom: 1px solid var(--border-light); }
.pbs-table tr:hover td { background: var(--table-hover); }
.pbs-table .mono { font-family: monospace; }
.pbs-table .saved-cell { color: #27ae60; font-weight: 600; }
.pbs-table .longer-cell { color: #e74c3c; font-weight: 600; }
`;
    document.head.appendChild(style);
})();

// Fraction display lookup: decimal -> label
const PBS_FRACTIONS = {
    0.125: '\u215Bx', 0.25: '\u00BCx', 0.5: '\u00BDx', 0.75: '\u00BEx',
    1: '1x', 1.25: '1\u00BCx', 1.5: '1\u00BDx', 1.75: '1\u00BEx',
    2: '2x', 2.5: '2\u00BDx', 3: '3x', 4: '4x', 5: '5x', 6: '6x', 8: '8x',
    0.333: '\u2153x', 0.667: '\u2154x', 1.333: '1\u2153x', 1.667: '1\u2154x',
    2.25: '2\u00BCx', 2.75: '2\u00BEx', 3.5: '3\u00BDx'
};

function pbsSpeedLabel(speed) {
    if (speed < 1) {
        // Check known Unicode fractions first
        for (const [k, v] of Object.entries(PBS_FRACTIONS)) {
            if (parseFloat(k) < 1 && Math.abs(parseFloat(k) - speed) < 0.005) return v;
        }
        // Try to compute a fraction
        const frac = pbsToFraction(speed);
        if (frac) return frac + 'x';
    }
    // >= 1x: always use decimals
    return speed.toFixed(2).replace(/\.?0+$/, '') + 'x';
}

function pbsToFraction(val) {
    for (let den = 2; den <= 64; den++) {
        const num = Math.round(val * den);
        if (num <= 0 || num >= den) continue;
        if (Math.abs(val - num / den) < 0.005) {
            let a = num, b = den;
            while (b) { const t = b; b = a % b; a = t; }
            return (num / a) + '/' + (den / a);
        }
    }
    return null;
}

// Preset speeds (labels derived from pbsSpeedLabel)
const PBS_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

PluginRegistry.registerTool({
    id: 'playback-speed-calc',
    name: 'Playback Speed Calculator',
    description: 'Calculate duration and time saved at different playback speeds',
    icon: '⏩',
    version: '1.0.0',
    toolbox: 'productivity',
    tags: ['playback', 'speed', 'duration', 'video', 'audio', 'podcast', 'time', 'calculator'],
    title: 'Playback Speed Calculator',
    content: `<div class="pbs-widget">
<div class="pbs-input-row">
<div class="pbs-field"><label>Hours</label><input type="number" class="pbs-hours" value="1" min="0" max="999" oninput="pbsCalc(this)"></div>
<span class="pbs-colon">:</span>
<div class="pbs-field"><label>Minutes</label><input type="number" class="pbs-minutes" value="30" min="0" max="59" oninput="pbsCalc(this)"></div>
<span class="pbs-colon">:</span>
<div class="pbs-field"><label>Seconds</label><input type="number" class="pbs-seconds" value="0" min="0" max="59" oninput="pbsCalc(this)"></div>
</div>
<div class="pbs-total"></div>
<div class="pbs-speed-section">
<span class="pbs-speed-label">Speed</span>
<div class="pbs-presets"></div>
<div class="pbs-custom-row">
<label>Custom:</label>
<input type="range" class="pbs-range" min="0.125" max="8" step="0.025" value="1.25" oninput="pbsRangeChanged(this)">
<span class="pbs-speed-val">1\u00BCx</span>
</div>
</div>
<div class="pbs-results">
<div class="pbs-result-card">
<span class="pbs-result-label">Adjusted Duration</span>
<span class="pbs-result-value pbs-adjusted-dur">—</span>
</div>
<div class="pbs-result-card">
<span class="pbs-result-label pbs-saved-label">Time Saved</span>
<span class="pbs-result-value pbs-time-saved">—</span>
</div>
<div class="pbs-table-wrap">
<table class="pbs-table">
<thead><tr><th>Speed</th><th>Duration</th><th>Saved</th></tr></thead>
<tbody class="pbs-table-body"></tbody>
</table>
</div>
</div>
</div>`,
    contentType: 'html',
    onInit: 'pbsInit',
    source: 'external',
    defaultWidth: 340,
    defaultHeight: 480
});

// ── Helpers ──

function pbsFmtDuration(totalSec) {
    const neg = totalSec < 0;
    const abs = Math.abs(Math.round(totalSec));
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const s = abs % 60;
    const parts = [];
    if (h > 0) parts.push(h.toString());
    parts.push(h > 0 ? m.toString().padStart(2, '0') : m.toString());
    parts.push(s.toString().padStart(2, '0'));
    return (neg ? '-' : '') + parts.join(':');
}

function pbsGetTotalSeconds(widget) {
    const h = parseInt(widget.querySelector('.pbs-hours').value) || 0;
    const m = parseInt(widget.querySelector('.pbs-minutes').value) || 0;
    const s = parseInt(widget.querySelector('.pbs-seconds').value) || 0;
    return h * 3600 + m * 60 + s;
}

function pbsGetSpeed(widget) {
    return parseFloat(widget.querySelector('.pbs-range').value) || 1;
}

// ── Calculation ──

function pbsCalc(el) {
    const widget = el.closest('.pbs-widget');
    const totalSec = pbsGetTotalSeconds(widget);
    const speed = pbsGetSpeed(widget);

    // Total label
    widget.querySelector('.pbs-total').textContent = 'Original: ' + pbsFmtDuration(totalSec);

    // Adjusted
    const adjusted = totalSec / speed;
    const saved = totalSec - adjusted;
    widget.querySelector('.pbs-adjusted-dur').textContent = pbsFmtDuration(adjusted);

    const savedEl = widget.querySelector('.pbs-time-saved');
    savedEl.textContent = (saved >= 0 ? '' : '+') + pbsFmtDuration(Math.abs(saved));
    savedEl.classList.toggle('saved', saved >= 0);
    savedEl.classList.toggle('longer', saved < 0);
    widget.querySelector('.pbs-saved-label').textContent = saved >= 0 ? 'Time Saved' : 'Extra Time';

    // Table
    const tableSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 6, 8];
    const tbody = widget.querySelector('.pbs-table-body');
    tbody.innerHTML = tableSpeeds.map(sp => {
        const dur = totalSec / sp;
        const sv = totalSec - dur;
        const cls = sv > 0 ? 'saved-cell' : sv < 0 ? 'longer-cell' : '';
        const svText = sv === 0 ? '—' : (sv > 0 ? '-' : '+') + pbsFmtDuration(Math.abs(sv));
        return `<tr><td class="mono">${pbsSpeedLabel(sp)}</td><td class="mono">${pbsFmtDuration(dur)}</td><td class="mono ${cls}">${svText}</td></tr>`;
    }).join('');
}

function pbsSetSpeed(btn, speed) {
    const widget = btn.closest('.pbs-widget');
    widget.querySelectorAll('.pbs-preset').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const range = widget.querySelector('.pbs-range');
    range.value = speed;
    widget.querySelector('.pbs-speed-val').textContent = pbsSpeedLabel(speed);
    pbsCalc(btn);
}

function pbsRangeChanged(range) {
    const widget = range.closest('.pbs-widget');
    const speed = parseFloat(range.value);
    widget.querySelector('.pbs-speed-val').textContent = pbsSpeedLabel(speed);
    // Update preset highlights
    widget.querySelectorAll('.pbs-preset').forEach(b => {
        const presetSpeed = parseFloat(b.getAttribute('data-speed'));
        b.classList.toggle('active', Math.abs(presetSpeed - speed) < 0.01);
    });
    pbsCalc(range);
}

function pbsInit() {
    document.querySelectorAll('.pbs-widget').forEach(widget => {
        // Build preset buttons
        const presetsDiv = widget.querySelector('.pbs-presets');
        presetsDiv.innerHTML = PBS_PRESETS.map(sp =>
            `<button class="pbs-preset${sp === 1.25 ? ' active' : ''}" data-speed="${sp}" onclick="pbsSetSpeed(this,${sp})">${pbsSpeedLabel(sp)}</button>`
        ).join('');
        pbsCalc(widget.querySelector('.pbs-hours'));
    });
}

console.log('Playback Speed Calculator plugin loaded');
