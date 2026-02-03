const fs = require('fs');
const path = 'e:/promgramming/NKH_WebApp/lang/km.json';
try {
    const data = fs.readFileSync(path, 'utf8');
    const lines = data.split(/\r?\n/);
    const targetIndex = 1942; // Line 1943
    console.log('Line 1943 raw:', JSON.stringify(lines[targetIndex]));
    if (lines[targetIndex].includes('},')) {
        console.log('Found }, - replacing...');
        lines[targetIndex] = lines[targetIndex].replace('},', ',');
        fs.writeFileSync(path, lines.join('\n'));
        console.log('Fixed km.json');
    } else {
        console.log('Target not found on line 1943');
    }
} catch (e) {
    console.error(e);
}
