// The Text Diff. Where CodeMirror's merge view loads (plugins/lib/codemirror-merge.js),
// the difference is edited in place: both texts typed in side by side, or the modified
// one inline, each change marked to the character, an arrow or button putting the
// original back, everything kept as it is typed. Lines that look the same but are not
// (no-break spaces, zero-width characters, trailing spaces, accents written two ways)
// have their invisible characters drawn, are counted, and are made plain by Tidy, which
// Undo puts back.
//
// Where it does not load, the difference is still shown, to read: a changed line beside
// what it became, only what changed in it marked — one character typed is one marked.
// Part 1 is that, with the library blocked; part 2 is the editors.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'out');
let count = 0;
const ok = (l, p, d) => { count++; console.log((p ? '  PASS ' : '  FAIL ') + l + (d ? ' — ' + d : '')); };
// Written by code point, so this file shows what it tests.
const ch = (n) => String.fromCharCode(n);
const NBSP = ch(0xA0), ZWSP = ch(0x200B), ACUTE = ch(0x301), E_ACUTE = ch(0xE9), DOT = ch(0xB7);

const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
const watch = (page) => {
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/codemirror-merge\.js|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
};
const openTool = async (page) => {
    await page.goto('http://localhost:8777/index.html#tool/diff-viewer');
    await page.waitForSelector('.diff-widget', { state: 'attached', timeout: 20000 });
    await page.waitForTimeout(800);
    return page.evaluate(() => document.querySelector('.diff-widget').closest('.tool').dataset.tool);
};
const setter = (page, id) => (original, modified, view) => page.evaluate(([i, o, m, v]) => {
    const data = diffGetData(i);
    Object.assign(data, { original: o, modified: m, viewType: v || 'split' });
    diffSaveData(i, data);
    const widget = document.querySelector('.tool[data-tool="' + i + '"] .diff-widget');
    const boxes = widget.querySelectorAll('.diff-edit-pane textarea');
    boxes[0].value = o; boxes[1].value = m;
    diffRenderOutput(widget, i);
    diffUpdateStats(widget, i);
}, [id, original, modified, view]);

// ==== Part 1: without CodeMirror, the difference to read ====
const blocked = await browser.newContext({ viewport: { width: 1300, height: 900 } });
await blocked.route('**/plugins/lib/codemirror-merge.js', (route) => route.abort());
let page = await blocked.newPage();
watch(page);
let id = await openTool(page);
let T = '.tool[data-tool="' + id + '"] ';
let set = setter(page, id);
const marked = (kind) => page.evaluate(([s, k]) => Array.from(document.querySelectorAll(s + ' .diff-line.' + k + ' .diff-word')).map(e => e.textContent), [T, kind]);
const stats = () => page.textContent(T + '.diff-stats');
const rows = () => page.evaluate((s) => {
    const cells = Array.from(document.querySelectorAll(s + ' .diff-split-view > .diff-line'));
    const out = [];
    for (let k = 0; k < cells.length; k += 2) out.push([cells[k].className.replace('diff-line ', ''), cells[k + 1].className.replace('diff-line ', ''),
        Math.round(cells[k].getBoundingClientRect().top) === Math.round(cells[k + 1].getBoundingClientRect().top)]);
    return out;
}, T);
const TEXT = 'The quick brown fox\njumps over the lazy dog\nand runs away.';
await set(TEXT, TEXT);
await page.waitForTimeout(300);
ok('without the library, it says why, and shows the difference to read', /Editing in place needs/.test(await page.textContent(T + '.diff-output')) &&
    !(await page.$(T + '.cm-editor')));
