import { namedTypes } from "ast-types";

import { ArrayWithAtLeastOneElement } from "../utils/types";

import {
    deleteProp,
    deletePropAndAddWarningThatItsDeleted,
    deletePropByKey,
    deletePropByKeyAndAddWarningThatItsDeleted,
    unsetValue,
} from "./deletePropIfShouldBeDeleted";

import {
    keyToMatchAnyKeyIfUnmatched, //
    doNotModifyAnyPropValues,
    doNotModifyPropValue,
    ContextForCreateNewJsxPropertyValue,
} from "./replace-jsx-attribute";

export const matchValueBooleanTrue = Symbol("__codemods__true");
export const matchValueBooleanFalse = Symbol("__codemods__false");
export const matchValueRegExp = Symbol("__codemods__RegExp");
export const matchValueNull = Symbol("__codemods__null");

/**
 * here we use symbols instead of actual values
 * to allow indexing by them.
 *
 * i.e., if you wanted to match a value that was a `true`, you would have to:
 *
 * instead of doing this:
 *
 * ```ts
 * fromToValueMap: {
 *   [true]: "new value"
 * }
 * ```
 *
 * do this:
 *
 * ```ts
 * formToValueMap: {
 *    [matchValueBooleanTrue]: "new value"
 * }
 * ```
 *
 */
export type ValidJsxPropertyValueAsKey =
    | Exclude<namedTypes.Literal["value"], true | false | RegExp | null>
    | typeof matchValueBooleanTrue
    | typeof matchValueBooleanFalse
    | typeof matchValueRegExp
    | typeof matchValueNull
    | typeof keyToMatchAnyKeyIfUnmatched;

export type ExtraHandlers =
    | typeof doNotModifyPropValue
    | typeof deletePropByKey
    | typeof deletePropByKeyAndAddWarningThatItsDeleted;

/**
 * note - do NOT add a `symbol` type here - we use specific symbols
 * which resolve to `unique symbol` - use their `typeof` instead
 * to not allow specifying invalid symbols whom we don't handle
 */
export type ValidJsxPropertyValueAsValue =
    | namedTypes.Literal["value"]
    | typeof unsetValue
    /**
     * TODO TS - we cannot include `undefined` in the `ValueAsKey`,
     * need to think maybe we should handle it separately
     * and not even continue w/ it (just like w/ other undefined/unhandled behaviors)
     */
    // | undefined
    | ExtraHandlers;

export type ValidJsxPropertyValueAsValueWithoutExtraHandlers = Exclude<ValidJsxPropertyValueAsValue, ExtraHandlers>;

/**
 * TODO RENAME to `getKey` or `getIndexerKey` or `getKeyForConfigValueMatching` or smthn, related to `fromToValueMap`
 *
 * TODO also think about situations where one might want to match any string, or any number
 * (currently unnecessary, but if it were, we'd probably provide a few more matchers e.g. `matchAnyString`)
 *
 * the whole purpose of this is to give a key that can be used to index an object
 * (since some values cannot index, such as `true`, `false`, `null`, `RegExp` etc)
 *
 * also we add a few utility indexers such as `matchAnyValueIfUnmatched`.
 *
 */
export const fromAsValueToAsKey = (
    asValue: ValidJsxPropertyValueAsValueWithoutExtraHandlers | typeof unsetValue,
): ValidJsxPropertyValueAsKey => {
    if (asValue === true) return matchValueBooleanTrue;
    if (asValue === false) return matchValueBooleanFalse;
    if (asValue instanceof RegExp) return matchValueRegExp;
    if (asValue === null) return matchValueNull;

    if (typeof asValue === "number") return asValue;
    if (typeof asValue === "string") return asValue;

    /**
     * TODO MAINTAINER - if adding new values,
     * make sure to handle them above,
     * because this is a catch-all:
     */
    return keyToMatchAnyKeyIfUnmatched;
    // return asValue; // nope
};

export type FromToValueMapModifierFn = (
    ctx: ContextForCreateNewJsxPropertyValue,
) => ValidJsxPropertyValueAsValue | typeof unsetValue;

export type FromToValueMap = {
    [key in ValidJsxPropertyValueAsKey]?:
        | ValidJsxPropertyValueAsValue
        | FromToValueMapModifierFn
        /**
         * otherwise, provide an array of new values.
         *
         * if array contains exactly 1 element:
         *   will replace the value automatically;
         *
         * else, if array contains >1 element:
         *   will replace the value with the 1st one from the array, and
         *   will add a comment, prefixed with "TODO CODEMOD MANUAL INTERVENTION", to make the user verify themselves.
         */
        | ArrayWithAtLeastOneElement<ValidJsxPropertyValueAsValue>;
};

export interface ConfigToModifyJSXAttributeAndItsValue {
    importedFrom: string;
    exportedAs: string;
    propOld: string;
    propNew:
        | string //
        | typeof deleteProp
        | typeof deletePropAndAddWarningThatItsDeleted;
    fromToValueMap:
        | FromToValueMap //
        | typeof doNotModifyAnyPropValues /** only for your information, since `FromToValueMap` already covers this */;
    migrationGuideUrl: string;
}
