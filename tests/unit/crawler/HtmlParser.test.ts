import { describe, it, expect } from "vitest";
import { HtmlParser } from "../../../src/crawler/HtmlParser";
describe("parse()", () => {
  const parser = new HtmlParser();
  it("should parse simple HTML and extract text from body", () => {
    const html = `
        <html>
          <body>
            <h1>Hello World</h1>
            <p>This is a test</p>
          </body>
        </html>
      `;
    const result = parser.parse(html);
    expect(result.text).toBe("Hello World This is a test");
    expect(result.$).toBeDefined();
    expect(typeof result.$.html).toBe("function");
  });
  it("should remove script tags", () => {
    const html = `
        <html>
          <body>
            <h1>Hello World</h1>
            <p>This is a test</p>
            <script>
              console.log('hidden');
              const x = 1;
            </script>
          </body>
        </html>
      `;
    const result = parser.parse(html);
    expect(result.text).toBe("Hello World This is a test");
  });
  it("should remove style tags", () => {
    const html = `
        <html>
          <body>
            <h1>Hello World</h1>
            <p>This is a test</p>
            <style>
              body { color: red; }
              .hidden { display: none; }
            </style>
          </body>
        </html>
      `;
    const result = parser.parse(html);
    expect(result.text).toBe("Hello World This is a test");
  });
  it("should remove all specified tags (script, style, noscript, template, svg, nav, footer, header, aside, form)", () => {
    const html = `
        <html>
          <body>
            <header>Header content</header>
            <nav>Navigation</nav>
            <main>
              <p>Main content</p>
              <aside>Sidebar</aside>
              <form>Form fields</form>
            </main>
            <footer>Footer content</footer>
            <noscript>No JS fallback</noscript>
            <template>Template content</template>
            <svg><circle cx="50" cy="50" r="40"/></svg>
          </body>
        </html>
      `;

    const result = parser.parse(html);

    expect(result.text).toBe("Main content");
    expect(result.text).not.toContain("Header");
    expect(result.text).not.toContain("Navigation");
    expect(result.text).not.toContain("Sidebar");
    expect(result.text).not.toContain("Form");
    expect(result.text).not.toContain("Footer");
    expect(result.text).not.toContain("No JS");
    expect(result.text).not.toContain("Template");
    expect(result.text).not.toContain("circle");
  });

  it("should normalize whitespace (replace multiple spaces with single space)", () => {
    const html = `
        <html>
          <body>
            <p>Text    with     multiple     spaces</p>
            <p>New
            line
            breaks</p>
            <p>  Leading and trailing   </p>
          </body>
        </html>
      `;

    const result = parser.parse(html);

    expect(result.text).toBe(
      "Text with multiple spaces New line breaks Leading and trailing",
    );
    expect(result.text).not.toContain("  ");
  });

  it("should handle empty body", () => {
    const html = `<html><body></body></html>`;

    const result = parser.parse(html);

    expect(result.text).toBe("");
    expect(result.$).toBeDefined();
  });

  it("should handle HTML without body tag", () => {
    const html = `<div>Content without body</div>`;

    const result = parser.parse(html);

    expect(result.text).toBe("Content without body");
  });

  it("should handle empty or invalid HTML", () => {
    const html = "";

    const result = parser.parse(html);

    expect(result.text).toBe("");
    expect(result.$).toBeDefined();
  });

  it("should handle HTML with nested removed tags", () => {
    const html = `
        <html>
          <body>
            <p>Before</p>
            <div class="wrapper">
              <script>
                <div>Nested content in script</div>
              </script>
              <p>After script</p>
              <style>
                <p>Nested in style</p>
              </style>
            </div>
            <p>After wrapper</p>
          </body>
        </html>
      `;

    const result = parser.parse(html);

    expect(result.text).toBe("Before After script After wrapper");
    expect(result.text).not.toContain("Nested content in script");
    expect(result.text).not.toContain("Nested in style");
  });

  it("should preserve text inside allowed tags", () => {
    const html = `
        <html>
          <body>
            <h1>Title</h1>
            <div class="container">
              <p>Paragraph 1</p>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </div>
            <span>Span text</span>
            <strong>Bold</strong>
            <em>Italic</em>
          </body>
        </html>
      `;

    const result = parser.parse(html);

    expect(result.text).toBe(
      "Title Paragraph 1 Item 1 Item 2 Span text Bold Italic",
    );
  });

  it("should return cheerio API instance for further manipulation", () => {
    const html = `
        <html>
          <body>
            <h1>Title</h1>
            <p class="content">Content</p>
          </body>
        </html>
      `;

    const result = parser.parse(html);
    const title = result.$("h1").text();
    const content = result.$(".content").text();

    expect(title).toBe("Title");
    expect(content).toBe("Content");
    expect(result.$("body").length).toBe(1);
  });
});
