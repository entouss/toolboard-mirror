// QR Code Generator Tool Plugin
// Generates QR codes from text, URLs, and other data

(function() {
    if (document.getElementById('qr-generator-styles')) return;
    const style = document.createElement('style');
    style.id = 'qr-generator-styles';
    style.textContent = `
.tool-content:has(.qr-widget) { display: flex; flex-direction: column; }
.qr-widget { padding: 10px; font-size: 12px; display: flex; flex-direction: column; flex: 1; width: 100%; box-sizing: border-box; min-height: 0; gap: 10px; }
.qr-input-section { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
.qr-input-section label { font-weight: 600; font-size: 11px; color: var(--text-heading); }
.qr-input-section textarea { resize: none; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-family: monospace; font-size: 12px; background: var(--input-bg); color: var(--text-primary); min-height: 60px; }
.qr-input-section textarea:focus { outline: none; border-color: #3498db; }
.qr-options-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.qr-option-group { display: flex; align-items: center; gap: 4px; }
.qr-option-group label { font-weight: 400; font-size: 11px; color: var(--text-secondary); white-space: nowrap; }
.qr-option-group select, .qr-option-group input[type="number"] { padding: 4px 6px; border: 1px solid var(--border-color); border-radius: 3px; font-size: 11px; background: var(--input-bg); color: var(--text-primary); }
.qr-option-group select:focus, .qr-option-group input[type="number"]:focus { outline: none; border-color: #3498db; }
.qr-option-group input[type="color"] { width: 28px; height: 24px; padding: 1px; border: 1px solid var(--border-color); border-radius: 3px; cursor: pointer; background: var(--input-bg); }
.qr-output-section { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; min-height: 180px; position: relative; overflow: hidden; }
.qr-canvas-wrap { display: flex; align-items: center; justify-content: center; padding: 16px; }
.qr-canvas-wrap canvas { image-rendering: pixelated; }
.qr-placeholder { color: var(--text-muted); font-style: italic; font-size: 12px; }
.qr-actions { display: flex; gap: 6px; flex-shrink: 0; }
.qr-action-btn { padding: 6px 12px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-primary); cursor: pointer; font-size: 11px; border-radius: 4px; flex: 1; text-align: center; }
.qr-action-btn:hover { background: var(--table-hover); }
.qr-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.qr-action-btn.primary { background: #3498db; color: white; border-color: #3498db; }
.qr-action-btn.primary:hover { background: #2980b9; }
.qr-action-btn.primary:disabled { background: #3498db; }
.qr-info { font-size: 10px; color: var(--text-muted); text-align: center; flex-shrink: 0; }
`;
    document.head.appendChild(style);
})();

PluginRegistry.registerTool({
    id: 'qr-code-generator',
    name: 'QR Code Generator',
    description: 'Generate QR codes from text, URLs, WiFi, and more',
    icon: '📱',
    version: '1.0.0',
    toolbox: 'developer-tools',
    tags: ['qr', 'qrcode', 'barcode', 'generator', 'encode'],
    title: 'QR Code Generator',
    content: `<div class="qr-widget">
<div class="qr-input-section">
<label>Content</label>
<textarea placeholder="Enter text, URL, or data to encode..." oninput="qrGenerate(this)"></textarea>
</div>
<div class="qr-options-row">
<div class="qr-option-group">
<label>Size:</label>
<input type="number" class="qr-size-input" value="256" min="64" max="1024" step="32" onchange="qrGenerate(this)">
</div>
<div class="qr-option-group">
<label>EC:</label>
<select class="qr-ec-select" onchange="qrGenerate(this)">
<option value="L">Low (7%)</option>
<option value="M" selected>Medium (15%)</option>
<option value="Q">Quartile (25%)</option>
<option value="H">High (30%)</option>
</select>
</div>
<div class="qr-option-group">
<label>FG:</label>
<input type="color" class="qr-fg-color" value="#000000" onchange="qrGenerate(this)">
</div>
<div class="qr-option-group">
<label>BG:</label>
<input type="color" class="qr-bg-color" value="#ffffff" onchange="qrGenerate(this)">
</div>
</div>
<div class="qr-output-section">
<div class="qr-canvas-wrap">
<span class="qr-placeholder">Enter text above to generate a QR code</span>
</div>
</div>
<div class="qr-actions">
<button class="qr-action-btn primary" onclick="qrDownloadPNG(this)" disabled>Download PNG</button>
<button class="qr-action-btn" onclick="qrDownloadSVG(this)" disabled>Download SVG</button>
<button class="qr-action-btn" onclick="qrCopyToClipboard(this)" disabled>Copy Image</button>
</div>
<div class="qr-info"></div>
</div>`,
    contentType: 'html',
    onInit: 'qrInit',
    source: 'external',
    defaultWidth: 380,
    defaultHeight: 520
});

