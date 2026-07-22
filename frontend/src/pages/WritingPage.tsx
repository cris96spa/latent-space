import { useEffect, useState } from 'react'

import { Button } from '../components/Button'
import { PageMeta } from '../components/PageMeta'
import { TextLink } from '../components/TextLink'
import { PostCard } from '../features/writing/PostCard'
import { getPosts, type Post } from '../lib/api'
import { EXTERNAL_LINKS } from '../lib/links'
import { PAGE_META } from '../lib/pageMeta'

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly posts: readonly Post[] }
  | { readonly status: 'error' }

/**
 * The writing index: outbound cards for posts published on Substack, loaded from the
 * content API. No hard-coded post data and no local detail route (CLAUDE.md) - each card
 * links out. Ships empty by design; the empty state is the launch state and reads as
 * intentional, inviting the visitor to subscribe. Loading, error, and empty states are in
 * voice.
 */
export function WritingPage() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let active = true
    setLoad({ status: 'loading' })
    getPosts()
      .then((posts) => {
        if (active) {
          setLoad({ status: 'ready', posts })
        }
      })
      .catch(() => {
        if (active) {
          setLoad({ status: 'error' })
        }
      })
    return () => {
      active = false
    }
  }, [reloadToken])

  return (
    <section className="space-y-8">
      <PageMeta {...PAGE_META.writing} />
      <header className="max-w-2xl space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-700 dark:text-brand-300">
          training logs
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Writing</h1>
        <p className="text-muted">
          Notes from the lab notebook &mdash; training runs, papers I couldn&rsquo;t stop thinking
          about, and the occasional LLM tangent. Published on Substack; the good bits land there
          first.
        </p>
        <p>
          <TextLink href={EXTERNAL_LINKS.substack} target="_blank" rel="noreferrer noopener">
            Follow on Substack <span aria-hidden="true">&#8599;</span>
          </TextLink>
        </p>
      </header>

      {load.status === 'loading' && <p className="text-muted">Loading the notebook&hellip;</p>}

      {load.status === 'error' && (
        <div className="space-y-3">
          <p className="text-muted">
            The posts didn&rsquo;t load &mdash; the content service might still be warming up.
          </p>
          <Button variant="ghost" onClick={() => setReloadToken((token) => token + 1)}>
            Retry
          </Button>
        </div>
      )}

      {load.status === 'ready' && load.posts.length === 0 && (
        <p className="max-w-2xl text-muted">
          Nothing published yet &mdash; the first post is still overfitting to my drafts folder.
          Subscribe above and you&rsquo;ll catch it on the first epoch.
        </p>
      )}

      {load.status === 'ready' && load.posts.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {load.posts.map((post) => (
            <li key={post.publicIdentifier}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
