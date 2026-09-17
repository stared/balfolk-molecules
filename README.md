# Balfolk Molecules

Interactive SVG diagrams of balfolk dances, with continuous playback, a beat timeline,
BPM controls, and adjustable couple counts.

## Development

Use Node.js 24.12 or newer and the pnpm version pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The development app runs at `http://localhost:5173/`.

```sh
pnpm test       # choreography, timing, spacing, and transition checks
pnpm typecheck
pnpm build     # typecheck and production bundle
pnpm preview   # http://localhost:4173/balfolk-molecules/
```

## Layout

- `src/main.ts`: player state, event wiring, and animation loop.
- `src/model.ts`: shared dancer, frame, and dance definitions.
- `src/dances/`: choreography and the dance catalog; `bourree.ts` was formerly `movement.ts`.
- `src/engine/`: rhythm, tempo, participant identity, and formation transitions.
- `src/ui/`: sidebar, SVG rendering, hand paths, DOM helpers, and styles.
- `src/utils/`: small shared utilities.
- `tests/`: Node test runner suites, separate from production source.
- `.github/workflows/deploy.yml`: checks and GitHub Pages deployment.

The app uses TypeScript and SVG without a UI framework. Dance metadata belongs in
`model.ts` and the catalog; a future information panel can be a separate UI module.
No code from the older visualization has been imported as part of this reorganization.

## Deployment

Target: **https://p.migdal.pl/balfolk-molecules/** from `stared/balfolk-molecules`.

In the repository's **Settings → Pages → Build and deployment**, select
**GitHub Actions** as the source (one-time setup). Push to `main` to test, build,
and deploy; the workflow can also be run manually from the Actions tab.
Pull requests run the same tests and production build without deploying.

`vite.config.ts` sets `/balfolk-molecules/` as the production and preview base path,
while development stays at `/`. All generated asset URLs use that project prefix.

The custom domain is inherited from the account's GitHub Pages user site. This
repository intentionally has **no CNAME file** and should not claim `p.migdal.pl`
as its own custom domain: the existing homepage remains at the domain root.
This assumes the account user site is already configured for `p.migdal.pl`.
See [GitHub's custom-domain inheritance documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages#using-a-custom-domain-across-multiple-repositories).

Deployment uses GitHub's Pages artifact and OIDC actions; no custom deployment
secret is needed. The build job has read-only repository access; only the deploy
job has Pages write permission.
