class TrackerMusic {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.masterGain = null;
        this.tracks = [];
        this.tempo = 120; // BPM
        this.currentStep = 0;
        this.pattern = [];
        this.intervalId = null;
        
        this.initAudioContext();
        this.createPattern();
    }
    
    async initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3; // Lower volume
        } catch (error) {
            console.log('Web Audio API not supported');
        }
    }
    
    createPattern() {
        // Classic techno pattern - 16 steps
        this.pattern = [
            // Kick drum pattern
            { track: 'kick', steps: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] },
            // Hi-hat pattern  
            { track: 'hihat', steps: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0] },
            // Snare pattern
            { track: 'snare', steps: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0] },
            // Bass line
            { track: 'bass', steps: [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0] },
            // Lead synth
            { track: 'lead', steps: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0] }
        ];
    }
    
    createKick(time) {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.frequency.setValueAtTime(60, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, time);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(time);
        osc.stop(time + 0.5);
    }
    
    createHiHat(time) {
        if (!this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        // Generate white noise
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
    
    createSnare(time) {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // Generate noise for snare
        const bufferSize = this.audioContext.sampleRate * 0.2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        
        noise.buffer = buffer;
        
        // Tone component
        osc.frequency.setValueAtTime(200, time);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        
        // Noise component
        noiseGain.gain.setValueAtTime(0.5, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, time);
        
        osc.connect(filter);
        noise.connect(filter);
        filter.connect(gain);
        filter.connect(noiseGain);
        gain.connect(this.masterGain);
        noiseGain.connect(this.masterGain);
        
        osc.start(time);
        noise.start(time);
        osc.stop(time + 0.2);
        noise.stop(time + 0.2);
    }
    
    createBass(time, note = 60) {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(frequency, time);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, time);
        filter.frequency.exponentialRampToValueAtTime(200, time + 0.3);
        filter.Q.setValueAtTime(10, time);
        
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(time);
        osc.stop(time + 0.3);
    }
    
    createLead(time, note = 72) {
        if (!this.audioContext) return;
        
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        
        osc1.type = 'square';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(frequency, time);
        osc2.frequency.setValueAtTime(frequency * 1.01, time); // Slight detune
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, time);
        filter.Q.setValueAtTime(5, time);
        
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.5);
        osc2.stop(time + 0.5);
    }
    
    playStep() {
        if (!this.audioContext || !this.isPlaying) return;
        
        const currentTime = this.audioContext.currentTime;
        
        this.pattern.forEach(trackPattern => {
            if (trackPattern.steps[this.currentStep]) {
                switch (trackPattern.track) {
                    case 'kick':
                        this.createKick(currentTime);
                        break;
                    case 'hihat':
                        this.createHiHat(currentTime);
                        break;
                    case 'snare':
                        this.createSnare(currentTime);
                        break;
                    case 'bass':
                        // Simple bass line with different notes
                        const bassNotes = [36, 36, 43, 36]; // C2, C2, G2, C2
                        this.createBass(currentTime, bassNotes[this.currentStep % 4]);
                        break;
                    case 'lead':
                        // Simple lead melody
                        const leadNotes = [72, 74, 76, 79]; // C5, D5, E5, G5
                        this.createLead(currentTime, leadNotes[this.currentStep % 4]);
                        break;
                }
            }
        });
        
        this.currentStep = (this.currentStep + 1) % 16;
    }
    
    start() {
        if (!this.audioContext) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isPlaying = true;
        const stepTime = (60 / this.tempo / 4) * 1000; // 16th notes
        
        this.intervalId = setInterval(() => {
            this.playStep();
        }, stepTime);
    }
    
    stop() {
        this.isPlaying = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
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
}

// Global music instance
let trackerMusic = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    trackerMusic = new TrackerMusic();
    
    const soundButton = document.getElementById('sound-toggle');
    if (soundButton) {
        soundButton.addEventListener('click', () => {
            const isPlaying = trackerMusic.toggle();
            soundButton.textContent = isPlaying ? 'SOUND: ON' : 'SOUND: OFF';
        });
        
        // Auto-start music after a short delay
        setTimeout(() => {
            trackerMusic.start();
            soundButton.textContent = 'SOUND: ON';
        }, 1000);
    }
});