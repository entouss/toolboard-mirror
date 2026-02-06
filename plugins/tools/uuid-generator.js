// UUID Generator Tool Plugin
// Generate UUIDs (v4 random, v7 timestamp-based) with bulk generation and history

(function() {
    if (document.getElementById('uuid-generator-styles')) return;
    const style = document.createElement('style');
    style.id = 'uuid-generator-styles';
    style.textContent = `
.tool-content:has(.uuid-widget) { display: flex; flex-direction: column; }
.uuid-widget { padding: 10px; font-size: 12px; display: flex; flex-direction: column; flex: 1; width: 100%; box-sizing: border-box; min-height: 0; gap: 8px; }
.uuid-output-box { display: flex; align-items: center; gap: 6px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; padding: 10px 12px; }
.uuid-output-box code { flex: 1; font-family: monospace; font-size: 14px; word-break: break-all; color: var(--text-primary); user-select: all; }
.uuid-output-box .uuid-copy-btn { padding: 4px 10px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-primary); cursor: pointer; font-size: 11px; border-radius: 3px; white-space: nowrap; flex-shrink: 0; }
.uuid-output-box .uuid-copy-btn:hover { background: var(--table-hover); }
.uuid-controls { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.uuid-controls label { font-weight: 600; font-size: 11px; color: var(--text-heading); }
.uuid-controls select, .uuid-controls input[type="number"] { padding: 5px 8px; border: 1px solid var(--border-color); border-radius: 3px; font-size: 11px; background: var(--input-bg); color: var(--text-primary); }
.uuid-controls select:focus, .uuid-controls input[type="number"]:focus { outline: none; border-color: #3498db; }
.uuid-btn { padding: 6px 14px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-primary); cursor: pointer; font-size: 11px; border-radius: 4px; }
.uuid-btn:hover { background: var(--table-hover); }
.uuid-btn.primary { background: #3498db; color: white; border-color: #3498db; }
.uuid-btn.primary:hover { background: #2980b9; }
.uuid-options-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.uuid-option-group { display: flex; align-items: center; gap: 4px; }
.uuid-option-group label { font-weight: 400; font-size: 11px; color: var(--text-secondary); white-space: nowrap; }
.uuid-checkbox-group { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-secondary); }
.uuid-checkbox-group input[type="checkbox"] { margin: 0; }
.uuid-bulk-output { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 4px; }
.uuid-bulk-output textarea { flex: 1; resize: none; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-family: monospace; font-size: 12px; background: var(--input-bg); color: var(--text-primary); min-height: 80px; }
.uuid-bulk-output textarea:focus { outline: none; border-color: #3498db; }
.uuid-bulk-actions { display: flex; gap: 6px; }
.uuid-info { font-size: 10px; color: var(--text-muted); flex-shrink: 0; }
`;
    document.head.appendChild(style);
})();

PluginRegistry.registerTool({
    id: 'uuid-generator',
    name: 'UUID Generator',
    description: 'Generate UUIDs v4 (random) and v7 (timestamp-sorted)',
    icon: '🆔',
    version: '1.0.0',
    toolbox: 'developer-tools',
    tags: ['uuid', 'guid', 'random', 'unique', 'identifier', 'id', 'generator'],
    title: 'UUID Generator',
    content: `<div class="uuid-widget">
<div class="uuid-output-box">
<code class="uuid-current">click Generate</code>
<button class="uuid-copy-btn" onclick="uuidCopyCurrent(this)">Copy</button>
</div>
<div class="uuid-controls">
<div class="uuid-options-row">
<div class="uuid-option-group">
<label>Version:</label>
<select class="uuid-version-select" onchange="uuidGenerate(this)">
<option value="4" selected>v4 (Random)</option>
<option value="7">v7 (Timestamp)</option>
</select>
</div>
<div class="uuid-option-group">
<label>Count:</label>
<input type="number" class="uuid-count-input" value="1" min="1" max="500" step="1">
</div>
<div class="uuid-checkbox-group">
<input type="checkbox" class="uuid-uppercase-check" id="uuid-upper" onchange="uuidRefreshDisplay(this)">
<label for="uuid-upper">Uppercase</label>
</div>
<div class="uuid-checkbox-group">
<input type="checkbox" class="uuid-no-hyphens-check" id="uuid-nohyphen" onchange="uuidRefreshDisplay(this)">
<label for="uuid-nohyphen">No hyphens</label>
</div>
</div>
<div style="display: flex; gap: 6px;">
<button class="uuid-btn primary" onclick="uuidGenerate(this)">Generate</button>
<button class="uuid-btn" onclick="uuidCopyAll(this)">Copy All</button>
</div>
</div>
<div class="uuid-bulk-output">
<textarea class="uuid-bulk-area" readonly placeholder="Generated UUIDs will appear here..."></textarea>
</div>
<div class="uuid-info"></div>
</div>`,
    contentType: 'html',
    onInit: 'uuidInit',
    source: 'external',
    defaultWidth: 380,
    defaultHeight: 340
});

