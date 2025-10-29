import { styled } from 'styled-components';

export const Container = styled.div`
  font-family: Arial, sans-serif;
  line-height: 1.6;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    margin-bottom: 1rem;
  }

  pre {
    background: #282c34;
    color: #61dafb;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
  }

  code {
    background: #eee;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
  }

  a {
    color: #0366d6;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  ul,
  ol {
    padding-left: 2rem;
    margin-bottom: 1rem;
  }
`;
