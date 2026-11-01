"""
Pipeline de producto para el Oblivion FX Kit: toma el modelo 3D del cliente y
produce los assets del catálogo.

  blender -b -P tools/blender/product.py -- config.json

El modelo puede ser .glb/.gltf, .fbx, .obj o .blend. Se normaliza (centrado en
el origen, 2 unidades de alto) para que la luz y los encuadres funcionen igual
con cualquier producto. Modos (`mode` en el JSON):

- chapters  cuadros PNG con alfa para `scroll-sequence` en modo capítulos:
            poses en cuadros equidistantes, con ease entre una y otra.
- spin      una vuelta de 360° a velocidad constante (`turntable`).
- stills    fotos opacas en escena (piso que refleja, bruma y haz cenital en
            "dark"; estudio blanco en "light") para hero y primeros planos.
- glb       exporta el modelo normalizado a .glb (para `model-turntable`).

Config de ejemplo: tools/blender/example.json. Después: scripts/assets/encode-frames.sh.
"""

import json
import math
import os
import sys

import bpy
from mathutils import Vector

D = math.radians
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if not argv:
    sys.exit("Uso: blender -b -P tools/blender/product.py -- config.json")
CONFIG_PATH = os.path.abspath(argv[0])
CFG = json.load(open(CONFIG_PATH))
BASE = os.path.dirname(CONFIG_PATH)
rel = lambda p: p if os.path.isabs(p) else os.path.normpath(os.path.join(BASE, p))

MODE = CFG.get("mode", "chapters")
OUT = rel(CFG.get("out", "out"))
os.makedirs(OUT, exist_ok=True)


