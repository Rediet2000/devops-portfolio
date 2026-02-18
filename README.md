# Portfolio (Rediet Solomon)

Static, fast portfolio site built from local CV PDFs plus GitHub public repositories.

## Run locally

- Open `index.html` in a browser, or
- Serve the folder (recommended for module scripts), for example:
  - PowerShell (if Python is installed): `python -m http.server`

## Update CV content

- Edit `data/cv.json`, then regenerate `data/cv.js`:
  - `powershell -ExecutionPolicy Bypass -File tools/build-cv-js.ps1`
- Optional: extract PDF text again into `data/raw/`:
  - `powershell -ExecutionPolicy Bypass -File tools/pdf-extract.ps1 -InputPdf C:\Users\redis\Downloads\Rediet_CV.pdf -OutFile data\raw\Rediet_CV.txt`

## Deploy to GitHub Pages (`/devops-portfolio/`)

1) Create a GitHub repository named `devops-portfolio` (public).

2) Push these files to the repo root (make sure `index.html` is at the top level).

3) In GitHub, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
   - This repo includes `/.github/workflows/pages.yml`, so every push to `main` deploys automatically.

Your site URL will be:
`https://<your-username>.github.io/devops-portfolio/`
