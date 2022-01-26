import { AcceptedPlugin, Declaration, PluginCreator } from "postcss";

import { CodeshiftConfig } from "@codeshift/types";

import { mappingsMerged } from "./mappings";
import { runPostcssCodemod } from "../../../misc-utils/runPostcssCodemod";

interface PluginOptions {
    mappings: Record<string, string>;
    valueTransform?: (value: string) => string;
}

const postcssReplaceSimpleVariables: PluginCreator<PluginOptions> = (
    { mappings }: PluginOptions = { mappings: mappingsMerged },
) => {
    return {
        postcssPlugin: "postcss-replace-simple-variables",
        Declaration(decl: Declaration) {
            if (decl.value.startsWith("$") && decl.value in mappings) {
                let replacement: string | string[] = mappings[decl.value] as any;

                if (Array.isArray(replacement)) {
                    replacement = replacement[0];
                }

                decl.value = replacement;
            }
        },
    };
};

postcssReplaceSimpleVariables.postcss = true;

export { postcssReplaceSimpleVariables };
export default postcssReplaceSimpleVariables();

export const codeshiftConfig: CodeshiftConfig<AcceptedPlugin> = {
    runner: runPostcssCodemod,
};