// ── QR Code encoding engine (self-contained, no external dependencies) ──

const QR = (function() {
    // Error correction codewords and blocks table [totalCW, ecCWPerBlock, numBlocks, dataPerBlock]
    const EC_TABLE = {
        L: [
            [7,1],[10,1],[15,1],[20,1],[26,1],[36,2],[40,2],[48,2],[60,2],[72,2],
            [80,4],[96,4],[104,4],[120,4],[132,4],[144,4],[168,4],[192,4],[224,4],[264,4],
            [308,4],[348,4],[384,4],[416,4],[460,4],[468,4],[520,4],[586,4],[644,4],[718,4],
            [754,4],[808,4],[871,4],[911,4],[985,4],[1033,4],[1115,4],[1171,4],[1231,4],[1286,4]
        ],
        M: [
            [10,1],[16,1],[26,1],[36,2],[48,2],[64,4],[72,4],[88,4],[110,4],[130,4],
            [150,4],[176,4],[198,4],[216,4],[240,4],[280,4],[308,4],[338,4],[364,4],[416,4],
            [442,4],[476,4],[504,4],[560,4],[588,4],[644,4],[700,4],[728,4],[784,4],[812,4],
            [868,4],[924,4],[980,4],[1036,4],[1064,4],[1120,4],[1204,4],[1260,4],[1316,4],[1372,4]
        ],
        Q: [
            [13,1],[22,1],[36,2],[52,2],[72,2],[96,4],[108,4],[132,4],[160,4],[192,4],
            [224,4],[260,4],[288,4],[320,4],[360,4],[408,4],[448,4],[504,4],[546,4],[600,4],
            [644,4],[690,4],[750,4],[810,4],[870,4],[952,4],[1020,4],[1050,4],[1140,4],[1200,4],
            [1290,4],[1350,4],[1440,4],[1530,4],[1590,4],[1680,4],[1770,4],[1860,4],[1950,4],[2040,4]
        ],
        H: [
            [17,1],[28,1],[44,2],[64,2],[88,4],[112,4],[130,4],[156,4],[192,4],[224,4],
            [264,4],[308,4],[352,4],[384,4],[432,4],[480,4],[532,4],[588,4],[650,4],[700,4],
            [750,4],[816,4],[900,4],[960,4],[1050,4],[1110,4],[1200,4],[1260,4],[1350,4],[1440,4],
            [1530,4],[1620,4],[1710,4],[1800,4],[1890,4],[1980,4],[2100,4],[2220,4],[2310,4],[2430,4]
        ]
    };

    // Use the well-tested qrcode-generator library approach with a minimal implementation
    // This is a port of the core algorithm

    const MODE_NUMBER = 1, MODE_ALPHA = 2, MODE_BYTE = 4;
    const PAD0 = 0xEC, PAD1 = 0x11;

    const EC_LEVEL_MAP = { L: 1, M: 0, Q: 3, H: 2 };

    // GF(2^8) math for Reed-Solomon
    const EXP_TABLE = new Array(256);
    const LOG_TABLE = new Array(256);
    (function() {
        let x = 1;
        for (let i = 0; i < 255; i++) {
            EXP_TABLE[i] = x;
            LOG_TABLE[x] = i;
            x <<= 1;
            if (x >= 256) x ^= 0x11d;
        }
        EXP_TABLE[255] = EXP_TABLE[0];
    })();

    function gfMul(a, b) {
        if (a === 0 || b === 0) return 0;
        return EXP_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255];
    }

    function rsGenPoly(degree) {
        let poly = [1];
        for (let i = 0; i < degree; i++) {
            const newPoly = new Array(poly.length + 1).fill(0);
            for (let j = 0; j < poly.length; j++) {
                newPoly[j] ^= poly[j];
                newPoly[j + 1] ^= gfMul(poly[j], EXP_TABLE[i]);
            }
            poly = newPoly;
        }
        return poly;
    }

    function rsEncode(data, ecCount) {
        const gen = rsGenPoly(ecCount);
        const msg = new Array(data.length + ecCount).fill(0);
        for (let i = 0; i < data.length; i++) msg[i] = data[i];
        for (let i = 0; i < data.length; i++) {
            const coef = msg[i];
            if (coef !== 0) {
                for (let j = 0; j < gen.length; j++) {
                    msg[i + j] ^= gfMul(gen[j], coef);
                }
            }
        }
        return msg.slice(data.length);
    }

    // Data capacity table (byte mode) per version per EC level
    const BYTE_CAPACITY = {
        L: [17,32,53,78,106,134,154,192,230,271,321,367,425,458,520,586,644,718,792,858,929,1003,1091,1171,1273,1367,1465,1528,1628,1732,1840,1952,2068,2188,2303,2431,2563,2699,2809,2953],
        M: [14,26,42,62,84,106,122,152,180,213,251,287,331,362,412,450,504,560,624,666,711,779,857,911,997,1059,1125,1190,1264,1370,1452,1538,1628,1722,1809,1911,1989,2099,2213,2331],
        Q: [11,20,32,46,60,74,86,108,130,151,177,203,241,258,292,322,364,394,442,482,509,565,611,661,715,751,805,868,908,982,1030,1112,1168,1228,1283,1351,1423,1499,1579,1663],
        H: [7,14,24,34,44,58,64,84,98,119,137,155,177,194,220,250,280,310,338,382,403,439,461,511,535,593,625,658,698,742,790,842,898,958,983,1051,1093,1139,1219,1273]
    };

    function bestVersion(dataLen, ecLevel) {
        const caps = BYTE_CAPACITY[ecLevel];
        for (let v = 0; v < 40; v++) {
            if (caps[v] >= dataLen) return v + 1;
        }
        return -1;
    }

    function getSize(version) { return version * 4 + 17; }

    function getAlignmentPositions(version) {
        if (version === 1) return [];
        const intervals = Math.floor(version / 7) + 1;
        const size = getSize(version);
        const step = Math.ceil((size - 13) / (intervals)) ;
        const aligned = step % 2 === 0 ? step : step + 1;
        const positions = [6];
        let pos = size - 7;
        while (positions.length < intervals + 1) {
            positions.splice(1, 0, pos);
            pos -= aligned;
        }
        return positions;
    }

    function makeMatrix(version) {
        const size = getSize(version);
        const matrix = [];
        const reserved = [];
        for (let i = 0; i < size; i++) {
            matrix.push(new Array(size).fill(0));
            reserved.push(new Array(size).fill(false));
        }
        return { matrix, reserved, size };
    }

    function placeFinder(m, row, col) {
        for (let r = -1; r <= 7; r++) {
            for (let c = -1; c <= 7; c++) {
                const rr = row + r, cc = col + c;
                if (rr < 0 || rr >= m.size || cc < 0 || cc >= m.size) continue;
                m.reserved[rr][cc] = true;
                if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
                    if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
                        m.matrix[rr][cc] = 1;
                    } else {
                        m.matrix[rr][cc] = 0;
                    }
                }
            }
        }
    }

    function placeAlignment(m, version) {
        const positions = getAlignmentPositions(version);
        for (const row of positions) {
            for (const col of positions) {
                if (m.reserved[row][col]) continue;
                for (let r = -2; r <= 2; r++) {
                    for (let c = -2; c <= 2; c++) {
                        const rr = row + r, cc = col + c;
                        m.reserved[rr][cc] = true;
                        if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
                            m.matrix[rr][cc] = 1;
                        } else {
                            m.matrix[rr][cc] = 0;
                        }
                    }
                }
            }
        }
    }

    function placeTiming(m) {
        for (let i = 8; i < m.size - 8; i++) {
            if (!m.reserved[6][i]) {
                m.reserved[6][i] = true;
                m.matrix[6][i] = i % 2 === 0 ? 1 : 0;
            }
            if (!m.reserved[i][6]) {
                m.reserved[i][6] = true;
                m.matrix[i][6] = i % 2 === 0 ? 1 : 0;
            }
        }
    }

    function reserveFormatInfo(m) {
        for (let i = 0; i < 8; i++) {
            m.reserved[8][i] = true;
            m.reserved[8][m.size - 1 - i] = true;
            m.reserved[i][8] = true;
            m.reserved[m.size - 1 - i][8] = true;
        }
        m.reserved[8][8] = true;
        m.reserved[m.size - 8][8] = true;
        m.matrix[m.size - 8][8] = 1; // dark module
    }

    function reserveVersionInfo(m, version) {
        if (version < 7) return;
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 3; j++) {
                m.reserved[i][m.size - 11 + j] = true;
                m.reserved[m.size - 11 + j][i] = true;
            }
        }
    }

    function encodeData(text, version, ecLevel) {
        const bytes = new TextEncoder().encode(text);
        const bits = [];

        function pushBits(val, len) {
            for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
        }

        // Mode indicator (byte mode = 0100)
        pushBits(MODE_BYTE, 4);

        // Character count
        const ccBits = version <= 9 ? 8 : 16;
        pushBits(bytes.length, ccBits);

        // Data
        for (const b of bytes) pushBits(b, 8);

        // Terminator
        const totalDataBits = BYTE_CAPACITY[ecLevel][version - 1] * 8;
        const termLen = Math.min(4, totalDataBits - bits.length);
        pushBits(0, termLen);

        // Pad to byte boundary
        while (bits.length % 8 !== 0) bits.push(0);

        // Pad bytes
        let padToggle = false;
        while (bits.length < totalDataBits) {
            pushBits(padToggle ? PAD1 : PAD0, 8);
            padToggle = !padToggle;
        }

        // Convert bits to bytes
        const dataBytes = [];
        for (let i = 0; i < bits.length; i += 8) {
            let byte = 0;
            for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] || 0);
            dataBytes.push(byte);
        }

        return dataBytes;
    }

    function getBlockInfo(version, ecLevel) {
        // Derive block info from data capacity and EC table
        const totalData = BYTE_CAPACITY[ecLevel][version - 1];
        const size = getSize(version);
        const totalCW = computeTotalCodewords(version);
        const ecCW = totalCW - totalData;

        // Standard block counts for QR codes
        const blockTable = getBlockTable(version, ecLevel);
        return blockTable;
    }

    function computeTotalCodewords(version) {
        const size = getSize(version);
        let total = size * size;
        // Subtract function patterns
        // Finder patterns: 3 * (8*8) + separators already included
        total -= 3 * 64; // finder + separator
        total -= 3 * 15; // extra separator area
        // Timing
        total -= 2 * (size - 16);
        // Alignment
        const ap = getAlignmentPositions(version);
        let alignCount = ap.length * ap.length;
        // Remove alignment patterns that overlap with finders
        if (ap.length > 0) {
            alignCount -= 3; // corners overlap with finders
            if (ap.length === 1) alignCount = 0;
        }
        total -= alignCount * 25;
        // Version info
        if (version >= 7) total -= 36;
        // Format info
        total -= 31;
        // Dark module
        total -= 1;
        return Math.floor(total / 8);
    }

    // Predefined block structures for QR versions
    function getBlockTable(version, ecLevel) {
        // Returns [{count, dataPerBlock, ecPerBlock}]
        // Using standard QR code specification tables
        const DATA = BYTE_CAPACITY[ecLevel][version - 1];
        const TOTAL = computeTotalCodewords(version);
        const EC_TOTAL = TOTAL - DATA;

        // Standard number of EC codewords per block for each version/EC level
        const EC_PER_BLOCK_TABLE = {
            L: [7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
            M: [10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
            Q: [13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
            H: [17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]
        };

        const ecPerBlock = EC_PER_BLOCK_TABLE[ecLevel][version - 1];
        const numBlocks = EC_TOTAL / ecPerBlock;

        // Distribute data across blocks
        const baseData = Math.floor(DATA / numBlocks);
        const extra = DATA % numBlocks;

        const blocks = [];
        if (extra === 0) {
            blocks.push({ count: numBlocks, dataPerBlock: baseData, ecPerBlock });
        } else {
            blocks.push({ count: numBlocks - extra, dataPerBlock: baseData, ecPerBlock });
            blocks.push({ count: extra, dataPerBlock: baseData + 1, ecPerBlock });
        }
        return blocks;
    }

    function interleaveBlocks(dataBytes, version, ecLevel) {
        const blockInfo = getBlockTable(version, ecLevel);
        const allDataBlocks = [];
        const allEcBlocks = [];
        let offset = 0;

        for (const group of blockInfo) {
            for (let i = 0; i < group.count; i++) {
                const block = dataBytes.slice(offset, offset + group.dataPerBlock);
                offset += group.dataPerBlock;
                allDataBlocks.push(block);
                allEcBlocks.push(rsEncode(block, group.ecPerBlock));
            }
        }

        // Interleave data
        const result = [];
        const maxDataLen = Math.max(...allDataBlocks.map(b => b.length));
        for (let i = 0; i < maxDataLen; i++) {
            for (const block of allDataBlocks) {
                if (i < block.length) result.push(block[i]);
            }
        }
        // Interleave EC
        const maxEcLen = Math.max(...allEcBlocks.map(b => b.length));
        for (let i = 0; i < maxEcLen; i++) {
            for (const block of allEcBlocks) {
                if (i < block.length) result.push(block[i]);
            }
        }
        return result;
    }

    function placeData(m, codewords) {
        const bits = [];
        for (const cw of codewords) {
            for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1);
        }

        let bitIdx = 0;
        let upward = true;
        for (let right = m.size - 1; right >= 1; right -= 2) {
            if (right === 6) right = 5; // skip timing column
            const rows = upward ? Array.from({length: m.size}, (_, i) => m.size - 1 - i) : Array.from({length: m.size}, (_, i) => i);
            for (const row of rows) {
                for (const col of [right, right - 1]) {
                    if (!m.reserved[row][col]) {
                        if (bitIdx < bits.length) {
                            m.matrix[row][col] = bits[bitIdx++];
                        }
                    }
                }
            }
            upward = !upward;
        }
    }

    const MASK_FUNCTIONS = [
        (r, c) => (r + c) % 2 === 0,
        (r, c) => r % 2 === 0,
        (r, c) => c % 3 === 0,
        (r, c) => (r + c) % 3 === 0,
        (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
        (r, c) => (r * c) % 2 + (r * c) % 3 === 0,
        (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
        (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
    ];

    function applyMask(m, maskIdx) {
        const fn = MASK_FUNCTIONS[maskIdx];
        for (let r = 0; r < m.size; r++) {
            for (let c = 0; c < m.size; c++) {
                if (!m.reserved[r][c] && fn(r, c)) {
                    m.matrix[r][c] ^= 1;
                }
            }
        }
    }

    function penaltyScore(m) {
        let score = 0;
        const s = m.size;
        // Rule 1: consecutive same-color modules in row/col
        for (let r = 0; r < s; r++) {
            let count = 1;
            for (let c = 1; c < s; c++) {
                if (m.matrix[r][c] === m.matrix[r][c - 1]) { count++; }
                else { if (count >= 5) score += count - 2; count = 1; }
            }
            if (count >= 5) score += count - 2;
        }
        for (let c = 0; c < s; c++) {
            let count = 1;
            for (let r = 1; r < s; r++) {
                if (m.matrix[r][c] === m.matrix[r - 1][c]) { count++; }
                else { if (count >= 5) score += count - 2; count = 1; }
            }
            if (count >= 5) score += count - 2;
        }
        // Rule 2: 2x2 blocks
        for (let r = 0; r < s - 1; r++) {
            for (let c = 0; c < s - 1; c++) {
                const v = m.matrix[r][c];
                if (v === m.matrix[r][c+1] && v === m.matrix[r+1][c] && v === m.matrix[r+1][c+1]) score += 3;
            }
        }
        // Rule 3: finder-like pattern
        const pat1 = [1,0,1,1,1,0,1,0,0,0,0];
        const pat2 = [0,0,0,0,1,0,1,1,1,0,1];
        for (let r = 0; r < s; r++) {
            for (let c = 0; c <= s - 11; c++) {
                let match1 = true, match2 = true;
                for (let k = 0; k < 11; k++) {
                    if (m.matrix[r][c+k] !== pat1[k]) match1 = false;
                    if (m.matrix[r][c+k] !== pat2[k]) match2 = false;
                }
                if (match1 || match2) score += 40;
            }
        }
        for (let c = 0; c < s; c++) {
            for (let r = 0; r <= s - 11; r++) {
                let match1 = true, match2 = true;
                for (let k = 0; k < 11; k++) {
                    if (m.matrix[r+k][c] !== pat1[k]) match1 = false;
                    if (m.matrix[r+k][c] !== pat2[k]) match2 = false;
                }
                if (match1 || match2) score += 40;
            }
        }
        // Rule 4: proportion of dark modules
        let dark = 0;
        for (let r = 0; r < s; r++) for (let c = 0; c < s; c++) if (m.matrix[r][c]) dark++;
        const pct = (dark / (s * s)) * 100;
        score += Math.floor(Math.abs(pct - 50) / 5) * 10;
        return score;
    }

    const FORMAT_INFO_STRINGS = (function() {
        const table = {};
        const FORMAT_POLY = 0x537;
        const FORMAT_MASK = 0x5412;
        for (const [level, bits] of [['M',0],['L',1],['H',2],['Q',3]]) {
            table[level] = [];
            for (let mask = 0; mask < 8; mask++) {
                let data = (bits << 3) | mask;
                let encoded = data << 10;
                for (let i = 14; i >= 10; i--) {
                    if (encoded & (1 << i)) encoded ^= FORMAT_POLY << (i - 10);
                }
                encoded = ((data << 10) | encoded) ^ FORMAT_MASK;
                table[level].push(encoded);
            }
        }
        return table;
    })();

    function placeFormatInfo(m, ecLevel, maskIdx) {
        const info = FORMAT_INFO_STRINGS[ecLevel][maskIdx];
        const bits = [];
        for (let i = 14; i >= 0; i--) bits.push((info >> i) & 1);

        // Around top-left finder
        const positions1 = [
            [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],
            [7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]
        ];
        for (let i = 0; i < 15; i++) {
            m.matrix[positions1[i][0]][positions1[i][1]] = bits[i];
        }
        // Bottom-left and top-right
        const positions2 = [
            [m.size-1,8],[m.size-2,8],[m.size-3,8],[m.size-4,8],[m.size-5,8],[m.size-6,8],[m.size-7,8],
            [8,m.size-8],[8,m.size-7],[8,m.size-6],[8,m.size-5],[8,m.size-4],[8,m.size-3],[8,m.size-2],[8,m.size-1]
        ];
        for (let i = 0; i < 15; i++) {
            m.matrix[positions2[i][0]][positions2[i][1]] = bits[i];
        }
    }

    function placeVersionInfo(m, version) {
        if (version < 7) return;
        const VERSION_POLY = 0x1F25;
        let data = version << 12;
        let rem = data;
        for (let i = 17; i >= 12; i--) {
            if (rem & (1 << i)) rem ^= VERSION_POLY << (i - 12);
        }
        const encoded = data | rem;
        const bits = [];
        for (let i = 17; i >= 0; i--) bits.push((encoded >> i) & 1);

        let idx = 0;
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 3; j++) {
                const bit = bits[17 - idx];
                m.matrix[i][m.size - 11 + j] = bit;
                m.matrix[m.size - 11 + j][i] = bit;
                idx++;
            }
        }
    }

    function generate(text, ecLevel) {
        const bytes = new TextEncoder().encode(text);
        const version = bestVersion(bytes.length, ecLevel);
        if (version === -1) return null;

        const dataBytes = encodeData(text, version, ecLevel);
        const codewords = interleaveBlocks(dataBytes, version, ecLevel);

        let bestMask = 0, bestScore = Infinity, bestMatrix = null;
        for (let mask = 0; mask < 8; mask++) {
            const m = makeMatrix(version);
            placeFinder(m, 0, 0);
            placeFinder(m, 0, m.size - 7);
            placeFinder(m, m.size - 7, 0);
            placeAlignment(m, version);
            placeTiming(m);
            reserveFormatInfo(m);
            reserveVersionInfo(m, version);
            placeData(m, codewords);
            applyMask(m, mask);
            placeFormatInfo(m, ecLevel, mask);
            placeVersionInfo(m, version);
            const score = penaltyScore(m);
            if (score < bestScore) {
                bestScore = score;
                bestMask = mask;
                bestMatrix = m;
            }
        }
        return { matrix: bestMatrix.matrix, size: bestMatrix.size, version };
    }

    return { generate, bestVersion };
})();

// ── Rendering ──

function qrInit() {
    // Nothing special needed on init
}

function qrGenerate(element) {
    const widget = element.closest('.qr-widget');
    const text = widget.querySelector('textarea').value;
    const wrap = widget.querySelector('.qr-canvas-wrap');
    const info = widget.querySelector('.qr-info');
    const buttons = widget.querySelectorAll('.qr-action-btn');

    if (!text) {
        wrap.innerHTML = '<span class="qr-placeholder">Enter text above to generate a QR code</span>';
        info.textContent = '';
        buttons.forEach(b => b.disabled = true);
        return;
    }

    const ecLevel = widget.querySelector('.qr-ec-select').value;
    const pixelSize = parseInt(widget.querySelector('.qr-size-input').value) || 256;
    const fgColor = widget.querySelector('.qr-fg-color').value;
    const bgColor = widget.querySelector('.qr-bg-color').value;

    const result = QR.generate(text, ecLevel);
    if (!result) {
        wrap.innerHTML = '<span class="qr-placeholder" style="color: var(--error-text);">Text too long for QR code</span>';
        info.textContent = '';
        buttons.forEach(b => b.disabled = true);
        return;
    }

    const { matrix, size, version } = result;
    const quietZone = 4;
    const totalModules = size + quietZone * 2;
    const scale = pixelSize / totalModules;

    const canvas = document.createElement('canvas');
    canvas.width = pixelSize;
    canvas.height = pixelSize;
    canvas.className = 'qr-canvas';
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, pixelSize, pixelSize);

    // Modules
    ctx.fillStyle = fgColor;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (matrix[r][c]) {
                const x = Math.round((c + quietZone) * scale);
                const y = Math.round((r + quietZone) * scale);
                const w = Math.round((c + quietZone + 1) * scale) - x;
                const h = Math.round((r + quietZone + 1) * scale) - y;
                ctx.fillRect(x, y, w, h);
            }
        }
    }

    wrap.innerHTML = '';
    wrap.appendChild(canvas);

    const byteLen = new TextEncoder().encode(text).length;
    info.textContent = `Version ${version} | ${size}×${size} modules | ${byteLen} bytes | EC: ${ecLevel}`;
    buttons.forEach(b => b.disabled = false);
}

