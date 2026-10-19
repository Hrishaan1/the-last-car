// The Last Car - Comprehensive Narrative Director & Story Milestones
import { gameState } from './GameState.js';
import { sound } from '../audio/SoundEngine.js';

export class StoryManager {
  constructor(subwayScene, uiManager) {
    this.subwayScene = subwayScene;
    this.ui = uiManager;
    this.activeDialogue = null;
    this.isEncounterActive = false;
  }

  // Play the Day 1 Opening Departure Prologue
  playDay1Prologue() {
    this.ui.showNarrativeModal(
      'OCTOBER 18 — 09:11 AM',
      `The subway train shudders violently, metal grinding against ballast as the emergency brakes bite into the rails.
      <br><br>
      The overhead fluorescent lights flicker twice and die. In the gloom, the crimson emergency strips hum to life, bathing the passenger car in a blood-red haze.
      <br><br>
      Every smartphone in the car shrieks simultaneously with the shrill, jarring two-tone sirens of the National Emergency Alert System.
      <br><br>
      Over the crackling intercom, the train captain's voice echoes, strained and cracking:
      <br>
      <i>"ATTENTION PASSENGERS. THIS IS THE TRAIN OPERATOR. SEEK IMMEDIATE SHELTER. DO NOT LEAVE THE CAR. DO NOT OPEN THE DOORS UNDER ANY CIRCUMSTANCES. I REPEAT: DO NOT OPEN THE DOORS."</i>
      <br><br>
      Panic erupts. Shouting passengers crowd the doors, forcing the emergency manual release lever. The center doors hiss open. In a frantic surge, everyone scrambles out onto the pitch-black platform.
      <br><br>
      A woman in a dark winter coat glances back once before being swallowed by the darkness.
      <br><br>
      You stay behind. You pull the emergency lever down and lock the doors.
      <br><br>
      <b>The countdown begins: 30 DAYS UNTIL FALLOUT IS SURVIVABLE.</b>`,
      () => {
        sound.playEASAlert(2.0);
        sound.playDoorKnock();
        setTimeout(() => {
          sound.speakVoice({
            character: 'captain',
            text: "Attention passengers. This is the train operator. Seek immediate shelter. Do not leave the car. Do not open the doors under any circumstances. I repeat: do not open the doors."
          });
        }, 1400);
      }
    );
  }

  // Trigger Day 10 Encounter: The Woman
  triggerDay10Encounter() {
    if (this.isEncounterActive) return;
    this.isEncounterActive = true;

    // 1. Play knocking sound & tense breathing/heartbeat
    sound.playDoorKnock();
    sound.setHeartRate(78, 0.35);
    sound.setBreathingState('tense');
    this.subwayScene.spawnTheWoman();

    setTimeout(() => {
      this.startDay10Dialogue();
    }, 1200);
  }

  startDay10Dialogue() {
    sound.speakVoice({
      character: 'woman',
      text: "Hello? Is someone still in there? Please... I saw the emergency light. Can you hear me?"
    });

    this.ui.showDialogue({
      speaker: 'Familiar Voice Outside Door',
      text: '"Hello? Is someone still in there? Please... I saw the emergency light. Can you hear me?"',
      choices: [
        {
          label: '"Who is that? Where did you come from?"',
          action: () => this.day10BranchQuestions()
        },
        {
          label: '"Do you have water? What happened outside?"',
          action: () => this.day10BranchSupplies()
        },
        {
          label: '"The subway captain told us never to open the doors."',
          action: () => this.day10BranchCaptain()
        },
        {
          label: '[Remain silent and listen carefully]',
          action: () => this.day10BranchSilence()
        }
      ]
    });
  }

  day10BranchQuestions() {
    sound.speakVoice({
      character: 'woman',
      text: "I was on this train with you on the first day... remember? I was wearing this dark trench coat. We found a dry utility bunker down the tracks. There are other survivors. We have bottled water and canned food... you don't have to starve in that metal box. Please, just pull the lever and open the door."
    });

    this.ui.showDialogue({
      speaker: 'Familiar Voice Outside Door',
      text: '"I was on this train with you on the first day... remember? I was wearing this dark trench coat. We found a dry utility bunker down the tracks. There are other survivors. We have bottled water and canned food... you don\'t have to starve in that metal box. Please, just pull the lever and open the door."',
      choices: [
        {
          label: '"I have to wait out the 30 days here."',
          action: () => this.day10ClimaxRefusal()
        },
        {
          label: '"Hold the water bottle up to the window first."',
          action: () => this.day10ClimaxSuspicion()
        },
        {
          label: '[Pull the door lever and unseal the car]',
          action: () => this.day10OpenDoorEnding()
        }
      ]
    });
  }

