import { ChatSection } from '../features/chat'
import { ForwardPassHero } from '../features/forward-pass-hero'
import { VocabularySection } from '../features/vocabulary'

export function HomePage() {
  return (
    <div className="space-y-16">
      <ForwardPassHero />

      <ChatSection />

      <VocabularySection />
    </div>
  )
}
