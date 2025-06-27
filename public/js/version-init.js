// Version initialization script
// Populates version information throughout the application

document.addEventListener('DOMContentLoaded', () => {
    if (typeof VERSION_CONFIG !== 'undefined') {
        // Update page title
        document.title = `${VERSION_CONFIG.name} v${VERSION_CONFIG.version} - ${VERSION_CONFIG.subtitle}`;
        
        // Populate version info display
        const versionElement = document.getElementById('version-info');
        if (versionElement) {
            versionElement.innerHTML = `
                <div class="version-number">${VERSION_CONFIG.name} v${VERSION_CONFIG.version}</div>
                <div>Build: ${VERSION_CONFIG.buildDate}</div>
            `;
        }
        
        // Log version info to console with demo scene style
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     🎮 ${VERSION_CONFIG.name.toUpperCase()} DEMO SCENE 🎮                     ║
╠══════════════════════════════════════════════════════════════╣
║  Version: ${VERSION_CONFIG.version.padEnd(48)} ║
║  Build Date: ${VERSION_CONFIG.buildDate.padEnd(44)} ║
║  Features:${' '.repeat(48)} ║`);
        
        VERSION_CONFIG.features.forEach(feature => {
            console.log(`║    ✓ ${feature.padEnd(50)} ║`);
        });
        
        console.log(`╚══════════════════════════════════════════════════════════════╝
        
🎵 Authentic tracker music experience
🎮 Classic demo scene effects  
✨ Modern web technology
        `);
        
        // Add version to any error logs
        window.addEventListener('error', (event) => {
            console.error(`[${VERSION_CONFIG.name} v${VERSION_CONFIG.version}] Error:`, event.error);
        });
        
        console.log(`✅ ${VERSION_CONFIG.name} v${VERSION_CONFIG.version} initialized successfully!`);
    } else {
        console.error('❌ VERSION_CONFIG not available - version.js may not have loaded');
    }
});