/**
 * AES-256-GCM Cryptographic Engine for AESChat
 * Standard Web Crypto API (Hardware-Accelerated, Zero-Dependency)
 * Matches the specification in v4_encrypted_chat/crypto.h:
 * - Cipher: AES-256-GCM
 * - IV Length: 12 bytes (96 bits)
 * - Tag Length: 16 bytes (128 bits)
 */

export const CryptoEngine = {
  // Convert ArrayBuffer to URL-safe Base64
  bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  },

  // Convert URL-safe Base64 to ArrayBuffer
  base64ToBuffer(base64) {
    let str = base64.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  },

  // Convert ArrayBuffer to Hex String for visual inspector
  bufferToHex(buffer) {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },

  /**
   * Generates a new cryptographically secure 256-bit AES-GCM key
   */
  async generateKey() {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Export CryptoKey to URL-safe Base64 string for URL hash fragment
   */
  async exportKey(key) {
    const rawKey = await window.crypto.subtle.exportKey('raw', key);
    return this.bufferToBase64(rawKey);
  },

  /**
   * Import CryptoKey from URL-safe Base64 string
   */
  async importKey(base64Key) {
    const rawKey = this.base64ToBuffer(base64Key);
    return await window.crypto.subtle.importKey(
      'raw',
      rawKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Derives a human-verifiable Safety Number (fingerprint)
   * Computes SHA-256 of the raw key and formats as 4 numeric chunks (Signal style)
   */
  async getSafetyNumber(key) {
    const rawKey = await window.crypto.subtle.exportKey('raw', key);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', rawKey);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // Convert into 4 groups of 5-digit numbers for easy out-of-band verification
    const chunks = [];
    for (let i = 0; i < 4; i++) {
      const slice = hashArray.slice(i * 4, (i + 1) * 4);
      const val = ((slice[0] << 24) | (slice[1] << 16) | (slice[2] << 8) | slice[3]) >>> 0;
      chunks.push((val % 100000).toString().padStart(5, '0'));
    }
    return chunks.join(' ');
  },

  /**
   * Encrypts plaintext using AES-256-GCM with a fresh random 12-byte IV
   * Returns encrypted packet with IV, Ciphertext, and Auth Tag separated for inspection
   */
  async encrypt(plaintext, key) {
    // 12-byte random IV as per NIST SP 800-38D recommendations
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Web Crypto API encrypt returns ciphertext concatenated with 16-byte tag
    const cipherResult = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128, // 16 bytes
      },
      key,
      data
    );

    const fullCipherBytes = new Uint8Array(cipherResult);
    const tagLength = 16;
    const ciphertextBytes = fullCipherBytes.slice(0, fullCipherBytes.length - tagLength);
    const tagBytes = fullCipherBytes.slice(fullCipherBytes.length - tagLength);

    return {
      iv: this.bufferToBase64(iv.buffer),
      ciphertext: this.bufferToBase64(ciphertextBytes.buffer),
      tag: this.bufferToBase64(tagBytes.buffer),
      // Hex strings for the inspector view
      ivHex: this.bufferToHex(iv.buffer),
      ciphertextHex: this.bufferToHex(ciphertextBytes.buffer),
      tagHex: this.bufferToHex(tagBytes.buffer),
      fullCiphertextHex: this.bufferToHex(cipherResult),
    };
  },

  /**
   * Decrypts an encrypted packet using AES-256-GCM
   * Throws an error if authentication tag verification fails (tampering/wrong key)
   */
  async decrypt(packet, key) {
    const iv = this.base64ToBuffer(packet.iv);
    const ciphertext = this.base64ToBuffer(packet.ciphertext);
    const tag = this.base64ToBuffer(packet.tag);

    // Reconstruct full buffer (ciphertext + tag) for Web Crypto API
    const combined = new Uint8Array(ciphertext.byteLength + tag.byteLength);
    combined.set(new Uint8Array(ciphertext), 0);
    combined.set(new Uint8Array(tag), ciphertext.byteLength);

    try {
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128,
        },
        key,
        combined
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (err) {
      console.error('Decryption failed:', err);
      throw new Error('Authentication tag mismatch. Message may have been altered or key is invalid.');
    }
  },
};

