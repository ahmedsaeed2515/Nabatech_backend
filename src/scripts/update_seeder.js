const fs = require('fs');
const filePath = 'd:/Graduation-Project/Nabatech/backend/src/utils/seeder.ts';
let content = fs.readFileSync(filePath, 'utf8');

const newData = require('C:/Users/Ahmed Saeed/.gemini/antigravity/brain/7f5f663a-8d4f-49a0-bffd-b033112f4744/botanical_content.json');
const newJsonString = JSON.stringify(newData, null, 2).replace(/"([a-zA-Z0-9_]+)":/g, '$1:');

const startMarker = 'const seedPlants = [';
const startIndex = content.indexOf(startMarker);
if (startIndex !== -1) {
    let bracketCount = 0;
    let endIndex = -1;
    for (let i = startIndex + startMarker.length - 1; i < content.length; i++) {
        if (content[i] === '[') bracketCount++;
        if (content[i] === ']') {
            bracketCount--;
            if (bracketCount === 0) {
                endIndex = i;
                break;
            }
        }
    }
    if (endIndex !== -1) {
        content = content.substring(0, startIndex) + 'const seedPlants = ' + newJsonString + content.substring(endIndex + 1);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Successfully updated seeder.ts');
    } else {
        console.log('Failed to find end of array');
    }
} else {
    console.log('Failed to find start of array');
}
