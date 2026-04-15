/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const path = require('path');
const _ = require('lodash');
const Parser = require('rss-parser');

const BLOGGER_FEED_URL = 'https://blog.flixacct.club/feeds/posts/default?alt=rss';
const BLOGGER_JSON_FEED_URL = 'https://blog.flixacct.club/feeds/posts/default?alt=json';
const BLOGGER_MAX_RESULTS = 150;
const parser = new Parser({
  customFields: {
    item: ['content:encoded', 'media:thumbnail'],
  },
});

const getBloggerAlternateLink = links =>
  (links || []).find(link => link.rel === 'alternate' && link.type === 'text/html')?.href || '';

const extractBloggerImage = content =>
  content.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;

const fetchBloggerJsonEntries = async reporter => {
  const entries = [];
  let startIndex = 1;
  let totalResults = Infinity;

  while (entries.length < totalResults) {
    const url = `${BLOGGER_JSON_FEED_URL}&max-results=${BLOGGER_MAX_RESULTS}&start-index=${startIndex}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Blogger feed request failed with ${response.status}`);
    }

    const data = await response.json();
    const feed = data.feed || {};
    const pageEntries = feed.entry || [];

    totalResults = Number(feed.openSearch$totalResults?.$t || pageEntries.length || 0);
    entries.push(...pageEntries);

    if (pageEntries.length === 0 || pageEntries.length < BLOGGER_MAX_RESULTS) {
      break;
    }

    startIndex += pageEntries.length;
  }

  reporter.info(`Sourced ${entries.length} Blogger archive posts from JSON feed`);
  return entries;
};

exports.sourceNodes = async ({ actions, createNodeId, createContentDigest, reporter }) => {
  const { createNode } = actions;

  try {
    const feed = await parser.parseURL(BLOGGER_FEED_URL);

    feed.items.forEach((item, index) => {
      const title = item.title || 'Untitled post';
      const link = item.link || '';
      const content = item['content:encoded'] || item.content || item.contentSnippet || '';
      const pubDate = item.isoDate || item.pubDate || null;
      const image =
        item.enclosure?.url ||
        item['media:thumbnail']?.url ||
        item.thumbnail ||
        (content.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null);
      const labels = (item.categories || []).map(category =>
        typeof category === 'string'
          ? category
          : category?.label || category?._ || String(category),
      );

      createNode({
        id: createNodeId(`blogger-post-${index}-${link || title}`),
        parent: null,
        children: [],
        internal: {
          type: 'BloggerRssPost',
          contentDigest: createContentDigest(item),
        },
        title,
        link,
        content,
        excerpt: item.contentSnippet || '',
        pubDate,
        imageUrl: image,
        labels,
      });
    });
  } catch (error) {
    reporter.warn(`Unable to source Blogger RSS feed: ${error.message}`);
  }

  try {
    const entries = await fetchBloggerJsonEntries(reporter);

    entries.forEach(entry => {
      const title = entry.title?.$t || 'Untitled post';
      const content = entry.content?.$t || '';
      const summary = entry.summary?.$t || '';
      const labels = (entry.category || []).map(category => category.term).filter(Boolean);
      const published = entry.published?.$t || null;
      const updated = entry.updated?.$t || null;
      const link = getBloggerAlternateLink(entry.link);
      const imageUrl = entry['media$thumbnail']?.url || extractBloggerImage(content);

      createNode({
        id: createNodeId(`blogger-archive-${entry.id?.$t || link || title}`),
        parent: null,
        children: [],
        internal: {
          type: 'BloggerArchivePost',
          contentDigest: createContentDigest(entry),
        },
        bloggerId: entry.id?.$t || null,
        title,
        link,
        content,
        summary,
        labels,
        published,
        updated,
        imageUrl,
      });
    });
  } catch (error) {
    reporter.warn(`Unable to source Blogger archive feed: ${error.message}`);
  }
};

exports.createPages = async ({ actions, graphql, reporter }) => {
  const { createPage } = actions;
  const postTemplate = path.resolve(`src/templates/post.js`);
  const tagTemplate = path.resolve('src/templates/tag.js');

  const result = await graphql(`
    {
      postsRemark: allMarkdownRemark(
        filter: { fileAbsolutePath: { regex: "/content/posts/" } }
        sort: { order: DESC, fields: [frontmatter___date] }
        limit: 1000
      ) {
        edges {
          node {
            frontmatter {
              slug
            }
          }
        }
      }
      tagsGroup: allMarkdownRemark(limit: 2000) {
        group(field: frontmatter___tags) {
          fieldValue
        }
      }
    }
  `);

  // Handle errors
  if (result.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`);
    return;
  }

  // Create post detail pages
  const posts = result.data.postsRemark.edges;

  posts.forEach(({ node }) => {
    createPage({
      path: node.frontmatter.slug,
      component: postTemplate,
      context: {},
    });
  });

  // Extract tag data from query
  const tags = result.data.tagsGroup.group;
  // Make tag pages
  tags.forEach(tag => {
    createPage({
      path: `/pensieve/tags/${_.kebabCase(tag.fieldValue)}/`,
      component: tagTemplate,
      context: {
        tag: tag.fieldValue,
      },
    });
  });
};

// https://www.gatsbyjs.org/docs/node-apis/#onCreateWebpackConfig
exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
  // https://www.gatsbyjs.org/docs/debugging-html-builds/#fixing-third-party-modules
  if (stage === 'build-html' || stage === 'develop-html') {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /scrollreveal/,
            use: loaders.null(),
          },
          {
            test: /animejs/,
            use: loaders.null(),
          },
          {
            test: /miniraf/,
            use: loaders.null(),
          },
        ],
      },
    });
  }

  actions.setWebpackConfig({
    resolve: {
      alias: {
        '@components': path.resolve(__dirname, 'src/components'),
        '@config': path.resolve(__dirname, 'src/config'),
        '@fonts': path.resolve(__dirname, 'src/fonts'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@images': path.resolve(__dirname, 'src/images'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@utils': path.resolve(__dirname, 'src/utils'),
      },
    },
  });
};
