import { JSCodeshift, ASTPath, JSXIdentifier } from "jscodeshift";
import dedent from "ts-dedent";

import { insertMultilineComment } from "@codeshift/utils";

import {
    ConfigToModifyJSXAttributeAndItsValue,
    ValidJsxPropertyValueAsValue,
    ValidJsxPropertyValueAsValueWithoutExtraHandlers,
} from "./replace-jsx-attribute.config";
import { doNotModifyPropValue } from "./replace-jsx-attribute";

export const deleteProp = Symbol("__codemods__delete-prop");
export const deletePropAndAddWarningThatItsDeleted = Symbol("__codemods__delete-prop-and-add-warning");

export const deletePropByKey = Symbol("__codemods__delete-prop-key");
export const deletePropByKeyAndAddWarningThatItsDeleted = Symbol("__codemods__delete-prop-key-and-add-warning");

export const unsetValue = Symbol("__codemods__unset-value");

/**
 * will return `false` if the prop should be deleted,
 * and `true` if the prop should not be deleted.
 *
 * this is because we cannot negate the `: newValue is string` assertion for typescript,
 * and that assertion is needed to know that the newValue is a string,
 * and not a symbol that marks this prop as deletable.
 *
 * thus, to check if the prop was deleted (and thus probably return early),
 * the check needs to be negated:
 *
 * ```ts
 * if (!deletePropIfApplicable(...)) {
 *   // prop was deleted - exit early:
 *   return;
 * }
 * ```
 *
 */
export function deletePropIfShouldBeDeleted(
    config: ConfigToModifyJSXAttributeAndItsValue,
    j: JSCodeshift,
    path: ASTPath<JSXIdentifier>,
    /**
     * TODO TS - `| null` should be there already so not sure why it's not:
     */
    newValue: Omit<ValidJsxPropertyValueAsValue, typeof doNotModifyPropValue> | null,
    equalsIfShouldBeDeleted:
        | typeof deleteProp //
        | typeof deletePropByKey,
    equalsIfShouldBeDeletedAndCommented:
        | typeof deletePropAndAddWarningThatItsDeleted //
        | typeof deletePropByKeyAndAddWarningThatItsDeleted,
    wasSetToValue: ValidJsxPropertyValueAsValueWithoutExtraHandlers | typeof unsetValue = unsetValue,
): newValue is ValidJsxPropertyValueAsValueWithoutExtraHandlers {
    if (
        newValue === equalsIfShouldBeDeleted || //
        newValue === equalsIfShouldBeDeletedAndCommented
    ) {
        const nameOfEnvVarThatDisablesComments = "CODEMODS_DO_NOT_ADD_INFO_FOR_DELETED_PROP" as const;

        if (
            newValue === equalsIfShouldBeDeletedAndCommented && //
            !process.env[nameOfEnvVarThatDisablesComments]
        ) {
            const wasSetTo =
                (wasSetToValue === unsetValue && wasSetToValue.toString()
                    ? ""
                    : ' (was set to `"' + wasSetToValue?.toString()) + '"`)';

            const comment = dedent`
				INFO removed property ${config.propOld}${wasSetTo}.

				Please verify that everything still works and then delete this comment.

				Additionally, if you don't want these INFO comments
				for deleted properties, you can discard the changes
				and re-run the codemods with an environment variable
				\`${nameOfEnvVarThatDisablesComments}\`
				set to any value.
			`;

            insertMultilineComment(
                j, //
                j(path).closest(j.JSXOpeningElement),
                comment,
            );
        }

        j(path)
            .closest(j.JSXAttribute)
            .remove();

        return false;
    }

    return true;
}
