#!/usr/bin/env ts-node-dev

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
/**
 * expected after transform (given current mappings):
 *
 * ```
 *      font: var(--font-body-s-font);
 *      font-size: var(--pd-font-title-xxl-font-size);
 *      font-family: var(--pd-font-monospace-font-family);
 *      color: var(--pd-color-fill-extra-strong);
 *      line-height: var(--pd-font-caption-s-line-height);
 *      padding-top: var(--pd-spacing-50);
 *      min-height: 16px;
 *      white-space: nowrap;
 *      overflow: hidden;
 *      text-overflow: ellipsis;
 * ```
 *
 */

const mappings = Object.assign({}, colors, fonts, spacings);

postcss([replaceSimpleVariables({ mappings })])
    .process(example1, { from: "example1" })
    .then(result => {
        console.log(result.css);
    });
