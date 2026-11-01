"""
Parlante cilíndrico de ejemplo para el demo de scroll-sequence.

Modela el producto con primitivas (cuerpo de tela tejida, tapas de goma,
radiador superior con luz, tira de controles con RGB) y renderiza los cuadros
con fondo transparente, en uno de dos modos:

  blender -b -P render.py -- --mode chapters|spin --out /ruta/png [--res 1000] [--frames 1-72] [--samples 64]

--mode chapters (scroll-sequence con `poses: [0, 1/3, 2/3, 1]`), poses en los
cuadros 1, 25, 49 y 72, con ease entre una y otra (sin pausas: el módulo se
detiene en cada pose):
  1   de frente, controles a cámara
  25  girado y volcado: se ve el radiador iluminado
  49  de costado: el perfil, la tela de punta a punta
  72  más cerca, los controles

--mode spin (turntable): una vuelta completa sobre su eje a velocidad
constante, en --turn cuadros (default 120: --frames 1-120); el último queda
justo antes del primero para que el bucle no repita.

--mode hero: una sola foto (--frames 1-1) de tres cuartos con cámara baja.

--mode scene-hero | scene-light | scene-controls | scene-fabric | scene-stereo:
fotos opacas en escena (piso que refleja, bruma, haz cenital) para la landing.
El borde de cada imagen es el color de fondo del sitio. Usar --frames 1-1.

--mode glb: exporta speaker.glb para Three.js (tela, logo y tira RGB horneados).
"""

import math
import sys

import bpy

# --- Argumentos ---------------------------------------------------------------

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
args = {"--turn": "120", "--mode": "chapters", "--out": "//png", "--res": "1000", "--frames": "1-72", "--samples": "64"}
for i in range(0, len(argv) - 1, 2):
    args[argv[i]] = argv[i + 1]
OUT = args["--out"].rstrip("/")
RES = int(args["--res"])
F0, F1 = (int(x) for x in args["--frames"].split("-"))
TURN = int(args["--turn"])  # cuadros por vuelta en --mode spin

# --- Escena limpia --------------------------------------------------------------

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.frame_start, scene.frame_end = 1, 72

H = 2.0  # alto total
R = 0.42  # radio del cuerpo


def mat(name, color, rough=0.5, metal=0.0, emit=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if emit:
        p.inputs["Emission Color"].default_value = (*emit, 1)
        p.inputs["Emission Strength"].default_value = strength
    return m


def smooth(obj, angle=0.7):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=angle)
    except Exception:
        bpy.ops.object.shade_smooth()
    obj.select_set(False)


def bevel(obj, width, segments=6):
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    return mod


root = bpy.data.objects.new("product", None)
scene.collection.objects.link(root)
# ZYX: primero gira sobre su propio eje y después se vuelca hacia la cámara.
root.rotation_mode = "ZYX"


def add(obj, material):
    obj.data.materials.append(material)
    obj.parent = root
    return obj


# --- Materiales -------------------------------------------------------------------

def fabric():
    """Tela tejida: hilos horizontales (por altura) y verticales (por ángulo) como relieve."""
    m = mat("fabric", (0.008, 0.008, 0.009), rough=0.85)
    nt = m.node_tree
    n, link = nt.nodes, nt.links.new
    p = n["Principled BSDF"]
    coord = n.new("ShaderNodeTexCoord")
    sep = n.new("ShaderNodeSeparateXYZ")
    link(coord.outputs["Object"], sep.inputs[0])
    rad = n.new("ShaderNodeTexGradient")
    rad.gradient_type = "RADIAL"
    link(coord.outputs["Object"], rad.inputs[0])

    def sine(src, k):
        mul = n.new("ShaderNodeMath")
        mul.operation = "MULTIPLY"
        mul.inputs[1].default_value = k
        link(src, mul.inputs[0])
        s = n.new("ShaderNodeMath")
        s.operation = "SINE"
        link(mul.outputs[0], s.inputs[0])
        return s.outputs[0]

    rows = sine(sep.outputs["Z"], 2 * math.pi * 55)
    cols = sine(rad.outputs["Fac"], 2 * math.pi * 150)
    weave = n.new("ShaderNodeMath")
    weave.operation = "MULTIPLY"
    link(rows, weave.inputs[0])
    link(cols, weave.inputs[1])
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.55
    bump.inputs["Distance"].default_value = 0.004
    link(weave.outputs[0], bump.inputs["Height"])
    link(bump.outputs["Normal"], p.inputs["Normal"])
    # Un brillo apenas más claro en las crestas del tejido.
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.005, 0.005, 0.006, 1)
    ramp.color_ramp.elements[1].color = (0.026, 0.026, 0.03, 1)
    link(weave.outputs[0], ramp.inputs[0])
    link(ramp.outputs[0], p.inputs["Base Color"])
    return m


