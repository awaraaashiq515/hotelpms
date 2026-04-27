const { SerialPort } = require('serialport');

const PORT_PATH = '/dev/tty.MPT-II';
const BAUD_RATE = 115200;

async function test() {
    console.log(`Connecting to ${PORT_PATH}...`);
    const port = new SerialPort({
        path: PORT_PATH,
        baudRate: BAUD_RATE,
    });

    port.on('open', () => {
        console.log('✅ Port opened');
        const data = '\x1B\x40\x1B\x61\x01\x1B\x45\x01TERMINAL TEST\x1B\x45\x00\n----------------\nWorks from terminal\n\n\n\n\n';
        const buffer = Buffer.from(data, 'ascii');
        
        port.write(buffer, (err) => {
            if (err) return console.error('❌ Write error:', err.message);
            console.log('🖨️ Data sent');
            port.drain(() => {
                setTimeout(() => {
                    port.close(() => console.log('🔒 Closed'));
                }, 2000);
            });
        });
    });

    port.on('error', (err) => console.error('❌ Error:', err.message));
}

test();
