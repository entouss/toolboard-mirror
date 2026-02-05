// Example Toolbox Plugin
// Demonstrates how to create an external toolbox plugin for Toolboard

PluginRegistry.registerToolbox({
    id: 'example-toolbox',
    name: 'Example Toolbox',
    description: 'A sample external toolbox plugin',
    icon: '📦',
    color: '#e74c3c',
    version: '1.0.0',
    tools: ['example-external-tool'],
    source: 'external'
});

console.log('Example toolbox plugin loaded');