def rainbow():
    """Borde RGB de la tira de volumen: degradé a lo largo del alto."""
    m = mat("rgb", (0, 0, 0), rough=0.4)
    nt = m.node_tree
    n, link = nt.nodes, nt.links.new
    p = n["Principled BSDF"]
    coord = n.new("ShaderNodeTexCoord")
    sep = n.new("ShaderNodeSeparateXYZ")
    link(coord.outputs["Generated"], sep.inputs[0])
    ramp = n.new("ShaderNodeValToRGB")
    cr = ramp.color_ramp
    stops = [(0.0, (1.0, 0.1, 0.5)), (0.25, (0.4, 0.2, 1.0)), (0.5, (0.1, 0.8, 1.0)), (0.75, (0.2, 1.0, 0.3)), (1.0, (1.0, 0.85, 0.1))]
    cr.elements[0].position, cr.elements[0].color = stops[0][0], (*stops[0][1], 1)
    cr.elements[1].position, cr.elements[1].color = stops[-1][0], (*stops[-1][1], 1)
    for pos, col in stops[1:-1]:
        e = cr.elements.new(pos)
        e.color = (*col, 1)
    link(sep.outputs["Z"], ramp.inputs[0])
    link(ramp.outputs[0], p.inputs["Emission Color"])
    p.inputs["Emission Strength"].default_value = 3.5
    return m


def wave_logo():
    """Logo de ondas sobre el radiador: barras verticales con luz cian."""
    m = mat("logo", (0, 0, 0), rough=0.3)
    nt = m.node_tree
    n, link = nt.nodes, nt.links.new
    p = n["Principled BSDF"]
    coord = n.new("ShaderNodeTexCoord")
    wave = n.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "X"
    wave.inputs["Scale"].default_value = 9
    wave.inputs["Distortion"].default_value = 6
    link(coord.outputs["Object"], wave.inputs["Vector"])
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.55
    ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    ramp.color_ramp.elements[1].position = 0.62
    ramp.color_ramp.elements[1].color = (0.15, 0.85, 1.0, 1)
    link(wave.outputs["Fac"], ramp.inputs[0])
    link(ramp.outputs[0], p.inputs["Emission Color"])
    p.inputs["Emission Strength"].default_value = 2.2
    return m


M_FABRIC = fabric()
M_RUBBER = mat("rubber", (0.01, 0.01, 0.011), rough=0.42)
M_GLOSS = mat("gloss", (0.01, 0.01, 0.012), rough=0.15)
M_CYAN = mat("cyan", (0, 0, 0), rough=0.3, emit=(0.1, 0.75, 1.0), strength=4.5)
M_RGB = rainbow()
M_LOGO = wave_logo()

# --- Geometría ----------------------------------------------------------------------

def cyl(radius, depth, z, verts=160, name="cyl"):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=(0, 0, z))
    o = bpy.context.active_object
    o.name = name
    return o


