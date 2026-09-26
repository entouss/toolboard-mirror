# Adding a New Tool

**All new tools must go in a plugin file** (`plugins/toolboxes/*.js`), never in `index.html`. Use `developer-tools.js` as the canonical example:

*This is the path for a tool that ships with the app. Someone who wants a tool of their own on one board writes a [dynamic tool](dynamic-tool.md) instead, and does not touch this repository.*

1. Add CSS rules to the style IIFE (before the closing backtick)
2. Add the tool ID to the toolbox's `tools` array
3. Add `PluginRegistry.registerTool({...})` with `content` (HTML string), `onInit`, `defaultWidth`/`defaultHeight`, `tags`
4. Add all functions after existing functions, before the export IIFE
5. Add all function names to the `functionsToExport` array in the export IIFE
6. Add any constants/state to the export IIFE's state serialization section
7. Update the tool count in `console.log` statements
