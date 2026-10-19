// The Last Car - Comprehensive Immersive UI Manager
import { gameState } from '../game/GameState.js';
import { sound } from '../audio/SoundEngine.js';

export class UIManager {
  constructor() {
    this.root = document.getElementById('ui-root');
    this.phoneModal = document.getElementById('phone-modal');
    this.inventoryModal = document.getElementById('inventory-modal');
    this.journalModal = document.getElementById('journal-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.dialogueModal = document.getElementById('dialogue-modal');
    this.inspectModal = document.getElementById('inspect-modal');
    this.subtitlesEl = document.getElementById('subtitles');
    this.promptEl = document.getElementById('interaction-prompt');

    this.activePhoneTab = 'messages';
    this.onJumpDay = null;
    this.storyManager = null;

    this.initHUD();
    this.initPhoneUI();
    this.initModals();
    this.initShortcuts();

    gameState.subscribe(() => this.renderHUD());
  }

  setStoryManager(sm) {
    this.storyManager = sm;
  }

  initHUD() {
    this.hudDay = document.getElementById('hud-day');
    this.hudTime = document.getElementById('hud-time');
    this.hudCondition = document.getElementById('hud-condition');
    this.hudThirst = document.getElementById('hud-thirst-bar');
    this.hudHunger = document.getElementById('hud-hunger-bar');
    this.hudFatigue = document.getElementById('hud-fatigue-bar');
    this.hudBattery = document.getElementById('hud-battery-text');
    this.hudBatteryIcon = document.getElementById('hud-battery-icon');

    this.renderHUD();
  }

  renderHUD() {
    const dayStr = String(gameState.day).padStart(2, '0');
    if (this.hudDay) this.hudDay.textContent = `DAY ${dayStr} OF 30`;

    // Time formatting
    const hours = Math.floor(gameState.timeMinutes / 60);
    const mins = gameState.timeMinutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayH = hours % 12 || 12;
    const timeStr = `${String(displayH).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
    if (this.hudTime) this.hudTime.textContent = timeStr;

    // Condition
    const cond = gameState.getCondition();
    if (this.hudCondition) {
      this.hudCondition.textContent = cond.status;
      this.hudCondition.className = `status-badge ${cond.class} ${cond.pulse ? 'pulse' : ''}`;
    }

    // Meters
    if (this.hudThirst) this.hudThirst.style.width = `${Math.min(100, gameState.thirst)}%`;
    if (this.hudHunger) this.hudHunger.style.width = `${Math.min(100, gameState.hunger)}%`;
    if (this.hudFatigue) this.hudFatigue.style.width = `${Math.min(100, gameState.fatigue)}%`;

    // Phone Battery
    const batt = Math.max(0, Math.round(gameState.phoneBattery));
    if (this.hudBattery) this.hudBattery.textContent = `${batt}%`;
    if (this.hudBatteryIcon) {
      this.hudBatteryIcon.style.color = batt > 25 ? '#30d158' : batt > 10 ? '#ffd60a' : '#ff453a';
    }

    // Update phone UI if open
    if (gameState.phoneOpen) {
      this.renderPhoneScreen();
    }
  }

  // Keyboard hotkeys for toggling phone, inventory, journal
  initShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Toggle Phone [T] or [P]
      if (e.code === 'KeyT' || e.code === 'KeyP') {
        this.togglePhone();
      }
      // Toggle Inventory [I] or [Tab]
      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        this.toggleInventory();
      }
      // Toggle Journal [J]
      if (e.code === 'KeyJ') {
        this.toggleJournal();
      }
      // Toggle Flashlight [F]
      if (e.code === 'KeyF') {
        const on = gameState.toggleFlashlight();
        sound.playFlashlightClick();
        this.showSubtitles(on ? 'Flashlight ON' : 'Flashlight OFF');
      }
      // Settings / Debug [Escape]
      if (e.code === 'Escape') {
        this.closeAllModals();
      }
    });

    // Crosshair interaction prompt handler
    document.getElementById('btn-phone')?.addEventListener('click', () => this.togglePhone());
    document.getElementById('btn-inv')?.addEventListener('click', () => this.toggleInventory());
    document.getElementById('btn-journal')?.addEventListener('click', () => this.toggleJournal());
    document.getElementById('btn-settings')?.addEventListener('click', () => this.toggleSettings());
  }

  // Show interaction prompt text on crosshair hover
  setInteractionPrompt(promptText) {
    if (!this.promptEl) return;
    if (promptText) {
      this.promptEl.textContent = promptText;
      this.promptEl.classList.add('visible');
    } else {
      this.promptEl.classList.remove('visible');
    }
  }

  // Subtitles banner at bottom
  showSubtitles(text, duration = 3500) {
    if (!this.subtitlesEl) return;
    this.subtitlesEl.textContent = text;
    this.subtitlesEl.classList.add('visible');
    clearTimeout(this.subtitlesTimer);
    this.subtitlesTimer = setTimeout(() => {
      this.subtitlesEl.classList.remove('visible');
    }, duration);
  }

  // Phone Interface Methods
  togglePhone() {
    if (gameState.phoneOpen) {
      this.closePhone();
    } else {
      this.openPhone();
    }
  }

  openPhone() {
    if (document.pointerLockElement) document.exitPointerLock?.();
    gameState.phoneOpen = true;
    document.body.classList.add('ui-blocking');
    this.phoneModal.classList.add('active');
    sound.playPhoneDing();
    this.renderPhoneScreen();
  }

  closePhone() {
    gameState.phoneOpen = false;
    document.body.classList.remove('ui-blocking');
    this.phoneModal.classList.remove('active');
  }

  initPhoneUI() {
    // Tab switching
    const tabs = ['messages', 'alerts', 'calls', 'photos', 'recorder'];
    tabs.forEach((tab) => {
      const btn = document.getElementById(`phone-tab-${tab}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.activePhoneTab = tab;
          tabs.forEach((t) => document.getElementById(`phone-tab-${t}`)?.classList.remove('active'));
          btn.classList.add('active');
          this.renderPhoneScreen();
        });
      }
    });

    // Flashlight switch inside phone
    document.getElementById('phone-flashlight-btn')?.addEventListener('click', () => {
      gameState.toggleFlashlight();
      sound.playFlashlightClick();
      this.renderPhoneScreen();
    });

    // Close phone button
    document.getElementById('phone-close-btn')?.addEventListener('click', () => this.closePhone());
  }

  renderPhoneScreen() {
    const container = document.getElementById('phone-tab-content');
    if (!container) return;

    // Flashlight button state
    const flashBtn = document.getElementById('phone-flashlight-btn');
    if (flashBtn) {
      flashBtn.className = gameState.flashlightOn ? 'flash-btn active' : 'flash-btn';
      flashBtn.innerHTML = gameState.flashlightOn ? '🔦 LIGHT ON' : '💡 LIGHT OFF';
    }

    // Battery display in phone header
    const phoneBatt = document.getElementById('phone-battery-level');
    if (phoneBatt) {
      phoneBatt.textContent = `${Math.round(gameState.phoneBattery)}%`;
    }

    if (gameState.phoneBattery <= 0) {
      container.innerHTML = `<div class="phone-dead-screen"><div class="dead-battery-icon">🪫</div><p>BATTERY DEPLETED</p><small>Connect external 5V power source</small></div>`;
      return;
    }

    if (this.activePhoneTab === 'messages') {
      let html = `<div class="chat-thread">`;
      gameState.messages.forEach((msg) => {
        const isSelf = msg.sender === 'You';
        html += `
          <div class="chat-bubble ${isSelf ? 'outgoing' : 'incoming'} ${msg.isAlert ? 'eas-bubble' : ''}">
            <div class="chat-sender">${msg.sender}</div>
            <div class="chat-text">${msg.text}</div>
            <div class="chat-time">${msg.timestamp}</div>
          </div>
        `;
      });

      // Quick reply choices if unknown message is present
      const hasUnknown = gameState.messages.some((m) => m.id === 'msg_unknown_1');
      const alreadyReplied = gameState.messages.some((m) => m.sender === 'You');

      if (hasUnknown && !alreadyReplied) {
        html += `
          <div class="chat-replies">
            <button class="reply-btn" id="reply-yes">"Yes, who is this?"</button>
            <button class="reply-btn" id="reply-silent">"Stay away from this car."</button>
          </div>
        `;
      }
      html += `</div>`;
      container.innerHTML = html;

      // Attach reply handlers
      document.getElementById('reply-yes')?.addEventListener('click', () => {
        gameState.messages.push({
          id: 'reply_1',
          sender: 'You',
          timestamp: 'Just now',
          text: 'Yes, who is this?'
        });
        sound.playPhoneDing();
        this.renderPhoneScreen();
      });

      document.getElementById('reply-silent')?.addEventListener('click', () => {
        gameState.messages.push({
          id: 'reply_2',
          sender: 'You',
          timestamp: 'Just now',
          text: 'Stay away from this car.'
        });
        sound.playPhoneDing();
        this.renderPhoneScreen();
      });

    } else if (this.activePhoneTab === 'alerts') {
      let html = `<div class="alerts-feed">`;
      gameState.alerts.forEach((alert) => {
        html += `
          <div class="alert-card">
            <div class="alert-header">⚠️ ${alert.title}</div>
            <div class="alert-time">${alert.time}</div>
            <div class="alert-body">${alert.text}</div>
          </div>
        `;
      });
      html += `</div>`;
      container.innerHTML = html;

    } else if (this.activePhoneTab === 'calls') {
      let html = `<div class="calls-feed">`;
      gameState.calls.forEach((call, idx) => {
        html += `
          <div class="call-entry">
            <div class="call-info">
              <strong>${call.contact}</strong>
              <small>${call.time} • ${call.type.toUpperCase()}</small>
            </div>
            ${call.hasVoicemail ? `<button class="vm-btn" data-call="${idx}">▶ Play Voicemail</button>` : `<button class="redial-btn" disabled>No Signal</button>`}
          </div>
        `;
      });
      html += `</div>`;
      container.innerHTML = html;

      container.querySelectorAll('.vm-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.call);
          const c = gameState.calls[idx];
          sound.playRadioStatic(1.5);
          this.showSubtitles(c.voicemailText, 6000);
          sound.speakVoice({
            character: 'mom',
            text: c.voicemailText
          });
        });
      });

    } else if (this.activePhoneTab === 'photos') {
      let html = `<div class="gallery-grid">`;
      gameState.photos.forEach((photo) => {
        html += `
          <div class="gallery-item" data-photo="${photo.id}">
            <img src="${photo.url}" alt="${photo.title}">
            <div class="gallery-caption">
              <strong>${photo.title}</strong>
              <small>${photo.date}</small>
              <p>${photo.caption}</p>
            </div>
          </div>
        `;
      });
      html += `</div>`;
      container.innerHTML = html;

    } else if (this.activePhoneTab === 'recorder') {
      container.innerHTML = `
        <div class="recorder-panel">
          <div class="recorder-wave"><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div></div>
          <p>TUNNEL AUDIO LOGS</p>
          <button class="record-btn" id="btn-record-audio">🎙️ Listen to Tunnel Frequency</button>
          <div class="audio-feedback" id="recorder-feedback">Microphone sensitivity tuned to structural reverberation.</div>
        </div>
      `;
      document.getElementById('btn-record-audio')?.addEventListener('click', () => {
        sound.playRadioStatic(2.0);
        sound.playCreatureGait();
        document.getElementById('recorder-feedback').innerHTML = `<span style="color:#ff453a;">RESONANCE DETECTED:</span> Wet scraping against concrete detected at 200Hz. Multiple synchronized limbs.`;
      });
    }
  }

  // Inventory Modal Methods
  toggleInventory() {
    if (this.inventoryModal.classList.contains('active')) {
      this.closeInventory();
    } else {
      this.openInventory();
    }
  }

  openInventory() {
    if (document.pointerLockElement) document.exitPointerLock?.();
    document.body.classList.add('ui-blocking');
    this.inventoryModal.classList.add('active');
    this.renderInventory();
  }

  closeInventory() {
    document.body.classList.remove('ui-blocking');
    this.inventoryModal.classList.remove('active');
  }

  renderInventory() {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;

    grid.innerHTML = '';
    gameState.inventory.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-icon">${item.icon}</div>
        <div class="item-details">
          <h4>${item.name}</h4>
          ${item.uses !== undefined ? `<div class="item-uses">Remaining: ${item.uses}/${item.maxUses}</div>` : ''}
          <p>${item.description}</p>
          <div class="item-actions">
            ${item.id === 'water_bottle' && item.uses > 0 ? `<button class="btn-use drink-btn">Drink Water</button>` : ''}
            ${item.id === 'chips_bag' && item.uses > 0 ? `<button class="btn-use eat-btn">Eat Portion</button>` : ''}
            <button class="btn-inspect inspect-btn">Inspect Item</button>
          </div>
        </div>
      `;

      card.querySelector('.drink-btn')?.addEventListener('click', () => {
        if (gameState.drinkWater()) {
          sound.playWaterSip();
          this.showSubtitles('You take a careful sip of water. Thirst quenched slightly.');
          this.renderInventory();
        }
      });

      card.querySelector('.eat-btn')?.addEventListener('click', () => {
        if (gameState.eatFood()) {
          sound.playEatingCrunch();
          this.showSubtitles('You chew a few salted chips. Hunger decreases, but your throat feels parched.');
          this.renderInventory();
        }
      });

      card.querySelector('.inspect-btn')?.addEventListener('click', () => {
        this.showInspectModal(item.name, item.lore || item.description);
      });

      grid.appendChild(card);
    });
  }

  // Evidence Journal Modal Methods
  toggleJournal() {
    if (this.journalModal.classList.contains('active')) {
      this.closeJournal();
    } else {
      this.openJournal();
    }
  }

  openJournal() {
    if (document.pointerLockElement) document.exitPointerLock?.();
    document.body.classList.add('ui-blocking');
    this.journalModal.classList.add('active');
    this.renderJournal();
  }

  closeJournal() {
    document.body.classList.remove('ui-blocking');
    this.journalModal.classList.remove('active');
  }

  renderJournal() {
    const list = document.getElementById('journal-entries');
    if (!list) return;

    list.innerHTML = '';
    gameState.journal.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'journal-card';
      item.innerHTML = `
        <div class="journal-header">
          <span class="journal-day-tag">DAY ${String(entry.day).padStart(2, '0')}</span>
          <h3>${entry.title}</h3>
        </div>
        <div class="journal-body">${entry.content}</div>
      `;
      list.appendChild(item);
    });
  }

  // Settings & Debug Day Jump Modal
  toggleSettings() {
    if (this.settingsModal.classList.contains('active')) {
      this.settingsModal.classList.remove('active');
      document.body.classList.remove('ui-blocking');
    } else {
      if (document.pointerLockElement) document.exitPointerLock?.();
      document.body.classList.add('ui-blocking');
      this.settingsModal.classList.add('active');
    }
  }

  initModals() {
    document.getElementById('inventory-close-btn')?.addEventListener('click', () => this.closeInventory());
    document.getElementById('journal-close-btn')?.addEventListener('click', () => this.closeJournal());
    document.getElementById('settings-close-btn')?.addEventListener('click', () => this.toggleSettings());
    document.getElementById('inspect-close-btn')?.addEventListener('click', () => {
      this.inspectModal.classList.remove('active');
      document.body.classList.remove('ui-blocking');
    });

    // Jump Day Quick Buttons (for seamless testing of any milestone)
    document.querySelectorAll('.btn-jump-day').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const targetDay = parseInt(e.target.dataset.day);
        this.triggerDayTransition(targetDay);
        this.toggleSettings();
      });
    });

    // Reset game button
    document.getElementById('btn-reset-game')?.addEventListener('click', () => {
      if (confirm('Reset all progress back to Day 1?')) {
        gameState.clearSave();
        location.reload();
      }
    });

    // Master volume slider
    document.getElementById('slider-volume')?.addEventListener('input', (e) => {
      sound.setMasterVolume(parseFloat(e.target.value));
    });
  }

  closeAllModals() {
    this.closePhone();
    this.closeInventory();
    this.closeJournal();
    this.inspectModal?.classList.remove('active');
    this.settingsModal?.classList.remove('active');
    document.body.classList.remove('ui-blocking');
  }

  // Inspect Modal (for notes, posters, props)
  showInspectModal(title, text) {
    if (document.pointerLockElement) document.exitPointerLock?.();
    document.body.classList.add('ui-blocking');
    document.getElementById('inspect-title').textContent = title;
    document.getElementById('inspect-text').innerHTML = text;
    this.inspectModal.classList.add('active');
  }

  // Dialogue Tree Overlay
  showDialogue({ speaker, text, choices }) {
    if (document.pointerLockElement) document.exitPointerLock?.();
    document.body.classList.add('ui-blocking');

    const speakerEl = document.getElementById('dialogue-speaker');
    const textEl = document.getElementById('dialogue-text');
    const choicesEl = document.getElementById('dialogue-choices');

    speakerEl.textContent = speaker;
    textEl.innerHTML = text;
    choicesEl.innerHTML = '';

    choices.forEach((c, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = `<span class="choice-num">[${idx + 1}]</span> ${c.label}`;
      btn.addEventListener('click', () => {
        c.action();
      });
      choicesEl.appendChild(btn);
    });

    this.dialogueModal.classList.add('active');
  }

  hideDialogue() {
    this.dialogueModal.classList.remove('active');
    document.body.classList.remove('ui-blocking');
  }

  // Narrative Modal (used for prologue and endings)
  showNarrativeModal(title, htmlContent, onProceed) {
    if (document.pointerLockElement) document.exitPointerLock?.();
    document.body.classList.add('ui-blocking');

    const modal = document.getElementById('narrative-modal');
    document.getElementById('narrative-title').innerHTML = title;
    document.getElementById('narrative-content').innerHTML = htmlContent;

    const btn = document.getElementById('narrative-btn');
    btn.onclick = () => {
      modal.classList.remove('active');
      document.body.classList.remove('ui-blocking');
      if (onProceed) onProceed();
    };

    modal.classList.add('active');
  }

  // Day Transition Cinematic Screen
  triggerDayTransition(targetDay = null) {
    if (document.pointerLockElement) document.exitPointerLock?.();
    document.body.classList.add('ui-blocking');

    const overlay = document.getElementById('day-transition-overlay');
    const dayText = document.getElementById('transition-day-number');
    const summaryText = document.getElementById('transition-summary');

    const nextDay = targetDay !== null ? targetDay : gameState.day + 1;
    dayText.textContent = `DAY ${String(nextDay).padStart(2, '0')}`;
    summaryText.textContent = 'You rest on the vinyl passenger seats. Hours dissolve in the darkness of the subterranean tunnel.';

    overlay.classList.add('active');
    sound.setVentilationState(false);
    sound.playMetallicCreak();

    setTimeout(() => {
      gameState.sleep();
      if (targetDay !== null) gameState.advanceDay(targetDay);

      sound.setVentilationState(true);
      summaryText.textContent = `You awaken. Throat parched, body aching. The red emergency lamps hum softly above.`;

      setTimeout(() => {
        overlay.classList.remove('active');
        document.body.classList.remove('ui-blocking');

        // Check if Day 10 is reached!
        if (gameState.day === 10 && this.storyManager) {
          setTimeout(() => {
            this.storyManager.triggerDay10Encounter();
          }, 1500);
        } else if (gameState.day === 20 && this.storyManager) {
          setTimeout(() => {
            this.storyManager.triggerDay20Encounter();
          }, 1500);
        } else if (gameState.day >= 30 && this.storyManager) {
          setTimeout(() => {
            this.storyManager.triggerEnding();
          }, 1500);
        }
      }, 1800);
    }, 2000);
  }

  // Ending Screen Presentation
  showEndingScreen(title, htmlText) {
    if (document.pointerLockElement) document.exitPointerLock?.();
    document.body.classList.add('ui-blocking');

    const modal = document.getElementById('ending-modal');
    document.getElementById('ending-title').textContent = title;
    document.getElementById('ending-content').innerHTML = htmlText;

    document.getElementById('ending-restart-btn').onclick = () => {
      gameState.clearSave();
      location.reload();
    };

    modal.classList.add('active');
  }
}
