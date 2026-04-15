import React, { useRef, useEffect } from 'react';
import { graphql } from 'gatsby';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';
import { srConfig } from '@config';
import sr from '@utils/sr';
import { Layout } from '@components';
import { Icon } from '@components/icons';
import { usePrefersReducedMotion } from '@hooks';

const StyledTableContainer = styled.div`
  margin: 100px -20px;

  @media (max-width: 768px) {
    margin: 50px -10px;
  }

  table {
    width: 100%;
    border-collapse: collapse;

    .hide-on-mobile {
      @media (max-width: 768px) {
        display: none;
      }
    }

    tbody tr {
      &:hover,
      &:focus {
        background-color: var(--light-navy);
      }
    }

    th,
    td {
      padding: 10px;
      text-align: left;

      &:first-child {
        padding-left: 20px;

        @media (max-width: 768px) {
          padding-left: 10px;
        }
      }

      &:last-child {
        padding-right: 20px;

        @media (max-width: 768px) {
          padding-right: 10px;
        }
      }

      svg {
        width: 20px;
        height: 20px;
      }
    }

    tr {
      cursor: default;

      td:first-child {
        border-top-left-radius: var(--border-radius);
        border-bottom-left-radius: var(--border-radius);
      }

      td:last-child {
        border-top-right-radius: var(--border-radius);
        border-bottom-right-radius: var(--border-radius);
      }
    }

    td {
      &.year {
        padding-right: 20px;

        @media (max-width: 768px) {
          padding-right: 10px;
          font-size: var(--fz-sm);
        }
      }

      &.title {
        padding-top: 15px;
        padding-right: 20px;
        color: var(--lightest-slate);
        font-size: var(--fz-xl);
        font-weight: 600;
        line-height: 1.25;
      }

      &.date {
        font-size: var(--fz-sm);
        white-space: nowrap;
      }

      &.labels {
        font-size: var(--fz-xxs);
        font-family: var(--font-mono);
        line-height: 1.5;

        .separator {
          margin: 0 5px;
        }

        span {
          display: inline-block;
        }
      }

      &.links {
        min-width: 70px;

        a {
          ${({ theme }) => theme.mixins.flexCenter};
          width: fit-content;
        }
      }
    }
  }
`;

const formatDate = value =>
  new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const ArchivePage = ({ location, data }) => {
  const posts = data.allBloggerArchivePost.nodes;
  const revealTitle = useRef(null);
  const revealTable = useRef(null);
  const revealPosts = useRef([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    sr.reveal(revealTitle.current, srConfig());
    sr.reveal(revealTable.current, srConfig(200, 0));
    revealPosts.current.forEach((ref, i) => sr.reveal(ref, srConfig(i * 10)));
  }, []);

  return (
    <Layout location={location}>
      <Helmet title="Archive" />

      <main>
        <header ref={revealTitle}>
          <h1 className="big-heading">Archive</h1>
          <p className="subtitle">Posts sourced from the Flixacct blog sitemap</p>
        </header>

        <StyledTableContainer ref={revealTable}>
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Title</th>
                <th className="hide-on-mobile">Published</th>
                <th className="hide-on-mobile">Labels</th>
                <th>Link</th>
              </tr>
            </thead>

            <tbody>
              {posts.map((post, i) => {
                const { title, link, published, labels } = post;
                const year = new Date(published).getFullYear();

                return (
                  <tr key={link || `${title}-${i}`} ref={el => (revealPosts.current[i] = el)}>
                    <td className="overline year">{year}</td>
                    <td className="title">{title}</td>
                    <td className="date hide-on-mobile">{formatDate(published)}</td>
                    <td className="labels hide-on-mobile">
                      {labels?.length > 0 ? (
                        labels.map((label, index) => (
                          <span key={`${label}-${index}`}>
                            {label}
                            {index !== labels.length - 1 && (
                              <span className="separator">&middot;</span>
                            )}
                          </span>
                        ))
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="links">
                      {link ? (
                        <a href={link} aria-label={`Open ${title}`} target="_blank" rel="noreferrer">
                          <Icon name="External" />
                        </a>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </StyledTableContainer>
      </main>
    </Layout>
  );
};

ArchivePage.propTypes = {
  location: PropTypes.object.isRequired,
  data: PropTypes.shape({
    allBloggerArchivePost: PropTypes.shape({
      nodes: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          link: PropTypes.string,
          published: PropTypes.string.isRequired,
          labels: PropTypes.arrayOf(PropTypes.string),
        }),
      ).isRequired,
    }).isRequired,
  }).isRequired,
};

export default ArchivePage;

export const pageQuery = graphql`
  {
    allBloggerArchivePost(sort: { fields: [published], order: DESC }) {
      nodes {
        title
        link
        published
        labels
      }
    }
  }
`;
