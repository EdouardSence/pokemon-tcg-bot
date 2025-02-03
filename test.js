const fs = require('fs').promises;
const path = require('path');

async function fetchData() {
    try {
        const filePath = path.join(__dirname, 'assets', 'getcards.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        console.log('Data:', data);

        // Transform the data into an array of card objects
        const cards = data.data.map((cardArray) => {
            const card = {};
            data.names.forEach((field, index) => {
                card[field] = cardArray[index];
            });
            return card;
        });

        console.log('Cards:', cards);

        // Write the transformed data to a new JSON file
        const outputFilePath = path.join(__dirname, 'assets', 'cards.json');
        await fs.writeFile(outputFilePath, JSON.stringify(cards, null, 2), 'utf-8');
        console.log('Transformed data has been written to cards.json');
    } catch (error) {
        console.error('Error reading or writing JSON file:', error);
    }
}

fetchData();