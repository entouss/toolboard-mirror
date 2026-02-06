// HTTP Request Builder Tool Plugin
// HTTP request builder for testing API endpoints

(function() {
    if (document.getElementById('http-request-builder-styles')) return;
    const style = document.createElement('style');
    style.id = 'http-request-builder-styles';
    style.textContent = `
.tool-content:has(.http-widget) { display: flex; flex-direction: column; }
.http-widget { padding: 10px; font-size: 12px; display: flex; flex-direction: column; flex: 1; width: 100%; box-sizing: border-box; min-height: 0; gap: 8px; }
.http-url-bar { display: flex; gap: 6px; flex-shrink: 0; align-items: center; }
.http-method-select { padding: 5px 6px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 11px; font-weight: 700; background: var(--input-bg); color: #27ae60; cursor: pointer; min-width: 72px; }
.http-method-select:focus { outline: none; border-color: #3498db; }
.http-url-input { flex: 1; padding: 6px 8px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 12px; font-family: monospace; background: var(--input-bg); color: var(--text-primary); min-width: 0; }
.http-url-input:focus { outline: none; border-color: #3498db; }
.http-send-btn { padding: 6px 14px; border: none; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; background: #3498db; color: white; white-space: nowrap; }
.http-send-btn:hover { background: #2980b9; }
.http-send-btn.cancel { background: #e74c3c; }
.http-send-btn.cancel:hover { background: #c0392b; }
.http-cors-notice { font-size: 10px; color: var(--text-muted); flex-shrink: 0; }
.http-req-tabs { display: flex; gap: 2px; flex-shrink: 0; }
.http-tab { padding: 5px 10px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-secondary); cursor: pointer; font-size: 11px; border-radius: 4px 4px 0 0; border-bottom: none; }
.http-tab:hover { background: var(--table-hover); }
.http-tab.active { background: #3498db; color: white; border-color: #3498db; }
.http-req-panels { border: 1px solid var(--border-color); border-radius: 0 4px 4px 4px; max-height: 180px; overflow-y: auto; flex-shrink: 0; }
.http-req-panel { display: none; padding: 8px; flex-direction: column; gap: 6px; }
.http-req-panel.active { display: flex; }
.http-kv-row { display: flex; gap: 4px; align-items: center; }
.http-kv-row input { flex: 1; padding: 4px 6px; border: 1px solid var(--border-color); border-radius: 3px; font-size: 11px; font-family: monospace; background: var(--input-bg); color: var(--text-primary); min-width: 0; }
.http-kv-row input:focus { outline: none; border-color: #3498db; }
.http-kv-row input::placeholder { color: var(--text-muted); }
.http-kv-remove { width: 22px; height: 22px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-muted); cursor: pointer; border-radius: 3px; font-size: 13px; line-height: 20px; text-align: center; padding: 0; flex-shrink: 0; }
.http-kv-remove:hover { background: #e74c3c; color: white; border-color: #e74c3c; }
.http-add-btn { padding: 4px 10px; border: 1px dashed var(--border-color); background: transparent; color: var(--text-muted); cursor: pointer; font-size: 11px; border-radius: 3px; align-self: flex-start; }
.http-add-btn:hover { border-color: #3498db; color: #3498db; }
.http-body-type-row { display: flex; gap: 6px; align-items: center; margin-bottom: 4px; }
.http-body-type-row label { font-size: 11px; color: var(--text-secondary); font-weight: 600; }
.http-body-type-row select { padding: 3px 6px; border: 1px solid var(--border-color); border-radius: 3px; font-size: 11px; background: var(--input-bg); color: var(--text-primary); }
.http-body-type-row select:focus { outline: none; border-color: #3498db; }
.http-body-editor { width: 100%; min-height: 60px; max-height: 120px; resize: vertical; padding: 6px 8px; border: 1px solid var(--border-color); border-radius: 3px; font-size: 11px; font-family: monospace; background: var(--input-bg); color: var(--text-primary); box-sizing: border-box; }
.http-body-editor:focus { outline: none; border-color: #3498db; }
.http-body-none { color: var(--text-muted); font-size: 11px; font-style: italic; }
.http-auth-type-row { display: flex; gap: 6px; align-items: center; margin-bottom: 4px; }
.http-auth-type-row label { font-size: 11px; color: var(--text-secondary); font-weight: 600; }
.http-auth-type-row select { padding: 3px 6px; border: 1px solid var(--border-color); border-radius: 3px; font-size: 11px; background: var(--input-bg); color: var(--text-primary); }
.http-auth-type-row select:focus { outline: none; border-color: #3498db; }
.http-auth-fields { display: flex; flex-direction: column; gap: 4px; }
.http-auth-fields input { padding: 4px 6px; border: 1px solid var(--border-color); border-radius: 3px; font-size: 11px; font-family: monospace; background: var(--input-bg); color: var(--text-primary); }
.http-auth-fields input:focus { outline: none; border-color: #3498db; }
.http-auth-fields input::placeholder { color: var(--text-muted); }
.http-auth-none { color: var(--text-muted); font-size: 11px; font-style: italic; }
.http-resp-section { flex: 1; display: flex; flex-direction: column; min-height: 0; gap: 4px; }
.http-resp-status-bar { display: flex; align-items: center; gap: 8px; flex-shrink: 0; padding: 4px 0; }
.http-status-badge { padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 700; font-family: monospace; color: white; }
.http-status-badge.s2xx { background: #27ae60; }
.http-status-badge.s3xx { background: #3498db; }
.http-status-badge.s4xx { background: #e67e22; }
.http-status-badge.s5xx { background: #e74c3c; }
.http-status-badge.err { background: #95a5a6; }
.http-resp-meta { font-size: 10px; color: var(--text-muted); flex: 1; }
.http-copy-resp-btn { padding: 3px 8px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-primary); cursor: pointer; font-size: 10px; border-radius: 3px; flex-shrink: 0; }
.http-copy-resp-btn:hover { background: var(--table-hover); }
.http-resp-tabs { display: flex; gap: 2px; flex-shrink: 0; }
.http-resp-body-wrap { flex: 1; min-height: 0; overflow: auto; border: 1px solid var(--border-color); border-radius: 0 4px 4px 4px; background: var(--bg-tertiary); }
.http-resp-body { padding: 8px; font-size: 11px; font-family: monospace; white-space: pre-wrap; word-break: break-all; color: var(--text-primary); margin: 0; }
.http-resp-headers-wrap { flex: 1; min-height: 0; overflow: auto; border: 1px solid var(--border-color); border-radius: 0 4px 4px 4px; display: none; }
.http-resp-header-row { display: flex; padding: 3px 8px; font-size: 11px; border-bottom: 1px solid var(--border-color); }
.http-resp-header-row:last-child { border-bottom: none; }
.http-resp-header-key { min-width: 120px; color: var(--text-muted); font-weight: 500; font-family: monospace; }
.http-resp-header-val { flex: 1; color: var(--text-primary); font-family: monospace; word-break: break-all; }
.http-resp-placeholder { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-style: italic; font-size: 12px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-tertiary); min-height: 80px; }
.http-loading-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.15); border-radius: 4px; z-index: 5; }
.http-spinner { width: 24px; height: 24px; border: 3px solid var(--border-color); border-top-color: #3498db; border-radius: 50%; animation: http-spin 0.6s linear infinite; }
@keyframes http-spin { to { transform: rotate(360deg); } }
.http-resp-body-wrap { position: relative; }
.http-truncated-notice { padding: 6px 8px; background: #ffeaa7; color: #2d3436; font-size: 11px; text-align: center; cursor: pointer; border-top: 1px solid var(--border-color); }
.http-truncated-notice:hover { background: #fdcb6e; }
.http-history-section { flex-shrink: 0; border-top: 1px solid var(--border-color); padding-top: 4px; }
.http-history-toggle { display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; font-size: 11px; color: var(--text-secondary); padding: 4px 0; width: 100%; text-align: left; }
.http-history-toggle:hover { color: var(--text-primary); }
.http-history-list { display: none; flex-direction: column; gap: 2px; max-height: 120px; overflow-y: auto; padding: 4px 0; }
.http-history-list.open { display: flex; }
.http-history-item { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border-radius: 3px; cursor: pointer; font-size: 11px; }
.http-history-item:hover { background: var(--table-hover); }
.http-history-method { padding: 1px 5px; border-radius: 2px; font-size: 9px; font-weight: 700; color: white; font-family: monospace; }
.http-history-url { flex: 1; color: var(--text-primary); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.http-history-status { font-size: 10px; font-weight: 600; font-family: monospace; }
.http-history-time { font-size: 10px; color: var(--text-muted); white-space: nowrap; }
.http-error-msg { color: #e74c3c; font-size: 11px; padding: 8px; font-family: monospace; white-space: pre-wrap; }
`;
    document.head.appendChild(style);
})();