// ── UUID Generation ──

function uuidGenerateV4() {
    // RFC 4122 version 4 UUID using crypto.getRandomValues
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    return uuidBytesToString(bytes);
}

function uuidGenerateV7() {
    // RFC 9562 version 7 UUID (timestamp + random)
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const now = Date.now();
    // 48-bit millisecond timestamp in bytes 0-5
    bytes[0] = (now / 2**40) & 0xff;
    bytes[1] = (now / 2**32) & 0xff;
    bytes[2] = (now / 2**24) & 0xff;
    bytes[3] = (now / 2**16) & 0xff;
    bytes[4] = (now / 2**8) & 0xff;
    bytes[5] = now & 0xff;
    bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    return uuidBytesToString(bytes);
}

function uuidBytesToString(bytes) {
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function uuidFormat(uuid, uppercase, noHyphens) {
    let result = uuid;
    if (noHyphens) result = result.replace(/-/g, '');
    if (uppercase) result = result.toUpperCase();
    return result;
}

// ── Widget Functions ──

let _uuidRawList = [];

function uuidInit() {
    document.querySelectorAll('.uuid-widget').forEach(widget => {
        const genBtn = widget.querySelector('.uuid-btn.primary');
        if (genBtn) uuidGenerate(genBtn);
    });
}

function uuidGenerate(element) {
    const widget = element.closest('.uuid-widget');
    const version = widget.querySelector('.uuid-version-select').value;
    const count = Math.min(500, Math.max(1, parseInt(widget.querySelector('.uuid-count-input').value) || 1));
    const uppercase = widget.querySelector('.uuid-uppercase-check').checked;
    const noHyphens = widget.querySelector('.uuid-no-hyphens-check').checked;

    const genFn = version === '7' ? uuidGenerateV7 : uuidGenerateV4;
    _uuidRawList = [];
    for (let i = 0; i < count; i++) {
        _uuidRawList.push(genFn());
    }

    const formatted = _uuidRawList.map(u => uuidFormat(u, uppercase, noHyphens));

    widget.querySelector('.uuid-current').textContent = formatted[0];
    widget.querySelector('.uuid-bulk-area').value = formatted.join('\n');
    widget.querySelector('.uuid-info').textContent = `Generated ${count} UUID${count > 1 ? 's' : ''} (v${version})`;
}

function uuidRefreshDisplay(element) {
    const widget = element.closest('.uuid-widget');
    if (_uuidRawList.length === 0) return;
    const uppercase = widget.querySelector('.uuid-uppercase-check').checked;
    const noHyphens = widget.querySelector('.uuid-no-hyphens-check').checked;
    const formatted = _uuidRawList.map(u => uuidFormat(u, uppercase, noHyphens));
    widget.querySelector('.uuid-current').textContent = formatted[0];
    widget.querySelector('.uuid-bulk-area').value = formatted.join('\n');
}

function uuidCopyCurrent(btn) {
    const widget = btn.closest('.uuid-widget');
    const text = widget.querySelector('.uuid-current').textContent;
    if (!text || text === 'click Generate') return;
    navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = orig, 800);
    });
}

function uuidCopyAll(btn) {
    const widget = btn.closest('.uuid-widget');
    const text = widget.querySelector('.uuid-bulk-area').value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = orig, 800);
    });
}

console.log('UUID Generator plugin loaded');
