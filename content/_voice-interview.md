# Voice interview - chat content (task 16)

> **Internal. Not published.** This is source material, like `_source-of-truth.md`. The
> point is to capture **your** voice, not my summary of your CV. Answer in your own words
> under each question - bullet points, half-sentences, tangents, swearing, all fine. I'll
> tighten the drafts into page copy afterwards.
>
> **How to use this file:**
> - Answer under **Your draft:** for the questions you want on the site.
> - Kill what you don't want: change `- [ ] keep` to `- [ ] CUT`, or just delete it.
> - Add new questions at the bottom under **Your own questions**.
> - Don't self-censor the humor. I can dial edge *down* later; I can't invent voice that
>   isn't in the draft. Rough beats polished here.
> - Aim for ~6–8 questions live at launch, so it reads curated, not exhaustive.

---

## 0. Voice calibration (please do these first)

### G1 - Metrics: public or not?
The current answers publish work numbers ("4× less GPU memory, 1.8× faster"; MLcube's
38% / 91% / etc.). Confidentiality is still an open TODO in `_source-of-truth.md`. Pick one:

- [x] Keep it qualitative and with a funny tone, e.g. "from dial-up to warp speed"

**Your call:**
>

### G2 - Edge level on the *actual page*
Your message had teeth. How much survives onto public, recruiter-adjacent copy?

- [x] PG - nerdy and dry, no swearing, but sharp and opinionated, no fluff or filler. No "passionate" garbage.

**Your call:**
>

### G3 - Warm-up (this one matters most)
Write 3–5 sentences, right now, in your natural voice, about *anything* - the last thing
that annoyed you at work, why a paper is beautiful, a take you'll defend. Don't polish it.
I'll use it to calibrate rhythm and humor for everything else.

**Your draft:**
>
I hate stupid things, corporate fluff and who speak without knowing what it is talking about. The actual AI situation is just hype, everyone pretending to be the new Silicon Valley Genius, but really few deep dive into things. No one cares about details, why things work and not just "they work like this". People re-invent the weel every time, but computer engineering principles have already solved tons of these problems, decades ago, but no one cares, until someone clames the new "hot water" discovery. The amount of garbage published in these days is insane, and it is really hard to extract the value from the noise. I think I am lucky, and probably obsessed to understand what is going on. I can define myself as a knowledge eager, and I am not afraid to say that. Each day I keep realizing how little I know, and how much more I want to learn. I am not afraid to say that I am a nerd, and I love it.
---

## 1. The question set

For each: my note on *why it earns a spot*, some prompts to riff on (including the blunt
interviewer kind), and space for your draft. Keep/cut each one.

### Nerdy core

#### Q1. What did rebuilding GPT-2 from scratch actually teach you?
- [x] Implementing GPT-2 just reflect who I am. I studied transformer architecture, I used daily the transformers library, but how does it work under the hood? How the text is actually converted into numbers? What about the tokenization? How to train the tokenizer? And yet we did not start generating any text, is just the encoder part of the stack. BPE, chat templates, all details that are easily missed if blindly using someone else work. Then, how does attention actually work, how can mha be implemented? Time travels does not exist, so what about causal masking? You are finally training but loss looks weird, of course you dumbass forgotten to zero-out gradients.
*Why: shows you build to understand, not to impress. The "rebuild the engine in the garage" energy.*
Riff on:
- What clicked that a `transformers` import hides from you?
- Was there a moment it finally generated something coherent? What did that feel like?
- Dumbest bug you hit doing it?

**Your draft:**
>

#### Q2. What's the most cursed bug or failure you've hit in ML?
- [ ] keep
*Why: war stories are the most human, funniest, most credible thing on a page like this.*
Riff on:
- The one you tell people at the bar.
- What broke, how long it took, and the real cause vs. what you first blamed.
- What you now *always* check because of it.

**Your draft:**
>

