import {
    JSCodeshift, //
    Collection,
    ASTPath,
    JSXIdentifier,
} from "jscodeshift";
import { namedTypes } from "ast-types/gen/namedTypes";
import { array } from "nice-comment";
import dedent from "ts-dedent";

import { insertCommentBefore, inlineCommentPrefix, insertMultilineComment } from "@codeshift/utils";

import { never } from "../utils/never";
import { getParsedImports, ParsedImport } from "../utils/getParsedImports";
import {
    deletePropIfShouldBeDeleted, //
    deleteProp,
    deletePropAndAddWarningThatItsDeleted,
    deletePropByKey,
    deletePropByKeyAndAddWarningThatItsDeleted,
    unsetValue,
} from "./deletePropIfShouldBeDeleted";

/**
 * seems to over-complicate things - i'd like to refactor,
 * but atm works just fine.
 *
 * TODO REFACTOR - careful w/ cyclic imports.
 * TODO RENAME `matchAnyValueIfUnmatched`
 */
export const keyToMatchAnyKeyIfUnmatched = Symbol("__codemods__match-all");
export const doNotModifyPropValue = Symbol("__codemods__do-not-modify");

export const doNotModifyAnyPropValues: FromToValueMap = {
    [keyToMatchAnyKeyIfUnmatched]: doNotModifyPropValue,
};

import {
    ConfigToModifyJSXAttributeAndItsValue, //
    fromAsValueToAsKey,
    FromToValueMap,
    ValidJsxPropertyValueAsKey,
    ValidJsxPropertyValueAsValue,
    ValidJsxPropertyValueAsValueWithoutExtraHandlers,
} from "./replace-jsx-attribute.config";
import { Transformer } from "../utils/Transformer";

export interface ContextForCreateNewJsxPropertyValue {
    j: JSCodeshift;
    path: ASTPath<JSXIdentifier>;
    matchedValueAsKey: ValidJsxPropertyValueAsKey;
    matchedValueAsValue: ValidJsxPropertyValueAsValue | typeof unsetValue;
}

