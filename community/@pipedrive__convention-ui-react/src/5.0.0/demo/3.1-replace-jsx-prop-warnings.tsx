// @ts-nocheck

import { Button } from "@pipedrive/convention-ui-react";

/**
 * non-literal value
 */
const positive = "green";
const jsx1 = <Button color={positive}></Button>;

/**
 * dynamic value
 */
const panaOnVaja = true;
const jsx2 = <Button color={panaOnVaja ? "green" : "red"}></Button>;

/**
 * invalid (non-existing) value
 */
const jsx3 = <Button color="non-existing"></Button>;
