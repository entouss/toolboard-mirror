// Case Converter Tool Plugin
// Convert text between camelCase, snake_case, kebab-case, PascalCase, UPPER, lower, Title, and more

(function() {
    if (document.getElementById('case-converter-styles')) return;
    const style = document.createElement('style');
    style.id = 'case-converter-styles';
    style.textContent = `
.tool-content:has(.case-widget) { display: flex; flex-direction: column; }
.case-widget { padding: 10px; font-size: 12px; display: flex; flex-direction: column; flex: 1; width: 100%; box-sizing: border-box; min-height: 0; gap: 8px; }
.case-input-section { display: flex; flex-direction: column; gap: 4px; flex: 1; min-height: 0; }
.case-input-section label { font-weight: 600; font-size: 11px; color: var(--text-heading); flex-shrink: 0; }
.case-input-section textarea { flex: 1; resize: none; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-family: monospace; font-size: 12px; background: var(--input-bg); color: var(--text-primary); min-height: 50px; }
.case-input-section textarea:focus { outline: none; border-color: #3498db; }
.case-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; flex-shrink: 0; }
.case-btn { padding: 6px 8px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-primary); cursor: pointer; font-size: 11px; border-radius: 4px; text-align: left; display: flex; justify-content: space-between; align-items: center; gap: 4px; }
.case-btn:hover { background: var(--table-hover); border-color: #3498db; }
.case-btn .case-label { font-weight: 600; }
.case-btn .case-preview { font-family: monospace; font-size: 10px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px; text-align: right; }
.case-output-section { display: flex; flex-direction: column; gap: 4px; flex: 1; min-height: 0; }
.case-output-section label { font-weight: 600; font-size: 11px; color: var(--text-heading); flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; }
.case-output-section textarea { flex: 1; resize: none; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-family: monospace; font-size: 12px; background: var(--input-bg); color: var(--text-primary); min-height: 50px; }
.case-output-section textarea:focus { outline: none; border-color: #3498db; }
.case-copy-btn { padding: 2px 8px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-primary); cursor: pointer; font-size: 10px; border-radius: 3px; font-weight: 400; }
.case-copy-btn:hover { background: var(--table-hover); }
`;
    document.head.appendChild(style);
})();

PluginRegistry.registerTool({
    id: 'case-converter',
    name: 'Case Converter',
    description: 'Convert text between camelCase, snake_case, kebab-case, PascalCase, and more',
    icon: '🔡',
    version: '1.0.0',
    toolbox: 'developer-tools',
    tags: ['case', 'convert', 'camel', 'snake', 'kebab', 'pascal', 'upper', 'lower', 'title', 'text'],
    title: 'Case Converter',
    content: `<div class="case-widget">
<div class="case-input-section">
<label>Input</label>
<textarea class="case-input" placeholder="Type or paste text here..." oninput="caseUpdatePreviews(this)"></textarea>
</div>
<div class="case-grid">
<button class="case-btn" onclick="caseApply(this,'camel')"><span class="case-label">camelCase</span><span class="case-preview"></span></button>
<button class="case-btn" onclick="caseApply(this,'pascal')"><span class="case-label">PascalCase</span><span class="case-preview"></span></button>
<button class="case-btn" onclick="caseApply(this,'snake')"><span class="case-label">snake_case</span><span class="case-preview"></span></button>
<button class="case-btn" onclick="caseApply(this,'kebab')"><span class="case-label">kebab-case</span><span class="case-preview"></span></button>
<button class="case-btn" onclick="caseApply(this,'constant')"><span class="case-label">CONSTANT_CASE</span><span class="case-preview"></span></button>
<button class="case-btn" onclick="caseApply(this,'dot')"><span class="case-label">dot.case</span><span class="case-preview"></span></button>
<button class="case-btn" onclick="caseApply(this,'upper')"><span class="case-label">UPPER CASE</span><span class="case-preview"></span></button>
<button class="case-btn" onclick="caseApply(this,'lower')"><span class="case-label">lower case</span><span class="case-preview"></span></button>
<button class="case-btn" onclick="caseApply(this,'title')"><span class="case-label">Title Case</span><span class="case-preview"></span></button>
<button class="case-btn" onclick="caseApply(this,'sentence')"><span class="case-label">Sentence case</span><span class="case-preview"></span></button>
<button class="case-btn" onclick="caseApply(this,'path')"><span class="case-label">path/case</span><span class="case-preview"></span></button>
<button class="case-btn" onclick="caseApply(this,'header')"><span class="case-label">Header-Case</span><span class="case-preview"></span></button>
</div>
<div class="case-output-section">
<label>Output <button class="case-copy-btn" onclick="caseCopyOutput(this)">Copy</button></label>
<textarea class="case-output" readonly placeholder="Click a case style above..."></textarea>
</div>
</div>`,
    contentType: 'html',
    onInit: 'caseConvInit',
    source: 'external',
    defaultWidth: 340,
    defaultHeight: 440
});