PluginRegistry.registerTool({
    id: 'http-request-builder',
    name: 'HTTP Request Builder',
    description: 'HTTP request builder for testing API endpoints',
    icon: '🌐',
    version: '1.0.0',
    toolbox: 'developer-tools',
    tags: ['http', 'request', 'api', 'rest', 'fetch', 'curl', 'endpoint', 'get', 'post'],
    title: 'HTTP Request Builder',
    content: `<div class="http-widget">
<div class="http-url-bar">
<select class="http-method-select" onchange="httpMethodChanged(this)">
<option value="GET" selected>GET</option>
<option value="POST">POST</option>
<option value="PUT">PUT</option>
<option value="PATCH">PATCH</option>
<option value="DELETE">DELETE</option>
<option value="HEAD">HEAD</option>
<option value="OPTIONS">OPTIONS</option>
</select>
<input type="text" class="http-url-input" placeholder="https://api.example.com/endpoint" onkeydown="if(event.key==='Enter')httpSend(this)">
<button class="http-send-btn" onclick="httpSend(this)">Send</button>
</div>
<div class="http-cors-notice">ℹ Requests are sent from the browser and may be blocked by CORS policies.</div>
<div class="http-req-tabs">
<button class="http-tab active" onclick="httpReqTab(this,'params')">Params</button>
<button class="http-tab" onclick="httpReqTab(this,'headers')">Headers</button>
<button class="http-tab http-body-tab" onclick="httpReqTab(this,'body')">Body</button>
<button class="http-tab" onclick="httpReqTab(this,'auth')">Auth</button>
</div>
<div class="http-req-panels">
<div class="http-req-panel active" data-panel="params">
<div class="http-kv-rows" data-type="params"></div>
<button class="http-add-btn" onclick="httpAddKV(this,'params')">+ Add Parameter</button>
</div>
<div class="http-req-panel" data-panel="headers">
<div class="http-kv-rows" data-type="headers"></div>
<button class="http-add-btn" onclick="httpAddKV(this,'headers')">+ Add Header</button>
</div>
<div class="http-req-panel" data-panel="body">
<div class="http-body-type-row">
<label>Type:</label>
<select class="http-body-type-select" onchange="httpBodyTypeChanged(this)">
<option value="none">None</option>
<option value="json">JSON</option>
<option value="form">Form URL-Encoded</option>
<option value="text">Raw Text</option>
</select>
</div>
<div class="http-body-content">
<span class="http-body-none">No body for this request.</span>
</div>
</div>
<div class="http-req-panel" data-panel="auth">
<div class="http-auth-type-row">
<label>Type:</label>
<select class="http-auth-type-select" onchange="httpAuthTypeChanged(this)">
<option value="none">None</option>
<option value="bearer">Bearer Token</option>
<option value="basic">Basic Auth</option>
</select>
</div>
<div class="http-auth-fields">
<span class="http-auth-none">No authentication.</span>
</div>
</div>
</div>
<div class="http-resp-section">
<div class="http-resp-placeholder">Send a request to see the response</div>
</div>
<div class="http-history-section">
<button class="http-history-toggle" onclick="httpToggleHistory(this)">▸ History (0)</button>
<div class="http-history-list"></div>
</div>
</div>`,
    contentType: 'html',
    onInit: 'httpInit',
    source: 'external',
    defaultWidth: 520,
    defaultHeight: 580
});

