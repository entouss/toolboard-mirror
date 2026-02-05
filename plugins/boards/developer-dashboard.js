// Developer Dashboard Board Template
// Provides a pre-configured workspace with essential developer tools

PluginRegistry.registerBoard({
    id: 'developer-dashboard',
    name: 'Developer Dashboard',
    description: 'Essential tools for software development',
    icon: '👨‍💻',
    version: '1.0.0',
    source: 'external',
    settings: {
        title: 'Developer Dashboard',
        color: '#2c3e50'
    },
    tools: [
        {
            toolId: 'jwt-decoder',
            instanceId: 'jwt-1',
            position: { x: 20, y: 20, z: 100, width: 400, height: 300 }
        },
        {
            toolId: 'regex-tester',
            instanceId: 'regex-1',
            position: { x: 440, y: 20, z: 101, width: 450, height: 300 }
        },
        {
            toolId: 'code-formatter',
            instanceId: 'fmt-1',
            position: { x: 20, y: 340, z: 102, width: 500, height: 350 }
        },
        {
            toolId: 'epoch-converter',
            instanceId: 'epoch-1',
            position: { x: 540, y: 340, z: 103, width: 350, height: 350 }
        }
    ]
});

console.log('Developer Dashboard board template loaded');
