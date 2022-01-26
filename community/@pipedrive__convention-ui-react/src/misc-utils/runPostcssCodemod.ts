import fs from "fs";

import nodeDir from "node-dir";
import postcss, { AcceptedPlugin, LazyResult } from "postcss";
import postcssScss from "postcss-scss";
import { GroupBy, groupBy } from "based-groupby";
import chalk from "chalk";

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

export type PostcssCodemodResult = {
    filepath: string;
} & (
    | {
          outcome: "error";
          error: unknown;
      }
    | {
          outcome: "unmodified";
      }
    | {
          outcome: "ok";
      }
);
export type PostcssCodemodOutcome = PostcssCodemodResult["outcome"];

export const runPostcssCodemod: CustomRunner<
    AcceptedPlugin, //
    Promise<GroupBy<PostcssCodemodResult, "outcome">>
> = async ({
    pathsToModify, //
    transformInsideFileThatSpecifiesCodeshiftConfig,
}) => {
    const results: PostcssCodemodResult[] = [];

    await new Promise<void>(resolve => {
        pathsToModify.forEach(path =>
            nodeDir.readFiles(
                path,
                {
                    match: /\.(postcss|scss)$/,
                    encoding: "utf-8",
                },
                // TODO TS
                // @ts-ignore
                (err, content: string, filepath: string, next: () => void): void => {
                    if (err) {
                        results.push({
                            filepath,
                            outcome: "error",
                            error: err,
                        });

                        next();
                    }

                    const result: LazyResult = dryRunPostcssCodemod(content, filepath, [
                        transformInsideFileThatSpecifiesCodeshiftConfig,
                    ]);
                    const output: string = result.css;

                    /**
                     * TODO should it be async? (remember to change `css` vs `content` from the LazyResult)
                     */
                    fs.writeFileSync(filepath, output, { encoding: "utf-8" });

                    if (output === content) {
                        results.push({
                            filepath,
                            outcome: "unmodified",
                        });
                    } else {
                        results.push({
                            filepath,
                            outcome: "ok",
                        });
                    }

                    next();
                },
                () => resolve(),
            ),
        );
    });

    const resultsGrouped: GroupBy<PostcssCodemodResult, "outcome"> = groupBy(results, "outcome", {
        giveEmptyArraysForUnreachedGroups: ["error", "unmodified", "ok"],
    });

    if (resultsGrouped.error.length) {
        console.error("PostCSS codemod errors:");
        [...new Set(resultsGrouped.error)].forEach((err, i) => console.error(i + 1, err));
    }

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    logPostcssCodemodResults(resultsGrouped);

    return resultsGrouped;
};

const consoleStylesForOutcomes: { [key in PostcssCodemodOutcome]: (msg: string) => string } = {
    error: msg => chalk.red(msg),
    unmodified: msg => chalk.rgb(255, 135, 0)(msg),
    ok: msg => chalk.green(msg),
};

export function logPostcssCodemodResults(resultsGrouped: GroupBy<PostcssCodemodResult, "outcome">): void {
    console.log("");

    console.log("PostCSS codemod done.");
    console.log("Results:");

    Object.entries(resultsGrouped).map(([group, values]) => {
        const msg = values.length + " " + group;
        const colorize = consoleStylesForOutcomes[group as PostcssCodemodOutcome];

        console.log(colorize(msg));
    });

    console.log("");
}