  day10BranchSupplies() {
    sound.speakVoice({
      character: 'woman',
      text: "Yes! We found a maintenance cache near station 4. Clean water, dry rations, first-aid kits. We've been searching the stalled cars for anyone left behind. You look so pale through the glass... let me in, or come with us. It's safe out here now."
    });

    this.ui.showDialogue({
      speaker: 'Familiar Voice Outside Door',
      text: '"Yes! We found a maintenance cache near station 4. Clean water, dry rations, first-aid kits. We\'ve been searching the stalled cars for anyone left behind. You look so pale through the glass... let me in, or come with us. It\'s safe out here now."',
      choices: [
        {
          label: '"I\'m staying inside until Day 30."',
          action: () => this.day10ClimaxRefusal()
        },
        {
          label: '"Something isn\'t right about how you sound."',
          action: () => this.day10ClimaxSuspicion()
        },
        {
          label: '[Pull the door lever and unseal the car]',
          action: () => this.day10OpenDoorEnding()
        }
      ]
    });
  }

  day10BranchCaptain() {
    sound.speakVoice({
      character: 'woman',
      text: "The captain didn't know what was happening... nobody did. If we had stayed in these cars, we would have run out of air and water in a week. Look around you—your food is almost gone, isn't it? We can help each other. Just slide the latch."
    });

    this.ui.showDialogue({
      speaker: 'Familiar Voice Outside Door',
      text: '"The captain didn\'t know what was happening... nobody did. If we had stayed in these cars, we would have run out of air and water in a week. Look around you—your food is almost gone, isn\'t it? We can help each other. Just slide the latch."',
      choices: [
        {
          label: '"No. I am not opening this door."',
          action: () => this.day10ClimaxRefusal()
        },
        {
          label: '[Pull the door lever and unseal the car]',
          action: () => this.day10OpenDoorEnding()
        }
      ]
    });
  }

  day10BranchSilence() {
    sound.speakVoice({
      character: 'woman',
      text: "I know you can hear me. I can see the condensation from your breath on the glass. It's okay to be scared. We were scared too. But staying in there alone... that's how people lose their minds."
    });

    this.ui.showDialogue({
      speaker: 'Familiar Voice Outside Door',
      text: '"I know you can hear me. I can see the condensation from your breath on the glass. It\'s okay to be scared. We were scared too. But staying in there alone... that\'s how people lose their minds."',
      choices: [
        {
          label: '"Leave. Now."',
          action: () => this.day10ClimaxRefusal()
        },
        {
          label: '[Stay silent and step back into the shadows]',
          action: () => this.day10ClimaxRefusal()
        }
      ]
    });
  }

  // The Horror Climax: The Woman reveals her impossible anatomy and walks away
  day10ClimaxRefusal() {
    gameState.day10Outcome = 'refused';
    sound.speakVoice({
      character: 'woman',
      text: "I understand. I won't force you. I'll wait while you think about it..."
    });

    this.ui.showDialogue({
      speaker: 'The Woman',
      text: '"I understand. I won\'t force you. I\'ll wait while you think about it..."',
      choices: [
        {
          label: '[Watch her through the door window]',
          action: () => {
            this.ui.hideDialogue();
            this.subwayScene.startWomanWalkAway();
            sound.playCreatureGait();
            sound.setHeartRate(115, 0.5);
            sound.setBreathingState('tense');

            // Subtitle caption during horror reveal
            setTimeout(() => {
              this.ui.showSubtitles('As she turns to walk away, her silhouette shifts sickeningly in the dim red lighting.');
            }, 1000);

            setTimeout(() => {
              this.ui.showSubtitles('Her torso elongates. Four grotesque, multi-jointed biological limbs unfold from beneath her coat, clicking against the concrete in an impossible, coordinated gait.');
            }, 3500);

            setTimeout(() => {
              this.ui.showSubtitles('She pauses at the edge of the tunnel darkness. Her head turns slowly backward toward your window.');
            }, 6500);

            setTimeout(() => {
              this.ui.showSubtitles('"You should\'ve come with us."');
              sound.speakVoice({
                character: 'woman_whisper',
                text: "You should've come with us."
              });
            }, 8800);

            setTimeout(() => {
              this.ui.showSubtitles('The skittering of her impossible limbs fades into the subterranean silence.');
              this.isEncounterActive = false;
              sound.setHeartRate(54, 0.18);
              sound.setBreathingState('calm');
              gameState.addJournalEntry(
                'day_10_reveal',
                10,
                'The Woman on Day 10',
                'She sounded completely human. She remembered the departure on Day 1. She offered water. But when she walked away... four extra fleshy limbs emerged from beneath her clothing. She moved like a spider. Her anatomy is fundamentally wrong. What happened to the passengers?'
              );
            }, 12500);
          }
        }
      ]
    });
  }

