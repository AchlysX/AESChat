# AESChat [E2EE]

> A modern, zero-cost ($0.00), serverless, end-to-end encrypted (E2EE) messenger powered by **AES-256-GCM** and **WebRTC DataChannels**. Built for 1-click deployment on **Cloudflare Pages** with your custom domain.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Cipher](https://img.shields.io/badge/Cipher-AES--256--GCM-emerald.svg)](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
[![P2P](https://img.shields.io/badge/P2P-WebRTC%20DataChannels-blueviolet.svg)](https://webrtc.org/)
[![Deploy Target](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-orange.svg)](https://pages.cloudflare.com/)
[![Cost](https://img.shields.io/badge/Cost-%240.00%20Forever-brightgreen.svg)]()

---

## Overview

**AESChat** is the online, web-deployable evolution of the local C socket chat (`v4_encrypted_chat/`).

Unlike traditional chat apps that require a persistent backend server (like a VPS running Node or C sockets), AESChat uses:
1. **Direct Peer-to-Peer (WebRTC DataChannels):** Once a call is established, message packets flow directly between Browser A and Browser B — they don't pass through a relay. Setting the call up still uses a signalling server and STUN (see [Connection setup](#connection-setup-what-touches-a-server)).
2. **Hardware-Accelerated AES-256-GCM:** Native browser `crypto.subtle` encrypts every message with an isolated 96-bit (12-byte) IV and verifies it with a 128-bit (16-byte) authentication tag.
3. **Key-in-the-link model:** A fresh random 256-bit AES key is generated per room and stored in the `#` fragment of the invite link (`https://chat.yourdomain.com/#room=...&key=...`). The fragment is not sent in HTTP requests, so the page host (Cloudflare) never receives the key. The flip side: **anyone who obtains the link has the key and can read the chat**, so share it over a channel you trust and verify the safety number out of band.
4. **Wire Ciphertext Inspector:** A real-time developer drawer that captures and inspects the raw encrypted packets (IV, Ciphertext, and Tag) traversing the wire.

---

## Architecture

```
                 Browser A (Client)                              Browser B (Client)
             ┌─────────────────────────┐                     ┌─────────────────────────┐
             │       Plaintext         │                     │       Plaintext         │
             │            │            │                     │            ▲            │
             │      [AES-256-GCM]      │                     │      [AES-256-GCM]      │
             │            ▼            │                     │            │            │
             │ (IV + Ciphertext + Tag) │                     │ (IV + Ciphertext + Tag) │
             └────────────┬────────────┘                     └────────────▲────────────┘
                          │                                               │
                          └=========== Direct WebRTC P2P DataChannel =====┘
                               (Message packets flow browser-to-browser;
                                connection setup uses a signalling server + STUN)
```

### Connection setup (what touches a server)

WebRTC can't introduce two browsers on its own. Before the direct channel exists, AESChat uses:

* **A signalling server (PeerJS public cloud):** exchanges the connection offer/answer and ICE candidates so the peers can find each other.
* **STUN servers (Google public STUN):** let each browser discover its public address behind NAT.

Neither server sees message content or the AES key — only connection metadata (peer IDs, IP/port candidates). After the channel opens, encrypted message packets travel directly between the two browsers. For a self-hosted setup you can point PeerJS at your own signalling server and your own STUN/TURN.

### Cryptographic Specification (Matches `crypto.h`)
| Component | Specification |
| :--- | :--- |
| **Cipher** | AES-256-GCM (Galois/Counter Mode) |
| **Key Size** | 256 bits (32 bytes) |
| **IV (Nonce)** | 96 bits (12 bytes) randomly generated per message via `crypto.getRandomValues` |
| **Authentication Tag** | 128 bits (16 bytes) |
| **Fingerprint (Safety Number)** | SHA-256 digest formatted into 4 numeric blocks (Signal style) |

---

## Cloudflare Pages Deployment ($0.00 Forever)

Since your domain is already on Cloudflare, setting this up takes under 2 minutes:

### Method A: Git Integration (Recommended)
1. Push this repository to your GitHub account.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Select your repository:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `.`
4. Click **Save and Deploy**.
5. Once deployed, click **Custom domains** → **Set up a domain**. Enter your subdomain (e.g. `chat.yourdomain.com` or your root domain).
   * Because your domain is already hosted on Cloudflare, Cloudflare handles DNS routing and free automatic SSL instant activation with 0 configuration.

### Method B: Deploy from Terminal (via Wrangler)
If you prefer deploying straight from your terminal:
```bash
npx wrangler pages deploy . --project-name aeschat
```

---

## Local Testing & Development

Run any static HTTP server from the root directory:

```bash
# Using Python
python3 -m http.server 8000

# Or using Node.js
npx serve .
```

Open `http://localhost:8000` in your browser:
1. Click **Create New Encrypted Room**.
2. Click **Invite** and copy the shareable link.
3. Open a second browser tab (or an incognito window) and paste the link.
4. Both tabs will establish a direct P2P connection and begin chatting in real-time!

---

## Repository Structure

```
.
├── index.html            # Modern Messenger UI (Signal/Telegram inspired)
├── css/
│   └── style.css         # Glassmorphism dark theme & responsive layout
├── js/
│   ├── crypto.js         # Web Crypto API AES-256-GCM implementation
│   ├── p2p.js            # WebRTC DataChannel connection engine (PeerJS)
│   └── app.js            # UI controller & event orchestrator
├── _headers              # Security headers for Cloudflare Pages
├── wrangler.toml         # Cloudflare Pages deployment configuration
├── LICENSE               # MIT
└── README.md
```

The original offline C socket chat that this project grew out of lives in its own repository, [`c-socket-server-aes`](https://github.com/AchlysX/c-socket-server-aes) (`v4_encrypted_chat/`).

---

## Security Highlights

* **No Plaintext on the Wire:** All message data transmitted across WebRTC DataChannels is ciphertext with individual IVs.
* **Integrity Guarantee:** Any message tampering causes AES-GCM tag verification failure and is instantly rejected.
* **Ephemeral:** Closing the browser clears the session key from memory. No database logs exist.

## Security Model & Limitations

Being specific about what this does and does not protect:

* **The link is the secret.** Security rests entirely on the invite link staying private. Anyone with the link can join and read the conversation. Verify the safety number out of band to confirm you're talking to the right person.
* **No forward secrecy.** One room key is used for the whole session; there is no key rotation or ratchet. If the key leaks, past messages captured on the wire could be decrypted.
* **No replay/ordering protection at the app layer** beyond what the WebRTC DataChannel provides.
* **Metadata is not hidden.** The signalling server and STUN see peer IDs and IP/port candidates (your IP can be exposed to the other peer, as with any WebRTC app).
* **Educational project.** This is a personal learning project, not an audited secure-messaging product. Don't use it for anything that would actually put someone at risk.
