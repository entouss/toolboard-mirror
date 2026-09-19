// Board settings as a popup of its own. It used to be a drawer squeezed between the
// current board and the list, a few lines tall and as narrow as the list; now it
// opens over the list, says which board it is editing, and hands the list back when
// it closes.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'out');
const ok = (l, p, d) => console.log((p ? '  PASS ' : '  FAIL ') + l + (d ? ' — ' + d : ''));

const seed = () => {
    if (localStorage.getItem('seeded')) return;
    localStorage.setItem('seeded', '1');
    localStorage.setItem('financeBoards', JSON.stringify([
        { id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }, { id: 'c', name: 'Gamma' }
    ]));
    localStorage.setItem('financeCurrentBoard', 'a');
};

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 820 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.addInitScript(seed);
await page.goto('http://localhost:8777/index.html');
await page.waitForTimeout(700);

const open = (sel) => page.evaluate((s) => document.querySelector(s).classList.contains('open'), sel);
const title = () => page.evaluate(() => document.getElementById('boardSettingsTitle').textContent);
const gearFor = (name) => page.evaluate((n) => {
    const card = [...document.querySelectorAll('.board-card')]
        .find(c => c.querySelector('.board-card-name').textContent === n);
    card.querySelector('.board-card-settings-btn').click();
}, name);

await page.click('#boardSelectorTrigger');
await page.waitForTimeout(400);
ok('the board list opens', await open('#boardManagerOverlay'));
ok('with no settings showing yet', !(await open('#boardSettingsOverlay')));

// 1. It is a popup, not a strip inside the list.
const placed = await page.evaluate(() => {
    const drawer = document.getElementById('boardSettingsDrawer');
    return {
        inList: !!drawer.closest('.board-manager-content'),
        inPopup: !!drawer.closest('.board-settings-content'),
        overlayParent: document.getElementById('boardSettingsOverlay').parentElement.tagName
    };
});
ok('the settings live in their own popup', placed.inPopup && !placed.inList, JSON.stringify(placed));
ok('which is a sibling of the board list, not inside it', placed.overlayParent === 'BODY', placed.overlayParent);

// 2. Opening it from the current board's gear.
await page.click('#boardManagerCurrent .board-card-settings-btn');
await page.waitForTimeout(400);
ok('the gear opens the settings popup', await open('#boardSettingsOverlay'));
ok('and it says which board it is editing', (await title()).startsWith('Alpha'), await title());
ok('the board list stays open behind it', await open('#boardManagerOverlay'));

const size = await page.evaluate(() => {
    const c = document.querySelector('.board-settings-content');
    const d = document.getElementById('boardSettingsDrawer');
    return { w: c.offsetWidth, h: c.offsetHeight, scrolls: d.scrollHeight > d.clientHeight + 1 };
});
ok('with room for the whole form', size.w >= 460 && size.h >= 380, JSON.stringify(size));
ok('and no scrolling to reach the bottom of it', !size.scrolls, JSON.stringify(size));
ok('every section is there', await page.evaluate(() => {
    const d = document.getElementById('boardSettingsDrawer');
    return ['.bs-name', '.bs-colors', '.bs-favicon', '.bs-move-up', '.bs-font', '.bs-font-size',
        '.bs-grid', '.bs-page'].every(s => !!d.querySelector(s));
}));

// 3. Renaming the board renames the heading over it.
await page.fill('.bs-name', 'Alpha Renamed');
await page.waitForTimeout(300);
ok('renaming the board retitles the popup', (await title()).startsWith('Alpha Renamed'), await title());
await page.fill('.bs-name', 'Alpha');
await page.waitForTimeout(300);

// 4. Escape closes the popup and leaves the list it came from.
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
ok('Escape closes the settings', !(await open('#boardSettingsOverlay')));
ok('and leaves the board list open', await open('#boardManagerOverlay'));

// 5. Any board can be edited, not just the open one.
await gearFor('Gamma');
await page.waitForTimeout(400);
ok('a board you are not on opens its own settings', (await title()).startsWith('Gamma'), await title());
ok('showing that board’s name in the field',
    await page.evaluate(() => document.querySelector('.bs-name').value) === 'Gamma');

// 6. The backdrop closes it, and the × closes it.
await page.evaluate(() => {
    const o = document.getElementById('boardSettingsOverlay');
    o.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(300);
ok('clicking beside the popup closes it', !(await open('#boardSettingsOverlay')));

await page.click('#boardManagerCurrent .board-card-settings-btn');
await page.waitForTimeout(300);
await page.click('.board-settings-close');
await page.waitForTimeout(300);
ok('so does the close button', !(await open('#boardSettingsOverlay')));
ok('with the board list still there', await open('#boardManagerOverlay'));

// 7. Closing the list closes the settings with it, rather than leaving a popup
//    over a board with nothing behind it.
await page.click('#boardManagerCurrent .board-card-settings-btn');
await page.waitForTimeout(300);
await page.keyboard.press('Escape');
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
ok('a second Escape closes the list too',
    !(await open('#boardManagerOverlay')) && !(await open('#boardSettingsOverlay')));

await page.click('#boardSelectorTrigger');
await page.waitForTimeout(400);
ok('and reopening the list does not bring the settings back', !(await open('#boardSettingsOverlay')));

ok('no page errors', errors.length === 0, JSON.stringify(errors).slice(0, 300));
await page.screenshot({ path: OUT + '/board-settings.png' });
await browser.close();
