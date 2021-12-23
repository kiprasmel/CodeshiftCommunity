import { ConfigToRenameJsxComponent } from "@codeshift/reusable-transforms/src/rename-jsx-component";

import { cuiLibraryName } from "./config";

export const configsToRenameJsxComponent: ConfigToRenameJsxComponent[] = [
    {
        importedFrom: cuiLibraryName,
        exportedAs: "Toggle",
        newExportedAs: "Switch",
    },
];
