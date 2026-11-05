# Rivian reward vehicle

The supplied R1S is parked at the curb in front of the main entrance, just ahead
of the first front school bus and facing the same way (`(2.65, 40.25)`, yaw -90°).
It unlocks only after `StudentProgress99.complete()`. Startup revision 155 prepares
the model behind the loading screen; the parked car remains hidden and unavailable
until that reward gate is satisfied.
The source's 298,611 triangles, vertex colors, material groups and 2048px-bounded
textures are retained. The model is merged into 132 independently animated batches.

- T: enter / exit when stopped
- WASD or arrow keys: accelerate, reverse and steer
- Space: brake
- V: cockpit / chase camera
- L: lights

Cockpit mode hides the player. Wheels spin, front wheels and steering wheel turn,
and the dashboard shows speed and gear. Lights include headlights, tail/brake,
reverse and steering-triggered indicators. The infotainment map is decorative,
not a live navigation system. Physics reuse the existing Matter vehicle engine,
with city collisions, traffic, props, water exclusion and safe dismount checks.

Revision 154 shares `ambulance35/driving154.js` with the ambulance: the chase
heading trails a turn and smoothly recenters, while damped body roll and pitch
respond to lateral acceleration and braking. Tire contact geometry stays planted;
steering, wheel spin, lights and dashboard displays retain their existing detail.
The cockpit camera does not inherit the external chase lag or suspension roll.

`ambulance35/indoor-performance154.js` pauses indoor crowd simulation and hides
indoor people during driving without changing population or visibility preferences.
Street pedestrians, traffic and officers remain active; indoor people return on
exit. Vehicle traffic synchronization also samples terrain height once per step,
rather than once per nearby car. All source Rivian triangles remain intact.

Revision 159 reduces sustained driving work without simplifying the car model.
Rigid groups reuse their transforms across materials and passes. Transparent
glass no longer submits discarded geometry to the depth-only shadow pass.
Driving retains live moving shadows at 1024px and wet-surface sky reflections,
but omits the additional fully shaded street reflection capture. Walking restores
the 2048px shadow map and scene reflections without changing user preferences.
Traffic crossing checks use a per-lane lateral broad phase; the original precise
collision checks and traffic outcomes are preserved.

`city106/traffic159-test.cjs` compares exact traffic states against the former
full-scan implementation. `performance159.cjs --stress` records local CPU profiles
and frame intervals for sustained driving into traffic and large-window turning.
Profiler timings are diagnostic, not a promised device-independent FPS.

Revision 189 lowers the chase camera (`CHASE` in runtime.js) and aims it three
units down the road ahead of the car, so drivers see farther ahead. When a
parked school bus sits right behind the car (as at its parking spot), the camera
rises over the bus roof and eases back down as the car pulls away.

Build: `node rivian147/prepare.mjs` (source extracted under `../work/rivian147`).
Test: `NODE_PATH=../work/browser/node_modules node rivian147/browser-test.cjs`.
The desktop gate prevents phone clients from starting the game or downloading this car.
