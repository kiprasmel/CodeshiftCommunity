import core from "jscodeshift";

export const fontFamilyToBodyFontFamily = (j: core.JSCodeshift, src: ReturnType<typeof j>) => {
    src.find(j.MemberExpression).forEach(path => {
        console.log("v1 fontFamily -> bodyFontFamily", path);

        //j(path).replaceWith('nope')
        if (
            path.node.object &&
            (path.node.object as { name: string }).name === "fonts" && // TODO TS
            path.node.property &&
            (path.node.property as { name: string }).name === "fontFamily" // TODO TS
        ) {
            console.log("matched");
            j(path).replaceWith(j.memberExpression(path.node.object, j.identifier("bodyFontFamily")));
        }
    });

    /*
  root
    .find(j.Identifier, { 
      callee: {
        type: "MemberExpression",
       	object: {
          name: "fonts" 
        },
        property: {
          name: "fontFamily"
        }
      }
    }) //
    .forEach((path) => {
    	console.log("fontFamily -> bodyFontFamily", path);
    
      if (path.node.name === "fontFamily") {
        j(path).replaceWith(
          ""
        )
      }
    });
  */
};

/*


const fonts = {
  fontFamily: "lmao",
  bodyFontFamily: "kek",
  bar: "xd",
};

const styled = {
  div: () => {}
}

styled.div`
	font-family: ${fonts.fontFamily};
	foo: ${fonts.bar};
`;

*/
