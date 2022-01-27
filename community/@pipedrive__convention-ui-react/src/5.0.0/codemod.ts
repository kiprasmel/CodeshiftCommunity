// import { API, FileInfo, Options } from "jscodeshift";

import { CodeshiftConfig } from "@codeshift/types";

import {
    createCodemodFromComposedTransforms, //
    transformerWithTypesafeConfigs,
} from "@codeshift/reusable-transforms/src/utils/Transformer";

/** begin transforms */

import { replaceJsxAttribute } from "@codeshift/reusable-transforms/src/replace-jsx-attribute";
import { configsToReplaceJsxPropAndItsValue } from "./replace-jsx-attribute.config.cui-specific";

import { renameJsxComponent } from "@codeshift/reusable-transforms/src/rename-jsx-component";
import { configsToRenameJsxComponent } from "./rename-jsx-component.config.cui-specific";

import { addMissingJsxProp } from "@codeshift/reusable-transforms/src/add-missing-jsx-attribute";
import { configsToAddMissingJsxAttribute } from "./add-missing-jsx-attribute.config.cui-specific";

import { renameStyleTokens } from "./transforms/rename-style-tokens";

/** end transforms */

const transformsWithTypesafeConfigs = [
    /**
     * order matters here.
     */
    transformerWithTypesafeConfigs(replaceJsxAttribute, configsToReplaceJsxPropAndItsValue),
    transformerWithTypesafeConfigs(renameJsxComponent, configsToRenameJsxComponent),
    transformerWithTypesafeConfigs(addMissingJsxProp, configsToAddMissingJsxAttribute),
    transformerWithTypesafeConfigs(renameStyleTokens, []),
] as const;

export const CUI4toCUI5 = createCodemodFromComposedTransforms(transformsWithTypesafeConfigs);

export default CUI4toCUI5;

// const preprocess = (paths: string[]) => {
//     console.log("\npre-processing from paths:", paths, "\n");
// };

export const codeshiftConfig: CodeshiftConfig = {
    runner: ({ defaultRunner }) => {
        // preprocess(pathsToModify);

        defaultRunner({
            print: !!process.env.CODEMODS_PRINT,
        });
    },
};
