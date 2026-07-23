// Enkripsi dan Dekripsi menggunakan AES-256-GCM (standar keamanan tinggi)
// Menggunakan TOKEN_ENCRYPTION_KEY dari environment variable
// Format token terenkripsi: iv:authTag:ciphertext (hex)

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256-bit

function getKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY || ''
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not set in environment variables')
  }
  // Ambil 32 byte pertama dari key (bisa lebih panjang)
  return Buffer.from(key.slice(0, 64), 'hex').subarray(0, KEY_LENGTH)
}

export function encrypt(plaintext: string): string {
  if (!plaintext || plaintext === '') return ''
  
  const crypto = require('crypto')
  const key = getKey()
  const iv = crypto.randomBytes(12) // 96-bit IV untuk GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText || encryptedText === '' || !encryptedText.includes(':')) {
    // Fallback: mungkin masih plaintext dari sebelum enkripsi ditambahkan
    return encryptedText
  }
  
  const crypto = require('crypto')
  const key = getKey()
  const [ivHex, authTagHex, ciphertext] = encryptedText.split(':')
  
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
