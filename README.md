# DemoCard - 2000s Demo Scene Intro

A nostalgic tribute to the 2000s PC demo scene, featuring classic visual effects and **authentic Future Crew tracker music**. This single-page application recreates the aesthetic and technical artistry of legendary demo groups, featuring Purple Motion's "Sundance" from Assembly 1993.

## Features

### Visual Effects
- **Bouncing Logo**: "dpark.ai" text with 3D gradient effects, scaling animation, and realistic physics
- **Vector Balls**: 4 glowing orbs moving in elliptical patterns with independent bouncing physics
- **3D Wireframe Cube**: Rotating cube with perspective projection and bouncing collision physics
- **3D Wireframe Torus**: Parametric torus with triple-axis rotation and independent bouncing
- **Enhanced Starfield**: 300 stars with realistic radial motion trails and 30% faster movement
- **Sine Wave Scroller**: "Brought to you by Claude Code!" with enhanced amplitude waves
- **Scroller Boundary System**: Invisible barrier prevents object interference with bottom text

### Audio
- **Authentic MOD Music**: "Sundance" by Purple Motion / Future Crew (1993)
- **4-Tier Fallback System**: Sundance → Techno Slice → Generated → Synthesized
- **Assembly 1993 Heritage**: Original competition track from legendary Assembly demoparty
- **Sound Toggle**: Button defaults to OFF, respects user preferences and autoplay policies
- **Seamless Looping**: Automatic song restart for continuous playback

### Technical Features
- Canvas-based rendering for smooth 60fps animations
- Authentic 2000s demo scene color palette (greens, blues, cyans)
- Responsive design that works on all screen sizes
- AtornbladModPlayer for authentic MOD file playback
- Comprehensive version management system (v2.2.0)
- Professional server management with rate limiting

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm

### Installation & Running

1. **Clone or download** this repository
2. **Navigate** to the project directory:
   ```bash
   cd democard
   ```

3. **Start the server** using the included script:
   ```bash
   ./start-server.sh start
   ```

4. **Open your browser** and visit:
   ```
   http://localhost:3000
   ```

### Server Management

The project includes a convenient server management script:

```bash
# Start the server
./start-server.sh start

# Stop the server
./start-server.sh stop

# Check server status
./start-server.sh status

# Restart the server
./start-server.sh restart
```

The server runs in the background, so you can continue using your terminal while the demo is running.

### Manual Installation (Alternative)

If you prefer to run commands manually:

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

## Project Structure

```
democard/
├── server.js                          # Express server with rate limiting
├── package.json                       # Node.js configuration
├── start-server.sh                    # Server management script
├── nodejs-security-rule.yaml          # Custom Semgrep security rules
├── PROJECT_SUMMARY.md                 # Comprehensive development history
├── public/                            # Static files
│   ├── index.html                     # Main HTML page
│   ├── css/
│   │   └── style.css                  # Demo scene styling with version badge
│   ├── js/
│   │   ├── demo.js                    # Main demo engine with torus & boundary
│   │   ├── version.js                 # Central version configuration (v2.2.0)
│   │   ├── version-init.js            # Version initialization & display
│   │   ├── atornblad-mod-player.js    # Primary MOD player (with looping)
│   │   ├── mod-player.js              # ProTracker fallback player
│   │   ├── bassoon-mod-player.js      # BassoonTracker fallback player
│   │   ├── simple-mod-player.js       # Synthesized fallback player
│   │   ├── main.js                    # Additional interactive features
│   │   └── lib/                       # External libraries
│   ├── mods/                          # Tracker music files
│   │   ├── sundance.mod               # Purple Motion / Future Crew (1993) [PRIMARY]
│   │   ├── techno-slice.mod           # Dennis Mundt (1993) [FALLBACK 1]
│   │   └── demo.mod                   # Generated fallback MOD [FALLBACK 2]
│   ├── images/                        # Assets directory
│   └── fonts/                         # Custom fonts directory
└── README.md                          # This file
```

## Technical Details

### Demo Effects
- **Vector Balls**: Physics-based circular motion with independent bouncing physics
- **3D Cube**: Matrix transformations for 3D rotation with collision detection
- **3D Torus**: Parametric torus geometry with 16 major × 8 minor segments
- **Starfield**: Z-buffer depth simulation with realistic radial motion trails
- **Text Effects**: Multi-layer rendering for 3D text with gradient effects
- **Scroller Boundary**: Invisible collision system prevents object interference

