import React, { useState, useEffect, useRef } from 'react';
import { Link, useStaticQuery, graphql } from 'gatsby';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import styled from 'styled-components';
import { srConfig } from '@config';
import sr from '@utils/sr';
import { Icon } from '@components/icons';
import { usePrefersReducedMotion } from '@hooks';

const StyledProjectsSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 1240px;
  padding-top: 40px;
  padding-bottom: 40px;

  h2 {
    font-size: clamp(24px, 5vw, var(--fz-heading));
  }

  .archive-link {
    font-family: var(--font-mono);
    font-size: var(--fz-sm);
    &:after {
      bottom: 0.1em;
    }
  }

  .projects-grid {
    ${({ theme }) => theme.mixins.resetList};
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-gap: 40px;
    position: relative;
    margin-top: 70px;

    @media (max-width: 1280px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (max-width: 1080px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  .more-button {
    ${({ theme }) => theme.mixins.button};
    margin: 80px auto 0;
  }
`;

const StyledProject = styled.li`
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background: var(--light-navy);
  ${({ theme }) => theme.mixins.boxShadow};
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  @media (prefers-reduced-motion: no-preference) {
    &:hover,
    &:focus-within {
      transform: translateY(-8px);
      box-shadow: 0 20px 30px -15px var(--navy-shadow);
    }
  }

  a {
    position: relative;
    z-index: 1;
  }

  .pThmb {
    position: relative;
    display: block;
    aspect-ratio: 16 / 9;
    background: var(--navy);
    overflow: hidden;

    &:before {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(100, 255, 218, 0.08);
      z-index: 1;
      pointer-events: none;
    }

    img,
    .gatsby-image-wrapper {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .pCntn {
    padding: 18px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .pHdr {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .pLbls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    a {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 999px;
      background: transparent;
      color: var(--green);
      font-family: var(--font-mono);
      font-size: 10px;
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border: 1px solid var(--green);
      box-shadow: none;

      &:hover,
      &:focus-visible {
        transform: none;
        box-shadow: none;
      }
    }
  }

  .project-links {
    display: flex;
    gap: 8px;
    color: var(--light-slate);

    a {
      ${({ theme }) => theme.mixins.flexCenter};
      padding: 6px;

      svg {
        width: 18px;
        height: 18px;
      }
    }
  }

  .project-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 4px;
    border-top: 1px solid rgba(136, 146, 176, 0.12);
    color: var(--light-slate);
    font-family: var(--font-mono);
    font-size: var(--fz-xxs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .pTtl {
    margin: 0;
    font-size: clamp(18px, 2.1vw, 22px);
    line-height: 1.25;
    color: var(--lightest-slate);

    a {
      display: inline;
      position: static;
    }
  }

  .pSnpt {
    color: var(--light-slate);
    font-size: 15px;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .pInf {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    color: var(--light-slate);
    font-family: var(--font-mono);
    font-size: var(--fz-xxs);
    padding-top: 6px;

    .read-more {
      color: var(--green);
      font-size: 12px;
      white-space: nowrap;

      &:after {
        display: none;
      }
    }
  }
`;

const Projects = () => {
  const data = useStaticQuery(graphql`
    query {
      projects: allBloggerRssPost(sort: { fields: [pubDate], order: DESC }) {
        edges {
          node {
            title
            link
            content
            excerpt
            pubDate
            labels
            imageUrl
          }
        }
      }
    }
  `);

  const [showMore, setShowMore] = useState(false);
  const revealTitle = useRef(null);
  const revealArchiveLink = useRef(null);
  const revealProjects = useRef([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    sr.reveal(revealTitle.current, srConfig());
    sr.reveal(revealArchiveLink.current, srConfig());
    revealProjects.current.forEach((ref, i) => sr.reveal(ref, srConfig(i * 100)));
  }, []);

  const GRID_LIMIT = 6;
  const projects = data.projects.edges.filter(({ node }) => node);
  const firstSix = projects.slice(0, GRID_LIMIT);
  const projectsToShow = showMore ? projects : firstSix;

  const projectInner = node => {
    const { title, link, content, excerpt, pubDate, labels, imageUrl } = node;
    const snippet = excerpt || content.replace(/<[^>]+>/g, '').slice(0, 180);
    const published = pubDate
      ? new Date(pubDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      : '';

    return (
      <>
        <a className="pThmb" href={link} target="_blank" rel="noreferrer" aria-label={title}>
          {imageUrl ? <img src={imageUrl} alt={title} loading="lazy" /> : null}
        </a>

        <div className="pCntn">
          <div className="pHdr">
            <div className="pLbls">
              {labels && labels.slice(0, 1).map((label, i) => <span key={i}>{label}</span>)}
            </div>
            <div className="project-links">
              <a href={link} aria-label="Open post" target="_blank" rel="noreferrer">
                <Icon name="External" />
              </a>
            </div>
          </div>

          <h3 className="pTtl">
            <a href={link} target="_blank" rel="noreferrer">
              {title}
            </a>
          </h3>

          <div className="pSnpt">{snippet}</div>

          <div className="pInf">
            <span>{published}</span>
            <a className="read-more" href={link} target="_blank" rel="noreferrer">
              Keep reading
            </a>
          </div>
        </div>
      </>
    );
  };

  return (
    <StyledProjectsSection>
      <h2 ref={revealTitle}>Read Our Blog!</h2>

      <Link className="inline-link archive-link" to="/archive" ref={revealArchiveLink}>
        view the archive
      </Link>

      <ul className="projects-grid">
        {prefersReducedMotion ? (
          <>
            {projectsToShow &&
              projectsToShow.map(({ node }, i) => (
                <StyledProject key={i}>{projectInner(node)}</StyledProject>
              ))}
          </>
        ) : (
          <TransitionGroup component={null}>
            {projectsToShow &&
              projectsToShow.map(({ node }, i) => (
                <CSSTransition
                  key={i}
                  classNames="fadeup"
                  timeout={i >= GRID_LIMIT ? (i - GRID_LIMIT) * 300 : 300}
                  exit={false}>
                  <StyledProject
                    key={i}
                    ref={el => (revealProjects.current[i] = el)}
                    style={{
                      transitionDelay: `${i >= GRID_LIMIT ? (i - GRID_LIMIT) * 100 : 0}ms`,
                    }}>
                    {projectInner(node)}
                  </StyledProject>
                </CSSTransition>
              ))}
          </TransitionGroup>
        )}
      </ul>

      <button className="more-button" onClick={() => setShowMore(!showMore)}>
        Show {showMore ? 'Less' : 'More'}
      </button>
    </StyledProjectsSection>
  );
};

export default Projects;
