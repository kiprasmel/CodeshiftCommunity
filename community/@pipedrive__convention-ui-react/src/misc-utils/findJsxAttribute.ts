import { insertMultilineComment } from "@codeshift/utils";
import { JSCodeshift, Collection, JSXAttribute, JSXOpeningElement } from "jscodeshift";

export const findJsxAttribute = <T extends JSXOpeningElement>(
    name: string, //
    j: JSCodeshift,
    path: Collection<T>,
): Collection<JSXAttribute> | null => {
    const attr = path.find(j.JSXAttribute, { name: { name: name } });

    if (attr.length > 1) {
        const comment = `ERROR found multiple attributes with the same name: ${name}`;

        insertMultilineComment(
            j, //
            path.find(j.JSXOpeningElement),
            comment,
        );

        return null;
    }

    if (attr.length === 0) {
        return null;
    }

    return attr.at(0);
};