const _httpState = new WeakMap();

function httpGetState(widget) {
    if (!_httpState.has(widget)) {
        _httpState.set(widget, {
            method: 'GET',
            url: '',
            params: [],
            headers: [],
            bodyType: 'none',
            body: '',
            authType: 'none',
            authToken: '',
            authUser: '',
            authPass: '',
            response: null,
            history: [],
            abortController: null
        });
    }
    return _httpState.get(widget);
}

function httpGetWidget(el) {
    return el.closest('.http-widget');
}

const _httpMethodColors = {
    GET: '#27ae60',
    POST: '#e67e22',
    PUT: '#3498db',
    PATCH: '#8e44ad',
    DELETE: '#e74c3c',
    HEAD: '#27ae60',
    OPTIONS: '#95a5a6'
};

function httpInit() {
    document.querySelectorAll('.http-widget').forEach(widget => {
        if (widget.dataset.httpInited) return;
        widget.dataset.httpInited = '1';
        const st = httpGetState(widget);
        const methodSelect = widget.querySelector('.http-method-select');
        if (methodSelect) {
            methodSelect.style.color = _httpMethodColors[st.method] || '#27ae60';
        }
        httpUpdateBodyTabVisibility(widget);
    });
}

function httpMethodChanged(select) {
    const widget = httpGetWidget(select);
    const st = httpGetState(widget);
    st.method = select.value;
    select.style.color = _httpMethodColors[select.value] || '#27ae60';
    httpUpdateBodyTabVisibility(widget);
}

