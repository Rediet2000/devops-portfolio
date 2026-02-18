const qs = (s, el = document) => el.querySelector(s);

const safeText = (v) => (typeof v === "string" ? v : "");
const escapeHtml = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

function setText(id, value) {
  const el = qs(`#${id}`);
  if (!el) return;
  el.textContent = value;
}

function normalizeUrl(url) {
  const u = safeText(url).trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u.replace(/^\/+/, "")}`;
}

function mailto(to, subject, body) {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
}

function renderSkillCard(title, items) {
  return `
    <div class="panel">
      <h3>${escapeHtml(title)}</h3>
      <div class="tags">
        ${items.map((x) => `<span class="tag">${escapeHtml(x)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderTimelineEntry(entry) {
  const bullets = (entry.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("");
  return `
    <div class="entry">
      <div class="entry__rail"><div class="entry__dot" aria-hidden="true"></div></div>
      <div class="entry__card">
        <div class="entry__head">
          <div>
            <h3 class="entry__role">${escapeHtml(entry.role)}</h3>
            <p class="entry__where">${escapeHtml(entry.company)}${
              entry.location ? ` — ${escapeHtml(entry.location)}` : ""
            }</p>
          </div>
          <div class="item__meta">${escapeHtml(entry.dates || "")}</div>
        </div>
        ${bullets ? `<ul class="list">${bullets}</ul>` : ""}
      </div>
    </div>
  `;
}

function renderProjectCard(p) {
  const tags = (p.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
  const links = [];
  if (p.link)
    links.push(
      `<a class="link" href="${escapeHtml(normalizeUrl(p.link))}" target="_blank" rel="noreferrer">Link</a>`,
    );
  if (p.repo)
    links.push(
      `<a class="link" href="${escapeHtml(normalizeUrl(p.repo))}" target="_blank" rel="noreferrer">Repo</a>`,
    );
  return `
    <div class="item">
      <div class="item__top">
        <h4 class="item__title">${escapeHtml(p.name)}</h4>
        <div class="item__meta">${escapeHtml(p.when || "")}</div>
      </div>
      ${p.description ? `<p class="item__desc">${escapeHtml(p.description)}</p>` : ""}
      ${tags ? `<div class="tags">${tags}</div>` : ""}
      ${links.length ? `<div class="downloads__links" style="margin-top:10px">${links.join("")}</div>` : ""}
    </div>
  `;
}

function renderEducationCard(e) {
  return `
    <div class="item">
      <div class="item__top">
        <h4 class="item__title">${escapeHtml(e.program)}</h4>
        <div class="item__meta">${escapeHtml(e.when || "")}</div>
      </div>
      <p class="item__desc">${escapeHtml(e.school)}${
        e.location ? ` — ${escapeHtml(e.location)}` : ""
      }</p>
    </div>
  `;
}

function getThemePreference() {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  const label = qs("#themeLabel");
  if (label) label.textContent = theme === "light" ? "Light" : "Dark";
}

async function loadCv() {
  if (typeof window !== "undefined" && window.CV_DATA) return window.CV_DATA;
  const res = await fetch("data/cv.json", { cache: "no-cache" });
  if (!res.ok) throw new Error("Failed to load CV data");
  return res.json();
}

function githubUsernameFromUrl(url) {
  const u = normalizeUrl(url);
  try {
    const parsed = new URL(u);
    if (parsed.hostname.toLowerCase() !== "github.com") return "";
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[0] || "";
  } catch {
    return "";
  }
}

async function loadGithubRepos(username) {
  const cacheKey = `gh_repos_${username}`;
  const cached = localStorage.getItem(cacheKey);
  const cachedAt = Number(localStorage.getItem(`${cacheKey}_at`) || "0");
  const maxAgeMs = 1000 * 60 * 60 * 24;
  if (cached && cachedAt && Date.now() - cachedAt < maxAgeMs) {
    return JSON.parse(cached);
  }

  const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  localStorage.setItem(cacheKey, JSON.stringify(data));
  localStorage.setItem(`${cacheKey}_at`, String(Date.now()));
  return data;
}

function renderGithubRepos(repos, username) {
  const container = qs("#githubProjects");
  const hint = qs("#githubHint");
  if (!container) return;

  const filtered = (repos || [])
    .filter((r) => r && !r.fork)
    .sort((a, b) => {
      const byStars = (b?.stargazers_count || 0) - (a?.stargazers_count || 0);
      if (byStars !== 0) return byStars;
      return new Date(b?.pushed_at || 0) - new Date(a?.pushed_at || 0);
    })
    .slice(0, 8);

  if (!filtered.length) {
    if (hint) hint.textContent = "No public repositories found.";
    container.innerHTML = `<p class="muted small">See GitHub: <a class="link" href="https://github.com/${escapeHtml(
      username,
    )}" target="_blank" rel="noreferrer">@${escapeHtml(username)}</a></p>`;
    return;
  }

  if (hint) hint.textContent = "Top public repos (auto-fetched).";
  container.innerHTML = filtered
    .map((r) => {
      const tags = [r.language, r.license?.spdx_id].filter(Boolean).slice(0, 2);
      return renderProjectCard({
        name: r.name,
        when: r.updated_at ? `Updated ${new Date(r.updated_at).toLocaleDateString()}` : "",
        description: r.description || "",
        repo: r.html_url,
        tags,
      });
    })
    .join("");
}

