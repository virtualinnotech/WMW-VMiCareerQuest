# Falls (173)

The player falls and gets back up when he:

- sprints (Shift + forward) head-on into something solid — a wall, a car, a
  person. Walking into a wall, sliding along one or a slow bump never counts;
- crashes a bike, scooter or Segway: riding into something solid at cruising
  speed or faster (1.6 or more; cruise is 2.6, turbo 7.5). The rider lands
  beside the ride, which tips over — bikes and scooters onto their side, the
  Segway forward — and stays where it crashed. Walking up and pressing T
  stands it back up and remounts. A crashed dock bike or scooter returns to
  its dock the next time it is ridden and parked.

Movement is locked while he is down (about 3.5 s: the fall, then getting up),
with a short cooldown after.

`brad-fall.json` holds the two clips: frames 6–62 of the supplied `fall.fbx`
(the run-up is trimmed so the stumble starts at the impact) and frames 1–66
of `Getting Up.fbx`, 30 fps, retargeted onto Brad's skeleton. To rebuild it
from new FBX files with Blender:

```
blender -b --factory-startup --python tools/sample_fbx.py -- fall.fbx fall.json
blender -b --factory-startup --python tools/sample_fbx.py -- "Getting Up.fbx" getting_up.json
python3 tools/retarget.py <folder with brad.glb, fall.json, getting_up.json>
```

(`brad.glb` is Brad's embedded character from venue-frame.html.) The retarget
maps each bone's world-space rotation away from the shared T-pose, so any
Mixamo clip works regardless of the rig prefix (mixamorig7: and so on); the
script prints head, hip and feet heights as a check.

`player_boy-fall.json` is the same pair of clips retargeted to the player
boy's skeleton (players177). `retarget.py` now takes the target GLB and
output path, and measures the hip drop from the target's feet, so rigs that
are centred on the hips land on the floor. Retarget against the built
`players177/player_boy.glb` (see players177/README.md).
