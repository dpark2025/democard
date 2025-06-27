class ModPlayer {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.masterGain = null;
        this.mod = null;
        this.pt = null;
        this.bufferSize = 4096;
        this.scriptNode = null;
        this.initialized = false;
        
        this.initAudioContext();
    }
    
    async initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3;
            
            // Create ProTracker player with better validation
            if (typeof Protracker !== 'undefined') {
                try {
                    this.pt = new Protracker();
                    
                    // Validate the ProTracker instance
                    if (this.pt && typeof this.pt.parse === 'function') {
                        this.pt.samplerate = this.audioContext.sampleRate;
                        console.log('✅ ProTracker initialized successfully');
                        console.log('ProTracker methods available:', Object.getOwnPropertyNames(this.pt).filter(name => typeof this.pt[name] === 'function'));
                    } else {
                        console.error('❌ ProTracker object created but parse method not available');
                        this.pt = null;
                    }
                } catch (ptError) {
                    console.error('❌ ProTracker constructor failed:', ptError);
                    this.pt = null;
                }
            } else {
                console.error('❌ ProTracker class not available in global scope');
                this.pt = null;
            }
            
            // Create script processor for audio generation
            if (this.audioContext.createScriptProcessor) {
                this.scriptNode = this.audioContext.createScriptProcessor(this.bufferSize, 0, 2);
            } else {
                // Fallback for browsers that deprecated createScriptProcessor
                this.scriptNode = this.audioContext.createScriptProcessor(this.bufferSize, 0, 2);
            }
            this.scriptNode.onaudioprocess = (e) => this.audioProcess(e);
            
            this.initialized = true;
        } catch (error) {
            console.error('Web Audio API initialization failed:', error);
            this.pt = null;
        }
    }
    
    audioProcess(e) {
        if (!this.isPlaying || !this.pt) {
            // Fill with silence
            const outputL = e.outputBuffer.getChannelData(0);
            const outputR = e.outputBuffer.getChannelData(1);
            outputL.fill(0);
            outputR.fill(0);
            return;
        }
        
        const outputL = e.outputBuffer.getChannelData(0);
        const outputR = e.outputBuffer.getChannelData(1);
        
        try {
            for (let i = 0; i < this.bufferSize; i++) {
                this.pt.advance();
                outputL[i] = this.pt.mixval[0] || 0;
                outputR[i] = this.pt.mixval[1] || 0;
            }
        } catch (error) {
            console.error('Audio processing error:', error);
            outputL.fill(0);
            outputR.fill(0);
        }
    }
    
    async loadMod(url) {
        try {
            console.log(`Attempting to load MOD file: ${url}`);
            
            // Check if ProTracker is ready
            if (!this.pt || typeof this.pt.parse !== 'function') {
                console.error('❌ ProTracker not ready - parse method unavailable');
                return false;
            }
            
            const response = await fetch(url);
            if (!response.ok) {
                console.log(`❌ HTTP error loading MOD file: ${response.status}`);
                return false;
            }
            
            const arrayBuffer = await response.arrayBuffer();
            console.log(`📦 Downloaded ${arrayBuffer.byteLength} bytes`);
            
            // Attempt to parse with additional error handling
            let success = false;
            try {
                success = this.pt.parse(arrayBuffer);
            } catch (parseError) {
                console.error('❌ ProTracker parse error:', parseError);
                return false;
            }
            
            if (success) {
                console.log(`✅ Successfully loaded MOD: "${this.pt.title}"`);
                console.log(`📊 Channels: ${this.pt.channels}, Patterns: ${this.pt.patterns}, Samples: ${this.pt.sample.length}`);
                
                // Test if the MOD has valid data
                if (this.pt.patterns > 0 && this.pt.songlen > 0) {
                    return true;
                } else {
                    console.log('❌ MOD file has no valid patterns or song length');
                    return false;
                }
            } else {
                console.log('❌ Failed to parse MOD file - invalid format');
                return false;
            }
        } catch (error) {
            console.error('❌ Error loading MOD file:', error);
            return false;
        }
    }
    
    createSimplePattern() {
        // Create a simple 4-channel MOD pattern programmatically
        this.pt.title = "DemoCard Tracker";
        this.pt.channels = 4;
        this.pt.songlen = 1;
        this.pt.patterns = 1;
        this.pt.songpatterns = [0];
        
        // Create simple samples (sine waves)
        for (let i = 0; i < 31; i++) {
            this.pt.sample[i] = {
                'name': i === 0 ? 'Kick' : i === 1 ? 'Hat' : i === 2 ? 'Bass' : i === 3 ? 'Lead' : '',
                'length': 1000,
                'finetune': 0,
                'volume': 64,
                'repeatpoint': 0,
                'repeatlength': 0,
                'data': new Float32Array(1000)
            };
            
            // Generate different waveforms for different samples
            for (let j = 0; j < 1000; j++) {
                let sample = 0;
                if (i === 0) { // Kick - sine wave with frequency decay
                    const freq = 60 * (1 - j / 1000);
                    sample = Math.sin(j * freq * Math.PI / 500) * (1 - j / 1000);
                } else if (i === 1) { // Hat - noise
                    sample = (Math.random() - 0.5) * (1 - j / 1000);
                } else if (i === 2) { // Bass - sawtooth
                    sample = ((j % 20) / 10 - 1) * 0.5;
                } else if (i === 3) { // Lead - square
                    sample = ((j % 40) < 20 ? 0.3 : -0.3);
                }
                this.pt.sample[i].data[j] = sample;
            }
        }
        
        // Create pattern data (64 rows, 4 channels)
        this.pt.note = [[]];
        for (let row = 0; row < 64; row++) {
            for (let ch = 0; ch < 4; ch++) {
                let note = { 'period': 0, 'sample': 0, 'effect': 0, 'effectdata': 0 };
                
                // Simple techno pattern
                if (ch === 0) { // Kick on beats 1, 5, 9, 13
                    if (row % 16 === 0 || row % 16 === 8) {
                        note.period = 428; // C-3
                        note.sample = 1;
                    }
                } else if (ch === 1) { // Hi-hat on off-beats
                    if (row % 4 === 2) {
                        note.period = 428;
                        note.sample = 2;
                    }
                } else if (ch === 2) { // Bass line
                    if (row % 8 === 0 || row % 8 === 3 || row % 8 === 6) {
                        note.period = row % 16 < 8 ? 428 : 360; // C-3 or E-3
                        note.sample = 3;
                    }
                } else if (ch === 3) { // Lead
                    if (row % 16 === 12 || row % 16 === 14) {
                        note.period = 285; // A-3
                        note.sample = 4;
                    }
                }
                
                this.pt.note[0][row * 4 + ch] = note;
            }
        }
        
        this.pt.initialize();
        console.log('Created simple MOD pattern');
    }
    
    start() {
        if (!this.audioContext || !this.pt || !this.initialized) {
            console.log('Audio system not ready');
            return false;
        }
        
        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.isPlaying = true;
            this.pt.initialize();
            
            if (this.scriptNode && !this.scriptNode.connected) {
                this.scriptNode.connect(this.masterGain);
                this.scriptNode.connected = true;
            }
            
            console.log('MOD player started successfully');
            return true;
        } catch (error) {
            console.error('Failed to start MOD player:', error);
            return false;
        }
    }
    
    stop() {
        this.isPlaying = false;
        if (this.scriptNode && this.scriptNode.connected) {
            this.scriptNode.disconnect();
            this.scriptNode.connected = false;
        }
        console.log('MOD player stopped');
    }
    
    toggle() {
        if (this.isPlaying) {
            this.stop();
            return false;
        } else {
            this.start();
            return true;
        }
    }
    
    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = volume;
        }
    }
}

