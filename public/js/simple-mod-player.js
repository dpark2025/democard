// Simplified MOD-style tracker music player
class SimpleModPlayer {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.masterGain = null;
        this.oscillators = [];
        this.currentStep = 0;
        this.bpm = 125;
        this.intervalId = null;
        
        // Simple 4-channel pattern (kick, hat, bass, lead)
        this.pattern = [
            // Channel 0: Kick drum
            { steps: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], type: 'kick' },
            // Channel 1: Hi-hat
            { steps: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], type: 'hihat' },
            // Channel 2: Bass
            { steps: [1,0,1,0, 0,1,0,0, 1,0,1,0, 0,1,0,0], type: 'bass' },
            // Channel 3: Lead
            { steps: [0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,1,0], type: 'lead' }
        ];
        
        this.initAudioContext();
    }
    
    async initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.25;
            console.log('Simple MOD player initialized');
        } catch (error) {
            console.error('Audio context creation failed:', error);
        }
    }
    
    createKick(time) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, time);
        osc.frequency.exponentialRampToValueAtTime(0.1, time + 0.5);
        
        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(time);
        osc.stop(time + 0.5);
    }
    
    createHiHat(time) {
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        noise.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(8000, time);
        
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(time);
        noise.stop(time + 0.1);
    }
    
    createBass(time) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        const notes = [65, 65, 82, 65]; // C2, C2, E2, C2
        const frequency = notes[this.currentStep % 4];
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(frequency, time);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, time);
        filter.Q.setValueAtTime(5, time);
        
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(time);
        osc.stop(time + 0.3);
    }
    
    createLead(time) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        const notes = [262, 294, 330, 392]; // C4, D4, E4, G4
        const frequency = notes[this.currentStep % 4];
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(frequency, time);
        
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(time);
        osc.stop(time + 0.2);
    }
    
    playStep() {
        if (!this.audioContext || !this.isPlaying) return;
        
        const currentTime = this.audioContext.currentTime;
        
        this.pattern.forEach(track => {
            if (track.steps[this.currentStep]) {
                switch (track.type) {
                    case 'kick':
                        this.createKick(currentTime);
                        break;
                    case 'hihat':
                        this.createHiHat(currentTime);
                        break;
                    case 'bass':
                        this.createBass(currentTime);
                        break;
                    case 'lead':
                        this.createLead(currentTime);
                        break;
                }
            }
        });
        
        this.currentStep = (this.currentStep + 1) % 16;
    }
    
    start() {
        if (!this.audioContext) {
            console.error('Audio context not available');
            return;
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isPlaying = true;
        this.currentStep = 0;
        
        const stepTime = (60 / this.bpm / 4) * 1000; // 16th notes
        
        this.intervalId = setInterval(() => {
            this.playStep();
        }, stepTime);
        
        console.log('Simple MOD player started');
    }
    
    stop() {
        this.isPlaying = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('Simple MOD player stopped');
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
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
            console.log(`🔊 Simple player volume set to ${Math.round(volume * 100)}%`);
        }
    }
}

// Global instance
let simpleModPlayer = null;

// Initialize only - no auto-start or button handling
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎵 Simple MOD Player ready as fallback');
    simpleModPlayer = new SimpleModPlayer();
});