def pill(w, h, d, z, name, material, y=None):
    """Cubo con bevel máximo: una píldora apoyada sobre la cara frontal (-Y) del cuerpo."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -(R - d * 0.35) if y is None else y, z))
    o = bpy.context.active_object
    o.name = name
    o.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    bevel(o, min(w, h) * 0.49, segments=10)
    smooth(o, 1.2)
    return add(o, material)


band_top, band_bot = 0.17, 0.11
body = cyl(R, H - band_top - band_bot, (band_bot - band_top) / 2, name="body")
bevel(body, 0.01, 3)
smooth(body)
add(body, M_FABRIC)

top = cyl(R * 1.012, band_top, H / 2 - band_top / 2, name="top-band")
bevel(top, 0.05)
smooth(top)
add(top, M_RUBBER)

bot = cyl(R * 1.012, band_bot, -H / 2 + band_bot / 2, name="bottom-band")
bevel(bot, 0.04)
smooth(bot)
add(bot, M_RUBBER)

# Radiador hundido dentro de un aro de goma, con aro de luz y logo de ondas.
bpy.ops.mesh.primitive_torus_add(major_radius=R * 0.9, minor_radius=0.055, location=(0, 0, H / 2 + 0.01))
rim = bpy.context.active_object
smooth(rim, 3)
add(rim, M_RUBBER)
disc = cyl(R * 0.82, 0.02, H / 2 - 0.005, name="radiator")
smooth(disc)
add(disc, M_GLOSS)
bpy.ops.mesh.primitive_torus_add(major_radius=R * 0.66, minor_radius=0.012, location=(0, 0, H / 2 + 0.008))
ring = bpy.context.active_object
smooth(ring, 3)
add(ring, M_CYAN)
logo = cyl(R * 0.5, 0.004, H / 2 + 0.008, verts=96, name="logo")
add(logo, M_LOGO)

# Tira de controles, de arriba hacia abajo.
pill(0.15, 0.24, 0.05, 0.62, "strap-slot", M_GLOSS)
pill(0.06, 0.05, 0.03, 0.62, "strap-bar", M_RUBBER, y=-(R + 0.012))
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.075, depth=0.05, location=(0, -(R - 0.01), 0.36), rotation=(math.pi / 2, 0, 0))
power = bpy.context.active_object
bevel(power, 0.012, 4)
smooth(power)
add(power, M_RUBBER)
bpy.ops.mesh.primitive_torus_add(major_radius=0.06, minor_radius=0.007, location=(0, -(R + 0.017), 0.36), rotation=(math.pi / 2, 0, 0))
pring = bpy.context.active_object
smooth(pring, 3)
add(pring, M_CYAN)
pill(0.13, 0.32, 0.05, 0.06, "play", M_RUBBER)
pill(0.17, 0.46, 0.04, -0.38, "rgb-glow", M_RGB)
pill(0.13, 0.42, 0.05, -0.38, "volume", M_RUBBER, y=-(R - 0.05 * 0.35) - 0.006)
for z, w, h in ((-0.25, 0.05, 0.012), (-0.38, 0.05, 0.012), (-0.51, 0.05, 0.012), (-0.51, 0.012, 0.05)):
    # Marcas − / + y M en relieve sobre la tira de volumen.
    pill(w, h, 0.01, z, "mark", M_GLOSS, y=-(R + 0.012))

# --- Luces y mundo ------------------------------------------------------------------

def area(name, loc, energy, size, color=(1, 1, 1)):
    d = bpy.data.lights.new(name, "AREA")
    d.energy, d.size, d.color = energy, size, color
    o = bpy.data.objects.new(name, d)
    o.location = loc
    scene.collection.objects.link(o)
    c = o.constraints.new("TRACK_TO")
    c.target = root
    return o


area("key", (-3.5, -4.5, 3.0), 450, 3.0, (1.0, 0.97, 0.93))
area("fill", (4.5, -3.0, 0.5), 70, 4.0, (0.85, 0.9, 1.0))
# Contraluces fríos: separan el negro del producto del fondo oscuro del sitio.
area("rim-l", (-3.0, 3.5, 1.5), 1400, 1.2, (0.6, 0.75, 1.0))
area("rim-r", (3.0, 3.5, 0.5), 1100, 1.2, (0.6, 0.75, 1.0))
area("top", (0, 0.5, 5.0), 500, 2.0)

world = bpy.data.worlds.new("world")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.025, 0.04, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.3
scene.world = world

# --- Cámara ---------------------------------------------------------------------------

target = bpy.data.objects.new("target", None)
scene.collection.objects.link(target)
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 70
cam = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
track = cam.constraints.new("TRACK_TO")
track.target = target

# --- Animación --------------------------------------------------------------------------

D = math.radians
MODE = args["--mode"]
if MODE == "spin":
    cam.location = (0, -6.2, 0.9)
    target.location = (0, 0, 0.05)
elif MODE == "hero":
    cam.location = (1.1, -5.6, -0.7)  # cámara baja: el producto se ve imponente
    target.location = (0, 0, 0.1)
else:
    KEYS = [
        # cuadro, giro sobre su eje, vuelco hacia cámara, inclinación lateral, cámara (x, y, z), mira (z)
        (1, 0, 8, 10, (0, -6.2, 0.6), 0.0),
        (25, -55, 36, 6, (0.3, -6.0, 1.4), 0.2),
        (49, -95, 4, 0, (0, -6.2, 0.4), 0.0),
        (72, -10, 4, 4, (0.25, -4.9, 0.15), 0.08),
    ]
    for f, rz, rx, ry, cpos, tz in KEYS:
        root.rotation_euler = (D(rx), D(ry), D(rz))
        root.keyframe_insert("rotation_euler", frame=f)
        cam.location = cpos
        cam.keyframe_insert("location", frame=f)
        target.location = (0, 0, tz)
        target.keyframe_insert("location", frame=f)


def pose(f):
    """En spin, cada cuadro es 1/72 de vuelta; en chapters manda la animación."""
    if MODE == "spin":
        root.rotation_euler = (D(10), 0, -2 * math.pi * (f - 1) / TURN)
    elif MODE == "hero":
        root.rotation_euler = (D(2), D(-4), D(-24))


# --- Exportar .glb (Three.js) ----------------------------------------------------------
# glTF no entiende nodos procedurales: la tela, la tira RGB y el logo se hornean
# a imágenes con Cycles y se reconectan como texturas antes de exportar.


def export_glb(path):
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 8
    root.animation_data_clear()
    root.rotation_euler = (0, 0, 0)
    tmp = path.rsplit("/", 1)[0]

    def bake(obj_name, mat, kind, w, h, colorspace="sRGB"):
        obj = bpy.data.objects[obj_name]
        img = bpy.data.images.new(f"{obj_name}-{kind.lower()}", w, h, alpha=False)
        img.colorspace_settings.name = colorspace
        node = mat.node_tree.nodes.new("ShaderNodeTexImage")
        node.image = img
        mat.node_tree.nodes.active = node
        for o in scene.objects:
            o.select_set(False)
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.bake(type=kind, margin=8, use_clear=True)
        img.filepath_raw = f"{tmp}/{img.name}.png"
        img.file_format = "PNG"
        img.save()
        return node

    def principled(mat):
        return mat.node_tree.nodes["Principled BSDF"]

    # Tela: el tejido pasa a mapa de normales; el color queda liso.
    n = bake("body", M_FABRIC, "NORMAL", 2048, 2048, "Non-Color")
    p = principled(M_FABRIC)
    for link in list(p.inputs["Base Color"].links) + list(p.inputs["Normal"].links):
        M_FABRIC.node_tree.links.remove(link)
    p.inputs["Base Color"].default_value = (0.012, 0.012, 0.014, 1)
    nm = M_FABRIC.node_tree.nodes.new("ShaderNodeNormalMap")
    M_FABRIC.node_tree.links.new(n.outputs["Color"], nm.inputs["Color"])
    M_FABRIC.node_tree.links.new(nm.outputs["Normal"], p.inputs["Normal"])

    # Luces: se hornea el color de la emisión con fuerza 1 y la fuerza vuelve
    # como KHR_materials_emissive_strength.
    # El logo se hornea en blanco: el color de la luz lo pone la página en vivo
    # (setLight de model-turntable), igual que el del aro.
    for node in M_LOGO.node_tree.nodes:
        if node.type == "VALTORGB":
            node.color_ramp.elements[1].color = (1, 1, 1, 1)
    for obj_name, m, w, h in (("rgb-glow", M_RGB, 128, 512), ("logo", M_LOGO, 512, 512)):
        p = principled(m)
        strength = p.inputs["Emission Strength"].default_value
        p.inputs["Emission Strength"].default_value = 1
        n = bake(obj_name, m, "EMIT", w, h)
        for link in list(p.inputs["Emission Color"].links):
            m.node_tree.links.remove(link)
        m.node_tree.links.new(n.outputs["Color"], p.inputs["Emission Color"])
        p.inputs["Emission Strength"].default_value = strength

    for o in scene.objects:
        o.select_set(o == root or o.parent == root)
    opts = dict(
        filepath=path, export_format="GLB", use_selection=True, export_apply=True,
        export_animations=False, export_cameras=False, export_lights=False, export_yup=True,
    )
    try:
        bpy.ops.export_scene.gltf(**opts, export_image_format="WEBP", export_image_quality=80)
    except TypeError:
        bpy.ops.export_scene.gltf(**opts)
    print("listo glb", path)


if MODE == "glb":
    export_glb(OUT if OUT.endswith(".glb") else f"{OUT}/speaker.glb")
    sys.exit(0)

# --- Escena (hero y primeros planos) ----------------------------------------------------
# Piso negro que refleja, fondo del color del sitio, bruma y un haz de luz cenital.
# Se renderiza opaco con la vista "Standard": el borde de la imagen es exactamente
# el color de fondo de la página (se mide y se pasa al CSS).

SCENE_SHOTS = {
    # modo: (ancho, alto, lente, cámara, mira, rotación del producto (x, y, z en grados))
    "scene-hero": (2400, 1350, 50, (0.0, -7.6, -0.15), (0, 0, 0.05), (0, 0, -18)),
    "scene-light": (1200, 1500, 85, (0.15, -1.5, 3.1), (0, 0, 0.92), (0, 0, -30)),
    "scene-controls": (1200, 1500, 100, (0.35, -2.6, 0.05), (0, -0.3, -0.05), (0, 0, -8)),
    "scene-fabric": (1200, 1500, 100, (1.9, -1.6, 0.35), (0, 0, 0.2), (0, 0, -150)),
    "scene-stereo": (1200, 1500, 80, (0.0, -7.4, 0.25), (0, 0, -0.05), (0, 0, 0)),
}


def build_scene(mode):
    w, h, lens, cpos, tpos, rot = SCENE_SHOTS[mode]
    r = scene.render
    r.resolution_x, r.resolution_y = w, h
    r.film_transparent = False
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    cam.data.lens = lens
    cam.animation_data_clear()
    target.animation_data_clear()
    root.animation_data_clear()
    cam.location = cpos
    target.location = tpos
    root.rotation_mode = "XYZ"
    root.rotation_euler = tuple(D(a) for a in rot)

    ground = (0.0028, 0.003, 0.0036)  # ≈ #0b0c0e en sRGB
    world.node_tree.nodes["Background"].inputs[0].default_value = (*ground, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 1
    # Bruma: volumen en el mundo, para que el haz se vea.
    vol = world.node_tree.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Density"].default_value = 0.016
    world.node_tree.links.new(vol.outputs[0], world.node_tree.nodes["World Output"].inputs["Volume"])
    try:
        scene.eevee.volumetric_end = 40
        scene.eevee.volumetric_tile_size = "4"
        scene.eevee.volumetric_samples = 96
    except (AttributeError, TypeError):
        pass

    # Piso: negro brillante que refleja el producto.
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, -H / 2))
    floor = bpy.context.active_object
    fm = mat("floor", ground, rough=0.28)
    floor.data.materials.append(fm)
    try:
        scene.eevee.use_raytracing = True
        scene.eevee.ray_tracing_options.resolution_scale = "1"
    except (AttributeError, TypeError):
        pass

    # Las luces del estudio se reemplazan: en una escena oscura cualquier luz de
    # área ilumina la bruma y se refleja en el piso como un cuadro blanco.
    for o in list(scene.objects):
        if o.type == "LIGHT":
            bpy.data.objects.remove(o)

    def spot_light(name, loc, energy, size, color, volume, blend=0.4):
        d = bpy.data.lights.new(name, "SPOT")
        d.energy, d.spot_size, d.spot_blend, d.color = energy, D(size), blend, color
        d.volume_factor = volume
        o = bpy.data.objects.new(name, d)
        o.location = loc
        scene.collection.objects.link(o)
        c = o.constraints.new("TRACK_TO")
        c.target = root
        return o

    spot_light("beam", (-0.6, 0.8, 7.0), 2400, 26, (0.93, 0.96, 1.0), 1.0, 0.5)
    spot_light("rim-l", (-3.2, 3.0, 1.2), 2200, 22, (0.62, 0.78, 1.0), 0.0)
    spot_light("rim-r", (3.2, 3.0, 0.4), 1700, 22, (0.62, 0.78, 1.0), 0.0)
    fill = bpy.data.lights.new("fill", "AREA")
    fill.energy, fill.size, fill.volume_factor = 140, 2.0, 0.0
    fo = bpy.data.objects.new("fill", fill)
    fo.location = (-2.5, -5.0, 1.0)
    scene.collection.objects.link(fo)
    fo.constraints.new("TRACK_TO").target = root

    if mode == "scene-stereo":
        # Dos parlantes: el original a la izquierda y una copia enlazada a la derecha.
        root.location = (-0.62, 0, 0)
        root.rotation_euler = (0, 0, D(-20))
        twin = bpy.data.objects.new("twin", None)
        scene.collection.objects.link(twin)
        twin.location = (0.62, 0.15, 0)
        twin.rotation_euler = (0, 0, D(20))
        for o in [o for o in scene.objects if o.parent == root]:
            copy = o.copy()  # comparte malla y materiales
            scene.collection.objects.link(copy)
            copy.parent = twin
    return w, h


if MODE.startswith("scene-"):
    SW, SH = build_scene(MODE)

# --- Render ----------------------------------------------------------------------------

r = scene.render
for engine in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
    try:
        r.engine = engine
        break
    except TypeError:
        continue
try:
    scene.eevee.taa_render_samples = int(args["--samples"])
except AttributeError:
    pass
r.image_settings.file_format = "PNG"
if not MODE.startswith("scene-"):
    r.resolution_x, r.resolution_y = RES, int(RES * 1.25)
    r.film_transparent = True
    r.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
else:
    r.image_settings.color_mode = "RGB"

for f in range(F0, F1 + 1):
    scene.frame_set(f)
    pose(f)
    r.filepath = f"{OUT}/frame-{f:03d}.png"
    bpy.ops.render.render(write_still=True)
print("listo", F0, F1, OUT)
