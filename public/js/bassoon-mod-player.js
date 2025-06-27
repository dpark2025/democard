class BassoonModPlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.currentSong = null;
        this.initializeBassoon();
    }
    
    async initializeBassoon() {
        try {
            // Wait for BassoonTracker to be available
            if (typeof BassoonTracker === 'undefined') {
                console.log('⏳ Waiting for BassoonTracker to load...');
                setTimeout(() => this.initializeBassoon(), 100);
                return;
            }
            
            console.log('✅ BassoonTracker library loaded successfully');
            this.initialized = true;
        } catch (error) {
            console.error('❌ BassoonTracker initialization failed:', error);
        }
    }
    
    async loadMod(url) {
        try {
            if (!this.initialized) {
                console.error('❌ BassoonTracker not initialized');
                return false;
            }
            
            console.log(`🎵 Loading MOD file: ${url}`);
            
            await BassoonTracker.load(url);
            
            const song = BassoonTracker.getSong();
            if (song && song.title) {
                this.currentSong = song;
                console.log(`✅ Successfully loaded MOD: "${song.title}"`);
                console.log(`📊 Channels: ${song.channels}, Patterns: ${song.patterns}, Samples: ${song.instruments?.length || 'unknown'}`);
                return true;
            } else {
                console.log('❌ Failed to load MOD - no song data');
                return false;
            }
        } catch (error) {
            console.error('❌ Error loading MOD file:', error);
            return false;
        }
    }
    
    start() {
        try {
            if (!this.initialized) {
                console.log('❌ BassoonTracker not ready');
                return false;
            }
            
            BassoonTracker.play();
            this.isPlaying = BassoonTracker.isPlaying();
            
            if (this.isPlaying) {
                console.log('✅ MOD playback started');
                return true;
            } else {
                console.log('❌ Failed to start MOD playback');
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to start MOD player:', error);
            return false;
        }
    }
    
    stop() {
        try {
            if (this.initialized) {
                BassoonTracker.stop();
                this.isPlaying = false;
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
            if (this.initialized && BassoonTracker.audio && BassoonTracker.audio.masterVolume !== undefined) {
                BassoonTracker.audio.masterVolume = Math.max(0, Math.min(1, volume));
                console.log(`🔊 Volume set to ${Math.round(volume * 100)}%`);
            }
        } catch (error) {
            console.error('❌ Error setting volume:', error);
        }
    }
    
    getSongInfo() {
        if (this.currentSong) {
            return {
                title: this.currentSong.title,
                channels: this.currentSong.channels,
                patterns: this.currentSong.patterns,
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
    console.log('🎮 Initializing BassoonTracker MOD player...');
    
    modPlayer = new BassoonModPlayer();
    
    // Wait for BassoonTracker to initialize
    let attempts = 0;
    while (!modPlayer.initialized && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!modPlayer.initialized) {
        console.error('❌ BassoonTracker failed to initialize, falling back to simple player');
        if (typeof simpleModPlayer !== 'undefined') {
            modPlayer = simpleModPlayer;
        }
        return;
    }
    
    // Try to load MOD files
    const attribution = document.getElementById('music-attribution');
    try {
        console.log('=== MOD Loading Phase ===');
        let success = await modPlayer.loadMod('./mods/techno-slice.mod');
        
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
        
        // Auto-start music after a delay
        setTimeout(() => {
            console.log('🎵 Auto-starting MOD player...');
            if (modPlayer) {
                const started = modPlayer.start();
                if (started) {
                    newSoundButton.textContent = 'SOUND: ON';
                }
            }
        }, 2000);
    } else {
        console.log('❌ Sound button not found');
    }
});