// Regex Patterns Library Board
// Common regex patterns organized by category using blank note cards

const regexCards = [
    {
        title: 'Email & URLs',
        content: `## Email & URLs

**Email**
\`^[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}$\`

**URL (http/https)**
\`https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&'()*+,;=]+\`

**Domain name**
\`^([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}$\`

**Slug (URL-safe)**
\`^[a-z0-9]+(?:-[a-z0-9]+)*$\``
    },
    {
        title: 'Numbers',
        content: `## Numbers

**Integer**
\`^-?\\d+$\`

**Decimal / float**
\`^-?\\d+(\\.\\d+)?$\`

**Comma-separated number**
\`^\\d{1,3}(,\\d{3})*(\\.\\d+)?$\`

**Hex number**
\`^0x[0-9a-fA-F]+$\`

**Percentage (0–100)**
\`^(100(\\.0+)?|\\d{1,2}(\\.\\d+)?)%$\``
    },
    {
        title: 'Dates & Times',
        content: `## Dates & Times

**YYYY-MM-DD**
\`^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$\`

**MM/DD/YYYY**
\`^(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])\\/\\d{4}$\`

**HH:MM (24h)**
\`^([01]\\d|2[0-3]):[0-5]\\d$\`

**HH:MM:SS**
\`^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$\`

**ISO 8601**
\`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$\``
    },
    {
        title: 'Passwords & Auth',
        content: `## Passwords & Auth

**Min 8 chars, upper+lower+digit**
\`^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$\`

**+ special char required**
\`^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$\`

**UUID v4**
\`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$\`

**JWT token**
\`^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$\`

**Base64**
\`^[A-Za-z0-9+/]+(={0,2})$\``
    },
    {
        title: 'Phone & Address',
        content: `## Phone & Address

**US phone**
\`^\\+?1?[-.\\s]?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}$\`

**International phone**
\`^\\+[1-9]\\d{6,14}$\`

**US ZIP code**
\`^\\d{5}(-\\d{4})?$\`

**UK postcode**
\`^[A-Z]{1,2}\\d[A-Z\\d]?\\s?\\d[A-Z]{2}$\`

**US street address**
\`^\\d+\\s[\\w\\s]+(?:St|Ave|Blvd|Dr|Ln|Rd|Ct)\\.?$\``
    },
    {
        title: 'Web & Markup',
        content: `## Web & Markup

**HTML tag**
\`<([a-z][a-z0-9]*)\\b[^>]*>(.*?)<\\/\\1>\`

**Hex color**
\`^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$\`

**IPv4 address**
\`^(\\d{1,3}\\.){3}\\d{1,3}$\`

**IPv6 address**
\`^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$\`

**CSS property**
\`[a-z-]+:\\s*[^;]+;\``
    },
    {
        title: 'Code & Identifiers',
        content: `## Code & Identifiers

**Variable name**
\`^[a-zA-Z_$][a-zA-Z0-9_$]*$\`

**Semantic version**
\`^v?(\\d+)\\.(\\d+)\\.(\\d+)(-[\\w.]+)?(\\+[\\w.]+)?$\`

**File extension**
\`\\.([a-zA-Z0-9]+)$\`

**Filepath (Unix)**
\`^(\\/[\\w.-]+)+\\/?$\`

**Import statement (JS)**
\`^import\\s+.*\\s+from\\s+['\"]([^'\"]+)['\"]\``
    },
    {
        title: 'Text Processing',
        content: `## Text Processing

**Trim whitespace**
\`^\\s+|\\s+$\`

**Multiple spaces → one**
\`\\s{2,}\` → replace with \` \`

**Empty lines**
\`^\\s*$\` (with multiline flag)

**Duplicate words**
\`\\b(\\w+)\\s+\\1\\b\`

**Markdown link**
\`\\[([^\\]]+)\\]\\(([^)]+)\\)\`

**Quoted string**
\`(['"])(.*?)\\1\``
    },
    {
        title: 'Syntax Reference',
        content: `## Syntax Reference

\`.\` Any char  \`\\d\` Digit  \`\\w\` Word char
\`\\s\` Whitespace  \`\\b\` Word boundary
\`^\` Start  \`$\` End
\`*\` 0+  \`+\` 1+  \`?\` 0 or 1
\`{n}\` Exactly n  \`{n,m}\` n to m
\`[abc]\` Char class  \`[^abc]\` Negated
\`(x)\` Capture  \`(?:x)\` Non-capture
\`(?=x)\` Lookahead  \`(?<=x)\` Lookbehind
\`(?!x)\` Neg lookahead  \`(?<!x)\` Neg lookbehind
\`x|y\` Alternation
**Flags:** \`g\` global \`i\` ignore case \`m\` multiline \`s\` dotall`
    }
];

const regexCols = 3;
const rw = 310, rh = 310, rgap = 16, rStartX = 20, rStartY = 20;

PluginRegistry.registerBoard({
    id: 'regex-patterns',
    name: 'Regex Patterns Library',
    description: 'Common regex patterns organized by category',
    icon: '🔍',
    version: '1.0.0',
    source: 'external',
    settings: {
        title: 'Regex Patterns Library',
        color: '#8e44ad'
    },
    tools: regexCards.map((card, i) => ({
        toolId: 'blank',
        instanceId: 'regex-card-' + i,
        title: card.title,
        customContent: card.content,
        position: {
            x: rStartX + (i % regexCols) * (rw + rgap),
            y: rStartY + Math.floor(i / regexCols) * (rh + rgap),
            z: 100 + i,
            width: rw,
            height: rh
        }
    }))
});

console.log('Regex Patterns Library board loaded');
