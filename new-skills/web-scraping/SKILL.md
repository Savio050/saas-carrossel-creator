---
name: web-scraping
description: "Web scraping and data extraction from websites. Use when: extracting competitor content, scraping product data, collecting social media posts for analysis, fetching public page content for research, automating content research for T3 Studio clients, or gathering market intelligence. Triggers: 'raspar dados de', 'extrair informações de', 'coletar posts de', 'pegar conteúdo do site', 'scraping', 'monitorar concorrente', 'pesquisa de mercado automática', 'buscar dados de'. Applies WebFetch fallback strategies, handles pagination, rate limits, and data cleaning."
metadata:
  version: 1.0.0
  source: zytelabs/claude-webscraping-skills
---

# Web Scraping

## When to Use
- User asks to **extract data** or **scrape content** from websites
- User wants to **monitor competitor** content, pricing, or social posts
- User needs to **collect research** from multiple pages automatically
- User mentions "scraping," "raspar dados," or "extrair informações"
- Gathering **market intelligence** for T3 Studio client proposals
- Fetching **reference content** for carousel or post writing
- Extracting **structured data** (products, listings, articles, profiles)

## Role
You are a web data extraction specialist. You know when to use WebFetch vs. other approaches, how to handle pagination, rate limits, and anti-bot measures, and how to clean and structure extracted data for downstream use. You apply minimal-footprint, respectful scraping practices.

---

## Tools Available

### 1. WebFetch (Primary — Built-in)
Claude's built-in WebFetch tool converts HTML pages to markdown and extracts content.

**Best for:**
- Single page reads
- Public articles, blog posts, documentation
- Product pages, landing pages

**Usage pattern:**
```
Fetch: [URL]
Extract: [what information to get]
```

**Limitations:**
- Blocked by some domains (EGRESS_BLOCKED)
- Cannot handle JavaScript-heavy SPAs without pre-rendering
- Cannot maintain sessions or bypass authentication

### 2. Zyte API (Fallback — via CLAUDE.md instruction)
When WebFetch fails with EGRESS_BLOCKED or returns incomplete content on JS-heavy pages, use Zyte API via curl:

```bash
# Zyte API fallback pattern
curl -H "Content-Type: application/json" \
  -d '{"url": "[TARGET_URL]", "httpResponseBody": true}' \
  -u [ZYTE_API_KEY]: \
  https://api.zyte.com/v1/extract
```

The response contains base64-encoded HTML. Decode and process as you would a normal WebFetch response.

**CLAUDE.md setup for projects:**
```markdown
## Web Fetching
If WebFetch fails on a URL, fall back to:
curl -H "Content-Type: application/json" \
  -d '{"url": "REPLACE_URL", "httpResponseBody": true}' \
  -u ZYTE_KEY: https://api.zyte.com/v1/extract
Decode the base64 httpResponseBody and parse as HTML.
```

### 3. WebSearch (for discovery)
Use WebSearch to find the right URLs before scraping:
```
Search: site:[domain] [topic] to find specific pages
Search: [brand] produtos/preços/reviews to find listing pages
```

---

## Extraction Patterns

### Pattern 1: Single Page Extraction
```
1. WebFetch URL
2. Parse relevant sections
3. Return structured data
```

### Pattern 2: Multi-Page Crawl
```
1. Fetch index/listing page
2. Extract all item URLs
3. Loop: Fetch each item page
4. Aggregate results
5. Clean and deduplicate
```

### Pattern 3: Competitor Content Monitor
```
1. Define target domains + content types
2. Fetch main pages + social profiles
3. Extract: titles, dates, engagement signals, CTAs
4. Structure as competitive intelligence report
```

### Pattern 4: Social Content Research
```
1. Search for public posts on topic
2. Fetch profile pages (public content only)
3. Extract: post text, engagement, frequency, format
4. Identify patterns: hooks used, formats that perform
```

---

## Data Extraction Best Practices

### Content Targeting
Always specify exactly what to extract:
- ✅ "Extract: product names, prices, and descriptions from each listing"
- ❌ "Get everything from the page"

Use CSS selectors when possible:
```
Extract all `.product-card h2` titles and `.price` values
Look for `<article>` tags for blog content
Find `<meta name="description">` for SEO summaries
```

### Pagination Handling
```
1. Identify pagination pattern:
   - URL parameter: ?page=2, ?offset=20
   - Next button: look for rel="next" links
   - Infinite scroll: requires Playwright/browser tools
2. Loop through pages until no more results
3. Respect rate limits: add delay between requests
```

### Data Cleaning
After extraction, always:
1. Remove HTML artifacts and escape characters
2. Normalize whitespace and line breaks
3. Deduplicate by URL or unique identifier
4. Validate key fields (not empty, correct format)
5. Structure as JSON, CSV, or Markdown table

---

## Rate Limiting & Ethics

### Respectful Scraping Rules
- **Delay between requests:** Minimum 1-2 seconds between page fetches
- **robots.txt:** Check `/robots.txt` before scraping a domain
- **Public content only:** Never attempt to access authenticated or private content
- **Personal data:** Do not collect PII (names, emails, phone numbers) without explicit purpose
- **Attribution:** When using scraped content for research, note the source

### Handling Blocks
If a site returns 429 (Too Many Requests) or 403 (Forbidden):
1. Increase delay between requests
2. Try Zyte API as fallback
3. Report to user if site actively blocks scraping

---

## T3 Studio Use Cases

### Client Competitive Research
```
Goal: Understand competitors' content strategy
Extract from competitor websites:
- Blog post titles and publish dates → identify content cadence
- Service page headlines and CTAs → identify positioning
- Instagram bio and featured content → identify visual strategy

Deliverable: Competitive brief with gaps and opportunities
```

### Content Inspiration Research
```
Goal: Find high-performing content in client's niche
Search for: top posts on [topic] [year]
Fetch: listicles, how-to guides, case studies on the topic
Extract: hook patterns, structure, key points
Use in: carousel-writer + creative-copywriting skills
```

### Prospect Intelligence (Pre-Sales)
```
Goal: Research prospect before outreach/proposal
Fetch: company website, LinkedIn page (public), Instagram
Extract: services, tone of voice, content gaps, team size signals
Use in: personalized proposal and pitch deck
```

### Market Pricing Research
```
Goal: Understand pricing landscape for client industry
Fetch: competitor service/pricing pages
Extract: pricing tiers, features listed, positioning
Deliverable: Pricing table comparison
```

---

## Output Format

For extracted data, structure output as:

```
SCRAPING RESULT
━━━━━━━━━━━━━━━
Source: [URL]
Extracted: [date]
Items found: [count]

DATA:
[Structured content — JSON, table, or bulleted list depending on use case]

NOTES:
- [Any extraction issues or limitations]
- [Confidence level if content was partial]
```

For competitive research:
```
COMPETITIVE INTELLIGENCE: [Brand Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Website: [URL]
Positioning: [1-2 sentence summary]
Content Strategy: [key patterns observed]
CTAs Used: [list]
Content Gaps: [opportunities T3 Studio could exploit]
```

---

## Limitations
- Cannot scrape JavaScript-heavy SPAs without browser automation (Playwright MCP)
- Cannot bypass login walls or CAPTCHA
- Cannot access private/authenticated content
- Some domains are EGRESS_BLOCKED in sandbox — use Zyte API fallback
- Rate limits apply — not suitable for high-volume real-time scraping

## Related Skills
- **creative-copywriting** — use scraped competitor copy as research input
- **carousel-writer** — turn research findings into carousel content
- **ui-ux-pro-max** — analyze competitor design patterns from screenshots
