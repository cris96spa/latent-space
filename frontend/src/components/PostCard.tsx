import { Card } from './Card'
import { TextLink } from './TextLink'
import { TokenChip } from './TokenChip'
import type { Post } from '../lib/api'
import { formatPublishDate } from '../lib/formatDate'

/**
 * One post on the writing index. The canonical post lives on Substack, so the whole card
 * points outward: the title and the footer link both open the post in a new tab, and there
 * is no internal detail route. The out-link carries an ↗ glyph (a shape, not a colour) so
 * the external affordance survives red-green colour-vision deficiency, and is pinned to the
 * bottom with `mt-auto` so cards keep a common baseline in the grid.
 */
export function PostCard({ post }: { post: Post }) {
  return (
    <Card className="flex h-full flex-col gap-4 transition-colors hover:border-brand-300">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight">
          <a
            href={post.externalUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-fg transition-colors hover:text-brand-700 dark:hover:text-brand-300"
          >
            {post.title}
          </a>
        </h3>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          <time dateTime={post.publishedAt}>{formatPublishDate(post.publishedAt)}</time>
        </p>
        <p className="text-sm text-muted">{post.summary}</p>
      </div>

      {post.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
          {post.tags.map((tag) => (
            <li key={tag}>
              <TokenChip tone="neutral">{tag}</TokenChip>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-1">
        <TextLink
          href={post.externalUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-sm no-underline hover:underline"
        >
          Read on Substack <span aria-hidden="true">&#8599;</span>
        </TextLink>
      </div>
    </Card>
  )
}
