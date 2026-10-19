// The Last Car - First Person Controller & Raycast Interaction System
import * as THREE from 'three';
import { sound } from '../audio/SoundEngine.js';

export class FPSControls {
  constructor(camera, domElement, interactables, onInteractHover, onInteractTrigger) {
    this.camera = camera;
    this.domElement = domElement;
    this.interactables = interactables;
    this.onInteractHover = onInteractHover;
    this.onInteractTrigger = onInteractTrigger;

    this.isLocked = false;
    this.pitch = 0;
    this.yaw = 0;

    // Movement state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };

    this.velocity = new THREE.Vector3();
    this.moveSpeed = 2.4; // m/s
    this.headBobTimer = 0;
    this.baseCameraY = 1.65;

    // Interior boundaries of subway car
    this.bounds = {
      minX: -1.05,
      maxX: 1.05,
      minZ: -8.2,
      maxZ: 8.2
    };

    // Raycaster for interactable objects
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 2.6; // 2.6 meters reach
    this.currentHoverObject = null;

    this.initListeners();
  }

  initListeners() {
    // Pointer lock on canvas click
    this.domElement.addEventListener('click', () => {
      // If modal or phone is not open, lock pointer
      if (!this.isLocked && !document.body.classList.contains('ui-blocking')) {
        this.domElement.requestPointerLock?.();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;

      const sensitivity = 0.0022;
      this.yaw -= e.movementX * sensitivity;
      this.pitch -= e.movementY * sensitivity;

      // Clamp pitch to avoid neck snap (-85 to +85 degrees)
      const maxPitch = Math.PI / 2 - 0.08;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

      this.updateCameraRotation();
    });

    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'KeyE':
          if (this.currentHoverObject) {
            this.triggerInteraction(this.currentHoverObject);
          }
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
      }
    });

    // Also allow click on hovered object if pointer is locked
    window.addEventListener('mousedown', (e) => {
      if (this.isLocked && e.button === 0 && this.currentHoverObject) {
        this.triggerInteraction(this.currentHoverObject);
      }
    });
  }

  updateCameraRotation() {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = this.pitch;
    euler.y = this.yaw;
    this.camera.quaternion.setFromEuler(euler);
  }

  triggerInteraction(target) {
    if (this.onInteractTrigger) {
      this.onInteractTrigger(target.userData);
    }
  }

  update(dt) {
    if (dt > 0.1) dt = 0.1; // Clamp delta spikes

    // 1. Calculate movement direction relative to camera yaw
    const moveDir = new THREE.Vector3();
    if (this.keys.forward) moveDir.z -= 1;
    if (this.keys.backward) moveDir.z += 1;
    if (this.keys.left) moveDir.x -= 1;
    if (this.keys.right) moveDir.x += 1;

    const isMoving = moveDir.lengthSq() > 0;

    if (isMoving) {
      moveDir.normalize();
      // Rotate by yaw
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

      this.velocity.copy(moveDir).multiplyScalar(this.moveSpeed * dt);
      this.camera.position.add(this.velocity);

      // Keep within subway car walls
      this.camera.position.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.camera.position.x));
      this.camera.position.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, this.camera.position.z));

      // Natural Head Bobbing
      this.headBobTimer += dt * 8.5;
      const bobOffset = Math.sin(this.headBobTimer) * 0.032;
      this.camera.position.y = this.baseCameraY + bobOffset;

      // Reset idle timer when moving
      this.stillTimer = 0;
      sound.setTinnitusLevel(0.002);

      // Play footstep at cycle bottom
      if (Math.sin(this.headBobTimer) < -0.92 && !this.playedStep) {
        sound.playFootstep();
        this.playedStep = true;
      } else if (Math.sin(this.headBobTimer) > 0) {
        this.playedStep = false;
      }
    } else {
      // Idle gentle breathing sway
      this.headBobTimer += dt * 1.5;
      this.camera.position.y = this.baseCameraY + Math.sin(this.headBobTimer) * 0.008;

      // Fade in the deafening "too quiet it's loud" ear-ringing after standing still
      this.stillTimer = (this.stillTimer || 0) + dt;
      if (this.stillTimer > 1.5) {
        sound.setTinnitusLevel(0.014);
      }
    }

    // Proximity to dark windows shifts player breathing to tense
    const nearWindow = Math.abs(this.camera.position.x) > 0.88;
    if (nearWindow && !this.wasNearWindow) {
      this.wasNearWindow = true;
      sound.setBreathingState('tense');
    } else if (!nearWindow && this.wasNearWindow) {
      this.wasNearWindow = false;
      sound.setBreathingState('calm');
    }

    // 2. Raycast from camera center to detect interactable items
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactables, true);

    let foundInteractable = null;
    for (const hit of intersects) {
      // Find ancestor or hit that has userData with id
      let curr = hit.object;
      while (curr && !curr.userData?.id) {
        curr = curr.parent;
      }
      if (curr && curr.userData?.id) {
        foundInteractable = curr;
        break;
      }
    }

    if (foundInteractable !== this.currentHoverObject) {
      this.currentHoverObject = foundInteractable;
      if (this.onInteractHover) {
        this.onInteractHover(foundInteractable ? foundInteractable.userData : null);
      }
    }
  }
}
