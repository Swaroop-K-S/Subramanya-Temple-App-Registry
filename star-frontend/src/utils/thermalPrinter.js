/**
 * Google Antigravity - Thermal Printer Driver (ESC/POS)
 * Encodes Receipt Data into raw byte streams for thermal printers.
 */

const ESC = '\x1b';
const GS = '\x1d';

const COMMANDS = {
    INIT: ESC + '@',
    CENTER: ESC + 'a' + '\x01',
    LEFT: ESC + 'a' + '\x00',
    RIGHT: ESC + 'a' + '\x02',
    BOLD_ON: ESC + 'E' + '\x01',
    BOLD_OFF: ESC + 'E' + '\x00',
    CUT: GS + 'V' + '\x41' + '\x03', // Full cut
    DOUB_HEIGHT: GS + '!' + '\x11',
    NORMAL: GS + '!' + '\x00'
};

export const encodeReceipt = (transaction, seva, lang) => {
    let buffer = '';

    // Helper to append string
    const print = (text) => {
        buffer += text + '\n';
    };

    const cmd = (c) => {
        buffer += c;
    }

    // Header
    cmd(COMMANDS.INIT);
    cmd(COMMANDS.CENTER);
    cmd(COMMANDS.BOLD_ON);
    cmd(COMMANDS.DOUB_HEIGHT);
    print("SRI SUBRAMANYA SWAMY TEMPLE");
    cmd(COMMANDS.NORMAL);
    cmd(COMMANDS.BOLD_OFF);
    print("Tarikere - 577228");
    print("--------------------------------");

    // Details
    cmd(COMMANDS.LEFT);
    print(`Rcpt #: ${transaction.receipt_no}`);
    print(`Date  : ${transaction.date}`);
    print("--------------------------------");

    // Name & Seva
    cmd(COMMANDS.BOLD_ON);
    print(`Name: ${transaction.devotee_name_en || transaction.devotee_name}`);
    if (lang === 'KN' && seva.name_kan) {
        // Note: Thermal printers need specific encoding for Kannada. 
        // Falling back to English Transliteration for safety/universal support
        // unless printer supports ISCII/UTF-8 with proper font.
        // We will print English for reliability in this protocol.
        print(`Seva: ${seva.name_eng}`);
    } else {
        print(`Seva: ${seva.name_eng}`);
    }
    cmd(COMMANDS.BOLD_OFF);

    // Gothra/Nakshatra
    if (transaction.gothra) print(`Gothra: ${transaction.gothra}`);
    if (transaction.nakshatra) print(`Star  : ${transaction.nakshatra}`);

    print("--------------------------------");

    // Amount
    cmd(COMMANDS.RIGHT);
    cmd(COMMANDS.DOUB_HEIGHT);
    print(`TOTAL: Rs. ${transaction.amount_paid}`);
    cmd(COMMANDS.NORMAL);
    cmd(COMMANDS.CENTER);
    print("--------------------------------");

    // Footer
    print("Sarve Jana Sukhino Bhavantu");
    print("\n\n");
    cmd(COMMANDS.CUT);

    return buffer;
};

export const printToThermal = (transaction, seva, lang = 'EN') => {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket('ws://localhost:8080');

        socket.onopen = () => {
            const data = encodeReceipt(transaction, seva, lang);
            socket.send(data);
            socket.close();
            resolve("Sent to Printer");
        };

        socket.onerror = (err) => {
            reject("Printer Bridge Unreachable");
        };
    });
};
