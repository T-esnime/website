import { useRef, useEffect, KeyboardEvent, useState } from 'react';
import { ContentBlock, CodeMetadata, SUPPORTED_LANGUAGES } from '../types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Check, Hash, File } from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

interface CodeBlockProps {
  block: ContentBlock;
  isSelected: boolean;
  isFocused: boolean;
  onUpdate: (content: string, metadata?: CodeMetadata) => void;
  onFocus: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const CodeBlock = ({
  block,
  isSelected,
  isFocused,
  onUpdate,
  onFocus,
  onKeyDown,
}: CodeBlockProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const metadata = (block.metadata as CodeMetadata) || { language: 'javascript' };

  useEffect(() => {
    if (isFocused && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isFocused]);

  const updateMetadata = (updates: Partial<CodeMetadata>) => {
    onUpdate(block.content, { ...metadata, ...updates });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(block.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onUpdate(newValue, metadata);
      
      // Reset cursor position
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
      return;
    }
    
    onKeyDown(e);
  };

  // Get highlighted code
  const getHighlightedCode = () => {
    if (!block.content) return '';
    try {
      const highlighted = hljs.highlight(block.content, { 
        language: metadata.language || 'plaintext',
        ignoreIllegals: true
      });
      return highlighted.value;
    } catch {
      return block.content;
    }
  };

  // Count lines
  const lineCount = (block.content || '').split('\n').length;
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div 
      className={cn(
        "rounded-lg overflow-hidden border border-border bg-[#0d1117] transition-all",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={onFocus}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-border">
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <Select 
            value={metadata.language} 
            onValueChange={(value) => updateMetadata({ language: value })}
          >
            <SelectTrigger className="h-7 w-32 text-xs bg-transparent border-border">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang} className="text-xs capitalize">
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filename */}
          {isSelected && (
            <Input
              placeholder="filename.js"
              value={metadata.filename || ''}
              onChange={(e) => updateMetadata({ filename: e.target.value })}
              className="h-7 w-32 text-xs bg-transparent border-border"
            />
          )}
          
          {metadata.filename && !isSelected && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <File className="w-3 h-3" />
              {metadata.filename}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Line Numbers Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7",
              metadata.showLineNumbers && "text-primary"
            )}
            onClick={() => updateMetadata({ showLineNumbers: !metadata.showLineNumbers })}
            title="Toggle line numbers"
          >
            <Hash className="h-3 w-3" />
          </Button>

          {/* Copy Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Code Area */}
      <div className="relative font-mono text-sm">
        {/* Line Numbers */}
        {metadata.showLineNumbers && (
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#161b22] border-r border-border text-muted-foreground text-right pr-2 pt-4 select-none">
            {lines.map((line) => (
              <div key={line} className="leading-6">{line}</div>
            ))}
          </div>
        )}

        {/* Textarea for editing */}
        {isFocused ? (
          <textarea
            ref={textareaRef}
            value={block.content}
            onChange={(e) => onUpdate(e.target.value, metadata)}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full min-h-[120px] bg-transparent text-[#c9d1d9] p-4 resize-y outline-none font-mono",
              metadata.showLineNumbers && "pl-14"
            )}
            style={{ lineHeight: '1.5rem' }}
            spellCheck={false}
            placeholder="// Write your code here..."
          />
        ) : (
          <pre 
            className={cn(
              "p-4 overflow-x-auto",
              metadata.showLineNumbers && "pl-14"
            )}
            style={{ lineHeight: '1.5rem' }}
          >
            <code 
              className={`hljs language-${metadata.language}`}
              dangerouslySetInnerHTML={{ __html: getHighlightedCode() || '<span class="text-muted-foreground">// Write your code here...</span>' }}
            />
          </pre>
        )}
      </div>
    </div>
  );
};
