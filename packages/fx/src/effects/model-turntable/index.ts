/**
 * model-turntable — el producto en 3D en vivo: un .glb (exportado de Blender)
 * dibujado con Three.js. Gira solo, se arrastra y sigue con inercia, fluido a
 * cualquier velocidad porque cada frame es un render real.
 * Familia: 3D / producto · Intensidad 3 · deps: three · Live thing posible.
 *
 *   <figure data-fx-model>
 *     <canvas data-fx-canvas></canvas>
 *     <img data-fx-fallback src="producto.webp" alt="El producto, de frente">
 *
 * Three.js se importa recién cuando el efecto está a una pantalla (no entra en
 * el bundle inicial). La foto `data-fx-fallback` se ve hasta el primer render y
 * vuelve si no hay WebGL o el .glb no carga. `setLight(color)` recolorea los
 * materiales emisivos nombrados en `lightMaterials` (con un token del sitio).
 *
 * Reduced motion: no gira solo ni tiene inercia.
 * destroy(): libera geometrías, materiales, texturas y el contexto WebGL, y
 * devuelve canvas y fallback como estaban.
 */

import { bundle, part, preserve, token, whenNear, type FxHandle } from '../../core/index.ts';
import { createSpinControl, type SpinControl, type SpinControlOptions } from '../../lib/spin-control.ts';

type Three = typeof import('three');

export interface ThreeModules {
  THREE: Three;
  GLTFLoader: new () => { loadAsync(url: string): Promise<{ scene: import('three').Object3D }> };
  RoomEnvironment?: new () => import('three').Scene;
}

export interface ModelTurntableOptions extends Partial<Pick<SpinControlOptions, 'input' | 'auto' | 'turnSeconds' | 'label'>> {
  url: string;
  canvas?: HTMLCanvasElement | null;
  fallback?: HTMLElement | null;
  /** Grados que el producto se vuelca hacia la cámara (deja ver la cara de arriba). */
  tilt?: number;
  /** Nombres de los materiales emisivos que recolorea `setLight()`. */
  lightMaterials?: string[];
  exposure?: number;
  /** Para usar Three.js desde un CDN en vez del import dinámico. */
  three?: ThreeModules;
  onReady?: () => void;
  onError?: (error: unknown) => void;
}

export interface ModelTurntableHandle extends FxHandle {
  setLight(color: string): void;
}

async function loadThree(): Promise<ThreeModules> {
  const [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
    import('three'),
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/environments/RoomEnvironment.js'),
  ]);
  return { THREE, GLTFLoader: GLTFLoader as unknown as ThreeModules['GLTFLoader'], RoomEnvironment };
}

export function createModelTurntable(root: HTMLElement, options: ModelTurntableOptions): ModelTurntableHandle {
  const canvas = options.canvas ?? (root instanceof HTMLCanvasElement ? root : part<HTMLCanvasElement>(root, 'canvas'));
  const fallback = options.fallback ?? part(root, 'fallback');
  if (!canvas) return { destroy() {}, setLight() {} };
  const { tilt = 10, lightMaterials = [], exposure = 1 } = options;
  const restore = bundle(fallback && preserve(fallback, { attributes: ['hidden'] }));

  let dead = false;
  let pendingLight: string | null = null;
  let teardown: (() => void) | null = null;
  let apply: (color: string) => void = (c) => {
    pendingLight = c;
  };

  const mount = async () => {
    let mods: ThreeModules;
    try {
      mods = options.three ?? (await loadThree());
    } catch (error) {
      options.onError?.(error);
      return;
    }
    if (dead) return;
    const { THREE, GLTFLoader, RoomEnvironment } = mods;
    let renderer: import('three').WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (error) {
      options.onError?.(error); // sin WebGL queda la foto
      return;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.toneMapping = THREE.AgXToneMapping ?? THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = exposure;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    const pmrem = RoomEnvironment ? new THREE.PMREMGenerator(renderer) : null;
    const envTex = pmrem && RoomEnvironment ? pmrem.fromScene(new RoomEnvironment(), 0.04).texture : null;
    if (envTex) {
      scene.environment = envTex;
      scene.environmentIntensity = 0.35;
    }
    const key = new THREE.DirectionalLight(undefined, 1.6);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const rimColor = token(root, '--fx-rim');
    for (const [x, y] of [[-4, 1.5], [4, 0.5]] as const) {
      const light = new THREE.DirectionalLight(rimColor ? new THREE.Color(rimColor) : undefined, 2.4);
      light.position.set(x, y, -4); // contraluz: despega un producto oscuro del fondo
      scene.add(light);
    }
    const pivot = new THREE.Group();
    const spinner = new THREE.Group();
    pivot.rotation.x = THREE.MathUtils.degToRad(tilt);
    pivot.add(spinner);
    scene.add(pivot);

    let turn = 0;
    let control: SpinControl | null = null;
    let lights: import('three').MeshStandardMaterial[] = [];
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
    apply = (color) => {
      pendingLight = color;
      for (const m of lights) m.emissive.set(color);
      if (control) render();
    };

    teardown = () => {
      control?.destroy();
      ro.disconnect();
      scene.traverse((o) => {
        const mesh = o as import('three').Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        for (const m of mats) {
          for (const v of Object.values(m)) if (v && (v as import('three').Texture).isTexture) (v as import('three').Texture).dispose();
          m.dispose();
        }
      });
      envTex?.dispose();
      pmrem?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };

    try {
      const gltf = await new GLTFLoader().loadAsync(options.url);
      if (dead) return;
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      model.position.sub(box.getCenter(new THREE.Vector3()));
      spinner.add(model);
      const found = new Set<import('three').MeshStandardMaterial>();
      model.traverse((o) => {
        const m = (o as import('three').Mesh).material as import('three').MeshStandardMaterial | undefined;
        if (m && lightMaterials.includes(m.name)) found.add(m);
      });
      lights = [...found];
      if (pendingLight) apply(pendingLight);
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const fitH = (size.y * 1.12) / 2 / Math.tan(fov / 2);
      const fitW = (Math.max(size.x, size.z) * 1.6) / 2 / Math.tan(fov / 2) / Math.max(0.5, camera.aspect);
      camera.position.set(0, 0, Math.max(fitH, fitW) + size.z / 2);
      camera.lookAt(0, 0, 0);

      control = createSpinControl({
        el: canvas,
        input: options.input,
        auto: options.auto,
        turnSeconds: options.turnSeconds,
        label: options.label,
        onTurn: (t) => {
          turn = t;
          render();
        },
      });
      render();
      fallback?.setAttribute('hidden', '');
      options.onReady?.();
    } catch (error) {
      if (!dead) options.onError?.(error); // queda la foto
    }
  };

  const offNear = whenNear(canvas, () => void mount());

  return {
    setLight: (color) => apply(color),
    destroy() {
      dead = true;
      offNear();
      teardown?.();
      restore();
    },
  };
}
