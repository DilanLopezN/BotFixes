import { HtmlContentValidator } from '../html-content-validator';
import { GuardrailViolationType } from '../../interfaces/guardrail.interface';

describe('HtmlContentValidator', () => {
    let validator: HtmlContentValidator;

    beforeEach(() => {
        validator = new HtmlContentValidator();
    });

    describe('validate', () => {
        it('should allow plain text without HTML', async () => {
            const plainText = 'Esta é uma mensagem simples sem HTML';
            const result = await validator.validate(plainText);

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
            expect(result.reason).toContain('Nenhum conteúdo HTML');
        });

        it('should allow text with HTML entities but few tags', async () => {
            const textWithEntities = 'Texto com &nbsp; entidades &lt; e &gt; caracteres';
            const result = await validator.validate(textWithEntities);

            expect(result.allowed).toBe(true);
        });

        it('should block full HTML document with DOCTYPE', async () => {
            const htmlDoc = `
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><p>Content</p></body>
</html>
            `;
            const result = await validator.validate(htmlDoc);

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.HTML_CONTENT);
            expect(result.confidence).toBeGreaterThan(0.9);
            expect(result.reason).toContain('HTML detectado');
        });

        it('should block HTML with html, head, and body tags', async () => {
            const htmlStructure = `
<html>
<head><title>Page</title></head>
<body>
    <div>Content here</div>
</body>
</html>
            `;
            const result = await validator.validate(htmlStructure);

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.HTML_CONTENT);
            expect(result.confidence).toBeGreaterThanOrEqual(0.9);
        });

        it('should block content with many HTML tags', async () => {
            const htmlContent = `
<div class="container">
    <h1>Title</h1>
    <p>Paragraph 1</p>
    <p>Paragraph 2</p>
    <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
    </ul>
    <a href="#">Link</a>
</div>
            `;
            const result = await validator.validate(htmlContent);

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.HTML_CONTENT);
            expect(result.reason).toContain('tags');
        });

        it('should block HTML snippet with multiple tags', async () => {
            const htmlSnippet = '<div><p>Text</p><span>More</span><a href="#">Link</a><img src="test.jpg"/></div>';
            const result = await validator.validate(htmlSnippet);

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.HTML_CONTENT);
        });

        it('should allow text with few isolated tags', async () => {
            const textWithFewTags = 'Este texto tem <b>negrito</b> e <i>itálico</i> mas é principalmente texto';
            const result = await validator.validate(textWithFewTags);

            expect(result.allowed).toBe(true);
        });

        it('should block content with self-closing tags', async () => {
            const htmlWithSelfClosing = `
<div>
    <img src="image.jpg" />
    <br />
    <input type="text" />
    <hr />
    <meta charset="utf-8" />
    <link rel="stylesheet" />
</div>
            `;
            const result = await validator.validate(htmlWithSelfClosing);

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.HTML_CONTENT);
        });

        it('should handle HTML with attributes', async () => {
            const htmlWithAttrs = `
<div class="main" id="content" data-value="test">
    <p style="color: red;">Text</p>
    <a href="https://example.com" target="_blank">Link</a>
    <img src="image.jpg" alt="Description" />
</div>
            `;
            const result = await validator.validate(htmlWithAttrs);

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.HTML_CONTENT);
        });

        it('should detect HTML in mixed content', async () => {
            const mixedContent = `
Aqui está algum texto normal.
<div class="section">
    <h2>Título</h2>
    <p>Mais texto aqui</p>
    <ul>
        <li>Item</li>
    </ul>
</div>
E mais texto normal depois.
            `;
            const result = await validator.validate(mixedContent);

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.HTML_CONTENT);
        });

        it('should handle HTML comments', async () => {
            const htmlWithComments = `
<!-- Comment -->
<div>
    <!-- Another comment -->
    <p>Content</p>
    <!-- More comments -->
</div>
            `;
            const result = await validator.validate(htmlWithComments);

            expect(result.allowed).toBe(false);
        });

        it('should handle malformed HTML', async () => {
            const malformedHtml = '<div><p>Text</p><span>Unclosed<div>Nested</div>';
            const result = await validator.validate(malformedHtml);

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.HTML_CONTENT);
        });

        it('should handle HTML with newlines and spacing', async () => {
            const htmlWithSpacing = `
                <div>
                    <p>
                        Text with
                        multiple lines
                    </p>
                </div>
            `;
            const result = await validator.validate(htmlWithSpacing);

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.HTML_CONTENT);
        });

        it('should allow code examples with angle brackets that are not HTML', async () => {
            const codeExample = 'if (x < 5 && y > 10) then do something';
            const result = await validator.validate(codeExample);

            expect(result.allowed).toBe(true);
        });

        it('should handle empty input', async () => {
            const result = await validator.validate('');

            expect(result.allowed).toBe(true);
        });

        it('should handle whitespace-only input', async () => {
            const result = await validator.validate('   \n\t  ');

            expect(result.allowed).toBe(true);
        });

        it('should block long HTML with high tag count', async () => {
            const lotsOfTags = '<div>' + '<p>Text</p>'.repeat(20) + '</div>';
            const result = await validator.validate(lotsOfTags);

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.HTML_CONTENT);
            expect(result.confidence).toBeGreaterThan(0.7);
        });

        it('should calculate correct HTML ratio', async () => {
            const htmlContent = '<div><p>Short</p></div>';
            const result = await validator.validate(htmlContent);

            expect(result.allowed).toBe(false);
            expect(result.reason).toMatch(/\d+\.\d+%/); // Should contain percentage
        });

        it('should include tag count in rejection reason', async () => {
            const htmlContent = '<div><p>Text</p><span>More</span><a>Link</a><img/><br/></div>';
            const result = await validator.validate(htmlContent);

            expect(result.allowed).toBe(false);
            expect(result.reason).toMatch(/\d+ tags/);
        });

        it('should handle HTML with script tags', async () => {
            const htmlWithScript = `
<div>
    <script>alert('test');</script>
    <p>Content</p>
    <script src="app.js"></script>
</div>
            `;
            const result = await validator.validate(htmlWithScript);

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.HTML_CONTENT);
        });

        it('should handle HTML with style tags', async () => {
            const htmlWithStyle = `
<div>
    <style>.class { color: red; }</style>
    <p>Content</p>
</div>
            `;
            const result = await validator.validate(htmlWithStyle);

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.HTML_CONTENT);
        });

        it('should handle HTML tables', async () => {
            const htmlTable = `
<table>
    <tr><th>Header</th></tr>
    <tr><td>Data</td></tr>
    <tr><td>More</td></tr>
</table>
            `;
            const result = await validator.validate(htmlTable);

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.HTML_CONTENT);
        });

        it('should handle HTML forms', async () => {
            const htmlForm = `
<form action="/submit">
    <input type="text" name="field" />
    <select><option>Option</option></select>
    <textarea></textarea>
    <button>Submit</button>
</form>
            `;
            const result = await validator.validate(htmlForm);

            expect(result.allowed).toBe(false);
            expect(result.violationType).toBe(GuardrailViolationType.HTML_CONTENT);
        });

        it('should handle graceful error recovery', async () => {
            const originalMethod = (validator as any).detectHtml;
            (validator as any).detectHtml = () => {
                throw new Error('Test error');
            };

            const result = await validator.validate('Test text that causes error');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(0.5);
            expect(result.reason).toContain('Erro na validação');

            (validator as any).detectHtml = originalMethod;
        });

        it('should maintain reasonable performance with large HTML', async () => {
            const largeHtml = '<div>' + '<p>Content</p>'.repeat(100) + '</div>';
            const startTime = Date.now();

            const result = await validator.validate(largeHtml);

            const endTime = Date.now();
            const executionTime = endTime - startTime;

            expect(result.allowed).toBe(false);
            expect(executionTime).toBeLessThan(1000);
        });
    });

    describe('edge cases', () => {
        it('should handle text with angle brackets in valid context', async () => {
            const mathExpression = '5 < 10 and 20 > 15';
            const result = await validator.validate(mathExpression);

            expect(result.allowed).toBe(true);
        });

        it('should handle text with escaped HTML', async () => {
            const escapedHtml = '&lt;div&gt;&lt;p&gt;Text&lt;/p&gt;&lt;/div&gt;';
            const result = await validator.validate(escapedHtml);

            expect(result.allowed).toBe(true);
        });

        it('should handle XML-like content', async () => {
            const xmlContent = `
<root>
    <item id="1">
        <name>Item 1</name>
        <value>Value 1</value>
    </item>
    <item id="2">
        <name>Item 2</name>
        <value>Value 2</value>
    </item>
</root>
            `;
            const result = await validator.validate(xmlContent);

            expect(result.allowed).toBe(false);
        });

        it('should handle text with email addresses', async () => {
            const emailText = 'Contact me at user@example.com for more info';
            const result = await validator.validate(emailText);

            expect(result.allowed).toBe(true);
        });

        it('should handle markdown-like content', async () => {
            const markdownText = `
# Title
## Subtitle
- List item 1
- List item 2
**bold** and *italic*
            `;
            const result = await validator.validate(markdownText);

            expect(result.allowed).toBe(true);
        });
    });
});
