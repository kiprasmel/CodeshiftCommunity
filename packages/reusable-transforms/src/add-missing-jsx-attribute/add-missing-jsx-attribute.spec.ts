import dedent from "ts-dedent";

import { inlineCommentPrefix } from "@codeshift/utils";
import { inlineTest } from "@codeshift/reusable-transforms/src/test-utils/inlineTest";

import { addMissingJsxProp } from "./add-missing-jsx-attribute";

/**
 * maybe one day syntax highlighting...
 */
const jsx = dedent;

describe("@pipedrive/convention-ui-react@5.0.0 add-missing-jsx-attribute transform", () => {
    inlineTest({
        transformer: addMissingJsxProp,
        config: {
            exportedAs: "Button",
            importedFrom: "lib",
            newAttributeName: "size",
            newAttributeValue: "big",
        },
        should: "add missing attribute 'size' with value 'big' for component 'Button', given attribute was missing",
        from: jsx`
    		import { Button } from "lib";

    		const btn1 = <Button unrelated="yes">123</Button>;
    	`,
        to: jsx`
    		import { Button } from "lib";

    		const btn1 = <Button unrelated="yes" size="big">123</Button>;
    	`,
    });

    inlineTest({
        transformer: addMissingJsxProp,
        config: {
            exportedAs: "Button",
            importedFrom: "lib",
            newAttributeName: "glow",
            newAttributeValue: true,
        },
        should:
            "add missing attribute 'glow' with value true (boolean) for component 'Button', given attribute was missing",
        from: jsx`
    		import { Button } from "lib";

    		const btn1 = <Button unrelated="yes">123</Button>;
    	`,
        to: jsx`
    		import { Button } from "lib";

    		const btn1 = <Button unrelated="yes" glow={true}>123</Button>;
    	`,
    });

    inlineTest({
        transformer: addMissingJsxProp,
        config: {
            exportedAs: "Button",
            importedFrom: "lib",
            newAttributeName: "size",
            newAttributeValue: "big",
        },
        should: "NOT add nor modify already-existing attribute 'size' for component 'Button'",
        from: jsx`
    		import { Button } from "lib";

    		const btn1 = <Button unrelated="yes" size="small">123</Button>;
    	`,
        to: jsx`
    		import { Button } from "lib";

    		const btn1 = <Button unrelated="yes" size="small">123</Button>;
    	`,
    });

    inlineTest({
        transformer: addMissingJsxProp,
        config: {
            exportedAs: "Button",
            importedFrom: "lib",
            newAttributeName: "translatedTitle",
            instructionsOnHowToManuallyAddAttributeBecauseCannotAutomate: "do beep boop.",
        },
        should: "add a comment with instructions on how to add the attribute manually",
        from: jsx`
    		import { Button } from "lib";

			const btn1 = <Button unrelated="yes">123</Button>;
    	`,
        to: jsx`
    		import { Button } from "lib";

			const btn1 = <Button
			  unrelated="yes"
			  /**

			  ${inlineCommentPrefix.trim()} MANUAL - cannot provide automatic new value "translatedTitle".
			  follow the instructions yourself:

			  do beep boop.

			  * */
			  translatedTitle={}>123</Button>;
    	`,
    });

    // que ota?
});
