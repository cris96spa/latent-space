interface PageMetaProps {
  title: string
  description: string
}

/**
 * Sets the per-route document title and meta description. React 19 hoists a `<title>`/`<meta>`
 * rendered anywhere in the tree into `<head>`; non-JS card crawlers fall back to the static
 * defaults in `index.html`.
 */
export function PageMeta({ title, description }: PageMetaProps) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
    </>
  )
}