function httpUpdateBodyTabVisibility(widget) {
    const st = httpGetState(widget);
    const bodyTab = widget.querySelector('.http-body-tab');
    if (bodyTab) {
        const hide = st.method === 'GET' || st.method === 'HEAD';
        bodyTab.style.display = hide ? 'none' : '';
        if (hide && bodyTab.classList.contains('active')) {
            const paramsTab = widget.querySelector('.http-tab');
            if (paramsTab) httpReqTab(paramsTab, 'params');
        }
    }
}

function httpReqTab(btn, panel) {
    const widget = httpGetWidget(btn);
    widget.querySelectorAll('.http-req-tabs .http-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    widget.querySelectorAll('.http-req-panel').forEach(p => p.classList.remove('active'));
    const target = widget.querySelector(`.http-req-panel[data-panel="${panel}"]`);
    if (target) target.classList.add('active');
}

function httpRespTab(btn, panel) {
    const widget = httpGetWidget(btn);
    widget.querySelectorAll('.http-resp-tabs .http-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const bodyWrap = widget.querySelector('.http-resp-body-wrap');
    const headersWrap = widget.querySelector('.http-resp-headers-wrap');
    if (panel === 'body') {
        if (bodyWrap) bodyWrap.style.display = '';
        if (headersWrap) headersWrap.style.display = 'none';
    } else {
        if (bodyWrap) bodyWrap.style.display = 'none';
        if (headersWrap) headersWrap.style.display = '';
    }
}

function httpAddKV(btn, type) {
    const widget = httpGetWidget(btn);
    const container = widget.querySelector(`.http-kv-rows[data-type="${type}"]`);
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'http-kv-row';
    row.innerHTML = `<input type="text" placeholder="Key" oninput="httpKVChanged(this)"><input type="text" placeholder="Value" oninput="httpKVChanged(this)"><button class="http-kv-remove" onclick="httpRemoveKV(this)">×</button>`;
    container.appendChild(row);
}

function httpRemoveKV(btn) {
    const row = btn.closest('.http-kv-row');
    const widget = httpGetWidget(btn);
    if (row) row.remove();
    httpSyncParamsToURL(widget);
}

function httpKVChanged(input) {
    const widget = httpGetWidget(input);
    const container = input.closest('.http-kv-rows');
    if (container && container.dataset.type === 'params') {
        httpSyncParamsToURL(widget);
    }
}

function httpSyncParamsToURL(widget) {
    const st = httpGetState(widget);
    const urlInput = widget.querySelector('.http-url-input');
    if (!urlInput) return;
    let url = urlInput.value;
    try {
        const base = url.split('?')[0];
        const pairs = [];
        const rows = widget.querySelectorAll('.http-kv-rows[data-type="params"] .http-kv-row');
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            const key = inputs[0] ? inputs[0].value.trim() : '';
            const val = inputs[1] ? inputs[1].value : '';
            if (key) pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
        });
        urlInput.value = pairs.length ? base + '?' + pairs.join('&') : base;
    } catch(e) { /* ignore sync errors */ }
}

