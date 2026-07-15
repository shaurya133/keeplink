import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — KeepLink",
  description: "KeepLink privacy policy: what we collect, how we use it, and your rights.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2 style={{
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--color-accent)",
        marginBottom: "0.875rem",
        fontFamily: "var(--font-body)",
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Rule() {
  return (
    <hr style={{
      border: "none",
      borderTop: "1px solid var(--color-divider)",
      margin: "2.5rem 0",
    }} />
  );
}

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Header */}
      <header style={{
        borderBottom: "2px solid var(--color-divider)",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
      }}>
        <a href="/" style={{
          fontSize: "18px",
          fontWeight: 800,
          color: "var(--color-accent)",
          textDecoration: "none",
          letterSpacing: "-0.3px",
        }}>
          KeepLink
        </a>
      </header>

      {/* Content */}
      <main style={{
        maxWidth: "640px",
        margin: "0 auto",
        padding: "56px 24px 80px",
      }}>
        <h1 style={{
          fontSize: "28px",
          fontWeight: 800,
          letterSpacing: "-0.5px",
          lineHeight: 1.15,
          marginBottom: "8px",
          color: "var(--color-text)",
        }}>
          Privacy Policy
        </h1>
        <p style={{
          fontSize: "13px",
          color: "var(--color-neutral-600)",
          marginBottom: "48px",
        }}>
          Effective July 15, 2026
        </p>

        <Section title="What we collect">
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              ["Email address", "collected when you sign in; used only to send your one-time sign-in code."],
              ["Saved links", "the URLs, titles, descriptions, and thumbnails of pages you save; stored on our servers to build your personal library."],
              ["Reading highlights", "stored locally on your device only. We never transmit them to our servers."],
            ].map(([term, desc]) => (
              <li key={term} style={{ paddingLeft: "16px", position: "relative", lineHeight: 1.6 }}>
                <span style={{
                  position: "absolute",
                  left: 0,
                  top: "11px",
                  width: "5px",
                  height: "1px",
                  background: "var(--color-accent)",
                  display: "block",
                }} />
                <strong style={{ fontWeight: 600 }}>{term}</strong>
                {" — "}
                {desc}
              </li>
            ))}
          </ul>
        </Section>

        <Rule />

        <Section title="What we don't collect">
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              "Browsing history beyond the URLs you explicitly save",
              "Location data",
              "Device identifiers or advertising IDs",
            ].map((item) => (
              <li key={item} style={{ paddingLeft: "16px", position: "relative", lineHeight: 1.6 }}>
                <span style={{
                  position: "absolute",
                  left: 0,
                  top: "11px",
                  width: "5px",
                  height: "1px",
                  background: "var(--color-accent)",
                  display: "block",
                }} />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Rule />

        <Section title="How we use your data">
          <p style={{ lineHeight: 1.7 }}>
            We use your email address to authenticate you via one-time sign-in codes. We use your saved links to display your library. We do not sell your data, share it with advertisers, or use it for any purpose beyond operating the app.
          </p>
        </Section>

        <Rule />

        <Section title="Third-party services">
          <p style={{ lineHeight: 1.7, marginBottom: "16px" }}>
            We use the following services to operate KeepLink. Each has its own privacy policy.
          </p>
          <div style={{
            border: "1px solid var(--color-divider)",
            background: "var(--color-surface)",
          }}>
            {[
              ["Resend", "Sends your one-time sign-in codes by email"],
              ["Railway", "Hosts the application backend"],
              ["Supabase", "Encrypted PostgreSQL database storage"],
              ["Anthropic", "Powers the Ask AI feature — link content you query is sent to Anthropic's API"],
            ].map(([name, desc], i, arr) => (
              <div key={name} style={{
                display: "flex",
                alignItems: "baseline",
                gap: "16px",
                padding: "12px 16px",
                borderBottom: i < arr.length - 1 ? "1px solid var(--color-divider)" : "none",
              }}>
                <span style={{ fontWeight: 600, fontSize: "14px", minWidth: "90px", flexShrink: 0 }}>{name}</span>
                <span style={{ fontSize: "14px", color: "var(--color-neutral-600)", lineHeight: 1.5 }}>{desc}</span>
              </div>
            ))}
          </div>
        </Section>

        <Rule />

        <Section title="Security">
          <p style={{ lineHeight: 1.7 }}>
            All data is transmitted over TLS (HTTPS). Data at rest is stored in Supabase&apos;s encrypted PostgreSQL database.
          </p>
        </Section>

        <Rule />

        <Section title="Data retention">
          <p style={{ lineHeight: 1.7 }}>
            We retain your data until you delete your account. Sign-in codes expire after two hours and are deleted once used.
          </p>
        </Section>

        <Rule />

        <Section title="Your rights">
          <div style={{
            background: "var(--color-accent-100)",
            border: "1px solid var(--color-divider)",
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}>
            <strong style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-accent)" }}>
              Delete your account at any time
            </strong>
            <p style={{ fontSize: "14px", color: "var(--color-neutral-600)", margin: 0, lineHeight: 1.6 }}>
              Open KeepLink → Settings → Delete Account. This permanently and immediately removes
              your email address, all saved links, and your account from our systems.
            </p>
          </div>
        </Section>

        <Rule />

        <Section title="Changes to this policy">
          <p style={{ lineHeight: 1.7 }}>
            If we make material changes, we will update the effective date at the top of this page.
          </p>
        </Section>

        <Rule />

        <Section title="Contact">
          <p style={{ lineHeight: 1.7 }}>
            Questions about this policy? Email{" "}
            <a
              href="mailto:shauryasethi133@gmail.com"
              style={{ color: "var(--color-accent)", fontWeight: 500 }}
            >
              shauryasethi133@gmail.com
            </a>
          </p>
        </Section>
      </main>
    </div>
  );
}
