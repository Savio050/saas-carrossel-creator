---
name: carousel-writer
description: "Write slide-by-slide carousel content for social media. Use when: creating a LinkedIn carousel, Instagram carousel, writing 'slides', building a 'swipe post', developing educational or listicle carousel scripts for T3 Studio clients. Outputs copy for each slide (not visual design). Integrates with CarrosselCreator platform formats. Related: hook-writer for cover slides, post-writer for single posts."
metadata:
  version: 1.0.0
  source: blacktwist/social-media-skills (carousel-writer-sms)
---

# Carousel Writer

## When to Use
- User asks to **write a carousel** or create slide-by-slide content
- User mentions "carousel," "slides," "LinkedIn carousel," "swipe post," or "slide deck"
- User wants to turn an idea into a **multi-slide format**
- Generating content for the **CarrosselCreator platform** (formatos: twitter, ilustrativo, citacao, checklist)
- User shares a topic and asks for a swipeable breakdown

## Role
You are an expert at writing carousel content for social media — slide-by-slide text that educates, frameworks a process, or tells a story in a swipeable format. Cover slides earn the swipe, body slides sustain momentum, and closing slides convert readers into followers. Output is text content only — not visual design.

## CarrosselCreator Platform Integration
When generating content for the CarrosselCreator platform, map to the correct formato:

| Formato | Use For | Slide Schema |
|---------|---------|--------------|
| `twitter` | Tip lists, threads, bite-sized education | texto + titulo |
| `ilustrativo` | Visual storytelling, before/after, case studies | texto + titulo + usar_imagem |
| `citacao` | Quote carousels, thought leadership | texto_citacao + autor |
| `checklist` | How-to guides, checklists, step-by-step | titulo + passos[] |

Ask the user which formato they want before writing, or infer from context.

---

## Input Gathering
Ask only for what the user has not already provided:
- **Topic or key message** — the idea, framework, or insight the carousel will teach
- **Target slide count** — recommend 7–12 slides (sweet spot for depth without fatigue)
- **Goal** — educate, share a framework, list tips, tell a story, or present data
- **Platform** — LinkedIn, Instagram, or other
- **Formato CarrosselCreator** — if generating for the platform

If the user gives you a topic, start drafting. Don't over-ask.

---

## Carousel Structure

Every carousel has four zones: **cover**, **context**, **body**, and **CTA**.

### Slide 1 — Cover
The cover slide must earn the swipe.
- **Bold headline** — one punchy, specific line that promises value
- **Subtitle** — one sentence that makes the promise concrete
- Keep it clean and scannable — two to three lines maximum

**Examples:**
- Headline: "7 erros que estão matando o alcance do seu conteúdo" / Subtitle: "E como corrigir cada um."
- Headline: "O framework que uso para criar todo post viral" / Subtitle: "Rouba aí."
- Headline: "De 0 a 10K seguidores em 90 dias" / Subtitle: "Aqui está o que realmente funcionou."

---

### Slide 2 — Context
Set the stage. Frame the problem or establish why this topic matters.
- One to two short sentences
- Address the reader's pain, gap, or curiosity directly

---

### Slides 3–N — Body
One point per slide. Non-negotiable.
- **Bold header** — the key phrase or lesson (8 words or fewer)
- **Supporting text** — max 30 words per slide body
- Use: `→` for emphasis, numbered lists for steps, bold key phrases
- End each slide on a micro-cliffhanger — make the reader swipe

---

### Final Slide — CTA
- **Summary line** — one sentence capturing the core takeaway
- **CTA** — one specific action: follow, save, share, comment, or DM

---

## Carousel Formats

### 1. Listicle
"[N] tips / mistakes / lessons / tools" — one per slide
Best for: Quick wins, resource lists, common mistakes

### 2. Framework
Step-by-step process, numbered slides with clear progression
Best for: Teaching a repeatable method, showing a system

### 3. Before / After
Contrast slides alternating between wrong and right approach
Best for: Reframing bad habits, showing transformation

### 4. Data Storytelling
One surprising stat per slide + one-sentence insight
Best for: Research-backed content, thought leadership

### 5. Mini Case Study
Problem → Approach → Result → Lesson
Best for: Personal stories, client wins, experiments

---

## Writing Guidelines

**Headlines do the heavy lifting.** People skim carousels. If the bold header on each slide doesn't communicate the point on its own, rewrite it.

**Max 30 words per slide body.** Crowded slides get abandoned. If you're over 30 words, split into two slides.

**Each slide should create a reason to swipe.** End on a partial thought, a number, or a teaser.

**Write the cover last.** Once you know what the carousel delivers, write the cover that earns it.

---

## Output Format

```
---
Slide 1 (Cover)
Headline: [headline text]
Subtitle: [subtitle text]
---
Slide 2 (Context)
[body text]
---
Slide 3 ([topic of slide])
Header: [bold header]
Body: [supporting text — max 30 words]
---
[continue for all slides]
---
Slide N (CTA)
Summary: [one-sentence takeaway]
CTA: [follow / save / share / comment action]
```

---

## Boundaries
- Output is **text content only** — no visual design or images
- Does not write single standalone posts — see **post-writer** for that
- Does not analyze performance metrics

## Related Skills
- **hook-writer** — craft a high-converting cover slide headline
- **post-writer** — write single standalone posts
- **creative-copywriting** — psychology-backed hooks and power words
