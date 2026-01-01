import { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  ContentBlock, 
  BlockType, 
  createBlock, 
  getDefaultBlocks,
  getPlainTextContent,
  TextMetadata,
  ImageMetadata,
  VideoMetadata,
  CodeMetadata,
  QuizMetadata,
  TableMetadata
} from './types';
import { TextBlock } from './blocks/TextBlock';
import { HeadingBlock } from './blocks/HeadingBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { QuoteBlock } from './blocks/QuoteBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { VideoBlock } from './blocks/VideoBlock';
import { QuizBlock } from './blocks/QuizBlock';
import { TableBlock } from './blocks/TableBlock';
import { CommandMenu } from './CommandMenu';
import { BlockMenu } from './BlockMenu';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GripVertical, Plus, Eye, Edit3, Save, Clock, Keyboard } from 'lucide-react';
import { toast } from 'sonner';

interface BlockEditorProps {
  initialBlocks?: ContentBlock[];
  onChange?: (blocks: ContentBlock[]) => void;
  readOnly?: boolean;
  minCharacters?: number;
  autoSaveKey?: string; // Key for localStorage auto-save
  showPreview?: boolean; // Show preview toggle
}

export const BlockEditor = ({
  initialBlocks,
  onChange,
  readOnly = false,
  minCharacters = 50,
  autoSaveKey,
  showPreview = true,
}: BlockEditorProps) => {
  // Load from localStorage if autoSaveKey provided
  const getInitialBlocks = () => {
    if (autoSaveKey) {
      const saved = localStorage.getItem(`draft-${autoSaveKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {}
      }
    }
    return initialBlocks || getDefaultBlocks();
  };

  const [blocks, setBlocks] = useState<ContentBlock[]>(getInitialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [commandMenu, setCommandMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    blockId: string;
    searchQuery: string;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    blockId: '',
    searchQuery: '',
  });

  const editorRef = useRef<HTMLDivElement>(null);

  // Auto-save to localStorage
  useEffect(() => {
    if (!autoSaveKey || readOnly) return;
    
    const timer = setTimeout(() => {
      localStorage.setItem(`draft-${autoSaveKey}`, JSON.stringify(blocks));
      setLastSaved(new Date());
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [blocks, autoSaveKey, readOnly]);

  // Update blocks and notify parent
  const updateBlocks = useCallback((newBlocks: ContentBlock[]) => {
    setBlocks(newBlocks);
    onChange?.(newBlocks);
  }, [onChange]);

  // Add a new block after the specified block
  const addBlockAfter = useCallback((afterBlockId: string, type: BlockType) => {
    const index = blocks.findIndex(b => b.id === afterBlockId);
    const newBlock = createBlock(type);
    const newBlocks = [
      ...blocks.slice(0, index + 1),
      newBlock,
      ...blocks.slice(index + 1),
    ];
    updateBlocks(newBlocks);
    setFocusedBlockId(newBlock.id);
    setSelectedBlockId(newBlock.id);
  }, [blocks, updateBlocks]);

  // Delete a block
  const deleteBlock = useCallback((blockId: string) => {
    if (blocks.length <= 1) {
      // Don't delete the last block, just clear it
      const newBlocks = blocks.map(b => 
        b.id === blockId ? { ...b, content: '' } : b
      );
      updateBlocks(newBlocks);
      return;
    }
    
    const index = blocks.findIndex(b => b.id === blockId);
    const newBlocks = blocks.filter(b => b.id !== blockId);
    updateBlocks(newBlocks);
    
    // Focus previous block
    if (index > 0) {
      setFocusedBlockId(newBlocks[index - 1].id);
    } else if (newBlocks.length > 0) {
      setFocusedBlockId(newBlocks[0].id);
    }
  }, [blocks, updateBlocks]);

  // Duplicate a block
  const duplicateBlock = useCallback((blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const index = blocks.findIndex(b => b.id === blockId);
    const newBlock = createBlock(block.type, block.content, block.metadata);
    const newBlocks = [
      ...blocks.slice(0, index + 1),
      newBlock,
      ...blocks.slice(index + 1),
    ];
    updateBlocks(newBlocks);
    setFocusedBlockId(newBlock.id);
  }, [blocks, updateBlocks]);

  // Move block up
  const moveBlockUp = useCallback((blockId: string) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index <= 0) return;
    
    const newBlocks = [...blocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  // Move block down
  const moveBlockDown = useCallback((blockId: string) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index >= blocks.length - 1) return;
    
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  // Convert block to different type
  const convertBlock = useCallback((blockId: string, newType: BlockType) => {
    const newBlocks = blocks.map(b => 
      b.id === blockId 
        ? { ...b, type: newType, updatedAt: Date.now() } 
        : b
    );
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  // Update block content
  const updateBlockContent = useCallback((blockId: string, content: string, metadata?: any) => {
    const newBlocks = blocks.map(b => 
      b.id === blockId 
        ? { ...b, content, metadata: metadata ?? b.metadata, updatedAt: Date.now() } 
        : b
    );
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    updateBlocks(items);
  };

  // Handle keyboard events in blocks
  const handleBlockKeyDown = useCallback((blockId: string, e: KeyboardEvent<HTMLElement>) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    // Open command menu on "/"
    if (e.key === '/' && !block.content) {
      e.preventDefault();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setCommandMenu({
        isOpen: true,
        position: { x: rect.left, y: rect.bottom + 8 },
        blockId,
        searchQuery: '',
      });
      return;
    }

    // Handle Enter - create new block
    if (e.key === 'Enter' && !e.shiftKey) {
      // Allow enter in code blocks
      if (block.type === 'code') return;
      
      e.preventDefault();
      addBlockAfter(blockId, 'text');
      return;
    }

    // Handle Backspace on empty block - delete and focus previous
    if (e.key === 'Backspace' && !block.content && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(blockId);
      return;
    }

    // Move blocks with Ctrl/Cmd + Arrow
    if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp') {
      e.preventDefault();
      moveBlockUp(blockId);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown') {
      e.preventDefault();
      moveBlockDown(blockId);
      return;
    }
  }, [blocks, addBlockAfter, deleteBlock, moveBlockUp, moveBlockDown]);

  // Handle command menu selection
  const handleCommandSelect = (type: BlockType) => {
    const { blockId } = commandMenu;
    
    // If selecting on empty text block, convert it
    const block = blocks.find(b => b.id === blockId);
    if (block?.type === 'text' && !block.content) {
      convertBlock(blockId, type);
    } else {
      addBlockAfter(blockId, type);
    }
    
    setCommandMenu({ ...commandMenu, isOpen: false });
  };

  // Character count
  const charCount = getPlainTextContent(blocks).length;

  // Render a block
  const renderBlock = (block: ContentBlock, index: number) => {
    const isSelected = selectedBlockId === block.id;
    const isFocused = focusedBlockId === block.id;

    const blockContent = () => {
      switch (block.type) {
        case 'text':
          return (
            <TextBlock
              block={block}
              isSelected={isSelected}
              isFocused={isFocused}
              onUpdate={(content, metadata) => updateBlockContent(block.id, content, metadata)}
              onFocus={() => {
                setFocusedBlockId(block.id);
                setSelectedBlockId(block.id);
              }}
              onKeyDown={(e) => handleBlockKeyDown(block.id, e)}
            />
          );
        
        case 'heading1':
        case 'heading2':
        case 'heading3':
          return (
            <HeadingBlock
              block={block}
              isFocused={isFocused}
              onUpdate={(content) => updateBlockContent(block.id, content)}
              onFocus={() => {
                setFocusedBlockId(block.id);
                setSelectedBlockId(block.id);
              }}
              onKeyDown={(e) => handleBlockKeyDown(block.id, e)}
            />
          );
        
        case 'image':
          return (
            <ImageBlock
              block={block}
              isSelected={isSelected}
              onUpdate={(content, metadata) => updateBlockContent(block.id, content, metadata)}
              onDelete={() => deleteBlock(block.id)}
              onFocus={() => {
                setFocusedBlockId(block.id);
                setSelectedBlockId(block.id);
              }}
            />
          );
        
        case 'video':
          return (
            <VideoBlock
              block={block}
              isSelected={isSelected}
              onUpdate={(content, metadata) => updateBlockContent(block.id, content, metadata)}
              onDelete={() => deleteBlock(block.id)}
              onFocus={() => {
                setFocusedBlockId(block.id);
                setSelectedBlockId(block.id);
              }}
            />
          );
        
        case 'code':
          return (
            <CodeBlock
              block={block}
              isSelected={isSelected}
              isFocused={isFocused}
              onUpdate={(content, metadata) => updateBlockContent(block.id, content, metadata)}
              onFocus={() => {
                setFocusedBlockId(block.id);
                setSelectedBlockId(block.id);
              }}
              onKeyDown={(e) => handleBlockKeyDown(block.id, e)}
            />
          );
        
        case 'quote':
          return (
            <QuoteBlock
              block={block}
              isFocused={isFocused}
              onUpdate={(content) => updateBlockContent(block.id, content)}
              onFocus={() => {
                setFocusedBlockId(block.id);
                setSelectedBlockId(block.id);
              }}
              onKeyDown={(e) => handleBlockKeyDown(block.id, e)}
            />
          );
        
        case 'divider':
          return (
            <DividerBlock
              block={block}
              isSelected={isSelected}
              onFocus={() => {
                setFocusedBlockId(block.id);
                setSelectedBlockId(block.id);
              }}
            />
          );
        
        case 'quiz':
          return (
            <QuizBlock
              block={block}
              isSelected={isSelected}
              onUpdate={(content, metadata) => updateBlockContent(block.id, content, metadata)}
              onDelete={() => deleteBlock(block.id)}
              onFocus={() => {
                setFocusedBlockId(block.id);
                setSelectedBlockId(block.id);
              }}
            />
          );
        
        case 'table':
          return (
            <TableBlock
              block={block}
              isSelected={isSelected}
              onUpdate={(content, metadata) => updateBlockContent(block.id, content, metadata)}
              onDelete={() => deleteBlock(block.id)}
              onFocus={() => {
                setFocusedBlockId(block.id);
                setSelectedBlockId(block.id);
              }}
            />
          );
        
        default:
          return null;
      }
    };

    return (
      <Draggable key={block.id} draggableId={block.id} index={index} isDragDisabled={readOnly}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={cn(
              "group relative flex items-start gap-1 py-1 rounded-lg transition-colors",
              snapshot.isDragging && "bg-secondary/50 shadow-lg",
              isSelected && "bg-secondary/20"
            )}
          >
            {/* Drag Handle & Block Menu */}
            {!readOnly && (
              <div className="flex items-center gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                  {...provided.dragHandleProps}
                  className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-secondary"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>
                
                <BlockMenu
                  blockType={block.type}
                  onDuplicate={() => duplicateBlock(block.id)}
                  onDelete={() => deleteBlock(block.id)}
                  onMoveUp={() => moveBlockUp(block.id)}
                  onMoveDown={() => moveBlockDown(block.id)}
                  onConvertTo={(type) => convertBlock(block.id, type)}
                  canMoveUp={index > 0}
                  canMoveDown={index < blocks.length - 1}
                />
              </div>
            )}
            
            {/* Block Content */}
            <div className="flex-1 min-w-0">
              {blockContent()}
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div ref={editorRef} className="relative">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-1"
            >
              {blocks.map((block, index) => renderBlock(block, index))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Block Button */}
      {!readOnly && (
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              const lastBlock = blocks[blocks.length - 1];
              if (lastBlock) {
                addBlockAfter(lastBlock.id, 'text');
              }
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add block
          </Button>
          
          <span className="text-xs text-muted-foreground ml-auto">
            {charCount} characters {minCharacters > 0 && `(min ${minCharacters})`}
          </span>
        </div>
      )}

      {/* Command Menu */}
      <CommandMenu
        isOpen={commandMenu.isOpen}
        position={commandMenu.position}
        searchQuery={commandMenu.searchQuery}
        onSelect={handleCommandSelect}
        onClose={() => setCommandMenu({ ...commandMenu, isOpen: false })}
      />
    </div>
  );
};

export default BlockEditor;
