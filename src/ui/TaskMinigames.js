// The Last Car - Interactive Tactile Task Mini-games (Among Us style)
import { sound } from '../audio/SoundEngine.js';

export class TaskMinigames {
  constructor(taskManager, uiManager) {
    this.taskManager = taskManager;
    this.ui = uiManager;
    this.activeTask = null;
    this.container = null;
    this.windowCompleted = false;
    this._windowMoveHandler = null;
    this._windowUpHandler = null;
  }

  openTask(taskId) {
    if (document.pointerLockElement) document.exitPointerLock?.();
    document.body.classList.add('ui-blocking');

    this.activeTask = taskId;
    const modal = document.getElementById('task-modal');
    if (!modal) return;

    modal.classList.add('active');
    this.container = document.getElementById('task-modal-content');
    if (!this.container) return;

    switch (taskId) {
      case 'wires':
        this.renderWiresTask();
        break;
      case 'window':
        this.renderWindowTask();
        break;
      case 'vent':
        this.renderVentTask();
        break;
      case 'pressure':
        this.renderPressureTask();
        break;
      case 'radio':
        this.renderRadioTask();
        break;
      default:
        this.close();
    }
  }

  close() {
    const modal = document.getElementById('task-modal');
    if (modal) modal.classList.remove('active');
    document.body.classList.remove('ui-blocking');
    this.activeTask = null;
    this.windowCompleted = false;
    if (this._windowMoveHandler) {
      window.removeEventListener('mousemove', this._windowMoveHandler);
      this._windowMoveHandler = null;
    }
    if (this._windowUpHandler) {
      window.removeEventListener('mouseup', this._windowUpHandler);
      this._windowUpHandler = null;
    }
    if (this.container) this.container.innerHTML = '';
  }

  completeActiveTask() {
    if (!this.activeTask) return;
    const res = this.taskManager.completeTask(this.activeTask);
    if (res) {
      this.ui.showSubtitles(`TASK COMPLETE: ${res.task.title} (${res.completedCount}/${res.totalCount})`);
      if (res.allCompleted) {
        setTimeout(() => {
          this.ui.showSubtitles('ALL DAILY MAINTENANCE TASKS COMPLETE. Systems stable for tonight.');
        }, 1800);
      }
    }
    setTimeout(() => {
      this.close();
    }, 700);
  }

