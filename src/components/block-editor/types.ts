// Block Type System
export type BlockType = 
  | 'text' 
  | 'heading1' 
  | 'heading2' 
  | 'heading3' 
  | 'image' 
  | 'video'
  | 'code' 
  | 'divider' 
  | 'quote' 
  | 'quiz'
  | 'table';

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';
export type ListType = 'none' | 'bullet' | 'numbered' | 'checklist';
export type ImageSize = 'small' | 'medium' | 'large' | 'full';
export type BorderRadius = 'none' | 'small' | 'medium' | 'large' | 'full';

export interface TextFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  link?: string;
  color?: string;
  backgroundColor?: string;
}

export interface TextMetadata {
  alignment?: TextAlignment;
  listType?: ListType;
  checked?: boolean; // For checklist items
}

export interface ImageMetadata {
  src: string;
  alt?: string;
  caption?: string;
  size?: ImageSize;
  alignment?: TextAlignment;
  borderRadius?: BorderRadius;
  width?: number;
  height?: number;
}

export interface VideoMetadata {
  url: string;
  platform?: 'youtube' | 'vimeo' | 'loom' | 'other';
  aspectRatio?: '16:9' | '4:3' | '1:1';
  autoplay?: boolean;
  startTime?: number;
  endTime?: number;
}

export interface CodeMetadata {
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
  theme?: 'light' | 'dark';
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: QuizOption[];
  correctAnswer?: string;
  explanation?: string;
  points?: number;
}

export interface QuizMetadata {
  questions: QuizQuestion[];
  showResults?: boolean;
  randomizeOptions?: boolean;
}

export interface TableCell {
  content: string;
  rowSpan?: number;
  colSpan?: number;
  backgroundColor?: string;
  alignment?: TextAlignment;
}

export interface TableMetadata {
  rows: TableCell[][];
  hasHeader?: boolean;
  alternatingColors?: boolean;
  borderStyle?: 'none' | 'solid' | 'dashed';
}

export type BlockMetadata = 
  | TextMetadata 
  | ImageMetadata 
  | VideoMetadata 
  | CodeMetadata 
  | QuizMetadata
  | TableMetadata;

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  metadata?: BlockMetadata;
  createdAt: number;
  updatedAt: number;
}

export interface EditorState {
  blocks: ContentBlock[];
  selectedBlockId: string | null;
  focusedBlockId: string | null;
}

// Default metadata for block types
const getDefaultMetadata = (type: BlockType): BlockMetadata | undefined => {
  switch (type) {
    case 'quiz':
      return {
        questions: [],
        showResults: false,
        randomizeOptions: false,
      } as QuizMetadata;
    case 'table':
      return {
        rows: [
          [{ content: 'Header 1' }, { content: 'Header 2' }, { content: 'Header 3' }],
          [{ content: '' }, { content: '' }, { content: '' }],
          [{ content: '' }, { content: '' }, { content: '' }],
        ],
        hasHeader: true,
        alternatingColors: true,
        borderStyle: 'solid',
      } as TableMetadata;
    case 'code':
      return {
        language: 'javascript',
        showLineNumbers: true,
        theme: 'dark',
      } as CodeMetadata;
    case 'image':
      return {
        src: '',
        size: 'large',
        alignment: 'center',
        borderRadius: 'medium',
      } as ImageMetadata;
    case 'video':
      return {
        url: '',
        platform: 'youtube',
        aspectRatio: '16:9',
      } as VideoMetadata;
    default:
      return undefined;
  }
};

// Helper to create a new block
export const createBlock = (type: BlockType, content: string = '', metadata?: BlockMetadata): ContentBlock => ({
  id: crypto.randomUUID(),
  type,
  content,
  metadata: metadata ?? getDefaultMetadata(type),
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Default blocks for new editor
export const getDefaultBlocks = (): ContentBlock[] => [
  createBlock('text', ''),
];

// Convert blocks to JSON string for storage
export const blocksToJson = (blocks: ContentBlock[]): string => {
  return JSON.stringify(blocks);
};

// Parse JSON string back to blocks
export const jsonToBlocks = (json: string): ContentBlock[] => {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return getDefaultBlocks();
  } catch {
    return getDefaultBlocks();
  }
};

// Get plain text content from blocks (for character count, etc.)
export const getPlainTextContent = (blocks: ContentBlock[]): string => {
  return blocks
    .filter(block => ['text', 'heading1', 'heading2', 'heading3', 'quote', 'code'].includes(block.type))
    .map(block => block.content)
    .join('\n');
};

// Supported programming languages for code blocks
export const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'c',
  'ruby', 'go', 'rust', 'swift', 'kotlin', 'php', 'sql', 'html', 'css',
  'json', 'yaml', 'markdown', 'bash', 'shell', 'powershell', 'dockerfile'
];

// Block type display names and icons
export const BLOCK_TYPE_INFO: Record<BlockType, { label: string; icon: string; description: string }> = {
  text: { label: 'Text', icon: 'Type', description: 'Plain text paragraph' },
  heading1: { label: 'Heading 1', icon: 'Heading1', description: 'Large heading' },
  heading2: { label: 'Heading 2', icon: 'Heading2', description: 'Medium heading' },
  heading3: { label: 'Heading 3', icon: 'Heading3', description: 'Small heading' },
  image: { label: 'Image', icon: 'Image', description: 'Upload or embed an image' },
  video: { label: 'Video', icon: 'Video', description: 'Embed a video from YouTube, Vimeo, etc.' },
  code: { label: 'Code', icon: 'Code', description: 'Code block with syntax highlighting' },
  divider: { label: 'Divider', icon: 'Minus', description: 'Horizontal divider line' },
  quote: { label: 'Quote', icon: 'Quote', description: 'Block quote' },
  quiz: { label: 'Quiz', icon: 'HelpCircle', description: 'Interactive quiz question' },
  table: { label: 'Table', icon: 'Table', description: 'Data table' },
};
