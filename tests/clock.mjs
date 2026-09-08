// The analog clock's two challenges, and the day dial under the face. An analog
// face cannot say where in the day it is, so an arc does: the sun rises on the left,
// stands highest at noon and sets on the right, and the moon crosses the same arc
// through the night. It reads the same in every mode, and tapping it is the only way
// to change the half of the day.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'out');
const ok = (l, p, d) => console.log((p ? '  PASS ' : '  FAIL ') + l + (d ? ' — ' + d : ''));

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto('http://localhost:8777/index.html#tool/analog-clock');
await page.waitForSelector('.clock-widget', { timeout: 20000 });
await page.waitForTimeout(1500);
ok('the clock opens', await page.evaluate(() => !!document.querySelector('.clock-widget')),
    JSON.stringify(errors).slice(0, 120));

const digital = () => page.evaluate(() => document.getElementById('clockDigital').textContent.trim());
const token = () => page.evaluate(() => document.getElementById('clockDayToken').textContent.trim());
const tokenX = () => page.evaluate(() => parseFloat(document.getElementById('clockDayToken').getAttribute('x')));
const dayLabel = () => page.evaluate(() => document.getElementById('clockDay').getAttribute('aria-label'));
const feedback = () => page.evaluate(() => document.getElementById('clockFeedback').textContent.trim());

const at = (h, m, ampm) => page.evaluate(({ h, m, ampm }) => {
    clockState.challengeMode = null;
    clockState.hour = h; clockState.minute = m; clockState.ampm = ampm;
    clockRender();
}, { h, m, ampm });

// A challenge of our choosing, so nothing here rides on the dice.
const challenge = (mode, h, m, ampm) => page.evaluate(({ mode, h, m, ampm }) => {
    document.getElementById('clockChallengeMode').value = mode;
    clockNewChallenge();
    clockState.targetHour = h; clockState.targetMinute = m; clockState.targetAmpm = ampm;
    if (mode === 'read') { clockState.hour = h; clockState.minute = m; clockState.ampm = ampm; }
    // clockNewChallenge picked its own time; say the one actually being graded.
    if (mode === 'set') {
        document.getElementById('clockTarget').textContent =
            'Set the clock to ' + h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
    }
    clockRender();
}, { mode, h, m, ampm });

// 1. Noon and midnight are the two the meridiem gets backwards: both are twelve
//    o'clock, one is the middle of the day and the other the middle of the night.
await at(12, 0, 'PM');
ok('noon is a sun', await token() === '☀️', await token() + ' at 12:00 PM');
ok('at the top of the arc', Math.abs(await tokenX() - 100) < 1, String(await tokenX()));
await at(12, 0, 'AM');
ok('midnight is a moon', await token() === '🌙', await token() + ' at 12:00 AM');
ok('also at the top of the arc', Math.abs(await tokenX() - 100) < 1, String(await tokenX()));

// 2. The token rides the arc rather than flipping between two states.
await at(7, 0, 'AM');
const morning = await tokenX();
await at(5, 0, 'PM');
const evening = await tokenX();
ok('the sun rises on the left and sets on the right', morning < 95 && evening > 105,
    morning + ' then ' + evening);
await at(6, 30, 'PM');
ok('and becomes a moon after sunset', await token() === '🌙', await token() + ' at 6:30 PM');
await at(6, 30, 'AM');
ok('and a sun again after sunrise', await token() === '☀️', await token() + ' at 6:30 AM');

// 3. Reading the clock: the digits are hidden, but the dial is not. It hints at the
//    hour, which is the price of a dial that never contradicts the hands; the minutes
//    are still only on the face.
await challenge('read', 3, 30, 'PM');
ok('the time is hidden while it is being read', await digital() === '??:??', await digital());
ok('an afternoon time shows a sun', await token() === '☀️', await token());
ok('the dial is named for anyone not seeing it', (await dayLabel()).indexOf('daytime') === 0,
    await dayLabel());
// The dial means the same thing everywhere: at half past three it is past the top of
// the arc and heading down, not stuck at noon over a clock that says otherwise.
const readX = await tokenX();
ok('and the token sits at the real hour, not parked at the zenith', readX > 105, String(readX));

await challenge('read', 9, 30, 'PM');
ok('an evening time shows a moon', await token() === '🌙', await token());
ok('and it too rides the arc while reading', Math.abs(await tokenX() - 100) > 5,
    String(await tokenX()));

// 4. The meridiem is graded, which is fair now the dial shows the half of the day.
await challenge('read', 9, 15, 'AM');
await page.fill('#clockAnswerInput', '9:15 AM');
await page.click('#clockCheckBtn');
await page.waitForTimeout(300);
ok('the right time read off the face is correct', /Correct/.test(await feedback()), await feedback());

await challenge('read', 9, 15, 'AM');
await page.fill('#clockAnswerInput', '9:15 PM');
await page.click('#clockCheckBtn');
await page.waitForTimeout(300);
ok('the wrong half of the day is not', /answer is 9:15 AM/.test(await feedback()), await feedback());

// 5. The dial is inert while it is the question.
await challenge('read', 4, 20, 'PM');
await page.click('#clockDay', { force: true });
await page.waitForTimeout(200);
ok('it cannot be tapped while reading the clock',
    await page.evaluate(() => clockState.ampm) === 'PM', await token());
ok('and is out of the tab order there',
    await page.evaluate(() => document.getElementById('clockDay').getAttribute('tabindex')) === '-1');

// 6. Setting the clock: the answer is not on show, but the meridiem is, because it
//    is being set too.
await challenge('set', 7, 45, 'AM');
const set = await digital();
ok('the time to be set is not given away', set.indexOf('??:??') === 0, set);
ok('while the meridiem being set stays readable', /^\?\?:\?\? (AM|PM)$/.test(set), set);
ok('a set challenge starts at midnight, so a moon', await token() === '🌙', await token());

// 7. Tapping the dial is how the half of the day is set. Before it existed the only
//    way was twelve full sweeps of the minute hand, so half the challenges could not
//    be answered at all.
await page.click('#clockDay');
await page.waitForTimeout(200);
ok('tapping midnight moves to noon',
    await page.evaluate(() => clockState.ampm) === 'PM' && await token() === '☀️',
    await token() + ' / ' + await digital());
ok('and the readout follows', await digital() === '??:?? PM', await digital());
await page.click('#clockDay');
await page.waitForTimeout(200);
ok('tapping again comes back', await digital() === '??:?? AM', await digital());
ok('it can be reached by keyboard too', await page.evaluate(() =>
    document.getElementById('clockDay').getAttribute('tabindex')) === '0');

// A PM challenge can now actually be answered.
await challenge('set', 7, 45, 'PM');
await page.evaluate(() => { clockState.hour = 7; clockState.minute = 45; clockRender(); });
await page.click('#clockDay');
await page.waitForTimeout(200);
await page.click('#clockCheckBtn');
await page.waitForTimeout(300);
ok('so an evening challenge can be answered', /Correct/.test(await feedback()), await feedback());

// 8. Once checked, the clock says the time again.
ok('the time comes back after the answer is given', !/\?\?/.test(await digital()), await digital());

ok('no page errors', errors.length === 0, JSON.stringify(errors).slice(0, 200));
await page.screenshot({ path: OUT + '/clock.png' });
await browser.close();
