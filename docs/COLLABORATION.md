# Current internet sharing

This installation now uses the Cloudflare internet service automatically. Shared cloud documents remain available while the owner is offline, and optional username/password accounts retain encrypted shared-document shortcuts across devices. See [current setup, account privacy, and persistence details](CLOUD_SHARING.md). The local-network and self-hosted relay instructions below describe the alternative local/advanced modes; their seven-day lifetime does not apply to the Cloudflare service.

# Collaborative documents

Glass shares individual documents through private invitations. An optional account uses a username and salted password verifier, without email or profile details. Invitation-only access remains available. A display alias is optional and does not establish a verified identity. Other notes, folders, tags, libraries, and AI conversations are not shared.

## On the same network

1. Open the document and click **Share → Share current document**.
2. Send **Copy edit invitation** privately, or use **Copy view-only invitation** for a reader.
3. Your friend opens Glass → Share, pastes the invitation under **Join a shared document**, and clicks **Join document**. Both people need this updated Glass version.

The host's computer must remain running and reachable. Windows Firewall may require permission for Glass on the intended private network. Do not turn off the firewall. Guest Wi-Fi isolation, different networks, or an inaccessible automatically selected network interface can prevent connection. A private VPN works only if the invitation's host address is reachable through it; use an operator-configured WSS relay otherwise. No public hosting service is included.

Edit invitations permit title/body changes, including equations, tables, and figures. View invitations cannot submit document updates. Display aliases and cursors are visible to connected participants. Connection counts include yourself. Notes autosave as local copies. Offline editors can keep writing, then use **Reconnect saved sharing** to merge changes; reconnection is explicit after restarting Glass.

**Keep local copy / disconnect** ends your active connection. The host can use **Stop sharing for everyone** to revoke the room and delete its relay data. Recipients retain downloaded/local copies. Invitations expire after seven days; disconnect and share a new session to renew access. At most eight document sessions can be open in an app, with twelve participants per relay room.

## Internet relay for an operator

Run the supplied relay on a server you control, with a current supported Node.js runtime and installed production dependencies:

```powershell
$env:GLASS_RELAY_CREATE_TOKEN = '<long randomly generated operator secret>'
$env:GLASS_RELAY_DATA = 'D:\GlassRelay\data'
$env:GLASS_RELAY_HOST = '127.0.0.1'
$env:PORT = '47635'
npm run relay
```

Place an HTTPS reverse proxy with a valid TLS certificate in front of `127.0.0.1:47635`, forwarding WebSocket upgrades at `/glass`. Keep the backend port private; expose only the TLS endpoint. The proxy must forward server challenges, not log invite contents, and allow the intended connection duration and bounded message sizes. Manage server OS/proxy updates and access logs according to your privacy policy. The relay's `/health` endpoint returns only its service/protocol name.

In Glass, expand **Use an internet relay (advanced)** and enter `wss://your-host/glass` and the operator's creation token before sharing. The creation token authorizes new rooms and is cleared from the form after successful creation. Share it only with people permitted to create rooms. Invite recipients need only their invitation, not the creation token. Public relays require `wss://`; plain `ws://` is restricted to loopback/private network addresses.

The relay defaults to 32 rooms, 48 active sockets, five seconds to authenticate, bounded rates/frame/storage/buffer sizes, and seven-day room lifetimes. These are abuse limits, not a substitute for server monitoring or upstream denial-of-service protections.

## Privacy and security boundaries

- Document payloads use AES-256-GCM with unique nonces and room/message context. Writer updates also carry Ed25519 signatures; view invitations omit the writer signing key. The relay enforces role permissions independently of the UI.
- Fresh server challenges authenticate hashed random capabilities without sending raw access tokens. Owner revocation uses a separate capability. Browser-origin WebSocket requests are rejected.
- The relay stores encrypted document updates, capability hashes, a public verification key, room identifiers, sequence numbers, and expiry dates. It has no account database, plaintext notes, or document decryption keys. Operators can still observe connection IP addresses, timing, sizes, and room traffic and can deny service. Plain private-network WebSockets do not protect all connection metadata; use a trusted network or WSS.
- Invitations contain access and decryption keys. Anyone holding an edit invitation can edit and forward it. Anyone holding a view invitation can read and retain the document. Protect clipboard contents and invitation messages accordingly.
- Saved invitations are encrypted locally using Electron safeStorage/Windows protection; they are excluded from portable notebook backups. Local note copies and local collaborative state are stored in the ordinary Glass data folder and are not separately password-encrypted. A compromised OS account or device is outside these protections.
- The host can revoke future relay access, not erase others' copies. Active participants should be trusted: even a legitimate editor can delete or alter shared content. Backups and substantial-edit history help recovery. This implementation is tested but has not received an independent security audit and is not described as exploit-proof.

Sharing does not send notes to the AI helper. AI remains a separate user-requested workflow.
