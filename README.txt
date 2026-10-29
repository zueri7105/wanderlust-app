WanderLust route accuracy patch

Copy src/utils/geocode.ts and src/components/TripRouteMap.tsx into the corresponding paths in your EXISTING restored wanderlust-app repository. Do not create another repository.

Changes: versioned geocode cache, avoid city gazetteer for named facilities, multi-result Nominatim ranking, basic place-type and name checks, context-distance ranking, and strict location override handling.

LIMITATIONS: Not yet build-tested against complete project dependencies. Worldwide accuracy cannot be guaranteed. Public OSM API usage policies apply.