  day10ClimaxSuspicion() {
    this.day10ClimaxRefusal();
  }

  // Player made the fatal or risky mistake of opening the doors
  day10OpenDoorEnding() {
    gameState.day10Outcome = 'opened_doors';
    gameState.doorsOpen = true;
    gameState.doorsLocked = false;
    this.ui.hideDialogue();
    this.triggerEnding('Ending C: The Invitation');
  }

  // Trigger Day 20 Encounter: The Survivor Offer
  triggerDay20Encounter() {
    if (this.isEncounterActive) return;
    this.isEncounterActive = true;
    sound.playDoorKnock();
    sound.setHeartRate(72, 0.3);

    setTimeout(() => {
      sound.speakVoice({
        character: 'survivor',
        text: "Hey! Anyone in 402? We found a maintenance shaft leading up to street level near 8th Ave. Radiation on the surface has dissipated in sector 2. We're evacuating in ten minutes. If you want out, this is your last chance."
      });

      this.ui.showDialogue({
        speaker: 'Male Voice Outside Doors',
        text: '"Hey! Anyone in 402? We found a maintenance shaft leading up to street level near 8th Ave. Radiation on the surface has dissipated in sector 2. We\'re evacuating in ten minutes. If you want out, this is your last chance."',
        choices: [
          {
            label: '"How do you know sector 2 is clear?"',
            action: () => {
              sound.speakVoice({
                character: 'survivor',
                text: "Civil defense geiger teams checked the avenue yesterday. Look, I don't have all day to debate. Come or rot here."
              });

              this.ui.showDialogue({
                speaker: 'Male Voice Outside Doors',
                text: '"Civil defense geiger teams checked the avenue yesterday. Look, I don\'t have all day to debate. Come or rot here."',
                choices: [
                  {
                    label: '"I\'m staying on the train until Day 30."',
                    action: () => {
                      this.ui.hideDialogue();
                      this.isEncounterActive = false;
                      gameState.day20Outcome = 'refused';
                      sound.setHeartRate(54, 0.18);
                      gameState.addJournalEntry(
                        'day_20_encounter',
                        20,
                        'The Surface Evacuation Claim',
                        'A man claimed sector 2 was clear and offered an exit route. But earlier emergency memos stated surface fallout half-life was at least 30 days. Did he lie, or did the creatures learn to mimic rescue procedures?'
                      );
                    }
                  },
                  {
                    label: '[Unbar doors and step out onto platform]',
                    action: () => {
                      gameState.day20Outcome = 'opened_doors';
                      this.triggerEnding('Ending B: The Escape');
                    }
                  }
                ]
              });
            }
          },
          {
            label: '"I am staying inside. Leave me alone."',
            action: () => {
              this.ui.hideDialogue();
              this.isEncounterActive = false;
              gameState.day20Outcome = 'refused';
            }
          }
        ]
      });
    }, 1500);
  }

