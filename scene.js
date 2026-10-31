import * as THREE from 'three';

const canvas = document.querySelector('#scene');
const landing = document.querySelector('#landing');
const stage = document.createElement('div');
stage.className = 'laptopStage';
stage.setAttribute('aria-hidden', 'true');
stage.append(canvas);
landing.insertBefore(stage, document.querySelector('.laptopCaption'));

try {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  camera.position.set(9, 7, 14);
  camera.lookAt(0, 1.2, 0);
  scene.add(new THREE.HemisphereLight(0xdffff2, 0x071b18, 2.4));
  const key = new THREE.DirectionalLight(0xffe2ad, 5);
  key.position.set(-4, 7, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0x53ffc1, 65);
  rim.position.set(4, 3, -3);
  scene.add(rim);
  const laptop = new THREE.Group();
  scene.add(laptop);
  const shell = new THREE.MeshStandardMaterial({ color: 0x193e36, metalness: .85, roughness: .23 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x071713, metalness: .5, roughness: .3 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd1b374, metalness: .8, roughness: .3 });
  function box(w, h, d, mat, x, y, z, parent = laptop) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  box(7.8, .22, 5, shell, 0, 0, 0);
  box(7.4, .035, 4.6, dark, 0, .13, 0);
  box(2.25, .025, 1.1, shell, 0, .16, 1.45);
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 13; col++) {
      box(.43, .05, .34, col === 12 && row === 0 ? gold : shell, (col - 6) * .51, .18, -1.65 + row * .49);
    }
  }
  box(3.1, .05, .3, shell, 0, .18, .8);
  const lid = new THREE.Group();
  lid.position.set(0, .13, -2.3);
  laptop.add(lid);
  box(7.8, 4.75, .18, shell, 0, 2.36, 0, lid);
  box(7.35, 4.3, .025, dark, 0, 2.36, .105, lid);
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 1024;
  screenCanvas.height = 600;
  const ctx = screenCanvas.getContext('2d');
  const texture = new THREE.CanvasTexture(screenCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(7.05, 4.05), new THREE.MeshBasicMaterial({ map: texture }));
  screen.position.set(0, 2.36, .13);
  lid.add(screen);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.9, .018, 8, 160), new THREE.MeshBasicMaterial({ color: 0x83d9ba, transparent: true, opacity: .35 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -.8;
  scene.add(ring);
  const ring2 = ring.clone();
  ring2.scale.setScalar(1.15);
  ring2.position.y = -.85;
  scene.add(ring2);
  const points = [];
  for (let i = 0; i < 95; i++) points.push((Math.random() - .5) * 20, Math.random() * 10 - 3, (Math.random() - .5) * 12);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const particles = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xd8be87, size: .035, transparent: true, opacity: .6 }));
  scene.add(particles);
  let pointerX = 0;
  let pointerY = 0;
  stage.addEventListener('pointermove', (event) => {
    const rect = stage.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - .5;
    pointerY = (event.clientY - rect.top) / rect.height - .5;
  });
  stage.addEventListener('pointerleave', () => { pointerX = pointerY = 0; });
  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.set(9, 7, width < 450 ? 18 : 15);
    camera.lookAt(0, 1.3, 0);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  let lastScreen = -1;
  function drawScreen(t) {
    ctx.fillStyle = '#071e1a';
    ctx.fillRect(0, 0, 1024, 600);
    ctx.fillStyle = '#123e33';
    ctx.fillRect(0, 0, 1024, 62);
    ctx.fillStyle = '#a4ebc9';
    ctx.font = '22px monospace';
    ctx.fillText('ATHAR  /  RELEASE WORKSPACE', 38, 40);
    ['#dfb988','#8cbea5','#72c8ab'].forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(916 + i * 30, 31, 6, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = '#e4f1dc';
    ctx.font = 'bold 46px monospace';
    ctx.fillText('BUILD SOMETHING', 45, 150);
    ctx.fillStyle = '#7ed5b3';
    ctx.fillText('THAT MATTERS.', 45, 210);
    const lines = ['$ git status', '3 issues need your attention', '> protect project files', '> fix the failing test', '> resolve merge conflict'];
    ctx.font = '23px monospace';
    lines.forEach((line, i) => {
      ctx.fillStyle = i === 1 ? '#dfc48f' : '#99bfad';
      ctx.fillText(line, 48, 290 + i * 44);
    });
    if (reducedMotion || Math.floor(t / 600) % 2 === 0) ctx.fillRect(48, 522, 14, 24);
    ctx.fillStyle = '#57c99b';
    ctx.fillRect(0, 584, 1024, 4);
    texture.needsUpdate = true;
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden || document.body.classList.contains('playing')) return;
    const t = now - start;
    const progress = reducedMotion ? 1 : Math.min(t / 1700, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    lid.rotation.x = -1.48 + ease * 1.62;
    laptop.rotation.y += ((-.34 + pointerX * .15) - laptop.rotation.y) * .04;
    laptop.rotation.z += (-pointerY * .035 - laptop.rotation.z) * .04;
    laptop.position.y = reducedMotion ? 0 : Math.sin(t * .0008) * .12;
    if (!reducedMotion) particles.rotation.y = t * .000025;
    if (Math.floor(t / 450) !== lastScreen) { drawScreen(t); lastScreen = Math.floor(t / 450); }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
} catch (error) {
  canvas.hidden = true;
  stage.classList.add('sceneFallback');
  stage.textContent = 'آخر إصدار — جاهز لتترك أثرك؟';
}
