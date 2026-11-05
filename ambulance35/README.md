# Health Science ambulance run

Open the Health Science challenge panel and choose Visit ambulance. Walk near the
ambulance at the bus drop-off and press T to start the 60-second countdown.
WASD or arrow keys drive; Space brakes; T exits when stopped. Touch controls are
also available. Exiting ends the attempt; Restart returns the ambulance to the
buses for another attempt. Blur clears driving inputs, but does not stop the
real-time deadline.

Mouse-wheel zoom uses an ambulance-specific 2.8-12 unit range; Reset view restores
the default chase view. Nearby low rails raise the camera rather than pushing it
inside the cab. Exiting restores the original walking-camera settings.

Revision 189 lowers the chase camera (`CHASE` in ambulance.js: pitch .06) and
aims it 3.5 units down the road ahead of the ambulance instead of at its roof,
so drivers see farther ahead.

While mounted, a circular heading-up navigation map replaces the bottom-left
walking controls. It follows the ambulance, highlights the remaining checkpoint
route in yellow, and shows the hospital, river, bridges and surrounding roads.
The walking controls return on exit/reset. The existing challenge HUD still
provides optional driving controls through its settings button.

Nearby traffic ahead steers into an available shoulder or stops when the swept
path is occupied. Nearby traffic behind stops and waits; distant traffic is not
shifted globally. Body yaw and front wheels follow the curved driving path, and
cars check clearance again before merging back. This is an arcade approximation
of emergency yielding, not the GTA/LCPDFR implementation.

Contact between the ambulance and a visible pedestrian immediately stops the
vehicle and fails the challenge with "You hit a pedestrian. Challenge failed."
This includes crowd attendees, volunteers and booth representatives, but excludes
the driver, near misses and people at a different elevation. No points are
awarded, and Restart begins a fresh attempt.

Open ground is freely drivable, with no invisible course-edge stops. Off-course
and wrong-way warnings guide the student back to the next checkpoint. Real
obstacles remain solid. Entering the river disables the ambulance.

Vehicle health starts at 100%. Impacts produce a physical rebound, body jolt and
short-lived panel fragments. Damage scales with impact speed into the surface,
so glancing hits are less severe. Gentle contact and repeated contact jitter do
not rapidly drain health. At 0%, the vehicle breaks down and the challenge fails
without awarding points. Restart repairs it and clears the fragments.

Follow the route around the east side of the venue, over the east road bridge,
then turn onto the far-bank road. Reach the large red plus in front
of the hospital in strictly less than 60 seconds. Sequential checkpoints prevent
shortcuts. Successful delivery awards 150 local challenge points; results are
not connected to the existing badge system or persisted across page reloads.

The supplied FBX has been converted to a textured GLB, with four separate wheel
pivots and 17 independent red/white light parts. Runtime wheel rotation follows
distance traveled and front-wheel steering. The hospital replaces only the
visuals of City_Riverbank_100_Building-Medium-01, adding a gray window-grid facade,
red cross, entrance sign and rooftop helipad. Surrounding buildings are retained.
Driving uses Matter.js 0.20.0 for horizontal rigid-body collisions, with rotated
bus/building footprints, round tree trunks and wall cross-sections instead of
inflated axis-aligned collision boxes. City tree trunks get vehicle-only collision
shapes even when they are decorative for pedestrians. Nearby bodies are activated
through a spatial index; bridge elevation filters out geometry above/below the
vehicle. The hospital footprint matches its replacement mesh. This is an arcade
learning challenge, not a medical or certified driving simulator.

## Deployment

`venue-frame.html` loads the vendored Matter.js library, `vehicle-physics.js`,
`minimap120.js` and this script after the forklift module. The library's MIT license is included in
`vendor/LICENSE`; no external physics CDN is needed. The existing
`npm run sync:forklift --prefix booth-shipping` asset step now copies both vehicle
modules into Cloudflare static assets. Regenerate the embedded v13 venue with
`bash splice-venue.sh` after modifying the venue HTML. Remote publication still
requires the project's normal Cloudflare deployment and venue/R2 sync.

## Verification

Run `node ambulance35/browser-test.cjs` with Playwright installed and a local
server at `http://127.0.0.1:8014`. `VENUE_URL` and `CHROME_PATH` can override those
defaults. The test mocks backend reads, audits route clearance, drives the full
course with steering/braking controls (no vehicle teleporting), verifies the
deadline, reset, checkpoint enforcement, wheel transforms and lamp alternation,
checks canvas pixels and desktop/mobile layouts, and saves screenshots under
`../work`. Human playtesting with live traffic and employer layouts is still
recommended; a driver must brake or go around vehicles that cannot pull over.

`node ambulance35/vehicle-physics.test.cjs` checks rebound, tunneling, glancing
severity, gentle contact, reset behavior and collision shapes without a browser.
`node ambulance35/collision-test.cjs` exercises free driving, warning recovery,
real bus/tree/hospital/bridge impacts, debris, damage, breakdown, water hazards,
repair and mobile layout in the browser. It uses the same Playwright setup.

`node ambulance35/camera-pedestrian-test.cjs` checks wheel zoom/recovery, camera
reset and restoration, bridge-rail clearance, NPC contact versus near misses and
other floors, immediate failure, immobilization and mobile result layout.
