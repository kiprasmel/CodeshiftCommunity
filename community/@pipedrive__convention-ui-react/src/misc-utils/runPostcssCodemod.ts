import fs from "fs";

import nodeDir from "node-dir";
import postcss, { AcceptedPlugin, LazyResult } from "postcss";
import postcssScss from "postcss-scss";

import { CustomRunner } from "@codeshift/types";

/**
 * does not modify the source files,
 * only provides a result that you need to manually handle yourself.
 *
 * see also `runPostcssCodemod`
 *
 */
export function dryRunPostcssCodemod(src: string, filepath: string, plugins: AcceptedPlugin[]): LazyResult {
    return postcss(plugins) //
        .process(src, { from: filepath, syntax: postcssScss });
}

export const runPostcssCodemod: CustomRunner<AcceptedPlugin> = ({
    pathsToModify, //
    transformInsideFileThatSpecifiesCodeshiftConfig,
}) => {
    console.log({ pathsToModify, transformInsideFileThatSpecifiesCodeshiftConfig });

    pathsToModify.forEach(path =>
        nodeDir.readFiles(
            path,
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

                const result: LazyResult = dryRunPostcssCodemod(content, filename, [
                    transformInsideFileThatSpecifiesCodeshiftConfig,
                ]);
                const output: string = result.css;

                /**
                 * TODO should it be async? (remember to change `css` vs `content` from the LazyResult)
                 */
                fs.writeFileSync(filename, output, { encoding: "utf-8" });

                next();
            },
        ),
    );
};
