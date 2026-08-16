# SLOW COMBUSTION

*An algorithmic philosophy for the vault.*

## The movement

A vault is not a room. It is a held breath — a volume of air that has been
waiting in the dark long enough to forget there was ever anything else. Slow
Combustion is the aesthetics of that waiting: matter that is not burning and
not cold, held at the exact temperature where it could go either way. Nothing
in this system ever ignites and nothing ever quite dies. It smoulders, which is
the only honest state for a locked thing.

The computational claim is this: **heat is a field, and everything visible is
merely debris caught in it.** We never draw fire. We draw the particulate that
fire disturbs — ash, ember, the ghost of convection — and we let the viewer's
eye assemble the fire that must be underneath. The absent centre is the whole
composition. This is a discipline of restraint, and it only reads as inevitable
when every constant has been driven through hundreds of iterations by someone
who knows precisely how little is enough.

## The algorithm

The field is layered curl noise, sampled at two octaves whose frequencies sit
at an irrational ratio so the pattern never tiles and never repeats within a
human attention span. To the curl we add a constant upward bias — buoyancy —
because embers know which way is out. Where the two octaves disagree the flow
shears, and shear is where the composition finds its drama: the eye is drawn to
turbulence, not to laminar drift, so the low-frequency octave is tuned to place
its shear zones off-centre, in the thirds.

Particles are born along the lower margin with lifespans drawn from a
long-tailed distribution: most die young and low, a rare few survive to cross
the entire frame. That asymmetry is the difference between a snowstorm and a
fire. Each carries a heat scalar that decays exponentially, and heat is the
only input to colour — a three-stop ramp from bone-white at the core through
ember orange to the deep oxidised red of iron left outdoors. No particle is
ever assigned a colour directly. Colour is *earned* by staying hot, and this
coupling of physics to palette is what separates a meticulously crafted system
from decoration.

Density is governed by a strict budget. The field is allowed a fixed population,
and a new ember may only be born when an old one dies — conservation as a
compositional device. The result never crowds, never thins, and settles into a
standing equilibrium: a picture that is always moving and never changing. That
equilibrium point was not derived. It was *found*, by patient adjustment, the
way a kiln operator finds a temperature.

## Craft notes

Every parameter here should feel load-bearing. Buoyancy against noise scale
sets whether the scene reads as smoke or as sparks — a few hundredths in either
direction ruins it. Lifespan skew controls whether the frame feels populated or
haunted. Trail persistence — the alpha of the veil painted over each frame —
governs memory: too opaque and the embers become dots, too transparent and the
canvas silts up into mud. The correct value sits in a narrow band that only
reveals itself after many failed attempts, which is exactly the point.

Reproducibility is non-negotiable. The system runs from an integer seed through
its own deterministic PRNG, so any given seed yields precisely the same
smouldering forever. The vault ships with one chosen seed. It was not the first
one tried.

## The seed beneath the seed

The population is capped at **334**.

There is no computational reason for that number. It is the count of futures
kept in the oracle on the other side of this domain — every fortune the site
can tell, reduced to a single drifting particle apiece, none of them legible,
all of them still in the air. Anyone who has counted them will feel it. Everyone
else simply sees embers.