function qrDownloadPNG(btn) {
    const widget = btn.closest('.qr-widget');
    const canvas = widget.querySelector('.qr-canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = 'qrcode.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
}

function qrDownloadSVG(btn) {
    const widget = btn.closest('.qr-widget');
    const text = widget.querySelector('textarea').value;
    if (!text) return;

    const ecLevel = widget.querySelector('.qr-ec-select').value;
    const fgColor = widget.querySelector('.qr-fg-color').value;
    const bgColor = widget.querySelector('.qr-bg-color').value;

    const result = QR.generate(text, ecLevel);
    if (!result) return;

    const { matrix, size } = result;
    const quietZone = 4;
    const total = size + quietZone * 2;
    const moduleSize = 10;
    const svgSize = total * moduleSize;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">`;
    svg += `<rect width="${svgSize}" height="${svgSize}" fill="${bgColor}"/>`;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (matrix[r][c]) {
                svg += `<rect x="${(c + quietZone) * moduleSize}" y="${(r + quietZone) * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${fgColor}"/>`;
            }
        }
    }
    svg += '</svg>';

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.download = 'qrcode.svg';
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
}

function qrCopyToClipboard(btn) {
    const widget = btn.closest('.qr-widget');
    const canvas = widget.querySelector('.qr-canvas');
    if (!canvas) return;
    canvas.toBlob(blob => {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(() => {
            const orig = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = orig, 1000);
        });
    });
}

console.log('QR Code Generator plugin loaded');
