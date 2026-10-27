# Home page and character select (179)

The student fair (/student) opens on a home page while the fair loads behind
it:

- **New Game** opens Choose Your Character: first name, last initial and
  school above a 3D carousel of the eight kids (`players177/kid01-08.glb`).
  "Let's go" makes the student's game code (journey166), shows it, and the
  student enters the fair as that kid.
- **Resume Game** continues this computer's journey, or takes a code. The
  character comes back with the progress (it is saved with it as
  `mcqCharacter179`). A journey from before the carousel picks a kid first.
- **Settings**: graphics (Auto / Full / Light, GraphicsMode165), colors
  (Vibrant / Natural, Grade178) and sound (Sound179, which switches every
  AudioContext and video in the game).

Hovering or tabbing to a menu item gives it the logo's red (#dc1934).

`home-bg.webp` is the supplied DeVos Place night picture with its baked-in
logo and menu words painted out, so the real (clickable) ones sit on top.
The logo is `loading155/title158.png`. The heading font is Montserrat from
Google Fonts, falling back to the system font.

The carousel is one WebGL2 scene: the eight kids stand on round platforms
around a circle seen from the front and a little above (the back row smaller
and higher), all facing the viewer; the chosen kid's platform glows blue and
they wave or jump. Arrows, the dots, dragging, arrow keys or clicking a kid
turn the circle. Models are decoded with the game's own Draco decoder, the
chosen kid first. Its graphics memory is freed when the student enters the
fair.

The fair waits for the choice before it makes the player (`loadPlayer179` in
venue-frame.html); the loading screen's "characters" step waits for it too.
Skipped, like the journey screens, in the studio, for employers, with
`?diagnose=` or `?journey=0`, and when `mcqHomeSkip179` or `mcqJourneySkip166`
is set in localStorage (tests); the player is then the saved kid, or kid01.
