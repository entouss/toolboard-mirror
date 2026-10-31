#!/bin/sh
# Builds plugins/lib/codemirror-merge.js: CodeMirror 6 and its merge view, as one file.
#
# Why one file of our own: loaded module by module from a CDN, CodeMirror's packages
# come at several versions at once — each package names its own range — and CodeMirror
# refuses extensions made by another copy of itself ("Unrecognized extension value").
# Bundled, there is one copy of each, pinned, served from the board's own host.
#
# Run from anywhere: sh plugins/lib/build-codemirror.sh. Needs node and npm.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cd "$WORK"
npm init -y >/dev/null
npm install --silent --no-audit --no-fund \
    @codemirror/merge@6.12.3 @codemirror/view@6.43.15 @codemirror/state@6.7.6 \
    @codemirror/commands@6.10.1 @codemirror/language@6.13.1 @codemirror/search@6.5.11 esbuild@0.25
cat > entry.js <<'JS'
export { MergeView, unifiedMergeView, getChunks, getOriginalDoc, updateOriginalDoc } from '@codemirror/merge';
export { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection,
    highlightSpecialChars, Decoration, MatchDecorator, ViewPlugin, WidgetType, placeholder } from '@codemirror/view';
export { EditorState, Compartment, StateEffect, Transaction } from '@codemirror/state';
export { history, historyKeymap, defaultKeymap, indentWithTab, undo, redo } from '@codemirror/commands';
export { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
export { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
JS
npx esbuild entry.js --bundle --minify --format=iife --global-name=ToolboardCodeMirror --legal-comments=eof \
    --banner:js="/* CodeMirror 6 + @codemirror/merge, bundled for Toolboard by plugins/lib/build-codemirror.sh. MIT licensed: https://codemirror.net */" \
    --outfile="$HERE/codemirror-merge.js"
echo "Built $HERE/codemirror-merge.js"
