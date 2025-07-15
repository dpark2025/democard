import { ModPlayer } from 'https://atornblad.se/files/js-mod-player/player.js';

class AtornbladModPlayer {
    constructor() {
        this.audioContext = null;
        this.player = null;
        this.isPlaying = false;
        this.initialized = false;
        this.currentSong = null;
        this.loopMonitor = null;
        this.initializePlayer();
    }
    
    async initializePlayer() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create ModPlayer instance
            this.player = new ModPlayer(this.audioContext);
            
            console.log('✅ AtornbladModPlayer initialized successfully');
            this.initialized = true;
        } catch (error) {
            console.error('❌ AtornbladModPlayer initialization failed:', error);
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
        // Clear any existing monitor
        if (this.loopMonitor) {
            clearInterval(this.loopMonitor);
        }
        
        // Check song status every 500ms
        this.loopMonitor = setInterval(() => {
            if (this.isPlaying && this.player) {
                try {
                    // Check if song has ended (different MOD players may have different properties)
                    const isEnded = this.player.ended || 
                                   this.player.isFinished || 
                                   (this.player.getPosition && this.player.getPosition() >= this.player.getDuration()) ||
                                   !this.player.isPlaying();
                    
                    if (isEnded) {
                        console.log('🔄 Song ended, looping...');
                        this.player.stop();
                        setTimeout(() => {
                            if (this.isPlaying) { // Only restart if still supposed to be playing
                                this.player.play();
                                console.log('✅ Song restarted');
                            }
                        }, 100);
                    }
                } catch (error) {
                    // Silently handle monitoring errors
                }
            }
        }, 500);
    }
    
    stop() {
        try {
            if (this.player && this.isPlaying) {
                this.player.stop();
                this.isPlaying = false;
                
                // Clear loop monitoring
                if (this.loopMonitor) {
                    clearInterval(this.loopMonitor);
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
        
        // Try to load MOD files
        const attribution = document.getElementById('music-attribution');
        let success = false;
        
        try {
            console.log('=== MOD Loading Phase ===');
            success = await modPlayer.loadMod('./mods/sundance.mod');
            
            if (success) {
                console.log('✅ Sundance MOD loaded successfully');
                if (attribution) {
                    attribution.innerHTML = '<em>Music: "Sundance" by Purple Motion / Future Crew (1993)</em>';
                }
            } else {
                console.log('❌ Sundance failed, trying Techno Slice...');
                success = await modPlayer.loadMod('./mods/techno-slice.mod');
                
                if (success) {
                    console.log('✅ Techno Slice MOD loaded successfully');
                    if (attribution) {
                        attribution.innerHTML = '<em>Music: "Techno Slice" by Dennis Mundt (1993)</em>';
                    }
                } else {
                    console.log('❌ Techno Slice failed, trying demo.mod...');
                    success = await modPlayer.loadMod('./mods/demo.mod');
                    
                    if (success) {
                        console.log('✅ Demo MOD loaded successfully');
                        if (attribution) {
                            attribution.innerHTML = '<em>Music: "DemoCard Tracker" (Generated)</em>';
                        }
                    } else {
                        console.log('❌ All MOD files failed, falling back to simple player');
                        if (typeof simpleModPlayer !== 'undefined') {
                            modPlayer = simpleModPlayer;
                            if (attribution) {
                                attribution.innerHTML = '<em>Music: Simple Tracker (Fallback)</em>';
                            }
                        }
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
        
        // Set volume to reasonable level
        modPlayer.setVolume(0.3);
        
        // Setup sound button
        const soundButton = document.getElementById('sound-toggle');
        if (soundButton) {
            // Remove any existing listeners by cloning the button
            const newSoundButton = soundButton.cloneNode(true);
            soundButton.parentNode.replaceChild(newSoundButton, soundButton);
            
            newSoundButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔘 Sound button clicked');
                
                if (modPlayer) {
                    const isPlaying = modPlayer.toggle();
                    newSoundButton.textContent = isPlaying ? 'SOUND: ON' : 'SOUND: OFF';
                    console.log('🎵 Sound toggled:', isPlaying ? 'ON' : 'OFF');
                } else {
                    console.error('❌ MOD player not available');
                }
            });
            
            // Auto-start music after a delay (requires user interaction first)
            setTimeout(() => {
                console.log('🎵 Ready for user interaction to start music...');
                // Note: Modern browsers require user interaction before playing audio
                // The music will start when the user clicks the sound button
            }, 1000);
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