import { API, FileInfo, Options } from "jscodeshift";

import { applyMotions } from "@codeshift/utils";

import { buttonColorToVariant } from "./motions/button-color-to-variant";
import { fontFamilyToBodyFontFamily } from "./motions/font-family-to-body-font-family";

export default function transformer(file: FileInfo, { jscodeshift: j }: API, options: Options) {
    const source = j(file.source);

    /**
     * motions are like small, individual, independent transforms
     * that together form the complete codemod.
     */
    applyMotions(j, source, [
        buttonColorToVariant, //
        fontFamilyToBodyFontFamily,
    ]);

    return source.toSource(options.printOptions);
}
