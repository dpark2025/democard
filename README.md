# DemoCard - 2000s Demo Scene Intro

A nostalgic tribute to the 2000s PC demo scene, featuring classic visual effects and tracker music. This single-page application recreates the aesthetic and technical artistry of legendary demo groups like Future Crew.

## Features

### Visual Effects
- **Bouncing Logo**: "dpark" text with 3D gradient effects, scaling animation, and realistic physics
- **Plasma Background**: Classic real-time plasma effect with color cycling
- **Vector Balls**: 8 glowing orbs moving in elliptical patterns with connecting lines
- **3D Wireframe Cube**: Rotating cube with perspective projection and color cycling
- **Starfield**: Moving stars with trails for fast-moving objects
- **Sine Wave Scroller**: "Brought to you by Claude Code!" text scrolling across the bottom

### Audio
- **Tracker Music**: Real-time generated techno music using Web Audio API
- **Classic Patterns**: 16-step sequencer with kick, snare, hi-hat, bass, and lead synth
- **Sound Toggle**: Button in top-left corner to enable/disable music

### Technical Features
- Canvas-based rendering for smooth 60fps animations
- Authentic 2000s demo scene color palette (greens, blues, cyans)
- Responsive design that works on all screen sizes
- No external dependencies - pure vanilla JavaScript

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
├── server.js              # Express server
├── package.json           # Node.js configuration
├── start-server.sh        # Server management script
├── public/                # Static files
│   ├── index.html         # Main HTML page
│   ├── css/
│   │   └── style.css      # Demo scene styling
│   ├── js/
│   │   ├── demo.js        # Main demo effects
│   │   └── audio.js       # Tracker music system
│   ├── images/            # Assets directory
│   └── fonts/             # Custom fonts directory
└── README.md              # This file
```

## Technical Details

### Demo Effects
- **Plasma**: Real-time mathematical plasma generation using sine waves
- **Vector Balls**: Physics-based circular motion with dynamic line connections
- **3D Cube**: Matrix transformations for 3D rotation and perspective projection
- **Starfield**: Z-buffer depth simulation for 3D star movement
- **Text Effects**: Multi-layer rendering for 3D text appearance

### Audio System
- **Web Audio API**: Real-time sound synthesis
- **Tracker Pattern**: Classic 16-step sequencer
- **Instruments**: Kick drum, snare, hi-hat, bass synth, lead synth
- **Tempo**: 120 BPM with 16th note resolution

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

This project pays homage to the PC demo scene of the 1990s and 2000s, particularly inspired by:

- **Future Crew**: Finnish demo group known for "Second Reality" (1993)
- **Classic Effects**: Vector balls, plasma, 3D wireframes, and scrollers
- **Tracker Music**: MOD-style music composition and playback
- **Technical Artistry**: Real-time effects on limited hardware

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

## License

MIT License - Feel free to use this code for your own demo scene creations!

## Credits

Created with Claude Code - bringing the spirit of the demo scene to modern web development.

---

*"Greetings to all demo sceners - keep the scene alive!"*