def hex_rgb(value):
    """#rrggbb en sRGB → color lineal de Blender."""
    v = value.lstrip("#")
    srgb = [int(v[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)


# --- Escena e importación ------------------------------------------------------

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
model_path = rel(CFG["model"])
ext = os.path.splitext(model_path)[1].lower()
before = set(bpy.data.objects)
if ext in (".glb", ".gltf"):
    bpy.ops.import_scene.gltf(filepath=model_path)
elif ext == ".fbx":
    bpy.ops.import_scene.fbx(filepath=model_path)
elif ext == ".obj":
    bpy.ops.wm.obj_import(filepath=model_path)
elif ext == ".blend":
    with bpy.data.libraries.load(model_path) as (src, dst):
        dst.objects = [n for n in src.objects]
    for o in dst.objects:
        if o is not None:
            scene.collection.objects.link(o)
else:
    sys.exit(f"Formato no soportado: {ext}")
imported = [o for o in bpy.data.objects if o not in before]
for o in imported:
    if o.users_collection == ():
        scene.collection.objects.link(o)

# Un empty raíz: todo lo importado sin padre cuelga de él.
root = bpy.data.objects.new("product", None)
scene.collection.objects.link(root)
root.rotation_mode = "ZYX"  # primero gira sobre su eje, después se vuelca
for o in imported:
    if o.parent is None:
        o.parent = root

# Normalización: centro en el origen, 2 unidades de alto.
bpy.context.view_layer.update()
pts = [o.matrix_world @ Vector(c) for o in imported if o.type == "MESH" for c in o.bound_box]
if not pts:
    sys.exit("El modelo no tiene mallas")
mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
size = mx - mn
scale = 2.0 / max(size.z, 1e-6) if CFG.get("fitHeight", True) else 2.0 / max(size)
center = (mn + mx) / 2
for o in imported:
    if o.parent == root:
        o.location = (o.location - center) * scale
        o.scale = o.scale * scale
bpy.context.view_layer.update()
WIDTH = max(size.x, size.y) * scale  # ancho normalizado (el alto es 2)

if MODE == "glb":
    root.rotation_euler = (0, 0, 0)
    for o in scene.objects:
        o.select_set(o == root or o in imported)
    path = os.path.join(OUT, CFG.get("name", "model") + ".glb")
    opts = dict(filepath=path, export_format="GLB", use_selection=True, export_apply=True, export_animations=False, export_cameras=False, export_lights=False)
    try:
        bpy.ops.export_scene.gltf(**opts, export_image_format="WEBP", export_image_quality=80)
    except TypeError:
        bpy.ops.export_scene.gltf(**opts)
    print("listo glb", path)
    sys.exit(0)

# --- Cámara con encuadre automático ------------------------------------------------

res = CFG.get("resolution", [1000, 1250])
scene.render.resolution_x, scene.render.resolution_y = res
target = bpy.data.objects.new("target", None)
scene.collection.objects.link(target)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
scene.collection.objects.link(cam)
scene.camera = cam
cam.data.lens = CFG.get("lens", 70)
cam.constraints.new("TRACK_TO").target = target


def fit_distance(lens, aspect, fill=0.72):
    """Distancia para que el producto (2 de alto, WIDTH de ancho) ocupe `fill` del cuadro."""
    sensor = 36.0
    if aspect >= 1:  # horizontal: el sensor manda en el ancho
        half_w = sensor / 2 / lens
        half_h = half_w / aspect
    else:
        half_h = sensor / 2 / lens
        half_w = half_h * aspect
    return max(1.0 / (half_h * fill), (WIDTH / 2) / (half_w * fill)) + WIDTH / 2


def place(pose, lens, aspect):
    """Pose: yaw/pitch/roll del producto en grados, distance (×encuadre), height y lookAt (en unidades)."""
    root.rotation_euler = (D(pose.get("pitch", 0)), D(pose.get("roll", 0)), D(pose.get("yaw", 0)))
    dist = fit_distance(lens, aspect) * pose.get("distance", 1.0)
    h = pose.get("height", 0.15)
    cam.location = (pose.get("side", 0.0), -dist, h)
    target.location = (0, 0, pose.get("lookAt", 0.0))


# --- Luz -------------------------------------------------------------------------------

def light(kind, name, loc, energy, size=1.0, color=(1, 1, 1), spot=30, volume=0.0):
    data = bpy.data.lights.new(name, kind)
    data.energy, data.color = energy, color
    if kind == "SPOT":
        data.spot_size, data.spot_blend = D(spot), 0.45
    if kind == "AREA":
        data.size = size
    data.volume_factor = volume
    obj = bpy.data.objects.new(name, data)
    obj.location = loc
    scene.collection.objects.link(obj)
    obj.constraints.new("TRACK_TO").target = root
    return obj


PRESET = CFG.get("lighting", "dark")
rim = tuple(CFG.get("rimColor", [0.62, 0.78, 1.0]))
world = bpy.data.worlds.new("world")
world.use_nodes = True
scene.world = world
bg = world.node_tree.nodes["Background"]
if PRESET == "dark":
    light("AREA", "key", (-3.5, -4.5, 3), 450, 3.0, (1.0, 0.97, 0.93))
    light("AREA", "fill", (4.5, -3, 0.5), 70, 4.0, (0.85, 0.9, 1.0))
    light("SPOT", "rim-l", (-3.2, 3.0, 1.2), 2000, color=rim, spot=24)
    light("SPOT", "rim-r", (3.2, 3.0, 0.4), 1600, color=rim, spot=24)
    bg.inputs[0].default_value = (0.02, 0.025, 0.04, 1)
    bg.inputs[1].default_value = 0.3
else:
    light("AREA", "key", (-3, -4, 4), 600, 4.0)
    light("AREA", "fill", (4, -3, 1), 250, 5.0)
    light("AREA", "top", (0, 0.5, 5), 300, 3.0)
    bg.inputs[0].default_value = (0.9, 0.9, 0.9, 1)
    bg.inputs[1].default_value = 0.8

r = scene.render
for engine in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
    try:
        r.engine = engine
        break
    except TypeError:
        continue
try:
    scene.eevee.taa_render_samples = int(CFG.get("samples", 64))
except AttributeError:
    pass
r.image_settings.file_format = "PNG"


def render_to(path):
    r.filepath = path
    bpy.ops.render.render(write_still=True)


aspect = res[0] / res[1]
lens = cam.data.lens

# --- Modos ---------------------------------------------------------------------------

if MODE in ("chapters", "spin"):
    r.film_transparent = True
    r.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "AgX"
    n = int(CFG.get("frames", 72 if MODE == "chapters" else 120))
    if MODE == "chapters":
        poses = CFG.get("poses") or [{"yaw": 0, "pitch": 8, "roll": 8}, {"yaw": -55, "pitch": 30}, {"yaw": -95, "pitch": 4}, {"yaw": -10, "pitch": 4, "distance": 0.8}]
        keys = [round(1 + i * (n - 1) / max(1, len(poses) - 1)) for i in range(len(poses))]
        for f, pose in zip(keys, poses):
            place(pose, lens, aspect)
            root.keyframe_insert("rotation_euler", frame=f)
            cam.keyframe_insert("location", frame=f)
            target.keyframe_insert("location", frame=f)
        for f in range(1, n + 1):
            scene.frame_set(f)
            render_to(os.path.join(OUT, f"frame-{f:03d}.png"))
    else:
        base = CFG.get("spinPose", {"pitch": 10})
        for f in range(1, n + 1):
            place({**base, "yaw": base.get("yaw", 0) - 360 * (f - 1) / n}, lens, aspect)
            render_to(os.path.join(OUT, f"frame-{f:03d}.png"))
    print("listo", MODE, n, OUT)

elif MODE == "stills":
    r.film_transparent = False
    r.image_settings.color_mode = "RGB"
    scene.view_settings.view_transform = "Standard"
    ground = hex_rgb(CFG.get("background", "#0b0c0e" if PRESET == "dark" else "#f2f2f0"))
    bg.inputs[0].default_value = (*ground, 1)
    bg.inputs[1].default_value = 1
    # Piso que refleja.
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, -1))
    floor = bpy.context.active_object
    fm = bpy.data.materials.new("floor")
    fm.use_nodes = True
    p = fm.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*ground, 1)
    p.inputs["Roughness"].default_value = 0.28 if PRESET == "dark" else 0.5
    floor.data.materials.append(fm)
    if PRESET == "dark":
        # Escena oscura: sin luces de área grandes (iluminan la bruma y se reflejan como cuadros).
        for o in list(scene.objects):
            if o.type == "LIGHT" and o.data.type == "AREA" and o.name != "fill":
                bpy.data.objects.remove(o)
        light("SPOT", "beam", (-0.6, 0.8, 7.0), 2400, color=(0.93, 0.96, 1.0), spot=26, volume=1.0)
        vol = world.node_tree.nodes.new("ShaderNodeVolumePrincipled")
        vol.inputs["Density"].default_value = CFG.get("haze", 0.016)
        world.node_tree.links.new(vol.outputs[0], world.node_tree.nodes["World Output"].inputs["Volume"])
        try:
            scene.eevee.volumetric_end = 40
            scene.eevee.use_raytracing = True
        except (AttributeError, TypeError):
            pass
    for still in CFG.get("stills", [{"name": "hero", "size": [2400, 1350], "lens": 50, "yaw": -18, "height": -0.15}]):
        r.resolution_x, r.resolution_y = still.get("size", res)
        cam.data.lens = still.get("lens", 50)
        place(still, cam.data.lens, r.resolution_x / r.resolution_y)
        render_to(os.path.join(OUT, f"{still['name']}.png"))
    print("listo stills", OUT)
else:
    sys.exit(f"Modo desconocido: {MODE}")
