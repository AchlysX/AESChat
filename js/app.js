/**
 * AESChat Application Controller - Clean & Simple
 * Handles UI events, WebRTC P2P coordination, AES-256-GCM operations,
 * and Quirky Anti-AI Bot Verification
 */

import { CryptoEngine } from './crypto.js';
import { P2PConnection } from './p2p.js';

// Quirky Anti-AI Quotes (Classic :) style)
const QUIRKY_BOT_QUOTES = [
  'Bot verification, cause the last thing we want is AI agents communicating securely over this (yes I see you OpenAI agents) :)',
  'Scanning consciousness for unauthorized neural net architectures... :o',
  'Calibrating biological vibe check: ensuring you run on coffee, not electricity :D',
  'Ensuring no autonomous agents are plotting world domination over AES-256-GCM... ;)',
  'Verifying that prompt injection was not detected in user consciousness... :|',
  'Confirming carbon-based lifeform status before granting cryptographic keys... (o_o)',
];

const state = {
  key: null,
  rawKeyBase64: null,
  safetyNumber: null,
  roomId: null,
  isHost: false,
  myAlias: 'User',
  peerAlias: 'Peer',
  p2p: null,
  packetLog: [],
  typingTimeout: null,
  qrCodeInstance: null,
  isHostVerified: false,
  isGuestVerified: false,
};

const DOM = {
  statusIndicator: document.getElementById('statusIndicator'),
  latencyTag: document.getElementById('latencyTag'),
  btnInvite: document.getElementById('btnInvite'),
  btnSafetyNumber: document.getElementById('btnSafetyNumber'),
  btnToggleInspector: document.getElementById('btnToggleInspector'),
  packetCount: document.getElementById('packetCount'),
  
  welcomeBox: document.getElementById('welcomeBox'),
  setupAlias: document.getElementById('setupAlias'),
  botQuoteDisplay: document.getElementById('botQuoteDisplay'),
  botCheckInput: document.getElementById('botCheckInput'),
  botCheckText: document.getElementById('botCheckText'),
  botVerifiedText: document.getElementById('botVerifiedText'),
  btnCreateRoom: document.getElementById('btnCreateRoom'),

  joinBox: document.getElementById('joinBox'),
  joinAlias: document.getElementById('joinAlias'),
  guestBotQuoteDisplay: document.getElementById('guestBotQuoteDisplay'),
  guestBotCheckInput: document.getElementById('guestBotCheckInput'),
  guestBotVerifiedText: document.getElementById('guestBotVerifiedText'),
  btnJoinRoom: document.getElementById('btnJoinRoom'),

  messagesContainer: document.getElementById('messagesContainer'),
  messagesList: document.getElementById('messagesList'),
  typingIndicator: document.getElementById('typingIndicator'),
  chatForm: document.getElementById('chatForm'),
  messageInput: document.getElementById('messageInput'),
  btnSend: document.getElementById('btnSend'),

  inspectorPanel: document.getElementById('inspectorPanel'),
  btnCloseInspector: document.getElementById('btnCloseInspector'),
  inspectorPackets: document.getElementById('inspectorPackets'),

  inviteModal: document.getElementById('inviteModal'),
  shareUrlInput: document.getElementById('shareUrlInput'),
  btnCopyLink: document.getElementById('btnCopyLink'),
  qrCodeContainer: document.getElementById('qrCodeContainer'),

  safetyModal: document.getElementById('safetyModal'),
  safetyNumberDisplay: document.getElementById('safetyNumberDisplay'),

  cryptoDetailsModal: document.getElementById('cryptoDetailsModal'),
  detailPlaintext: document.getElementById('detailPlaintext'),
  detailIv: document.getElementById('detailIv'),
  detailCiphertext: document.getElementById('detailCiphertext'),
  detailTag: document.getElementById('detailTag'),
};

function playAudioChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch (_) {}
}

function getHashParams() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return {
    room: params.get('room'),
    key: params.get('key'),
  };
}

function formatTime(timestamp = Date.now()) {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
  DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight;
}

function getRandomQuote() {
  return QUIRKY_BOT_QUOTES[Math.floor(Math.random() * QUIRKY_BOT_QUOTES.length)];
}