  // Trigger Ending sequence
  triggerEnding(endingName = null) {
    const ending = endingName || gameState.determineEnding();
    gameState.endingTriggered = ending;

    let title = ending;
    let text = '';

    switch (ending) {
      case 'Ending A: The Survivor':
        text = `You reached Day 30.
        <br><br>
        For thirty days, you never opened the doors. You rationed every drop of water and every crumb of food. You listened to the skittering outside, the voices imitating people you used to know, and the silence of the earth.
        <br><br>
        At 09:14 AM on Day 30, the emergency radio hums with carrier wave static. In the distance down the tunnel, you hear the deep metallic rumble of steel wheels on rails.
        <br><br>
        Human voices echo through the tunnel, calling out with megaphones: <i>"Survivor search team, Line B! Any living personnel, respond!"</i>
        <br><br>
        For the first time in a month, the subway sounds almost normal.
        <br><br>
        You stand before the center doors. Your hand rests on the emergency latch.
        <br><br>
        Are they real rescuers? Or has whatever lives in the tunnel simply perfected its voice?
        <br><br>
        <b>The countdown has ended. The uncertainty has not.</b>`;
        break;

      case 'Ending B: The Escape':
        text = `You unbarred the heavy doors and stepped into the subterranean dark.
        <br><br>
        The air on the platform is thick with ozone and cold concrete dust. You step past abandoned luggage, broken phones, and silent tiled pillars.
        <br><br>
        Ahead in the distance, a faint green emergency exit sign glows above a flight of stairs leading towards street level.
        <br><br>
        Then, directly behind you, three feet away on the platform, a familiar voice whispers in your ear:
        <br><br>
        <i>"You should've stayed in the car."</i>
        <br><br>
        You turn.
        <br><br>
        <b>FADE TO BLACK.</b>`;
        break;

      case 'Ending C: The Invitation':
        text = `You pulled the emergency latch. The center doors slid open with a heavy pneumatic gasp.
        <br><br>
        The person standing on the platform smiled warmly. They handed you a fresh bottle of water. They answered your questions with relief and laughter.
        <br><br>
        For ten minutes, you sat side by side on the plastic subway bench, sharing stories of the day the sirens rang.
        <br><br>
        Then, as you took a drink, you noticed their reflection in the dark car window.
        <br><br>
        In the reflection, their body has four extra arms, gently curling around the back of your seat.
        <br><br>
        <i>"Don't worry,"</i> they whisper without turning around. <i>"It only hurts for a little while."</i>`;
        break;

      case 'Ending D: The Last Signal':
        text = `You patched the emergency radio into your smartphone and sent an encrypted query onto the civil defense band.
        <br><br>
        A crackling voice responded: <i>"Line B car 402... do you copy? You must understand... the strikes were never foreign. The missiles were detonated over our own subway system to burn out what we discovered below the bedrock..."</i>
        <br><br>
        The transmission abruptly cut to static.
        <br><br>
        A second later, your smartphone chimed with an incoming local text.
        <br><br>
        <b>Unknown Sender:</b> "look beneath seat 7"
        <br><br>
        The message came from inside your own subway car.`;
        break;

      case 'Ending E: The Thirty-First Day':
        text = `Day 30 has elapsed. The countdown is officially complete.
        <br><br>
        You unlock the center doors and step out onto the platform.
        <br><br>
        The platform is dead quiet. The emergency lights are steady. There are no sounds of creatures, no screeching, no skittering.
        <br><br>
        At the far end of the platform, standing beneath an emergency lantern, a figure stands motionless.
        <br><br>
        They look completely ordinary. They turn their head toward you.
        <br><br>
        Neither of you speaks.`;
        break;

      case 'Ending F: The Unanswered Question':
        text = `You survived 30 days inside the car.
        <br><br>
        You assembled every fragment of the truth: the missing worker reports from six months before the sirens, the candid photo of the tall distorted entity on this very platform, the sealed civil defense containment memos.
        <br><br>
        The nuclear apocalypse was a cover story. A desperate attempt to vaporize something that had already rooted itself deep beneath the metropolis.
        <br><br>
        Suddenly, the crimson emergency lights in your car click off. Total, suffocating blackness.
        <br><br>
        Three seconds pass.
        <br><br>
        The lights hum back on.
        <br><br>
        Sitting directly across from you on the passenger bench is a commuter in business attire. They are quietly browsing a smartphone.
        <br><br>
        Slowly, they raise their head and look straight into your eyes.
        <br><br>
        <b>THE END.</b>`;
        break;
    }

    this.ui.showEndingScreen(title, text);
  }
}
