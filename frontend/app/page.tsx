import { DocumentPicker } from "../components/document-picker";

function SiteHeader() {
  return (
    <header className="site-header page-frame">
      <a className="wordmark" href="/" aria-label="Aethelgard home">Aethelgard</a>
      <nav className="primary-nav" aria-label="Primary navigation">
        <a href="/trust">Trust</a>
        <a href="/privacy">Privacy</a>
        <a href="/verify">Verify</a>
        <a href="/sample">Sample</a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero page-frame" aria-labelledby="hero-title">
      <p className="eyebrow">Private document reasoning</p>
      <h1 id="hero-title">Privacy-first document analysis.</h1>
      <p className="hero-deck">Analyze a business document.<br />Your original stays in this browser.</p>
      <p className="beta-notice">Public beta — use public, synthetic or non-sensitive test documents only.</p>
    </section>
  );
}

function ProcessNote() {
  return (
    <aside className="process-note page-frame" aria-label="How Aethelgard handles your document">
      <p>Original stays local</p><span aria-hidden="true">·</span>
      <p>Configured identifiers redacted locally</p><span aria-hidden="true">·</span>
      <p>No application history</p>
      <a href="/trust">Exact boundary</a>
    </aside>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer page-frame">
      <p>Aethelgard — private by boundary, not by promise.</p>
      <nav aria-label="Project information">
        <a href="/privacy">Privacy</a>
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