export const replaceJsxAttribute: Transformer<ConfigToModifyJSXAttributeAndItsValue> = (
    j, //
    src,
    _fileInfo,
    _api,
    _options,
    config,
) => {
    const allImportsUnfiltered: ParsedImport[] = getParsedImports(j, src); // TODO move out, pre-process

    const imports: ParsedImport[] = allImportsUnfiltered.filter(
        i =>
            i.from === config.importedFrom && //
            !i.isDefaultImport && // TODO might need this
            i.wasExportedAs === config.exportedAs,
    );

    if (!imports?.length) {
        /**
         * jsx element / component not imported - nothing to do here
         */
        return;
    }

    const allowedImportNames: string[] = imports.map(i => i.isImportedAs);

    const propNames: Collection<JSXIdentifier> = src
        .find(
            j.JSXOpeningElement,
            (openingEl: namedTypes.JSXOpeningElement) =>
                j.JSXIdentifier.check(openingEl.name) && allowedImportNames.includes(openingEl.name.name),
        )
        .find(
            j.JSXAttribute,
            (attr: namedTypes.JSXAttribute) => j.JSXIdentifier.check(attr.name) && attr.name.name === config.propOld,
        )
        .find(j.JSXIdentifier);

    propNames.forEach((path): void => {
        /**
         * replace the property name (or delete it):
         */
        if (
            !deletePropIfShouldBeDeleted(
                config, //
                j,
                path,
                config.propNew,
                deleteProp,
                deletePropAndAddWarningThatItsDeleted,
            )
        ) {
            return;
        } else {
            j(path).replaceWith(j.jsxIdentifier(config.propNew));
        }

        /**
         * and now replace the value (if needed).
         */

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const match = findMatchingPropValue(j, path);

        if (!match.matched) {
            return;
        }

        const { matchedValue, setNewValueOrHandleUnsupportedCase } = match;

        let key: ValidJsxPropertyValueAsKey = fromAsValueToAsKey(matchedValue);

        if (!(key in config.fromToValueMap)) {
            if (keyToMatchAnyKeyIfUnmatched in config.fromToValueMap) {
                /**
                 * this check needs to happen even though we might return the
                 * `matchAnyValueIfUnmatched` from the `fromAsValueToAsKey`,
                 *
                 * because some key could be a supported type, e.g. `string`,
                 * and then we return it, but then that specific string __does not__ exist
                 * in the `config.fromToValueMap`, thus it'd end up as unmatched,
                 * even though the config __does indeed have__ the `matchAnyValueIfUnmatched`,
                 * thus we need to handle it here.
                 *
                 * TODO - should we separate `matchAnyValueIfUnmatched` into:
                 * 1. the same name, but
                 * 2. `matchUnhandledValue` for the cases where it's unhandled in the `fromAsValueToAsKey`?
                 *
                 */
                key = keyToMatchAnyKeyIfUnmatched;
            } else {
				const nameOfEnvVarThatDisablesUnexpectedPropertyValueWarning = "CODEMODS_DO_NOT_ADD_POTENTIALLY_NON_IDEMPOTENT_WARNINGS" as const;

				if (process.env[nameOfEnvVarThatDisablesUnexpectedPropertyValueWarning]) {
					return
				}

                const comment = dedent`
					WARNING unexpected property for \`${config.propOld}\` (now \`${config.propNew.toString()}\`):
				
					got: \`"${key.toString()}"\`

					expected one of: ${array(Object.keys(config.fromToValueMap).map(k => k.toString()))}.

					whom map to: ${array(Object.values(config.fromToValueMap).map(val => val?.toString() || ""))}.

					you can disable these warnings
					(especially if you're running the same codemods more than once)
					by discarding the changes, setting the environment variable
					\`${nameOfEnvVarThatDisablesUnexpectedPropertyValueWarning}\`
					to any value and re-running the codemods.
				`;

                insertMultilineComment(j, j(path), comment);

                return;
            }
        }

        let newValues: FromToValueMap[keyof FromToValueMap] = config.fromToValueMap[key];

        if (newValues === undefined) {
            /**
             * already verified previously
             */
            return never();
        }

        if (newValues instanceof Function) {
            /**
             * note! can and most likely will cause side effects,
             * such as changing the AST, modifying/removing/addding some nodes, etc.
             */
            newValues = newValues({
                j, //
                path,
                matchedValueAsValue: matchedValue,
                matchedValueAsKey: key,
            });
        }

        if (!Array.isArray(newValues)) {
            newValues = [newValues];
        }

        const newValue = newValues[0];

        if (newValue === doNotModifyPropValue) {
            return;
        }

        if (
            !deletePropIfShouldBeDeleted(
                config, //
                j,
                path,
                newValue,
                deletePropByKey,
                deletePropByKeyAndAddWarningThatItsDeleted,
                matchedValue,
            )
        ) {
            return;
        }

        /**
         * replace the actual value of the attribute (if implemented)
         */
        if (!setNewValueOrHandleUnsupportedCase(newValue)) {
            return;
        }

        /**
         * if we need manual intervention from the user,
         * we'll create a comment right next to the code
         */
        const needsManualIntervention: boolean = newValues.length > 1;

        if (!needsManualIntervention) {
            /**
             * it just works.
             */
            return;
        }

        /**
         * TODO - handle if 0 choices available (handled in TS atm, but if reading from config in other places?)
         */
        const comment = dedent`
            MANUAL INTERVENTION - there is no clear 1:1 mapping (multiple choices available).

            We are:
        	 - only providing an estimate fitting value, or
             - completely removing the attribute, or
             - not changing the attribute at all,

            but you are expected to verify it yourself.

            Read the Migration Guide to learn how:
            ${config.migrationGuideUrl}
		`

        /**
         * TODO: insertCommentAfter
         */
        insertMultilineComment(j, j(path), comment);
    });

    return;
};

