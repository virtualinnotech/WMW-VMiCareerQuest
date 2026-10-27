# Player character (177)

`player_boy.glb` is the player: the supplied Mixamo-rigged boy (denim jacket,
white tee, black cargo pants, blue sneakers) with his own texture and clips.
Brad stays loaded for the crowd and becomes the player again only if this
file cannot load.

Clips, by the names the game picks:

- `idle` — Breathing Idle
- `walk` — Walking (W)
- `walk_backward` — Walking played in reverse (S)
- `run` — Running, used while sprinting (Shift + W)
- `sit` — Sitting (kept for later use)

Falls use `fall173/player_boy-fall.json`, the fall and get-up clips retargeted
to his skeleton. His hands have only index-finger bones, so ride and vehicle
poses use the index knuckle where Brad's rig used the middle one.

To rebuild from the supplied files (the GLB folder from
`glb+with+animations.zip` and `Texture.png` from `Texture.zip`):

```
blender -b --factory-startup --python tools/assemble_boy.py -- <glb folder> <Texture.png> player_boy.glb ./fall173/player_boy-fall.json
python3 ../fall173/tools/retarget.py <folder with fall.json, getting_up.json, gltf_math.py> player_boy.glb ../fall173/player_boy-fall.json
```

The supplied T-pose is centred on his hips, but the clips stand him on the
floor, so the build raises the bind pose (by about 0.93) until his soles in
idle, walk and run sit on the bind soles; the game stands the bind soles on
the floor. Retarget the falls against the built `player_boy.glb`, not the
supplied T-Pose, so they use the same height.

The texture is stored as a 2048 JPEG; the game uses it at 2048 (1024 on
low-memory Chromebooks).
