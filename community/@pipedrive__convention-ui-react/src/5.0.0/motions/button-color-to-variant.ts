import { ASTPath, JSCodeshift } from "jscodeshift";

export type Src<T extends JSCodeshift> = ReturnType<T>;

export interface Specifier {
    /** original name */
    exportedAs: string;
    /** name used in end user's code */
    importedAs: string;
}

export interface ParsedImport {
    from: string;
    specifiers: Specifier[];
}

// TODO TS
export interface PoorlyTypedSpecifier {
    imported?: {
        name?: string;
    };
    local?: {
        name?: string;
    };
}

export const getParsedImports = (j: JSCodeshift, src: Src<typeof j>, ret: ParsedImport[] = []): ParsedImport[] => (
    src.find(j.ImportDeclaration).forEach(path =>
        ret.push({
            from: path.node.source.value as string, // TODO TS
            specifiers: path.node.specifiers
                .filter((s: PoorlyTypedSpecifier) => s && s.imported && s.local) // TODO TS
                .map((s: PoorlyTypedSpecifier) => ({
                    // TODO TS
                    exportedAs: s.imported.name,
                    importedAs: s.local.name,
                })),
        }),
    ),
    ret
);

export const cuiLibraryName = "@pipedrive/convention-ui-react" as const;

export const buttonColorToVariant = (
    j: JSCodeshift, //
    src: Src<typeof j>,
) => {
    const imports = getParsedImports(j, src);

    console.log({ imports });

    const getImportNamesOfCUIButton = () => {
        let names: string[] = [];

        /**
         * handle cases for:
         *
         * 1. import { Button } from "cui";
         * 2. import { Button as CUIButton } from "cui";
         *  (CUIButton just an example name; can be different)
         *
         */

        imports.forEach(i => {
            /**
             * TODO: consider parsing deeper files
             * that are imported locally
             * whom could've wrapped the CUI Button
             * in their own implementation
             *
             * could do this by only doing this for
             * 1) JSX elements, that 2) have the `color` prop
             *
             * would have to 1) handle module resolution probably,
             * and 2) avoid cycling dependencies.
             *
             * will consider if worth it. probably would be for styled-component wraps
             * or just general improvements.
             *
             * or maybe we should explicitly __not__ do this
             * to avoid encounraging consumers to wrap our components?
             *
             */
            if (i.from !== cuiLibraryName) {
                return;
            }

            const specifiers = i.specifiers.filter(s => s.exportedAs === "Button");

            if (!specifiers || !specifiers.length) {
                return;
            } else if (specifiers.length > 1) {
                throw new Error("CUI Button imported multiple times (?)");
            } else {
                names.push(specifiers[0].importedAs);
            }
        });

        /**
         * handle cases for:
         *
         * (const Button - Button just example name; can be different)
         * 1. const Button = styled(Button)`
         *
         * `;
         *
         */
        // TODO

        return names;
    };

    const importNamesOfCUIButton = getImportNamesOfCUIButton();
    console.log({ importNamesOfCUIButton });

    /** button not imported - nothing to do here */
    if (!importNamesOfCUIButton || !importNamesOfCUIButton.length) {
        return;
    }

    const isAttributeOfCUIButton = <T>(path: ASTPath<T>): boolean => {
        const pppName =
            path &&
            path.parentPath &&
            path.parentPath.parentPath &&
            path.parentPath.parentPath.parentPath &&
            path.parentPath.parentPath.parentPath.value &&
            path.parentPath.parentPath.parentPath.value.name &&
            path.parentPath.parentPath.parentPath.value.name.name;

        // console.log(
        //     "path",
        //     path,
        //     path.node.name,
        //     pppName,
        //     path.node.type === "JSXIdentifier",
        //     namesOfCUIButton.includes(pppName),
        // );

        if (!pppName) return false;

        return (
            ((path.node as unknown) as { type: string }).type === "JSXIdentifier" &&
            importNamesOfCUIButton.includes(pppName) // TODO TS
        );
    };

    src.find(j.JSXIdentifier).forEach(path => {
        const isAttr = isAttributeOfCUIButton(path);
        // console.log("color -> variant", path, isAttr);

        if (!isAttr) {
            return;
        }

        if (path.node.name === "color") {
            j(path).replaceWith(j.identifier("variant"));
        }
    });
};
