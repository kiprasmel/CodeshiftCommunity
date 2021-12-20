# Automated migration with Codemods <!-- omit in toc -->

## Obligatory

CUI Codemods are still in active development. If you're already migrating, you can use them to assist you - they
_should_ work<!-- just fine; they just won't be as powerful as intended, yet -->.

Mind that codemods won't cover 100% of cases. Some limitations are still being worked on; others will _forever_ stay
with the WONTFIX status.<br />Below, descriptions of each codemod (transform) have extra info about this.

The best way to track progress (or to try out the not-yet-released features, if one dares) is to follow the code - see
some [open PRs](https://github.com/pipedrive/CodeshiftCommunity/pulls?q=is:pr+is:open+sort:updated-desc) on github.

## Where to ask for help

For general migration help, use the [#migration-help-cui4-to-cui5](https://pipedrive.slack.com/archives/C02LK8Y583D)
slack channel. <br /> (!) For codemods-specific problems, consider
[creating an issue](https://github.com/pipedrive/CodeshiftCommunity/issues/new) on github (soon™️) & only linking to it
in slack.

It's good to search for an existing question/issue before posting your own.

## Usage

### 1. Setup (needed once)

```sh
git clone https://github.com/pipedrive/CodeshiftCommunity.git
# or:  git clone git@github.com:pipedrive/CodeshiftCommunity.git

cd CodeshiftCommunity/

yarn
```

### 2. Run

Verify you don't have uncommitted changes, since it'll be hard(er) to differentiate afterwards.

<!--
	TODO get rid of the above sentence by checking this in the run.js file
-->

```sh
./run.js flow cui5 ../path/to/project/src/
```

Optionally, explore the [run.js script](https://github.com/pipedrive/CodeshiftCommunity/blob/fork/run.js) to see how it
works.

TL;DR:

-   `flow` is the parser; you'll always use this one.

    -   If you want to learn more on how it works, you can watch the "How codemods work - from first principles, w/
        sprinkles of jscodeshift" video (soon™️).

-   `cui5` is the path to a codemod, or a shorthand for it (like in this case), which comes from the
    [shorthands.json](https://github.com/pipedrive/CodeshiftCommunity/blob/fork/shorthands.json) file.
    -   in general, multiple paths/shorthands can be specified, separated by commas `,` - useful if you'd want to run
        only a few transforms instead of the whole codemod (soon™️).

## Terminology

-   _Transform (noun) / transformer_ - a javascript function that, when called, modifies other code. Usually has 1
    specific purpose.
-   _Codemod (noun)_ - a combination of transforms. Transforms are called one after another, for each file.
<!-- TODO source for the last sentence's statement -->

## Supported migrations (grouped by transformer)

### 1. transformer "`replace-jsx-attribute`"

Transforms component props and values (attributes), as described in the
[Migrating from CUI4](https://cui.pipedrive.tools/v5/?path=/docs/migrating-from-cui4-components) guide.

-   Transform's implementation:
    [now](https://github.com/pipedrive/CodeshiftCommunity/blob/extraction-6-create-4th-transform-rename-style-tokens/packages/reusable-transforms/src/replace-jsx-attribute/replace-jsx-attribute.ts)
    (while not merged),
    [soon™️](https://github.com/pipedrive/CodeshiftCommunity/blob/fork/packages/reusable-transforms/src/replace-jsx-attribute/replace-jsx-attribute.ts)
    (when merged).

-   Transform's CUI-specific configs:
    [now](https://github.com/pipedrive/CodeshiftCommunity/blob/extraction-6-create-4th-transform-rename-style-tokens/community/@pipedrive__convention-ui-react/src/5.0.0/replace-jsx-attribute.config.cui-specific.ts)
    &
    [soon](https://github.com/pipedrive/CodeshiftCommunity/blob/fork/community/@pipedrive__convention-ui-react/src/5.0.0/replace-jsx-attribute.config.cui-specific.ts).

#### 1.1 React component props & values (attributes)

<!--
from, to, diff:

```jsx
import { Button } from '@pipedrive/convention-ui-react';

function SomeComponent() {
	return <Button color="green">Click me</Button>;
}
```

```jsx
import { Button } from '@pipedrive/convention-ui-react';

function SomeComponent() {
	return <Button variant="active">Click me</Button>;
}
```
 -->

```diff
 import { Button } from '@pipedrive/convention-ui-react';

 function SomeComponent() {
-       return <Button color="green">Click me</Button>;
+       return <Button variant="active">Click me</Button>;
 }
```

<!--
	TODO more examples of prop-based shananigans, even tho not exactly related?
-->

### 2. transformer "`rename-jsx-component`"

<!-- #### n.1 -->

<!--
from, to, diff:

```jsx
import { Toggle } from '@pipedrive/convention-ui-react';

function SomeComponent() {
	return <Toggle />;
}
```

```jsx
import { Switch } from '@pipedrive/convention-ui-react';

function SomeComponent() {
	return <Switch />;
}
```
 -->

```diff
-import { Toggle } from '@pipedrive/convention-ui-react';
+import { Switch } from '@pipedrive/convention-ui-react';

 function SomeComponent() {
-       return <Toggle />;
+       return <Switch />;
 }
```

### 3. transformer "`add-missing-jsx-attribute`"

<!-- #### npp.1 -->

<!--
from, to, diff:

```jsx
import { Panel } from '@pipedrive/convention-ui-react';

function SomeComponent() {
	return <Panel />;
}
```

```jsx
import { Panel } from '@pipedrive/convention-ui-react';

function SomeComponent() {
	return <Panel radius="s" />;
}
```
 -->

```diff
 import { Panel } from '@pipedrive/convention-ui-react';

 function SomeComponent() {
-       return <Panel />;
+       return <Panel radius="s" />;
 }
```

<!-- ### npp. transformer "``"

#### npp.1 -->

### 4. transformer "`rename-style-tokens`"

<!-- TODO links -->

#### 4.1 Design tokens - AMD JS variables

Replace usages of `@pipedrive/convention-ui-css/dist/amd/*.js` with `@pipedrive/convention-ui-react/dist/tokens`.

<!--
from, to, diff:

```jsx
import styled from 'styled-components';

import colors from '@pipedrive/convention-ui-css/dist/amd/colors.js';
import elevations from '@pipedrive/convention-ui-css/dist/amd/elevations.js';
import fonts from '@pipedrive/convention-ui-css/dist/amd/fonts.js';
import spacings from '@pipedrive/convention-ui-css/dist/amd/spacings.js';

export const Foo = styled.div`
	color: ${colors['$color-black-hex']};
	font: ${fonts['$font-body']};
	box-shadow: ${elevations['$elevation-01']};
	padding: ${spacings['$spacing-m']};
`;
```

```jsx
import styled from 'styled-components';

import { colors, elevations, fonts, spacings } from '@pipedrive/convention-ui-react/dist/tokens';

export const Foo = styled.div`
	color: ${colors.textPrimary};
	font: ${fonts.fontBodyFont};
	box-shadow: ${elevations.raised};
	padding: ${spacings.spacing200};
`;
```
 -->

```diff
 import styled from 'styled-components';

-import colors from '@pipedrive/convention-ui-css/dist/amd/colors.js';
-import elevations from '@pipedrive/convention-ui-css/dist/amd/elevations.js';
-import fonts from '@pipedrive/convention-ui-css/dist/amd/fonts.js';
-import spacings from '@pipedrive/convention-ui-css/dist/amd/spacings.js';
+import { colors, elevations, fonts, spacings } from '@pipedrive/convention-ui-react/dist/tokens';

 export const Foo = styled.div`
-       color: ${colors['$color-black-hex']};
+       color: ${colors.textPrimary};
-       font: ${fonts['$font-body']};
+       font: ${fonts.fontBodyFont};
-       box-shadow: ${elevations['$elevation-01']};
+       box-shadow: ${elevations.raised};
-       padding: ${spacings['$spacing-m']};
+       padding: ${spacings.spacing200};
 `;
```

#### 4.2 Design tokens - JSON variables

Replace usages of `@pipedrive/convention-ui-css/dist/json/*.json` with `@pipedrive/convention-ui-react/dist/tokens`.

<!--
from, to, diff:

```jsx
import styled from 'styled-components';

import colors from '@pipedrive/convention-ui-css/dist/json/colors.json';
import elevations from '@pipedrive/convention-ui-css/dist/json/elevations.json';
import fonts from '@pipedrive/convention-ui-css/dist/json/fonts.json';
import spacings from '@pipedrive/convention-ui-css/dist/json/spacings.json';

export const Foo = styled.div`
	color: ${colors['$color-black-hex']};
	font: ${fonts['$font-body']};
	box-shadow: ${elevations['$elevation-01']};
	padding: ${spacings['$spacing-m']};
`;
```

```jsx
import styled from 'styled-components';

import { colors, elevations, fonts, spacings } from '@pipedrive/convention-ui-react/dist/tokens';

export const Foo = styled.div`
	color: ${colors.textPrimary};
	font: ${fonts.fontBodyFont};
	box-shadow: ${elevations.raised};
	padding: ${spacings.spacing200};
`;
```
 -->

```diff
 import styled from 'styled-components';

-import colors from '@pipedrive/convention-ui-css/dist/json/colors.json';
-import elevations from '@pipedrive/convention-ui-css/dist/json/elevations.json';
-import fonts from '@pipedrive/convention-ui-css/dist/json/fonts.json';
-import spacings from '@pipedrive/convention-ui-css/dist/json/spacings.json';
+import { colors, elevations, fonts, spacings } from '@pipedrive/convention-ui-react/dist/tokens';

 export const Foo = styled.div`
-       color: ${colors['$color-black-hex']};
+       color: ${colors.textPrimary};
-       font: ${fonts['$font-body']};
+       font: ${fonts.fontBodyFont};
-       box-shadow: ${elevations['$elevation-01']};
+       box-shadow: ${elevations.raised};
-       padding: ${spacings['$spacing-m']};
+       padding: ${spacings.spacing200};
 `;
```

#### 4.3 Design tokens - JSON variables (conventioned)

Replace usages of `@pipedrive/convention-ui-css/dist/json/*-conventioned.json` with
`@pipedrive/convention-ui-react/dist/tokens`.

<!--
from, to, diff:

```jsx
import styled from 'styled-components';

import colors from '@pipedrive/convention-ui-css/dist/json/colors-conventioned.json';
import elevations from '@pipedrive/convention-ui-css/dist/json/elevations-conventioned.json';
import fonts from '@pipedrive/convention-ui-css/dist/json/fonts-conventioned.json';
import spacings from '@pipedrive/convention-ui-css/dist/json/spacings-conventioned.json';

export const Foo = styled.div`
	color: ${colors.black};
	font: ${fonts.fontBody};
	box-shadow: ${elevations.elevation01};
	padding: ${spacings.spacingM};
`;
```

```jsx
import styled from 'styled-components';

import { colors, elevations, fonts, spacings } from '@pipedrive/convention-ui-react/dist/tokens';

export const Foo = styled.div`
	color: ${colors.textPrimary};
	font: ${fonts.fontBodyFont};
	box-shadow: ${elevations.raised};
	padding: ${spacings.spacing200};
`;
```
 -->

```diff
 import styled from 'styled-components';

-import colors from '@pipedrive/convention-ui-css/dist/json/colors-conventioned.json';
-import elevations from '@pipedrive/convention-ui-css/dist/json/elevations-conventioned.json';
-import fonts from '@pipedrive/convention-ui-css/dist/json/fonts-conventioned.json';
-import spacings from '@pipedrive/convention-ui-css/dist/json/spacings-conventioned.json';
+import { colors, elevations, fonts, spacings } from '@pipedrive/convention-ui-react/dist/tokens';

 export const Foo = styled.div`
-       color: ${colors.black};
+       color: ${colors.textPrimary};
-       font: ${fonts.fontBody};
+       font: ${fonts.fontBodyFont};
-       box-shadow: ${elevations.elevation01};
+       box-shadow: ${elevations.raised};
-       padding: ${spacings.spacingM};
+       padding: ${spacings.spacing200};
 `;
```

#### 4.4 Design tokens - JS variables

Replace usages of `@pipedrive/convention-ui-css/dist/js/variables` with `@pipedrive/convention-ui-react/dist/tokens`.

<!--
from, to, diff:

```jsx
import styled from 'styled-components';

import { colors, elevations, fonts, spacings } from '@pipedrive/convention-ui-css/dist/js/variables';

export const Foo = styled.div`
	color: ${colors.black};
	font: ${fonts.fontBody};
	box-shadow: ${elevations.elevation01};
	padding: ${spacings.spacingM};
`;
```

```jsx
import styled from 'styled-components';

import { colors, elevations, fonts, spacings } from '@pipedrive/convention-ui-react/dist/tokens';

export const Foo = styled.div`
	color: ${colors.textPrimary};
	font: ${fonts.fontBodyFont};
	box-shadow: ${elevations.raised};
	padding: ${spacings.spacing200};
`;
```
 -->

```diff
 import styled from 'styled-components';

-import { colors, elevations, fonts, spacings } from '@pipedrive/convention-ui-css/dist/js/variables';
+import { colors, elevations, fonts, spacings } from '@pipedrive/convention-ui-react/dist/tokens';

 export const Foo = styled.div`
-       color: ${colors.black};
+       color: ${colors.textPrimary};
-       font: ${fonts.fontBody};
+       font: ${fonts.fontBodyFont};
-       box-shadow: ${elevations.elevation01};
+       box-shadow: ${elevations.raised};
-       padding: ${spacings.spacingM};
+       padding: ${spacings.spacing200};
 `;
```

### 5. transformer "`postcss-replace-simple-variables`"

#### 5.1 Design tokens - PostCSS

Replace usages of `@pipedrive/convention-ui-css/dist/postcss/*.postcss` with CUI5 CSS variables.

From:

```scss
@import '@pipedrive/convention-ui-css/dist/postcss/colors.postcss';
@import '@pipedrive/convention-ui-css/dist/postcss/elevations.postcss';
@import '@pipedrive/convention-ui-css/dist/postcss/fonts.postcss';
@import '@pipedrive/convention-ui-css/dist/postcss/spacings.postcss';

.modal   {
	color: $color-black-hex;
	font: $font-body;
	box-shadow: $elevation-01;
	padding: $spacing-m;
}
```

From (alternative):

```scss
@import '@pipedrive/convention-ui-css/dist/postcss/config.postcss';

.modal   {
	color: $color-black-hex;
	font: $font-body;
	box-shadow: $elevation-01;
	padding: $spacing-m;
}
```

To:

```scss
.modal {
	color: var(--pd-color-text-primary);
	font: var(--pd-font-body-font);
	box-shadow: var(--pd-elevation-raised);
	padding: var(--pd-spacing-200);
}
```

#### 5.2 Design tokens - SCSS

Replace usages of `@pipedrive/convention-ui-css/dist/scss/*.scss` with CUI5 CSS variables.

From:

```scss
@import '@pipedrive/convention-ui-css/dist/scss/colors.scss';
@import '@pipedrive/convention-ui-css/dist/scss/elevations.scss';
@import '@pipedrive/convention-ui-css/dist/scss/fonts.scss';
@import '@pipedrive/convention-ui-css/dist/scss/spacings.scss';

.modal   {
	color: $color-black-hex;
	font: $font-body;
	box-shadow: $elevation-01;
	padding: $spacing-m;
}
```

From (alternative):

```scss
@import '@pipedrive/convention-ui-css/dist/scss/config.scss';

.modal   {
	color: $color-black-hex;
	font: $font-body;
	box-shadow: $elevation-01;
	padding: $spacing-m;
}
```

To:

```scss
.modal {
	color: var(--pd-color-text-primary);
	font: var(--pd-font-body-font);
	box-shadow: var(--pd-elevation-raised);
	padding: var(--pd-spacing-200);
}
```
