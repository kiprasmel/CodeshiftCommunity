import { Transformer } from "@codeshift/reusable-transforms/src/utils/Transformer";

export interface ConfigToDoSomething {
    //
}

export const doSomething: Transformer<ConfigToDoSomething, any> = (
    j, //
    src,
    _fileInfo,
    _api,
    _options,
    _config,
) => {
    /**
     * if you'll want to filter only specific imports,
     * you can see how `getParsedImports` is used.
     */

    /**
     * https://astexplorer.net/
     *
     * select parser "flow" and transformer "jscodeshift"
     *
     * experiment with examples from the tests
     * (see how the compiler/interpreter sees your code)
     *
     */
    src.find(j.JSXOpeningElement, {
        name: {
            name: "Button",
        },
    })
        .find(j.JSXAttribute, {
            name: {
                name: "color",
            },
        })
        .forEach((path): void => {
            const { node } = path;

            /**
             * just a simple replacement.
             *
             * in more complex cases, you'd use
             *
             * j(path).replaceWith(AST)
             *
             * and the `AST` would be created with jscodeshift's builders,
             * e.g. j.jsxIdentifier, j.literal, j.objectPattern, j.importDeclaration, etc
             * (all start with lowercase).
             *
             */
            node.name.name = "variant";

            return;
        });

    /**
     * if the transform seems to be generalizable,
     * that's what the `ConfigToDoSomething` is for.
     *
     * don't abstract things prematurely though - very often
     * edge cases come up that you didn't even think about
     * (e.g. handling not only `import`s but also `require`s,
     *  e.g. extracting from, and wrapping into a `j.JSXExpressionContainer` if needed,
     *  etc.),
     * and your abstraction will now significantly slow you down.
     */
};
