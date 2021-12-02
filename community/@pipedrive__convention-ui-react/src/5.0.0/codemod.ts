// import { API, FileInfo, Options } from "jscodeshift";

import {
    createCodemodFromComposedTransforms, //
} from "@codeshift/reusable-transforms/src/utils/Transformer";

/** begin transforms */

/** end transforms */

const transformsWithTypesafeConfigs = [
    /**
     * order matters here.
     */
] as const;

export const CUI4toCUI5 = createCodemodFromComposedTransforms(transformsWithTypesafeConfigs);

export default CUI4toCUI5;
