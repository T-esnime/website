export { BlockEditor } from './BlockEditor';
export type { 
  ContentBlock, 
  BlockType, 
  BlockMetadata,
  TextMetadata,
  ImageMetadata,
  VideoMetadata,
  CodeMetadata,
  QuizMetadata,
  TableMetadata
} from './types';
export { 
  createBlock, 
  getDefaultBlocks, 
  blocksToJson, 
  jsonToBlocks,
  getPlainTextContent 
} from './types';
