import { PageMeta } from '../components/PageMeta'
import { ChatSection } from '../features/chat'
import { ForwardPassHero } from '../features/forward-pass-hero'
import { VocabularySection } from '../features/vocabulary'
import { PAGE_META } from '../lib/pageMeta'

export function HomePage() {
  return (
    <div className="space-y-16">
      <PageMeta {...PAGE_META.home} />
      <ForwardPassHero />

      <ChatSection />

      <VocabularySection />
    </div>
  )
}
