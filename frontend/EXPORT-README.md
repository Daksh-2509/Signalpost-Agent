# Signalpost workspace export

This archive contains the current application source, local public assets, configuration, dependency lockfile, and project documentation.

## Local setup

Use Node.js 20.9 or newer and pnpm 10.16.1 (matching package.json). Install dependencies from the included lockfile. The scripts in package.json provide development, production build, and production serving commands. If using Supabase, copy .env.example to .env.local and supply your own configuration.

## Export boundary

Secret environment files and key material, installed dependencies, generated builds, Git history, caches, internal JBOX/tooling files, and this ZIP itself are excluded. Dependencies and builds can be recreated from the included source and lockfile. External services, remote assets/fonts, database contents, and browser-local session data are not embedded. Remote references in the source remain unchanged.

EXPORT-MANIFEST.json lists original exported files and their SHA-256 checksums. This export does not modify application source.
