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

### Using GitHub Desktop

1) Open GitHub Desktop → **Add** → **Add Existing Repository** → select this folder.

2) Click **Publish repository**:
   - Name: `devops-portfolio`
   - Keep it **Public**
   - Push to `main`

3) In GitHub (repo page): **Settings → Pages** → **Build and deployment** → **Source: GitHub Actions**.
   - This repo includes `.github/workflows/pages.yml`, so every push to `main` deploys automatically.

Your site URL will be:
`https://<your-username>.github.io/devops-portfolio/`
