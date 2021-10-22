import { ASTPath, JSCodeshift } from "jscodeshift";

import { insertCommentBefore } from "@codeshift/utils";

import { getParsedImports, Src } from "../../utils/getParsedImports";

export const cuiLibraryName = "@pipedrive/convention-ui-react" as const;

export const buttonColorToVariant = (
    j: JSCodeshift, //
    src: Src<typeof j>,
) => {
    const importNamesOfCUIButton = getImportNamesOfCUIButton();
    console.log({ importNamesOfCUIButton });

    /** button not imported - nothing to do here */
    if (!importNamesOfCUIButton || !importNamesOfCUIButton.length) {
        return;
    }

    src.find(j.JSXIdentifier).forEach(path => {
        if (path.node.name !== "color" || !isAttributeOfCUIButton(path)) {
            return;
        }

        /**
         * replace the `color` prop
         */
        j(path).replaceWith(j.identifier("variant"));

        console.log("color path.parentPath.val.val.val", path.parentPath.value.value.value);

        // should be `readonly [A, B]` but eslint can't parse...
        interface Tuple<A, B> {
            0: A;
            1: B;
        }

        const fromToValueMap: Record<string, Tuple<string, boolean /** does it need manual intervention? */>> = {
            ghost: ["ghost", false],
            /**
             * TODO: provide proper map
             */
            black64: ["primary", true],
            black128: ["primary", true],
            black256: ["primary", true],
        };

        const from = path.parentPath.value.value.value;
        const to = fromToValueMap[from];

        if (!to) {
            // TODO collect info & log once done?
            return;
        }

        const newValue = to[0];
        const needsManualIntervention = to[1];

        if (!newValue) {
            // TODO collect info & log once done?
            return;
        }

        /**
         * TODO: using proper selected might be better
         *
         * replace the actual value of the `color` prop
         */
        path.parentPath.value.value.value = newValue;

        if (!needsManualIntervention) {
            return;
        }

        /**
         * TODO: finish this up
         */
        insertCommentBefore(
            j,
            j(path),
            `\
DEAR MAINTAINER, THERE IS NO CLEAR 1:1 MAPPING.

WE ARE ONLY PROVIDING AN ESTIMATE FITTING VALUE,
BUT YOU ARE EXPECTED TO VERIFY THIS YOURSELF.

READ THE MIGRATION GUIDE TO LEARN HOW:

<...> 


.
			`,
            " TODO CODEMOD\n\n",
        );
    });

    /**
     * only utils below:
     */

    function isAttributeOfCUIButton<T>(path: ASTPath<T>): boolean {
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
            ((path.node as unknown) as { type: string }).type === "JSXIdentifier" && // TODO TS
            importNamesOfCUIButton.includes(pppName)
        );
    }

    function getImportNamesOfCUIButton(imports = getParsedImports(j, src)) {
        console.log({ imports });

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
            }
            if (specifiers.length > 1) {
                throw new Error("CUI Button imported multiple times (?)");
            }

            names.push(specifiers[0].importedAs);
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
    }
};