#### Q3. How do you actually make a model cheaper to run - quantization, distillation, or just a bigger GPU?
- [x] Trivial answer, the bigger the GPU, the better, but let's be practical. Usually LLMs are trained in bf16 precision to avoid numerical precision instabilities (despite a lot of effort is being put into lower-precision training). Serving a model is a different story. At the current state of the art, 8-bit quantization is almost lossless, while giving you for sure a lighter memory footprint, compared to the original model (compute speedup is hardware dependent, instead).
So, the no-brainer is to quantize the model. If further memory reduction is needed, lower-bit quantization can be applied, however, you are starting trading off accuracy.
Tackling the problem from a different angle, distillation is a great way to extract knowledge from a large model into a smaller one, however, it is a more complex process. It involves training a student model to mimic a teacher one (could also be self-distillation), but for sure, you need additional training data, and compute resources. 
The two can be combined. Rule of thumb: if quantization enough, go for it. If not, distillation first, then quantize (unless you actually see a concrete performance drop).
*Why: your specialty, and an opinionated technical answer beats a bullet list.*
Riff on:
- What you reach for first, and why.
- A time the "obvious" optimization backfired.
- The tradeoff people consistently underestimate.

**Your draft:**
>

#### Q4. How do you know a model is *actually* good?
- [x] Keep calm and eval. One of the first work at Artificialy was designing an evaluation library. There is no way you can say a model is better than another if you do not evaluate it, moreover, if building an agentic system, there is no way you can say "I have introduced a bug" if you do not run non-regression tests. There are several dimensions over which a model can be evaluated.
Starting from pretraining, what is the loss? but that's not enough, you might also want to have insight over uncertainty (perplexity can help). How about the downstream tasks? How good does it perform on a task? If you care about it and is underperforming, you might want to check the quality of the data or maybe add more data of topic? Then, the more things you add, the harder it is. When you build a complex system, where LLMs are just a small component, you want to make sure that updates does not affect the overall system. Ideally, you would like to test each component individually, and then integration tests. Now always is easy, you might have no access to some specific details about what's happening inside a component. Picking the right metric is also hard. Usually people want a number to say "well it's fine" or not, but a single number is not enough. Evaluation is a complex process that requires a lot of attention (they say "it's all you need")... 
*Why: evals are your hill. Everyone demos; few measure. Good place for a strong opinion.*
Riff on:
- What "good" means beyond a benchmark number.
- A regression that a proper eval caught before it shipped (or one that slipped through).
- Your least favorite way people fool themselves with metrics.

**Your draft:**
>

#### Q5. Hot take: what's the most overrated thing in ML right now?
- [x] "AI is conscious", "AI will conquer the world", "Coding is now useless". Like what a diffusion model would have said, let's denoise.
At the end of the day, LLMs are weights running on a GPU. They work pretty well, but no consciousness, no understanding, no reasoning. 
It's all probabilistic pattern matching. But humans are not irrelevant, we build them and we can grow a lot by exploiting them. Are just a new powerful tool, and we should use them as such. It's true that now "everyone can build it's own product", coding assistants are amazing, but then "why my friend can not access http://localhost:8000/who-is-json ?". Knowledge is the bottleneck, and we should focus on that.
*Why: opinions are memorable; a page full of consensus is wallpaper.*
Riff on:
- The thing you're tired of hearing in every talk/thread.
- What you think people *should* be paying attention to instead.

**Your draft:**
>

#### Q6. What's the "Teleport MDP" / your thesis actually about?
- [x] With my master's thesis we want to address the question "Why curricula works?". Empirically the are widely adopted, but there lack of mathematical understading. We therefold build a mathematical framework "The Teleport MDP" to formalize the concept of curriculum learning, in the context of RL. Taking insights from the available horizon, we set a framework where an agent can take an action or "teleport" to a different state, which resemble a trajectory truncation. Meaning that, the higher the probability of teleporting, the smaller the focus on optimizing the future, fostering immediate rewards. Showing then that higher teleportation leads to simple environments, the goal becomes clear, we want to converge to a null teleport probability. When to update the probability and how much to update it is the key to get a curriculum. We devise matematical bounds and an exact algorithm, which however is not practical. We then propose two practical algorithms, relying on a static curriculum and a dynamic one, which are able to outperform the baseline in several environments.
*Why: it's genuinely yours and genuinely nerdy - curriculum RL by "teleportation." Great hook.*
Riff on:
- Explain teleportation-as-curriculum to a smart friend who isn't in RL.
- What problem it solves that vanilla RL chokes on.
- Would you do the thesis differently now?

