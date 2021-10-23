import { inlineTest } from "../../test-utils/inlineTest";
import { buttonColorToVariant } from "./button-color-to-variant";

describe("@pipedrive/convention-ui-react@5.0.0 buttonColorToVariant motion", () => {
    inlineTest({
        transformer: buttonColorToVariant,
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

    inlineTest({
        transformer: buttonColorToVariant,
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

    inlineTest({
        transformer: buttonColorToVariant,
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

    inlineTest({
        transformer: buttonColorToVariant,
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

    inlineTest({
        transformer: buttonColorToVariant,
        should:
            "convert CUI Buttons from color to variant, even when wrapped with styled()``, BUT should NOT convert non-CUI Buttons",
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

    inlineTest({
        transformer: buttonColorToVariant,
        should:
            "convert CUI Buttons from color to variant, even when wrapped with styled()``, BUT should NOT convert non-CUI Buttons, IN TYPESCRIPT",
        from: `
import { styled } from "styled";
import { NotCUIButton } from "somewhere-else";

import { Button as Btn } from "@pipedrive/convention-ui-react";

const btn: Btn = <Btn
	color="ghost"
	onClick={smartData}
	data-testid="block-smartdata"
	size="s"
>
	<Icon icon="upgrade" size="s" />
	{
		(translator as any).gettext<"lol">('Smart data')
	}
</Btn>

const StyledButton: ReturnType<typeof styled(Btn)> = styled(Btn)\`
	padding: 2px 4px;
\`;

const styledBtn: StyledButton = <StyledButton
	color="green"
>
	yeet
</StyledButton>

const notBtn: NotCUIButton = <NotCUIButton
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

const btn: Btn = <Btn
	variant="ghost"
	onClick={smartData}
	data-testid="block-smartdata"
	size="s"
>
	<Icon icon="upgrade" size="s" />
	{
		(translator as any).gettext<"lol">('Smart data')
	}
</Btn>

const StyledButton: ReturnType<typeof styled(Btn)> = styled(Btn)\`
	padding: 2px 4px;
\`;

const styledBtn: StyledButton = <StyledButton
	variant="green"
>
	yeet
</StyledButton>

const notBtn: NotCUIButton = <NotCUIButton
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
