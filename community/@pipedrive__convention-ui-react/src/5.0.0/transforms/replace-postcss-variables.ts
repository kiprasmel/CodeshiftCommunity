import postcss from "postcss";

import * as colors from "./postcss-replace-simple-variables/test-mappings/colors.json";
import * as fonts from "./postcss-replace-simple-variables/test-mappings/fonts.json";
import * as spacings from "./postcss-replace-simple-variables/test-mappings/spacings.json";

import replaceSimpleVariables from "./postcss-replace-simple-variables";

export function replacePostcssVariables(src: string, filepath: string) {
    const mappings = Object.assign({}, colors, fonts, spacings);

    return postcss([replaceSimpleVariables({ mappings })])
        .process(src, { from: filepath })
        .then(result => {
            console.log(result.css);
            // fs.writeFile...
        });
}
