import { ASTPath } from "jscodeshift";
import { namedTypes } from "ast-types";
import dedent from "ts-dedent";

import { insertMultilineComment } from "@codeshift/utils";

import { Transformer } from "@codeshift/reusable-transforms/src/utils/Transformer";
import { getParsedImports, ParsedImport } from "@codeshift/reusable-transforms/src/utils/getParsedImports";
import { never, assertNever } from "@codeshift/reusable-transforms/src/utils/never";

interface ImportFilterWithDestructuring {
    /**
     * regex:
     * 1. to test if the import path matches, and
     * 2. to extract what the new destructured import is and should be named
     */
    doesImportMatchOrGetValueOfDestructured: RegExp;

    /**
     * since the `newImportPath` was the same for everything,
     * reduced the complexity by removing the configuration option.
     */
    // newImportPath: string;
}

const newImportPath = "@pipedrive/convention-ui-react/dist/tokens" as const;

const importFiltersWithDestructuring: ImportFilterWithDestructuring[] = [
    /**
     * order is important here - more specific matchers
     * should come first, before more general ones.
     */
    {
        doesImportMatchOrGetValueOfDestructured: /@pipedrive\/convention-ui-css\/dist\/amd\/(.*)\.js/,
        // getImportName: val => /@pipedrive\/convention-ui-css\/dist\/amd\/(.*)\.js/.exec(val)[1]
        // newImportPath:,
    },
    {
        doesImportMatchOrGetValueOfDestructured: /@pipedrive\/convention-ui-css\/dist\/json\/([^.-]*)-conventioned\.json/,
        // newImportPath: "@pipedrive/convention-ui-react/dist/tokens",
    },
    {
        doesImportMatchOrGetValueOfDestructured: /@pipedrive\/convention-ui-css\/dist\/json\/([^.-]*)\.json/,
        // newImportPath: "@pipedrive/convention-ui-react/dist/tokens",
    },
];

interface ImportFilterJustRenamePath {
    oldImportPath: string;

    /**
     * same as w/ the other import
     */
    // newImportPath: string;
}

const importFiltersJustPathRenames: ImportFilterJustRenamePath[] = [
    {
        oldImportPath: "@pipedrive/convention-ui-css/dist/js/variables",
        // newImportPath: "@pipedrive/convention-ui-react/dist/tokens",
    },
];