function httpBodyTypeChanged(select) {
    const widget = httpGetWidget(select);
    const st = httpGetState(widget);
    st.bodyType = select.value;
    const contentDiv = widget.querySelector('.http-body-content');
    if (!contentDiv) return;
    if (select.value === 'none') {
        contentDiv.innerHTML = '<span class="http-body-none">No body for this request.</span>';
    } else {
        let placeholder = '';
        if (select.value === 'json') placeholder = '{\n  "key": "value"\n}';
        else if (select.value === 'form') placeholder = 'key=value&key2=value2';
        else placeholder = 'Enter request body...';
        contentDiv.innerHTML = `<textarea class="http-body-editor" placeholder="${placeholder}" oninput="httpBodyChanged(this)"></textarea>`;
        const editor = contentDiv.querySelector('.http-body-editor');
        if (editor) editor.value = st.body;
    }
}

function httpBodyChanged(textarea) {
    const widget = httpGetWidget(textarea);
    const st = httpGetState(widget);
    st.body = textarea.value;
}

function httpAuthTypeChanged(select) {
    const widget = httpGetWidget(select);
    const st = httpGetState(widget);
    st.authType = select.value;
    const fieldsDiv = widget.querySelector('.http-auth-fields');
    if (!fieldsDiv) return;
    if (select.value === 'none') {
        fieldsDiv.innerHTML = '<span class="http-auth-none">No authentication.</span>';
    } else if (select.value === 'bearer') {
        fieldsDiv.innerHTML = `<input type="text" class="http-auth-token" placeholder="Enter bearer token..." oninput="httpAuthFieldChanged(this)" value="${httpEsc(st.authToken)}">`;
    } else if (select.value === 'basic') {
        fieldsDiv.innerHTML = `<input type="text" class="http-auth-user" placeholder="Username" oninput="httpAuthFieldChanged(this)" value="${httpEsc(st.authUser)}"><input type="password" class="http-auth-pass" placeholder="Password" oninput="httpAuthFieldChanged(this)" value="${httpEsc(st.authPass)}">`;
    }
}

function httpAuthFieldChanged(input) {
    const widget = httpGetWidget(input);
    const st = httpGetState(widget);
    if (input.classList.contains('http-auth-token')) st.authToken = input.value;
    else if (input.classList.contains('http-auth-user')) st.authUser = input.value;
    else if (input.classList.contains('http-auth-pass')) st.authPass = input.value;
}

