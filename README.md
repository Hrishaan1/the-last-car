# THE LAST CAR
### A First-Person Psychological Survival Horror Game

> *"Stay inside the car. Do not open the doors under any circumstances."*  
> — Subway Train Operator, October 18, 09:11 AM

---

## 🚇 Overview
**THE LAST CAR** is a deeply atmospheric, first-person psychological survival horror game built around isolation, resource management, environmental storytelling, and an unexplained subterranean biological horror.

Following an emergency alert warning of incoming nuclear strikes, a commuter subway train screeches to a halt deep inside an underground tunnel. In the ensuing panic, all other passengers force the doors open and flee onto the dark platform. You choose to stay behind and lock the center doors.

The national alert promises that fallout half-life will drop to survivable levels after **30 days**. Your goal appears simple: survive for 30 days without leaving the subway car. But as the days pass, strange sounds echo through the tunnel, your smartphone receives impossible communications, and people knock on the glass.

Some sound like passengers you remember. And some are no longer human.

---

## 🎮 Controls & Interactions
- **Mouse**: Look around (Click the screen to lock camera cursor)
- **W / A / S / D**: Move through the interior of the subway car
- **E**: Interact with objects / Listen at doors / Inspect items
- **T or P**: Open / Close Smartphone
- **F**: Toggle Smartphone Flashlight (drains phone battery)
- **I or Tab**: Open Survival Supplies / Inventory
- **J**: Open Evidence Journal (30-Day investigation timeline)
- **ESC**: Options menu / Timeline Jump Debugger

---

## 🕯️ Core Mechanics
1. **Survival Systems**:
   - **Hydration**: You begin with one bottle of water. Every sip must be rationed. Scavenge canned emergency reserves or trade carefully.
   - **Hunger**: Barbecue potato chips restore calories but increase thirst due to sodium. Additional snacks can be found in abandoned commuter bags.
   - **Fatigue & Sleep**: Rest on the passenger vinyl seats to recover energy and advance time. Sleeping creates vulnerability—noises occur while you rest, items shift, and lights degrade.
   - **Physical Condition**: Deteriorates from Stable to Fatigued, Dehydrated, and Delirious with dynamic audio-visual feedback.

2. **The Smartphone**:
   - Begins at **68% battery**.
   - **Flashlight**: Illuminates the dark recesses of the train, casting dynamic real-time shadows, but drains battery rapidly.
   - **Messages**: Pre-disaster family texts, national emergency alert broadcasts, and unsettling incoming texts (*"are you still on the train?"*).
   - **Emergency Alerts**: Historical civil defense logs, contradictory radiation updates, and corrupted radio transcripts.
   - **Calls & Voicemail**: Listen to frantic last voicemails from loved ones.
   - **Camera Roll**: Found footage including an abandoned passenger selfie taken before the strikes that reveals an anomalous silhouette in the platform background.
   - **Audio Logs**: Listen to structural reverberation and detect wet multi-limbed skittering on concrete.

3. **Key Narrative Milestones**:
   - **Day 1**: The Departure (Prologue, emergency stop, panic, door sealed)
   - **Day 4**: The Locked Cabinet (Transit Key search)
   - **Day 7**: The Anomaly Photograph (Pre-disaster horror evidence)
   - **Day 8**: The Unexplained Text Message
   - **Day 10**: **THE WOMAN** (The iconic encounter: natural voice, offer of water, and the chilling reveal of impossible biological limbs walking away into darkness)
   - **Day 14**: Restricted Maintenance Incident Records (Missing tunnel crew Vance)
   - **Day 18**: Corrupted Radio Signal (Detonations over the epicenter)
   - **Day 20**: The Outside Survivor Dilemma
   - **Day 30**: **6 Distinct Endings** depending on your survival choices:
     - **Ending A: The Survivor** (Remained sealed inside for 30 days)
     - **Ending B: The Escape** (Forced doors and entered the dark tunnel)
     - **Ending C: The Invitation** (Unbarred doors for an outside voice)
     - **Ending D: The Last Signal** (Radio query and text from inside own car)
     - **Ending E: The Thirty-First Day** (Opening doors on Day 30 onto an empty platform)
     - **Ending F: The Unanswered Question** (Secret ending: All pre-disaster clues assembled, blackout, commuter sitting opposite)

---

## 🛠️ Architecture & Tech Stack
- **Engine**: Three.js (WebGL 60FPS) with ACES Filmic tone mapping, PCF soft shadows, and volumetric fog.
- **Audio & Voice System**: Web Audio API procedural synthesis engine:
  - **Voicelines**: Voiced characters using synthesized Web Audio filters and Web Speech API (Train Operator over PA, The Woman on Day 10 with whispered reveal, Mom's voicemail, Day 20 Survivor).
  - **Dynamic Breathing**: Procedural inhalation/exhalation cycles that shift to shallow and tense when near dark windows or during low condition.
  - **Biological Heartbeat**: Sub-bass dual-thud pulse (54 BPM resting) accelerating to 115 BPM during fear and dehydration.
  - **Footstep & Clothing Acoustics**: Alternating foot plants, linoleum sole scuffs, and nylon fabric rustle while moving.
  - **"Too Quiet It's Loud" Design**: Tinnitus isolation frequency (8.4 kHz) that gently fades in during dead silence, distant echoing tunnel water drips, steel chassis thermal pings, and low door seal wind drafts.
- **Styling**: Vanilla CSS with glassmorphism and psychological horror color palette.
- **Bundler**: Vite.
