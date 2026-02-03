const fs = require('fs');
const path = 'e:/promgramming/NKH_WebApp/lang/km.json';
try {
    const data = fs.readFileSync(path, 'utf8');
    const lines = data.split(/\r?\n/);
    console.log('Total lines:', lines.length);
    let found = false;
    for (let i = 1940; i < 1950; i++) {
        if (lines[i] && lines[i].trim() === '},' && lines[i + 1] && lines[i + 1].trim().startsWith('"inventory": {')) {
            console.log('Found match at line ' + (i + 1));
            lines[i] = lines[i].replace('},', ',');
            found = true;
            break;
        }
    }
    if (found) {
        fs.writeFileSync(path, lines.join('\n'));
        console.log('Fixed km.json');
    } else {
        console.log('Pattern not found');
    }
} catch (e) {
    console.error(e);
}
