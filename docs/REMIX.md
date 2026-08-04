# Remix the Living Memory Lab profile

This repository treats a GitHub profile as a small, inspectable build rather than one long hand-edited README.

## Quick start

1. Fork or copy the repository into a public repository whose name matches your GitHub username.
2. Install Node.js 22 or newer.
3. Run `npm ci`.
4. Edit `profile.config.yml`.
5. Run `npm run generate`.
6. Preview `README.md` and `README.zh-CN.md` on GitHub before publishing.

`npm test` verifies that every generated file matches the current configuration.

## Safe customization

- Change identity, links, project copy, colors, and module switches in `profile.config.yml`.
- Put only manually approved, already-public text in `content/public-memories.yml`.
- Keep credentials in GitHub Actions secrets. Never place tokens, private API addresses, or Chronicle data in YAML files.
- Preserve the static hero variants. They are the fallback for reduced-motion visitors.
- Check both GitHub light and dark themes and a narrow mobile viewport after changing SVG layouts.

## Daily metrics

The metrics workflow uses [`lowlighter/metrics`](https://github.com/lowlighter/metrics) and writes a local SVG snapshot to `assets/snapshots/metrics.svg`. Create a least-privilege personal access token and store it as the repository secret `METRICS_TOKEN`. Until that secret exists, the checked-in fallback snapshot remains visible and the workflow exits successfully. Regenerating the profile never overwrites a successful metrics snapshot.

Optional AniList and music modules are disabled by default. Enable them only after adding the corresponding public account identifiers and reviewing the permissions requested by each plugin.

## Generated files

Do not hand-edit these files:

- `README.md`
- `README.zh-CN.md`
- `assets/generated/*.svg`

The previous hand-written profile remains under `content/archive/` for reference.