function httpEsc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function httpFormatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function httpSend(el) {
    const widget = httpGetWidget(el);
    const st = httpGetState(widget);
    const sendBtn = widget.querySelector('.http-send-btn');

    // If currently loading, cancel
    if (st.abortController) {
        st.abortController.abort();
        st.abortController = null;
        if (sendBtn) { sendBtn.textContent = 'Send'; sendBtn.classList.remove('cancel'); }
        httpHideLoading(widget);
        return;
    }

    let url = widget.querySelector('.http-url-input').value.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    st.url = url;
    st.method = widget.querySelector('.http-method-select').value;

    // Build headers
    const fetchHeaders = new Headers();
    const headerRows = widget.querySelectorAll('.http-kv-rows[data-type="headers"] .http-kv-row');
    headerRows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const key = inputs[0] ? inputs[0].value.trim() : '';
        const val = inputs[1] ? inputs[1].value : '';
        if (key) fetchHeaders.set(key, val);
    });

    // Auth
    if (st.authType === 'bearer' && st.authToken) {
        fetchHeaders.set('Authorization', 'Bearer ' + st.authToken);
    } else if (st.authType === 'basic' && st.authUser) {
        fetchHeaders.set('Authorization', 'Basic ' + btoa(st.authUser + ':' + st.authPass));
    }

    // Body
    let fetchBody = null;
    if (st.method !== 'GET' && st.method !== 'HEAD') {
        const bodyTypeSelect = widget.querySelector('.http-body-type-select');
        const bodyType = bodyTypeSelect ? bodyTypeSelect.value : 'none';
        const bodyEditor = widget.querySelector('.http-body-editor');
        const bodyText = bodyEditor ? bodyEditor.value : '';
        if (bodyType === 'json' && bodyText) {
            fetchBody = bodyText;
            if (!fetchHeaders.has('Content-Type')) fetchHeaders.set('Content-Type', 'application/json');
        } else if (bodyType === 'form' && bodyText) {
            fetchBody = bodyText;
            if (!fetchHeaders.has('Content-Type')) fetchHeaders.set('Content-Type', 'application/x-www-form-urlencoded');
        } else if (bodyType === 'text' && bodyText) {
            fetchBody = bodyText;
            if (!fetchHeaders.has('Content-Type')) fetchHeaders.set('Content-Type', 'text/plain');
        }
    }

    // Set up abort + UI
    st.abortController = new AbortController();
    if (sendBtn) { sendBtn.textContent = 'Cancel'; sendBtn.classList.add('cancel'); }
    httpShowLoading(widget);

    const startTime = performance.now();
    try {
        const resp = await fetch(url, {
            method: st.method,
            headers: fetchHeaders,
            body: fetchBody,
            signal: st.abortController.signal
        });
        const elapsed = Math.round(performance.now() - startTime);
        const text = await resp.text();
        const size = new Blob([text]).size;

        // Collect response headers
        const respHeaders = [];
        resp.headers.forEach((val, key) => { respHeaders.push({ key, val }); });

        st.response = {
            status: resp.status,
            statusText: resp.statusText,
            time: elapsed,
            size: size,
            body: text,
            headers: respHeaders,
            truncated: false
        };

        httpAddToHistory(widget, st.method, url, resp.status);
        httpRenderResponse(widget);
    } catch (err) {
        const elapsed = Math.round(performance.now() - startTime);
        if (err.name === 'AbortError') {
            // Request was cancelled, do nothing further
        } else {
            let errMsg = err.message || String(err);
            if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('TypeError')) {
                errMsg += '\n\nThis is likely a CORS error. The server may not allow requests from this origin.\nTry using a CORS proxy or testing against an API that supports CORS.';
            }
            st.response = {
                status: 0,
                statusText: 'Error',
                time: elapsed,
                size: 0,
                body: errMsg,
                headers: [],
                error: true
            };
            httpAddToHistory(widget, st.method, url, 'ERR');
            httpRenderResponse(widget);
        }
    } finally {
        st.abortController = null;
        if (sendBtn) { sendBtn.textContent = 'Send'; sendBtn.classList.remove('cancel'); }
        httpHideLoading(widget);
    }
}

