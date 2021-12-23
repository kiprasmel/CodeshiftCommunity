import postcss from "postcss";

import mappings from "../mapping/tokenMapping.json";

const mappingsMerged = {
    ...mappings.css.colors,
    ...mappings.css.elevations,
    ...mappings.css.fonts,
    ...mappings.css.spacings,
} as const;

import replaceSimpleVariables from "./postcss-replace-simple-variables";

export function replacePostcssVariables(src: string, filepath: string) {
    return postcss([replaceSimpleVariables({ mappings: mappingsMerged as any })])
        .process(src, { from: filepath })
        .then(result => {
            console.log(result.css);
            // fs.writeFile...
        });
}
