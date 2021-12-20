import dedent from "ts-dedent";

import { inlineTest } from "@codeshift/reusable-transforms/src/test-utils/inlineTest";

import { renameJsxComponent } from "./rename-jsx-component"; // TODO regroupImports

/**
 * TODO FIXME - instead of using specific configs (e.g. `buttonConfig`),
 * generalize to test behavior not specific to existing configs.
 */

/**
 * maybe one day syntax highlighting...
 */
const jsx = dedent;

describe("@pipedrive/convention-ui-react@5.0.0 rename-jsx-component transform", () => {
    inlineTest({
        transformer: renameJsxComponent,
        config: {
            exportedAs: "Old",
            newExportedAs: "New",
            importedFrom: "@bar/lib",
        },
        should: "rename component from Old to New, given that imported from @bar/lib, via import",
        from: jsx`
    		import { Old } from "@bar/lib";

    		const old1 = <Old />;
    	`,
        to: jsx`
    		import { New } from "@bar/lib";

    		const old1 = <New />;
    	`,
    });

    inlineTest({
        transformer: renameJsxComponent,
        config: {
            exportedAs: "Old",
            newExportedAs: "New",
            importedFrom: "@bar/lib",
        },
        should: "rename component from Old to New, given that imported from @bar/lib, via import, given aliased",
        from: jsx`
			import { Old as Kek } from "@bar/lib";

			const old1 = <Kek />;
		`,
        to: jsx`
			import { New } from "@bar/lib";

			const old1 = <New />;
		`,
    });

    inlineTest({
        transformer: renameJsxComponent,
        config: {
            exportedAs: "Old",
            newExportedAs: "New",
            importedFrom: "@bar/lib",
        },
        should: "rename component from Old to New, given that imported from @bar/lib via require",
        from: jsx`
			const { Old } = require("@bar/lib");

			const old1 = <Old />;
		`,
        to: jsx`
			const { New } = require("@bar/lib");

			const old1 = <New />;
		`,
    });

    inlineTest({
        transformer: renameJsxComponent,
        config: {
            exportedAs: "Old",
            newExportedAs: "New",
            importedFrom: "@bar/lib",
        },
        should: "rename component from Old to New, given that imported from @bar/lib via require, given aliased",
        from: jsx`
			const { Old: Syke } = require("@bar/lib");

			const old1 = <Syke />;
		`,
        to: jsx`
			const { New } = require("@bar/lib");

			const old1 = <New />;
		`,
    });

    // que ota?
});