function httpShowLoading(widget) {
    const respSection = widget.querySelector('.http-resp-section');
    if (!respSection) return;
    // Remove existing overlay
    const existing = respSection.querySelector('.http-loading-overlay');
    if (existing) existing.remove();
    respSection.style.position = 'relative';
    const overlay = document.createElement('div');
    overlay.className = 'http-loading-overlay';
    overlay.innerHTML = '<div class="http-spinner"></div>';
    respSection.appendChild(overlay);
}

function httpHideLoading(widget) {
    const overlay = widget.querySelector('.http-loading-overlay');
    if (overlay) overlay.remove();
}

function httpRenderResponse(widget) {
    const st = httpGetState(widget);
    const resp = st.response;
    if (!resp) return;

    const section = widget.querySelector('.http-resp-section');
    if (!section) return;

    // Status class
    let statusClass = 'err';
    if (resp.status >= 200 && resp.status < 300) statusClass = 's2xx';
    else if (resp.status >= 300 && resp.status < 400) statusClass = 's3xx';
    else if (resp.status >= 400 && resp.status < 500) statusClass = 's4xx';
    else if (resp.status >= 500) statusClass = 's5xx';

    const statusLabel = resp.error ? 'Error' : resp.status + ' ' + resp.statusText;
    const meta = resp.time + 'ms' + (resp.size ? ' · ' + httpFormatBytes(resp.size) : '');

    // Format body
    let displayBody = resp.body || '';
    let truncated = false;
    const TRUNCATE_LIMIT = 100 * 1024;
    if (!resp.error && displayBody.length > TRUNCATE_LIMIT) {
        truncated = true;
        st.response.fullBody = displayBody;
        displayBody = displayBody.substring(0, TRUNCATE_LIMIT);
    }

    // Try to pretty-print JSON
    if (!resp.error) {
        try {
            const parsed = JSON.parse(resp.error ? '' : displayBody);
            displayBody = JSON.stringify(parsed, null, 2);
        } catch(e) { /* not JSON, show as-is */ }
    }

    // Collect response headers HTML
    let headersHTML = '';
    (resp.headers || []).forEach(h => {
        headersHTML += `<div class="http-resp-header-row"><span class="http-resp-header-key">${httpEsc(h.key)}</span><span class="http-resp-header-val">${httpEsc(h.val)}</span></div>`;
    });

    let html = '';
    html += `<div class="http-resp-status-bar">`;
    html += `<span class="http-status-badge ${statusClass}">${httpEsc(statusLabel)}</span>`;
    html += `<span class="http-resp-meta">${httpEsc(meta)}</span>`;
    html += `<button class="http-copy-resp-btn" onclick="httpCopyResponse(this)">Copy</button>`;
    html += `</div>`;
    html += `<div class="http-resp-tabs">`;
    html += `<button class="http-tab active" onclick="httpRespTab(this,'body')">Body</button>`;
    html += `<button class="http-tab" onclick="httpRespTab(this,'headers')">Headers</button>`;
    html += `</div>`;

    if (resp.error) {
        html += `<div class="http-resp-body-wrap"><div class="http-error-msg">${httpEsc(displayBody)}</div></div>`;
    } else {
        html += `<div class="http-resp-body-wrap"><pre class="http-resp-body">${httpEsc(displayBody)}</pre>`;
        if (truncated) {
            html += `<div class="http-truncated-notice" onclick="httpShowFullResponse(this)">Response truncated to 100 KB. Click to show full response.</div>`;
        }
        html += `</div>`;
    }
    html += `<div class="http-resp-headers-wrap" style="display:none">${headersHTML || '<div style="padding:8px;color:var(--text-muted);font-size:11px;font-style:italic;">No headers available</div>'}</div>`;

    section.innerHTML = html;
}