// Global MOD player instance
let modPlayer = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing MOD player...');
    
    modPlayer = new ModPlayer();
    
    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Try to load a MOD file, fallback to generated pattern
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
                console.log('❌ Demo MOD failed, creating simple pattern...');
                modPlayer.createSimplePattern();
                if (attribution) {
                    attribution.innerHTML = '<em>Music: "DemoCard Tracker" (Generated)</em>';
                }
            }
        }
    } catch (error) {
        console.error('❌ All MOD loading failed, falling back to simple player');
        if (attribution) {
            attribution.innerHTML = '<em>Music: Simple Tracker (Fallback)</em>';
        }
        
        // Use simple player as final fallback
        if (typeof simpleModPlayer !== 'undefined') {
            modPlayer = simpleModPlayer;
            console.log('Using simple MOD player as fallback');
        }
    }
    
    const soundButton = document.getElementById('sound-toggle');
    if (soundButton) {
        // Remove any existing listeners by cloning the button
        const newSoundButton = soundButton.cloneNode(true);
        soundButton.parentNode.replaceChild(newSoundButton, soundButton);
        
        newSoundButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('MOD player sound button clicked');
            
            if (modPlayer && (modPlayer.initialized || modPlayer.audioContext)) {
                const isPlaying = modPlayer.toggle();
                newSoundButton.textContent = isPlaying ? 'SOUND: ON' : 'SOUND: OFF';
                console.log('MOD player toggled:', isPlaying ? 'ON' : 'OFF');
            } else {
                console.error('MOD player not ready');
            }
        });
        
        // Auto-start music after a short delay
        setTimeout(() => {
            console.log('Auto-starting MOD player...');
            if (modPlayer && (modPlayer.initialized || modPlayer.audioContext)) {
                const started = modPlayer.start();
                if (started !== false) {
                    newSoundButton.textContent = 'SOUND: ON';
                }
            } else {
                console.error('MOD player not ready for auto-start');
            }
        }, 2000);
    } else {
        console.log('Sound button not found');
    }
});