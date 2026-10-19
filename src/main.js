// The Last Car - Main Entry Point
import { SubwayScene } from './graphics/SubwayScene.js';
import { FPSControls } from './controls/FPSControls.js';
import { UIManager } from './ui/UIManager.js';
import { StoryManager } from './game/StoryManager.js';
import { gameState } from './game/GameState.js';
import { sound } from './audio/SoundEngine.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('render-canvas');
  const subwayScene = new SubwayScene(canvas);
  const ui = new UIManager();
  const story = new StoryManager(subwayScene, ui);
  ui.setStoryManager(story);

  // Initialize Audio upon first user interaction
  const initAudioOnInteraction = () => {
    sound.init();
    sound.resume();
    window.removeEventListener('click', initAudioOnInteraction);
    window.removeEventListener('keydown', initAudioOnInteraction);
  };
  window.addEventListener('click', initAudioOnInteraction);
  window.addEventListener('keydown', initAudioOnInteraction);

  // First-person controller setup
  const controls = new FPSControls(
    subwayScene.camera,
    canvas,
    subwayScene.interactables,
    (hoverData) => {
      // Hover callback: update prompt on crosshair
      if (hoverData) {
        ui.setInteractionPrompt(hoverData.prompt || `[E] ${hoverData.name}`);
      } else {
        ui.setInteractionPrompt(null);
      }
    },
    (targetData) => {
      // Trigger interaction callback
      handleWorldInteraction(targetData, subwayScene, ui, story);
    }
  );

  // Interaction dispatcher for world objects
  function handleWorldInteraction(target, scene, uiManager, storyManager) {
    if (!target || !target.id) return;

    switch (target.id) {
      case 'subway_doors':
        handleDoorInteraction(uiManager, storyManager);
        break;

      case 'passenger_backpack':
        handleBackpackInteraction(uiManager);
        break;

      case 'dropped_key':
        handleKeyPickup(scene, uiManager);
        break;

      case 'subway_bench':
        uiManager.triggerDayTransition();
        break;

      case 'breaker_panel':
        handleBreakerInteraction(uiManager);
        break;

      case 'maintenance_cabinet':
        handleMaintenanceCabinet(scene, uiManager);
        break;

      case 'emergency_intercom':
        handleIntercom(uiManager);
        break;

      case 'emergency_poster':
        uiManager.showInspectModal(
          'EMERGENCY SHELTER PROTOCOL',
          `<b>NEW YORK CIVIL DEFENSE / NYCT EMERGENCY AGENCY</b><br><br>
          <b>IF ACTIVATED:</b> Seek immediately nearest designated fallout shelter. Remain below ground level.<br><br>
          <b>SEAL THE ENTRANCE:</b> Close blast doors, ventilation grates. Stay away from tunnel openings.<br><br>
          <b>MONITOR BROADCASTS:</b> Listen to Emergency Broadcast System (EBS). Do not rely on commercial cellular networks.<br><br>
          <b>NO EXIT DURING ALERT. DURATION: MANDATORY 30 DAYS.</b>`
        );
        break;

      case 'vintage_ad':
        uiManager.showInspectModal(
          'NOCTURNE COFFEE (1992)',
          `<i>"Fuel for the Night Train. Deep. Bold. Awake."</i><br><br>
          An aged, weathered transit advertisement banner peeled at the lower corner. In the background illustration of the city skyline, subtle hand-drawn silhouettes stand along the tracks.`
        );
        break;

      case 'front_cab_door':
        sound.playMetallicCreak();
        uiManager.showSubtitles('You peer through the thick wire-glass window into the operator\'s cabin. The control console is dead. The captain is gone.');
        break;

      case 'rear_bulkhead_door':
        sound.playMetallicCreak();
        if (gameState.day >= 17) {
          uiManager.showSubtitles('You look into the adjacent car. It looks completely identical to yours... even the crumpled chips wrapper on seat 3 is in the exact same spot.');
        } else {
          uiManager.showSubtitles('Looking through the reinforced glass into Car 401. Empty rows of vinyl seats stretch into darkness.');
        }
        break;
    }
  }

  function handleDoorInteraction(uiManager, storyManager) {
    // If Day 10 and not triggered, trigger The Woman
    if (gameState.day === 10 && !gameState.day10EncounterTriggered) {
      storyManager.triggerDay10Encounter();
      return;
    }

    uiManager.showDialogue({
      speaker: 'Center Subway Doors (Sealed)',
      text: 'Heavy stainless steel doors with reinforced dual-pane glass. The manual release lever is locked in the vertical position. Cold subterranean draft seeps through the bottom rubber gasket.',
      choices: [
        {
          label: 'Press ear against the door and listen',
          action: () => {
            uiManager.hideDialogue();
            sound.playDoorKnock();
            setTimeout(() => {
              if (gameState.day >= 15) {
                sound.playCreatureGait();
                uiManager.showSubtitles('You press your ear against the cold steel. Distant, wet scuttling footsteps echo along the platform tiles, then stop abruptly.');
              } else {
                uiManager.showSubtitles('You listen intently. Only the deep subterranean draft and the hum of ventilation grates.');
              }
            }, 600);
          }
        },
        {
          label: 'Peer through the door window onto the platform',
          action: () => {
            uiManager.hideDialogue();
            uiManager.showSubtitles('Through the scratched acrylic glass, the abandoned platform stretches into the shadows. Yellow safety line, tiled columns, distant dead darkness.');
          }
        },
        {
          label: 'Force the emergency release lever and open the doors',
          action: () => {
            uiManager.hideDialogue();
            if (confirm('Warning: Opening the doors breaks containment. Proceed?')) {
              gameState.doorsOpen = true;
              gameState.doorsLocked = false;
              storyManager.triggerEnding(gameState.day >= 30 ? 'Ending E: The Thirty-First Day' : 'Ending B: The Escape');
            }
          }
        },
        {
          label: 'Step away',
          action: () => {
            uiManager.hideDialogue();
          }
        }
      ]
    });
  }

  function handleBackpackInteraction(uiManager) {
    if (gameState.discoveredItems.has('looted_backpack')) {
      uiManager.showSubtitles('The backpack is empty. You already searched it.');
      return;
    }

    gameState.discoveredItems.add('looted_backpack');
    gameState.addItem({
      id: 'granola_bar',
      name: 'Oatmeal Granola Bar',
      type: 'consumable',
      icon: '🍫',
      uses: 2,
      maxUses: 2,
      description: 'A dense honey and oats snack bar found in a commuter\'s backpack.',
      lore: 'The wrapper has an expiration date from next year. It feels like a relic from another world.'
    });

    uiManager.showInspectModal(
      'COMMUTER BACKPACK SEARCH',
      `You unzip the abandoned backpack. Inside you discover:
      <br><br>
      • <b>1x Oatmeal Granola Bar</b> (Added to inventory)<br>
      • <b>A wallet with family pictures</b> (A husband, wife, and child at a beach)<br>
      • <b>A transit monthly pass</b> stamped October 18.<br><br>
      Whoever left this expected to be home by dinner.`
    );
  }

  function handleKeyPickup(scene, uiManager) {
    if (scene.droppedKeyMesh) {
      scene.scene.remove(scene.droppedKeyMesh);
      scene.droppedKeyMesh = null;
    }

    gameState.discoveredItems.add('picked_up_key');
    sound.playLockerUnlock();
    uiManager.showSubtitles('Picked up: Transit Service Key (Stamped MTA SERVICE CAB & UTILITY).');
  }

  function handleBreakerInteraction(uiManager) {
    sound.playLightFlicker();
    uiManager.showSubtitles('You flip the secondary auxiliary breaker. The red emergency lights flutter, voltage stabilizing momentarily.');
  }

  function handleMaintenanceCabinet(scene, uiManager) {
    if (gameState.maintenanceLooted) {
      uiManager.showSubtitles('The maintenance compartment is empty. All emergency reserves were retrieved.');
      return;
    }

    // Check if player has the Transit Key
    const hasKey = gameState.inventory.some((i) => i.id === 'subway_key') || gameState.discoveredItems.has('picked_up_key');

    if (!hasKey) {
      uiManager.showSubtitles('The utility cabinet is locked with a heavy triangular transit bolt. You need the Transit Service Key.');
      return;
    }

    sound.playLockerUnlock();
    gameState.maintenanceUnlocked = true;
    gameState.maintenanceLooted = true;

    // Add Emergency Supplies to inventory
    gameState.phoneBattery = Math.min(100, gameState.phoneBattery + 35);
    gameState.addItem({
      id: 'canned_water',
      name: 'Emergency Sealed Water Can',
      type: 'consumable',
      icon: '🥫',
      uses: 3,
      maxUses: 3,
      description: 'A 12oz hermetically sealed tin of drinking water dated from a transit survival kit.',
      lore: 'Government civil defense surplus. Guaranteed potable for 10 years.'
    });

    gameState.addJournalEntry(
      'day_4_cache',
      gameState.day,
      'Transit Service Cache Unlocked',
      'Unlocked the service cabinet using the transit key. Retrieved an emergency sealed water tin and an industrial backup power pack. The emergency phone battery is now recharged.'
    );

    uiManager.showInspectModal(
      'SERVICE CABINET OPENED',
      `The brass key turns with a sharp mechanical thud. The steel door swings open.
      <br><br>
      <b>SUPPLIES RETRIEVED:</b><br>
      • <b>1x Emergency Sealed Water Can</b> (Added to inventory)<br>
      • <b>Auxiliary 5V Power Bank</b> (+35% Phone Battery recharged!)<br>
      • <b>Incident Log Fragment:</b> Stamped <i>"RESTRICTED LINE B MAINTENANCE — SECTOR 9 UNEXPLAINED CASUALTIES"</i>`
    );
  }

  function handleIntercom(uiManager) {
    sound.playRadioStatic(1.8);
    sound.speakVoice({
      character: 'captain',
      text: "All trains hold positions. Line B sealed under civil defense order 14. Do not open car doors."
    });
    setTimeout(() => {
      uiManager.showSubtitles('The intercom speaker crackles with static: "...all trains hold positions... line B sealed under order 14... do not open car doors..."');
    }, 400);
  }

  // Play Day 1 prologue if first time loading
  if (gameState.day === 1 && !gameState.discoveredItems.has('prologue_seen')) {
    gameState.discoveredItems.add('prologue_seen');
    story.playDay1Prologue();
  }

  // Main Render & Simulation Loop
  let lastTime = performance.now();
  function animate(currentTime) {
    requestAnimationFrame(animate);
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Update survival simulation
    gameState.tick(dt);

    // Update first-person camera and raycaster
    controls.update(dt);

    // Update 3D scene (lighting, dust, animations)
    subwayScene.update(currentTime * 0.001, dt, gameState.flashlightOn);
  }

  requestAnimationFrame(animate);
});
