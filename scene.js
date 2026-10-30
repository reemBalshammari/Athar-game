import * as THREE from "three";
import { OBJLoader } from "./assets/OBJLoader.js";
const canvas = document.querySelector("#scene");
try {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(10, 8, 17);
  camera.lookAt(0, 2, 0);
  addSceneLights(scene);
  const laptopGroup = new THREE.Group();
  laptopGroup.rotation.y = -0.25;
  scene.add(laptopGroup);
  new OBJLoader().load(
    "assets/laptop.obj",
    (loadedModel) => {
      applyLaptopMaterials(loadedModel);
      laptopGroup.add(loadedModel);
      const screenTexture = createScreenTexture();
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(6.35, 3.75),
        new THREE.MeshBasicMaterial({ map: screenTexture }),
      );
      screen.position.set(0, 2.52, -1.86);
      laptopGroup.add(screen);
    },
    undefined,
    () => {
      canvas.style.opacity = "0";
    },
  );
  const particlePositions = [];
  for (let i = 0; i < 100; i++)
    particlePositions.push(
      (Math.random() - 0.5) * 35,
      Math.random() * 20 - 3,
      (Math.random() - 0.5) * 25,
    );
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(particlePositions, 3));
  const ambientParticles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({ color: 0x94b078, size: 0.035, transparent: true, opacity: 0.35 }),
  );
  scene.add(ambientParticles);
  function resizeScene() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    if (innerWidth < 650) {
      camera.position.set(9, 9, 22);
      camera.setViewOffset(
        innerWidth,
        innerHeight,
        -innerWidth * 0.08,
        -innerHeight * 0.1,
        innerWidth,
        innerHeight,
      );
      laptopGroup.scale.setScalar(0.6);
      laptopGroup.position.set(0, -0.8, 0);
    } else {
      camera.position.set(10, 8, 17);
      camera.setViewOffset(innerWidth, innerHeight, innerWidth * 0.22, 0, innerWidth, innerHeight);
      laptopGroup.scale.setScalar(1);
      laptopGroup.position.set(0, 0, 0);
    }
    camera.lookAt(0, 2, 0);
  }
  resizeScene();
  addEventListener("resize", resizeScene);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function renderFrame(t) {
    requestAnimationFrame(renderFrame);
    if (document.body.classList.contains("playing") || document.hidden) return;
    if (!reduceMotion) {
      laptopGroup.position.y = Math.sin(t * 0.0006) * 0.09;
      laptopGroup.rotation.y = -0.25 + Math.sin(t * 0.0002) * 0.04;
      ambientParticles.rotation.y = t * 0.000008;
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(renderFrame);
} catch (e) {
  canvas.style.display = "none";
  console.warn("3D decoration unavailable; puzzle remains playable.");
}

function addSceneLights(scene) {
  scene.add(new THREE.HemisphereLight(0xe0edd4, 0x17382c, 3));
  const light = new THREE.DirectionalLight(0xeac78e, 5);
  light.position.set(-5, 8, 8);
  scene.add(light);
  const mint = new THREE.PointLight(0x5eaf89, 45);
  mint.position.set(2, 2, 5);
  scene.add(mint);
}

function applyLaptopMaterials(loadedModel) {
  loadedModel.traverse((o) => {
    if (!o.isMesh) return;
    let color = 0x456050,
      metal = 0.65,
      rough = 0.28;
    if (o.name.startsWith("Screen")) {
      o.material = new THREE.MeshStandardMaterial({
        color: 0x1a4c36,
        emissive: 0x143c29,
        emissiveIntensity: 0.8,
        metalness: 0.3,
        roughness: 0.15,
      });
    } else {
      o.material = new THREE.MeshStandardMaterial({
        color: o.name.startsWith("Key")
          ? 0x173529
          : o.name.startsWith("Trackpad")
            ? 0x78947b
            : color,
        metalness: metal,
        roughness: rough,
      });
    }
  });
}

// This texture decorates the laptop screen; the puzzles use regular HTML.
function createScreenTexture() {
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 1024;
  screenCanvas.height = 600;
  const screenContext = screenCanvas.getContext("2d");
  screenContext.fillStyle = "#0c281c";
  screenContext.fillRect(0, 0, 1024, 600);
  screenContext.fillStyle = "#405a36";
  for (let i = 0; i < 15; i++) {
    screenContext.fillRect(70, i * 29 + 95, 12, 8);
    screenContext.fillStyle = i === 5 ? "#d6b36e" : "#51794a";
    screenContext.fillRect(110, i * 29 + 95, 110 + ((i * 53) % 510), 8);
  }
  screenContext.fillStyle = "#b5d29e";
  screenContext.font = "bold 32px monospace";
  screenContext.fillText("ATHAR / RELEASE v1.0", 65, 60);
  screenContext.fillStyle = "#d9ba79";
  screenContext.font = "18px monospace";
  screenContext.fillText("3 ISSUES FOUND. DEVELOPER NEEDED.", 65, 555);
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;

  return screenTexture;
}
