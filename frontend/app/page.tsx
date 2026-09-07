import { DocumentPicker } from "../components/document-picker";

function SiteHeader() {
  return (
    <header className="site-header page-frame">
      <a className="wordmark" href="/" aria-label="Aethelgard home">Aethelgard</a>
      <nav className="primary-nav" aria-label="Primary navigation">
        <a href="/trust">Trust</a>
        <a href="/verify">Verify</a>
        <a href="/sample">Sample</a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero page-frame" aria-labelledby="hero-title">
      <div>
        <p className="eyebrow">Private document reasoning</p>
        <h1 id="hero-title">Document analysis. Nothing kept.</h1>
      </div>
      <p className="hero-deck">
        Turn one business document into a rigorous, source-linked brief. Your file,
        unredacted text, and identity map stay in this browser.
      </p>
    </section>
  );
}

function ProcessNote() {
  return (
    <aside className="process-note page-frame" aria-label="How Aethelgard handles your document">
      <p><span>01</span> Read and redact locally</p>
      <p><span>02</span> Analyze redacted text</p>
      <p><span>03</span> Return a signed report</p>
      <a href="/trust">See the exact boundary</a>
    </aside>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer page-frame">
      <p>Aethelgard — private by boundary, not by promise.</p>
      <nav aria-label="Project information">
        <a href="/case-study">Case study</a>
        <span>Desktop Chrome and Edge</span>
      </nav>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <DocumentPicker />
        <ProcessNote />
      </main>
      <SiteFooter />
    </>
  );
}
