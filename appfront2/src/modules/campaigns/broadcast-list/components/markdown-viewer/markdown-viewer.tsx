import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MarkdownViewerProps } from './interfaces';
import { Container } from './styles';

export const MarkdownViewer = ({ children }: MarkdownViewerProps) => {
  return (
    <Container>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </Container>
  );
};
