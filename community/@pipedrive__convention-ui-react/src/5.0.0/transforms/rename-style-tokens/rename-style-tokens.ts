import fs from "fs";
import path from "path";

import { Transformer } from "@codeshift/reusable-transforms/src/utils/Transformer";

import { regroupImports } from "./regroupImports";

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
            property: (obj: any) =>
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
