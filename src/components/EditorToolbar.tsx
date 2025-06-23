// src/components/EditorToolbar.tsx
'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Highlight as HighlightIcon, Pilcrow,
  List, ListOrdered, Palette, CaseSensitive, PilcrowLeft, PilcrowRight, RemoveFormatting, Undo, Redo, Heading1, Heading2, Heading3, Heading4
} from 'lucide-react'; // Using Pilcrow for Paragraph, CaseSensitive for Font Family

interface EditorToolbarProps {
  editor: Editor | null;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const fontFamilies = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS'];
  const colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#808080', '#ffffff']; // Basic colors + white for highlight

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-600 rounded-md mb-2">
      {/* Basic Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-purple-500' : 'bg-gray-500'} hover:bg-purple-400 disabled:opacity-50`}
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-purple-500' : 'bg-gray-500'} hover:bg-purple-400 disabled:opacity-50`}
        title="Italic"
      >
        <Italic size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded ${editor.isActive('underline') ? 'bg-purple-500' : 'bg-gray-500'} hover:bg-purple-400 disabled:opacity-50`}
        title="Underline"
      >
        <Underline size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded ${editor.isActive('strike') ? 'bg-purple-500' : 'bg-gray-500'} hover:bg-purple-400 disabled:opacity-50`}
        title="Strikethrough"
      >
        <Strikethrough size={18} />
      </button>

      {/* Headings for Font Size (Simplified) */}
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-purple-500' : 'bg-gray-500'} hover:bg-purple-400`} title="H1"><Heading1 size={18}/></button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-purple-500' : 'bg-gray-500'} hover:bg-purple-400`} title="H2"><Heading2 size={18}/></button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-purple-500' : 'bg-gray-500'} hover:bg-purple-400`} title="H3"><Heading3 size={18}/></button>
       <button onClick={() => editor.chain().focus().setParagraph().run()} className={`p-1.5 rounded ${editor.isActive('paragraph') ? 'bg-purple-500' : 'bg-gray-500'} hover:bg-purple-400`} title="Paragraph"><Pilcrow size={18}/></button>


      {/* Font Family */}
      <Select
        onValueChange={(value) => editor.chain().focus().setFontFamily(value).run()}
        value={editor.isActive('textStyle') ? editor.getAttributes('textStyle').fontFamily || 'Arial' : 'Arial'}
      >
        <SelectTrigger className="p-1.5 h-auto bg-gray-500 border-gray-500 text-white hover:bg-purple-400 w-auto text-xs min-w-[100px]" title="Font Family">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent className="bg-gray-600 text-white border-gray-500">
          {fontFamilies.map(font => (
            <SelectItem key={font} value={font} className="hover:bg-purple-500 focus:bg-purple-500 text-xs">
              <span style={{ fontFamily: font }}>{font}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Text Color */}
       <label htmlFor="text-color-picker" className="p-1.5 rounded bg-gray-500 hover:bg-purple-400 cursor-pointer" title="Text Color">
        <Palette size={18} />
      </label>
      <input
        id="text-color-picker"
        type="color"
        onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
        value={editor.getAttributes('textStyle').color || '#000000'}
        className="w-0 h-0 opacity-0 absolute"
      />


      {/* Highlight Color */}
      <label htmlFor="highlight-color-picker" className="p-1.5 rounded bg-gray-500 hover:bg-purple-400 cursor-pointer" title="Highlight Color">
        <HighlightIcon size={18} />
      </label>
      <input
        id="highlight-color-picker"
        type="color"
        onInput={(event) => editor.chain().focus().toggleHighlight({ color: (event.target as HTMLInputElement).value }).run()}
        value={editor.isActive('highlight') ? editor.getAttributes('highlight').color || '#ffff00' : '#ffff00'}
         className="w-0 h-0 opacity-0 absolute"
      />
       <button onClick={() => editor.chain().focus().unsetHighlight().run()} disabled={!editor.isActive('highlight')} className="p-1.5 rounded bg-gray-500 hover:bg-purple-400 disabled:opacity-50" title="Remove Highlight">
        <HighlightIcon size={18} className="opacity-50"/>
      </button>


      {/* Lists */}
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded ${editor.isActive('bulletList') ? 'bg-purple-500' : 'bg-gray-500'} hover:bg-purple-400`} title="Bullet List"><List size={18}/></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded ${editor.isActive('orderedList') ? 'bg-purple-500' : 'bg-gray-500'} hover:bg-purple-400`} title="Ordered List"><ListOrdered size={18}/></button>

      {/* Alignment (Requires TextAlign extension) */}
      {/* <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}><PilcrowLeft size={18}/></button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}><Pilcrow size={18}/></button>
      <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}><PilcrowRight size={18}/></button> */}

      {/* Undo/Redo */}
      <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1.5 rounded bg-gray-500 hover:bg-purple-400 disabled:opacity-50" title="Undo"><Undo size={18}/></button>
      <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 rounded bg-gray-500 hover:bg-purple-400 disabled:opacity-50" title="Redo"><Redo size={18}/></button>

      <button onClick={() => editor.chain().focus().unsetAllMarks().run()} className="p-1.5 rounded bg-gray-500 hover:bg-purple-400" title="Clear Formatting"><RemoveFormatting size={18}/></button>
    </div>
  );
};

export default EditorToolbar;
