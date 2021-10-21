import { JSCodeshift } from "jscodeshift";

export const buttonColorToVariant = (j: JSCodeshift, src: ReturnType<typeof j>) => {
    const getNamesOfCUIButton = () => {
        let names = [];

        /**
         * handle cases for:
         *
         * 1. import { Button } from "cui";
         * 2. import { Button as CUIButton } from "cui";
         *  (CUIButton just an example name; can be different)
         *
         */

        src.find(j.ImportDeclaration).forEach(path => {
            if (path.node.source.value === "@pipedrive/convention-ui-react") {
                const specifiers = path.node.specifiers.filter(
                    (
                        s: any, // TODO TS
                    ) =>
                        s &&
                        s.imported &&
                        s.imported &&
                        s.imported.type === "Identifier" &&
                        s.imported.name === "Button",
                );

                console.log({ specifiers, nodeSpecifiers: path.node.specifiers });

                if (!specifiers || !specifiers.length) {
                    // nothing
                } else if (specifiers.length > 1) {
                    throw new Error("CUI Button imported multiple times (?)");
                } else {
                    const actualName = specifiers[0].local.name;
                    names.push(actualName);
                }
            }
        });

        /**
         * handle cases for:
         *
         * (Button just example name; can be different)
         * 1. const Button = styled(Button)`
         *
         * `;
         *
         */
        // TODO

        return names;
    };

    const namesOfCUIButton = getNamesOfCUIButton();
    console.log({ namesOfCUIButton });

    const isAttributeOfCUIButton = (path): boolean => {
        const pppName =
            path &&
            path.parentPath &&
            path.parentPath.parentPath &&
            path.parentPath.parentPath.parentPath &&
            path.parentPath.parentPath.parentPath.value &&
            path.parentPath.parentPath.parentPath.value.name &&
            path.parentPath.parentPath.parentPath.value.name.name;

        console.log(
            "path",
            path,
            path.node.name,
            pppName,
            path.node.type === "JSXIdentifier",
            namesOfCUIButton.includes(pppName),
        );

        if (!pppName) return false;

        return path.node.type === "JSXIdentifier" && namesOfCUIButton.includes(pppName);
    };

    src.find(j.JSXIdentifier).forEach(path => {
        const isAttr = isAttributeOfCUIButton(path);
        console.log("color -> variant", path, isAttr);

        if (!isAttr) {
            return;
        }

        if (path.node.name === "color") {
            j(path).replaceWith(j.identifier("variant"));
        }
    });
};
