// generate-jwt-key.js
const crypto = require('crypto');

// Generate a random 64-byte (512-bit) key
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('===========================================');
console.log('YOUR JWT SECRET KEY:');
console.log('===========================================');
console.log(jwtSecret);
console.log('===========================================');
console.log('\n  IMPORTANT SECURITY NOTES:');
console.log('1. Copy this key and paste it in your .env file as JWT_SECRET');
console.log('2. NEVER share this key with anyone');
console.log('3. NEVER commit this key to GitHub');
console.log('4. Keep this key safe - it signs all user authentication tokens');
console.log('5. If compromised, all users will need to log in again');
console.log('===========================================');

// Also generate a reset token secret (different from JWT secret)
const resetSecret = crypto.randomBytes(64).toString('hex');
console.log('\nRESET TOKEN SECRET (for password reset):');
console.log(resetSecret);
console.log('===========================================');
console.log('Add this to .env as: JWT_RESET_SECRET=' + resetSecret + '_reset');
console.log('===========================================');