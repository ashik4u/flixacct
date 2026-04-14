# Flixacct

Flixacct is a Gatsby-powered website for showcasing projects, publishing technical content, and highlighting the broader Flixacct ecosystem.

The site combines:

- A branded landing page with section-based content
- Featured project entries stored as Markdown
- A local "Pensieve" blog stored in Markdown
- An external Blogger RSS feed that is sourced at build time and displayed on the site

## Stack

- Gatsby 4
- React 17
- styled-components
- gatsby-transformer-remark
- gatsby-plugin-image / sharp
- rss-parser

## Local Development

1. Use the Node version from `.nvmrc`

   ```sh
   nvm install
   nvm use
   ```

2. Install dependencies

   ```sh
   npm install
   ```

3. Start the development server

   ```sh
   npm start
   ```

4. Open the site locally

   ```text
   http://localhost:8000
   ```

5. Open GraphiQL if you want to inspect Gatsby data

   ```text
   http://localhost:8000/___graphql
   ```

## Scripts

- `npm start` starts Gatsby in development mode
- `npm run develop` starts Gatsby in development mode
- `npm run build` creates a production build
- `npm run serve` serves the production build locally
- `npm run clean` clears Gatsby caches

## Content Structure

### Homepage Sections

The homepage is assembled in `src/pages/index.js` from section components in `src/components/sections/`.

- `hero.js`
- `about.js`
- `jobs.js`
- `featured.js`
- `projects.js`
- `contact.js`

### Markdown Content

- `content/jobs/`
  Tabbed experience section
- `content/featured/`
  Featured projects shown on the homepage
- `content/projects/`
  Archive entries shown on `/archive`
- `content/posts/`
  Local Pensieve blog posts

### Remote Content

The site sources posts from the Blogger RSS feed below during Gatsby builds:

```text
https://blog.flixacct.club/feeds/posts/default?alt=rss
```

This logic lives in `gatsby-node.js` and creates `BloggerRssPost` nodes used by the homepage post grid.

## Key Files

- `gatsby-config.js`
  Site metadata, plugins, filesystem sources, manifest, analytics
- `gatsby-node.js`
  RSS ingestion, dynamic page creation, webpack aliases
- `src/config.js`
  Email, social links, nav links, shared colors, scroll reveal config
- `src/components/layout.js`
  Shared layout wrapper used by pages
- `src/components/head.js`
  SEO metadata and social tags

## Notes

- This repo started from a portfolio template and has been adapted to the Flixacct brand.
- Some component names still reflect the original template structure even where the content model has changed.
- The site depends on the external Blogger feed for part of the homepage content, so offline or blocked network access may reduce what appears during builds.
