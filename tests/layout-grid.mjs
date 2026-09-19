// The placement guides: a grid to line tools up on, and the outline of a sheet of
// paper to line them up inside. Both are board settings, so the board they were set
// on is the one that has them, and both are drawn behind the tools rather than
// between the pointer and them.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'out');
const ok = (l, p, d) => console.log((p ? '  PASS ' : '  FAIL ') + l + (d ? ' — ' + d : ''));

const SIZE = { w: 240, h: 160 };
const NOTES = [
    ['note-a', 100, 60], ['note-b', 400, 60], ['note-c', 700, 60],
    ['note-d', 100, 300], ['note-e', 400, 300]
];

// Five notes at known sizes, so what the grid does to them is arithmetic rather
// than whatever the board happened to lay out.
const seed = ({ notes, size }) => {
    localStorage.setItem('financeCurrentBoard', 'default');
    localStorage.setItem('finance_default_customTools', JSON.stringify(notes.map(n => n[0])));
    localStorage.setItem('finance_default_positions', JSON.stringify(
        Object.fromEntries(notes.map(([id, x, y], i) =>
            [id, { x, y, z: i + 1, width: size.w, height: size.h }]))));
    localStorage.setItem('finance_default_toolCustomizations', JSON.stringify(
        Object.fromEntries(notes.map(([id]) =>
            [id, { title: id, templateId: 'blank', customContent: id }]))));
};

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.addInitScript(seed, { notes: NOTES, size: SIZE });
await page.goto('http://localhost:8777/index.html');
await page.waitForSelector('.tool', { timeout: 20000 });
await page.waitForTimeout(600);

const guide = (id) => page.evaluate((gid) => {
    const el = document.getElementById(gid);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
        shown: cs.display !== 'none',
        width: el.offsetWidth,
        height: el.offsetHeight,
        cell: cs.backgroundSize.split(',')[0].trim(),
        zIndex: cs.zIndex,
        pointerEvents: cs.pointerEvents,
        inset: (el.querySelector('.board-page-guide-margin') || {}).style?.inset || '',
        label: (el.querySelector('.board-page-guide-label') || {}).textContent || ''
    };
}, id);

const at = (id) => page.evaluate((tid) => {
    const el = document.querySelector(`.tool[data-tool="${tid}"]`);
    return { x: el.offsetLeft, y: el.offsetTop, saved: positions[tid] };
}, id);

const setGrid = (patch) => page.evaluate((p) =>
    updateBoardSetting(currentBoardId, { grid: { ...boardGridSettings(getBoardSettings(currentBoardId)), ...p } }), patch);
const setPage = (patch) => page.evaluate((p) =>
    updateBoardSetting(currentBoardId, { pageGuide: { ...boardPageGuideSettings(getBoardSettings(currentBoardId)), ...p } }), patch);

// Drag a tool by the left of its header, where no button is.
async function dragTool(id, dx, dy, { shift = false } = {}) {
    const box = await page.locator(`.tool[data-tool="${id}"] .tool-header`).boundingBox();
    const sx = box.x + 12, sy = box.y + box.height / 2;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    if (shift) await page.keyboard.down('Shift');
    await page.mouse.move(sx + dx, sy + dy, { steps: 14 });
    await page.mouse.up();
    if (shift) await page.keyboard.up('Shift');
    await page.waitForTimeout(150);
}

ok('the board opens with all five notes', await page.evaluate(() => document.querySelectorAll('.tool').length) === 5);

// 1. A board that has never asked for a grid does not get one, and the overlay is
//    there waiting rather than being created on the first toggle.
let g = await guide('boardGridOverlay');
ok('a new board shows no grid', g && !g.shown, JSON.stringify(g));
ok('and no page outline', !(await guide('boardPageGuide')).shown);

// 2. Turning it on draws it, at the size asked for.
await setGrid({ on: true, size: 20 });
g = await guide('boardGridOverlay');
ok('turning the grid on draws it', g.shown);
ok('with cells the size it was set to', g.cell === '20px 20px', g.cell);
ok('behind the tools', g.zIndex === '0', g.zIndex);
ok('and out of the pointer’s way', g.pointerEvents === 'none', g.pointerEvents);

await setGrid({ size: 40 });
ok('the cell size follows the setting', (await guide('boardGridOverlay')).cell === '40px 40px');
ok('and the grid stays on while it changes', (await guide('boardGridOverlay')).shown);
await setGrid({ size: 20 });

// 3. A dragged tool lands on the grid, not where it was let go. The landing area is
//    clear of the other notes, so nothing but the grid can be doing this.
await dragTool('note-a', 37, 503);
let p = await at('note-a');
ok('a dragged tool lands on a grid line', p.x % 20 === 0 && p.y % 20 === 0, JSON.stringify(p));
ok('at the line nearest where it was dropped', p.x === 140 && p.y === 560, `${p.x},${p.y}`);
ok('and the landing is what gets saved', p.saved.x === p.x && p.saved.y === p.y, JSON.stringify(p.saved));
ok('without losing the size it had', p.saved.width === SIZE.w && p.saved.height === SIZE.h, JSON.stringify(p.saved));

