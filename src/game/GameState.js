// The Last Car - Comprehensive Game State & Survival Simulation
import { sound } from '../audio/SoundEngine.js';

export class GameState {
  constructor() {
    this.listeners = new Set();
    this.reset();
  }

  reset() {
    this.day = 1;
    this.maxDays = 30;
    this.dayPhase = 'Day'; // 'Morning', 'Afternoon', 'Night'
    this.timeMinutes = 9 * 60 + 14; // 09:14 AM on Day 1

    // Survival Meters (0 = perfect, 100 = critical)
    this.thirst = 15;
    this.hunger = 20;
    this.fatigue = 15;

    // Phone status
    this.phoneBattery = 68.0;
    this.flashlightOn = false;
    this.phoneOpen = false;

    // Car & World State
    this.doorsLocked = true;
    this.doorsOpen = false;
    this.maintenanceUnlocked = false;
    this.maintenanceLooted = false;
    this.powerDegraded = false;
    this.emergencyLightState = 'normal'; // 'normal', 'flickering', 'partial_fail', 'blackout'

    // Inventory items
    this.inventory = [
      {
        id: 'water_bottle',
        name: 'Plastic Water Bottle',
        type: 'consumable',
        icon: '💧',
        uses: 4,
        maxUses: 4,
        description: 'A 500ml bottle of tap water. Nearly full. You must make every sip count.',
        lore: 'Picked up on the morning commute. The plastic is crinkled from your grip during the panic.'
      },
      {
        id: 'chips_bag',
        name: 'Bag of Salted Chips',
        type: 'consumable',
        icon: '🥔',
        uses: 4,
        maxUses: 4,
        description: 'Barbecue flavored potato chips. High in calories, but the salt will induce thirst.',
        lore: 'Bought from a station vending machine moments before the emergency sirens wailed.'
      },
      {
        id: 'subway_key',
        name: 'Transit Service Key',
        type: 'tool',
        icon: '🔑',
        description: 'A brass triangular transit service key found dropped beneath the center passenger seats.',
        lore: 'Stamped with MTA SERVICE DEPT - CAR CAB & UTILITY LOCKS.'
      }
    ];

    // Phone Messages
    this.messages = [
      {
        id: 'msg_mom_1',
        sender: 'Mom',
        timestamp: 'Day 1, 09:02 AM',
        text: 'Are you on the subway yet honey? Please call me as soon as you see the news.',
        unread: false
      },
      {
        id: 'msg_alert_eas',
        sender: 'EMERGENCY ALERT SYSTEM',
        timestamp: 'Day 1, 09:11 AM',
        text: 'CIVIL DEFENSE WARNING: IMMINENT INBOUND STRIKE DETECTED. SEEK IMMEDIATE UNDERGROUND SHELTER. DO NOT EXIT UNTIL OFFICIALLY NOTIFIED.',
        unread: false,
        isAlert: true
      }
    ];

    // Emergency Alerts History
    this.alerts = [
      {
        id: 'alert_1',
        title: 'NATIONAL DEFENSE NOTIFICATION',
        time: 'Day 1, 09:11 AM',
        text: 'The Department of Defense has confirmed hostile inbound ballistic trajectories over the northeastern corridor. Effective immediately: All civilians are instructed to take shelter in reinforced subterranean structures (subway tunnels, deep basements). Seal all blast vestibules and air dampers. Estimated fallout half-life neutralization window: 30 days.'
      }
    ];

    // Call Log
    this.calls = [
      {
        contact: 'Mom',
        number: '(212) 555-0194',
        type: 'missed',
        time: 'Day 1, 09:08 AM',
        hasVoicemail: true,
        voicemailText: '"Honey, where are you?! The sirens are going off everywhere on the street! People are running into the street... oh god, what is that sound in the sky—"'
      },
      {
        contact: 'Subway Emergency Line',
        number: '911',
        type: 'failed',
        time: 'Day 1, 09:16 AM',
        hasVoicemail: false
      }
    ];

    // Gallery / Photos on Phone
    this.photos = [
      {
        id: 'photo_commute',
        title: 'Morning Train Interior',
        date: 'Day 1, 08:50 AM',
        url: '/assets/emergency_poster.jpg',
        caption: 'The civil defense placard posted right above the door. "REMAIN BELOW GROUND".'
      }
    ];

    // Evidence & Journal Entries
    this.journal = [
      {
        id: 'journal_day_1',
        day: 1,
        title: 'The Departure',
        content: 'The emergency sirens sounded. Train ground to a halt midway between stations. The captain said through the intercom: "Stay inside the car. Do not open the doors under any circumstances." They didn\'t listen. They forced the doors open and vanished into the dark platform. I stayed and pulled the doors shut. 30 days. That\'s what the alert said.'
      }
    ];

    // Encounters state
    this.day10EncounterTriggered = false;
    this.day10Outcome = null; // 'spoke', 'refused', 'opened_doors'
    this.day20Outcome = null;
    this.endingTriggered = null;

    // Environmental discoveries
    this.discoveredItems = new Set();
    this.hasListenedAtDoors = false;

    this.loadState();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn(this));
    this.saveState();
  }

  saveState() {
    try {
      const data = {
        day: this.day,
        timeMinutes: this.timeMinutes,
        thirst: this.thirst,
        hunger: this.hunger,
        fatigue: this.fatigue,
        phoneBattery: this.phoneBattery,
        flashlightOn: this.flashlightOn,
        doorsLocked: this.doorsLocked,
        doorsOpen: this.doorsOpen,
        maintenanceUnlocked: this.maintenanceUnlocked,
        maintenanceLooted: this.maintenanceLooted,
        inventory: this.inventory,
        messages: this.messages,
        alerts: this.alerts,
        journal: this.journal,
        photos: this.photos,
        day10EncounterTriggered: this.day10EncounterTriggered,
        day10Outcome: this.day10Outcome,
        day20Outcome: this.day20Outcome,
        discoveredItems: Array.from(this.discoveredItems)
      };
      localStorage.setItem('the_last_car_save', JSON.stringify(data));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  loadState() {
    try {
      const saved = localStorage.getItem('the_last_car_save');
      if (saved) {
        const data = JSON.parse(saved);
        Object.assign(this, data);
        if (data.discoveredItems) {
          this.discoveredItems = new Set(data.discoveredItems);
        }
      }
    } catch (e) {
      console.warn('Load failed:', e);
    }
  }

  clearSave() {
    localStorage.removeItem('the_last_car_save');
    this.reset();
    this.notify();
  }

  // Time & Tick Simulation (called every second)
  tick(dt) {
    // Battery drain
    if (this.flashlightOn && this.phoneBattery > 0) {
      this.phoneBattery = Math.max(0, this.phoneBattery - 0.08 * dt);
      if (this.phoneBattery === 0) {
        this.flashlightOn = false;
      }
    }
    if (this.phoneOpen && this.phoneBattery > 0) {
      this.phoneBattery = Math.max(0, this.phoneBattery - 0.03 * dt);
    }

    // Passive thirst and hunger (slowly increases during real-time exploration)
    this.thirst = Math.min(100, this.thirst + 0.02 * dt);
    this.hunger = Math.min(100, this.hunger + 0.01 * dt);

    // Biological feedback loop: extreme dehydration / starvation stresses the heart & lungs
    if (this.thirst >= 80 || this.hunger >= 80) {
      sound.setHeartRate(94, 0.45);
      sound.setBreathingState('exhausted');
    } else if (this.thirst >= 50 || this.hunger >= 50 || this.fatigue >= 70) {
      if (sound.heartRate < 70) sound.setHeartRate(70, 0.28);
    }

    this.notify();
  }

  // Toggle Flashlight
  toggleFlashlight() {
    if (this.phoneBattery <= 0) {
      this.flashlightOn = false;
      return false;
    }
    this.flashlightOn = !this.flashlightOn;
    this.notify();
    return this.flashlightOn;
  }

  // Consuming water
  drinkWater() {
    const item = this.inventory.find((i) => i.id === 'water_bottle' || i.id === 'canned_water');
    if (!item || item.uses <= 0) return false;

    item.uses--;
    this.thirst = Math.max(0, this.thirst - 30);
    if (item.uses === 0) {
      item.name = 'Empty Water Bottle';
      item.description = 'An empty plastic bottle. Bone dry.';
      item.type = 'misc';
    }
    this.notify();
    return true;
  }

  // Consuming food
  eatFood() {
    const item = this.inventory.find((i) => i.id === 'chips_bag' || i.id === 'granola_bar' || i.id === 'emergency_rations');
    if (!item || item.uses <= 0) return false;

    item.uses--;
    this.hunger = Math.max(0, this.hunger - 35);
    
    // Salty chips increase thirst by design!
    if (item.id === 'chips_bag') {
      this.thirst = Math.min(100, this.thirst + 12);
    }

    if (item.uses === 0) {
      item.name = 'Empty Foil Wrapper';
      item.description = 'Crumpled greasy foil wrapper with a few salt crumbs.';
      item.type = 'misc';
    }
    this.notify();
    return true;
  }

  // Sleep / Rest action
  sleep() {
    // Sleeping restores fatigue, but increases thirst and hunger and advances to next day!
    this.fatigue = Math.max(0, this.fatigue - 70);
    this.thirst = Math.min(100, this.thirst + 22);
    this.hunger = Math.min(100, this.hunger + 18);
    this.advanceDay();
  }

  // Jump or advance day
  advanceDay(targetDay = null) {
    if (targetDay !== null) {
      this.day = targetDay;
    } else {
      this.day++;
    }

    // Reset daytime hour
    this.timeMinutes = 8 * 60 + Math.floor(Math.random() * 45);

    // Trigger Day-specific story events
    this.evaluateDayProgression();
    this.notify();
  }

  // Evaluate story milestones based on Day
  evaluateDayProgression() {
    // Day 4: Maintenance compartment discovery
    if (this.day >= 4 && !this.discoveredItems.has('maintenance_note')) {
      this.discoveredItems.add('maintenance_note');
      this.addJournalEntry(
        'day_4_note',
        4,
        'The Locked Compartment',
        'Noticed a locked service panel at the end of the car beneath the operator cab. Requires a triangular transit key. There might be backup supplies inside.'
      );
    }

    // Day 7: Found phone with pre-strike anomaly
    if (this.day >= 7 && !this.discoveredItems.has('passenger_phone_photo')) {
      this.discoveredItems.add('passenger_phone_photo');
      this.photos.push({
        id: 'photo_anomaly',
        title: 'Passenger Camera Roll - 3 Days Before Alert',
        date: 'October 15, 11:22 PM',
        url: '/assets/predisaster_photo.jpg',
        caption: 'A selfie of two smiling passengers on this exact platform. But look deep into the dark tunnel behind them. That silhouette... its arms are far too long. That wasn\'t caused by the nuclear strikes.'
      });
      this.addJournalEntry(
        'day_7_photo',
        7,
        'The Photograph',
        'Found an abandoned phone wedged between seat cushions. The battery had enough residual juice to power on. One photo from days BEFORE the missile alert shows something standing in the tunnel shadows. Whatever is out there was already here.'
      );
    }

    // Day 8: Mysterious text
    if (this.day >= 8 && !this.messages.some((m) => m.id === 'msg_unknown_1')) {
      this.messages.push({
        id: 'msg_unknown_1',
        sender: 'Unknown Sender',
        timestamp: 'Day 8, 02:44 AM',
        text: 'are you still on the train?',
        unread: true
      });
    }

    // Day 10: The Woman arrives
    if (this.day === 10) {
      this.day10EncounterTriggered = true;
    }

    // Day 14: Pre-incident logs
    if (this.day >= 14 && !this.discoveredItems.has('incident_report')) {
      this.discoveredItems.add('incident_report');
      this.addJournalEntry(
        'day_14_report',
        14,
        'Maintenance Log: Restricted Access',
        'Found a carbon-copy transit report dated six months ago. Track workers reported unexplained sounds and a worker named Vance disappeared in section 9. The area was welded shut without explanation.'
      );
    }

    // Day 18: Radio fragment
    if (this.day >= 18 && !this.discoveredItems.has('radio_fragment')) {
      this.discoveredItems.add('radio_fragment');
      this.alerts.push({
        id: 'alert_corrupt_radio',
        title: 'CORRUPTED AM BROADCAST FRAGMENT',
        time: 'Day 18, 04:12 PM',
        text: '...[heavy static]... quarantine was established prior to detonation... repeat, the missiles were targeted at the epicenter below the city, not foreign... [static screaming]... do not trust voices that know your name...'
      });
    }

    // Day 23: Fragmented broadcast
    if (this.day >= 23 && !this.discoveredItems.has('day_23_broadcast')) {
      this.discoveredItems.add('day_23_broadcast');
      this.messages.push({
        id: 'msg_broadcast_23',
        sender: 'CIVIL DEFENSE RELAY',
        timestamp: 'Day 23, 11:05 AM',
        text: 'ADVISORY: Radiation levels within transit line B have subsided to survivable levels. Evacuation units dispatched. If contacted, verify biometric identification.',
        unread: true
      });
    }

    // Day 27: Pre-knowledge doc
    if (this.day >= 27 && !this.discoveredItems.has('pre_knowledge_doc')) {
      this.discoveredItems.add('pre_knowledge_doc');
      this.addJournalEntry(
        'day_27_memo',
        27,
        'The Sealed Protocol',
        'Someone in city transit leadership knew. The emergency broadcast instructions explicitly forbade passengers from opening subway car doors. The train wasn\'t stranded by accident—it was a containment cell.'
      );
    }

    // Day 30: The Countdown End
    if (this.day >= 30) {
      this.addJournalEntry(
        'day_30_countdown',
        30,
        'Day 30: The 30th Sunrise Underground',
        'The 30-day civil defense window has elapsed. The counter has stopped. But outside the glass, the tunnel is either silent or waiting. It is time to decide: stay, escape, or open the doors.'
      );
    }
  }

  addJournalEntry(id, day, title, content) {
    if (!this.journal.some((j) => j.id === id)) {
      this.journal.unshift({ id, day, title, content });
      this.notify();
    }
  }

  addItem(item) {
    this.inventory.push(item);
    this.notify();
  }

  // Calculate player's condition description
  getCondition() {
    if (this.thirst >= 85 || this.hunger >= 85) {
      return { status: 'Critical / Delirious', class: 'critical', pulse: true };
    }
    if (this.thirst >= 65 || this.hunger >= 65 || this.fatigue >= 80) {
      return { status: 'Weak & Dehydrated', class: 'danger', pulse: false };
    }
    if (this.thirst >= 40 || this.hunger >= 40 || this.fatigue >= 50) {
      return { status: 'Fatigued & Thirsty', class: 'warning', pulse: false };
    }
    return { status: 'Stable', class: 'healthy', pulse: false };
  }

  // Endings Trigger Logic
  determineEnding() {
    // Ending F: The Unanswered Question (Found all clues, stayed inside until Day 30)
    if (this.day >= 30 && this.discoveredItems.has('passenger_phone_photo') && this.discoveredItems.has('incident_report') && this.discoveredItems.has('pre_knowledge_doc') && this.doorsLocked) {
      return 'Ending F: The Unanswered Question';
    }
    // Ending C: The Invitation (Opened doors for the woman or outside voice)
    if (this.day10Outcome === 'opened_doors' || this.day20Outcome === 'opened_doors' || (!this.doorsLocked && this.doorsOpen)) {
      return 'Ending C: The Invitation';
    }
    // Ending B: The Escape (Player unbarred doors and left train before Day 30 or deliberately chose escape)
    if (this.day < 30 && (!this.doorsLocked || this.doorsOpen)) {
      return 'Ending B: The Escape';
    }
    // Ending D: The Last Signal (Radio listened + replied to unknown message)
    if (this.discoveredItems.has('radio_fragment') && this.messages.some((m) => m.sender === 'You' && m.text.includes('train'))) {
      return 'Ending D: The Last Signal';
    }
    // Ending E: The Thirty-First Day (Player opens doors on Day 30 and steps out)
    if (this.day >= 30 && this.doorsOpen) {
      return 'Ending E: The Thirty-First Day';
    }
    // Default Ending A: The Survivor (Remained inside for 30 days)
    return 'Ending A: The Survivor';
  }
}

export const gameState = new GameState();
