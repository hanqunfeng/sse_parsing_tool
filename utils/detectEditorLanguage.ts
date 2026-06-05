export type EditorLanguage = 'json' | 'text';

export const detectEditorLanguage = (text: string): EditorLanguage => {
  const leading = text.replace(/^\s+/, '');
  if (!leading) return 'text';

  if (leading.startsWith('event:') || leading.startsWith('data:')) {
    return 'text';
  }

  const firstChar = leading[0];
  if (firstChar === '{' || firstChar === '[') {
    return 'json';
  }

  return 'text';
};
