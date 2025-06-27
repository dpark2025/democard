// Simple MOD file test
async function testModFile() {
    console.log('=== MOD File Debug Test ===');
    
    try {
        const response = await fetch('./mods/techno-slice.mod');
        console.log('Fetch response:', response.status, response.statusText);
        
        if (!response.ok) {
            console.error('Failed to fetch MOD file');
            return;
        }
        
        const arrayBuffer = await response.arrayBuffer();
        console.log('File size:', arrayBuffer.byteLength, 'bytes');
        
        // Check if it's a valid MOD file
        const view = new DataView(arrayBuffer);
        
        // Check title (first 20 bytes)
        let title = '';
        for (let i = 0; i < 20; i++) {
            const b = view.getUint8(i);
            if (b === 0) break;
            title += String.fromCharCode(b);
        }
        console.log('MOD Title:', title);
        
        // Check signature at position 1080
        if (arrayBuffer.byteLength > 1083) {
            const sig = String.fromCharCode(
                view.getUint8(1080),
                view.getUint8(1081), 
                view.getUint8(1082),
                view.getUint8(1083)
            );
            console.log('MOD Signature:', sig);
            
            if (sig === 'M.K.') {
                console.log('✅ Valid 4-channel MOD file detected');
                
                // Try parsing with ProTracker
                const pt = new Protracker();
                pt.samplerate = 44100;
                
                console.log('Attempting to parse with ProTracker...');
                const success = pt.parse(arrayBuffer);
                
                if (success) {
                    console.log('✅ ProTracker parsing successful!');
                    console.log('Title:', pt.title);
                    console.log('Channels:', pt.channels);
                    console.log('Patterns:', pt.patterns);
                    console.log('Song length:', pt.songlen);
                    console.log('Sample count:', pt.sample ? pt.sample.length : 'undefined');
                } else {
                    console.error('❌ ProTracker parsing failed');
                }
            } else {
                console.error('❌ Invalid MOD signature:', sig);
            }
        } else {
            console.error('❌ File too small to be a MOD');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run test when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(testModFile, 500);
});