function httpShowFullResponse(notice) {
    const widget = httpGetWidget(notice);
    const st = httpGetState(widget);
    if (!st.response || !st.response.fullBody) return;
    let displayBody = st.response.fullBody;
    try {
        const parsed = JSON.parse(displayBody);
        displayBody = JSON.stringify(parsed, null, 2);
    } catch(e) { /* not JSON */ }
    const pre = widget.querySelector('.http-resp-body');
    if (pre) pre.textContent = displayBody;
    notice.remove();
}

function httpCopyResponse(btn) {
    const widget = httpGetWidget(btn);
    const st = httpGetState(widget);
    if (!st.response) return;
    const text = st.response.fullBody || st.response.body || '';
    navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = orig, 800);
    });
}

function httpAddToHistory(widget, method, url, status) {
    const st = httpGetState(widget);
    const entry = {
        method: method,
        url: url,
        status: status,
        time: new Date().toLocaleTimeString()
    };
    st.history.unshift(entry);
    if (st.history.length > 20) st.history.pop();
    httpRenderHistory(widget);
}

function httpRenderHistory(widget) {
    const st = httpGetState(widget);
    const toggle = widget.querySelector('.http-history-toggle');
    if (toggle) {
        const arrow = toggle.textContent.startsWith('▾') ? '▾' : '▸';
        toggle.textContent = arrow + ' History (' + st.history.length + ')';
    }
    const list = widget.querySelector('.http-history-list');
    if (!list) return;
    let html = '';
    st.history.forEach((entry, idx) => {
        const methodColor = _httpMethodColors[entry.method] || '#95a5a6';
        const truncUrl = entry.url.length > 50 ? entry.url.substring(0, 50) + '...' : entry.url;
        let statusColor = 'var(--text-muted)';
        if (typeof entry.status === 'number') {
            if (entry.status >= 200 && entry.status < 300) statusColor = '#27ae60';
            else if (entry.status >= 300 && entry.status < 400) statusColor = '#3498db';
            else if (entry.status >= 400 && entry.status < 500) statusColor = '#e67e22';
            else if (entry.status >= 500) statusColor = '#e74c3c';
        }
        html += `<div class="http-history-item" onclick="httpLoadFromHistory(this,${idx})">`;
        html += `<span class="http-history-method" style="background:${methodColor}">${httpEsc(entry.method)}</span>`;
        html += `<span class="http-history-url">${httpEsc(truncUrl)}</span>`;
        html += `<span class="http-history-status" style="color:${statusColor}">${httpEsc(String(entry.status))}</span>`;
        html += `<span class="http-history-time">${httpEsc(entry.time)}</span>`;
        html += `</div>`;
    });
    list.innerHTML = html;
}

function httpToggleHistory(btn) {
    const widget = httpGetWidget(btn);
    const list = widget.querySelector('.http-history-list');
    if (!list) return;
    const isOpen = list.classList.contains('open');
    list.classList.toggle('open');
    const st = httpGetState(widget);
    btn.textContent = (isOpen ? '▸' : '▾') + ' History (' + st.history.length + ')';
}

function httpLoadFromHistory(el, idx) {
    const widget = httpGetWidget(el);
    const st = httpGetState(widget);
    const entry = st.history[idx];
    if (!entry) return;

    // Set method
    const methodSelect = widget.querySelector('.http-method-select');
    if (methodSelect) {
        methodSelect.value = entry.method;
        st.method = entry.method;
        methodSelect.style.color = _httpMethodColors[entry.method] || '#27ae60';
    }

    // Set URL
    const urlInput = widget.querySelector('.http-url-input');
    if (urlInput) urlInput.value = entry.url;

    httpUpdateBodyTabVisibility(widget);
}

console.log('HTTP Request Builder plugin loaded');
