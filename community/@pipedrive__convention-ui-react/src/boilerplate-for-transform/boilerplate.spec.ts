import dedent from "ts-dedent";
import { inlineTest } from "@codeshift/reusable-transforms/src/test-utils/inlineTest";

import { doSomething } from "./boilerplate"; // TODO regroupImports

/**
 * maybe one day syntax highlighting...
 */
const jsx = dedent;

describe("@pipedrive/cui5 _boilerplate transform", () => {
    inlineTest({
        transformer: doSomething,
        should: "where the Button is used, renames Button's attribute (property) from color to variant",
        from: jsx`
			const Button = ({ color, children }) => {
				return <button style={{ color }}>{children}</button>
			}

			const someNiceJsx = <Button color="green"> Click Me <Button/>;
		`,
        to: jsx`
			const Button = ({ color, children }) => {
				return <button style={{ color }}>{children}</button>
			}

			const someNiceJsx = <Button variant="green"> Click Me <Button/>;
		`,
    });

    // que ota?
});
