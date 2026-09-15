"""Curated global plant knowledge records used by the idempotent seed command.

Ranges that vary materially by cultivar, climate, pot size, season, and indoor
conditions are intentionally left null. The qualitative cues are not watering
schedules; future assessments combine them with observed conditions.
"""

RESEARCH_DATE = "2026-09-14"
SOURCES = [
    {"name": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants", "information_type": "plant profile and cultivation guidance", "accessed": RESEARCH_DATE},
    {"name": "Missouri Botanical Garden", "url": "https://www.missouribotanicalgarden.org/PlantFinder", "information_type": "plant identity and growing conditions", "accessed": RESEARCH_DATE},
    {"name": "University of Minnesota Extension", "url": "https://extension.umn.edu/houseplants", "information_type": "container and houseplant care context", "accessed": RESEARCH_DATE},
    {"name": "Kew Plants of the World Online", "url": "https://powo.science.kew.org/", "information_type": "botanical nomenclature reference", "accessed": RESEARCH_DATE},
]


def plant(common_name, scientific_name, category, difficulty, description, *, aliases=(), indoor=True,
          outdoor=False, light="bright_indirect", soils=("standard_potting_mix", "well_draining"),
          moisture="moderate", drought="low", overwatering="moderate", problems=()):
    return {
        "common_name": common_name,
        "scientific_name": scientific_name,
        "aliases": list(aliases),
        "category": category,
        "difficulty": difficulty,
        "description": description,
        "is_indoor_suitable": indoor,
        "is_outdoor_suitable": outdoor,
        "light_requirement": light,
        # Avoid false precision: these depend on local growing conditions.
        "watering_frequency_min_days": None,
        "watering_frequency_max_days": None,
        "preferred_moisture_min": None,
        "preferred_moisture_max": None,
        "drought_tolerance": drought,
        "overwatering_sensitivity": overwatering,
        "preferred_soil_types": list(soils),
        "drainage_requirement": "well_draining",
        "moisture_retention": moisture,
        "ph_min": None,
        "ph_max": None,
        "preferred_pot_size": None,
        "pot_drainage_required": True,
        "repotting_interval": "Repot when root-bound or when potting medium no longer drains well.",
        "growth_stages": ["juvenile", "mature"],
        "growth_rate": "moderate",
        "mature_size": None,
        "fertilizer_type": "balanced_plant_fertilizer",
        "fertilizer_frequency": "Follow product label during active growth; reduce when growth slows.",
        "seasonal_care": {"active_growth": "Monitor water use and light as conditions change.", "low_growth": "Reduce inputs when growth and evaporation slow."},
        "common_problems": [{"issue": issue} for issue in problems],
        "care_guidelines": {
            "watering": "Use soil moisture and plant condition as cues; avoid treating a calendar as a universal schedule.",
            "light": f"Provide {light.replace('_', ' ')} conditions and acclimate plants before abrupt light changes.",
            "soil": "Use a suitable, fresh medium and a container with drainage.",
        },
        "source_references": SOURCES,
        "image_url": None,
    }


PLANT_CATALOGUE = [
    plant("Snake Plant", "Dracaena trifasciata", "indoor_foliage", "easy", "An upright, architectural foliage plant valued for resilient indoor growth.", aliases=("Sansevieria", "mother-in-law's tongue"), light="low_to_medium", soils=("cactus_succulent_mix", "well_draining"), moisture="low", drought="high", overwatering="high", problems=("root_rot", "low_light_growth", "mealybugs")),
    plant("Money Plant / Pothos", "Epipremnum aureum", "indoor_foliage", "easy", "A trailing or climbing aroid with adaptable heart-shaped foliage.", aliases=("golden pothos", "devil's ivy", "money plant"), light="bright_indirect", moisture="moderate", drought="moderate", problems=("root_rot", "low_light_growth", "leaf_yellowing")),
    plant("Monstera", "Monstera deliciosa", "indoor_foliage", "moderate", "A large-leaved tropical climber grown for its distinctive split foliage.", aliases=("Swiss cheese plant",), light="bright_indirect", moisture="moderate", problems=("root_rot", "leaf_burn", "low_light_growth")),
    plant("Spider Plant", "Chlorophytum comosum", "indoor_foliage", "easy", "A clump-forming houseplant with arching leaves and plantlets.", aliases=("airplane plant",), light="bright_indirect", moisture="moderate", drought="moderate", problems=("brown_tips", "root_rot", "spider_mites")),
    plant("Peace Lily", "Spathiphyllum spp.", "indoor_foliage", "moderate", "A shade-tolerant tropical foliage plant with pale spathes.", aliases=("spathiphyllum",), light="low_to_medium", soils=("peat_based", "moisture_retentive"), moisture="moderate", drought="low", overwatering="high", problems=("wilting", "root_rot", "brown_tips")),
    plant("Areca Palm", "Dypsis lutescens", "indoor_foliage", "moderate", "A feather-leaved palm commonly grown as a bright-room specimen.", aliases=("butterfly palm", "golden cane palm"), light="bright_indirect", moisture="moderate", drought="low", problems=("brown_tips", "spider_mites", "root_rot")),
    plant("ZZ Plant", "Zamioculcas zamiifolia", "indoor_foliage", "easy", "A glossy-leaved, drought-tolerant aroid grown for low-maintenance interiors.", aliases=("Zanzibar gem",), light="low_to_medium", soils=("cactus_succulent_mix", "well_draining"), moisture="low", drought="high", overwatering="high", problems=("root_rot", "leaf_yellowing", "mealybugs")),
    plant("Rubber Plant", "Ficus elastica", "indoor_foliage", "moderate", "A broad-leaved tropical tree grown indoors for bold glossy foliage.", aliases=("rubber tree",), light="bright_indirect", moisture="moderate", problems=("leaf_drop", "root_rot", "scale_insects")),
    plant("Philodendron", "Philodendron hederaceum", "indoor_foliage", "easy", "A vining philodendron with heart-shaped leaves for indoor growing.", aliases=("heartleaf philodendron",), light="low_to_medium", moisture="moderate", drought="moderate", problems=("root_rot", "low_light_growth", "mealybugs")),
    plant("Chinese Evergreen", "Aglaonema commutatum", "indoor_foliage", "easy", "A tropical foliage plant valued for patterned leaves and indoor tolerance.", aliases=("aglaonema",), light="low_to_medium", moisture="moderate", problems=("root_rot", "cold_damage", "mealybugs")),
    plant("Aloe Vera", "Aloe vera", "succulent", "easy", "A succulent with fleshy leaves, commonly grown in bright conditions.", aliases=("medicinal aloe",), light="bright_direct", soils=("cactus_succulent_mix", "sandy_loam"), moisture="low", drought="high", overwatering="high", problems=("root_rot", "etiolation", "scale_insects")),
    plant("Jade Plant", "Crassula ovata", "succulent", "easy", "A woody succulent with rounded water-storing leaves.", aliases=("money tree",), light="bright_direct", soils=("cactus_succulent_mix", "well_draining"), moisture="low", drought="high", overwatering="high", problems=("root_rot", "etiolation", "mealybugs")),
    plant("Lavender", "Lavandula angustifolia", "herb", "easy", "A fragrant herb known for its aromatic purple flowers and essential oil.", aliases=("lavender",), light="full_sun", soils=("well_draining",), moisture="low", drought="high", overwatering="low", problems=("root_rot", "aphids")),
    plant("Fiddle Leaf Fig", "Ficus lyrata", "indoor_foliage", "moderate", "A large-leaved indoor tree valued for its dramatic foliage.", aliases=("fiddle leaf fig",), light="bright_indirect", soils=("standard_potting_mix", "well_draining"), moisture="moderate", drought="low", overwatering="moderate", problems=("leaf_drop", "spider_mites", "scale_insects")),
    plant("String of Pearls", "Curio rowleyanus", "succulent", "moderate", "A trailing succulent with bead-like leaves.", aliases=("Senecio rowleyanus",), light="bright_indirect", soils=("cactus_succulent_mix", "well_draining"), moisture="low", drought="high", overwatering="high", problems=("root_rot", "shriveling", "mealybugs")),
    plant("Kalanchoe", "Kalanchoe blossfeldiana", "succulent", "easy", "A flowering succulent often grown for long-lasting clusters of blooms.", light="bright_direct", soils=("cactus_succulent_mix", "well_draining"), moisture="low", drought="moderate", overwatering="high", problems=("root_rot", "aphids", "mealybugs")),
    plant("Zebra Cactus", "Haworthiopsis fasciata", "succulent", "easy", "A small striped rosette succulent suited to bright, protected positions.", aliases=("Haworthia fasciata",), light="bright_indirect", soils=("cactus_succulent_mix", "well_draining"), moisture="low", drought="high", overwatering="high", problems=("root_rot", "sunburn", "mealybugs")),
    plant("Calathea", "Goeppertia spp.", "tropical", "difficult", "A group of tropical foliage plants known for patterned leaves and humidity sensitivity.", aliases=("prayer plant", "Calathea spp."), light="low_to_medium", soils=("peat_based", "moisture_retentive"), moisture="moderate", drought="low", overwatering="moderate", problems=("brown_tips", "leaf_curl", "spider_mites")),
    plant("Croton", "Codiaeum variegatum", "tropical", "moderate", "A colorful tropical foliage shrub with boldly variegated leaves.", light="bright_indirect", moisture="moderate", drought="low", problems=("leaf_drop", "spider_mites", "scale_insects")),
    plant("Dracaena", "Dracaena fragrans", "tropical", "easy", "A cane-forming tropical foliage plant used as an upright indoor specimen.", aliases=("corn plant",), light="bright_indirect", moisture="moderate", drought="moderate", problems=("brown_tips", "root_rot", "scale_insects")),
    plant("Bird of Paradise", "Strelitzia reginae", "tropical", "moderate", "A large tropical perennial grown for paddle-shaped leaves and striking flowers.", light="bright_direct", indoor=True, outdoor=True, moisture="moderate", problems=("leaf_split", "root_rot", "scale_insects")),
    plant("Fittonia / Nerve Plant", "Fittonia albivenis", "tropical", "moderate", "A compact tropical foliage plant with contrasting leaf veins.", aliases=("nerve plant",), light="low_to_medium", soils=("peat_based", "moisture_retentive"), moisture="moderate", drought="low", overwatering="moderate", problems=("wilting", "brown_tips", "root_rot")),
    plant("Boston Fern", "Nephrolepis exaltata", "tropical", "moderate", "A feathery fern that benefits from evenly moist media and humid air.", aliases=("sword fern",), light="low_to_medium", soils=("peat_based", "moisture_retentive"), moisture="moderate", drought="low", overwatering="moderate", problems=("brown_tips", "leaf_drop", "scale_insects")),
    plant("Rose", "Rosa spp.", "flowering", "moderate", "A flowering shrub group cultivated for fragrant, showy blooms.", indoor=False, outdoor=True, light="full_sun", soils=("loamy", "well_draining"), moisture="moderate", problems=("black_spot", "aphids", "powdery_mildew")),
    plant("Hibiscus", "Hibiscus rosa-sinensis", "flowering", "moderate", "A tropical flowering shrub with large, colorful blooms.", indoor=True, outdoor=True, light="bright_direct", moisture="moderate", problems=("aphids", "spider_mites", "bud_drop")),
    plant("Jasmine", "Jasminum sambac", "flowering", "moderate", "A fragrant flowering shrub or vine commonly cultivated in warm conditions.", indoor=True, outdoor=True, light="bright_direct", moisture="moderate", problems=("aphids", "scale_insects", "root_rot")),
    plant("Marigold", "Tagetes erecta", "flowering", "easy", "A sun-loving annual grown for bright composite flowers.", indoor=False, outdoor=True, light="full_sun", soils=("loamy", "well_draining"), moisture="moderate", drought="moderate", problems=("aphids", "powdery_mildew", "root_rot")),
    plant("Geranium", "Pelargonium × hortorum", "flowering", "easy", "A commonly grown bedding and container plant with rounded leaves and flower clusters.", aliases=("zonal geranium",), indoor=True, outdoor=True, light="full_sun", soils=("standard_potting_mix", "well_draining"), moisture="moderate", drought="moderate", problems=("root_rot", "aphids", "botrytis")),
    plant("African Violet", "Streptocarpus ionanthus", "flowering", "moderate", "A compact flowering houseplant with soft leaves and violet-like blooms.", aliases=("Saintpaulia ionantha",), light="bright_indirect", soils=("peat_based", "well_draining"), moisture="moderate", drought="low", overwatering="high", problems=("crown_rot", "leaf_spot", "mealybugs")),
    plant("Anthurium", "Anthurium andraeanum", "flowering", "moderate", "A tropical aroid grown for waxy spathes and glossy foliage.", aliases=("flamingo flower",), light="bright_indirect", soils=("peat_based", "well_draining"), moisture="moderate", drought="low", problems=("root_rot", "brown_tips", "mealybugs")),
    plant("Tulsi / Holy Basil", "Ocimum basilicum", "herb", "moderate", "An aromatic basil relative cultivated for culinary, cultural, and garden use.", aliases=("holy basil", "tulsi"), indoor=True, outdoor=True, light="full_sun", soils=("loamy", "well_draining"), moisture="moderate", problems=("aphids", "powdery_mildew", "leaf_spot")),
    plant("Mint", "Mentha spp.", "herb", "easy", "A vigorous aromatic herb commonly grown in containers to limit spread.", indoor=True, outdoor=True, light="partial_shade", soils=("loamy", "moisture_retentive"), moisture="moderate", drought="low", problems=("rust", "aphids", "powdery_mildew")),
    plant("Coriander / Cilantro", "Coriandrum sativum", "edible", "moderate", "An annual culinary herb grown for leaves and seeds.", aliases=("cilantro", "coriander"), indoor=True, outdoor=True, light="full_sun", soils=("loamy", "well_draining"), moisture="moderate", drought="low", problems=("bolting", "aphids", "powdery_mildew")),
    plant("Rosemary", "Salvia rosmarinus", "herb", "moderate", "A woody aromatic herb with needle-like leaves.", aliases=("Rosmarinus officinalis",), indoor=True, outdoor=True, light="full_sun", soils=("sandy_loam", "well_draining"), moisture="low", drought="high", overwatering="high", problems=("root_rot", "powdery_mildew", "spider_mites")),
    plant("Lemongrass", "Cymbopogon citratus", "edible", "moderate", "A clump-forming aromatic grass used in culinary preparations.", indoor=True, outdoor=True, light="full_sun", soils=("loamy", "well_draining"), moisture="moderate", drought="low", problems=("rust", "aphids", "root_rot")),
    plant("Curry Leaf Plant", "Murraya koenigii", "edible", "moderate", "A warm-climate aromatic shrub cultivated for curry leaves.", aliases=("curry tree",), indoor=True, outdoor=True, light="bright_direct", soils=("loamy", "well_draining"), moisture="moderate", drought="moderate", problems=("scale_insects", "root_rot", "leaf_drop")),
    plant("Tomato", "Solanum lycopersicum", "edible", "moderate", "A warm-season fruiting plant grown in beds and containers.", aliases=("tomato plant",), indoor=False, outdoor=True, light="full_sun", soils=("loamy", "well_draining"), moisture="moderate", drought="low", problems=("blight", "aphids", "blossom_end_rot")),
    plant("Chilli / Pepper", "Capsicum annuum", "edible", "moderate", "A warm-season pepper species grown for edible fruit.", aliases=("chili pepper", "pepper plant"), indoor=True, outdoor=True, light="full_sun", soils=("loamy", "well_draining"), moisture="moderate", drought="low", problems=("aphids", "blossom_end_rot", "leaf_spot")),
    plant("Lucky Bamboo", "Dracaena sanderiana", "other", "easy", "A dracaena commonly sold with cane-like stems for indoor display.", aliases=("ribbon plant",), light="low_to_medium", soils=("standard_potting_mix", "well_draining"), moisture="moderate", drought="low", problems=("yellowing", "root_rot", "scale_insects")),
    plant("Portulaca / Moss Rose", "Portulaca grandiflora", "garden", "easy", "A sun-loving, drought-tolerant annual with colorful blooms.", aliases=("moss rose",), indoor=False, outdoor=True, light="full_sun", soils=("sandy_loam", "well_draining"), moisture="low", drought="high", overwatering="high", problems=("root_rot", "aphids", "powdery_mildew")),
]

assert len(PLANT_CATALOGUE) == 40
assert len({plant["scientific_name"] for plant in PLANT_CATALOGUE}) == 40