// 4. Shift still means "exactly here", as it already did for edge snapping.
await dragTool('note-b', 13, 7, { shift: true });
p = await at('note-b');
ok('a Shift-drag lands where it was dropped', p.x === 413 && p.y === 67, `${p.x},${p.y}`);

// 5. Arranging reflows everything into rows and columns that line up.
const arranged = await page.evaluate(() => {
    const moved = arrangeToolsInGrid();
    return {
        moved,
        board: document.getElementById('toolboard').clientWidth,
        tools: [...document.querySelectorAll('.tool')].map(el => ({
            id: el.getAttribute('data-tool'), x: el.offsetLeft, y: el.offsetTop,
            w: el.offsetWidth, h: el.offsetHeight
        }))
    };
});
const GAP = 20;
const step = SIZE.w + GAP;
const xs = [...new Set(arranged.tools.map(t => t.x))].sort((a, b) => a - b);
ok('arranging places every tool', arranged.moved === 5, String(arranged.moved));
ok('in columns a gap apart, and a gap in from the edge',
    xs.every((x, i) => x === GAP + i * step), JSON.stringify(xs));
ok('all of them on grid lines', arranged.tools.every(t => t.x % 20 === 0 && t.y % 20 === 0),
    JSON.stringify(arranged.tools.map(t => [t.x, t.y])));
ok('with nothing pushed off the board', arranged.tools.every(t => t.x + t.w <= arranged.board),
    JSON.stringify(arranged.tools.map(t => t.x + t.w)));
ok('and the tools that share a row share a top',
    new Set(arranged.tools.filter(t => t.x < arranged.board - step).map(t => t.y)).size <= 2,
    JSON.stringify(arranged.tools.map(t => t.y)));
ok('nothing is resized to fit', arranged.tools.every(t => t.w === SIZE.w && t.h === SIZE.h));

// 6. Snapping in place keeps the arrangement and only straightens it.
const snapped = await page.evaluate(() => {
    const el = document.querySelector('.tool[data-tool="note-c"]');
    el.style.left = '37px'; el.style.top = '53px';
    positions['note-c'] = { ...positions['note-c'], x: 37, y: 53 };
    const moved = snapAllToolsToGrid();
    return { moved, c: { x: el.offsetLeft, y: el.offsetTop }, saved: positions['note-c'] };
});
ok('snapping all moves each tool to the nearest line', snapped.c.x === 40 && snapped.c.y === 60,
    JSON.stringify(snapped.c));
ok('and saves where they went', snapped.saved.x === 40 && snapped.saved.y === 60, JSON.stringify(snapped.saved));
ok('every tool on the board, and no more', snapped.moved === 5, String(snapped.moved));

// 7. With the grid off there is nothing to snap to, and the command says so.
await setGrid({ on: false });
ok('turning the grid off takes the lines away', !(await guide('boardGridOverlay')).shown);
ok('and snapping all does nothing', await page.evaluate(() => snapAllToolsToGrid()) === 0);
await setGrid({ on: true });

// 8. The page outline is a sheet of Letter paper, and turns.
await setPage({ on: true, orientation: 'portrait' });
let pg = await guide('boardPageGuide');
ok('the page outline appears when asked for', pg.shown);
ok('at 8.5 × 11 inches', pg.width === 816 && pg.height === 1056, `${pg.width}×${pg.height}`);
ok('with a half-inch margin marked inside it', pg.inset === '48px', pg.inset);
ok('and says which way up it is', /Portrait/.test(pg.label), pg.label);

await setPage({ orientation: 'landscape' });
pg = await guide('boardPageGuide');
ok('turning it landscape swaps the sides', pg.width === 1056 && pg.height === 816, `${pg.width}×${pg.height}`);
ok('and it is still the same sheet of paper', pg.width / pg.height === 1056 / 816);
ok('behind the tools too', pg.zIndex === '0' && pg.pointerEvents === 'none');

// 9. The board settings drawer shows what the board is actually set to.
const drawer = await page.evaluate(() => {
    renderBoardSettingsDrawer(currentBoardId);
    const d = document.getElementById('boardSettingsDrawer');
    return {
        grid: d.querySelector('.bs-grid').checked,
        size: d.querySelector('.bs-grid-size').value,
        page: d.querySelector('.bs-page').checked,
        orientation: [...d.querySelectorAll('.bs-page-orient.selected')].map(b => b.dataset.orientation)
    };
});
ok('the settings drawer shows the grid is on', drawer.grid === true && drawer.size === '20', JSON.stringify(drawer));
ok('and which way the page is turned', drawer.page === true && drawer.orientation.join() === 'landscape',
    JSON.stringify(drawer.orientation));

// 10. Both are board settings, so they survive the tab being closed.
await page.reload();
await page.waitForSelector('.tool', { timeout: 20000 });
await page.waitForTimeout(600);
ok('the grid is still there after a reload', (await guide('boardGridOverlay')).shown);
ok('so is the page outline, still landscape', (await guide('boardPageGuide')).width === 1056);
ok('and only one of each was ever drawn',
    await page.evaluate(() => document.querySelectorAll('.board-guide').length) === 2,
    String(await page.evaluate(() => document.querySelectorAll('.board-guide').length)));

ok('no page errors', errors.length === 0, JSON.stringify(errors).slice(0, 300));
await page.screenshot({ path: OUT + '/layout-grid.png' });
await browser.close();
