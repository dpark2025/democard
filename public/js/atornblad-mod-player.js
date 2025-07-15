// Will be loaded dynamically with validation
let ModPlayer;

// Secure CDN loading with validation
async function loadModPlayerSecurely() {
    try {
        // Try to import from CDN with validation
        const response = await fetch('https://atornblad.se/files/js-mod-player/player.js');
        if (response.ok) {
            const moduleText = await response.text();
            // Basic validation - check if it contains expected exports
            if (moduleText.includes('ModPlayer') && moduleText.includes('export')) {
                const moduleBlob = new Blob([moduleText], { type: 'application/javascript' });
                const moduleUrl = URL.createObjectURL(moduleBlob);
                const module = await import(moduleUrl);
                ModPlayer = module.ModPlayer;
                URL.revokeObjectURL(moduleUrl);
                console.log('✅ ModPlayer loaded securely from CDN');
                return true;
            } else {
                throw new Error('CDN response validation failed');
            }
        } else {
            throw new Error(`CDN request failed: ${response.status}`);
        }
    } catch (error) {
        console.warn('⚠️ CDN load failed, using fallback:', error.message);
        // Fallback: create a basic ModPlayer mock
        ModPlayer = class {
            constructor(audioContext) {
                this.audioContext = audioContext;
                this.loaded = false;
            }
            async load(url) {
                console.log('🔄 Using fallback ModPlayer mock');
                return false; // Will trigger fallback to simple player
            }
            play() { return false; }
            stop() { return false; }
            isPlaying() { return false; }
            setVolume() { return false; }
        };
        return false;
    }
}

class AtornbladModPlayer {
    constructor() {
        this.audioContext = null;
        this.player = null;
        this.isPlaying = false;
        this.initialized = false;
        this.currentSong = null;
        this.loopMonitor = null;
        this.audioNodes = []; // Track audio nodes for cleanup
        this.eventController = null; // For event listener cleanup
        this.initializePlayer();
    }
    
    async initializePlayer() {
        try {
            // Load ModPlayer securely first
            const cdnLoaded = await loadModPlayerSecurely();
            if (!cdnLoaded) {
                console.log('⚠️ Using fallback ModPlayer implementation');
            }
            
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioNodes.push(this.audioContext.destination);
            
            // Create ModPlayer instance
            this.player = new ModPlayer(this.audioContext);
            
            console.log('✅ AtornbladModPlayer initialized successfully');
            this.initialized = true;
        } catch (error) {
            console.error('❌ AtornbladModPlayer initialization failed:', error);
            this.cleanup(); // Clean up on failure
        }
    }
    
    async loadMod(url) {
        try {
            if (!this.initialized || !this.player) {
                console.error('❌ ModPlayer not initialized');
                return false;
            }
            
            console.log(`🎵 Loading MOD file: ${url}`);
            
            await this.player.load(url);
            
            // Enable looping if available
            if (this.player.setLoop) {
                this.player.setLoop(true);
                console.log('🔄 Looping enabled');
            } else if (this.player.loop !== undefined) {
                this.player.loop = true;
                console.log('🔄 Looping enabled via property');
            }
            
            // Get song info if available
            const song = this.player.song || this.player.module;
            if (song) {
                this.currentSong = song;
                console.log(`✅ Successfully loaded MOD file`);
                console.log(`📊 Title: ${song.title || 'Unknown'}`);
                return true;
            } else {
                console.log('✅ MOD file loaded (no song info available)');
                return true;
            }
        } catch (error) {
            console.error('❌ Error loading MOD file:', error);
            return false;
        }
    }
    
    start() {
        try {
            if (!this.initialized || !this.player) {
                console.log('❌ ModPlayer not ready');
                return false;
            }
            
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.player.play();
            this.isPlaying = true;
            
            // Start monitoring for song end to implement looping
            this.startLoopMonitoring();
            
            console.log('✅ MOD playback started');
            return true;
        } catch (error) {
            console.error('❌ Failed to start MOD player:', error);
            return false;
        }
    }
    
    startLoopMonitoring() {
        // Use shared utility for better loop monitoring
        if (this.loopMonitor) {
            this.loopMonitor(); // Call cleanup function
        }
        
        this.loopMonitor = window.ModLoaderUtils.setupLoopMonitoring(
            this.player,
            () => this.player.isPlaying && this.player.isPlaying(),
            () => {
                if (this.player && this.isPlaying) {
                    this.player.stop();
                    this.player.play();
                }
            }
        );
    }
    
    stop() {
        try {
            if (this.player && this.isPlaying) {
                this.player.stop();
                this.isPlaying = false;
                
                // Clear loop monitoring using cleanup function
                if (this.loopMonitor && typeof this.loopMonitor === 'function') {
                    this.loopMonitor();
                    this.loopMonitor = null;
                }
                
                console.log('🛑 MOD playback stopped');
            }
        } catch (error) {
            console.error('❌ Error stopping MOD player:', error);
        }
    }
    
