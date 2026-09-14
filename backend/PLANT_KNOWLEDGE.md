# Plant knowledge base

The 40 global catalogue records live in `data/plant_catalogue.py` and are seeded
idempotently with `python -m data.seed_plants` after `alembic upgrade head`.

Records use Celsius, percentage humidity, hours/day, days, and pH only when a
source supports a stable value. Ranges that materially depend on cultivar or
local conditions are deliberately `NULL`; care guidance uses soil and plant
condition rather than a universal watering calendar.

Controlled vocabularies: categories (`indoor_foliage`, `succulent`, `tropical`,
`flowering`, `herb`, `edible`, `garden`, `other`); difficulty (`easy`,
`moderate`, `difficult`); and light (`low_to_medium`, `bright_indirect`,
`bright_direct`, `full_sun`, `partial_shade`). Soil values are short controlled
concepts such as `well_draining`, `standard_potting_mix`, and
`cactus_succulent_mix`.

Each record stores concise institutional source references and no image URL is
seeded. Update a record in the catalogue file, retain or replace its provenance,
then rerun the seed command.
