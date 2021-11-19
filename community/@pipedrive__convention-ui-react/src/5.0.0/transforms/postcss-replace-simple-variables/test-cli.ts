import postcss from "postcss";

import * as colors from "./test-mappings/colors.json";
import * as fonts from "./test-mappings/fonts.json";
import * as spacings from "./test-mappings/spacings.json";
import replaceSimpleVariables from "./index";

const example1 = `
	font: $font-body-s;
	font-size: $font-size-xxl;
	font-family: $font-family-monospace;
	color: $color-black-hex-64;
	line-height: $line-height-xs;
	padding-top: $spacing-xs;
	min-height: 16px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const mappings = Object.assign({}, colors, fonts, spacings);

postcss([replaceSimpleVariables({ mappings })])
    .process(example1, { from: "example1" })
    .then(result => {
        console.log(result.css);
    });