  // 1. WIRES MINI-GAME: Connect 4 colored transit lines
  renderWiresTask() {
    const colors = [
      { id: 'red', hex: '#ff3b30', name: 'Circuit 1A' },
      { id: 'blue', hex: '#0a84ff', name: 'Relay 4B' },
      { id: 'yellow', hex: '#ffd60a', name: 'Aux 2' },
      { id: 'green', hex: '#30d158', name: 'Ground' }
    ];

    // Shuffle right terminals
    const rightColors = [...colors].sort(() => 0.5 - Math.random());
    const connections = {}; // leftId -> rightId
    let selectedLeft = null;

    this.container.innerHTML = `
      <div class="task-panel wires-panel">
        <div class="task-header">
          <h3>BREAKER PANEL: AUXILIARY WIRING</h3>
          <span class="task-instructions">Connect matching colored transit wires to restore emergency circuits</span>
          <button class="task-close-btn" id="task-close-btn">✕</button>
        </div>
        <div class="wires-arena" id="wires-arena">
          <div class="wires-column wires-left" id="wires-left-col">
            ${colors.map((c) => `
              <div class="wire-port left-port" data-color="${c.id}" style="--wire-color: ${c.hex}">
                <span class="wire-label">${c.name}</span>
                <div class="wire-peg" style="background-color: ${c.hex}"></div>
              </div>
            `).join('')}
          </div>
          <svg class="wires-canvas" id="wires-svg"></svg>
          <div class="wires-column wires-right" id="wires-right-col">
            ${rightColors.map((c) => `
              <div class="wire-port right-port" data-color="${c.id}" style="--wire-color: ${c.hex}">
                <div class="wire-peg" style="background-color: ${c.hex}"></div>
                <span class="wire-label">${c.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="task-status-bar" id="wires-status">STATUS: CIRCUITS DISCONNECTED (0/4)</div>
      </div>
    `;

    document.getElementById('task-close-btn')?.addEventListener('click', () => this.close());

    const svg = document.getElementById('wires-svg');
    const leftPorts = this.container.querySelectorAll('.left-port');
    const rightPorts = this.container.querySelectorAll('.right-port');
    const statusEl = document.getElementById('wires-status');

    // Handle wire connections
    leftPorts.forEach((port) => {
      port.addEventListener('click', () => {
        const color = port.dataset.color;
        if (connections[color]) return; // already connected
        selectedLeft = color;
        leftPorts.forEach((p) => p.classList.toggle('selected', p.dataset.color === color));
        sound.playFlashlightClick();
      });
    });

    rightPorts.forEach((port) => {
      port.addEventListener('click', () => {
        if (!selectedLeft) return;
        const rightColor = port.dataset.color;
        if (selectedLeft === rightColor) {
          // Correct connection!
          connections[selectedLeft] = rightColor;
          sound.playWireConnect();
          port.classList.add('connected');
          const leftEl = this.container.querySelector(`.left-port[data-color="${selectedLeft}"]`);
          if (leftEl) leftEl.classList.add('connected');

          this.drawWireLine(svg, selectedLeft, port);
          selectedLeft = null;
          leftPorts.forEach((p) => p.classList.remove('selected'));

          const connectedCount = Object.keys(connections).length;
          statusEl.textContent = `STATUS: CIRCUITS RESTORED (${connectedCount}/4)`;
          statusEl.style.color = connectedCount === 4 ? '#30d158' : '#ffd60a';

          if (connectedCount === 4) {
            statusEl.textContent = 'CIRCUITS FULLY RESTORED. VOLTAGE NORMAL.';
            this.completeActiveTask();
          }
        } else {
          // Wrong wire buzzer
          sound.playLightFlicker();
          statusEl.textContent = 'CIRCUIT MISMATCH: GROUND FAULT';
          statusEl.style.color = '#ff3b30';
          setTimeout(() => {
            statusEl.textContent = `STATUS: CONNECTING (${Object.keys(connections).length}/4)`;
            statusEl.style.color = '#ededed';
          }, 800);
        }
      });
    });
  }

  drawWireLine(svg, colorId, rightPortEl) {
    const leftPortEl = this.container.querySelector(`.left-port[data-color="${colorId}"]`);
    if (!leftPortEl || !rightPortEl || !svg) return;

    const svgRect = svg.getBoundingClientRect();
    const leftPeg = leftPortEl.querySelector('.wire-peg').getBoundingClientRect();
    const rightPeg = rightPortEl.querySelector('.wire-peg').getBoundingClientRect();

    const x1 = leftPeg.right - svgRect.left;
    const y1 = leftPeg.top + leftPeg.height / 2 - svgRect.top;
    const x2 = rightPeg.left - svgRect.left;
    const y2 = rightPeg.top + rightPeg.height / 2 - svgRect.top;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const dx = (x2 - x1) * 0.5;
    const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

    const colorHex = leftPortEl.style.getPropertyValue('--wire-color');
    line.setAttribute('d', d);
    line.setAttribute('stroke', colorHex);
    line.setAttribute('stroke-width', '6');
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke-linecap', 'round');
    line.classList.add('active-wire');

    svg.appendChild(line);
  }

  // 2. WINDOW CONDENSATION MINI-GAME: Wipe moisture off glass
  renderWindowTask() {
    this.container.innerHTML = `
      <div class="task-panel window-panel">
        <div class="task-header">
          <h3>CENTER WINDOW: CLEAR CONDENSATION</h3>
          <span class="task-instructions">Drag mouse to wipe cold condensation and inspect platform perimeter</span>
          <button class="task-close-btn" id="task-close-btn">✕</button>
        </div>
        <div class="window-frame">
          <!-- Background showing the dark subway platform outside -->
          <div class="window-view-bg">
            <div class="platform-tile-wall"></div>
            <div class="platform-column"></div>
            <div class="platform-yellow-line"></div>
            <div class="tunnel-darkness"></div>
            <div class="eerie-shadow-figure"></div>
          </div>
          <!-- Canvas for wiping steam/frost -->
          <canvas id="frost-canvas" class="frost-canvas" width="480" height="340"></canvas>
        </div>
        <div class="task-status-bar" id="window-status">GLASS WIPED: 0%</div>
      </div>
    `;

    document.getElementById('task-close-btn')?.addEventListener('click', () => this.close());

    const canvas = document.getElementById('frost-canvas');
    const ctx = canvas.getContext('2d');
    const statusEl = document.getElementById('window-status');

    // Fill with dense frosted steam/moisture
    ctx.fillStyle = 'rgba(215, 225, 235, 0.94)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add condensation droplets texture
    for (let i = 0; i < 280; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = 1 + Math.random() * 3;
      ctx.fillStyle = 'rgba(180, 195, 210, 0.4)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    let isDrawing = false;
    let wipedPixels = 0;
    const totalPixels = canvas.width * canvas.height;
    let wipeSoundThrottle = 0;

    const wipe = (x, y) => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 32, 0, Math.PI * 2);
      ctx.fill();

      wipedPixels += 280;
      const percent = Math.min(100, Math.round((wipedPixels / (totalPixels * 0.45)) * 100));
      statusEl.textContent = `GLASS WIPED: ${percent}%`;

      wipeSoundThrottle++;
      if (wipeSoundThrottle % 7 === 0) {
        sound.playSqueegeeWipe();
      }

      if (percent >= 90 && !this.windowCompleted) {
        this.windowCompleted = true;
        statusEl.textContent = 'WINDOW FULLY CLEARED. PERIMETER INSPECTED.';
        statusEl.style.color = '#30d158';
        this.completeActiveTask();
      }
    };

    canvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      wipe(e.clientX - rect.left, e.clientY - rect.top);
    });

    this._windowMoveHandler = (e) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
        wipe(x, y);
      }
    };

    this._windowUpHandler = () => {
      isDrawing = false;
    };

    window.addEventListener('mousemove', this._windowMoveHandler);
    window.addEventListener('mouseup', this._windowUpHandler);
  }

  // 3. CLEAN VENTILATION FILTER MINI-GAME: Clear debris & purge valve
  renderVentTask() {
    this.container.innerHTML = `
      <div class="task-panel vent-panel">
        <div class="task-header">
          <h3>CEILING VENTILATION: CLEAR FILTER</h3>
          <span class="task-instructions">Click and remove charred debris from the intake grate, then purge valve</span>
          <button class="task-close-btn" id="task-close-btn">✕</button>
        </div>
        <div class="vent-grate-housing">
          <div class="grate-bars">
            <div class="grate-bar"></div>
            <div class="grate-bar"></div>
            <div class="grate-bar"></div>
            <div class="grate-bar"></div>
          </div>
          <div class="debris-container" id="debris-container">
            <div class="debris-item" data-id="1" style="top: 24%; left: 22%;">🪨 Carbon Deposit</div>
            <div class="debris-item" data-id="2" style="top: 60%; left: 35%;">🍂 Dry Leaf Clump</div>
            <div class="debris-item" data-id="3" style="top: 30%; left: 65%;">📄 Charred Paper</div>
            <div class="debris-item" data-id="4" style="top: 70%; left: 72%;">⚙️ Loose Bolt</div>
          </div>
        </div>
        <div class="vent-controls">
          <button class="purge-valve-btn disabled" id="purge-btn">PURGE AIRFLOW VALVE</button>
        </div>
        <div class="task-status-bar" id="vent-status">OBSTRUCTIONS REMAINING: 4</div>
      </div>
    `;

    document.getElementById('task-close-btn')?.addEventListener('click', () => this.close());

    let remainingDebris = 4;
    const debrisItems = this.container.querySelectorAll('.debris-item');
    const purgeBtn = document.getElementById('purge-btn');
    const statusEl = document.getElementById('vent-status');

    debrisItems.forEach((item) => {
      item.addEventListener('click', () => {
        sound.playVentScrape();
        item.style.transform = 'translateY(80px) scale(0.2)';
        item.style.opacity = '0';
        item.style.pointerEvents = 'none';
        remainingDebris--;
        statusEl.textContent = `OBSTRUCTIONS REMAINING: ${remainingDebris}`;

        if (remainingDebris === 0) {
          statusEl.textContent = 'GRATE CLEARED. PRESS PURGE VALVE TO RESTORE AIRFLOW.';
          statusEl.style.color = '#ffd60a';
          purgeBtn.classList.remove('disabled');
        }
      });
    });

    purgeBtn.addEventListener('click', () => {
      if (remainingDebris > 0) return;
      sound.playPneumaticPump();
      sound.setVentilationState(true);
      purgeBtn.textContent = '✓ AIRFLOW PURGED (100%)';
      purgeBtn.style.background = '#30d158';
      statusEl.textContent = 'VENTILATION DUCT FULLY OPERATIONAL.';
      statusEl.style.color = '#30d158';
      this.completeActiveTask();
    });
  }

  // 4. DOOR PRESSURE SEAL MINI-GAME: Pump manual valve 5 times
  renderPressureTask() {
    let pumps = 0;
    const targetPumps = 5;

    this.container.innerHTML = `
      <div class="task-panel pressure-panel">
        <div class="task-header">
          <h3>SUBWAY DOORS: EQUALIZE SEAL PRESSURE</h3>
          <span class="task-instructions">Pump manual lever 5 times to equalize pneumatic door blast seals</span>
          <button class="task-close-btn" id="task-close-btn">✕</button>
        </div>
        <div class="pressure-gauge-display">
          <div class="gauge-dial">
            <div class="gauge-arc"></div>
            <div class="gauge-needle" id="gauge-needle" style="transform: rotate(-75deg);"></div>
            <div class="gauge-center-pin"></div>
            <span class="gauge-label">PSI x10</span>
          </div>
          <div class="pump-lever-housing">
            <button class="pump-lever-btn" id="pump-lever-btn">
              <span class="lever-handle"></span>
              <span class="lever-text">PULL PUMP LEVER</span>
            </button>
          </div>
        </div>
        <div class="task-status-bar" id="pressure-status">PRESSURE: 6.2 PSI (UNBALANCED - 0/5 PUMPS)</div>
      </div>
    `;

    document.getElementById('task-close-btn')?.addEventListener('click', () => this.close());

    const leverBtn = document.getElementById('pump-lever-btn');
    const needle = document.getElementById('gauge-needle');
    const statusEl = document.getElementById('pressure-status');

    leverBtn.addEventListener('click', () => {
      if (pumps >= targetPumps) return;
      pumps++;
      sound.playPneumaticPump();

      // Animate lever
      leverBtn.classList.add('pumping');
      setTimeout(() => leverBtn.classList.remove('pumping'), 200);

      // Rotate gauge needle towards green zone (-75deg to +75deg)
      const deg = -75 + (pumps / targetPumps) * 145;
      needle.style.transform = `rotate(${deg}deg)`;

      const psi = (6.2 + (pumps / targetPumps) * 8.5).toFixed(1);
      statusEl.textContent = `PRESSURE: ${psi} PSI (${pumps}/${targetPumps} PUMPS)`;

      if (pumps >= targetPumps) {
        statusEl.textContent = 'PRESSURE EQUALIZED: 14.7 PSI (BLAST SEAL LOCKED)';
        statusEl.style.color = '#30d158';
        this.completeActiveTask();
      }
    });
  }

  // 5. RADIO FREQUENCY ALIGNMENT MINI-GAME: Tune to target frequency
  renderRadioTask() {
    const targetFreq = 104.2;
    let currentFreq = 92.4;
    let locked = false;

    this.container.innerHTML = `
      <div class="task-panel radio-panel">
        <div class="task-header">
          <h3>EMERGENCY RADIO: FREQUENCY CALIBRATION</h3>
          <span class="task-instructions">Tune receiver needle to match Civil Defense Carrier: 104.2 MHz</span>
          <button class="task-close-btn" id="task-close-btn">✕</button>
        </div>
        <div class="radio-interface">
          <div class="radio-frequency-readout">
            <span class="radio-target">TARGET: <strong>104.2 MHz</strong></span>
            <span class="radio-current" id="radio-current-display">92.4 MHz</span>
          </div>
          <div class="radio-dial-scale">
            <div class="dial-markers">
              <span>88</span><span>92</span><span>96</span><span>100</span><span>104</span><span>108</span>
            </div>
            <input type="range" class="radio-tuning-slider" id="radio-slider" min="88.0" max="108.0" step="0.1" value="92.4">
          </div>
          <div class="radio-signal-meter">
            <span class="meter-label">CARRIER LOCK:</span>
            <div class="signal-led" id="signal-led"></div>
          </div>
        </div>
        <div class="task-status-bar" id="radio-status">SIGNAL: HEAVY NOISE / NO CARRIER</div>
      </div>
    `;

    document.getElementById('task-close-btn')?.addEventListener('click', () => this.close());

    const slider = document.getElementById('radio-slider');
    const readout = document.getElementById('radio-current-display');
    const led = document.getElementById('signal-led');
    const statusEl = document.getElementById('radio-status');

    slider.addEventListener('input', (e) => {
      currentFreq = parseFloat(e.target.value);
      readout.textContent = `${currentFreq.toFixed(1)} MHz`;

      const diff = Math.abs(currentFreq - targetFreq);
      sound.playRadioTuning(diff);

      if (locked) return;

      if (diff < 0.25) {
        locked = true;
        led.classList.add('locked');
        statusEl.textContent = 'SIGNAL LOCKED: CIVIL DEFENSE BEACON ACTIVE';
        statusEl.style.color = '#30d158';
        sound.playRadioStatic(0.8);
        this.completeActiveTask();
      } else {
        led.classList.remove('locked');
        statusEl.textContent = diff < 1.0 ? 'CARRIER DETECTED: MINOR DRIFT' : 'SIGNAL: HEAVY NOISE';
        statusEl.style.color = diff < 1.0 ? '#ffd60a' : '#ededed';
      }
    });
  }
}
