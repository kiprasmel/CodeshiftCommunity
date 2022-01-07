import fs from "fs";

import nodeDir from "node-dir";
import postcss, { LazyResult } from "postcss";

import mappings from "../../mapping/tokenMapping.json";

const mappingsMerged = {
    ...mappings.css.colors,
    ...mappings.css.elevations,
    ...mappings.css.fonts,
    ...mappings.css.spacings,
} as const;

import { postcssReplaceSimpleVariables } from "./postcss-transform-replace-simple-variables";

/**
 * does not modify the source files,
 * only provides a result that you need to manually handle yourself.
 *
 * see also `runPostcssCodemod`
 *
 */
export function dryRunPostcssCodemod(src: string, filepath: string): LazyResult {
    return postcss([
        //
        postcssReplaceSimpleVariables({ mappings: mappingsMerged as any }),
    ]).process(src, { from: filepath });
}

export function runPostcssCodemod(dir: string) {
    nodeDir.readFiles(
        dir,
        {
            match: /\.(postcss|scss)$/,
            encoding: "utf-8",
        },
        // TODO TS
        // @ts-ignore
        (err, content: string, filename: string, next: () => void): void => {
            if (err) {
                // TODO?
                throw err;
            }

            const result: LazyResult = dryRunPostcssCodemod(content, filename);
            const output: string = result.css;

            /**
             * TODO should it be async? (remember to change `css` vs `content` from the LazyResult)
             */
            fs.writeFileSync(filename, output, { encoding: "utf-8" });

            next();
        },
    );
}
