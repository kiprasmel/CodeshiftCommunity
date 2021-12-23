import core, { ASTNode } from 'jscodeshift';
import { Collection } from 'jscodeshift/src/Collection';

function clean(value: string) {
  return value
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/^[ \t]*/gm, '')
    .trim();
}

export const inlineCommentPrefix = `\n\nTODO: CODEMOD` as const;

export function insertCommentBefore<NodeType = ASTNode>(
  j: core.JSCodeshift,
  path: Collection<NodeType>,
  message: string,
  prefix: string = ` TODO: (@codeshift)`,
  beforeOrAfter: 'before' | 'after' = 'before',
) {
  const content = `${prefix} ${clean(message)} `;

  path.forEach(path => {
    // @ts-ignore
    path.value.comments = path.value.comments || [];

    // @ts-ignore
    const exists = path.value.comments.find(
      // @ts-ignore
      comment => comment.value === content,
    );

    // avoiding duplicates of the same comment
    if (exists) return;

    // @ts-ignore
    path.value.comments.push(
      j.commentBlock(
        content,
        beforeOrAfter === 'before',
        beforeOrAfter === 'after',
      ),
    );
  });
}

export function insertMultilineComment<NodeType = any>(
  j: core.JSCodeshift,
  path: Collection<NodeType>,
  message: string,
  prefix: string = inlineCommentPrefix.trim(),
  beforeOrAfter: 'before' | 'after' = 'before',
) {
  insertCommentBefore(
    j, //
    path,
    message + '\n\n*',
    '*\n\n' + prefix,
    beforeOrAfter,
  );
}

export function insertCommentToStartOfFile<NodeType = any>(
  j: core.JSCodeshift,
  path: Collection<NodeType>,
  message: string,
) {
  insertCommentBefore(j, path.find(j.Program), message);
}