function renderCv(cv) {
  const name = safeText(cv.name);
  const title = safeText(cv.title);
  const location = safeText(cv.location);
  const email = safeText(cv.email);
  const phone = safeText(cv.phone);

  setText("nameTop", name);
  setText("nameHero", name);
  setText("titleTop", title);
  setText("pillLocation", location);
  setText("emailText", email);
  setText("phoneText", phone);
  setText("summaryTop", safeText(cv.summary));
  setText("summaryBody", safeText(cv.summary));
  setText("headlineHero", safeText(cv.headline || cv.summary));

  const footerMeta = qs("#footerMeta");
  if (footerMeta) footerMeta.textContent = `${name} • ${title} • ${location}`;

  const y = new Date().getFullYear();
  const cr = qs("#copyright");
  if (cr) cr.textContent = `© ${y} ${name}`;

  const githubUrl = normalizeUrl(cv.links?.github || "");
  const linkedinUrl = normalizeUrl(cv.links?.linkedin || "");

  const btnEmail = qs("#btnEmail");
  if (btnEmail) btnEmail.href = mailto(email, "Hello Rediet", "Hi Rediet,%0D%0A%0D%0A");
  const btnGitHub = qs("#btnGitHub");
  if (btnGitHub) btnGitHub.href = githubUrl;
  const btnLinkedIn = qs("#btnLinkedIn");
  if (btnLinkedIn) btnLinkedIn.href = linkedinUrl;

  const contactEmail = qs("#contactEmail");
  if (contactEmail) contactEmail.href = mailto(email, "Hello Rediet", "Hi Rediet,%0D%0A%0D%0A");
  const contactGitHub = qs("#contactGitHub");
  if (contactGitHub) contactGitHub.href = githubUrl;
  const contactLinkedIn = qs("#contactLinkedIn");
  if (contactLinkedIn) contactLinkedIn.href = linkedinUrl;

  const focus = qs("#focusChips");
  if (focus) {
    const items = cv.focus || [];
    focus.innerHTML = items.map((x) => `<li>${escapeHtml(x)}</li>`).join("");
  }

  const highlights = qs("#highlightsList");
  if (highlights) {
    const items = cv.highlights || [];
    if (items.length) highlights.innerHTML = items.map((x) => `<li>${escapeHtml(x)}</li>`).join("");
  }

  const cvLinks = qs("#cvLinks");
  if (cvLinks) {
    const links = cv.downloads || [];
    cvLinks.innerHTML = links
      .map((l) => `<a class="link" href="${escapeHtml(l.href)}" download>${escapeHtml(l.label)}</a>`)
      .join("");
  }

  const skillsGrid = qs("#skillsGrid");
  if (skillsGrid) {
    const skills = cv.skills || {};
    skillsGrid.innerHTML = Object.entries(skills)
      .map(([k, v]) => renderSkillCard(k, Array.isArray(v) ? v : []))
      .join("");
  }

  const exp = qs("#experienceTimeline");
  if (exp) exp.innerHTML = (cv.experience || []).map(renderTimelineEntry).join("");

  const selected = qs("#selectedProjects");
  if (selected) selected.innerHTML = (cv.projects || []).map(renderProjectCard).join("");

  const edu = qs("#educationList");
  if (edu) edu.innerHTML = (cv.education || []).map(renderEducationCard).join("");

  const cert = qs("#certList");
  if (cert) cert.innerHTML = (cv.certifications || []).map((c) => `<li>${escapeHtml(c)}</li>`).join("");

  const lang = qs("#langList");
  if (lang) lang.innerHTML = (cv.languages || []).map((l) => `<li>${escapeHtml(l)}</li>`).join("");

  const form = qs("#contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const fromName = safeText(fd.get("name"));
      const fromEmail = safeText(fd.get("email"));
      const msg = safeText(fd.get("message"));
      const subject = `Portfolio inquiry from ${fromName || "someone"}`;
      const body = `From: ${fromName} <${fromEmail}>%0D%0A%0D%0A${encodeURIComponent(msg)}`;
      window.location.href = mailto(email, subject, body);
    });
  }

  return { githubUrl };
}

async function main() {
  applyTheme(getThemePreference());
  const toggle = qs("#themeToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      applyTheme(next);
    });
  }

  try {
    const cv = await loadCv();
    const { githubUrl } = renderCv(cv);
    const username = githubUsernameFromUrl(githubUrl);
    if (!username) {
      const hint = qs("#githubHint");
      if (hint) hint.textContent = "GitHub username not found.";
      return;
    }
    try {
      const repos = await loadGithubRepos(username);
      renderGithubRepos(repos, username);
    } catch (e) {
      const hint = qs("#githubHint");
      if (hint) hint.textContent = "GitHub API unavailable (rate limit / offline).";
      const container = qs("#githubProjects");
      if (container) {
        container.innerHTML = `<p class="muted small">View GitHub: <a class="link" href="https://github.com/${escapeHtml(
          username,
        )}" target="_blank" rel="noreferrer">@${escapeHtml(username)}</a></p>`;
      }
    }
  } catch (e) {
    const hint = qs("#githubHint");
    if (hint) hint.textContent = "Failed to load site data.";
    console.error(e);
  }
}

main();
