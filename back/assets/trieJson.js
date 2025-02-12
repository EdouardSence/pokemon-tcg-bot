const fs = require('fs');

// -------------- TRIE DU JSON  ----------------    



//  Read the JSON file
// fs.readFile('cards.json', 'utf8', (err, data) => {
//     if (err) {
//         console.error('Error reading the file:', err);
//         return;
//     }

//     // Parse the JSON data
//     const jsonData = JSON.parse(data);

//     // Extract the relevant fields
//     const cleanedData = jsonData.map(card => {
//         // Vérifie si card.props est défini et est un tableau
//         const dupeReward = Array.isArray(card.props)
//             ? card.props.find(prop => prop.name === "Dupe Reward")?.value ?? null
//             : null;
    
//         const packPoint = Array.isArray(card.props)
//             ? card.props.find(prop => prop.name === "Pack Point")?.value ?? null
//             : null;
    
//         // Détermine la rareté en fonction de packPoint
//         const rarityMap = {
//             35: 1,
//             70: 2,
//             150: 3,
//             500: 4,
//             400: 5,
//             1250: 6,
//             1500: 7,
//             2500: 8
//         };
        
//         const rarity = rarityMap[packPoint] ?? null; // Définit null si packPoint n'est pas dans la liste
    
//         // Détermine le coût d'échange en fonction de la rareté
//         const tradeCostMap = {
//             1: 0,
//             2: 0,
//             3: 120,
//             4: 500,
//             5: 400
//         };
    
//         const tradeCost = tradeCostMap[rarity] ?? null; // Définit null si la rareté n'est pas dans la liste
    
//         return {
//             id: card.id,
//             setId: card.setId,
//             number: card.number,
//             name: card.name,
//             set_code: card.set_code,
//             set_name: card.set_name,
//             slug: card.slug,
//             dupe_reward: dupeReward,
//             pack_point: packPoint,
//             rarity: rarity,
//             trade_cost: tradeCost,
//             image: `${card.id}.webp`,
//         };
//     });
    
    

//     // Write the cleaned data to a new JSON file
//     fs.writeFile('cleaned_test.json', JSON.stringify(cleanedData, null, 2), 'utf8', err => {
//         if (err) {
//             console.error('Error writing the file:', err);
//             return;
//         }
//         console.log('File has been cleaned and saved as cleaned_test.json');
//     });
// });


// Charger les fichiers JSON TRADUIT LE NOM DES POKEMONS
// const data1 = JSON.parse(fs.readFileSync('cards.json', 'utf8'));
// const translations = JSON.parse(fs.readFileSync('traduction.json', 'utf8'));

// // Mettre à jour chaque élément
// const updatedData = data1.map(pokemon => {
//     return {
//         ...pokemon,
//         name_fr: translations[pokemon.name] || pokemon.name // Si pas de traduction, garder le nom original
//     };
// });

// // Sauvegarder le fichier mis à jour
// fs.writeFileSync('updated_data.json', JSON.stringify(updatedData, null, 2), 'utf8');

// console.log('Mise à jour terminée !');



// // Charger les fichiers JSON TRADUIT LE NOM DES POKEMONS
// const data1 = JSON.parse(fs.readFileSync('cards.json', 'utf8'));
// // const translations = JSON.parse(fs.readFileSync('traduction.json', 'utf8'));

// // Mettre à jour chaque élément
// const updatedData = data1.map(pokemon => {
//     return {
//         ...pokemon,
//         // parse string to int dupe_reward and pack_point
//         dupe_reward: parseInt(pokemon.dupe_reward),
//         pack_point: parseInt(pokemon.pack_point),
//     };
// });

// // Sauvegarder le fichier mis à jour
// fs.writeFileSync('fr.json', JSON.stringify(updatedData, null, 2), 'utf8');

// console.log('Mise à jour terminée !');

// const data1 = JSON.parse(fs.readFileSync('cards.json', 'utf8'));
// // Mettre à jour les valeurs de set_name_fr et image_fr

// const updatedData = data1.map(pokemon => {
//     return {
//         ...pokemon,
//         en: {
//             ...pokemon.en,
//              "set_name": pokemon.setId === "PROMO" ? "Promo-A" : pokemon.en.set_name,
//         },
//         fr: {
//             ...pokemon.fr,
//             "set_name": pokemon.setId === "PROMO" ? "promo-a" : pokemon.en.set_name,
//             "image": pokemon.setId === "PROMO" ? `https://image.pokemonpocket.fr/promo-a/${pokemon.number}.png` : pokemon.fr.image
//         }
//     };
// });

// // Sauvegarder le fichier mis à jour
// fs.writeFileSync('cards.json', JSON.stringify(updatedData, null, 2), 'utf8');

// console.log('Transformation terminée !');

const data1 = JSON.parse(fs.readFileSync('cards.json', 'utf8'));

const updatedData = data1.map(pokemon => {
    return {
        ...pokemon,
        en: {
            ...pokemon.en,
            "image": `https://static.dotgg.gg/pokepocket/card/${pokemon.id}.webp`
        },
    };
}
);

// Sauvegarder le fichier mis à jour
fs.writeFileSync('cards.json', JSON.stringify(updatedData, null, 2), 'utf8');



// // Charger les fichiers JSON
// const frData = JSON.parse(fs.readFileSync('fr.json', 'utf8'));
// const cardsData = JSON.parse(fs.readFileSync('cards.json', 'utf8'));

// // Créer un dictionnaire pour un accès rapide aux traductions
// const translationMap = {};
// frData.forEach(entry => {
//     translationMap[entry.card_en] = entry.card_fr;
// });

// // Mettre à jour les noms français dans cards.json
// cardsData.forEach(card => {
//     if (translationMap[card.name_en]) {
//         card.name_fr = translationMap[card.name_en];
//     }
// });

// // Sauvegarder les modifications dans cards.json
// fs.writeFileSync('cards_test.json', JSON.stringify(cardsData, null, 2), 'utf8');

// console.log('Mise à jour terminée !');