### Audio System
- **MOD File Support**: AtornbladModPlayer for authentic 4-channel ProTracker playback
- **Future Crew Heritage**: "Sundance" by Purple Motion from Assembly 1993
- **4-Tier Fallback**: Robust system ensures music always plays
- **Format Compatibility**: MOD format specifically verified for player compatibility
- **Loop Monitoring**: Automatic song restart when tracks end (500ms polling)

### Performance
- Optimized canvas rendering with selective updates
- 60fps target frame rate
- Memory-efficient particle systems
- Background server processing

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

**Note**: Web Audio API requires user interaction to start. The music will auto-start after page load, but you may need to click the sound button if it doesn't start automatically.

## Controls

- **Sound Button**: Click "SOUND: ON/OFF" in the top-left to toggle music
- **Keyboard Shortcuts** (from browser console):
  - `M` - Trigger matrix rain effect
  - `S` - Play sound effect
  - `R` - Reload demo

## Demo Scene Heritage

This project pays homage to the PC demo scene of the 1990s and 2000s, featuring **authentic music** from legendary groups:

- **Purple Motion / Future Crew**: "Sundance" from Assembly 1993 PC Music competition
- **Assembly Heritage**: Original competition track from Finland's premier demoparty
- **Format Authenticity**: 4-channel ProTracker MOD format from the golden era
- **Classic Effects**: Vector balls, 3D wireframes, starfields, and sine wave scrollers
- **Technical Artistry**: Real-time effects honoring the constraints and creativity of the era

**Authentic Demoscene Credits:**
- Music: "Sundance" by Purple Motion / Future Crew (1993)
- Fallback: "Techno Slice" by Dennis Mundt (1993)
- Visual Design: Inspired by classic PC demos and the legendary "Second Reality"

## Development

The project uses vanilla JavaScript and Canvas API for maximum compatibility and performance. No build process required - just edit the files and refresh your browser.

### Adding New Effects

1. Create effect functions in `public/js/demo.js`
2. Add them to the animation loop in the `animate()` method
3. Initialize any required data in the constructor

### Modifying Music

Edit the patterns in `public/js/audio.js`:
- Change `this.pattern` arrays for different rhythms
- Modify instrument functions for different sounds
- Adjust `this.tempo` for speed changes

## Security

### Static Security Analysis

The project includes a comprehensive custom Semgrep rule (`nodejs-security-rule.yaml`) that scans for common Node.js security vulnerabilities:

#### Security Rules Coverage
- **SQL Injection** - Detects unsafe database query construction
- **Command Injection** - Identifies dangerous system command execution
- **Path Traversal** - Catches unsafe file system operations
- **Unsafe Code Evaluation** - Warns about `eval()` and dynamic code execution
- **Weak Cryptography** - Flags broken hash algorithms (MD5, SHA1)
- **Hardcoded Secrets** - Detects embedded API keys and credentials

#### Running Security Scans

```bash
# Install Semgrep (if not already installed)
pip install semgrep

# Run security scan with custom rules
semgrep --config=nodejs-security-rule.yaml .

# Run with additional security rulesets
semgrep --config=p/security-audit --config=nodejs-security-rule.yaml .
```

#### Rule Details
Each security rule includes:
- OWASP Top 10 mappings for compliance
- CWE (Common Weakness Enumeration) classifications
- Fix suggestions and secure coding examples
- Risk ratings (Confidence/Impact/Likelihood)
- Security reference documentation

The custom rules are designed specifically for Node.js/JavaScript environments and complement Semgrep's built-in security rulesets.

## License

MIT License - Feel free to use this code for your own demo scene creations!

## Credits

Created with Claude Code - bringing the spirit of the demo scene to modern web development.

**Special Thanks:**
- **Purple Motion (Jonne Valtonen)** - For the legendary "Sundance" track and Future Crew legacy
- **Future Crew** - For inspiring generations of demosceners with classics like "Second Reality"
- **Assembly Demoparty** - For fostering the creative community that made this music possible
- **ModArchive.org** - For preserving demoscene music heritage for future generations

---

*"Greetings to Purple Motion, Future Crew, and all demo sceners - keep the scene alive!"*
