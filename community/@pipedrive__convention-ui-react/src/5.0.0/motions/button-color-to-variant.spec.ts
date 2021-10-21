import { inlineTest } from "../../test-utils/inlineTest";
import { buttonColorToVariant } from "./button-color-to-variant";

describe("@pipedrive/convention-ui-react@5.0.0 buttonColorToVariant motion", () => {
    inlineTest({
        transformer: buttonColorToVariant,
        should: "convert CUI Buttons from color to variant, BUT should NOT convert non-CUI Buttons",
        from: `
import { styled } from "styled";
import { NotCUIButton } from "somewhere-else";

import { Button as Btn } from "@pipedrive/convention-ui-react";

const btn = <Btn
	color="ghost"
	onClick={smartData}
	data-testid="block-smartdata"
	size="s"
>
	<Icon icon="upgrade" size="s" />
	{
		translator.gettext('Smart data')
	}
</Btn>

const StyledButton = styled(Btn)\`
	padding: 2px 4px;
\`;

const styledBtn = <StyledButton
	color="green"
>
	yeet
</StyledButton>

const notBtn = <NotCUIButton
	color="dont-change-me-haha"
	onClick={smartData}
	data-testid="block-smartdata"
	size="s"
>
	<Icon icon="upgrade" size="s" />
	{
		translator.gettext('Smart data')
	}
</NotCUIButton>
		
		`,
        to: `
import { styled } from "styled";
import { NotCUIButton } from "somewhere-else";

import { Button as Btn } from "@pipedrive/convention-ui-react";

const btn = <Btn
	variant="ghost"
	onClick={smartData}
	data-testid="block-smartdata"
	size="s"
>
	<Icon icon="upgrade" size="s" />
	{
		translator.gettext('Smart data')
	}
</Btn>

const StyledButton = styled(Btn)\`
	padding: 2px 4px;
\`;

const styledBtn = <StyledButton
	variant="green"
>
	yeet
</StyledButton>

const notBtn = <NotCUIButton
	color="dont-change-me-haha"
	onClick={smartData}
	data-testid="block-smartdata"
	size="s"
>
	<Icon icon="upgrade" size="s" />
	{
		translator.gettext('Smart data')
	}
</NotCUIButton>

		`,
    });
});