export const regroupImports: Transformer<{}, any> = (
    j, //
    src,
    _fileInfo,
    _api,
    _options,
    // config,
) => {
    const imports = getParsedImports(j, src);

    type ImportThatNeedsRegrouping = {
        im: ParsedImport;
    } & (
        | {
              matchingWithDestructuring: ImportFilterWithDestructuring;
              matchingJustRenames?: never;
          }
        | {
              matchingWithDestructuring?: never;
              matchingJustRenames: ImportFilterJustRenamePath;
          }
    );

    /**
     * currently it'll work because
     * the new import path is always the same.
     *
     * but if we want to generalize it, then we'll need to restructure this
     * to go import-config by import-config, instead of going import-by-import
     */
    const importsThatNeedRegrouping: ImportThatNeedsRegrouping[] = imports
        .map((im): ImportThatNeedsRegrouping | false => {
            const matchingWithDestructuring = importFiltersWithDestructuring.filter(filter =>
                filter.doesImportMatchOrGetValueOfDestructured.test(im.from),
            );
            const matchingJustRenames = importFiltersJustPathRenames.filter(filter => filter.oldImportPath === im.from);

            const matchingCount = matchingWithDestructuring.length + matchingJustRenames.length;

            if (matchingCount >= 1) {
                if (matchingCount > 1) {
                    insertMultilineComment(
                        j,
                        j(im.path),
                        dedent`
							WARNING matched multiple import paths - make sure the imports are correct.
						`,
                    );

                    return false;
                }

                if (matchingWithDestructuring.length) {
                    return {
                        im,
                        matchingWithDestructuring: matchingWithDestructuring[0],
                    } as const;
                } else {
                    return {
                        im,
                        matchingJustRenames: matchingJustRenames[0],
                    } as const;
                }
            } else {
                return false;
            }
        })
        .filter(x => !!x) as ImportThatNeedsRegrouping[]; // TODO TS should infer automatically

    if (!importsThatNeedRegrouping.length) {
        return;
    }

    const newImportAlreadyExisting = imports.find(im => im.from === newImportPath);

    const ASTPathForNewImport: ParsedImport["path"] = newImportAlreadyExisting
        ? newImportAlreadyExisting.path
        : importsThatNeedRegrouping[0].im.path;

    interface KV {
        key: string;
        value: string;
    }

    const defaultImportsNotSupportedWarning = "WARNING default imports not supported (yet?).";

    const importPathsToRemove: ASTPath<namedTypes.VariableDeclarator | namedTypes.ImportDeclaration>[] = [];

    const newDestructuredNames: KV[] = importsThatNeedRegrouping
        .map(({ im, matchingJustRenames, matchingWithDestructuring }): KV | KV[] => {
            if (im.path !== ASTPathForNewImport) {
                importPathsToRemove.push(im.path);
            }

            if (matchingWithDestructuring) {
                let ret = matchingWithDestructuring.doesImportMatchOrGetValueOfDestructured.exec(im.from);

                if (!ret) {
                    console.error({ ret, "im.from": im.from, im });
                    return never();
                }

                return {
                    key: ret[1],
                    value: im.isImportedAs,
                };
            } else if (matchingJustRenames) {
                if (j.ImportDeclaration.check(im.path.node)) {
                    if (im.isDefaultImport) {
                        insertMultilineComment(
                            j, //
                            j(im.path),
                            defaultImportsNotSupportedWarning,
                        );

                        return [];
                    }

                    return {
                        key: im.wasExportedAs,
                        value: im.isImportedAs,
                    };
                } else if (j.VariableDeclarator.check(im.path.node)) {
                    if (im.isDefaultImport) {
                        insertMultilineComment(
                            j, //
                            j(im.path),
                            defaultImportsNotSupportedWarning,
                        );

                        return [];
                    }

                    return {
                        key: im.wasExportedAs,
                        value: im.isImportedAs,
                    };
                } else {
                    console.error(im.path.node);
                    return assertNever(im.path.node);
                }
            } else {
                return never();
            }
        })
        .flat();

    importPathsToRemove.forEach(path => j(path).remove());

    if (newImportAlreadyExisting) {
        /**
         * the import/require already exists.
         * thus, we should add the missing specifiers/declarations,
         * instead of creating the same import again.
         */

        if (j.ImportDeclaration.check(newImportAlreadyExisting.path.node)) {
            /**
             * extend the existing destructured import
             */

            const { node } = newImportAlreadyExisting.path;

            if (!node.specifiers?.length) {
                node.specifiers = [];
            }

            const alreadyExistingSpecifiers = node.specifiers
                .map(sp => (j.ImportSpecifier.check(sp) ? sp.imported.name : false))
                .filter(x => !!x);
            const newSpecifiers = newDestructuredNames.filter(name => !alreadyExistingSpecifiers.includes(name.key));

            if (!newSpecifiers.length) {
                return;
            }

            node.specifiers = [
                ...node.specifiers,
                ...newSpecifiers.map(name => j.importSpecifier(j.identifier(name.key), j.identifier(name.value))),
            ];

            return;
        } else if (j.VariableDeclarator.check(newImportAlreadyExisting.path.node)) {
            /**
             * extend the existing destructured require
             */

            const { node } = newImportAlreadyExisting.path;

            if (!j.ObjectPattern.check(node.id)) {
                // TODO comment?
                return;
            }

            const alreadyExistingDeclarations: string[] = node.id.properties //
                .map((prop): string | false =>
                    j.Property.check(prop) ? (j.Identifier.check(prop.key) ? prop.key.name : false) : false,
                )
                .filter(x => !!x) as string[];

            const newDeclarations = newDestructuredNames.filter(
                name => !alreadyExistingDeclarations.includes(name.key),
                // TODO which one?
                // name => !alreadyExistingDeclarations.includes(name.value),
            );

            if (!newDeclarations.length) {
                return;
            }

            node.id.properties = [
                ...node.id.properties,
                ...newDeclarations.map(name =>
                    j.property.from({
                        shorthand: name.key === name.value,
                        kind: "init",
                        key: j.identifier(name.key),
                        value: j.identifier(name.value),
                    }),
                ),
            ];

            return;
        } else {
            return assertNever(newImportAlreadyExisting.path.node);
        }
    } else {
        /**
         * the import/require did not exist before,
         * thus we need to create a new one.
         *
         * we're re-creating the whole import/require,
         * because we also need to update the path
         * of where we're importing from (newImportPath).
         */

        if (j.ImportDeclaration.check(ASTPathForNewImport.node)) {
            j(ASTPathForNewImport).replaceWith(
                j.importDeclaration(
                    newDestructuredNames.map(name =>
                        j.importSpecifier(j.identifier(name.key), j.identifier(name.value)),
                    ),
                    j.literal(newImportPath),
                ),
            );

            return;
        } else if (j.VariableDeclarator.check(ASTPathForNewImport.node)) {
            j(ASTPathForNewImport).replaceWith(
                j.variableDeclarator(
                    j.objectPattern(
                        newDestructuredNames.map(name =>
                            j.property.from({
                                kind: "init",
                                key: j.identifier(name.key),
                                value: j.identifier(name.value),
                                shorthand: name.key === name.value,
                            }),
                        ),
                    ),
                    j.callExpression(j.identifier("require"), [j.literal(newImportPath)]),
                ),
            );

            return;
        } else {
            return assertNever(ASTPathForNewImport.node);
        }
    }
};
