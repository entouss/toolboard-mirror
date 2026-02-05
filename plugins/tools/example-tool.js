// Example Tool Plugin
// Demonstrates how to create an external tool plugin for Toolboard

PluginRegistry.registerTool({
    id: 'example-external-tool',
    name: 'Example External Tool',
    description: 'A sample external tool plugin',
    icon: '🔌',
    version: '1.0.0',
    toolbox: 'developer-tools',
    tags: ['example', 'demo', 'plugin'],
    title: 'Example Plugin',
    content: `<div style="padding: 15px;">
        <h3 style="margin: 0 0 10px; color: var(--text-heading);">External Plugin Example</h3>
        <p style="color: var(--text-secondary); margin-bottom: 15px;">
            This tool was loaded from an external JavaScript file.
        </p>
        <div style="background: var(--bg-tertiary); padding: 10px; border-radius: 4px;">
            <code style="font-size: 12px;">
                PluginRegistry.registerTool({...})
            </code>
        </div>
        <p style="color: var(--text-muted); font-size: 11px; margin-top: 10px;">
            You can create your own tools and load them via the Plugin Settings.
        </p>
    </div>`,
    contentType: 'html',
    source: 'external',
    defaultWidth: 300,
    defaultHeight: 200
});

console.log('Example external tool plugin loaded');