function appendMessage({ id, text, isOutgoing, sender, timestamp, cryptoMeta }) {
  const row = document.createElement('div');
  row.className = `msg-row ${isOutgoing ? 'out' : 'in'}`;
  row.id = id;

  if (!isOutgoing && sender) {
    const senderDiv = document.createElement('div');
    senderDiv.className = 'msg-sender';
    senderDiv.textContent = sender;
    row.appendChild(senderDiv);
  }

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;
  if (cryptoMeta) {
    bubble.title = 'Click to inspect payload';
    bubble.addEventListener('click', () => showCryptoDetails(text, cryptoMeta));
  }
  row.appendChild(bubble);

  const meta = document.createElement('div');
  meta.className = 'msg-meta';

  const timeSpan = document.createElement('span');
  timeSpan.textContent = formatTime(timestamp);
  meta.appendChild(timeSpan);

  const lockTag = document.createElement('span');
  lockTag.className = 'msg-lock';
  lockTag.textContent = '[AES]';
  lockTag.addEventListener('click', (e) => {
    e.stopPropagation();
    showCryptoDetails(text, cryptoMeta);
  });
  meta.appendChild(lockTag);

  row.appendChild(meta);
  DOM.messagesList.appendChild(row);
  scrollToBottom();
}

function appendSystemNotice(text) {
  const notice = document.createElement('div');
  notice.className = 'system-notice';
  notice.textContent = text;
  DOM.messagesList.appendChild(notice);
  scrollToBottom();
}

function showCryptoDetails(plaintext, meta) {
  DOM.detailPlaintext.textContent = plaintext;
  DOM.detailIv.textContent = meta.iv;
  DOM.detailCiphertext.textContent = meta.ciphertext;
  DOM.detailTag.textContent = meta.tag;
  DOM.cryptoDetailsModal.classList.remove('hidden');
}

function handleStatusChange(status, detail) {
  console.log(`[Status] ${status}: ${detail}`);
  DOM.statusIndicator.className = 'status-badge';

  if (status === 'connecting') {
    DOM.statusIndicator.classList.add('waiting');
    DOM.statusIndicator.textContent = 'connecting...';
    DOM.messageInput.disabled = true;
    DOM.btnSend.disabled = true;
    DOM.latencyTag.textContent = '';
  } else if (status === 'waiting-for-peer') {
    DOM.statusIndicator.classList.add('waiting');
    DOM.statusIndicator.textContent = 'waiting for peer...';
    DOM.messageInput.disabled = true;
    DOM.btnSend.disabled = true;
    DOM.latencyTag.textContent = '';
  } else if (status === 'connected') {
    DOM.statusIndicator.classList.add('connected');
    DOM.statusIndicator.textContent = 'connected';
    DOM.messageInput.disabled = false;
    DOM.btnSend.disabled = false;
    DOM.messageInput.focus();
    appendSystemNotice(`[SECURE] ${detail || 'Connected'}. Encrypted with AES-256-GCM.`);
  } else if (status === 'disconnected') {
    DOM.statusIndicator.classList.add('disconnected');
    DOM.statusIndicator.textContent = 'disconnected';
    DOM.messageInput.disabled = true;
    DOM.btnSend.disabled = true;
    DOM.latencyTag.textContent = '';
    appendSystemNotice('[INFO] Peer disconnected.');
  } else if (status === 'error') {
    DOM.statusIndicator.classList.add('disconnected');
    DOM.statusIndicator.textContent = 'notice';
    appendSystemNotice(`[INFO] ${detail}`);
  }
}

