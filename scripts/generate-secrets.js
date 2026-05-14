#!/usr/bin/env node

/**
 * Genera todos los secretos necesarios para producción.
 * Ejecutar: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('===========================================');
console.log(' Migración Segura MX — Secretos de Producción');
console.log('===========================================\n');

const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
const encryptionKey = crypto.randomBytes(32).toString('base64');

console.log('Copia estos valores en las variables de entorno de Railway:\n');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
console.log(`DOCUMENT_ENCRYPTION_KEY=${encryptionKey}`);
console.log('\n-------------------------------------------');
console.log('IMPORTANTE: No compartas estos valores con nadie.');
console.log('Cada entorno (staging, production) debe tener sus propios secretos.');
console.log('===========================================\n');
