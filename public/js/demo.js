class DemoScene {
    constructor() {
        this.canvas = document.getElementById('demo-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.time = 0;
        this.stars = [];
        
        // Vector balls - classic demo effect
        this.vectorBalls = [];
        this.initVectorBalls();
        
        // 3D rotating cube with bouncing
        this.cubeRotX = 0;
        this.cubeRotY = 0;
        this.cubeRotZ = 0;
        this.cubeX = this.canvas?.width / 2 || 400;
        this.cubeY = this.canvas?.height / 2 || 300;
        this.cubeVx = 2;
        this.cubeVy = 1.5;
        this.cubeSize = 100;
        
        // 3D rotating torus with bouncing
        this.torusRotX = 0;
        this.torusRotY = 0;
        this.torusRotZ = 0;
        this.torusX = this.canvas?.width / 4 || 200;
        this.torusY = this.canvas?.height / 4 || 150;
        this.torusVx = 1.5;
        this.torusVy = 2;
        this.torusOuterRadius = 120;
        this.torusInnerRadius = 50;
        
        // Bouncing text properties
        this.text = 'dpark.ai';
        this.textX = 100;
        this.textY = 100;
        this.textVx = 4;
        this.textVy = 3;
        this.textSize = 120;
        this.textColor = 0;
        this.textScale = 1;
        this.textScaleDir = 0.01;
        
        // Sine wave scrollers
        this.scrollers = [
            { text: '*** BROUGHT TO YOU BY CLAUDE CODE! ***', y: this.canvas?.height - 50 || 550, speed: 2, amplitude: 15 }
        ];
        
        // Set boundary above scroller (scroller at height-50, boundary at height-100)
        this.scrollerBoundary = this.canvas?.height - 100 || 500;
        
        this.resize();
        this.initStars();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // Update scroller position on resize
        this.scrollers[0].y = this.canvas.height - 50;
        this.scrollerBoundary = this.canvas.height - 100;
        
        // Update cube and ball positions on resize
        this.cubeX = this.canvas.width / 2;
        this.cubeY = this.canvas.height / 2;
        this.torusX = this.canvas.width / 4;
        this.torusY = this.canvas.height / 4;
    }
    
    initStars() {
        this.stars = [];
        // Increased density from 150 to 300 stars
        for (let i = 0; i < 300; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                z: Math.random() * 1000 + 1,
                size: Math.random() * 2 + 0.5
            });
        }
    }
    
    
    initVectorBalls() {
        this.vectorBalls = [];
        for (let i = 0; i < 4; i++) {
            this.vectorBalls.push({
                angle: (i * Math.PI * 2) / 4,
                radius: 150 + Math.random() * 80, // Increased from 100+50 to 150+80
                speed: 0.02 + Math.random() * 0.03,
                size: 25 + Math.random() * 15, // Increased from 15+10 to 25+15
                colorOffset: i * 45,
                // Add bouncing properties
                centerX: this.canvas?.width / 2 || 400,
                centerY: this.canvas?.height / 2 || 300,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3
            });
        }
    }
    
    
    drawStarfield() {
        this.stars.forEach(star => {
            // Increased speed by 30%: 4 * 1.3 = 5.2
            star.z -= 5.2;
            if (star.z <= 0) {
                star.z = 1000;
                star.x = Math.random() * this.canvas.width;
                star.y = Math.random() * this.canvas.height;
            }
            
            const x = (star.x - this.centerX) * (1000 / star.z) + this.centerX;
            const y = (star.y - this.centerY) * (1000 / star.z) + this.centerY;
            const size = star.size * (1000 / star.z);
            const brightness = 1000 / star.z;
            
            if (x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height && brightness > 0.3) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
                this.ctx.fillRect(x - size/2, y - size/2, size, size);
                
                // Add trails for fast stars (only if star is moving fast and fully visible)
                if (brightness > 0.8 && x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height) {
                    // Calculate trail direction (toward center of screen)
                    const dirX = this.centerX - x;
                    const dirY = this.centerY - y;
                    const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
                    
                    if (dirLength > 0) {
                        // Normalize direction
                        const normX = dirX / dirLength;
                        const normY = dirY / dirLength;
                        
                        // Trail length based on star size
                        const trailLength = size * 2;
                        
                        // Calculate trail end position
                        const trailEndX = x + normX * trailLength;
                        const trailEndY = y + normY * trailLength;
                        
                        // Only draw trail if both start and end are reasonable
                        if (trailEndX >= -10 && trailEndX <= this.canvas.width + 10 && 
                            trailEndY >= -10 && trailEndY <= this.canvas.height + 10) {
                            this.ctx.strokeStyle = `rgba(255, 255, 255, ${brightness * 0.2})`;
                            this.ctx.lineWidth = Math.max(1, size / 3);
                            this.ctx.beginPath();
                            this.ctx.moveTo(x, y);
                            this.ctx.lineTo(trailEndX, trailEndY);
                            this.ctx.stroke();
                        }
                    }
                }
            }
        });
    }
    
    drawSineScrollers() {
        this.scrollers.forEach((scroller, index) => {
            this.ctx.font = 'bold 48px monospace';
            this.ctx.fillStyle = `hsl(${(this.time * 2 + index * 60) % 360}, 100%, 70%)`;
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.shadowBlur = 10;
            
            // Calculate total width based on character spacing
            const totalWidth = scroller.text.length * 32;
            const cycleWidth = this.canvas.width + totalWidth;
            
            // Simple right-to-left scrolling
            let scrollPosition = (this.time * scroller.speed) % cycleWidth;
            let startX = this.canvas.width - scrollPosition;
            
            for (let i = 0; i < scroller.text.length; i++) {
                const char = scroller.text[i];
                const charX = startX + i * 32;
                const charY = scroller.y + Math.sin((this.time * 0.1) + (i * 0.5)) * scroller.amplitude;
                
                // Show characters that are visible on screen (with some margin)
                if (charX > -100 && charX < this.canvas.width + 100) {
                    this.ctx.fillText(char, charX, charY);
                }
            }
            
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawBouncingText() {
        // Update text scaling
        this.textScale += this.textScaleDir;
        if (this.textScale > 1.3 || this.textScale < 0.8) {
            this.textScaleDir *= -1;
        }
        
        // Update text position
        this.textX += this.textVx;
        this.textY += this.textVy;
        
        // Calculate text dimensions with scaling
        const scaledSize = this.textSize * this.textScale;
        this.ctx.font = `bold ${scaledSize}px Impact, Arial Black, monospace`;
        const textWidth = this.ctx.measureText(this.text).width;
        const textHeight = scaledSize;
        
        // Bounce off walls with some padding
        const padding = 20;
        if (this.textX + textWidth > this.canvas.width - padding || this.textX < padding) {
            this.textVx *= -1;
            this.textX = Math.max(padding, Math.min(this.canvas.width - textWidth - padding, this.textX));
        }
        if (this.textY > this.scrollerBoundary - padding || this.textY < textHeight + padding) {
            this.textVy *= -1;
            this.textY = Math.max(textHeight + padding, Math.min(this.scrollerBoundary - padding, this.textY));
        }
        
        // Cycle through colors faster
        this.textColor += 3;
        const hue1 = (this.textColor % 360);
        const hue2 = ((this.textColor + 120) % 360);
        
        // Create gradient effect
        const gradient = this.ctx.createLinearGradient(this.textX, this.textY - textHeight, this.textX + textWidth, this.textY);
        gradient.addColorStop(0, `hsl(${hue1}, 100%, 60%)`);
        gradient.addColorStop(0.5, `hsl(${hue2}, 100%, 80%)`);
        gradient.addColorStop(1, `hsl(${hue1}, 100%, 60%)`);
        
        // Draw multiple layers for depth
        for (let i = 5; i >= 0; i--) {
            const offset = i * 2;
            const alpha = (6 - i) / 6;
            
            this.ctx.font = `bold ${scaledSize}px Impact, Arial Black, monospace`;
            
            if (i === 0) {
                // Main text
                this.ctx.fillStyle = gradient;
                this.ctx.shadowColor = `hsl(${hue1}, 100%, 50%)`;
                this.ctx.shadowBlur = 30;
            } else {
                // Shadow layers
                this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.3})`;
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.fillText(this.text, this.textX + offset, this.textY + offset);
        }
        
        // Add chrome/metallic outline
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 0;
        this.ctx.strokeText(this.text, this.textX, this.textY);
        
        // Add inner highlight
        this.ctx.strokeStyle = `hsl(${hue2}, 100%, 90%)`;
        this.ctx.lineWidth = 1;
        this.ctx.strokeText(this.text, this.textX, this.textY);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    drawVectorBalls() {
        this.vectorBalls.forEach(ball => {
            ball.angle += ball.speed;
            
            // Update bouncing center positions
            ball.centerX += ball.vx;
            ball.centerY += ball.vy;
            
            // Bounce off walls
            if (ball.centerX + ball.radius > this.canvas.width || ball.centerX - ball.radius < 0) {
                ball.vx *= -1;
                ball.centerX = Math.max(ball.radius, Math.min(this.canvas.width - ball.radius, ball.centerX));
            }
            if (ball.centerY + ball.radius > this.scrollerBoundary || ball.centerY - ball.radius < 0) {
                ball.vy *= -1;
                ball.centerY = Math.max(ball.radius, Math.min(this.scrollerBoundary - ball.radius, ball.centerY));
            }
            
            const x = ball.centerX + Math.cos(ball.angle) * ball.radius;
            const y = ball.centerY + Math.sin(ball.angle) * ball.radius * 0.6; // Elliptical motion
            
            const hue = (this.time * 2 + ball.colorOffset) % 360;
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, ball.size);
            gradient.addColorStop(0, `hsl(${hue}, 100%, 80%)`);
            gradient.addColorStop(0.7, `hsl(${hue}, 100%, 40%)`);
            gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, ball.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add connecting lines between balls
            this.vectorBalls.forEach(otherBall => {
                if (ball !== otherBall) {
                    const otherX = otherBall.centerX + Math.cos(otherBall.angle) * otherBall.radius;
                    const otherY = otherBall.centerY + Math.sin(otherBall.angle) * otherBall.radius * 0.6;
                    const distance = Math.sqrt((x - otherX) ** 2 + (y - otherY) ** 2);
                    
                    if (distance < 150) {
                        const alpha = 1 - (distance / 150);
                        this.ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${alpha * 0.3})`;
                        this.ctx.lineWidth = 1;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x, y);
                        this.ctx.lineTo(otherX, otherY);
                        this.ctx.stroke();
                    }
                }
            });
        });
    }
    
    drawRotatingCube() {
        this.cubeRotX += 0.01;
        this.cubeRotY += 0.015;
        this.cubeRotZ += 0.008;
        
        // Update bouncing position
        this.cubeX += this.cubeVx;
        this.cubeY += this.cubeVy;
        
        // Bounce off walls
        if (this.cubeX + this.cubeSize > this.canvas.width || this.cubeX - this.cubeSize < 0) {
            this.cubeVx *= -1;
            this.cubeX = Math.max(this.cubeSize, Math.min(this.canvas.width - this.cubeSize, this.cubeX));
        }
        if (this.cubeY + this.cubeSize > this.scrollerBoundary || this.cubeY - this.cubeSize < 0) {
            this.cubeVy *= -1;
            this.cubeY = Math.max(this.cubeSize, Math.min(this.scrollerBoundary - this.cubeSize, this.cubeY));
        }
        
        // Cube vertices - increased size
        const size = this.cubeSize;
        const vertices = [
            [-size, -size, -size], [size, -size, -size], [size, size, -size], [-size, size, -size],
            [-size, -size, size], [size, -size, size], [size, size, size], [-size, size, size]
        ];
        
        // Rotation matrices
        const cosX = Math.cos(this.cubeRotX), sinX = Math.sin(this.cubeRotX);
        const cosY = Math.cos(this.cubeRotY), sinY = Math.sin(this.cubeRotY);
        const cosZ = Math.cos(this.cubeRotZ), sinZ = Math.sin(this.cubeRotZ);
        
        // Transform vertices
        const transformed = vertices.map(([x, y, z]) => {
            // Rotate around X axis
            let y1 = y * cosX - z * sinX;
            let z1 = y * sinX + z * cosX;
            
            // Rotate around Y axis
            let x2 = x * cosY + z1 * sinY;
            let z2 = -x * sinY + z1 * cosY;
            
            // Rotate around Z axis
            let x3 = x2 * cosZ - y1 * sinZ;
            let y3 = x2 * sinZ + y1 * cosZ;
            
            // Project to 2D (simple perspective)
            const distance = 200;
            const scale = distance / (distance + z2);
            return {
                x: this.cubeX + x3 * scale,
                y: this.cubeY + y3 * scale,
                z: z2
            };
        });
        
        // Draw cube edges
        const edges = [
            [0,1], [1,2], [2,3], [3,0], // back face
            [4,5], [5,6], [6,7], [7,4], // front face
            [0,4], [1,5], [2,6], [3,7]  // connecting edges
        ];
        
        this.ctx.strokeStyle = `hsl(${(this.time * 3) % 360}, 100%, 70%)`;
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = this.ctx.strokeStyle;
        this.ctx.shadowBlur = 5;
        
        edges.forEach(([start, end]) => {
            const startPoint = transformed[start];
            const endPoint = transformed[end];
            
            this.ctx.beginPath();
            this.ctx.moveTo(startPoint.x, startPoint.y);
            this.ctx.lineTo(endPoint.x, endPoint.y);
            this.ctx.stroke();
        });
        
        this.ctx.shadowBlur = 0;
    }
    
    drawRotatingTorus() {
        this.torusRotX += 0.02;
        this.torusRotY += 0.025;
        this.torusRotZ += 0.015;
        
        // Update bouncing position
        this.torusX += this.torusVx;
        this.torusY += this.torusVy;
        
        // Bounce off walls
        const torusSize = this.torusOuterRadius;
        if (this.torusX + torusSize > this.canvas.width || this.torusX - torusSize < 0) {
            this.torusVx *= -1;
            this.torusX = Math.max(torusSize, Math.min(this.canvas.width - torusSize, this.torusX));
        }
        if (this.torusY + torusSize > this.scrollerBoundary || this.torusY - torusSize < 0) {
            this.torusVy *= -1;
            this.torusY = Math.max(torusSize, Math.min(this.scrollerBoundary - torusSize, this.torusY));
        }
        
        // Generate torus vertices
        const majorSegments = 16; // Number of segments around the major radius
        const minorSegments = 8;  // Number of segments around the minor radius
        const vertices = [];
        
        for (let i = 0; i < majorSegments; i++) {
            for (let j = 0; j < minorSegments; j++) {
                const u = (i / majorSegments) * Math.PI * 2;
                const v = (j / minorSegments) * Math.PI * 2;
                
                // Torus parametric equations
                const x = (this.torusOuterRadius + this.torusInnerRadius * Math.cos(v)) * Math.cos(u);
                const y = (this.torusOuterRadius + this.torusInnerRadius * Math.cos(v)) * Math.sin(u);
                const z = this.torusInnerRadius * Math.sin(v);
                
                vertices.push([x, y, z]);
            }
        }
        
        // Rotation matrices
        const cosX = Math.cos(this.torusRotX), sinX = Math.sin(this.torusRotX);
        const cosY = Math.cos(this.torusRotY), sinY = Math.sin(this.torusRotY);
        const cosZ = Math.cos(this.torusRotZ), sinZ = Math.sin(this.torusRotZ);
        
        // Transform vertices
        const transformed = vertices.map(([x, y, z]) => {
            // Rotate around X axis
            let y1 = y * cosX - z * sinX;
            let z1 = y * sinX + z * cosX;
            
            // Rotate around Y axis
            let x2 = x * cosY + z1 * sinY;
            let z2 = -x * sinY + z1 * cosY;
            
            // Rotate around Z axis
            let x3 = x2 * cosZ - y1 * sinZ;
            let y3 = x2 * sinZ + y1 * cosZ;
            
            // Project to 2D (simple perspective)
            const distance = 300;
            const scale = distance / (distance + z2);
            return {
                x: this.torusX + x3 * scale,
                y: this.torusY + y3 * scale,
                z: z2,
                scale: scale
            };
        });
        
        // Draw torus wireframe
        this.ctx.strokeStyle = `hsl(${(this.time * 4 + 180) % 360}, 100%, 60%)`;
        this.ctx.lineWidth = 1.5;
        this.ctx.shadowColor = this.ctx.strokeStyle;
        this.ctx.shadowBlur = 3;
        
        // Draw major circles (around the torus)
        for (let i = 0; i < majorSegments; i++) {
            for (let j = 0; j < minorSegments; j++) {
                const current = i * minorSegments + j;
                const next = i * minorSegments + ((j + 1) % minorSegments);
                
                const currentPoint = transformed[current];
                const nextPoint = transformed[next];
                
                // Only draw if both points are reasonably visible
                if (currentPoint.scale > 0.3 && nextPoint.scale > 0.3) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(currentPoint.x, currentPoint.y);
                    this.ctx.lineTo(nextPoint.x, nextPoint.y);
                    this.ctx.stroke();
                }
            }
        }
        
        // Draw minor circles (through the torus)
        for (let j = 0; j < minorSegments; j++) {
            for (let i = 0; i < majorSegments; i++) {
                const current = i * minorSegments + j;
                const next = ((i + 1) % majorSegments) * minorSegments + j;
                
                const currentPoint = transformed[current];
                const nextPoint = transformed[next];
                
                // Only draw if both points are reasonably visible
                if (currentPoint.scale > 0.3 && nextPoint.scale > 0.3) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(currentPoint.x, currentPoint.y);
                    this.ctx.lineTo(nextPoint.x, nextPoint.y);
                    this.ctx.stroke();
                }
            }
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    animate() {
        this.time++;
        
        // Clear with slight fade for trail effects
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw effects in layers
        this.drawStarfield();
        this.drawVectorBalls();
        this.drawRotatingCube();
        this.drawRotatingTorus();
        this.drawSineScrollers();
        this.drawBouncingText();
        
        requestAnimationFrame(() => this.animate());
    }
    
    start() {
        this.animate();
    }
}

// Initialize demo scene when page loads
document.addEventListener('DOMContentLoaded', () => {
    const versionInfo = typeof VERSION_CONFIG !== 'undefined' ? ` v${VERSION_CONFIG.version}` : '';
    console.log(`🎮 Starting Demo Scene${versionInfo}...`);
    
    const demo = new DemoScene();
    demo.start();
    
    console.log(`✅ Demo Scene${versionInfo} running successfully!`);
});