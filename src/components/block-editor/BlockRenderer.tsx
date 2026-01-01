import { ContentBlock, jsonToBlocks, TextMetadata, ImageMetadata, VideoMetadata, CodeMetadata, QuizMetadata, TableMetadata } from './types';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { QuizBlock } from './blocks/QuizBlock';
import { TableBlock } from './blocks/TableBlock';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface BlockRendererProps {
  content: string;
  className?: string;
}

export const BlockRenderer = ({ content, className }: BlockRendererProps) => {
  const blocks = jsonToBlocks(content);

  if (blocks.length === 0) {
    return <p className="text-muted-foreground">No content</p>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {blocks.map((block) => (
        <BlockItem key={block.id} block={block} />
      ))}
    </div>
  );
};

const BlockItem = ({ block }: { block: ContentBlock }) => {
  switch (block.type) {
    case 'text':
      return <TextBlockRenderer block={block} />;
    case 'heading1':
      return <HeadingRenderer block={block} level={1} />;
    case 'heading2':
      return <HeadingRenderer block={block} level={2} />;
    case 'heading3':
      return <HeadingRenderer block={block} level={3} />;
    case 'image':
      return <ImageRenderer block={block} />;
    case 'video':
      return <VideoRenderer block={block} />;
    case 'code':
      return <CodeRenderer block={block} />;
    case 'quote':
      return <QuoteRenderer block={block} />;
    case 'divider':
      return <hr className="border-border my-6" />;
    case 'quiz':
      return (
        <QuizBlock
          block={block}
          isSelected={false}
          readOnly={true}
          onUpdate={() => {}}
          onDelete={() => {}}
          onFocus={() => {}}
        />
      );
    case 'table':
      return (
        <TableBlock
          block={block}
          isSelected={false}
          readOnly={true}
          onUpdate={() => {}}
          onDelete={() => {}}
          onFocus={() => {}}
        />
      );
    default:
      return null;
  }
};

const TextBlockRenderer = ({ block }: { block: ContentBlock }) => {
  const metadata = block.metadata as TextMetadata | undefined;
  
  const alignmentClass = {
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
    left: 'text-left',
  }[metadata?.alignment || 'left'];

  const listClass = {
    bullet: 'list-disc list-inside',
    numbered: 'list-decimal list-inside',
    checklist: '',
    none: '',
  }[metadata?.listType || 'none'];

  if (!block.content) return null;

  return (
    <div
      className={cn(
        "prose prose-invert max-w-none",
        "[&_a]:text-primary [&_a]:underline",
        "[&_strong]:font-bold [&_em]:italic",
        alignmentClass,
        listClass
      )}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content) }}
    />
  );
};

const HeadingRenderer = ({ block, level }: { block: ContentBlock; level: 1 | 2 | 3 }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const sizeClass = {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-bold',
    3: 'text-xl font-semibold',
  }[level];

  return (
    <Tag className={cn(sizeClass, "mt-6 mb-3")}>
      {block.content}
    </Tag>
  );
};

const ImageRenderer = ({ block }: { block: ContentBlock }) => {
  const metadata = block.metadata as ImageMetadata | undefined;
  
  if (!metadata?.src) return null;

  const sizeClass = {
    small: 'max-w-[400px]',
    medium: 'max-w-[600px]',
    large: 'max-w-[800px]',
    full: 'w-full',
  }[metadata.size || 'large'];

  const alignmentClass = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
  }[metadata.alignment || 'center'];

  const radiusClass = {
    none: 'rounded-none',
    small: 'rounded-md',
    medium: 'rounded-lg',
    large: 'rounded-xl',
    full: 'rounded-full',
  }[metadata.borderRadius || 'medium'];

  return (
    <figure className={cn("my-4", sizeClass, alignmentClass)}>
      <img
        src={metadata.src}
        alt={metadata.alt || ''}
        className={cn("w-full h-auto", radiusClass)}
      />
      {metadata.caption && (
        <figcaption className="text-center text-sm text-muted-foreground mt-2">
          {metadata.caption}
        </figcaption>
      )}
    </figure>
  );
};

const VideoRenderer = ({ block }: { block: ContentBlock }) => {
  const metadata = block.metadata as VideoMetadata | undefined;
  
  if (!metadata?.url) return null;

  const getEmbedUrl = () => {
    const url = metadata.url;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      let embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
      const params = [];
      if (metadata.autoplay) params.push('autoplay=1');
      if (metadata.startTime) params.push(`start=${metadata.startTime}`);
      if (metadata.endTime) params.push(`end=${metadata.endTime}`);
      if (params.length) embedUrl += '?' + params.join('&');
      return embedUrl;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // Loom
    const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (loomMatch) {
      return `https://www.loom.com/embed/${loomMatch[1]}`;
    }
    
    return url;
  };

  const aspectRatioClass = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
  }[metadata.aspectRatio || '16:9'];

  return (
    <div className={cn("my-4 w-full", aspectRatioClass)}>
      <iframe
        src={getEmbedUrl()}
        className="w-full h-full rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

const CodeRenderer = ({ block }: { block: ContentBlock }) => {
  const metadata = block.metadata as CodeMetadata | undefined;
  const [copied, setCopied] = useState(false);

  const language = metadata?.language || 'plaintext';
  
  let highlightedCode = block.content;
  try {
    if (hljs.getLanguage(language)) {
      highlightedCode = hljs.highlight(block.content, { language }).value;
    }
  } catch {
    // Fallback to plain text
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(block.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      {metadata?.filename && (
        <div className="bg-muted px-4 py-2 text-sm text-muted-foreground rounded-t-lg border-b border-border">
          {metadata.filename}
        </div>
      )}
      <div className="relative">
        <pre className={cn(
          "bg-[#0d1117] p-4 overflow-x-auto text-sm",
          metadata?.filename ? "rounded-b-lg" : "rounded-lg",
          metadata?.showLineNumbers && "pl-12"
        )}>
          {metadata?.showLineNumbers && (
            <div className="absolute left-0 top-0 p-4 text-muted-foreground select-none text-right pr-4 border-r border-border/30">
              {block.content.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          )}
          <code
            className={`language-${language} text-gray-100`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

const QuoteRenderer = ({ block }: { block: ContentBlock }) => {
  if (!block.content) return null;

  return (
    <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 italic text-muted-foreground">
      {block.content}
    </blockquote>
  );
};
