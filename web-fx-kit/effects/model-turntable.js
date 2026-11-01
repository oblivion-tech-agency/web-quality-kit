/**
 * Producto en 360° en 3D en vivo: un .glb (exportado de Blender) dibujado con
 * Three.js. Gira solo, se arrastra con el mouse o el dedo y sigue con inercia,
 * fluido a cualquier velocidad porque cada frame es un render real, no un
 * cuadro guardado. Usa `spin-control.js` (se copian juntos).
 *
 * Three.js no se importa acá: lo pasa el host (como en todo el kit), así el
 * proyecto elige la versión y no se duplica en el bundle.
 *
 *   const THREE = await import('three');
 *   const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
 *   const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
 *   const fx = createModelTurntable({ canvas, THREE, GLTFLoader, RoomEnvironment, url: '/speaker.glb' });
 *   fx.setLight('#4fd8ff');   // color de la luz del producto (de un token del sitio)
 *
 * Marcado esperado: el <canvas> y, al lado, una foto del producto con
 * `data-model-fallback` (y su alt). La foto se ve hasta el primer render y
 * vuelve si no hay WebGL o el .glb no carga.
 *
 * Contrato del catálogo:
 * - Sin literales de color: la luz del producto llega con `setLight()` y los
 *   contraluces con `rim`, ambos desde tokens del sitio.
 * - `destroy()` saca listeners, observers y el frame pendiente, libera
 *   geometrías, materiales, texturas y el contexto WebGL, y vuelve a mostrar
 *   la foto.
 * - Con `prefers-reduced-motion` no gira solo ni tiene inercia.
 * - Teclado: ← → giran de a 15°. En touch el arrastre vertical scrollea.
 * - Fuera de pantalla no se renderiza.
 */

import { createSpinControl } from './spin-control.js';

/**
 * @param {{
 *   canvas: HTMLCanvasElement,
 *   THREE: any,
 *   GLTFLoader: any,
 *   RoomEnvironment?: any,
 *   url: string,
 *   fallback?: HTMLElement | null,
 *   tilt?: number,
 *   rim?: string,
 *   lightMaterials?: string[],
 *   exposure?: number,
 *   input?: 'drag' | 'hover',
 *   auto?: boolean,
 *   turnSeconds?: number,
 *   label?: string,
 *   onReady?: () => void,
 *   onError?: (error: unknown) => void,
 * }} options
 *   `tilt`: grados que el producto se vuelca hacia la cámara (deja ver la
 *   cara de arriba). `lightMaterials`: nombres de los materiales emisivos que
 *   `setLight()` recolorea. `rim`: color CSS de los contraluces.
 * @returns {{ destroy(): void, setLight(color: string): void }}
 */
export function createModelTurntable({
  canvas,
  THREE,
  GLTFLoader,
  RoomEnvironment,
  url,
  fallback = canvas.parentElement?.querySelector('[data-model-fallback]'),
  tilt = 10,
  rim,
  lightMaterials = ['cyan', 'logo'],
  exposure = 1,
  input,
  auto,
  turnSeconds,
  label,
  onReady,
  onError,
}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (error) {
    onError?.(error); // sin WebGL queda la foto
    return { destroy() {}, setLight() {} };
  }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.AgXToneMapping ?? THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  let pmrem = null;
  let envTex = null;
  if (RoomEnvironment) {
    pmrem = new THREE.PMREMGenerator(renderer);
    envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.35; // escena oscura: el ambiente apenas
  }
  const key = new THREE.DirectionalLight(undefined, 1.6);
  key.position.set(-3, 4, 5);
  scene.add(key);
  for (const [x, y] of [[-4, 1.5], [4, 0.5]]) {
    const light = new THREE.DirectionalLight(rim ? new THREE.Color(rim) : undefined, 2.4);
    light.position.set(x, y, -4); // contraluz: despega el negro del fondo
    scene.add(light);
  }

  const pivot = new THREE.Group(); // vuelco hacia cámara
  const spinner = new THREE.Group(); // giro sobre su eje
  pivot.rotation.x = THREE.MathUtils.degToRad(tilt);
  pivot.add(spinner);
  scene.add(pivot);

  /** @type {any[]} */
  let lights = [];
  let pendingLight = null;
  let control = null;
  let dead = false;
  let turn = 0;

  const render = () => {
    spinner.rotation.y = -turn * Math.PI * 2;
    renderer.render(scene, camera);
  };
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (control) render();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  new GLTFLoader()
    .loadAsync(url)
    .then((gltf) => {
      if (dead) return;
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      model.position.sub(box.getCenter(new THREE.Vector3())); // centrado en el eje
      spinner.add(model);
      model.traverse((o) => {
        if (o.material && lightMaterials.includes(o.material.name)) lights.push(o.material);
      });
      lights = [...new Set(lights)];
      if (pendingLight) apply(pendingLight);
      // Encuadre: entra entero con un poco de aire, también al volcarse.
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const fitH = (size.y * 1.12) / 2 / Math.tan(fov / 2);
      const fitW = (Math.max(size.x, size.z) * 1.6) / 2 / Math.tan(fov / 2) / Math.max(0.5, camera.aspect);
      camera.position.set(0, 0, Math.max(fitH, fitW) + size.z / 2);
      camera.lookAt(0, 0, 0);

      control = createSpinControl({
        el: canvas,
        input,
        auto,
        turnSeconds,
        label,
        onTurn: (t) => {
          turn = t;
          render();
        },
      });
      render();
      if (fallback) fallback.hidden = true;
      onReady?.();
    })
    .catch((error) => {
      if (!dead) onError?.(error); // queda la foto
    });

  const apply = (color) => {
    for (const m of lights) {
      m.emissive.set(color);
      m.needsUpdate = true;
    }
    if (control) render();
  };

  return {
    setLight(color) {
      pendingLight = color;
      apply(color);
    },
    destroy() {
      dead = true;
      control?.destroy();
      ro.disconnect();
      scene.traverse((o) => {
        o.geometry?.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of mats) {
          for (const v of Object.values(m)) if (v && v.isTexture) v.dispose();
          m.dispose();
        }
      });
      envTex?.dispose();
      pmrem?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (fallback) fallback.hidden = false;
    },
  };
}
