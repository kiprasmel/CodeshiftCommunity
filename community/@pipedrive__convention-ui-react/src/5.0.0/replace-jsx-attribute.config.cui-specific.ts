import { Collection, JSXAttribute } from "jscodeshift";

import {
    ConfigToModifyJSXAttributeAndItsValue,
    deletePropByKeyAndAddWarningThatItsDeleted,
    doNotModifyAnyPropValues,
    doNotModifyPropValue,
    keyToMatchAnyKeyIfUnmatched,
    unsetValue,
} from "@codeshift/reusable-transforms/src/replace-jsx-attribute";

import { never } from "@codeshift/reusable-transforms/src/utils/never";

import { cuiLibraryName } from "./config";

import { findJsxAttribute } from "../misc-utils/findJsxAttribute";

/**
 * the general one.
 * note that if you wanted to,
 * you could provide individual URLs to each config.
 */
const migrationGuideUrl = "https://cui.pipedrive.tools/v5/?path=/docs/documentation-migrating-from-cui4" as const;

export const buttonConfig: ConfigToModifyJSXAttributeAndItsValue = {
    migrationGuideUrl: migrationGuideUrl,
    importedFrom: cuiLibraryName,
    exportedAs: "Button",
    propOld: "color",
    propNew: "variant",
    fromToValueMap: {
        // TODO - what to do with non-existing -> secondary (default value) - nothing?
        green: "primary",
        red: "negative",
        ghost: "ghost",
        "ghost-alternative": "ghost-alternative",
        blue: deletePropByKeyAndAddWarningThatItsDeleted,
    },
    /**
     * TODO SEPARATE TRANSFORM
     * > Created new component <IconButton /> for buttons that only have an icon.
     */
};

/**
 * as per the migration guide (see ../config.ts # migrationGuide)
 */
