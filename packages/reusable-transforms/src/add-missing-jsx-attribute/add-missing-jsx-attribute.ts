import { ASTPath, JSCodeshift, JSXOpeningElement } from "jscodeshift";
import dedent from "ts-dedent";

import { insertMultilineComment } from "@codeshift/utils";

import { getParsedImports } from "../utils/getParsedImports";
import { Transformer } from "../utils/Transformer";
import { assertNever } from "../utils/never";

/**
 * given your component is used like this:
 *
 * ```ts
 * import { Button              } from "@pipedrive/convention-ui-react";
 * import { Button as CUIButton } from "@pipedrive/convention-ui-react"; // same, irrelevant how it's destructured
 * ```
 *
 * the config should look like this:
 *
 * ```ts
 * {
 *   importedFrom: "@pipedrive/convention-ui-react",
 *   exportedAs: "Button",
 *   newAttributeName: "size",
 *   newAttributeValue: "xs"
 * }
 * ```
 *
 * or like this:
 *
 * ```ts
 * {
 *   importedFrom: "@pipedrive/convention-ui-react",
 *   exportedAs: "Button",
 *   newAttributeName: "size",
 *   newAttributeValue: ({ j, path }) => {
 *     <some custom logic, potentially side effects to other nodes>
 *
 *     return "sm";
 *   }
 * }
 * ```
 *
 * NB! neither default imports nor import namespaces (import * as foo)
 * are not supported, though could be implemented.
 *
 * for more examples, see references, e.g.:
 * - community/@pipedrive__convention-ui-react/src/5.0.0/add-missing-jsx-attribute.config.cui-specific.ts
 *
 */
export type ConfigToAddMissingJsxProp = {
    importedFrom: string;
    exportedAs: string;
    newAttributeName: string;
} & (
    | {
          newAttributeValue:
              | Parameters<JSCodeshift["literal"]>["0"]
              | ((ctx: {
                    j: JSCodeshift; //
                    path: ASTPath<JSXOpeningElement>;
                }) => Parameters<JSCodeshift["jsxAttribute"]>["1"]);
          instructionsOnHowToManuallyAddAttributeBecauseCannotAutomate?: never;
      }
    | {
          newAttributeValue?: never;
          instructionsOnHowToManuallyAddAttributeBecauseCannotAutomate: string;
      }
);

export const addMissingJsxProp: Transformer<ConfigToAddMissingJsxProp> = (
    j, //
    src,
    _fileInfo,
    _api,
    _options,
    config,
) => {
    const imports = getParsedImports(j, src).filter(
        i =>
            i.from === config.importedFrom && //
            !i.isDefaultImport && // TODO might need this
            i.wasExportedAs === config.exportedAs,
    );

    if (!imports?.length) {
        return;
    }

    src.find(j.JSXOpeningElement, {
        name: {
            name: config.exportedAs,
        },
    })
        //
        .forEach((path: ASTPath<JSXOpeningElement>): void => {
            const { node } = path;

            const alreadyHasAttribute: boolean = (node.attributes || []).some(
                attr => j.JSXAttribute.check(attr) && attr.name.name === config.newAttributeName,
            );

            if (alreadyHasAttribute) return;

            if (!node.attributes) {
                node.attributes = [];
            }

            if (config.newAttributeValue !== undefined) {
                node.attributes.push(
                    j.jsxAttribute(
                        j.jsxIdentifier(config.newAttributeName), //
                        config.newAttributeValue instanceof Function
                            ? config.newAttributeValue({ j, path })
                            : typeof config.newAttributeValue === "string"
                            ? j.literal(config.newAttributeValue)
                            : j.jsxExpressionContainer(j.literal(config.newAttributeValue)),
                    ),
                );

                return;
            } else if (config.instructionsOnHowToManuallyAddAttributeBecauseCannotAutomate !== undefined) {
                node.attributes.push(
                    j.jsxAttribute(
                        j.jsxIdentifier(config.newAttributeName), //
                        j.jsxExpressionContainer(j.jsxEmptyExpression()),
                    ),
                );

                const comment = dedent`
					MANUAL - cannot provide automatic new value "${config.newAttributeName}".
					follow the instructions yourself:
					
					${config.instructionsOnHowToManuallyAddAttributeBecauseCannotAutomate}
				`;

                const attrPath = j(path).find(j.JSXAttribute, {
                    name: {
                        name: config.newAttributeName,
                    },
                });

                insertMultilineComment(j, attrPath, comment);

                return;
            } else {
                return assertNever(config);
            }
        });
};
