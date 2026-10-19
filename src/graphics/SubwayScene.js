// The Last Car - 3D Subway Car Engine & Atmospheric Renderer
import * as THREE from 'three';

export class SubwayScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;

    // Fog for deep tunnel darkness
    this.scene.fog = new THREE.FogExp2(0x050608, 0.045);

    // Camera initial position (inside subway car center)
    this.camera.position.set(0, 1.65, 0);

    // Flashlight (linked to camera)
    this.flashlight = new THREE.SpotLight(0xfff4e0, 0, 18, Math.PI / 6, 0.45, 1.8);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 1024;
    this.flashlight.shadow.mapSize.height = 1024;
    this.flashlight.shadow.bias = -0.001;
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);

    // Interactable objects collection for raycaster
    this.interactables = [];

    // Lighting fixtures
    this.emergencyLights = [];

    // Animated entities
    this.theWomanEntity = null;
    this.isWomanWalkingAway = false;
    this.womanWalkProgress = 0;

    // Dust particles
    this.dustParticles = null;

    // Build the 3D subway environment
    this.initSubwayCar();
    this.initPlatformAndTunnel();
    this.initPosters();
    this.initInteractableProps();
    this.initAtmosphericDust();
    this.initWomanEntity();

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Build the complete authentic subway car interior
  initSubwayCar() {
    const carLength = 18.0;
    const carWidth = 2.8;
    const carHeight = 2.4;

    // 1. Subway Floor
    const floorGeo = new THREE.PlaneGeometry(carWidth, carLength, 16, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      roughness: 0.85,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Floor yellow safety track / center aisle line
    const lineGeo = new THREE.PlaneGeometry(0.08, carLength);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xc89624, transparent: true, opacity: 0.5 });
    const centerLine = new THREE.Mesh(lineGeo, lineMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.002, 0);
    this.scene.add(centerLine);

    // 2. Ceiling with curved vaulting
    const ceilingGeo = new THREE.CylinderGeometry(carWidth / 2, carWidth / 2, carLength, 32, 1, false, Math.PI, Math.PI);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x22252a,
      roughness: 0.7,
      metalness: 0.3,
      side: THREE.BackSide
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.z = Math.PI / 2;
    ceiling.rotation.y = Math.PI / 2;
    ceiling.position.set(0, carHeight - (carWidth / 2) * 0.4, 0);
    ceiling.receiveShadow = true;
    this.scene.add(ceiling);

    // 3. Walls with Windows and Door Cutouts
    this.buildSubwayWalls(carLength, carWidth, carHeight);

    // 4. Passenger Seats (rows on left and right)
    this.buildPassengerSeats(carLength, carWidth);

    // 5. Vertical Grab Poles & Horizontal Overhead Rails
    this.buildPolesAndRails(carLength, carWidth, carHeight);

    // 6. Emergency Red/Amber Lighting Fixtures
    this.buildEmergencyLights(carLength, carHeight);

    // 7. Bulkhead End Walls & Doors
    this.buildEndBulkheads(carLength, carWidth, carHeight);
  }

  // Construct wall panels, window frames, and glass panes
  buildSubwayWalls(carLength, carWidth, carHeight) {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2b2e35,
      roughness: 0.6,
      metalness: 0.4
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x11161d,
      transparent: true,
      opacity: 0.45,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.6,
      ior: 1.5
    });

    const halfW = carWidth / 2;

    // Both Left (Tunnel) and Right (Platform) Sides
    [-halfW, halfW].forEach((xSide, sideIndex) => {
      // Lower wall panels below windows
      const lowerWallGeo = new THREE.BoxGeometry(0.08, 0.9, carLength);
      const lowerWall = new THREE.Mesh(lowerWallGeo, wallMat);
      lowerWall.position.set(xSide, 0.45, 0);
      lowerWall.receiveShadow = true;
      this.scene.add(lowerWall);

      // Upper wall panels above windows
      const upperWallGeo = new THREE.BoxGeometry(0.08, 0.5, carLength);
      const upperWall = new THREE.Mesh(upperWallGeo, wallMat);
      upperWall.position.set(xSide, carHeight - 0.25, 0);
      upperWall.receiveShadow = true;
      this.scene.add(upperWall);

      // Windows along the side, interrupted by center doors
      const windowSegments = [-6.0, -3.5, 3.5, 6.0];
      windowSegments.forEach((zPos) => {
        const winGeo = new THREE.BoxGeometry(0.02, 1.0, 1.8);
        const win = new THREE.Mesh(winGeo, glassMat);
        win.position.set(xSide, 1.4, zPos);
        this.scene.add(win);

        // Window frame
        const frameGeo = new THREE.BoxGeometry(0.06, 1.04, 1.84);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x15171a, metalness: 0.7, roughness: 0.4 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.copy(win.position);
        frame.position.x += (xSide > 0 ? -0.01 : 0.01);
        this.scene.add(frame);
      });
    });

    // Center Subway Sliding Doors (Right Side, facing Platform)
    this.buildCenterDoors(halfW);
  }

  buildCenterDoors(halfW) {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(halfW - 0.02, 0, 0);

    const doorPanelMat = new THREE.MeshStandardMaterial({
      color: 0x3d414a,
      metalness: 0.8,
      roughness: 0.3
    });

    const rubberGasketMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0c,
      roughness: 0.9
    });

    // Left Leaf & Right Leaf
    [-0.55, 0.55].forEach((zOffset) => {
      const leafGeo = new THREE.BoxGeometry(0.05, 2.05, 1.05);
      const leaf = new THREE.Mesh(leafGeo, doorPanelMat);
      leaf.position.set(0, 1.05, zOffset);
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      doorGroup.add(leaf);

      // Glass viewing window in door
      const doorGlassGeo = new THREE.BoxGeometry(0.06, 1.1, 0.45);
      const doorGlassMat = new THREE.MeshPhysicalMaterial({
        color: 0x182028,
        transparent: true,
        opacity: 0.4,
        roughness: 0.1,
        transmission: 0.7
      });
      const doorGlass = new THREE.Mesh(doorGlassGeo, doorGlassMat);
      doorGlass.position.set(0, 1.4, zOffset);
      doorGroup.add(doorGlass);
    });

    // Center rubber seal strip
    const sealGeo = new THREE.BoxGeometry(0.07, 2.05, 0.06);
    const seal = new THREE.Mesh(sealGeo, rubberGasketMat);
    seal.position.set(0, 1.05, 0);
    doorGroup.add(seal);

    // Emergency manual release handle (red lever)
    const leverBaseGeo = new THREE.BoxGeometry(0.08, 0.18, 0.22);
    const leverBaseMat = new THREE.MeshStandardMaterial({ color: 0x8b1e1e });
    const leverBase = new THREE.Mesh(leverBaseGeo, leverBaseMat);
    leverBase.position.set(-0.06, 1.85, 0.9);
    doorGroup.add(leverBase);

    // Add door as interactable target
    doorGroup.userData = {
      id: 'subway_doors',
      name: 'Subway Sliding Doors',
      prompt: '[E] Inspect Doors / Listen Closely'
    };
    this.interactables.push(doorGroup);
    this.scene.add(doorGroup);
    this.centerDoorGroup = doorGroup;
  }

  // Row of passenger seats along left and right
  buildPassengerSeats(carLength, carWidth) {
    const seatMat = new THREE.MeshStandardMaterial({
      color: 0x22354c, // Subway transit blue/gray
      roughness: 0.65,
      metalness: 0.15
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x484d56,
      roughness: 0.4,
      metalness: 0.8
    });

    const seatSections = [
      { zStart: -7.5, zEnd: -2.0 },
      { zStart: 2.0, zEnd: 7.5 }
    ];

    [-1, 1].forEach((side) => {
      const xPos = side * (carWidth / 2 - 0.35);

      seatSections.forEach((section) => {
        const length = section.zEnd - section.zStart;
        const zMid = (section.zStart + section.zEnd) / 2;

        // Seat base / cushion
        const baseGeo = new THREE.BoxGeometry(0.55, 0.12, length);
        const base = new THREE.Mesh(baseGeo, seatMat);
        base.position.set(xPos, 0.45, zMid);
        base.castShadow = true;
        base.receiveShadow = true;
        this.scene.add(base);

        // Seat backrest
        const backGeo = new THREE.BoxGeometry(0.1, 0.55, length);
        const back = new THREE.Mesh(backGeo, seatMat);
        back.position.set(xPos + side * -0.22, 0.72, zMid);
        back.castShadow = true;
        back.receiveShadow = true;
        this.scene.add(back);

        // Stainless steel seat legs & divider bars
        for (let z = section.zStart; z <= section.zEnd; z += 1.8) {
          const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8);
          const leg = new THREE.Mesh(legGeo, frameMat);
          leg.position.set(xPos, 0.22, z);
          this.scene.add(leg);

          // Seat partition armrest
          const armGeo = new THREE.BoxGeometry(0.45, 0.03, 0.03);
          const arm = new THREE.Mesh(armGeo, frameMat);
          arm.position.set(xPos, 0.58, z);
          this.scene.add(arm);
        }

        // Make bench interactable (for resting/sleeping)
        const benchTrigger = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.6, length),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        benchTrigger.position.set(xPos, 0.55, zMid);
        benchTrigger.userData = {
          id: 'subway_bench',
          name: 'Passenger Bench',
          prompt: '[E] Rest / Sleep (Advances Day)'
        };
        this.interactables.push(benchTrigger);
        this.scene.add(benchTrigger);
      });
    });
  }

  // Vertical poles and overhead horizontal grab rails
  buildPolesAndRails(carLength, carWidth, carHeight) {
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x888f98,
      metalness: 0.9,
      roughness: 0.2
    });

    // Center vertical stanchion poles
    const polePositions = [-6.0, -3.0, 0, 3.0, 6.0];
    polePositions.forEach((z) => {
      const poleGeo = new THREE.CylinderGeometry(0.022, 0.022, carHeight, 16);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(0, carHeight / 2, z);
      pole.castShadow = true;
      this.scene.add(pole);
    });

    // Horizontal overhead grab rails along both aisles
    [-0.75, 0.75].forEach((x) => {
      const railGeo = new THREE.CylinderGeometry(0.018, 0.018, carLength - 1.0, 12);
      const rail = new THREE.Mesh(railGeo, poleMat);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(x, 1.95, 0);
      rail.castShadow = true;
      this.scene.add(rail);

      // Hanging grab straps
      for (let z = -7.0; z <= 7.0; z += 1.4) {
        if (Math.abs(z) < 0.8) continue; // Skip near center door
        const strapGeo = new THREE.BoxGeometry(0.02, 0.22, 0.02);
        const strapMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
        const strap = new THREE.Mesh(strapGeo, strapMat);
        strap.position.set(x, 1.82, z);
        this.scene.add(strap);

        const handleGeo = new THREE.TorusGeometry(0.05, 0.01, 8, 16);
        const handle = new THREE.Mesh(handleGeo, poleMat);
        handle.rotation.y = Math.PI / 2;
        handle.position.set(x, 1.68, z);
        this.scene.add(handle);
      }
    });
  }

  // Red/Amber Emergency Ceiling Lighting fixtures
  buildEmergencyLights(carLength, carHeight) {
    const lightPositions = [-6.5, -3.5, 0, 3.5, 6.5];

    lightPositions.forEach((z, index) => {
      // Light housing
      const housingGeo = new THREE.BoxGeometry(0.2, 0.05, 1.2);
      const housingMat = new THREE.MeshStandardMaterial({ color: 0x1f2228, metalness: 0.8 });
      const housing = new THREE.Mesh(housingGeo, housingMat);
      housing.position.set(0, carHeight - 0.03, z);
      this.scene.add(housing);

      // Emissive tube
      const tubeGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.1, 8);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0xff3b30,
        emissive: 0xbb1100,
        emissiveIntensity: 1.2
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.rotation.x = Math.PI / 2;
      tube.position.set(0, carHeight - 0.06, z);
      this.scene.add(tube);

      // PointLight with moody red/amber emergency glow
      const light = new THREE.PointLight(0xff3311, 0.85, 6.0, 1.4);
      light.position.set(0, carHeight - 0.15, z);
      light.castShadow = index % 2 === 0; // Shadow casting on alternate fixtures for performance
      if (light.castShadow) {
        light.shadow.bias = -0.002;
        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
      }
      this.scene.add(light);
      this.emergencyLights.push({ light, tube, baseIntensity: 0.85, zPos: z });
    });
  }

  // Bulkheads at the front (operator cab) and rear of the car
  buildEndBulkheads(carLength, carWidth, carHeight) {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x22262d,
      roughness: 0.7,
      metalness: 0.4
    });

    [-carLength / 2, carLength / 2].forEach((zPos, idx) => {
      const bulkheadGeo = new THREE.BoxGeometry(carWidth, carHeight, 0.1);
      const bulkhead = new THREE.Mesh(bulkheadGeo, wallMat);
      bulkhead.position.set(0, carHeight / 2, zPos);
      bulkhead.receiveShadow = true;
      this.scene.add(bulkhead);

      // Door to next car
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x333740, metalness: 0.7, roughness: 0.3 });
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.95, 0.05), doorMat);
      door.position.set(0, 1.0, zPos + (zPos > 0 ? -0.05 : 0.05));
      this.scene.add(door);

      // Small glass view window
      const winGeo = new THREE.BoxGeometry(0.3, 0.6, 0.08);
      const winMat = new THREE.MeshPhysicalMaterial({ color: 0x05080c, transparent: true, opacity: 0.6, roughness: 0.2 });
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(0, 1.4, door.position.z);
      this.scene.add(win);

      // Interaction for end door / peek into adjacent car
      const endDoorTrigger = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 2.0, 0.4),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      endDoorTrigger.position.set(0, 1.0, zPos + (zPos > 0 ? -0.2 : 0.2));
      endDoorTrigger.userData = {
        id: idx === 0 ? 'front_cab_door' : 'rear_bulkhead_door',
        name: idx === 0 ? 'Operator Cab Door' : 'Connecting Bulkhead Door',
        prompt: idx === 0 ? '[E] Peer into Operator Cab' : '[E] Peer into Adjacent Car'
      };
      this.interactables.push(endDoorTrigger);
      this.scene.add(endDoorTrigger);
    });
  }

  // Subway Platform outside the right windows and dark tunnel on the left
  initPlatformAndTunnel() {
    // 1. Right Side: Abandoned Subway Platform
    const platGeo = new THREE.PlaneGeometry(8.0, 30.0);
    const platMat = new THREE.MeshStandardMaterial({
      color: 0x14161a,
      roughness: 0.9,
      metalness: 0.1
    });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.rotation.x = -Math.PI / 2;
    platform.position.set(5.4, 0.05, 0);
    platform.receiveShadow = true;
    this.scene.add(platform);

    // Yellow safety tactile edge strip on platform
    const edgeGeo = new THREE.PlaneGeometry(0.35, 30.0);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xb8881e });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(1.58, 0.052, 0);
    this.scene.add(edge);

    // Platform tiled structural pillars
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x22262a,
      roughness: 0.8
    });
    [-8.0, -3.0, 3.0, 8.0].forEach((z) => {
      const pillarGeo = new THREE.BoxGeometry(0.65, 4.0, 0.65);
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(3.8, 2.0, z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);
    });

    // Platform rear wall
    const platWallGeo = new THREE.BoxGeometry(0.2, 4.0, 30.0);
    const platWallMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.95 });
    const platWall = new THREE.Mesh(platWallGeo, platWallMat);
    platWall.position.set(9.4, 2.0, 0);
    platWall.receiveShadow = true;
    this.scene.add(platWall);

    // Platform faint greenish-amber ceiling emergency light
    const platLight = new THREE.PointLight(0x406655, 0.5, 14.0, 1.8);
    platLight.position.set(4.5, 3.2, 0);
    this.scene.add(platLight);

    // 2. Left Side: Dark Tunnel Wall & Rail Bed
    const tunnelWallGeo = new THREE.BoxGeometry(0.2, 4.0, 30.0);
    const tunnelWallMat = new THREE.MeshStandardMaterial({ color: 0x0a0c0e, roughness: 0.95 });
    const tunnelWall = new THREE.Mesh(tunnelWallGeo, tunnelWallMat);
    tunnelWall.position.set(-3.5, 2.0, 0);
    tunnelWall.receiveShadow = true;
    this.scene.add(tunnelWall);

    // Tunnel rail tracks
    const railSteelMat = new THREE.MeshStandardMaterial({ color: 0x555860, metalness: 0.9, roughness: 0.3 });
    [-0.7, 0.7].forEach((xOff) => {
      const railLine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 30.0), railSteelMat);
      railLine.position.set(-2.2 + xOff, -0.05, 0);
      this.scene.add(railLine);
    });

    // Distant red tunnel signal beacon
    const signalLight = new THREE.PointLight(0xff0000, 0.3, 10);
    signalLight.position.set(-2.8, 1.2, -14.0);
    this.scene.add(signalLight);

    const signalSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff1111 })
    );
    signalSphere.position.copy(signalLight.position);
    this.scene.add(signalSphere);
  }

  // Load and mount generated posters and ad banners inside the car
  initPosters() {
    const textureLoader = new THREE.TextureLoader();

    // 1. Civil Defense Emergency Shelter Protocol Poster (near doors)
    textureLoader.load('/assets/emergency_poster.jpg', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const posterGeo = new THREE.PlaneGeometry(0.65, 0.9);
      const posterMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
      const posterMesh = new THREE.Mesh(posterGeo, posterMat);
      posterMesh.position.set(1.36, 1.5, -1.8);
      posterMesh.rotation.y = -Math.PI / 2;
      this.scene.add(posterMesh);

      // Frame
      const frameGeo = new THREE.BoxGeometry(0.02, 0.94, 0.69);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.copy(posterMesh.position);
      frame.position.x += 0.01;
      this.scene.add(frame);

      // Make interactable
      const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.65), new THREE.MeshBasicMaterial({ visible: false }));
      trigger.position.copy(posterMesh.position);
      trigger.userData = {
        id: 'emergency_poster',
        name: 'Emergency Shelter Protocol Placard',
        prompt: '[E] Read Emergency Protocol'
      };
      this.interactables.push(trigger);
      this.scene.add(trigger);
    });

    // 2. Vintage Nocturne Coffee Ad Banner (over left seat section)
    textureLoader.load('/assets/vintage_ad.jpg', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const adGeo = new THREE.PlaneGeometry(1.2, 0.55);
      const adMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
      const adMesh = new THREE.Mesh(adGeo, adMat);
      adMesh.position.set(-1.36, 1.95, -4.5);
      adMesh.rotation.y = Math.PI / 2;
      this.scene.add(adMesh);

      const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.55, 1.2), new THREE.MeshBasicMaterial({ visible: false }));
      trigger.position.copy(adMesh.position);
      trigger.userData = {
        id: 'vintage_ad',
        name: 'Nocturne Coffee Advertisement',
        prompt: '[E] Inspect Vintage Ad'
      };
      this.interactables.push(trigger);
      this.scene.add(trigger);
    });
  }

  // Interactive props: Breaker panel, Maintenance cabinet, Intercom, Abandoned luggage, Keychain
  initInteractableProps() {
    // 1. Electrical Breaker Panel (on wall near rear bulkhead)
    const panelBoxGeo = new THREE.BoxGeometry(0.12, 0.6, 0.45);
    const panelBoxMat = new THREE.MeshStandardMaterial({ color: 0x3d3f44, metalness: 0.8, roughness: 0.4 });
    const panelBox = new THREE.Mesh(panelBoxGeo, panelBoxMat);
    panelBox.position.set(-1.34, 1.4, 7.2);
    panelBox.castShadow = true;
    this.scene.add(panelBox);

    // Hazard yellow/black stripe texture indicator
    const hazardGeo = new THREE.PlaneGeometry(0.4, 0.1);
    const hazardMat = new THREE.MeshBasicMaterial({ color: 0xcc9900 });
    const hazard = new THREE.Mesh(hazardGeo, hazardMat);
    hazard.rotation.y = Math.PI / 2;
    hazard.position.set(-1.27, 1.62, 7.2);
    this.scene.add(hazard);

    panelBox.userData = {
      id: 'breaker_panel',
      name: 'Electrical Breaker Panel',
      prompt: '[E] Inspect Electrical Breakers'
    };
    this.interactables.push(panelBox);

    // 2. Locked Maintenance Compartment Cabinet (beneath rear bench / operator wall)
    const cabinetGeo = new THREE.BoxGeometry(0.7, 0.38, 0.7);
    const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x2e3238, metalness: 0.85, roughness: 0.3 });
    const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
    cabinet.position.set(0.9, 0.2, 8.4);
    cabinet.castShadow = true;
    this.scene.add(cabinet);

    // Triangular keyhole lock mesh
    const lockGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.04, 3);
    const lockMat = new THREE.MeshStandardMaterial({ color: 0xc89828, metalness: 0.9, roughness: 0.2 });
    const lock = new THREE.Mesh(lockGeo, lockMat);
    lock.rotation.z = Math.PI / 2;
    lock.position.set(0.54, 0.25, 8.4);
    this.scene.add(lock);

    cabinet.userData = {
      id: 'maintenance_cabinet',
      name: 'Locked Maintenance Cabinet',
      prompt: '[E] Inspect Locked Cabinet'
    };
    this.interactables.push(cabinet);

    // 3. Passenger Backpack left on seat
    const bagGeo = new THREE.BoxGeometry(0.35, 0.3, 0.25);
    const bagMat = new THREE.MeshStandardMaterial({ color: 0x3d352c, roughness: 0.9 });
    const bag = new THREE.Mesh(bagGeo, bagMat);
    bag.position.set(-1.05, 0.65, -4.2);
    bag.rotation.y = 0.3;
    bag.castShadow = true;
    this.scene.add(bag);

    bag.userData = {
      id: 'passenger_backpack',
      name: 'Abandoned Passenger Backpack',
      prompt: '[E] Search Backpack'
    };
    this.interactables.push(bag);

    // 4. Dropped Brass Transit Keychain on floor near doors
    const keyGeo = new THREE.BoxGeometry(0.04, 0.015, 0.08);
    const keyMat = new THREE.MeshStandardMaterial({ color: 0xdaa520, metalness: 0.9, roughness: 0.2 });
    const keyMesh = new THREE.Mesh(keyGeo, keyMat);
    keyMesh.position.set(0.4, 0.02, 0.8);
    keyMesh.rotation.y = 0.8;
    this.scene.add(keyMesh);

    keyMesh.userData = {
      id: 'dropped_key',
      name: 'Transit Service Key',
      prompt: '[E] Pick up Transit Key'
    };
    this.interactables.push(keyMesh);
    this.droppedKeyMesh = keyMesh;

    // 5. Emergency Intercom Station (beside doors)
    const intercomGeo = new THREE.BoxGeometry(0.08, 0.35, 0.2);
    const intercomMat = new THREE.MeshStandardMaterial({ color: 0x8b1e1e, metalness: 0.5 });
    const intercom = new THREE.Mesh(intercomGeo, intercomMat);
    intercom.position.set(1.36, 1.45, 1.8);
    this.scene.add(intercom);

    intercom.userData = {
      id: 'emergency_intercom',
      name: 'Emergency Train Intercom',
      prompt: '[E] Press Emergency Call Button'
    };
    this.interactables.push(intercom);
  }

  // Floating volumetric dust particles in the train air
  initAtmosphericDust() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 2.4;
      positions[i + 1] = Math.random() * 2.2;
      positions[i + 2] = (Math.random() - 0.5) * 16.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffeedd,
      size: 0.025,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.scene.add(this.dustParticles);
  }

  // Build the 3D entity for The Woman on Day 10
  initWomanEntity() {
    this.theWomanEntity = new THREE.Group();
    // Position outside center doors on the platform
    this.theWomanEntity.position.set(2.4, 0, 0);

    // Torso / Long Winter Trench Coat
    const coatGeo = new THREE.CylinderGeometry(0.22, 0.35, 1.15, 12);
    const coatMat = new THREE.MeshStandardMaterial({ color: 0x2b2826, roughness: 0.8 });
    const coat = new THREE.Mesh(coatGeo, coatMat);
    coat.position.y = 1.0;
    coat.castShadow = true;
    this.theWomanEntity.add(coat);

    // Head / Face
    const headGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x9e8a7c, roughness: 0.6 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.68;
    this.theWomanEntity.add(head);

    // Dark scarf / collar
    const scarfGeo = new THREE.TorusGeometry(0.14, 0.05, 8, 12);
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const scarf = new THREE.Mesh(scarfGeo, scarfMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 1.56;
    this.theWomanEntity.add(scarf);

    // Normal legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1f1f22, roughness: 0.8 });
    this.humanLegs = [];
    [-0.1, 0.1].forEach((x) => {
      const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.65, 8);
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, 0.33, 0);
      this.theWomanEntity.add(leg);
      this.humanLegs.push(leg);
    });

    // HORROR REVEAL: 4 Additional grotesque biological limbs tucked under coat
    this.extraLimbs = [];
    const limbMat = new THREE.MeshStandardMaterial({
      color: 0x4a2a28, // Wet fleshy dark crimson
      roughness: 0.4,
      metalness: 0.1
    });

    for (let i = 0; i < 4; i++) {
      const limbGroup = new THREE.Group();
      limbGroup.position.set((i % 2 === 0 ? -0.15 : 0.15), 0.75, (i < 2 ? -0.1 : 0.1));

      // Upper joint
      const upperGeo = new THREE.CylinderGeometry(0.035, 0.025, 0.6, 6);
      const upper = new THREE.Mesh(upperGeo, limbMat);
      upper.position.y = -0.3;
      limbGroup.add(upper);

      // Lower joint
      const lowerGeo = new THREE.CylinderGeometry(0.022, 0.012, 0.75, 6);
      const lower = new THREE.Mesh(lowerGeo, limbMat);
      lower.position.y = -0.65;
      lower.rotation.z = (i % 2 === 0 ? -0.4 : 0.4);
      limbGroup.add(lower);

      limbGroup.scale.set(0.01, 0.01, 0.01); // Hidden initially inside coat!
      this.theWomanEntity.add(limbGroup);
      this.extraLimbs.push(limbGroup);
    }

    this.theWomanEntity.visible = false; // Triggered specifically on Day 10
    this.scene.add(this.theWomanEntity);
  }

  // Trigger the Day 10 Encounter
  spawnTheWoman() {
    if (!this.theWomanEntity) return;
    this.theWomanEntity.position.set(2.35, 0, 0);
    this.theWomanEntity.rotation.y = -Math.PI / 2; // Facing the train doors
    this.theWomanEntity.visible = true;
    this.isWomanWalkingAway = false;
    this.womanWalkProgress = 0;
    // Keep limbs retracted
    this.extraLimbs.forEach((limb) => limb.scale.set(0.01, 0.01, 0.01));
  }

  // Trigger the chilling horror transformation & walk away
  startWomanWalkAway() {
    this.isWomanWalkingAway = true;
    this.womanWalkProgress = 0;
  }

  // Update loop called every frame
  update(time, dt, flashlightOn) {
    // 1. Update Flashlight position & direction to follow camera
    if (this.flashlight) {
      this.flashlight.position.copy(this.camera.position);
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      this.flashlightTarget.position.copy(this.camera.position).add(forward.multiplyScalar(10));
      this.flashlight.intensity = flashlightOn ? 2.8 : 0;
    }

    // 2. Realistic flickering emergency lights
    this.emergencyLights.forEach((item, idx) => {
      // Subtle organic voltage drift
      const flicker = Math.sin(time * 3 + idx * 1.5) * 0.05 + (Math.random() < 0.015 ? -0.4 : 0);
      const intensity = Math.max(0.1, item.baseIntensity + flicker);
      item.light.intensity = intensity;
      item.tube.material.emissiveIntensity = intensity * 1.4;
    });

    // 3. Subtle drift of atmospheric dust
    if (this.dustParticles) {
      const positions = this.dustParticles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 0.003;
        if (positions[i] < 0) positions[i] = 2.2;
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Animate The Woman walking away & unfolding extra limbs on Day 10
    if (this.isWomanWalkingAway && this.theWomanEntity && this.theWomanEntity.visible) {
      this.womanWalkProgress += dt * 0.45;

      // Unfold extra limbs smoothly from under coat!
      const deployFactor = Math.min(1.0, this.womanWalkProgress * 1.8);
      this.extraLimbs.forEach((limb, i) => {
        limb.scale.set(deployFactor, deployFactor, deployFactor);
        // Spidery multi-legged asynchronous movement
        const legPhase = time * 6.0 + i * 1.5;
        limb.rotation.x = Math.sin(legPhase) * 0.55;
        limb.rotation.z = (i % 2 === 0 ? -0.35 : 0.35) + Math.cos(legPhase) * 0.25;
      });

      // Elongate silhouette downwards
      this.theWomanEntity.position.y = Math.sin(time * 5) * 0.04;

      // Walk along the platform towards the dark tunnel (z = -12)
      this.theWomanEntity.position.z -= dt * 1.1;
      this.theWomanEntity.rotation.y = -Math.PI / 2 + Math.PI / 4; // Turned slightly away

      // Disappear into deep darkness
      if (this.theWomanEntity.position.z < -10.0) {
        this.theWomanEntity.visible = false;
        this.isWomanWalkingAway = false;
      }
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}