export const configsToReplaceJsxPropAndItsValue: ConfigToModifyJSXAttributeAndItsValue[] = [
    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "Avatar",
        propOld: "size",
        propNew: "size",
        fromToValueMap: {
            xl: "l",
            l: "m",
            s: "s",
            xs: "xs",
        },
    },
    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "Badge",
        propOld: "color",
        propNew: "variant",
        fromToValueMap: {
            green: "positive",
            blue: "info",
            yellow: "warning",
            red: "negative",
            purple: "learn",
            white: "inverted",
            "tier-silver": deletePropByKeyAndAddWarningThatItsDeleted,
            "tier-gold": deletePropByKeyAndAddWarningThatItsDeleted,
            "tier-platinum": deletePropByKeyAndAddWarningThatItsDeleted,
            "tier-diamond": deletePropByKeyAndAddWarningThatItsDeleted,
        },
    },
    buttonConfig,
    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "Checkbox",
        propOld: "type",
        propNew: "type",
        fromToValueMap: {
            round: "mark as done",
        },
    },
    // Dialog - nothing?
    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "EditableText",
        propOld: "icon",
        propNew: "showEditIcon",
        fromToValueMap: {
            [keyToMatchAnyKeyIfUnmatched]: true, // replace any value with `true`
            /**
             * (none) -> add-missing-jsx-attribute
             */
        },
    },
    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "EditableText",
        propOld: "onChange",
        propNew: "onBlur",
        fromToValueMap: doNotModifyAnyPropValues,
    },
    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "EditableText",
        propOld: "tooltipProps",
        // propNew: deletePropAndAddWarningThatItsDeleted,
        propNew: "tooltipProps",
        fromToValueMap: {
            [keyToMatchAnyKeyIfUnmatched]: deletePropByKeyAndAddWarningThatItsDeleted,
        },
    },
    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "Form",
        propOld: "error",
        propNew: "error",
        fromToValueMap: {
            [keyToMatchAnyKeyIfUnmatched]: ({ j, path }) => {
                /**
                 * TODO SEPARATE TRANSFORM (or smthn similar like deleteProp?)
                 * for extracting a key from an object and setting it as the new value of the prop
                 *
                 * or maybe not since this is so individual -- don't know (((yet))).
                 *
                 */

                const errorAttribute: Collection<JSXAttribute> | null = findJsxAttribute(
                    "error",
                    j,
                    j(path).closest(j.JSXOpeningElement),
                );

                if (errorAttribute === null) {
                    return doNotModifyPropValue;
                }

                const extractedValue: string | boolean | typeof unsetValue = errorAttribute
                    .find(j.JSXExpressionContainer)
                    .find(j.ObjectExpression)
                    .find(j.Property)
                    .nodes()
                    .reduce(
                        (newValTemp: typeof extractedValue, prop) =>
                            j.Property.check(prop) &&
                            j.Identifier.check(prop.key) &&
                            ["isError", "text"].includes(prop.key.name) &&
                            j.Literal.check(prop.value)
                                ? ({
                                      isError: newValTemp === unsetValue ? prop.value.value : newValTemp,
                                      text: typeof prop.value.value === "string" ? prop.value.value : newValTemp,
                                  }[prop.key.name] as typeof newValTemp)
                                : unsetValue,
                        unsetValue,
                    );

                if (extractedValue === unsetValue) {
                    return doNotModifyPropValue;
                }

                const type = typeof extractedValue;

                if (!(type === "string" || type === "boolean")) {
                    return never();
                }

                errorAttribute.replaceWith(({ node }) => {
                    node.value = {
                        boolean: j.jsxExpressionContainer(j.literal(extractedValue)),
                        string: j.literal(extractedValue),
                    }[type];

                    return node;
                });

                return doNotModifyPropValue;
            },
        },
    },
    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "Icon",
        propOld: "color",
        propNew: "color",
        fromToValueMap: {
            black: "primary",
            white: "primary-inverted",
            "black-64": "secondary",
            // TODO what to do with non-existing -> secondary-inverted?
            "black-32": "muted",
            // TODO muted-inverted?
            blue: "active",
            // TODO link, link-inverted, info?
            green: "positive",
            red: "negative",
            yellow: "warning",
            purple: "learn",
            "black-88": deletePropByKeyAndAddWarningThatItsDeleted,
            "black-24": deletePropByKeyAndAddWarningThatItsDeleted,
            "black-12": deletePropByKeyAndAddWarningThatItsDeleted,
            "black-8": deletePropByKeyAndAddWarningThatItsDeleted,
            "black-4": deletePropByKeyAndAddWarningThatItsDeleted,
            "red-shade": deletePropByKeyAndAddWarningThatItsDeleted,
            "red-tint": deletePropByKeyAndAddWarningThatItsDeleted,
            "green-shade": deletePropByKeyAndAddWarningThatItsDeleted,
            "green-tint": deletePropByKeyAndAddWarningThatItsDeleted,
            "blue-shade": deletePropByKeyAndAddWarningThatItsDeleted,
            "blue-tint": deletePropByKeyAndAddWarningThatItsDeleted,
            "yellow-tint": deletePropByKeyAndAddWarningThatItsDeleted,
        },
    },
    ...["Input", "Textarea"]
        .map(
            exportedAs =>
                <ConfigToModifyJSXAttributeAndItsValue[]>[
                    {
                        migrationGuideUrl: migrationGuideUrl,
                        importedFrom: cuiLibraryName,
                        exportedAs: exportedAs,
                        propOld: "color",
                        propNew: "error",
                        fromToValueMap: {
                            /**
                             * https://cui.pipedrive.tools/v4/?path=/docs/3-components-input--default#props
                             */
                            red: true,
                        },
                    },
                    {
                        /**
                         * depends on the previous one
                         */
                        migrationGuideUrl: migrationGuideUrl,
                        importedFrom: cuiLibraryName,
                        exportedAs: exportedAs,
                        propOld: "message" as const,
                        propNew: "message" as const, // do not modify here - we modify ourselves below:
                        fromToValueMap: {
                            /**
                             * https://cui.pipedrive.tools/v4/?path=/docs/3-components-input--default#props
                             */
                            [keyToMatchAnyKeyIfUnmatched]: ({ j, path }) => {
                                /**
                                 * first, find and remove existing error attributes (if any)
                                 * (renamed from the `color` attribute via the previous config)
                                 */
                                const existingErrorAttrs = j(path)
                                    .closest(j.JSXOpeningElement) //
                                    .find(j.JSXAttribute, { name: { name: "error" } });

                                existingErrorAttrs.forEach(p => j(p).remove());

                                /**
                                 * depending if there were any error attributes already
                                 * (which were previously `color` attributes until we
                                 * renamed them with the previous config),
                                 *
                                 * we'll either convert the `message` prop to:
                                 * a) `error`, if `color` attribute existed previously;
                                 * b) `helper`, if `color` attribute did not exist.
                                 *
                                 * then, become the error attribute ourselves (rename)
                                 */
                                path.node.name = existingErrorAttrs.length ? "error" : "helper";

                                return doNotModifyPropValue;
                            },
                        },
                    },
                ],
        )
        .flat(),
    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "Input",
        propOld: "iconPosition",
        propNew: "iconPosition",
        fromToValueMap: {
            [keyToMatchAnyKeyIfUnmatched]: deletePropByKeyAndAddWarningThatItsDeleted,
        },
    },
    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "Message",
        propOld: "color",
        propNew: "variant",
        fromToValueMap: {
            default: "info",
            green: "positive",
            yellow: "warning",
            red: "negative",
        },
    },
    ...["Panel"]
        .map((exportedAs): ConfigToModifyJSXAttributeAndItsValue[] => [
            {
                migrationGuideUrl: migrationGuideUrl,
                importedFrom: cuiLibraryName,
                exportedAs,
                propOld: "color",
                propNew: "variant",
                fromToValueMap: {
                    blue: "info",
                    green: "positive",
                    red: "negative",
                    yellow: "warning",
                    "note-yellow": "note",
                    black: "inverted",
                },
            },
            {
                migrationGuideUrl: migrationGuideUrl,
                importedFrom: cuiLibraryName,
                exportedAs,
                propOld: "elevation",
                propNew: "elevation",
                fromToValueMap: {
                    "01": "raised",
                    "02": "raised-hover",
                    "03": "floating",
                    "08": "floating-high",
                    "16": "overlay",
                    "24": "overlay-high",
                },
            },
            {
                migrationGuideUrl: migrationGuideUrl,
                importedFrom: cuiLibraryName,
                exportedAs,
                propOld: "radius",
                propNew: "radius",
                fromToValueMap: {
                    /**
                     * `none` is a new value that didn't exist before, so nothing to do here for it
                     */
                    s: doNotModifyPropValue,
                    /**
                     * (none) -> add-missing-jsx-attribute
                     */
                    m: doNotModifyPropValue,
                    l: doNotModifyPropValue,
                    xl: "l",
                },
            },
        ])
        .flat(),
    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "Pill",
        propOld: "color",
        propNew: "variant",
        fromToValueMap: {
            blue: "info",
            green: "positive",
            yellow: "warning",
            red: "negative",
            purple: "learn",
            white: "inverted",
            /**
             * (none) -> add-missing-jsx-attribute
             */
        },
    },
    /**
     * TODO Pill - sub-components?
     * see https://pipedrive.slack.com/archives/C02HVJZDBT2/p1636752330171900
     */

    /**
     * TODO Pill - (default) size prop
     * see again https://pipedrive.slack.com/archives/C02HVJZDBT2/p1636763770174100
     */

    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "Popover",
        propOld: "arrow",
        propNew: "arrow",
        fromToValueMap: {
            [keyToMatchAnyKeyIfUnmatched]: deletePropByKeyAndAddWarningThatItsDeleted,
        },
    },
    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "Progressbar",
        propOld: "color",
        propNew: "variant",
        fromToValueMap: {
            red: "negative",
            green: "positive",
            blue: "info",
            yellow: "warning",
            purple: "learn",
            /**
             * (none) -> add-missing-jsx-attribute
             */
        },
    },
    {
        migrationGuideUrl: migrationGuideUrl,

        importedFrom: cuiLibraryName,
        exportedAs: "Progressbar",
        propOld: "noBackground",
        propNew: "noBackground",
        fromToValueMap: {
            [keyToMatchAnyKeyIfUnmatched]: deletePropByKeyAndAddWarningThatItsDeleted,
        },
    },
    ...["Select", "Tag"]
        .map(
            exportedAs =>
                <ConfigToModifyJSXAttributeAndItsValue>{
                    migrationGuideUrl: migrationGuideUrl,
                    importedFrom: cuiLibraryName,
                    exportedAs: exportedAs,
                    propOld: "color",
                    propNew: "hasError",
                    fromToValueMap: {
                        red: true,
                        /**
                         * (none) -> add-missing-jsx-attribute
                         */
                    },
                },
        )
        .flat(),

    /**
     * TODO Separator (or not)
     * https://pipedrive.slack.com/archives/C02HVJZDBT2/p1636764829179100
     */

    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "Tabs",
        propOld: "placement",
        propNew: "placement",
        fromToValueMap: {
            [keyToMatchAnyKeyIfUnmatched]: deletePropByKeyAndAddWarningThatItsDeleted,
        },
    },

    // Tag - previously w/ Select

    // Textarea - previously w/ Input

    /**
     * Toggle - separate transform: rename-jsx-component
     */

    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "UserChip",
        propOld: "type",
        propNew: "variant",
        fromToValueMap: {
            you: "user",
            other: "other",
            deactivated: "deactivated",
            hidden: "hidden",
            "no-permission": deletePropByKeyAndAddWarningThatItsDeleted,
        },
    },

    /**
     * TODO VideoOverlay (or not)
     */

    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "VideoThumbnail",
        propOld: "noPlayButton",
        propNew: "noPlayButton",
        fromToValueMap: {
            [keyToMatchAnyKeyIfUnmatched]: deletePropByKeyAndAddWarningThatItsDeleted,
        },
    },

    {
        migrationGuideUrl: migrationGuideUrl,
        importedFrom: cuiLibraryName,
        exportedAs: "InlineInfo",
        propOld: "linkUrl" as const,
        propNew: "linkUrl" as const, // do not modify here - we'll instead create side effects below
        fromToValueMap: {
            /**
             * https://cui.pipedrive.tools/v4/?path=/docs/3-components-input--default#props
             */
            [keyToMatchAnyKeyIfUnmatched]: ({ j, path }) => {
                /**
                 * if the prop `linkUrl` existed,
                 * this function will be called
                 * because we match any value.
                 *
                 * thus, now, we can add the attribute "linkTitle" (if it's missing).
                 */

                const parent = j(path)
                    .closest(j.JSXOpeningElement)
                    .at(0);

                const alreadyExists: boolean = !!parent.find(j.JSXAttribute, { name: { name: "linkTitle" } }).length; //

                if (alreadyExists) {
                    return doNotModifyPropValue;
                }

                const node = parent.at(0).nodes()[0];

                if (!node?.attributes) node.attributes = [];

                node.attributes.push(
                    j.jsxAttribute(
                        j.jsxIdentifier("linkTitle"), //
                        j.literal("Learn more"),
                    ),
                );

                return doNotModifyPropValue;
            },
        },
    },
];
