const { printDirect, ESC_POS } = require('./src/lib/serial-printer');

async function runTest() {
    console.log("Starting direct print test...");
    let data = '';
    data += ESC_POS.INIT;
    data += ESC_POS.ALIGN_CENTER;
    data += ESC_POS.BOLD_ON;
    data += "TERMINAL TEST\n";
    data += ESC_POS.BOLD_OFF;
    data += "--------------------------------\n";
    data += "Testing the SerialPrintQueue\n";
    data += "from the terminal.\n";
    data += "\n\n\n\n\n";

    try {
        await printDirect(data, '/dev/tty.MPT-II');
        console.log("Test finished successfully.");
    } catch (err) {
        console.error("Test failed:", err);
    }
}

runTest();
