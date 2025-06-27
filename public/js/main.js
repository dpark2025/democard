// Additional interactive features
document.addEventListener('DOMContentLoaded', () => {
    
    // Add click sound effect simulation
    const playClickSound = () => {
        // Create audio context for retro beep sound
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        }
    };
    
    // Add hover effects and sounds to interactive elements
    const interactiveElements = document.querySelectorAll('.service-card, .contact-item');
    
    interactiveElements.forEach(element => {
        element.addEventListener('click', playClickSound);
        
        element.addEventListener('mouseenter', () => {
            element.style.transform = 'translateY(-5px) scale(1.05)';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add typing effect to tagline
    const tagline = document.querySelector('.tagline');
    if (tagline) {
        const originalText = tagline.textContent;
        tagline.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < originalText.length) {
                tagline.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };
        
        // Start typing effect after content becomes visible
        setTimeout(typeWriter, 3500);
    }
    
    // Add matrix rain effect to background occasionally
    const createMatrixRain = () => {
        const matrixChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const drops = [];
        const fontSize = 14;
        const columns = Math.floor(window.innerWidth / fontSize);
        
        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.opacity = '0.3';
        
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        const drawMatrix = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#00ff00';
            ctx.font = fontSize + 'px monospace';
            
            for (let i = 0; i < drops.length; i++) {
                const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };
        
        const matrixInterval = setInterval(drawMatrix, 35);
        
        // Remove matrix effect after 10 seconds
        setTimeout(() => {
            clearInterval(matrixInterval);
            document.body.removeChild(canvas);
        }, 10000);
    };
    
    // Randomly trigger matrix rain effect
    setTimeout(() => {
        if (Math.random() > 0.5) {
            createMatrixRain();
        }
    }, 8000);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            case 'm':
                createMatrixRain();
                break;
            case 's':
                playClickSound();
                break;
            case 'r':
                location.reload();
                break;
        }
    });
    
    // Show keyboard shortcuts hint
    setTimeout(() => {
        console.log('🎮 Demo Controls:');
        console.log('M - Matrix Rain');
        console.log('S - Sound Effect');
        console.log('R - Reload Demo');
    }, 5000);
});