# Native runtime prerequisites

This source snapshot includes verification manifests for the native engines, not their downloaded binaries. User notes and local app data are never part of the repository.

Before running native-runtime tests or packaging, download the archives from the `source` URLs in `runtimes/*/GLASS-RUNTIME.json`. Check the archive byte count and SHA-256 against the manifest before extraction. Extract Python directly into `runtimes/python-3.15.2/`, and the portable Octave distribution into `runtimes/octave-11.3.0/` (so `mingw64/bin/octave-cli.exe` exists there). Retain the manifests and the distributions' original licenses and notices. Octave requires a 7-Zip-compatible extractor. These directories are ignored by Git except for the verification metadata.

Validate the extracted engines from the repository root:

```powershell
node -e "const fs=require('node:fs'),{verify}=require('./bundle-matlab-runtime.cjs');for(const n of ['octave-11.3.0','python-3.15.2']){const p='runtimes/'+n;if(!verify(p,JSON.parse(fs.readFileSync(p+'/GLASS-RUNTIME.json','utf8'))))throw Error('Runtime verification failed: '+n);console.log('Verified '+n)}"
```

Then run `npm test`, `npm run package`, and optionally `npm run installer`. The manual release workflow also requires staging these native runtime directories before its test and package steps. This source update does not replace the already published v4.2.3 release downloads.
