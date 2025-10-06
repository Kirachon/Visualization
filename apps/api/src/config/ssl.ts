import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SSLConfig {
  key: Buffer;
  cert: Buffer;
}

export const getSSLConfig = (): SSLConfig | null => {
  try {
    const certPath = path.join(
      __dirname,
      '../../../infrastructure/certs/server.crt'
    );
    const keyPath = path.join(
      __dirname,
      '../../../infrastructure/certs/server.key'
    );

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
    }

    return null;
  } catch (error) {
    console.error('Error loading SSL certificates:', error);
    return null;
  }
};

