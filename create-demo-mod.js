// Simple MOD file creator for demo purposes
const fs = require('fs');

function createDemoMod() {
    const buffer = Buffer.alloc(1084 + 1024 + 8000); // Header + pattern + samples
    let offset = 0;
    
    // Title (20 bytes)
    buffer.write('DemoCard Tracker    ', offset, 'ascii');
    offset += 20;
    
    // Sample info (31 samples * 30 bytes each)
    for (let i = 0; i < 31; i++) {
        const sampleName = i === 0 ? 'Kick            ' : 
                          i === 1 ? 'HiHat           ' :
                          i === 2 ? 'Bass            ' :
                          i === 3 ? 'Lead            ' : '';
        
        buffer.write(sampleName.padEnd(22, '\0'), offset, 'ascii'); // Name
        offset += 22;
        
        if (i < 4) {
            buffer.writeUInt16BE(500, offset); // Length (500 words = 1000 bytes)
            offset += 2;
            buffer.writeUInt8(0, offset); // Finetune
            offset += 1;
            buffer.writeUInt8(64, offset); // Volume
            offset += 1;
            buffer.writeUInt16BE(0, offset); // Repeat point
            offset += 2;
            buffer.writeUInt16BE(1, offset); // Repeat length
            offset += 2;
        } else {
            buffer.writeUInt16BE(0, offset); // Length
            offset += 2;
            buffer.writeUInt8(0, offset); // Finetune
            offset += 1;
            buffer.writeUInt8(0, offset); // Volume
            offset += 1;
            buffer.writeUInt16BE(0, offset); // Repeat point
            offset += 2;
            buffer.writeUInt16BE(0, offset); // Repeat length
            offset += 2;
        }
    }
    
    // Song length
    buffer.writeUInt8(1, offset);
    offset += 1;
    
    // Restart position
    buffer.writeUInt8(0, offset);
    offset += 1;
    
    // Pattern list (128 bytes)
    buffer.writeUInt8(0, offset); // Pattern 0
    for (let i = 1; i < 128; i++) {
        buffer.writeUInt8(0, offset + i);
    }
    offset += 128;
    
    // MOD format tag
    buffer.write('M.K.', offset, 'ascii');
    offset += 4;
    
    // Pattern data (64 rows * 4 channels * 4 bytes)
    for (let row = 0; row < 64; row++) {
        for (let ch = 0; ch < 4; ch++) {
            let period = 0, sample = 0, effect = 0, effectdata = 0;
            
            // Simple techno pattern
            if (ch === 0 && (row % 16 === 0 || row % 16 === 8)) { // Kick
                period = 428; // C-3
                sample = 1;
            } else if (ch === 1 && row % 4 === 2) { // Hi-hat
                period = 428;
                sample = 2;
            } else if (ch === 2 && (row % 8 === 0 || row % 8 === 3 || row % 8 === 6)) { // Bass
                period = row % 16 < 8 ? 428 : 360; // C-3 or E-3
                sample = 3;
            } else if (ch === 3 && (row % 16 === 12 || row % 16 === 14)) { // Lead
                period = 285; // A-3
                sample = 4;
            }
            
            // Write note data in MOD format
            buffer.writeUInt8((sample & 0xf0) | ((period >> 8) & 0x0f), offset);
            buffer.writeUInt8(period & 0xff, offset + 1);
            buffer.writeUInt8(((sample & 0x0f) << 4) | (effect & 0x0f), offset + 2);
            buffer.writeUInt8(effectdata & 0xff, offset + 3);
            offset += 4;
        }
    }
    
    // Sample data (4 samples * 1000 bytes each)
    for (let s = 0; s < 4; s++) {
        for (let i = 0; i < 1000; i++) {
            let sample = 0;
            if (s === 0) { // Kick
                const freq = 0.1 * (1 - i / 1000);
                sample = Math.sin(i * freq) * 127 * (1 - i / 1000);
            } else if (s === 1) { // Hi-hat
                sample = (Math.random() - 0.5) * 127 * (1 - i / 1000);
            } else if (s === 2) { // Bass
                sample = ((i % 20) < 10 ? 64 : -64);
            } else if (s === 3) { // Lead
                sample = ((i % 40) < 20 ? 32 : -32);
            }
            buffer.writeInt8(Math.max(-128, Math.min(127, sample)), offset);
            offset += 1;
        }
    }
    
    return buffer;
}

// Create and save the MOD file
const modData = createDemoMod();
fs.writeFileSync('./public/mods/demo.mod', modData);
console.log('Created demo.mod file (', modData.length, 'bytes)');