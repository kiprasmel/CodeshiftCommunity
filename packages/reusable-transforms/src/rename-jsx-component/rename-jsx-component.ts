import dedent from "ts-dedent";

import { insertMultilineComment } from "@codeshift/utils";

import { getParsedImports } from "../utils/getParsedImports";
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

    src.find(j.JSXElement, {
        openingElement: {
            name: {
                name: config.exportedAs,
            },
        },
    }).forEach((path): void[] => {
        const { node } = path;

        let toCommit: (() => void)[] = [];
        /**
         * must return the result to verify we exited
         */
        const commit = (): void[] => toCommit.map(sideEffect => sideEffect());
        const abort = (): void[] => [];

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
