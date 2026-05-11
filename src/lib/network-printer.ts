import net from 'net';

/**
 * 🌐 Sends data to a network printer via TCP/IP
 */
export async function printToNetwork(data: string | Buffer, ip: string, port: number = 9100): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();

    // Set timeout to 5 seconds
    client.setTimeout(5000);

    client.connect(port, ip, () => {
      console.log(`🌐 Connected to printer at ${ip}:${port}`);
      const buffer = typeof data === 'string' ? Buffer.from(data, 'ascii') : data;
      client.write(buffer, () => {
        console.log('🖨️ Data sent to network printer');
        client.end();
        resolve();
      });
    });

    client.on('error', (err) => {
      console.error(`❌ Network printer error (${ip}:${port}):`, err.message);
      client.destroy();
      reject(err);
    });

    client.on('timeout', () => {
      console.error(`❌ Network printer timeout (${ip}:${port})`);
      client.destroy();
      reject(new Error(`Connection to printer at ${ip}:${port} timed out`));
    });

    client.on('close', () => {
      console.log('🔒 Network connection closed');
    });
  });
}