// ── Tokenizer: split any input into words ──

function caseTokenize(text) {
    // Handle multiline: process each line separately
    return text.split('\n').map(line => {
        let s = line.trim();
        if (!s) return [];
        // If already delimited by separators, split on those
        if (/[_\-./\s]/.test(s)) {
            return s.split(/[_\-./\s]+/).filter(Boolean).map(w => w.toLowerCase());
        }
        // Otherwise split camelCase/PascalCase boundaries
        return s
            .replace(/([a-z])([A-Z])/g, '$1\0$2')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1\0$2')
            .split('\0')
            .filter(Boolean)
            .map(w => w.toLowerCase());
    });
}

// ── Converters ──

function caseConvert(text, style) {
    const lines = caseTokenize(text);
    return lines.map(words => {
        if (words.length === 0) return '';
        switch (style) {
            case 'camel':
                return words[0] + words.slice(1).map(w => w[0].toUpperCase() + w.slice(1)).join('');
            case 'pascal':
                return words.map(w => w[0].toUpperCase() + w.slice(1)).join('');
            case 'snake':
                return words.join('_');
            case 'kebab':
                return words.join('-');
            case 'constant':
                return words.map(w => w.toUpperCase()).join('_');
            case 'dot':
                return words.join('.');
            case 'path':
                return words.join('/');
            case 'upper':
                return words.map(w => w.toUpperCase()).join(' ');
            case 'lower':
                return words.join(' ');
            case 'title':
                return words.map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
            case 'sentence':
                return words[0][0].toUpperCase() + words[0].slice(1) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '');
            case 'header':
                return words.map(w => w[0].toUpperCase() + w.slice(1)).join('-');
            default:
                return words.join(' ');
        }
    }).join('\n');
}

// ── Widget functions ──

function caseConvInit() {
    document.querySelectorAll('.case-widget').forEach(widget => {
        const input = widget.querySelector('.case-input');
        if (input && input.value) caseUpdatePreviews(input);
    });
}

function caseUpdatePreviews(textarea) {
    const widget = textarea.closest('.case-widget');
    const text = textarea.value;
    const styles = ['camel','pascal','snake','kebab','constant','dot','upper','lower','title','sentence','path','header'];
    const buttons = widget.querySelectorAll('.case-btn');
    buttons.forEach((btn, i) => {
        const preview = btn.querySelector('.case-preview');
        if (text) {
            preview.textContent = caseConvert(text.split('\n')[0], styles[i]);
        } else {
            preview.textContent = '';
        }
    });
}

function caseApply(btn, style) {
    const widget = btn.closest('.case-widget');
    const text = widget.querySelector('.case-input').value;
    if (!text) return;
    const result = caseConvert(text, style);
    widget.querySelector('.case-output').value = result;
}

function caseCopyOutput(btn) {
    const widget = btn.closest('.case-widget');
    const text = widget.querySelector('.case-output').value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = orig, 800);
    });
}

console.log('Case Converter plugin loaded');
