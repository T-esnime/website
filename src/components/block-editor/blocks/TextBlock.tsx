import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { ContentBlock, TextMetadata, TextAlignment } from '../types';
import { cn } from '@/lib/utils';
import { 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, Link, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TextBlockProps {
  block: ContentBlock;
  isSelected: boolean;
  isFocused: boolean;
  onUpdate: (content: string, metadata?: TextMetadata) => void;
  onFocus: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  placeholder?: string;
}

export const TextBlock = ({
  block,
  isSelected,
  isFocused,
  onUpdate,
  onFocus,
  onKeyDown,
  placeholder = "Type '/' for commands..."
}: TextBlockProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const metadata = block.metadata as TextMetadata | undefined;
  const [isEmpty, setIsEmpty] = useState(!block.content);

  // Sync content on mount or when block.content changes externally
  useEffect(() => {
    if (editorRef.current) {
      const currentContent = editorRef.current.innerHTML;
      // Only update if content actually changed from external source
      if (currentContent !== block.content && block.content) {
        editorRef.current.innerHTML = block.content;
        setIsEmpty(false);
      } else if (!block.content && currentContent) {
        // Block was cleared externally
        editorRef.current.innerHTML = '';
        setIsEmpty(true);
      }
    }
  }, [block.id]); // Only on block change, not content

  useEffect(() => {
    if (isFocused && editorRef.current) {
      editorRef.current.focus();
      // Place cursor at the end
      const range = document.createRange();
      const sel = window.getSelection();
      if (editorRef.current.childNodes.length > 0) {
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
      }
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isFocused]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      const textContent = editorRef.current.textContent || '';
      setIsEmpty(!textContent.trim());
      onUpdate(content, metadata);
    }
  };

  const applyFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const setAlignment = (alignment: TextAlignment) => {
    onUpdate(block.content, { ...metadata, alignment });
  };

  const setListType = (listType: 'none' | 'bullet' | 'numbered' | 'checklist') => {
    onUpdate(block.content, { ...metadata, listType });
  };

  const getAlignmentClass = () => {
    switch (metadata?.alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      case 'justify': return 'text-justify';
      default: return 'text-left';
    }
  };

  const getListClass = () => {
    switch (metadata?.listType) {
      case 'bullet': return 'list-disc list-inside';
      case 'numbered': return 'list-decimal list-inside';
      case 'checklist': return '';
      default: return '';
    }
  };

  return (
    <div className="relative group">
      {/* Formatting Toolbar - appears on selection/focus */}
      {isSelected && (
        <div className="absolute -top-10 left-0 z-10 flex items-center gap-1 p-1 bg-popover border border-border rounded-lg shadow-lg">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); applyFormatting('bold'); }}
            title="Bold (Ctrl+B)"
          >
            <span className="font-bold text-sm">B</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); applyFormatting('italic'); }}
            title="Italic (Ctrl+I)"
          >
            <span className="italic text-sm">I</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); applyFormatting('underline'); }}
            title="Underline (Ctrl+U)"
          >
            <span className="underline text-sm">U</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); applyFormatting('strikeThrough'); }}
            title="Strikethrough"
          >
            <span className="line-through text-sm">S</span>
          </Button>
          
          <div className="w-px h-5 bg-border mx-1" />
          
          {/* Alignment */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                <AlignLeft className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1">
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); setAlignment('left'); }}>
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); setAlignment('center'); }}>
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); setAlignment('right'); }}>
                  <AlignRight className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); setAlignment('justify'); }}>
                  <AlignJustify className="h-4 w-4" />
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* List */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                <List className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1">
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); setListType('bullet'); }}>
                  <List className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); setListType('numbered'); }}>
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); setListType('checklist'); }}>
                  <CheckSquare className="h-4 w-4" />
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const url = prompt('Enter link URL:');
              if (url) applyFormatting('createLink', url);
            }}
            title="Insert Link"
          >
            <Link className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); applyFormatting('removeFormat'); }}
            title="Clear Formatting"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editable Content with CSS placeholder */}
      <div className="relative">
        {isEmpty && (
          <div className="absolute top-1 left-1 text-muted-foreground pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className={cn(
            "min-h-[1.5em] outline-none py-1 px-1 rounded transition-colors",
            "focus:bg-secondary/30",
            getAlignmentClass(),
            getListClass(),
            "prose prose-sm dark:prose-invert max-w-none",
            "[&_a]:text-primary [&_a]:underline"
          )}
          onInput={handleInput}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
};