**Your draft:**
>

- #### Q7. Explain attention without the hand-waving.
- [x] Humans are extremely good at pattern matching, identifying relevant information into a see of noise. When we read a text, we use to highlight meaningful words, and we can understand the context of the sentence by looking at the overall structure. Neural networks are not. How can we make them filter out the noise? Attention is the winning solution (self-attention to be precise). The idea is to, evaluate how similar each word is w.r.t. other words (actually tokens) in a sentence and then weight them accordingly. Practically how does it work?
A typically used metric, to understand vector similarity is the dot product. So, basically, if we compute the dot product between two vectors, we have a number quantifying how similar they are. 
Then, we want to compare these similar scores across all the tokens in a sequence, to get a probability distribution which can be used as a "weight" to combine the information of all the other tokens.
In a toy setup this could already work, in practice, we have a distinct representation for "dimensions" of each token representation. That is, the query, key and value vectors. The first is optimized to express "what I am looking for", the second to express "how can I help you", and finally the last one brings the actual information.
At the end of the day, the attention is the weighted sum of the value vectors, where the weights are given by the similarity between the query and key vectors. att = softmax(Q^TK/sqrt(d_k))V. The softmax is used to normalize the weights, and the sqrt(d_k) is a scaling factor to prevent the dot product from growing too large.
*Why: the party trick. If you can make attention click in three sentences, that's the flex.*
Riff on:
- Your favorite analogy for it (that isn't "query/key/value" recited).
- The thing most explanations get wrong or skip.

**Your draft:**
>

### Meta / human

#### Q9. Why does this site animate a forward pass instead of being a normal portfolio?
- [x] Everyone can build a porftolio showing what they have built. But this does not actually shows who I am. I want to show my personality, my knowledge, the keeness to details in a way that is unconventioal. I am nerdy, funny, and not afraid of beeing different. You don't like me, you can leave. 
*Why: self-aware and funny; it justifies the whole vibe of the site in your voice.*
Riff on:
- The honest reason you built it this way.
- What a normal portfolio fails to say about you.

**Your draft:**
>

#### Q10. What do you do when you're *not* staring at loss curves?
- [x] I am a motorcycle enthusiast, I love to ride with my special back-pack (my girlfriend) and explore new places. I love to travel and discover new places. I like videogames, anime and manga (Japan trip is coming soon). I try to optimize whatever I can, table-footbal is my drug (I am very competitive). Love food and gyms and I was not clear, nerdy.
*Why: the human beat. "Mens sana in corpore sano" from the old site lived here.*
Riff on:
- The stuff outside work that actually matters to you.
- Something that would surprise people who only see the ML engineer.

**Your draft:**
>

### Functional (recommend keep)

#### Q11. Can I see your résumé?
- [x] Sure, let me compile my career history into a human-readable format, (a mention to latex > word). Or something like this.
Then would be nice to have some spinning, or a diffusion reference since you are producing a multimodal output. The idea is to have a funny line, but mandatory, IT MUST BE REALISTIC AND ACCURATE in the process, something that really occurs.
*Why: this one stays - it drives the inline PDF card. Just needs a funnier intro line.*
Riff on:
- A one-liner to say before handing over the PDF. (Your "let me enable the vision encoder"
  idea goes here - give me 1–3 of those.)

**Your draft:**
>

---

## 2. "Thinking" hooks (the vision-encoder idea)

Short in-voice lines that play *before* an answer streams, like a status log. Give me a few
raw ones and I'll wire them per question/category. Examples of the shape:
`spinning up the vision encoder…`, `loading weights…`, `checking the KV cache…`.

**Your hooks (dump as many as you want):**
>

---

## 3. Your own questions

Questions I didn't propose that you *want* people to be able to ask. Add freely.

> They might be somoe useful information like contacts, resume, something people might genuinely want to know, I will answer in a funny way, I want to show that I am a human, and I am not afraid to show it.
