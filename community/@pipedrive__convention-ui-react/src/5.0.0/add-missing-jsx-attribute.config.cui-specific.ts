import { cuiLibraryName } from "./config";

import { ConfigToAddMissingJsxProp } from "@codeshift/reusable-transforms/src/add-missing-jsx-attribute";

export const configsToAddMissingJsxAttribute: ConfigToAddMissingJsxProp[] = [
    {
        importedFrom: cuiLibraryName,
        exportedAs: "EditableText",
        newAttributeName: "showEditIcon",
        newAttributeValue: false,
    },
    ...["Select", "Tag"].map(exportedAs => ({
        importedFrom: cuiLibraryName,
        exportedAs: exportedAs,
        newAttributeName: "hasError",
        newAttributeValue: false,
    })),
    {
        importedFrom: cuiLibraryName,
        exportedAs: "Panel",
        newAttributeName: "radius",
        newAttributeValue: "s",
    },

    /**
     * TODO REVIEWER - confirm we do NOT need these:
     */

    // {
    //     importedFrom: cuiLibraryName,
    //     exportedAs: "Pill",
    //     newAttributeName: "variant",
    //     newAttributeValue: "default",
    // },
    // {
    //     importedFrom: cuiLibraryName,
    //     exportedAs: "Progressbar",
    //     newAttributeName: "variant",
    //     newAttributeValue: "neutral",
    // },
];
