# Windows installer signing

v4.2.2 is unsigned because no publisher signing identity was supplied. Do not put certificates or passwords in this repository.

The normal Windows build is:

```powershell
npm ci
npm run package
npm run installer
```

For a future build, obtain a publisher certificate or configure a supported signing service. With an appropriate certificate, provide `CSC_LINK` and `CSC_KEY_PASSWORD` through your local secure build environment or CI secrets, then run:

```powershell
npm run installer -- -c.forceCodeSigning=true -c.win.signAndEditExecutable=true
```

The signing identity must be authorized for the publisher. Validate the resulting installer with Windows Authenticode before publishing. Certificate/private-key extensions and environment files are excluded by `.gitignore`; never upload the signing material as a release asset.

Glass update checks are explicit, use the public Glass GitHub repository, and require the installer’s GitHub-reported SHA-256 digest to match before it can be launched. A checksum is not a substitute for a publisher signature. A notebook backup is made before installation; the application and `%APPDATA%\Glass` data directory are separate. The installer does not delete local notebooks on uninstall.
