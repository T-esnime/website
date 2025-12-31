import { useState, useRef, useEffect } from 'react';
import { BlockType, BLOCK_TYPE_INFO } from './types';
import { cn } from '@/lib/utils';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  Image, 
  Video, 
  Code, 
  Minus, 
  Quote,
  HelpCircle,
  Table
} from 'lucide-react';

interface CommandMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  searchQuery: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

const BLOCK_ICONS: Record<BlockType, React.ReactNode> = {
  text: <Type className="w-4 h-4" />,
  heading1: <Heading1 className="w-4 h-4" />,
  heading2: <Heading2 className="w-4 h-4" />,
  heading3: <Heading3 className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  code: <Code className="w-4 h-4" />,
  divider: <Minus className="w-4 h-4" />,
  quote: <Quote className="w-4 h-4" />,
  quiz: <HelpCircle className="w-4 h-4" />,
  table: <Table className="w-4 h-4" />,
};

// Block types available in Phase 1
const AVAILABLE_BLOCKS: BlockType[] = [
  'text',
  'heading1',
  'heading2',
  'heading3',
  'image',
  'video',
  'code',
  'divider',
  'quote',
];

export const CommandMenu = ({
  isOpen,
  position,
  searchQuery,
  onSelect,
  onClose,
}: CommandMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter blocks based on search query
  const filteredBlocks = AVAILABLE_BLOCKS.filter((type) => {
    const info = BLOCK_TYPE_INFO[type];
    const query = searchQuery.toLowerCase();
    return (
      info.label.toLowerCase().includes(query) ||
      info.description.toLowerCase().includes(query) ||
      type.toLowerCase().includes(query)
    );
  });

  // Reset selection when filtered blocks change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < filteredBlocks.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev > 0 ? prev - 1 : filteredBlocks.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredBlocks[selectedIndex]) {
            onSelect(filteredBlocks[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredBlocks, selectedIndex, onSelect, onClose]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 max-h-80 overflow-y-auto bg-popover border border-border rounded-lg shadow-xl"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="p-2 border-b border-border">
        <p className="text-xs font-medium text-muted-foreground">
          {searchQuery ? `Searching: "${searchQuery}"` : 'Add a block'}
        </p>
      </div>

      <div className="p-1">
        {filteredBlocks.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground text-center">
            No blocks found
          </p>
        ) : (
          filteredBlocks.map((type, index) => {
            const info = BLOCK_TYPE_INFO[type];
            return (
              <button
                key={type}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
                  index === selectedIndex 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-secondary"
                )}
                onClick={() => onSelect(type)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center",
                  index === selectedIndex ? "bg-primary-foreground/20" : "bg-secondary"
                )}>
                  {BLOCK_ICONS[type]}
                </div>
                <div>
                  <p className="text-sm font-medium">{info.label}</p>
                  <p className={cn(
                    "text-xs",
                    index === selectedIndex ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {info.description}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="p-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          ↑↓ Navigate • Enter Select • Esc Close
        </p>
      </div>
    </div>
  );
};
