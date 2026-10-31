// ✨ in the Kanban Board, with Chrome's on-device model faked by its API shape. Draft
// cards turns a goal into cards — JSON, cleaned, shown first — added to the board's first
// column, whatever it is called, which Undo takes back; nothing replaces the board.
// Status update and What's stuck are read, to copy.
import { chromium } from 'playwright';
let count = 0;
const ok = (l, p, d) => { count++; console.log((p ? '  PASS ' : '  FAIL ') + l + (d ? ' — ' + d : '')); };

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1300, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
await context.addInitScript(() => {
    // BoardAI is off until a person turns it on; these tests are about it on.
    if (localStorage.getItem('toolboard_onDeviceAI') == null) localStorage.setItem('toolboard_onDeviceAI', 'on');
    const ai = window.__ai = { calls: [], replies: [], reply: () => 'Fine.' };
    window.LanguageModel = {
        availability: async () => 'available',
        create: async (opts) => {
            ai.calls.push({ op: 'create', system: opts.initialPrompts && opts.initialPrompts[0] && opts.initialPrompts[0].content });
            return {
                promptStreaming: (input, o) => {
                    ai.calls.push({ op: 'prompt', input, schema: o && o.responseConstraint });
                    const text = ai.replies.length ? ai.replies.shift() : ai.reply(input);
                    return (async function* () { yield text; })();
                },
                destroy: () => {}
            };
        }
    };
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:8777/index.html#tool/kanban-board');
await page.waitForSelector('.kb-widget .kb-column', { timeout: 20000 });
await page.waitForTimeout(800);
const id = await page.evaluate(() => document.querySelector('.kb-widget').closest('.tool').dataset.tool);
const T = '.tool[data-tool="' + id + '"] ';
const board = () => page.evaluate((i) => JSON.parse(JSON.stringify(kbGetData(i))), id);
const cardsShown = (col) => page.evaluate(([s, c]) => Array.from(document.querySelectorAll(s + ' .kb-column[data-col="' + c + '"] .kb-card-title')).map(e => e.textContent), [T, col]);
const P = '#boardAIPopup ';
const items = () => page.evaluate(() => Array.from(document.querySelectorAll('#boardAIPopup .bai-item')).map(b => b.dataset.ai));
const prompts = () => page.evaluate(() => window.__ai.calls.filter(c => c.op === 'prompt'));
const replies = (list) => page.evaluate((l) => { window.__ai.replies = l; window.__ai.calls = window.__ai.calls.filter(c => c.op === 'create'); }, list);
const open = async () => {
    if (!(await page.isVisible('#boardAIPopup'))) { await page.hover(T + '.tool-header'); await page.click(T + '.ai-btn'); }
    else if (await page.isVisible(P + '.bai-work')) await page.click(P + '.bai-back');
    await page.waitForTimeout(150);
};
const done = () => page.waitForFunction(() => !document.querySelector('#boardAIPopup .bai-foot').hidden ||
    document.querySelector('#boardAIPopup .bai-status').classList.contains('bai-error'), null, { timeout: 10000 });
const run = async (action, line) => {
    await open();
    await page.click(P + '.bai-item[data-ai="custom:' + action + '"]');
    if (line != null) { await page.fill(P + '.bai-q', line); await page.click(P + '.bai-ask .bai-btn'); }
    await done();
};
const visible = (s) => page.isVisible(P + s);
const copyOnly = async () => !(await visible('.bai-replace')) && !(await visible('.bai-insert')) && await visible('.bai-copy');

// 1. An empty board.
ok('the board has ✨ in its header', await page.isVisible(T + '.ai-btn'));
await open();
ok('empty, it offers Draft cards and Ask', JSON.stringify(await items()) === JSON.stringify(['custom:cards', 'ask']), JSON.stringify(await items()));
ok('and says there are no cards yet; only drafting works', /No cards yet/.test(await page.textContent(P + '.bai-scope')) &&
    await page.isEnabled(P + '.bai-item[data-ai="custom:cards"]') && !(await page.isEnabled(P + '.bai-item[data-ai="ask"]')));

// 2. Draft cards.
const CARDS = { cards: [
    { title: 'Write the  help page', description: 'Cover sign-in and billing.', tags: ['#writing', 'writing', 'docs', 'web', 'extra'] },
    { title: '', description: 'No title, so not a card', tags: [] },
    { title: 'Review it with support', description: '', tags: [] }
] };
await replies([JSON.stringify(CARDS)]);
await run('cards', 'launch the new help page');
let call = (await prompts())[0];
ok('the goal goes to the model, asking for JSON', /launch the new help page/.test(call.input) && JSON.stringify(call.schema).includes('"tags"'));
const out = await page.textContent(P + '.bai-out');
ok('shown first, cleaned: no card without a title', /Write the help page/.test(out) && /Review it with support/.test(out) && !/No title/.test(out), out);
ok('one way in, named for the first column: no Replace', (await page.textContent(P + '.bai-insert')) === 'Add to “To Do”' && !(await visible('.bai-replace')));
ok('nothing changed yet', (await board())[0].cards.length === 0);
await page.click(P + '.bai-insert');
await page.waitForTimeout(250);
ok('Add puts them in the first column, tags tidied — no #, no repeats, three at most',
    JSON.stringify((await board())[0].cards) === JSON.stringify([
        { title: 'Write the help page', desc: 'Cover sign-in and billing.', tags: ['writing', 'docs', 'web'] },
        { title: 'Review it with support' }]), JSON.stringify((await board())[0].cards));
ok('and the board shows them', JSON.stringify(await cardsShown(0)) === JSON.stringify(['Write the help page', 'Review it with support']));
ok('the other columns are untouched', (await board())[1].cards.length === 0 && (await board())[2].cards.length === 0);
await page.evaluate(() => undoLast());
await page.waitForTimeout(300);
ok('Undo takes them out', (await board())[0].cards.length === 0);

// 3. A board of one's own: the first column renamed, cards in progress.
await page.evaluate((i) => {
    kbSaveData(i, [{ title: 'Backlog', cards: [{ title: 'Pick a theme' }] }, { title: 'Doing', cards: [{ title: 'Draft the FAQ', desc: 'Half done', tags: ['writing'] }] },
        { title: 'Shipped', cards: [{ title: 'Set up the site' }] }]);
    kbRender(document.querySelector('.tool[data-tool="' + i + '"] .kb-widget'), i);
}, id);
await page.waitForTimeout(200);
await replies([JSON.stringify(CARDS)]);
await run('cards', 'launch the new help page');
call = (await prompts())[0];
ok('what is on the board goes too, so it is not repeated', /## Doing \(1 card\)\n- Draft the FAQ — Half done \[writing\]/.test(call.input), call.input.slice(-200));
ok('and the button names the first column as it is now called', (await page.textContent(P + '.bai-insert')) === 'Add to “Backlog”');
await page.click(P + '.bai-insert');
await page.waitForTimeout(250);
ok('the cards go after what is there, in that column', JSON.stringify(await cardsShown(0)) === JSON.stringify(['Pick a theme', 'Write the help page', 'Review it with support']));
ok('and nothing moves anywhere else', JSON.stringify(await cardsShown(1)) === JSON.stringify(['Draft the FAQ']) && JSON.stringify(await cardsShown(2)) === JSON.stringify(['Set up the site']));
ok('a draft is only ever added: asked to replace, the board refuses', await page.evaluate((i) =>
    kbAIApply(i, 'x', 'replace', {}, { action: 'cards', data: [{ title: 'X' }] }), id) === false && (await board())[0].cards.length === 3);

// 4. Read, to copy.
await open();
ok('with cards, it offers drafting, a status update, what is stuck and Ask', JSON.stringify(await items()) ===
    JSON.stringify(['custom:cards', 'custom:status', 'custom:stuck', 'ask']), JSON.stringify(await items()));
ok('and says what it works on', /On this board \(5 cards in 3 columns\)/.test(await page.textContent(P + '.bai-scope')), await page.textContent(P + '.bai-scope'));
await replies(['## Done\n\n- Set up the site']);
await run('status');
call = (await prompts())[0];
ok('Status update sends the board, column by column', /"Done", "Doing" and "Next"/.test(call.input) && /## Shipped \(1 card\)\n- Set up the site/.test(call.input));
ok('and can only be copied', await copyOnly());
await page.click(P + '.bai-copy');
ok('Copy copies it', (await page.evaluate(() => navigator.clipboard.readText())).startsWith('## Done'));
await replies(['- Pick a theme: no description']);
await run('stuck');
ok('What’s stuck asks for that, to copy', /may be stuck or unclear/.test((await prompts())[0].input) && await copyOnly());

// 5. What cannot be used is not offered.
await replies(['{ "cards": [ { "title": "" } ] }']);
await run('cards', 'anything');
ok('cards with no title are not offered', /No cards came back/.test(await page.textContent(P + '.bai-status')) && !(await visible('.bai-foot')));
await replies(['oops']);
await run('cards', 'anything');
ok('nor is what cannot be read', /could not be read/.test(await page.textContent(P + '.bai-status')));
ok('the model is told what it is for', await page.evaluate(() => window.__ai.calls.some(c => c.op === 'create' && c.system === KB_AI_SYSTEM)));

ok('no page errors', errors.length === 0, JSON.stringify(errors).slice(0, 300));
console.log('  (all ' + count + ' assertions reached)');
await browser.close();
