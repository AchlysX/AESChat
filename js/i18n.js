/**
 * Minimal i18n for AESChat (FR / EN).
 * All strings are authored here and applied with textContent / setAttribute,
 * never innerHTML, so translation can't introduce an injection vector.
 */

export const translations = {
  en: {
    // Navbar
    nav_newchat: 'New Chat',
    nav_how: 'How It Works',
    nav_security: 'Security',
    nav_invite: 'Invite',
    nav_safety: 'Safety Number',
    nav_wirelog: 'Wire Log',
    // Status badge
    st_waiting: 'waiting',
    st_connecting: 'connecting...',
    st_waiting_peer: 'waiting for peer...',
    st_connected: 'connected',
    st_disconnected: 'disconnected',
    st_notice: 'notice',
    // Welcome card
    welcome_title: 'Start Secure Chat',
    welcome_desc: 'End-to-end encrypted with AES-256-GCM. Once connected, messages travel directly peer-to-peer via WebRTC. No message is ever stored on a server.',
    alias_label: 'Your Alias:',
    bot_check_label: 'I confirm I am human (not an AI agent)',
    bot_verified: 'Vibe check passed :)',
    btn_create: 'Create Room',
    // Join card
    join_title: 'Join Encrypted Chat',
    join_desc: "You were invited to an encrypted room. The key lives in the link's # fragment, which your browser never sends to the page host — so share the link only with people you trust.",
    btn_join: 'Enter Chat',
    // Chat
    typing_indicator: 'Peer is typing...',
    msg_placeholder: 'Type an encrypted message...',
    btn_send: 'Send',
    // Inspector
    inspector_title: 'Wire Packet Inspector',
    btn_close: 'Close',
    inspector_empty: 'No packets logged yet. Send a message to inspect the wire.',
    // How it works
    how_title: 'How AESChat Works (Under the Hood)',
    how1_title: '1. The key lives in the link',
    how1_body: 'When a room is created, a fresh 256-bit AES key is packed into the URL fragment (#room=...&key=...). Per RFC 3986, browsers do not send anything after the # in HTTP requests, so the page host (Cloudflare) never receives the key. The trade-off: anyone who has the link has the key and can read the chat — so share it over a trusted channel.',
    how2_title: '2. Direct Peer-to-Peer (WebRTC)',
    how2_body: 'Message packets are not relayed through a messaging server or stored in a database — once the connection is up, they flow directly between the two browsers. Setting the connection up does use a signaling server (PeerJS) and STUN servers (Google) to introduce the peers; those see connection metadata, not message content or the key.',
    how3_title: '3. Authenticated AES-256-GCM Encryption',
    how3_body: 'Every message generates a fresh 12-byte (96-bit) IV and a 16-byte (128-bit) authentication tag via the browser\'s crypto.subtle. If anyone alters a single bit in transit, tag verification fails and the packet is rejected.',
    how4_title: '4. Signal-Style Safety Numbers',
    how4_body: 'A SHA-256 fingerprint is derived from the shared key and shown as 4 numeric blocks. Both parties can compare these out of band to make sure no one is in the middle.',
    how5_title: '5. Static hosting, no app server',
    how5_body: 'Unlike a traditional chat that needs a persistent VPS running a socket server, this app is just static files served by Cloudflare, with no backend application to run or maintain. Connection setup still relies on the shared PeerJS and STUN servers above.',
    how_foot: 'Architected by',
    how_security_link: 'Security audit & live vuln demo →',
    // Invite modal
    invite_title: 'Share Invite Link',
    invite_desc: "The 256-bit key is in the link's # fragment, so it isn't sent to the page host. Anyone with this link can read the chat — share it only with the person you mean to.",
    btn_copy: 'Copy',
    btn_copied: 'Copied!',
    // Safety modal
    safety_title: 'Safety Number',
    safety_desc: 'SHA-256 fingerprint of the shared AES key. Compare with your peer to verify encryption:',
    loading: 'Loading...',
    // Crypto details modal
    detail_title: 'Encrypted Packet Details',
    detail_plaintext: 'Plaintext:',
    detail_iv: 'IV (12 bytes):',
    detail_cipher: 'Ciphertext:',
    detail_tag: 'Auth Tag (16 bytes):',
    // Dynamic (JS)
    bot_verifying: 'Verifying biological synapses...',
    bot_human: 'Human verified :)',
    notice_secure: '[SECURE] Connected. Encrypted with AES-256-GCM.',
    notice_peer_disconnected: '[INFO] Peer disconnected.',
    notice_decrypt_error: '[WARN] Decryption error: authentication tag mismatch.',
    notice_send_fail: '[ERR] Failed to send: ',
    notice_bad_link: '[ERR] Invalid or corrupt invite link.',
    confirm_newchat: 'Start a new chat? This ends the current encrypted session.',
  },
  fr: {
    // Navbar
    nav_newchat: 'Nouveau chat',
    nav_how: 'Comment ça marche',
    nav_security: 'Sécurité',
    nav_invite: 'Inviter',
    nav_safety: 'Numéro de sécurité',
    nav_wirelog: 'Journal réseau',
    // Status badge
    st_waiting: 'en attente',
    st_connecting: 'connexion...',
    st_waiting_peer: 'en attente du pair...',
    st_connected: 'connecté',
    st_disconnected: 'déconnecté',
    st_notice: 'info',
    // Welcome card
    welcome_title: 'Démarrer un chat sécurisé',
    welcome_desc: 'Chiffré de bout en bout en AES-256-GCM. Une fois la connexion établie, les messages transitent directement en pair-à-pair via WebRTC. Aucun message n\'est stocké sur un serveur.',
    alias_label: 'Votre pseudo :',
    bot_check_label: 'Je confirme que je suis humain (pas une IA)',
    bot_verified: 'Vibe check validé :)',
    btn_create: 'Créer un salon',
    // Join card
    join_title: 'Rejoindre le chat chiffré',
    join_desc: 'Vous avez été invité·e dans un salon chiffré. La clé se trouve dans le fragment # du lien, que votre navigateur n\'envoie jamais à l\'hébergeur de la page — ne partagez donc le lien qu\'avec des personnes de confiance.',
    btn_join: 'Entrer dans le chat',
    // Chat
    typing_indicator: 'Le pair écrit...',
    msg_placeholder: 'Écrivez un message chiffré...',
    btn_send: 'Envoyer',
    // Inspector
    inspector_title: 'Inspecteur de paquets réseau',
    btn_close: 'Fermer',
    inspector_empty: 'Aucun paquet enregistré pour l\'instant. Envoyez un message pour inspecter le réseau.',
    // How it works
    how_title: 'Comment fonctionne AESChat (sous le capot)',
    how1_title: '1. La clé est dans le lien',
    how1_body: 'À la création d\'un salon, une clé AES de 256 bits est générée et placée dans le fragment de l\'URL (#room=...&key=...). D\'après la RFC 3986, les navigateurs n\'envoient rien de ce qui suit le # dans les requêtes HTTP : l\'hébergeur de la page (Cloudflare) ne reçoit donc jamais la clé. La contrepartie : quiconque possède le lien possède la clé et peut lire la conversation — partagez-le par un canal de confiance.',
    how2_title: '2. Pair-à-pair direct (WebRTC)',
    how2_body: 'Les paquets de messages ne transitent par aucun serveur de messagerie et ne sont stockés dans aucune base — une fois la connexion établie, ils circulent directement entre les deux navigateurs. L\'établissement de la connexion utilise toutefois un serveur de signalisation (PeerJS) et des serveurs STUN (Google) pour mettre les pairs en relation ; ceux-ci voient des métadonnées de connexion, pas le contenu des messages ni la clé.',
    how3_title: '3. Chiffrement authentifié AES-256-GCM',
    how3_body: 'Chaque message génère un IV de 12 octets (96 bits) et un tag d\'authentification de 16 octets (128 bits) via le crypto.subtle du navigateur. Si un seul bit est modifié en transit, la vérification du tag échoue et le paquet est rejeté.',
    how4_title: '4. Numéros de sécurité façon Signal',
    how4_body: 'Une empreinte SHA-256 est dérivée de la clé partagée et affichée en 4 blocs de chiffres. Les deux parties peuvent les comparer hors bande pour s\'assurer que personne ne s\'intercale au milieu.',
    how5_title: '5. Hébergement statique, pas de serveur applicatif',
    how5_body: 'Contrairement à un chat classique qui nécessite un VPS permanent exécutant un serveur socket, cette application n\'est qu\'un ensemble de fichiers statiques servis par Cloudflare, sans backend à faire tourner ni à maintenir. L\'établissement de la connexion repose toujours sur les serveurs PeerJS et STUN mentionnés ci-dessus.',
    how_foot: 'Conçu par',
    how_security_link: 'Audit de sécurité & démo de la faille →',
    // Invite modal
    invite_title: 'Partager le lien d\'invitation',
    invite_desc: 'La clé de 256 bits est dans le fragment # du lien, elle n\'est donc pas envoyée à l\'hébergeur. Toute personne disposant de ce lien peut lire la conversation — ne le partagez qu\'avec la personne concernée.',
    btn_copy: 'Copier',
    btn_copied: 'Copié !',
    // Safety modal
    safety_title: 'Numéro de sécurité',
    safety_desc: 'Empreinte SHA-256 de la clé AES partagée. Comparez-la avec votre pair pour vérifier le chiffrement :',
    loading: 'Chargement...',
    // Crypto details modal
    detail_title: 'Détails du paquet chiffré',
    detail_plaintext: 'Texte en clair :',
    detail_iv: 'IV (12 octets) :',
    detail_cipher: 'Texte chiffré :',
    detail_tag: 'Tag d\'authentification (16 octets) :',
    // Dynamic (JS)
    bot_verifying: 'Vérification des synapses biologiques...',
    bot_human: 'Humain vérifié :)',
    notice_secure: '[SÉCURISÉ] Connecté. Chiffré en AES-256-GCM.',
    notice_peer_disconnected: '[INFO] Le pair s\'est déconnecté.',
    notice_decrypt_error: '[ALERTE] Erreur de déchiffrement : tag d\'authentification invalide.',
    notice_send_fail: '[ERR] Échec de l\'envoi : ',
    notice_bad_link: '[ERR] Lien d\'invitation invalide ou corrompu.',
    confirm_newchat: 'Démarrer un nouveau chat ? Cela met fin à la session chiffrée en cours.',
  },
};

