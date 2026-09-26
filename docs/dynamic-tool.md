# Dynamic Tools

A tool the user writes themselves, in the board rather than in a plugin file: some
markup, a script that wires it up, and the data the script reads. It is the `script`
template — **Add Tool ▸ Core ▸ Dynamic Tool**, or `#tool/script`.

None of this is new capability. A note renders its markdown through `innerHTML`, so
raw HTML with an inline `onclick` has always run here, and the plugin manager loads
whole scripts from any URL you hand it. What was missing was a place to put code
that is not an attribute: something that runs when the tool opens rather than only
when something is clicked, a field for the values you want to change without editing
code, and state that belongs to one window.

## The three panes

Edit shows one at a time behind a tab strip — three textareas side by side in a
500px window are each too narrow to read a line of code in.

| Tab | Stored as | What it is |
| --- | --- | --- |
| Body | `customContent` | HTML, rendered into the tool's content area. Not markdown — a dynamic tool's body is markup by definition |
| Script | `toolScript` | JavaScript, run against that markup |
| Data | `toolData` | The values the script reads, and where it writes state back |

The pane you were last on is remembered per tool in `scriptTab`.

## What the script is given

The body is compiled as a function of three arguments and nothing else:

```js
function (el, data, api) { … }
```

| | |
| --- | --- |
| `el` | This instance's content area, and nothing outside it |
| `data` | The Data tab, parsed |
| `api.save(value)` | Store `value` as this tool's data — it survives a reload and appears in the Data tab |
| `api.onCleanup(fn)` | Run `fn` when the tool is closed, re-run, or the board switches away |
| `api.toolId` | This instance's id |

The tool a new one starts as, which is also the shortest useful example:

```js
const field = el.querySelector('.q');
const out = el.querySelector('.out');

el.querySelector('.go').onclick = () => {
    const url = data.url.replace('{q}', encodeURIComponent(field.value));
    out.textContent = url;
    window.open(url, '_blank');
};
```

`el` is how instance isolation is kept — the same rule every tool here follows (see
[Key Patterns](patterns.md)). Two copies of a tool on one board each get their own
node, so a script that stays inside `el` cannot reach the other one. Nothing stops a
script reaching further; it simply has no reason to.

## When it runs

`runDynamicTool` is the tool's `onRender`, so the authoring framework calls it when
the result needs to be up to date: on open, on a mode change into Build or View, and
after an edit settles. Edits are saved as you type and run 400ms later, because
running on every keystroke executes half-written code — `el.innerHTML = ''` is a
complete statement well before the line you meant to type is.

**Every run starts from the stored markup**, so a script that rewrote the DOM last
time is not handed its own leftovers.

The script is compiled with `new Function`, not `eval`: it is compiled in global
scope, so it closes over nothing in the app and cannot reach the app's own variables
by accident. It still runs on the page, with the page's powers — `fetch`,
`localStorage`, the theme, the board. An iframe would take the theme, the sizing and
the board's storage away with it, and would be a pretence besides while the plugin
manager runs remote scripts unsandboxed.

A script that throws leaves its message in a strip inside the tool, because the
person who wrote it is looking at the tool. The strip sits outside the content area,
which the script owns and is free to empty. Errors thrown *later*, from a handler
the script installed, are the browser's to report — catching those would mean
wrapping every callback and lying about where they came from.

## The Data tab

| What you type | What `data` is |
| --- | --- |
| Nothing | `{}` |
| Text opening with `{` or `[` | The parsed JSON — and a parse failure is reported, not passed through |
| Anything else | That string |

Text that opens like JSON was meant as JSON, so a typo there is a mistake worth
naming. Handing `{ "url": }` over as a string would give the script an undefined
property and no clue why.

## Scripts that arrive from somewhere else

Until this tool existed, importing anything could not run code. A script that
travels lands **inert**: the markup and data are drawn, the script does not run, and
the tool says so with *Review* and *Run it*. Review puts the code in front of you —
reading it is the whole point — and Run records the answer.

Every way in behaves the same:

| Arriving by | On arrival |
| --- | --- |
| A tools export, by file or by URL | Inert until run |
| A linked source's re-fetch | Inert until run |
| A board template plugin's `state` | Inert until run |
| The **+** menu, or a plugin's own template | Runs — pressing Add is asking for that tool, and a plugin already ran code to register itself |
| Typing in the Script pane | Runs — you are looking at the code and changing it |

What is recorded is not a flag but **the exact script text that was approved**, in
`scriptApproved`. Trust is therefore a property of the code:

- A linked source that re-fetches **unchanged** still matches, and keeps running.
- The same source pushing **different code** next week does not match. It stops and
  asks again, saying that the script changed rather than that it is new.

That rule costs the sync path nothing — it compares text and does not need to know
what a linked source is. Storing the text rather than a hash is deliberate: a short
hash would be smaller and would invite a collision from the one party who gets to
choose the replacement script.

`scriptApproved` is stripped from everything that leaves here and everything that
arrives, so it can only ever be set by someone pressing the button in this browser.
An approval carried in a file would be the file approving its own script.

**One limit, stated plainly:** an exported HTML board writes its embedded data into
localStorage directly, so a hand-crafted one could seed an approval. No gate helps
there — that file is a whole copy of the app, and whoever wrote it already controls
everything it does. What this guarantees is that nothing *Toolboard* exports carries
an approval.

## Sharing one

A dynamic tool exports like any other tool, and its three fields travel with it (see
[URL Hashes](urls.md#loading-from-a-url) and [Boards](board.md)). A board template
can place one by putting the fields in the tool entry's `state`. Whoever opens it
gets the markup, the data, and a script waiting to be read.
