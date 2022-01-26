import mappings from "../../mapping/tokenMapping.json";

export const mappingsMerged = {
    ...mappings.css.colors,
    ...mappings.css.elevations,
    ...mappings.css.fonts,
    ...mappings.css.spacings,
} as const;
