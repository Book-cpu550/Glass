# Internet sharing and Glass accounts

The configured service is `https://glass-private-sharing.glass-private-sharing-relay.workers.dev`. It uses Cloudflare Workers and a SQLite-backed Durable Object, which are available within the Workers Free plan. No paid plan or paid storage product was enabled during setup. Free usage quotas still apply; service can pause when they are exhausted. No uptime or unlimited-storage guarantee is implied.

## Share across networks

Click **Share → Share current document**. This installation already has protected service settings, so it automatically uses the internet service. Privately send the edit or view invitation to your friend. They paste it into Share → Join document. No port forwarding, shared Wi-Fi, or running owner computer is required for cloud invitations. Local copies remain available without internet; use Reconnect saved sharing to synchronize again.

Earlier local-network invitations retain their original server address. End that sharing session and share again to generate an internet invitation. The explicit **Local network only** option continues to require the owner's computer online.

## Accounts

Click **Account → Create an account**, choose a username and a password/passphrase of at least 15 characters, and confirm the password. Usernames use 3–32 letters, digits, or underscores and are case-insensitive. There is no email address, real name, contact list, or profile form. Use Account → Sign in on another updated Glass installation. **Shared documents → Open document** retrieves the selected shared note even while its owner is offline.

Only documents explicitly shared or joined are added to the account. Other notes are not automatically uploaded. Local notes remain available on the same Windows account after signing out; this is not encryption or separate user profiles for all local notebook files. Windows accounts/device encryption should protect local data on shared computers.

The server stores the username, salted password verifier, necessary session/rate-limit records, and encrypted document shortcuts. The client derives separate authentication and vault keys with scrypt (`N=32768, r=8, p=3`). The raw password is not sent to the service; the authentication key is additionally salted and hashed server-side. Document invitations and their decryption/writer/owner keys are encrypted with the separate client vault key before account storage. Passwords, vault keys, bearer sessions, and invitations are not bundled into the application source. Saved local sessions and service creation credentials use Windows protected storage.

Sessions expire after 30 days; sign in again when prompted. **Sign out on all devices** revokes account sessions; already downloaded local copies and independent share invitations remain. **Delete account** requires the password, deletes the account and encrypted shortcuts, and preserves local notes. Stop sharing documents first to revoke their invitations. There is no email-based password recovery; store the password safely. Do not assume an independent security audit or exploit-proof guarantees.

## Persistence and recovery

Documents are committed to durable SQLite storage before updates are broadcast. The same worker name, binding, Durable Object class, namespace, and named object are reused during deploys. The live verification saved a test document, disconnected its owner, redeployed the worker, and recovered the content and account shortcut from a fresh session.

Cloud rooms do not automatically expire. Restarting an app, hibernating a worker, ordinary worker redeployment, or reconnecting a domain does not intentionally delete them. **Deleting the Durable Object namespace, deleting/replacing the service storage, changing the named object or binding to a new namespace, account/provider enforcement, or host revocation can remove access or hosted data.** Domain ownership/availability and storage deletion are distinct. Keep local Glass backups; persistence is not a substitute for backups.

To update the service, deploy the existing `cloud-relay/wrangler.jsonc` with its unchanged `v1` SQLite migration and binding. Do not add destructive migrations or delete the namespace to resolve a deployment error. The deployment secret is stored separately as a Cloudflare secret and protected locally; never commit `.dev.vars`, `.wrangler`, session files, or credentials. Logs/observability are disabled in the worker configuration; Cloudflare still handles network connection metadata according to its policies.

This small free service currently limits itself to 32 shared rooms, 12 participants per room, 100 accounts, 100 account shortcuts per account, bounded transfers/storage, and rate-limited authentication. Exhausting capacity rejects new requests instead of intentionally deleting existing documents. Large documents may reach relay limits before the desktop's local note size limit.

References: [Cloudflare Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/), [durable SQLite storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/), [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
