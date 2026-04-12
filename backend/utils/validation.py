from fastapi import HTTPException

SUPPORTED_PLANTS = {
    'Money Plant', 'Snake Plant', 'Tulsi', 'Monstera', 
    'Aloe Vera', 'Peace Lily', 'Spider Plant', 
    'Areca Palm', 'Fern', 'Jade Plant'
}

def validate_supported_plants(plants):
    unsupported = []
    for p in plants:
        if p.name not in SUPPORTED_PLANTS:
            unsupported.append(p.name)
            
    if unsupported:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported plant(s) detected: {', '.join(unsupported)}. Only the official 10 curated indoor plants are supported."
        )
