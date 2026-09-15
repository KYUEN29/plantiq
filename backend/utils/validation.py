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
            detail=f"Quantitative prediction is not yet available for {', '.join(unsupported)}. Your assessment has been saved. ML prediction currently supports 10 species."
        )
