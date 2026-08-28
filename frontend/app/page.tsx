const principles = [
  {
    title: "Local first",
    body: "Source files, unredacted text, and identity mappings stay in your browser.",
  },
  {
    title: "No record",
    body: "Aethelgard stores no document, prompt, report, account, or analysis job.",
  },
  {
    title: "Exact zero",
    body: "The service uses free capacity only and stops safely when that capacity is unavailable.",
  },
] as const;

function SiteHeader() {
  return (
    <header className="site-header page-frame">
      <a className="wordmark" href="/" aria-label="Aethelgard home">
        Aethelgard
      </a>
      <span className="phase-mark">Foundation</span>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero page-frame" aria-labelledby="hero-title">
      <div>
        <p className="eyebrow">Private document reasoning</p>
        <h1 id="hero-title">Analysis that keeps the source in your hands.</h1>
      </div>
      <div className="hero-aside">
        <p>
          A quiet analytical instrument for careful critique. Sensitive source
          material stays local while trusted reasoning works only with redacted text.
        </p>
        <a className="primary-link" href="#principles">
          Read the principles
        </a>
      </div>
    </section>
  );
}

function Principles() {
  return (
    <section className="principles page-frame" id="principles" aria-labelledby="principles-title">
      <div className="section-grid">
        <h2 className="section-label" id="principles-title">Operating principles</h2>
        <dl className="principle-list">
          {principles.map((principle) => (
            <div className="principle" key={principle.title}>
              <dt>{principle.title}</dt>
              <dd>{principle.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer page-frame">
      <p>Aethelgard — private by boundary, not by promise.</p>
      <p>Desktop Chrome and Edge</p>
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
        <Principles />
      </main>
      <SiteFooter />
    </>
  );
}
