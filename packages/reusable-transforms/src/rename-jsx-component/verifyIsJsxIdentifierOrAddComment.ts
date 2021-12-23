import { ASTPath, JSCodeshift } from "jscodeshift";
import { namedTypes } from "ast-types";

import { insertMultilineComment } from "@codeshift/utils";

export const verifyIsJsxIdentifierOrAddComment = (
    j: JSCodeshift, //
    path: ASTPath<any>,
    name: string,
    node: any,
): node is namedTypes.JSXIdentifier => {
    if (j.JSXIdentifier.check(node)) {
        return true;
    }

    const { type } = j.jsxIdentifier("");

    const comment = `ERROR expected ${name} to be ${type}, got ${node.type}`;

    insertMultilineComment(j, j(path), comment);

    return false;
};
