import { JSCodeshift, Collection, ASTPath } from "jscodeshift";
import { namedTypes } from "ast-types";

import { never } from "./never";

export type ImportConfig = {
    importedFrom: string;
} & (
    | {
          isDefaultImport: false;
          exportedAs: string;
      }
    | {
          isDefaultImport: true;
          exportedAs?: never;
      }
);

export type ParsedImport = {
    from: string;

    /** name used in end user's code */
    isImportedAs: string;

    path: ASTPath<namedTypes.ImportDeclaration | namedTypes.VariableDeclarator>;
    declarationPath?: ASTPath<namedTypes.VariableDeclaration>;

    /**
     * if destructured import/require, will have one of these
     * (import -> specifier, require -> property)
     */
    specifier?: ASTPath<
        namedTypes.ImportSpecifier | namedTypes.ImportDefaultSpecifier | namedTypes.ImportNamespaceSpecifier
    >;
    property?: ASTPath<namedTypes.Property>;
} & (
    | {
          isDefaultImport: true;

          /** original name (we don't know) */
          wasExportedAs?: never;
      }
    | {
          isDefaultImport: false;

          /** original name */
          wasExportedAs: string;
      }
);

// const unsupportedNonLiteralRequireMsg = "un-supported non-literal require: " as const;

/**
 * each import specifier (i.e. destructured imports/requires)
 * is returned as a separate object,
 * i.e. many imports have the same import path,
 * and only one specifier/destructured key & value
 * (wasExportedAs, isImportedAs),
 * which is the only thing that differs between them.
 *
 * ---
 *
 * the best way to understand how this one works
 * is to explore & see the AST structure of imports
 * in astexplorer,
 * and then as one's going thru the function,
 * to keep switching between it & astexplorer
 * & see how things line up.
 *
 * see e.g.:
 * - https://astexplorer.net/#/gist/f5c569dc322b7947a5fcb5e4dd7f5dbc/edff804b3ea0abcacdf4b6dc76ec6839ed4b1a8d
 *   - (backup source) https://gist.github.com/astexplorer/f5c569dc322b7947a5fcb5e4dd7f5dbc/edff804b3ea0abcacdf4b6dc76ec6839ed4b1a8d
 *
 */
export const getParsedImports = <T = any>(
    j: JSCodeshift, //
    src: Collection<T>,
    ret: ParsedImport[] = [],
): ParsedImport[] => (
    /**
     * import
     */
    src.find(j.ImportDeclaration).forEach(path => {
        const { node } = path;

        if (!j.Literal.check(node.source) || typeof node.source.value !== "string") {
            /**
             * TODO ouput errors in a better location (like an output file?)
             */
            // console.warn(unsupportedNonLiteralRequireMsg, node.source.value, path);
            return;
        }

        const from: string = node.source.value;

        if (!node.specifiers || !node.specifiers.length) {
            return;
        }

        j(path)
            /**
             * import Foo from "bar"; (default import)
             */
            .find(j.ImportDefaultSpecifier)
            .forEach((sp): void => {
                const { node: specifier } = sp;
                if (!j.Identifier.assert(specifier.local)) {
                    return never();
                }

                ret.push({
                    path,
                    from,
                    isDefaultImport: true,
                    isImportedAs: specifier.local.name,
                    specifier: sp,
                });
            });

        j(path)
            /**
             * import { Foo }            from "bar"; (destructured import)
             * import { Foo as Bazooka } from "bar"; (destructured & aliased import)
             */
            .find(j.ImportSpecifier)
            .forEach((sp): void => {
                const { node: specifier } = sp;

                if (!j.Identifier.assert(specifier.imported) || !j.Identifier.assert(specifier.local)) {
                    return never();
                }

                ret.push({
                    path,
                    from,
                    isDefaultImport: false,
                    wasExportedAs: specifier.imported.name,
                    isImportedAs: specifier.local.name,
                    specifier: sp,
                });
            });

        /**
         * TODO FIXME - handle them!
         */
        // console.warn("unhandled import specifier - was neither a) default nor b) destructured", specifier);
        return;
    }),
    /**
     * require
     */
    src
        .find(j.VariableDeclarator, {
            init: {
                callee: { name: "require" },
            },
        })
        .forEach((path): void => {
            const { node } = path;
            const declarationPath: ASTPath<namedTypes.VariableDeclaration> = j(path)
                .closest(j.VariableDeclaration)
                .at(0)
                .paths()[0];

            if (!j.CallExpression.assert(node.init)) {
                return never();
            }

            const requiredFrom = node.init.arguments[0];

            if (!j.Literal.check(requiredFrom) || typeof requiredFrom.value !== "string") {
                /**
                 * TODO ouput errors in a better location (like an output file?)
                 */
                // console.warn(unsupportedNonLiteralRequireMsg, node.init.arguments[0], path);
                return;
            }

            let from: string = requiredFrom.value;

            if (j.Identifier.check(node.id)) {
                /**
                 * const Foo = require("bar"); (default export)
                 */

                ret.push({
                    path,
                    declarationPath,
                    from,
                    isDefaultImport: true,
                    isImportedAs: node.id.name,
                    // no property
                });
            } else if (j.ObjectPattern.check(path.node.id)) {
                /**
                 * const { Foo }          = require("bar"); (destructured export)
                 * const { Foo: Bazooka } = require("bar"); (destructured export)
                 */

                j(path)
                    .find(j.Property)
                    .forEach(p => {
                        const { node: prop } = p;

                        ret.push({
                            path,
                            declarationPath,
                            from,
                            isDefaultImport: false,
                            wasExportedAs:
                                ("name" in prop.key
                                    ? prop.key.name?.toString()
                                    : "value" in prop.key
                                    ? prop.key.value?.toString()
                                    : "") ?? "",
                            isImportedAs:
                                ("name" in prop.value
                                    ? prop.value.name?.toString()
                                    : "value" in prop.value
                                    ? prop.value.value?.toString()
                                    : "") ?? "",

                            property: p,
                            // property: j(prop)
                            //     .at(0)
                            //     .paths()[0],
                        });
                    });
            } else {
                /**
                 * TODO FIXME - handle them!
                 */
                // console.warn("unhandled import", path);
                return;
            }
        }),
    ret
);

export const createGetImportsByConfig = <T = any>(
    j: JSCodeshift, //
    src: Collection<T>,
) => (config: ImportConfig): ParsedImport[] =>
    getParsedImports(j, src).filter(
        i =>
            i.from === config.importedFrom && //
            (config.isDefaultImport
                ? i.isDefaultImport //
                : !i.isDefaultImport && i.wasExportedAs === config.exportedAs),
    );
