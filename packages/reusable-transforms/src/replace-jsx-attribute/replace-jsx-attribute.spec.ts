import { inlineTest } from "../test-utils/inlineTest";
import { replaceJsxAttribute } from "./replace-jsx-attribute";

import { ConfigToModifyJSXAttributeAndItsValue } from "./replace-jsx-attribute.config";

import { buttonConfig } from "../../../../community/@pipedrive__convention-ui-react/src/5.0.0/replace-jsx-attribute.config.cui-specific";

/**
 * TODO FIXME - instead of using specific configs (e.g. `buttonConfig`),
 * generalize to test behavior not specific to existing configs.
 */

describe("@pipedrive/convention-ui-react@5.0.0 replace-jsx-attribute tranform", () => {
    inlineTest<ConfigToModifyJSXAttributeAndItsValue>({
        transformer: replaceJsxAttribute,
        config: buttonConfig, // TODO FIXME
        should: "convert cjs-imported CUI Button from color to variant",
        from: `
const { Button } = require("@pipedrive/convention-ui-react");

const btn = <Button
	color="ghost"
	size="s"
>
	hi
</Button>

		`,
        to: `
const { Button } = require("@pipedrive/convention-ui-react");

const btn = <Button
	variant="ghost"
	size="s"
>
	hi
</Button>

		`,
    });

    inlineTest<ConfigToModifyJSXAttributeAndItsValue>({
        transformer: replaceJsxAttribute,
        config: buttonConfig, // TODO FIXME
        should: "convert regularly-imported CUI Button from color to variant",
        from: `
import { Button } from "@pipedrive/convention-ui-react";

const btn = <Button
	color="ghost"
	size="s"
>
	hi
</Button>

		`,
        to: `
import { Button } from "@pipedrive/convention-ui-react";

const btn = <Button
	variant="ghost"
	size="s"
>
	hi
</Button>

		`,
    });

    inlineTest<ConfigToModifyJSXAttributeAndItsValue>({
        transformer: replaceJsxAttribute,
        config: buttonConfig, // TODO FIXME
        should: "convert alias-like-imported CUI Button from color to variant",
        from: `
import { Button as CUIButton } from "@pipedrive/convention-ui-react";

const btn = <CUIButton
	color="ghost"
	size="s"
>
	hi
</CUIButton>

		`,
        to: `
import { Button as CUIButton } from "@pipedrive/convention-ui-react";

const btn = <CUIButton
	variant="ghost"
	size="s"
>
	hi
</CUIButton>

		`,
    });

    inlineTest<ConfigToModifyJSXAttributeAndItsValue>({
        transformer: replaceJsxAttribute,
        config: buttonConfig, // TODO FIXME
        should: "NOT convert a non-CUI regularly-imported Button from color to variant",
        fromTo: `
import { Button } from "@someone/cool-repo";

const btn = <Button
	color="ghost"
	size="s"
>
	hi
</Button>

		`,
    });

    inlineTest<ConfigToModifyJSXAttributeAndItsValue>({
        transformer: replaceJsxAttribute,
        config: buttonConfig, // TODO FIXME
        should: "NOT convert a non-CUI alias-like-imported Button from color to variant",
        fromTo: `
import { Button as ActuallyNotCUIButton } from "@someone/cool-repo";

const btn = <ActuallyNotCUIButton
	color="ghost"
	size="s"
>
	hi
</ActuallyNotCUIButton>

		`,
    });

    /**
     * TODO ENABLE when we support styled()`` wraps
     */

    //     inlineTest<ConfigToModifyJSXAttributeAndItsValue>({
    //         transformer: replaceJsxAttribute,
    //         config: buttonConfig, // TODO FIXME
    //         should:
    //             "convert CUI Buttons from color to variant, even when wrapped with styled()``, BUT should NOT convert non-CUI Buttons",
    //         from: `
    // import { styled } from "styled";
    // import { NotCUIButton } from "somewhere-else";

    // import { Button as Btn } from "@pipedrive/convention-ui-react";

    // const btn = <Btn
    // 	color="ghost"
    // 	onClick={smartData}
    // 	data-testid="block-smartdata"
    // 	size="s"
    // >
    // 	<Icon icon="upgrade" size="s" />
    // 	{
    // 		translator.gettext('Smart data')
    // 	}
    // </Btn>

    // const StyledButton = styled(Btn)\`
    // 	padding: 2px 4px;
    // \`;

    // const styledBtn = <StyledButton
    // 	color="green"
    // >
    // 	yeet
    // </StyledButton>

    // const notBtn = <NotCUIButton
    // 	color="dont-change-me-haha"
    // 	onClick={smartData}
    // 	data-testid="block-smartdata"
    // 	size="s"
    // >
    // 	<Icon icon="upgrade" size="s" />
    // 	{
    // 		translator.gettext('Smart data')
    // 	}
    // </NotCUIButton>

    // 		`,
    //         to: `
    // import { styled } from "styled";
    // import { NotCUIButton } from "somewhere-else";

    // import { Button as Btn } from "@pipedrive/convention-ui-react";

    // const btn = <Btn
    // 	variant="ghost"
    // 	onClick={smartData}
    // 	data-testid="block-smartdata"
    // 	size="s"
    // >
    // 	<Icon icon="upgrade" size="s" />
    // 	{
    // 		translator.gettext('Smart data')
    // 	}
    // </Btn>

    // const StyledButton = styled(Btn)\`
    // 	padding: 2px 4px;
    // \`;

    // const styledBtn = <StyledButton
    // 	variant="green"
    // >
    // 	yeet
    // </StyledButton>

    // const notBtn = <NotCUIButton
    // 	color="dont-change-me-haha"
    // 	onClick={smartData}
    // 	data-testid="block-smartdata"
    // 	size="s"
    // >
    // 	<Icon icon="upgrade" size="s" />
    // 	{
    // 		translator.gettext('Smart data')
    // 	}
    // </NotCUIButton>

    // 		`,
    //     });

    //     inlineTest<ConfigToModifyJSXAttributeAndItsValue>({
    //         transformer: replaceJsxAttribute,
    //         config: buttonConfig, // TODO FIXME
    //         should:
    //             "convert CUI Buttons from color to variant, even when wrapped with styled()``, BUT should NOT convert non-CUI Buttons, IN TYPESCRIPT",
    //         from: `
    // import { styled } from "styled";
    // import { NotCUIButton } from "somewhere-else";

    // import { Button as Btn } from "@pipedrive/convention-ui-react";

    // const btn: Btn = <Btn
    // 	color="ghost"
    // 	onClick={smartData}
    // 	data-testid="block-smartdata"
    // 	size="s"
    // >
    // 	<Icon icon="upgrade" size="s" />
    // 	{
    // 		(translator as any).gettext<"lol">('Smart data')
    // 	}
    // </Btn>

    // const StyledButton: ReturnType<typeof styled(Btn)> = styled(Btn)\`
    // 	padding: 2px 4px;
    // \`;

    // const styledBtn: StyledButton = <StyledButton
    // 	color="green"
    // >
    // 	yeet
    // </StyledButton>

    // const notBtn: NotCUIButton = <NotCUIButton
    // 	color="dont-change-me-haha"
    // 	onClick={smartData}
    // 	data-testid="block-smartdata"
    // 	size="s"
    // >
    // 	<Icon icon="upgrade" size="s" />
    // 	{
    // 		translator.gettext('Smart data')
    // 	}
    // </NotCUIButton>

    // 		`,
    //         to: `
    // import { styled } from "styled";
    // import { NotCUIButton } from "somewhere-else";

    // import { Button as Btn } from "@pipedrive/convention-ui-react";

    // const btn: Btn = <Btn
    // 	variant="ghost"
    // 	onClick={smartData}
    // 	data-testid="block-smartdata"
    // 	size="s"
    // >
    // 	<Icon icon="upgrade" size="s" />
    // 	{
    // 		(translator as any).gettext<"lol">('Smart data')
    // 	}
    // </Btn>

    // const StyledButton: ReturnType<typeof styled(Btn)> = styled(Btn)\`
    // 	padding: 2px 4px;
    // \`;

    // const styledBtn: StyledButton = <StyledButton
    // 	variant="green"
    // >
    // 	yeet
    // </StyledButton>

    // const notBtn: NotCUIButton = <NotCUIButton
    // 	color="dont-change-me-haha"
    // 	onClick={smartData}
    // 	data-testid="block-smartdata"
    // 	size="s"
    // >
    // 	<Icon icon="upgrade" size="s" />
    // 	{
    // 		translator.gettext('Smart data')
    // 	}
    // </NotCUIButton>

    // 		`,
    //     });
});
