# Player characters (177, 179)

The student plays as one of eight kids, chosen on the character select page
(home179). They come from the "Mega Bundle Stylized Children Characters" pack,
in the order of the character select art:

| id | look |
| --- | --- |
| kid01 | denim jacket, white hoodie, jeans, ponytail |
| kid02 | yellow hoodie, daisy tee, jeans |
| kid03 | blue and white hoodie, shorts |
| kid04 | varsity jacket, white hoodie, black pants |
| kid05 | purple hoodie, denim shorts |
| kid06 | cap, blue jacket, black pants |
| kid07 | varsity jacket, green hoodie |
| kid08 | olive jacket, khaki cargo pants |

Every kid is reshaped to kid04's proportions (smaller head, arms, legs and
torso matched, torso and limbs slimmed; hands, measured on the mesh, go only
part of the way so they don't look tiny in puffy sleeves); kid04 itself is
unchanged. Kids are drawn at 78% of the adults' height (KID_RATIO178 in
venue-frame.html); ride poses fit a kid rider (visitors100/scooter.js).

The venue crowd is made of the kids too (with the 50 purple volunteers and
20 adult chaperones), looking exactly like their characters. It uses
`kidNN-crowd.glb`: a 1024 texture, idle and walk only, and three meshes: the
full original mesh for close by, and 15,000 and 5,000 triangles (`@lod1`,
`@lod2`, face and hands kept detailed in the first) for the middle and far
distances; the game uses these instead of simplifying the mesh itself.

Walking speed comes from the feet: the game measures how fast each kid's
planted foot moves in walk, run and backward walk (gait179) and moves the
body at exactly that speed times the clip's playback rate, so feet never
slide. Crowd kids walk at their own stride with the adults' step pace.

Clips, by the names the game picks: `idle`, `walk` (W), `walk_backward`
(Walking played in reverse, S), `run` (Slow Run, Shift + W; kids 03, 05 and
08 have none in the pack, so they borrow kid04's or kid01's, retargeted bone
by bone; kid02's idle is kid01's Standing Idle, since her own leaned back and
breathed hard) and `cheer` (a wave or a jump, played when picked in the
carousel). Falls use `fall173/kidNN-fall.json`.

To rebuild from the pack (unzip its GLB.zip and ANIMATIONS.zip into one folder):

```
blender -b --factory-startup --python tools/build_kids.py -- <pack folder> .
python3 ../fall173/tools/retarget.py <folder with fall.json, getting_up.json, gltf_math.py> kid01.glb ../fall173/kid01-fall.json
```

(the second line once per kid). build_kids.py also writes the `-crowd` copies. Each kid's mesh and skeleton come from its
T-Pose FBX, the texture from the pack's GLB, and the clips from its own FBX
animations, all through the same importer, so the clips match the bind pose.
Where a relaxed idle or a stride tilts the shoes below the T-pose soles, the
build raises the whole rig (0.2 to 1.4 cm) so the lowest points of idle, walk
and run average out on the floor. Meshes are Draco-compressed (about 1 MB a
kid).

## The denim boy

`player_boy.glb` is the earlier supplied boy (denim jacket, white tee, black
cargo pants). He is no longer on the character select page; he stands in if
the chosen kid can't load (and Brad if he can't either). Clips: idle, walk,
walk_backward, run, sit. Falls use `fall173/player_boy-fall.json`. His hands
have only index-finger bones, so ride and vehicle poses use the index knuckle
where Brad's rig used the middle one.

```
blender -b --factory-startup --python tools/assemble_boy.py -- <glb folder> <Texture.png> player_boy.glb ./fall173/player_boy-fall.json
python3 ../fall173/tools/retarget.py <folder with fall.json, getting_up.json, gltf_math.py> player_boy.glb ../fall173/player_boy-fall.json
```

His supplied T-pose is centred on his hips, but the clips stand him on the
floor, so the build raises the bind pose (by about 0.93) until his soles in
idle, walk and run sit on the bind soles; the game stands the bind soles on
the floor. Retarget the falls against the built `player_boy.glb`, not the
supplied T-Pose, so they use the same height.