ok('with the two boxes to write in, above it', await page.isVisible(T + '.diff-edit-container textarea'));
let right = T + '.diff-edit-pane:nth-child(2) textarea';
await page.evaluate((s) => { const t = document.querySelector(s); t.focus(); t.setSelectionRange(9, 9); }, right);
await page.keyboard.type('X');
await page.waitForTimeout(400);
ok('one character typed: only that character is marked', JSON.stringify(await marked('addition')) === '["X"]', JSON.stringify(await marked('addition')));
ok('and nothing in the old line, which lost nothing', JSON.stringify(await marked('deletion')) === '[]');
let r = await rows();
ok('the old line sits beside the new one, on the same row', r.length === 3 && r[0][0] === 'deletion' && r[0][1] === 'addition' && r[0][2] && r[1][0] === 'unchanged', JSON.stringify(r));
await set(TEXT + '\nA line that goes.', 'The slow brown fox\njumps over the lazy dog\nand runs away.\nSomething else entirely, nothing alike.');
ok('a word changed: that word is marked on each side', JSON.stringify(await marked('deletion')) === '["quick"]' && JSON.stringify(await marked('addition')) === '["slow"]');
r = await rows();
ok('a line replaced by one nothing like it is not paired', r.some(x => x[0] === 'deletion' && x[1] === 'empty') && r.some(x => x[0] === 'empty' && x[1] === 'addition'), JSON.stringify(r));
const LONG = 'word '.repeat(80).trim();
await set('a\n' + LONG + '\nb', 'a\n' + LONG + ' and a few more words at the end of it, enough to wrap onto another line\nb');
r = await rows();
ok('a long changed line and its partner start on the same row, and so does the line after', r[1][2] && r[2][2] && r[2][0] === 'unchanged', JSON.stringify(r));
const NB = 'Line one of it\nLine two of it\nLine three';
const NBM = NB.replace('one of', 'one' + NBSP + 'of').replace('two of', 'two' + NBSP + 'of');
await set(NB, NBM);
ok('lines that differ only by a no-break space are told apart from real changes', await page.evaluate((s) => document.querySelectorAll(s + ' .diff-line.invisible').length, T) === 4);
ok('the invisible character drawn where it is, named', await page.evaluate(([s, dot]) => {
    const m = document.querySelector(s + ' .diff-line.addition.invisible .diff-invis-char');
    return !!m && m.textContent === dot && m.title === 'no-break space';
}, [T, DOT]));
ok('the summary counts them and says why', /2 lines look the same but differ in non-breaking spaces/.test(await stats()), await stats());
ok('Tidy is offered', await page.isEnabled(T + '.diff-tidy-btn'));
// Edits within moments of each other are one step to Undo; a person pauses before Tidy.
await page.waitForTimeout(700);
await page.evaluate((s) => diffTidyInvisible(document.querySelector(s)), T + '.diff-tidy-btn');
await page.waitForTimeout(200);
ok('Tidy makes them the same, and they are gone', /\+0 additions/.test(await stats()) && !(await page.isVisible(T + '.diff-stats-invisible')) &&
    await page.evaluate((i) => diffGetData(i).modified, id) === NB);
ok('and has nothing more to do', !(await page.isEnabled(T + '.diff-tidy-btn')));
await page.evaluate(() => undoLast());
await page.waitForTimeout(300);
ok('Undo puts them back', await page.evaluate((i) => diffGetData(i).modified, id) === NBM);
await set('one <b>bold</b> word\nsame', 'one <b>bolder</b> word\nsame', 'unified');
const uni = await page.evaluate((s) => Array.from(document.querySelectorAll(s + ' .diff-unified-view .diff-line')).map(l => l.className.replace('diff-line ', '') + ':' + l.querySelector('.diff-prefix').textContent), T);
ok('Inline puts a changed line’s old and new versions one after the other', JSON.stringify(uni) === JSON.stringify(['deletion:-', 'addition:+', 'unchanged: ']), JSON.stringify(uni));
ok('only what changed marked, and markup shown as text, never made', JSON.stringify(await marked('addition')) === '["er"]' &&
    await page.evaluate((s) => !document.querySelector(s + ' .diff-output b'), T));
const kinds = await page.evaluate(([nb, zw, e1, ac]) => [diffInvisibleKinds('a b', 'a' + nb + 'b'), diffInvisibleKinds('ab', 'a' + zw + 'b'),
    diffInvisibleKinds('caf' + e1, 'cafe' + ac), diffInvisibleKinds('x', 'x  '), diffInvisibleKinds('\tx', '    x'), diffInvisibleKinds('x\r', 'x'),
    diffInvisibleKinds('a b', 'a c')], [NBSP, ZWSP, E_ACUTE, ACUTE]);
ok('each kind of invisible difference is named, and a real change is not one', JSON.stringify(kinds) === JSON.stringify([['non-breaking spaces'], ['zero-width characters'],
    ['accents written two ways'], ['trailing spaces'], ['tabs or spacing'], ['line endings'], null]), JSON.stringify(kinds));
