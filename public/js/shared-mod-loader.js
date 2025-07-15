// Shared MOD loading utility with validation and error handling
// Eliminates code duplication across multiple MOD players

// Constants for configuration
const MOD_CONFIG = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB max file size
    LOOP_MONITOR_INTERVAL: 500,     // Loop monitoring interval in ms
    RESTART_DELAY: 1000,            // Delay before restart in ms
    VOLUME_DEFAULT: 0.3,            // Default volume level
    INIT_TIMEOUT: 5000,             // Initialization timeout in ms
    VALID_MIME_TYPES: [
        'audio/mod',
        'audio/x-mod',
        'application/octet-stream', // Common fallback for MOD files
        'audio/x-protracker'
    ]
};

// Fallback sources configuration
const FALLBACK_SOURCES = [
    { 
        url: './mods/sundance.mod', 
        attribution: 'Music: "Sundance" by Purple Motion / Future Crew (1993)',
        description: 'Future Crew primary track'
    },
    { 
        url: './mods/techno-slice.mod', 
        attribution: 'Music: "Techno Slice" by Dennis Mundt (1993)',
        description: 'Authentic 1993 fallback'
    },
    { 
        url: './mods/demo.mod', 
        attribution: 'Music: "DemoCard Tracker" (Generated)',
        description: 'Generated MOD fallback'
    }
];

/**
 * Validates a MOD file before loading
 * @param {string} url - URL of the MOD file
 * @returns {Promise<boolean>} - True if validation passes
 */
async function validateModFile(url) {
    try {
        console.log(`🔍 Validating MOD file: ${url}`);
        
        const response = await fetch(url, { method: 'HEAD' });
        
        if (!response.ok) {
            console.log(`❌ HTTP error: ${response.status} ${response.statusText}`);
            return false;
        }

        // Check content length
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
            const size = parseInt(contentLength, 10);
            if (size > MOD_CONFIG.MAX_FILE_SIZE) {
                console.log(`❌ File too large: ${size} bytes (max: ${MOD_CONFIG.MAX_FILE_SIZE})`);
                return false;
            }
            console.log(`✅ File size OK: ${size} bytes`);
        }

        // Check MIME type if available
        const contentType = response.headers.get('content-type');
        if (contentType && !MOD_CONFIG.VALID_MIME_TYPES.includes(contentType)) {
            console.log(`⚠️ Unexpected MIME type: ${contentType} (proceeding anyway)`);
        }

        console.log(`✅ Validation passed for: ${url}`);
        return true;
    } catch (error) {
        console.error(`❌ Validation error for ${url}:`, error);
        return false;
    }
}

/**
 * Loads MOD files with fallback hierarchy
 * @param {Object} modPlayer - MOD player instance with loadMod method
 * @param {HTMLElement} attribution - Attribution element to update
 * @param {Function} onSuccess - Optional callback on successful load
 * @param {Function} onFallback - Optional callback when using fallback
 * @returns {Promise<boolean>} - True if any MOD loaded successfully
 */
async function loadModWithFallback(modPlayer, attribution, onSuccess, onFallback) {
    console.log('=== MOD Loading Phase ===');
    
    for (let i = 0; i < FALLBACK_SOURCES.length; i++) {
        const source = FALLBACK_SOURCES[i];
        
        try {
            console.log(`🎵 Attempting to load: ${source.description}`);
            
            // Validate file before attempting load
            const isValid = await validateModFile(source.url);
            if (!isValid) {
                console.log(`❌ Validation failed for ${source.url}, trying next...`);
                continue;
            }
            
            // Attempt to load the MOD file
            const success = await modPlayer.loadMod(source.url);
            
            if (success) {
                console.log(`✅ Successfully loaded: ${source.description}`);
                
                // Update attribution
                if (attribution) {
                    attribution.innerHTML = `<em>${source.attribution}</em>`;
                }
                
                // Call success callback if provided
                if (onSuccess) {
                    onSuccess(source, i);
                }
                
                return true;
            } else {
                console.log(`❌ Failed to load: ${source.description}`);
            }
        } catch (error) {
            console.error(`❌ Error loading ${source.url}:`, error);
        }
        
        // Call fallback callback if provided (except for last attempt)
        if (i < FALLBACK_SOURCES.length - 1 && onFallback) {
            onFallback(source, i);
        }
    }
    
    console.log('❌ All MOD files failed to load');
    return false;
}

