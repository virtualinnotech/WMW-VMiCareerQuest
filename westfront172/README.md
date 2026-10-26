# DeVos west front (172)

The park strip between the westbridge sidewalk and the DeVos west wall is now
the street wall from the real Lyon Street view:

- the dark glass entrance (black frame, white roof railing) where Lyon Street
  meets the building, with a granite planter of bushes and flowers and five
  flags: POW/MIA, Michigan, the United States, Kent County and Grand Rapids;
- the Amway Grand Plaza base to the left: vertical charcoal-blue metal
  panels, a louvered ribbon window with ten US flags on angled poles, and a
  canopy (marquee bulbs, round granite columns, lobby with sconces) over a
  drive-through — entrance lane, the "AMWAY GRAND PLAZA" granite planter,
  exit lane — with brick driveway aprons across the sidewalk;
- inside, behind a big revolving glass door (brass frame, slowly turning) in
  the middle of the lobby wall: the Amway lobby — gold marble floor, the
  dome with its gold ceiling, dark wood ring and brass bowl chandelier, the
  round blue rug with a pedestal table of flowers and stanchions, and the
  wood check-in desk against the far wall, straight ahead. To the left, under
  "THE PANTLIND" arch, a Victorian hallway (damask wallpaper, wood
  wainscoting, gilt-framed paintings, brass sconces and chandeliers, a
  patterned runner, arches) runs back and up a gentle ramp into the
  hospitality addition's lower gallery through a doorway in its window wall
  (the doorway is cut from its meshes and contacts at load). A passage on
  the right leads into the restaurant behind the glass entrance: herringbone
  floor, white stacked columns along the windows, a bar with white stools and
  gold-mesh wine cabinets, marble tables with gray chairs, the wave mural, a
  mezzanine with a glass railing and purple cove lighting. The rooms have
  their own lights (on day and night); the drive-through is red brick from
  the curb to the lobby wall (the park path under it is trimmed out);
- the Amway glass tower on top of the hospitality addition: 31 floors of
  pale reflective glass with thin mullions, a ledge below the crown and a
  row of dark openings at the top;
- a skywalk (stained concrete, dark glass barrel vault with white ribs) over
  westbridge from the older hotel to the building opposite;
- the brick hotel tower and the older stone-and-brick hotel to the right,
  running to the Front Ave corner, where its back wall (past the DeVos
  front) is finished too; a beige hotel tower rises behind the glass.

`core.js` (loaded before the city) holds the layout. The city loader asks it
which park pieces to leave out (trees, lawn, benches, bins, park lamps and
their lights), moves Calder's La Grande Vitesse and its uplights to the plaza
across Front Ave behind the glass building, and keeps the westbridge traffic
signals that the farm field rule used to drop (the DeVos-side poles step 0.25
toward the curb). Pedestrians on the old park walk use the sidewalk in front;
the grove walk, which ran inside the hospitality addition, is gone.

`runtime.js` builds the geometry and canvas textures once, adds them to the
venue's render batches (so they are culled, lit and shadowed like the rest)
and registers box colliders. The farm scene hides these batches and drops the
colliders while it runs.
