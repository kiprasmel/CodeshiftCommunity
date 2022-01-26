import { Plugin, Processor } from "postcss";

import { CodeshiftConfig } from "@codeshift/types";

import { runPostcssCodemod } from "../misc-utils/runPostcssCodemod";

import { postcssReplaceSimpleVariables } from "./transforms/postcss-replace-simple-variables/postcss-replace-simple-variables";

type DefaultExport = (Plugin | Processor)[];

const transforms: DefaultExport = [
    postcssReplaceSimpleVariables(), //
];
export default transforms;

export const codeshiftConfig: CodeshiftConfig<DefaultExport> = {
    runner: runPostcssCodemod,
};
