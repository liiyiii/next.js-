// src/components/TiptapEditor.tsx
'use client';

import React from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
// import { FontSize } from 'tiptap-extension-font-size'; // Custom or community extension might be needed for precise font size control beyond H1-H6

// Placeholder for a more specific font size extension if needed
// For now, StarterKit's Heading extension can provide some size variation.

interface TiptapEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  editorInstanceRef?: React.MutableRefObject<Editor | null>;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, editorInstanceRef }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable heading if you want more granular font size control via a separate extension
        heading: {
          levels: [1, 2, 3, 4], // Example: Allow H1-H4 for size variation
        },
        // Disable other default marks if they conflict or are not needed
        bold: {},
        italic: {},
        strike: {},
      }),
      TextStyle, // Required for FontFamily and Color to work
      Color,
      FontFamily.configure({
        types: ['textStyle'], // Apply font family to textStyle marks
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      // TODO: Research and add a robust FontSize extension if StarterKit headings aren't sufficient
      // For example, a custom mark or a community extension.
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
        attributes: {
            // Tailwind classes for basic editor styling
            class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none p-2 border border-gray-400 rounded-md min-h-[100px] bg-white text-black',
        },
    }
  });

  if (editorInstanceRef) {
    editorInstanceRef.current = editor;
  }

  if (!editor) {
    return null;
  }

  return (
    <EditorContent editor={editor} className="tiptap-editor-wrapper" />
  );
};

export default TiptapEditor;