/**
 * Sets up loop monitoring with proper debouncing
 * @param {Object} modPlayer - MOD player instance
 * @param {Function} isPlayingCheck - Function to check if player is still playing
 * @param {Function} restartFunction - Function to restart playback
 * @returns {Function} - Cleanup function to stop monitoring
 */
function setupLoopMonitoring(modPlayer, isPlayingCheck, restartFunction) {
    let monitorInterval = null;
    let lastRestartTime = 0;
    let isRestarting = false;
    
    function startMonitoring() {
        if (monitorInterval) {
            clearInterval(monitorInterval);
        }
        
        monitorInterval = setInterval(() => {
            try {
                // Skip check if currently restarting
                if (isRestarting) {
                    return;
                }
                
                const isPlaying = isPlayingCheck();
                const now = Date.now();
                
                // Check if song ended and enough time has passed since last restart
                if (!isPlaying && (now - lastRestartTime) > MOD_CONFIG.RESTART_DELAY) {
                    console.log('🔄 Song ended, restarting...');
                    
                    isRestarting = true;
                    lastRestartTime = now;
                    
                    // Restart with delay to prevent rapid cycling
                    setTimeout(() => {
                        try {
                            restartFunction();
                            console.log('✅ Song restarted successfully');
                        } catch (error) {
                            console.error('❌ Error restarting song:', error);
                        } finally {
                            isRestarting = false;
                        }
                    }, MOD_CONFIG.RESTART_DELAY);
                }
            } catch (error) {
                console.error('❌ Error in loop monitoring:', error);
            }
        }, MOD_CONFIG.LOOP_MONITOR_INTERVAL);
        
        console.log('🔄 Loop monitoring started');
    }
    
    function stopMonitoring() {
        if (monitorInterval) {
            clearInterval(monitorInterval);
            monitorInterval = null;
            console.log('🛑 Loop monitoring stopped');
        }
    }
    
    // Start monitoring immediately
    startMonitoring();
    
    // Return cleanup function
    return stopMonitoring;
}

/**
 * Cleans up audio resources
 * @param {AudioContext} audioContext - Audio context to clean up
 * @param {Array} audioNodes - Array of audio nodes to disconnect
 */
function cleanupAudioResources(audioContext, audioNodes = []) {
    try {
        // Disconnect all audio nodes
        audioNodes.forEach(node => {
            if (node && typeof node.disconnect === 'function') {
                node.disconnect();
            }
        });
        
        // Close audio context if possible
        if (audioContext && audioContext.state !== 'closed') {
            if (typeof audioContext.close === 'function') {
                audioContext.close();
                console.log('✅ Audio context closed');
            }
        }
    } catch (error) {
        console.error('❌ Error cleaning up audio resources:', error);
    }
}

/**
 * Creates an abort controller for event listener cleanup
 * @returns {AbortController} - Controller for managing event listeners
 */
function createEventController() {
    return new AbortController();
}

/**
 * Sets up sound button with proper event handling
 * @param {HTMLElement} soundButton - Sound button element
 * @param {Object} modPlayer - MOD player instance
 * @param {AbortController} controller - Abort controller for cleanup
 * @returns {Function} - Cleanup function
 */
function setupSoundButton(soundButton, modPlayer, controller) {
    if (!soundButton || !modPlayer) {
        console.error('❌ Invalid sound button or MOD player');
        return () => {};
    }
    
    const signal = controller.signal;
    
    soundButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔘 Sound button clicked');
        
        try {
            const isPlaying = modPlayer.toggle();
            soundButton.textContent = isPlaying ? 'SOUND: ON' : 'SOUND: OFF';
            console.log('🎵 Sound toggled:', isPlaying ? 'ON' : 'OFF');
        } catch (error) {
            console.error('❌ Error toggling sound:', error);
        }
    }, { signal });
    
    console.log('✅ Sound button event listener attached');
    
    // Return cleanup function
    return () => {
        controller.abort();
        console.log('✅ Sound button event listeners cleaned up');
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MOD_CONFIG,
        FALLBACK_SOURCES,
        validateModFile,
        loadModWithFallback,
        setupLoopMonitoring,
        cleanupAudioResources,
        createEventController,
        setupSoundButton
    };
}

// Global exports for browser usage
window.ModLoaderUtils = {
    MOD_CONFIG,
    FALLBACK_SOURCES,
    validateModFile,
    loadModWithFallback,
    setupLoopMonitoring,
    cleanupAudioResources,
    createEventController,
    setupSoundButton
};

console.log('✅ Shared MOD loader utility loaded');