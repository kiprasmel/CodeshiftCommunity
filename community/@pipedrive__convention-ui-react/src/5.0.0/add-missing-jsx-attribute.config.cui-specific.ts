import { ConfigToAddMissingJsxProp } from "@codeshift/reusable-transforms/src/add-missing-jsx-attribute";

import { cuiLibraryName } from "./config";

export const configsToAddMissingJsxAttribute: ConfigToAddMissingJsxProp[] = [
    {
        importedFrom: cuiLibraryName,
        exportedAs: "EditableText",
        newAttributeName: "showEditIcon",
        newAttributeValue: false,
    },
    {
        importedFrom: cuiLibraryName,
        exportedAs: "Panel",
        newAttributeName: "radius",
        newAttributeValue: "s",
    },
    {
        importedFrom: cuiLibraryName,
        exportedAs: "VideoOverlay",
        newAttributeName: "closeText",
        instructionsOnHowToManuallyAddAttributeBecauseCannotAutomate: "Add translated tooltip text",
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