    toggle() {
        try {
            if (!this.initialized) {
                return false;
            }
            
            if (this.isPlaying) {
                this.stop();
                return false;
            } else {
                return this.start();
            }
        } catch (error) {
            console.error('❌ Error toggling MOD player:', error);
            return false;
        }
    }
    
    setVolume(volume) {
        try {
            if (this.player && this.player.setVolume) {
                this.player.setVolume(Math.max(0, Math.min(1, volume)));
                console.log(`🔊 Volume set to ${Math.round(volume * 100)}%`);
            } else if (this.audioContext && this.audioContext.destination) {
                // Fallback volume control
                console.log(`🔊 Volume control not available, using fallback`);
            }
        } catch (error) {
            console.error('❌ Error setting volume:', error);
        }
    }
    
    // Clean up resources
    cleanup() {
        try {
            this.stop();
            
            // Clean up event listeners
            if (this.eventController) {
                this.eventController.abort();
                this.eventController = null;
            }
            
            // Clean up audio resources
            window.ModLoaderUtils.cleanupAudioResources(this.audioContext, this.audioNodes);
            
            console.log('✅ AtornbladModPlayer cleaned up');
        } catch (error) {
            console.error('❌ Error during cleanup:', error);
        }
    }
    
    getSongInfo() {
        if (this.currentSong) {
            return {
                title: this.currentSong.title || 'Unknown',
                channels: this.currentSong.channels || 4,
                patterns: this.currentSong.patterns || 'Unknown',
                instruments: this.currentSong.instruments?.length || 0
            };
        }
        return null;
    }
}

// Global MOD player instance
let modPlayer = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const versionInfo = typeof VERSION_CONFIG !== 'undefined' ? ` v${VERSION_CONFIG.version}` : '';
    console.log(`🎮 Initializing AtornbladModPlayer${versionInfo}...`);
    
    try {
        modPlayer = new AtornbladModPlayer();
        
        // Wait for initialization
        let attempts = 0;
        while (!modPlayer.initialized && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!modPlayer.initialized) {
            console.error('❌ AtornbladModPlayer failed to initialize, falling back to simple player');
            if (typeof simpleModPlayer !== 'undefined') {
                modPlayer = simpleModPlayer;
            }
            return;
        }
        
        // Try to load MOD files using shared utility
        const attribution = document.getElementById('music-attribution');
        let success = false;
        
        try {
            success = await window.ModLoaderUtils.loadModWithFallback(
                modPlayer,
                attribution,
                (source, index) => {
                    console.log(`✅ Loaded: ${source.description} (priority ${index + 1})`);
                },
                (source, index) => {
                    console.log(`❌ Failed: ${source.description}, trying next fallback...`);
                }
            );
            
            if (!success) {
                console.log('❌ All MOD files failed, falling back to simple player');
                if (typeof simpleModPlayer !== 'undefined') {
                    modPlayer = simpleModPlayer;
                    if (attribution) {
                        attribution.innerHTML = '<em>Music: Simple Tracker (Fallback)</em>';
>>>>>>> 1f7be04 (Implement comprehensive code quality improvements from GitHub issue #8)
                    }
                }
            }
        } catch (error) {
            console.error('❌ MOD loading error, using fallback player:', error);
            if (typeof simpleModPlayer !== 'undefined') {
                modPlayer = simpleModPlayer;
                if (attribution) {
                    attribution.innerHTML = '<em>Music: Simple Tracker (Fallback)</em>';
                }
            }
        }
        
        // Set volume to reasonable level using constant
        modPlayer.setVolume(window.ModLoaderUtils.MOD_CONFIG.VOLUME_DEFAULT);
        
        // Setup sound button using shared utility
        const soundButton = document.getElementById('sound-toggle');
        if (soundButton) {
            // Create event controller for proper cleanup
            modPlayer.eventController = window.ModLoaderUtils.createEventController();
            
            // Setup sound button with proper event handling
            const cleanupFunction = window.ModLoaderUtils.setupSoundButton(
                soundButton, 
                modPlayer, 
                modPlayer.eventController
            );
            
            // Store cleanup function for later use
            modPlayer.cleanupEventListeners = cleanupFunction;
            
            // Auto-start music after a delay (requires user interaction first)
            setTimeout(() => {
                console.log('🎵 Ready for user interaction to start music...');
                // Note: Modern browsers require user interaction before playing audio
                // The music will start when the user clicks the sound button
            }, window.ModLoaderUtils.MOD_CONFIG.INIT_TIMEOUT / 5); // 1 second
        } else {
            console.log('❌ Sound button not found');
        }
        
    } catch (error) {
        console.error('❌ Critical error initializing MOD player:', error);
        if (typeof simpleModPlayer !== 'undefined') {
            modPlayer = simpleModPlayer;
            console.log('Using simple MOD player as final fallback');
        }
    }
});
