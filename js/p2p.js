/**
 * Peer-to-Peer WebRTC DataChannel Layer with Offline Local BroadcastChannel Support
 * Works across the internet via WebRTC STUN, and 100% offline via BroadcastChannel
 */

export class P2PConnection {
  constructor({ onStatusChange, onMessage, onTyping, onPacketLog, onPeerInfo }) {
    this.onStatusChange = onStatusChange || (() => {});
    this.onMessage = onMessage || (() => {});
    this.onTyping = onTyping || (() => {});
    this.onPacketLog = onPacketLog || (() => {});
    this.onPeerInfo = onPeerInfo || (() => {});

    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.roomId = null;
    this.myPeerId = null;
    this.remotePeerId = null;
    this.pingInterval = null;
    this.latency = null;
    this.reconnectTimeout = null;
    this.isDestroyed = false;
    this.localChannel = null;
    this.isLocalActive = false;
  }

  /**
   * Initializes P2P node (WebRTC + Offline Local BroadcastChannel)
   */
  init(roomId, isHost, userAlias = 'Anonymous') {
    this.roomId = roomId;
    this.isHost = isHost;
    this.userAlias = userAlias;
    this.isDestroyed = false;

    // Unique peer IDs
    if (isHost) {
      this.myPeerId = `aeschat-${roomId}-host`;
    } else {
      const nonce = Math.random().toString(36).substring(2, 8);
      this.myPeerId = `aeschat-${roomId}-guest-${nonce}`;
    }

    // Initialize Offline Local BroadcastChannel (works without internet between local tabs)
    this.initLocalBroadcastChannel();

    // Check if PeerJS library is loaded (might not be if testing 100% offline without cache)
    if (typeof window.Peer === 'undefined') {
      console.warn('PeerJS not loaded (offline mode). Using Local BroadcastChannel.');
      this.isLocalActive = true;
      this.onStatusChange('connected', 'Offline Local P2P Active (BroadcastChannel)');
      this.broadcastLocalPresence();
      return;
    }

    this.onStatusChange('connecting', `Registering peer with signaling network...`);

    try {
      this.peer = new window.Peer(this.myPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ],
        },
      });

      this.peer.on('open', (id) => {
        console.log('My peer ID is:', id);
        if (this.isHost) {
          this.onStatusChange('waiting-for-peer', 'Waiting for your friend to open the invite link...');
          this.broadcastLocalPresence();
        } else {
          this.connectToHost();
        }
      });

      this.peer.on('connection', (connection) => {
        console.log('Incoming WebRTC connection from:', connection.peer);
        if (this.conn && this.conn.open) {
          this.conn.close();
        }
        this.setupConnection(connection);
      });

      this.peer.on('error', (err) => {
        console.warn('PeerJS network notice:', err.type);
        if (err.type === 'peer-unavailable' && !this.isHost) {
          // If host not ready via WebRTC, check local channel
          this.broadcastLocalPresence();
          this.reconnectTimeout = setTimeout(() => {
            if (!this.isDestroyed && (!this.conn || !this.conn.open)) {
              this.connectToHost();
            }
          }, 3000);
        } else if (err.type === 'network' || err.type === 'server-error') {
          // Fallback to local channel if internet drops
          this.isLocalActive = true;
          this.onStatusChange('connected', 'Offline Local P2P Active (BroadcastChannel)');
          this.broadcastLocalPresence();
        }
      });

      this.peer.on('disconnected', () => {
        if (!this.isDestroyed && this.peer && !this.peer.destroyed) {
          this.peer.reconnect();
        }
      });
    } catch (e) {
      console.warn('Failed to initialize WebRTC PeerJS, activating Offline Local Mode:', e);
      this.isLocalActive = true;
      this.onStatusChange('connected', 'Offline Local P2P Active (BroadcastChannel)');
      this.broadcastLocalPresence();
    }
  }

  /**
   * Sets up local browser-to-browser BroadcastChannel for 100% offline testing
   */
  initLocalBroadcastChannel() {
    if (typeof window.BroadcastChannel === 'undefined') return;

    try {
      this.localChannel = new window.BroadcastChannel(`aeschat-local-${this.roomId}`);
      this.localChannel.onmessage = (event) => {
        const data = event.data;
        if (!data || data.senderId === this.myPeerId) return;

        // Remote peer found on local machine
        if (!this.conn || !this.conn.open) {
          if (!this.isLocalActive) {
            this.isLocalActive = true;
            this.onStatusChange('connected', 'Offline Local P2P Active (BroadcastChannel)');
            this.onPeerInfo({ latency: 1 });
          }
        }

        this.handleIncomingData(data.payload);
      };
    } catch (err) {
      console.warn('BroadcastChannel initialization error:', err);
    }
  }

  broadcastLocalPresence() {
    if (this.localChannel) {
      this.sendLocal({
        type: 'handshake',
        alias: this.userAlias,
        timestamp: Date.now(),
      });
    }
  }

  connectToHost() {
    if (!this.peer || this.peer.destroyed) return;
    const targetPeerId = `aeschat-${this.roomId}-host`;
    this.onStatusChange('connecting', `Connecting directly to host (${targetPeerId})...`);

    const connection = this.peer.connect(targetPeerId, {
      reliable: true,
      serialization: 'json',
    });

    this.setupConnection(connection);
  }

  setupConnection(connection) {
    this.conn = connection;

    this.conn.on('open', () => {
      console.log('WebRTC DataChannel OPENED with', this.conn.peer);
      this.remotePeerId = this.conn.peer;
      this.isLocalActive = false; // WebRTC takes priority
      this.onStatusChange('connected', 'Direct P2P E2EE Connection Established');

      this.sendRaw({
        type: 'handshake',
        alias: this.userAlias,
        timestamp: Date.now(),
      });

      this.startPing();
    });

    this.conn.on('data', (data) => {
      this.handleIncomingData(data);
    });

    this.conn.on('close', () => {
      this.stopPing();
      if (!this.isLocalActive) {
        this.onStatusChange('disconnected', 'Peer disconnected.');
      }
    });

    this.conn.on('error', (err) => {
      console.error('Connection error:', err);
    });
  }

  handleIncomingData(data) {
    if (!data || typeof data !== 'object') return;

    if (data.type === 'ping') {
      this.sendRaw({ type: 'pong', sentAt: data.sentAt });
      return;
    }

    if (data.type === 'pong') {
      if (data.sentAt) {
        this.latency = Math.round(Date.now() - data.sentAt);
        this.onPeerInfo({ latency: this.latency });
      }
      return;
    }

    if (data.type === 'handshake') {
      this.onPeerInfo({ alias: data.alias || 'Peer' });
      this.sendRaw({
        type: 'handshake_ack',
        alias: this.userAlias,
        timestamp: Date.now(),
      });
      return;
    }

    if (data.type === 'handshake_ack') {
      this.onPeerInfo({ alias: data.alias || 'Peer' });
      return;
    }

    if (data.type === 'typing') {
      this.onTyping(Boolean(data.isTyping));
      return;
    }

    if (data.type === 'encrypted_message') {
      this.onPacketLog('inbound', data.packet);
      this.onMessage(data.packet);
      return;
    }
  }

  sendEncrypted(packet) {
    const isWebRTCOpen = this.conn && this.conn.open;
    const isLocalAvailable = Boolean(this.localChannel);

    if (!isWebRTCOpen && !isLocalAvailable) {
      throw new Error('No active P2P connection or local channel available.');
    }

    const payload = {
      type: 'encrypted_message',
      packet,
    };

    this.onPacketLog('outbound', packet);
    this.sendRaw(payload);
  }

  sendTyping(isTyping) {
    this.sendRaw({
      type: 'typing',
      isTyping: Boolean(isTyping),
    });
  }

  sendRaw(payload) {
    // Send over WebRTC if connected
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(payload);
      } catch (err) {
        console.warn('WebRTC send error:', err);
      }
    }
    // Also broadcast to local channel for local/offline testing
    this.sendLocal(payload);
  }

  sendLocal(payload) {
    if (this.localChannel) {
      try {
        this.localChannel.postMessage({
          senderId: this.myPeerId,
          payload,
        });
      } catch (_) {}
    }
  }

  startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.conn && this.conn.open) {
        this.sendRaw({ type: 'ping', sentAt: Date.now() });
      }
    }, 12000);
  }

  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.stopPing();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.localChannel) {
      try { this.localChannel.close(); } catch (_) {}
    }
    if (this.conn) {
      try { this.conn.close(); } catch (_) {}
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (_) {}
    }
  }
}
