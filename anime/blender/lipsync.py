"""Local voice envelope and optional Blender controls; no phoneme recognition."""
import json
import math
import struct
import subprocess
from pathlib import Path

SAMPLE_RATE = 12000

def envelope(samples, sample_rate=SAMPLE_RATE, fps=24, noise_floor=.015):
    """Return per-frame normalized RMS, with explicit closure in silence."""
    if sample_rate <= 0 or fps <= 0 or not 0 <= noise_floor < 1:
        raise ValueError('Paramètres de mesure invalides')
    step = sample_rate / fps
    output = []
    for index in range(math.ceil(len(samples) / step)):
        chunk = samples[round(index * step):round((index + 1) * step)]
        if not chunk:
            continue
        rms = math.sqrt(sum(value * value for value in chunk) / len(chunk))
        output.append(0.0 if rms < noise_floor else min(1.0, (rms - noise_floor) / .18))
    return output


def decode_audio(path, ffmpeg):
    result = subprocess.run([str(ffmpeg), '-nostdin', '-v', 'error', '-i', str(path), '-ac', '1',
                             '-ar', str(SAMPLE_RATE), '-f', 's16le', 'pipe:1'],
                            check=True, capture_output=True)
    data = result.stdout
    count = len(data) // 2
    return [v / 32768 for v in struct.unpack('<' + 'h' * count, data[:count * 2])]


def analyse_project(manifest_path, root, ffmpeg, fps=24):
    """Map each speaker to frame→intensity, using voice-only tracks and timestamps."""
    root = Path(root)
    data = json.loads(Path(manifest_path).read_text(encoding='utf-8'))
    result = {}
    for track in data['audio']:
        path = Path(track['path'])
        if 'voices' not in path.parts:
            continue
        voice_file = root / path
        metadata_file = voice_file.with_suffix('.json')
        metadata = json.loads(metadata_file.read_text(encoding='utf-8'))
        speaker = metadata['speaker']
        values = envelope(decode_audio(voice_file, ffmpeg), fps=fps)
        first = round(float(track['start']) * fps) + 1
        mapping = result.setdefault(speaker, {})
        mapping[max(1, first - 1)] = 0.0
        for index, value in enumerate(values):
            frame = first + index
            mapping[frame] = max(value, mapping.get(frame, 0))
        mapping[first + len(values)] = 0.0
    return result


def animate_head(armature, frames, max_radians=.025):
    """Animate slight head nods from voice intensity (not lip-sync)."""
    head = armature.pose.bones.get('mixamorig:Head') or armature.pose.bones.get('Head')
    if head is None:
        raise ValueError('Os de tête introuvable')
    head.rotation_mode = 'XYZ'
    original = tuple(head.rotation_euler)
    for frame, value in sorted(frames.items()):
        head.rotation_euler = (original[0] + value * max_radians, original[1], original[2])
        head.keyframe_insert(data_path='rotation_euler', frame=frame, group='HOLT voice head')
    return len(frames)


def animate_shape(shape, frames):
    """Animate an existing validated mouth-open shape; shape must be provided by caller."""
    for frame, value in sorted(frames.items()):
        shape.value = max(0.0, min(1.0, value))
        shape.keyframe_insert(data_path='value', frame=frame)
    return len(frames)


def create_experimental_abigail_mouth(mesh):
    """Experimental relative shape on the original Abigail-export mesh only.

    Parameters are calibrated in the original glTF local coordinate system.
    Requires a visual check before use on differently shaped or transformed meshes.
    """
    if mesh.type != 'MESH' or len(mesh.data.vertices) != 9491:
        raise ValueError('Maillage Abigail attendu (9491 sommets)')
    if mesh.data.shape_keys is None:
        mesh.shape_key_add(name='Basis', from_mix=False)
    if mesh.data.shape_keys.key_blocks.get('HOLT_MouthOpen'):
        raise ValueError('Forme bouche déjà présente')
    shape = mesh.shape_key_add(name='HOLT_MouthOpen', from_mix=False)
    for vertex in mesh.data.vertices:
        x, y, z = vertex.co
        if abs(x) > .035 or y > -.10 or abs(z - 1.357) > .04:
            continue
        wx = math.exp(-((x / .022) ** 4))
        wy = min(1.0, max(0.0, (-y - .10) / .025))
        if z < 1.358:
            wz = math.exp(-(((z - 1.352) / .018) ** 2))
            shape.data[vertex.index].co.z -= .012 * wx * wy * wz
        else:
            wz = math.exp(-(((z - 1.362) / .010) ** 2))
            shape.data[vertex.index].co.z += .003 * wx * wy * wz
    return shape
