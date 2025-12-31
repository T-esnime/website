import { useState } from 'react';
import { ContentBlock, VideoMetadata } from '../types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Video, 
  Link,
  Trash2,
  Play
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VideoBlockProps {
  block: ContentBlock;
  isSelected: boolean;
  onUpdate: (content: string, metadata: VideoMetadata) => void;
  onDelete: () => void;
  onFocus: () => void;
}

// Extract video ID and platform from URL
const parseVideoUrl = (url: string): { platform: VideoMetadata['platform']; embedUrl: string } | null => {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return {
      platform: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      platform: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`
    };
  }

  // Loom
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (loomMatch) {
    return {
      platform: 'loom',
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`
    };
  }

  return null;
};

export const VideoBlock = ({
  block,
  isSelected,
  onUpdate,
  onDelete,
  onFocus,
}: VideoBlockProps) => {
  const metadata = (block.metadata as VideoMetadata) || { url: '' };
  const [urlValue, setUrlValue] = useState('');
  const [error, setError] = useState('');

  const handleUrlSubmit = () => {
    const parsed = parseVideoUrl(urlValue.trim());
    if (parsed) {
      onUpdate(parsed.embedUrl, { 
        ...metadata, 
        url: urlValue.trim(),
        platform: parsed.platform 
      });
      setUrlValue('');
      setError('');
    } else {
      setError('Unsupported video URL. Try YouTube, Vimeo, or Loom.');
    }
  };

  const updateMetadata = (updates: Partial<VideoMetadata>) => {
    onUpdate(block.content, { ...metadata, ...updates });
  };

  const getAspectRatioClass = () => {
    switch (metadata.aspectRatio) {
      case '4:3': return 'aspect-[4/3]';
      case '1:1': return 'aspect-square';
      default: return 'aspect-video';
    }
  };

  // No video URL yet
  if (!block.content) {
    return (
      <div 
        className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-secondary/20 hover:bg-secondary/40 transition-colors"
        onClick={onFocus}
      >
        <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Paste YouTube, Vimeo, or Loom URL..."
              value={urlValue}
              onChange={(e) => {
                setUrlValue(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <Button onClick={handleUrlSubmit}>
              <Link className="w-4 h-4 mr-2" />
              Embed
            </Button>
          </div>
          
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          
          <p className="text-sm text-muted-foreground">
            Supported: YouTube, Vimeo, Loom
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group" onClick={onFocus}>
      {/* Video Settings Toolbar */}
      {isSelected && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 p-1 bg-popover border border-border rounded-lg shadow-lg">
          {/* Platform Badge */}
          <span className="px-2 py-0.5 text-xs font-medium bg-secondary rounded capitalize">
            {metadata.platform || 'video'}
          </span>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Aspect Ratio */}
          <Select 
            value={metadata.aspectRatio || '16:9'} 
            onValueChange={(value: '16:9' | '4:3' | '1:1') => updateMetadata({ aspectRatio: value })}
          >
            <SelectTrigger className="h-7 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9</SelectItem>
              <SelectItem value="4:3">4:3</SelectItem>
              <SelectItem value="1:1">1:1</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Video Embed */}
      <div className={cn(
        "relative w-full rounded-lg overflow-hidden bg-black",
        getAspectRatioClass(),
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}>
        <iframe
          src={block.content}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};
