// This TypeScript wire connects the DOM telemetry to the Python motor ML engine.
// It tracks pointer movements, rage clicks, and missed targets.
// It sends interaction coordinates to the Python backend to determine if a hitbox needs expansion.
// It applies the calculated CSS geometry padding (hitbox expansion) returned by the ML model.
