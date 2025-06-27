// DemoCard Version Configuration
// Update this file to change the version across the entire application

const VERSION_CONFIG = {
    version: "2.1.0",
    name: "DemoCard",
    subtitle: "2000s Demo Scene Experience",
    buildDate: "2024-12-19",
    features: [
        "Authentic MOD tracker music",
        "3D wireframe graphics", 
        "Bouncing physics",
        "Enhanced starfield",
        "User-controlled audio"
    ]
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = VERSION_CONFIG;
} else {
    // Browser environment - make available globally
    window.VERSION_CONFIG = VERSION_CONFIG;
}