function logPacket(direction, packet) {
  state.packetLog.unshift({ direction, packet, time: Date.now() });
  DOM.packetCount.textContent = state.packetLog.length;

  const entry = document.createElement('div');
  entry.className = `packet-entry ${direction === 'outbound' ? 'out' : 'in'}`;

  const dirText = direction === 'outbound' ? '-> OUT' : '<- IN';

  // Inbound packets come straight from the remote peer, so their fields are
  // untrusted. Build the entry with textContent (never innerHTML) so a crafted
  // IV/ciphertext/tag can't inject markup or script into this page.
  const str = (v) => (typeof v === 'string' ? v : '');

  const head = document.createElement('div');
  const dirSpan = document.createElement('span');
  dirSpan.className = 'packet-dir';
  dirSpan.textContent = dirText;
  const timeSpan = document.createElement('span');
  timeSpan.style.color = '#777';
  timeSpan.textContent = ' ' + formatTime();
  head.appendChild(dirSpan);
  head.appendChild(timeSpan);
  entry.appendChild(head);

  const field = (label, value) => {
    const row = document.createElement('div');
    row.append(label + ': ');
    const val = document.createElement('span');
    val.className = 'packet-val';
    val.textContent = value;
    row.appendChild(val);
    return row;
  };
  entry.appendChild(field('IV', str(packet.iv)));
  entry.appendChild(field('CIPHER', str(packet.ciphertext).substring(0, 32) + '...'));
  entry.appendChild(field('TAG', str(packet.tag)));

  if (state.packetLog.length === 1) {
    DOM.inspectorPackets.innerHTML = '';
  }
  DOM.inspectorPackets.insertBefore(entry, DOM.inspectorPackets.firstChild);
}

async function handleIncomingMessage(packet) {
  try {
    const plaintext = await CryptoEngine.decrypt(packet, state.key);
    playAudioChime();
    appendMessage({
      id: packet.id || `msg-${Date.now()}`,
      text: plaintext,
      isOutgoing: false,
      sender: packet.sender || state.peerAlias,
      timestamp: packet.timestamp || Date.now(),
      cryptoMeta: packet,
    });
  } catch (err) {
    console.error('Decryption failed:', err);
    appendSystemNotice('[WARN] Decryption error: authentication tag mismatch.');
  }
}

function updateInviteLink(url) {
  DOM.shareUrlInput.value = url;
  DOM.qrCodeContainer.innerHTML = '';
  if (window.QRCode) {
    new window.QRCode(DOM.qrCodeContainer, {
      text: url,
      width: 150,
      height: 150,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.M,
    });
  }
}

async function startSession(roomId, base64Key, isHost) {
  state.roomId = roomId;
  state.isHost = isHost;
  state.rawKeyBase64 = base64Key;

  state.key = await CryptoEngine.importKey(base64Key);
  state.safetyNumber = await CryptoEngine.getSafetyNumber(state.key);
  DOM.safetyNumberDisplay.textContent = state.safetyNumber;

  const inviteUrl = `${window.location.origin}${window.location.pathname}#room=${state.roomId}&key=${state.rawKeyBase64}`;
  updateInviteLink(inviteUrl);

  state.p2p = new P2PConnection({
    onStatusChange: handleStatusChange,
    onMessage: handleIncomingMessage,
    onTyping: (isTyping) => {
      DOM.typingIndicator.classList.toggle('hidden', !isTyping);
      if (isTyping) scrollToBottom();
    },
    onPacketLog: (dir, pkt) => logPacket(dir, pkt),
    onPeerInfo: (info) => {
      if (info.alias) state.peerAlias = info.alias;
      if (info.latency !== undefined) {
        DOM.latencyTag.textContent = `${info.latency}ms`;
      }
    },
  });

  state.p2p.init(state.roomId, state.isHost, state.myAlias);
}

