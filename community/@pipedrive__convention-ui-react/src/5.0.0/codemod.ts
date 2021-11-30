// import { API, FileInfo, Options } from "jscodeshift";

import {
    createCodemodFromComposedTransforms, //
    transformerWithTypesafeConfigs,
} from "@codeshift/reusable-transforms/src/utils/Transformer";

/** begin transforms */

import { addMissingJsxProp } from "@codeshift/reusable-transforms/src/add-missing-jsx-attribute";
import { configsToAddMissingJsxAttribute } from "./add-missing-jsx-attribute.config.cui-specific";

/** end transforms */

const transformsWithTypesafeConfigs = [
    /**
     * order matters here.
     */
    transformerWithTypesafeConfigs(addMissingJsxProp, configsToAddMissingJsxAttribute),
] as const;

export const CUI4toCUI5 = createCodemodFromComposedTransforms(transformsWithTypesafeConfigs);

export default CUI4toCUI5;
