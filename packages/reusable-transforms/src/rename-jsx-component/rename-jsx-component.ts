import dedent from "ts-dedent";
// import { namedTypes } from "ast-types";

import { insertMultilineComment } from "@codeshift/utils";

import { getParsedImports, ParsedImport } from "../utils/getParsedImports";
import { Transformer } from "../utils/Transformer";

import { verifyIsJsxIdentifierOrAddComment } from "./verifyIsJsxIdentifierOrAddComment";

export interface ConfigToRenameJsxComponent {
    importedFrom: string;
    exportedAs: string;
    newExportedAs: string;
}

export const renameJsxComponent: Transformer<ConfigToRenameJsxComponent> = (
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

    let toCommit: (() => void)[] = [];
    /**
     * must return the result to verify we exited
     */
    const commit = (): void[] => toCommit.map(sideEffect => sideEffect());
    const abort = (): void[] => [];

    const imp: ParsedImport = imports.find(
        im => !im.isDefaultImport /* TODO might need this */ && im.wasExportedAs === config.exportedAs,
    )!;

    if (imp.isDefaultImport) {
        return;
    }

    let oldLocalName: string;

    // TODO findLocalNameOfImportOrRequire

    if (imp.specifier) {
        oldLocalName = imp.isImportedAs ?? imp.wasExportedAs;

        // console.log({ sp, impSpecifier: imp.specifier, equal: sp === imp.specifier });

        toCommit.push(() =>
            j(imp.specifier!).replaceWith(
                j.importSpecifier(
                    j.identifier(config.newExportedAs), //
                    j.identifier(config.newExportedAs),
                ),
            ),
        );
    } else if (imp.property) {
        oldLocalName = imp.isImportedAs ?? imp.wasExportedAs;

        toCommit.push(() =>
            j(imp.property!).replaceWith(
                j.property.from({
                    shorthand: true,
                    kind: "init",
                    key: j.identifier(config.newExportedAs),
                    value: j.identifier(config.newExportedAs),
                }),
            ),
        );
    } else {
        // TODO comment?
        return;
    }

    src.find(j.JSXElement, {
        openingElement: {
            name: {
                name: oldLocalName!, // TODO
            },
        },
    }).forEach((path): void[] => {
        const { node } = path;

        if (!verifyIsJsxIdentifierOrAddComment(j, path, "openingElement", node.openingElement.name)) {
            return abort();
        }

        toCommit.push(
            () => ((node.openingElement.name as typeof node.openingElement.name).name = config.newExportedAs),
        );

        if (!node.closingElement) {
            /**
             * <Self-closing-element />
             */
            return commit();
        }

        if (!verifyIsJsxIdentifierOrAddComment(j, path, "closingElement", node.closingElement.name)) {
            return abort();
        }

        if (node.closingElement.name.name !== node.openingElement.name.name) {
            const comment = dedent`
				ERROR closing and opening names not equal:

				opening = ${node.openingElement.name.name},
				closing = ${node.closingElement.name.name}.

				Would be renamed to: ${config.newExportedAs}.
			`;

            insertMultilineComment(j, j(path), comment);

            return abort();
        }

        toCommit.push(
            () => ((node.closingElement!.name as typeof node.closingElement.name).name = config.newExportedAs),
        );

        return commit();
    });
};
