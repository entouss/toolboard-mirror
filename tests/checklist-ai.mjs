// ✨ in the Checklist, with Chrome's on-device model faked by its API shape. Break into
// steps turns a goal into items — JSON, cleaned, shown first — put in by Replace the list
// or Add to the list, which Undo takes back; What next? and Progress summary are read,
// to copy. An empty list can still be broken into steps.
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
await page.goto('http://localhost:8777/index.html#tool/checklist');
await page.waitForSelector('.checklist-widget', { state: 'attached', timeout: 20000 });
await page.waitForTimeout(800);
const id = await page.evaluate(() => document.querySelector('.checklist-widget').closest('.tool').dataset.tool);
const T = '.tool[data-tool="' + id + '"] ';
const list = () => page.evaluate((i) => JSON.parse(JSON.stringify(checklistGetData(i))), id);
const shown = () => page.evaluate((s) => Array.from(document.querySelectorAll(s)).map(li => li.textContent.replace(/\s+/g, ' ').trim()).length, T + '.checklist-items > .checklist-item-wrapper');
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

// 1. An empty list.
ok('the checklist has ✨ in its header', await page.isVisible(T + '.ai-btn'));
await open();
ok('empty, it offers Break into steps and Ask', JSON.stringify(await items()) === JSON.stringify(['custom:steps', 'ask']), JSON.stringify(await items()));
ok('and says there is nothing yet; only the steps work', /Nothing on the list yet/.test(await page.textContent(P + '.bai-scope')) &&
    await page.isEnabled(P + '.bai-item[data-ai="custom:steps"]') && !(await page.isEnabled(P + '.bai-item[data-ai="ask"]')));

// 2. Break into steps.
const STEPS = { steps: [
    { step: '1. Book movers', substeps: ['- [ ] Get three quotes', '', 'Pick one'] },
    { step: '   ', substeps: ['lost'] },
    { step: 'Pack the   kitchen', substeps: [] }
] };
await replies([JSON.stringify(STEPS)]);
await run('steps', 'move house in March');
let call = (await prompts())[0];
ok('the goal goes to the model, asking for JSON', /move house in March/.test(call.input) && JSON.stringify(call.schema).includes('"substeps"'));
ok('shown first, cleaned: numbering and boxes gone, no empty step', /Book movers/.test(await page.textContent(P + '.bai-out')) &&
    /Get three quotes/.test(await page.textContent(P + '.bai-out')) && !/lost/.test(await page.textContent(P + '.bai-out')));
ok('Replace the list or Add to the list', (await page.textContent(P + '.bai-replace')) === 'Replace the list' &&
    (await page.textContent(P + '.bai-insert')) === 'Add to the list');
ok('nothing changed yet', (await list()).length === 0);
await page.click(P + '.bai-replace');
await page.waitForTimeout(250);
const WANT = [{ text: 'Book movers', status: 'pending', children: [{ text: 'Get three quotes', status: 'pending' }, { text: 'Pick one', status: 'pending' }] },
    { text: 'Pack the kitchen', status: 'pending', children: [] }];
ok('Replace makes them the list, sub-steps under their step', JSON.stringify(await list()) === JSON.stringify(WANT), JSON.stringify(await list()));
ok('and the list shows them', await shown() === 2);
await page.evaluate(() => undoLast());
await page.waitForTimeout(300);
ok('Undo takes them out', (await list()).length === 0);

// 3. Added to a list that has things on it.
await page.evaluate((i) => { checklistSaveData(i, [{ text: 'Find a new place', status: 'completed', children: [] }, { text: 'Give notice', status: 'in_progress', children: [] }]); checklistOnRender(i); }, id);
await page.waitForTimeout(200);
await replies([JSON.stringify(STEPS)]);
await run('steps', 'move house in March');
call = (await prompts())[0];
ok('what is there already goes too, with how it stands, so it is not repeated', /Find a new place \(done\)/.test(call.input) && /Give notice \(in progress\)/.test(call.input));
await page.click(P + '.bai-insert');
await page.waitForTimeout(250);
ok('Add puts the steps after what is there, which keeps its state',
    JSON.stringify((await list()).map(i => i.text + ':' + i.status)) === JSON.stringify(['Find a new place:completed', 'Give notice:in_progress', 'Book movers:pending', 'Pack the kitchen:pending']),
    JSON.stringify(await list()));

// 4. Read, to copy.
await open();
ok('with items, it offers steps, What next?, a progress summary and Ask', JSON.stringify(await items()) ===
    JSON.stringify(['custom:steps', 'custom:next', 'custom:progress', 'ask']), JSON.stringify(await items()));
ok('and says how the list stands', /On this list \(6 items, 1 done\)/.test(await page.textContent(P + '.bai-scope')), await page.textContent(P + '.bai-scope'));
await replies(['- Book movers: dates fill up']);
await run('next');
call = (await prompts())[0];
ok('What next? sends the list, saying which are done', /not done, pick the three/.test(call.input) && /Book movers \(to do\)/.test(call.input) && /Get three quotes \(to do\)/.test(call.input));
ok('and can only be copied', await copyOnly());
await replies(['- 1 of 6 done']);
await run('progress');
ok('Progress summary asks for that, to copy', /Summarize how this list stands/.test((await prompts())[0].input) && await copyOnly());
await page.click(P + '.bai-copy');
ok('Copy copies it', (await page.evaluate(() => navigator.clipboard.readText())) === '- 1 of 6 done');

// 5. What cannot be used is not offered.
await replies(['not json']);
await run('steps', 'anything');
ok('what cannot be read is said, with nothing to put in', /could not be read/.test(await page.textContent(P + '.bai-status')) && !(await visible('.bai-foot')));
await replies([JSON.stringify({ steps: [{ step: '', substeps: ['x'] }] })]);
await run('steps', 'anything');
ok('nor are steps with no words', /No steps came back/.test(await page.textContent(P + '.bai-status')));
ok('the list is as it was', (await list()).length === 4);
ok('the model is told what it is for', await page.evaluate(() => window.__ai.calls.some(c => c.op === 'create' && c.system === CHECKLIST_AI_SYSTEM)));

ok('no page errors', errors.length === 0, JSON.stringify(errors).slice(0, 300));
console.log('  (all ' + count + ' assertions reached)');
await browser.close();