export const QUOTES = {
  en: [
    'Bot verification, cause the last thing we want is AI agents communicating securely over this (yes I see you OpenAI agents) :)',
    'Scanning consciousness for unauthorized neural net architectures... :o',
    'Calibrating biological vibe check: ensuring you run on coffee, not electricity :D',
    'Ensuring no autonomous agents are plotting world domination over AES-256-GCM... ;)',
    'Verifying that prompt injection was not detected in user consciousness... :|',
    'Confirming carbon-based lifeform status before granting cryptographic keys... (o_o)',
  ],
  fr: [
    'Vérification anti-bot, parce que la dernière chose qu\'on veut, c\'est des IA qui communiquent en sécurité là-dessus (oui, je vous vois les agents OpenAI) :)',
    'Analyse de la conscience à la recherche d\'architectures de réseaux de neurones non autorisées... :o',
    'Calibrage du vibe check biologique : on vérifie que vous tournez au café, pas à l\'électricité :D',
    'On s\'assure qu\'aucun agent autonome ne complote la domination du monde via AES-256-GCM... ;)',
    'Vérification de l\'absence d\'injection de prompt dans la conscience de l\'utilisateur... :|',
    'Confirmation du statut de forme de vie à base de carbone avant de délivrer les clés cryptographiques... (o_o)',
  ],
};

let currentLang = 'en';

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  currentLang = lang === 'fr' ? 'fr' : 'en';
  try { localStorage.setItem('aeschat_lang', currentLang); } catch (_) {}
  try { document.documentElement.lang = currentLang; } catch (_) {}
}

export function storedLang() {
  try {
    const v = localStorage.getItem('aeschat_lang');
    return v === 'fr' || v === 'en' ? v : null;
  } catch (_) {
    return null;
  }
}

export function t(key) {
  const dict = translations[currentLang] || translations.en;
  if (key in dict) return dict[key];
  return key in translations.en ? translations.en[key] : key;
}

export function randomQuote() {
  const arr = QUOTES[currentLang] || QUOTES.en;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Applies all [data-i18n], [data-i18n-ph] (placeholder) and [data-i18n-title]
// (title attribute) translations under root. textContent/setAttribute only.
export function applyTranslations(root) {
  const scope = root || document;
  scope.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  scope.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
  });
  scope.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
  });
}
