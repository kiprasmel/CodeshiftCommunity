import dedent from "ts-dedent";

import { getParsedImports, ParsedImport } from "@codeshift/reusable-transforms/src/utils/getParsedImports";
import { never } from "@codeshift/reusable-transforms/src/utils/never";
import { Transformer } from "@codeshift/reusable-transforms/src/utils/Transformer";
import { insertMultilineComment } from "@codeshift/utils";

import fs from "fs";
import path from "path";

const mappingsContent = fs.readFileSync(
    path.join(
        __dirname, //
        "..",
        "..",
        "mapping",
        "tokenMapping.json",
    ),
    { encoding: "utf-8" },
);

const mappingsOrig = JSON.parse(mappingsContent);

/**
 * merge the mappings into a single object.
 * safe because all of them are unique.
 */
const mappings: Record<string, string> = Object.keys(mappingsOrig["js"]) //
    .reduce(
        (acc, curr) => Object.assign(acc, mappingsOrig["js"][curr]), //
        {},
    );

export const renameStyleTokens: Transformer<any, any> = (
    j, //
    src,
    _fileInfo,
    _api,
    _options,
    // config,
) => {
    src
        //
        .find(j.TemplateLiteral)
        .find(j.MemberExpression, {
            property: obj =>
                j.Literal.check(obj)
                    ? obj.value !== null && obj.value.toString() in mappings //
                    : j.Identifier.check(obj)
                    ? obj.name in mappings
                    : false,
        })
        .forEach((path): void => {
            const { node } = path;

            /**
             * given `colors["foo"]`, `"foo"` is a `Literal`;
             * given `colors.foo`, `foo` is an `Identifier`.
             *
             * and their AST structure differs slightly.
             *
             * thus, based on how the property is accessed,
             * here we properly take the value,
             * and create a function to update the value.
             */
            let from;
            let set: (val: any) => void;

            if (j.Literal.check(node.property)) {
                from = node.property.value;
                set = val => ((node.property as typeof node.property).value = val);
            } else if (j.Identifier.check(node.property)) {
                from = node.property.name;
                set = val => ((node.property as typeof node.property).name = val);
            } else {
                /**
                 * TODO comment that unsupported?
                 */
                return;
            }

            if (typeof from !== "string") {
                return;
            }

            const to = mappings[from];

            if (!to) {
                return;
            }

            set(to);

            return;
        });

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    regroupImports(j, src, _fileInfo, _api, _options, {});

    return;
};

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

    type ToBeRegrouped = {
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
    const toBeRegrouped: ToBeRegrouped[] = imports
        .map(im => {
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
            }

            return false;
        })
        .filter(x => !!x) as ToBeRegrouped[]; // TODO TS should infer automatically

    if (!toBeRegrouped.length) {
        return;
    }

    const newImportAlreadyExisting = imports.find(im => im.from === newImportPath);

    const ASTPathForNewImport: ParsedImport["path"] = newImportAlreadyExisting
        ? newImportAlreadyExisting.path
        : toBeRegrouped[0].im.path;

    interface KV {
        key: string;
        value: string;
    }

    const newDestructuredNames: KV[] = toBeRegrouped
        .map(({ im, matchingJustRenames, matchingWithDestructuring }): KV | KV[] => {
            if (im.path !== ASTPathForNewImport) {
                j(im.path).remove();
            }

            if (matchingWithDestructuring) {
                let ret = matchingWithDestructuring.doesImportMatchOrGetValueOfDestructured.exec(im.from);

                /**
                 * TODO test
                 */
                if (!ret) return never();

                return {
                    key: ret[1],
                    value: im.isImportedAs,
                };
            } else if (matchingJustRenames) {
                /**
                 * FIXME
                 * @pipedrive/convention-ui-css/dist/js/variables
                 */
                if (j.ImportDeclaration.check(im.path.node)) {
                    if (im.isDefaultImport) {
                        insertMultilineComment(
                            j,
                            j(im.path),
                            dedent`
								WARNING default imports not supported (yet?).
							`,
                        );

                        return [];
                    }

                    return {
                        key: im.wasExportedAs,
                        value: im.isImportedAs,
                    };

                    // im.path.node.specifiers.map(
                    //     sp =>
                    //         j.ImportSpecifier.check(sp) && {
                    //             key: sp.imported.name,
                    //             val: sp.local?.name || sp.imported.name,
                    //         },
                    // );
                } else if (j.VariableDeclarator.check(im.path.node)) {
                    // TODO `require`s

                    insertMultilineComment(
                        j,
                        j(im.path),
                        dedent`
							TODO (to actual codemod creators) handle "require"s
						`,
                    );

                    return [];
                } else {
                    // FIXME
                    console.log({ im, path: im.path, node: im.path.node });
                    return never();
                }
            } else {
                return never();
            }
        })
        .flat();

    // console.log({
    //     newDestructuredNames,
    //     ASTPathForNewImport,
    //     newImportAlreadyExisting,
    // });

    // const program = src
    //     .find(j.Program)
    //     .at(0)
    //     .nodes()[0];
    // program.body.unshift(

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
            return never();
        }
    } else {
        /**
         * the import/require did not exist before,
         * thus we need to create a new one.
         */
        j(ASTPathForNewImport).replaceWith(
            j.importDeclaration(
                newDestructuredNames.map(name => j.importSpecifier(j.identifier(name.key), j.identifier(name.value))), //
                j.literal(newImportPath), //
            ),
        );
    }

    return;
};
