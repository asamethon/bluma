import type { ParsedMedia } from '../utils/mediaToken';
import { StoryImage } from './StoryImage';
import { StoryVideo } from './StoryVideo';

/** Bölüm metninden çözülmüş medya token'ını çizer (okuyucu ve önizleme ortak). */
export function StoryMedia({ media }: { media: ParsedMedia }) {
  return media.kind === 'video'
    ? <StoryVideo poster={media.poster} video={media.video} />
    : <StoryImage uri={media.url} />;
}