function bindEvents() {
  // Modal closing
  document.querySelectorAll('.btn-close-modal').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay')?.classList.add('hidden');
    });
  });

  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.add('hidden');
    });
  });

  // Top buttons
  DOM.btnInvite.addEventListener('click', () => DOM.inviteModal.classList.remove('hidden'));
  DOM.btnSafetyNumber.addEventListener('click', () => DOM.safetyModal.classList.remove('hidden'));
  DOM.btnToggleInspector.addEventListener('click', () => DOM.inspectorPanel.classList.toggle('hidden'));
  DOM.btnCloseInspector.addEventListener('click', () => DOM.inspectorPanel.classList.add('hidden'));

  // Copy Link
  DOM.btnCopyLink.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(DOM.shareUrlInput.value);
      DOM.btnCopyLink.textContent = 'Copied!';
      setTimeout(() => { DOM.btnCopyLink.textContent = 'Copy'; }, 1500);
    } catch (_) {
      DOM.shareUrlInput.select();
      document.execCommand('copy');
    }
  });

  // Host Bot Verification
  DOM.botCheckInput.addEventListener('change', () => {
    if (DOM.botCheckInput.checked) {
      DOM.botCheckText.textContent = 'Verifying biological synapses...';
      setTimeout(() => {
        state.isHostVerified = true;
        DOM.botVerifiedText.classList.remove('hidden');
        DOM.botCheckText.textContent = 'Human verified :)';
        DOM.btnCreateRoom.disabled = false;
        playAudioChime();
      }, 400);
    } else {
      state.isHostVerified = false;
      DOM.botVerifiedText.classList.add('hidden');
      DOM.btnCreateRoom.disabled = true;
    }
  });

  // Guest Bot Verification
  DOM.guestBotCheckInput.addEventListener('change', () => {
    if (DOM.guestBotCheckInput.checked) {
      setTimeout(() => {
        state.isGuestVerified = true;
        DOM.guestBotVerifiedText.classList.remove('hidden');
        DOM.btnJoinRoom.disabled = false;
        playAudioChime();
      }, 400);
    } else {
      state.isGuestVerified = false;
      DOM.guestBotVerifiedText.classList.add('hidden');
      DOM.btnJoinRoom.disabled = true;
    }
  });

  // Create Room
  DOM.btnCreateRoom.addEventListener('click', async () => {
    if (!state.isHostVerified) return;

    const alias = DOM.setupAlias.value.trim();
    if (alias) state.myAlias = alias;

    const key = await CryptoEngine.generateKey();
    const base64Key = await CryptoEngine.exportKey(key);
    const roomId = 'aes-' + Math.random().toString(36).substring(2, 9);

    window.location.hash = `#room=${roomId}&key=${base64Key}`;
    DOM.welcomeBox.classList.add('hidden');

    await startSession(roomId, base64Key, true);
    DOM.inviteModal.classList.remove('hidden');
  });

  // Join Room
  DOM.btnJoinRoom.addEventListener('click', async () => {
    if (!state.isGuestVerified) return;

    const alias = DOM.joinAlias.value.trim();
    if (alias) state.myAlias = alias;

    const { room, key } = getHashParams();
    DOM.joinBox.classList.add('hidden');

    await startSession(room, key, false);
  });

  // Send Message
  DOM.chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = DOM.messageInput.value.trim();
    if (!text || !state.key || !state.p2p) return;

    DOM.messageInput.value = '';
    state.p2p.sendTyping(false);

    try {
      const encrypted = await CryptoEngine.encrypt(text, state.key);
      const packet = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        iv: encrypted.iv,
        ciphertext: encrypted.ciphertext,
        tag: encrypted.tag,
        sender: state.myAlias,
        timestamp: Date.now(),
      };

      state.p2p.sendEncrypted(packet);

      appendMessage({
        id: packet.id,
        text,
        isOutgoing: true,
        sender: state.myAlias,
        timestamp: packet.timestamp,
        cryptoMeta: packet,
      });
    } catch (err) {
      console.error('Failed to send:', err);
      appendSystemNotice(`[ERR] Failed to send: ${err.message}`);
    }
  });

  // Typing debounce
  DOM.messageInput.addEventListener('input', () => {
    if (!state.p2p) return;
    state.p2p.sendTyping(true);
    if (state.typingTimeout) clearTimeout(state.typingTimeout);
    state.typingTimeout = setTimeout(() => {
      if (state.p2p) state.p2p.sendTyping(false);
    }, 1200);
  });
}

async function init() {
  bindEvents();
  const { room, key } = getHashParams();

  if (room && key) {
    DOM.welcomeBox.classList.add('hidden');
    DOM.joinBox.classList.remove('hidden');
    DOM.guestBotQuoteDisplay.textContent = getRandomQuote();
  } else {
    DOM.welcomeBox.classList.remove('hidden');
    DOM.joinBox.classList.add('hidden');
    DOM.botQuoteDisplay.textContent = getRandomQuote();
  }
}

init().catch((err) => {
  console.error('Init error:', err);
  handleStatusChange('error', err.message);
});
