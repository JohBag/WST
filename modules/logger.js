import fs from 'fs';

// Clear log file
fs.writeFile('log.txt', '', (err) => {
    if (err) throw err;
});

export default async function log(text) {
    console.log(text);
    fs.appendFile('log.txt', text + '\n', (err) => {
        if (err) throw err;
    });
}