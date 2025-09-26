/**
 * Função simples para converter Markdown básico para HTML
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  // Remover blocos de código markdown sem perder o conteúdo
  let text = markdown
    .replace(/^```[\w]*\n/g, '') // Remove opening code block
    .replace(/\n```$/g, '')      // Remove closing code block
    .trim();
  
  // Substituir negrito
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Substituir itálico
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Substituir cabeçalhos
  text = text.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  text = text.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  text = text.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  
  // Substituir listas
  text = text.replace(/^\- (.*?)$/gm, '<li>$1</li>');
  text = text.replace(/^\* (.*?)$/gm, '<li>$1</li>');
  text = text.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>');
  
  // Substituir links
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  
  // Substituir quebras de linha por <br>
  text = text.replace(/\n/g, '<br>');
  
  return text;
}