/**
 * TODO FIXME
 *
 * this whole thing only accounts for the current attribute,
 * and not how it'll look after the update.
 *
 * will have to re-think this.
 *
 * ---
 *
 * Maybe we don't even have to worry about this too much,
 * since we're already checking if the property keys are provided
 * in the `fromToValueMap`,
 *
 * thus if the value is is incorrect e.g. an object instead of a string,
 * it's already covered.
 *
 * The remaining issue seems to be dealing w/ `JSXExpressionContainer`s:
 * both 1. extracting values from them, and 2. setting new values to them.
 *
 * for 2., it's tricky because some values must be inside ExprContainers
 * (true / false / null / etc), but the value we are changing __from__
 * is __not__ inside an ExprContainer, thus we need to handle it manually.
 *
 * This, however, is already way simpler to solve than the whole thing
 * I initially imagined w/ this `findMatchingPropValue` thingie.
 *
 */
function findMatchingPropValue(j: JSCodeshift, path: ASTPath<JSXIdentifier>) {
    interface Matched {
        matched: true;
        matchedValue: ValidJsxPropertyValueAsValueWithoutExtraHandlers | typeof unsetValue;
        /**
         * if setting new value is unsupported, will return false,
         * and in that case you're expected to stop further steps (return/continue/exit to skip the current path)
         */
        setNewValueOrHandleUnsupportedCase: (newValue: any) => boolean;
    }

    interface Unmatched {
        matched: false;
        matchedValue: typeof unsetValue;
        setNewValue: typeof unsetValue;
    }

    const unmatched: Unmatched = {
        matched: false,
        matchedValue: unsetValue,
        setNewValue: unsetValue,
    } as const;

    type Match = Unmatched | Matched;

    let match: Match;

    j(path)
        .closest(j.JSXAttribute)
        .at(0)
        .forEach(
            /**
             * return a Match to verify type safety
             * (to make sure all paths return a value, even tho we don't use the _returned_ value)
             */
            (path): Match => {
                const { node } = path;
                node.value;

                if (j.JSXExpressionContainer.check(node.value)) {
                    if (j.JSXEmptyExpression.check(node.value.expression)) {
                        // TODO VERIFY
                        match = {
                            matched: true, // TODO
                            matchedValue: unsetValue,
                            setNewValueOrHandleUnsupportedCase: () => {
                                /**
                                 * do nothing (cannot change an empty value)
                                 * TODO - add an inline comment here?
                                 *
                                 * TODO - actually do nothing & handle it when assigning (new symbol?)
                                 * -> nah, abstract into function & return object w/ booleans etc
                                 */
                                insertCommentBefore(
                                    j,
                                    j(path),
                                    `UNSUPPORTED (JSXEmptyExpression)`,
                                    inlineCommentPrefix.trim(),
                                );

                                return false;
                            },
                        };

                        return match;
                    } else {
                        /**
                         * ExpressionKind, inside JSXExpressionContainer
                         *
                         * TODO oh fuck there's like 30 different types in the union...
                         */
                        node.value.expression;

                        if (j.Literal.check(node.value.expression)) {
                            match = {
                                matched: true,
                                matchedValue: node.value.expression.value,
                                setNewValueOrHandleUnsupportedCase: (newValue: typeof node.value.expression.value) => {
                                    if (!j.JSXExpressionContainer.check(node.value)) return never();
                                    if (j.JSXEmptyExpression.check(node.value.expression)) return never();
                                    if (!j.Literal.check(node.value.expression)) return never();

                                    node.value.expression.value = newValue;

                                    return true;
                                },
                            };

                            return match;
                        }
                        /**
                         * TODO FIXME
                         */
                        // } else if () {
                        // } else if () {
                        // } else if () {
                        else {
                            /**
                             * TODO FIXME - lazy value access and only add comment & exit then
                             */

                            // TODO VERIFY
                            match = {
                                matched: true,
                                matchedValue: unsetValue, // TODO
                                setNewValueOrHandleUnsupportedCase: () => {
                                    insertMultilineComment(
                                        j,
                                        // j(path).closest(j.JSXOpeningElement),
                                        j(path), // TODO FIXME - what if the `path` gets removed?
										dedent`
                                            UNSUPPORTED (JSXExpressionContainer.ExpressionKind).

                                            If you have a valid use case (or aren't sure), create a feature request.
										`
                                    );
                                    return false;
                                },
                            };

                            // let matchVal;

                            // const expr = node.value?.expression

                            // if (j.Identifier.check(expr)) matchVal = expr.name;
                            // if (j.FunctionExpression.check(expr)) matchVal = expr.id
                            // if (j.Identifier.check(expr)) matchVal = expr.name;
                            // if (j.Identifier.check(expr)) matchVal = expr.name;
                            // if (j.Identifier.check(expr)) matchVal = expr.name;

                            // // TODO VERIFY
                            // match = {
                            // 	matched: true,
                            // 	matchedValue: matchVal
                            // }

                            return match;
                        }
                    }
                } else if (j.JSXElement.check(node.value)) {
                    // TODO VERIFY
                    match = {
                        matched: true,
                        matchedValue: unsetValue, // TODO
                        setNewValueOrHandleUnsupportedCase: () => {
                            insertCommentBefore(j, j(path), `UNSUPPORTED (JSXElement)`, inlineCommentPrefix.trim());

                            return false;
                        },
                    };

                    return match;
                } else if (j.JSXFragment.check(node.value)) {
                    // TODO VERIFY
                    match = {
                        matched: true,
                        matchedValue: unsetValue, // TODO
                        setNewValueOrHandleUnsupportedCase: () => {
                            insertCommentBefore(j, j(path), `UNSUPPORTED (JSXFragment)`, inlineCommentPrefix.trim());

                            return false;
                        },
                    };

                    return match;
                } else if (node.value === null || node.value === undefined) {
                    /**
                     * this is bad. mind that the actual value is `node.value.value`,
                     * and this (`node.value`) is only the container.
                     *
                     * not sure what to do here.
                     */

                    // TODO VERIFY
                    match = {
                        matched: true,
                        matchedValue: unsetValue, // TODO
                        setNewValueOrHandleUnsupportedCase: () => {
                            insertMultilineComment(
                                j,
                                j(path),
                                `ERROR - undefined behavior. Please create a bug report.`,
                            );

                            return false;
                        },
                    };

                    return match;
                } else {
                    // TODO
                    /**
                     * LiteralKind
                     */

                    if (node.value.value === undefined || node.value.value === null /** TODO VERIFY / FIXME */) {
                        /**
                         * TODO - maybe we could support this?
                         * thought i'm not even sure if this scenario can ever happen...
                         */

                        // TODO VERIFY
                        match = {
                            matched: true,
                            matchedValue: unsetValue, // TODO
                            setNewValueOrHandleUnsupportedCase: () => {
                                insertCommentBefore(
                                    j,
                                    j(path),
                                    `UNSUPPORTED (LiteralKind) with value \`undefined\``,
                                    inlineCommentPrefix.trim(),
                                );

                                return false;
                            },
                        };

                        return match;
                    }

                    match = {
                        matched: true,
                        matchedValue: node.value.value,
                        setNewValueOrHandleUnsupportedCase: (newValue: typeof node.value.value) => {
                            j(path).replaceWith(({ node: n }) => {
                                n.value =
                                    typeof newValue === "string"
                                        ? j.literal(newValue)
                                        : j.jsxExpressionContainer(j.literal(newValue));

                                return n;
                            });

                            return true;
                        },
                    };

                    return match;
                }
            },
        );

    /**
     * typescript pls.
     *
     * this is done to avoid the TS error which
     * shouldn't be there in the first place.
     *
     * (value used before assigned)
     *
     * I also tried setting the `match` to a default value of `unmatched`,
     * but then, somehow, after the `if` check below,
     * the type of `match` becomes `never`. :shrug:
     *
     */
    match ??= unmatched; // TODO ESLINT

    return match;
}