ok('Tidy makes every kind plain but tabs, which are a choice, and leaves a real change alone', await page.evaluate(([nb, zw, e1, ac]) =>
    ['a' + nb + 'b', 'a' + zw + 'b', 'cafe' + ac, 'x  ', 'x\r', '\tx', 'a c'].map(diffTidy).join('|') === ['a b', 'ab', 'caf' + e1, 'x', 'x', '\tx', 'a c'].join('|'),
    [NBSP, ZWSP, E_ACUTE, ACUTE]));
ok('a character typed into a word marks that character; one outside the basic plane is not split', await page.evaluate(() =>
    JSON.stringify(diffSegments('colour', 'colours').b) === JSON.stringify([{ text: 'colour', changed: false }, { text: 's', changed: true }]) &&
    diffSegments('a \u{1F600} b', 'a \u{1F603} b').b.some(x => x.changed && x.text === '\u{1F603}')));
await blocked.close();

// ==== Part 2: the difference, edited in place ====
const context = await browser.newContext({ viewport: { width: 1300, height: 900 } });
const offsite = [];
page = await context.newPage();
watch(page);
page.on('request', (q) => { if (/codemirror/i.test(q.url()) && !/^http:\/\/localhost:8777\//.test(q.url())) offsite.push(q.url()); });
id = await openTool(page);
T = '.tool[data-tool="' + id + '"] ';
set = setter(page, id);
right = T + '.diff-edit-pane:nth-child(2) textarea';
const merge = (fn, arg) => page.evaluate(([i, f, a]) => (new Function('w', 'a', f))(document.querySelector('.tool[data-tool="' + i + '"] .diff-widget'), a), [id, fn, arg]);
const saved = () => page.evaluate((i) => { const d = diffGetData(i); return [d.original, d.modified]; }, id);
const changed = (side) => page.evaluate(([s, k]) => Array.from(document.querySelectorAll(s + ' .cm-merge-' + k + ' .cm-changedText')).map(e => e.textContent), [T, side]);
const match = () => page.evaluate((s) => { const m = document.querySelector(s + ' .diff-match'); return m.className.replace('diff-match', '').trim() + ':' + m.textContent; }, T);
await set('', '');
await page.waitForSelector(T + '.cm-mergeView', { timeout: 15000 });
ok('empty, each side says what goes in it', JSON.stringify(await page.evaluate((s) => Array.from(document.querySelectorAll(s + ' .cm-placeholder')).map(e => e.textContent), T)) ===
    JSON.stringify(['Paste or type the original', 'Paste or type the modified text']));
ok('and nothing is said about matching', (await match()) === ':');
await set(TEXT, TEXT);
await page.waitForTimeout(200);
ok('the same to the character: said, where it is always seen', (await match()).startsWith('same:') && /Identical/.test(await match()) &&
    await page.isVisible(T + '.diff-match'), await match());
ok('the difference is two editors side by side', await page.evaluate((s) => document.querySelectorAll(s + ' .cm-mergeView .cm-editor').length, T) === 2 &&
    /\.\/|plugins\/lib\/codemirror-merge\.js/.test(await page.evaluate(() => DIFF_CM_URL)));
ok('CodeMirror comes from the board’s own host', offsite.length === 0, JSON.stringify(offsite));
await merge('w._merge.view.b.focus(); w._merge.view.b.dispatch({ selection: { anchor: 9 } });');
await page.keyboard.type('X');
await page.waitForTimeout(500);
ok('typing on the right: the character typed is marked, in place', JSON.stringify(await changed('b')) === '["X"]', JSON.stringify(await changed('b')));
ok('and they are no longer identical: one change', (await match()) === 'differ:1 change', await match());
ok('and kept with the tool as it is typed', JSON.stringify(await saved()) === JSON.stringify([TEXT, TEXT.replace('The quick', 'The quickX')]));
ok('the box behind it says the same', await page.evaluate((s) => document.querySelector(s).value, right) === TEXT.replace('The quick', 'The quickX'));
await merge('const v = w._merge.view.a; v.focus(); v.dispatch({ selection: { anchor: v.state.doc.length } });');
await page.keyboard.type('!');
await page.waitForTimeout(500);
ok('the left can be typed in too', (await saved())[0] === TEXT + '!');
await page.hover(T + '.cm-merge-revert button');
await page.click(T + '.cm-merge-revert button');
await page.waitForTimeout(500);
ok('an arrow puts the original back on the right', (await saved())[1].startsWith('The quick brown fox\n'), JSON.stringify(await saved()));
await set(TEXT, 'The slow brown fox\n' + TEXT.split('\n').slice(1).join('\n'));
await page.waitForTimeout(300);
ok('a change made outside — the boxes, Undo — shows in the editors', JSON.stringify(await changed('a')) === '["quick"]' && JSON.stringify(await changed('b')) === '["slow"]',
    JSON.stringify([await changed('a'), await changed('b')]));
ok('the same editors, kept, not made again', await merge('return !!w._merge && w._merge.dom.isConnected && document.querySelectorAll(".cm-mergeView").length === 1;'));
ok('no Edit, Both or View: the difference is where both texts are written', !(await page.$(T + '.authoring-mode-btn')) &&
    !(await page.isVisible(T + '.diff-edit-container')) && !(await page.evaluate((s) => document.querySelector(s).classList.contains('authoring'), T.trim())));

// Inline.
await page.evaluate((s) => document.querySelector(s).click(), T + '.diff-view-btn[data-view="unified"]');
await page.waitForSelector(T + '.cm-deletedChunk', { timeout: 10000 });
ok('Inline: one editor, the modified text, with the original shown where it changed', await page.evaluate((s) => document.querySelectorAll(s + ' .diff-output .cm-editor').length, T) === 1 &&
    /quick/.test(await page.textContent(T + '.cm-deletedChunk')));
await merge('const v = w._merge.view; v.focus(); v.dispatch({ selection: { anchor: v.state.doc.length } });');
await page.keyboard.type('?');
await page.waitForTimeout(500);
ok('typed in, and kept', (await saved())[1].endsWith('away.?'), JSON.stringify(await saved()));
const reject = await page.$(T + '.cm-deletedChunk button[name="reject"]');
ok('each change has a button to put the original back', !!reject);
await reject.click();
await page.waitForTimeout(500);
ok('which does', (await saved())[1].startsWith('The quick brown fox'), JSON.stringify(await saved()));
await page.evaluate((s) => document.querySelector(s).click(), T + '.diff-view-btn[data-view="split"]');
await page.waitForSelector(T + '.cm-mergeView', { timeout: 10000 });

// What cannot be seen.
await set(NB + '\nend  ', NBM + '\nend');
await page.waitForTimeout(400);
ok('a no-break space is drawn in the editor, named', await page.evaluate(([s, dot]) => {
    const m = document.querySelector(s + ' .cm-merge-b .cm-diff-invis');
    return !!m && m.textContent === dot && m.title === 'no-break space';
}, [T, DOT]));
ok('trailing spaces are shaded', await page.evaluate((s) => !!document.querySelector(s + ' .cm-merge-a .cm-diff-trailing'), T));
ok('only invisible characters differ: they look the same, and it says so', (await match()).startsWith('looks-same:') && /Look the same/.test(await match()), await match());
ok('the summary counts the lines that only look the same', /3 lines look the same but differ in non-breaking spaces, trailing spaces/.test(await page.textContent(T + '.diff-stats')),
    await page.textContent(T + '.diff-stats'));
await page.waitForTimeout(700);
await page.hover(T + '.diff-actions');
await page.click(T + '.diff-tidy-btn');
await page.waitForTimeout(400);
ok('Tidied, they are identical', (await match()).startsWith('same:'), await match());
ok('Tidy makes both texts plain, in the editors too', JSON.stringify(await saved()) === JSON.stringify([NB + '\nend', NB + '\nend']) &&
    await page.evaluate((s) => document.querySelectorAll(s + ' .cm-changedText, ' + s + ' .cm-diff-invis').length, T) === 0);
await page.evaluate(() => undoLast());
await page.waitForTimeout(500);
ok('Undo puts them back, editors and all', JSON.stringify(await saved()) === JSON.stringify([NB + '\nend  ', NBM + '\nend']) &&
    await page.evaluate((s) => !!document.querySelector(s + ' .cm-diff-invis'), T));
ok('and Tidy is offered again', await page.isEnabled(T + '.diff-tidy-btn'));
await page.evaluate(() => document.body.classList.add('dark-mode'));
await page.waitForTimeout(150);
await page.screenshot({ path: OUT + '/diff-viewer-dark.png' });
await page.evaluate(() => document.body.classList.remove('dark-mode'));
await page.screenshot({ path: OUT + '/diff-viewer.png' });

ok('no page errors', errors.length === 0, JSON.stringify(errors).slice(0, 300));
console.log('  (all ' + count + ' assertions reached)');
await browser.close();
