const fs = require("fs");
const axios = require("axios");
const listeExtensions = require("./listeExtensions.json");
// -------------- TRIE DU JSON  ----------------
// function qui supprime cleaned_test.json et jsonFR et compare.json si ils existent
function deleteFiles() {
  const filesToDelete = ["cleaned_test.json", "jsonFR.json", "compare.json"];
  filesToDelete.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Deleted ${file}`);
    } else {
      console.log(`${file} does not exist`);
    }
  });
}

// TODO LE VEILLE AMBRE A SET_NAME NULL PENSER A LE REMETTRE

//  ETAPE 1 : QUAND NOUVELLE EXTESNION, FAIRE CE CODE
async function ETAPE1() {
  try {
    const response = await axios.get(
      "https://api.dotgg.gg/cgfw/getcards?game=pokepocket&mode=indexed&cache=192"
    );
    const jsonData = response.data;

    const cleanedData = jsonData.data.map((card) => {
      const dupeReward = Array.isArray(card[23])
        ? card[23].find((prop) => prop.name === "Dupe Reward")?.value ?? null
        : null;

      const packPoint = Array.isArray(card[23])
        ? card[23].find((prop) => prop.name === "Pack Point")?.value ?? null
        : null;

      // transforme les strings comme 1,200 en int 1200
      function parsePackPoint(value) {
        if (typeof value === "string") {
          // Supprime les virgules et convertit en entier
          return parseInt(value.replace(/,/g, ""), 10);
        }
        return value;
      }

      const rarity = rarityMap[parsePackPoint(packPoint)] ?? null; // Définit null si packPoint n'est pas dans la liste

      const tradeCost = tradeCostMap[rarity] ?? null; // Définit null si la rareté n'est pas dans la liste

      return {
        id: card[0],
        setId: card[1],
        dupe_reward: parsePackPoint(dupeReward),
        pack_point: parsePackPoint(packPoint),
        rarity: rarity,
        trade_cost: tradeCost,
        isTradable: null,
        en: {
          name: card[3],
          set_name: card[5] === null ? "Mythical Island" : card[5],
          image: `https://static.dotgg.gg/pokepocket/card/${card[0]}.webp`,
          fullName: card[3] + " " + card[0],
        },
        fr: {
          name: null,
          set_name: null,
          image: null,
          fullName: null,
        },
        number: parseInt(card[2]),
      };
    });

    // Write the cleaned data to a new JSON file
    await fs.promises.writeFile(
      "cleaned_test.json",
      JSON.stringify(cleanedData, null, 2),
      "utf8"
    );
    console.log("File has been cleaned and saved as cleaned_test.json");
  } catch (error) {
    console.error("Error fetching the data:", error);
  }
}

// // ETAPE 2 : le json fr est fatigue faut jle repare

// JSON FRANCAIS curl -X GET "https://phawpbusbqwdlbxaedev.supabase.co/rest/v1/cards?select=*" -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoYXdwYnVzYnF3ZGxieGFlZGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ1OTEsImV4cCI6MjA1MDU1MDU5MX0.pY-Zi1AoEuHHNgGB1yPuqy4cyA6vy57W4VSYrar0SiQ" -H "Accept: application/json"

async function ETAPE2() {
  // function with a int param, and return the same in string BUT with 0 in front like 1 -> 001, 10 -> 010, 100 -> 100
  function formatNumber(number) {
    return number.toString().padStart(3, "0");
  }

  let data = [];
  try {
    const response = await axios.get(
      "https://phawpbusbqwdlbxaedev.supabase.co/rest/v1/cards?select=*",
      {
        headers: {
          apikey:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoYXdwYnVzYnF3ZGxieGFlZGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ1OTEsImV4cCI6MjA1MDU1MDU5MX0.pY-Zi1AoEuHHNgGB1yPuqy4cyA6vy57W4VSYrar0SiQ",
        },
      }
    );
    data = response.data;
  } catch (error) {
    console.error("Error fetching the data:", error);
    throw error;
  }

  const updatedData = data.map((card) => {
    const setId = extensionFRBySetId[card.set];
    return {
      ...card,
      pokemonID: setId + "-" + formatNumber(card.card_id),
    };
  });
  // Write the cleaned data to a new JSON file
  await fs.promises.writeFile(
    "jsonFR.json",
    JSON.stringify(updatedData, null, 2),
    "utf8",
    (err) => {
      if (err) {
        console.error("Error writing the file:", err);
        return;
      }
      console.log("File has been cleaned and saved as jsonFR.json");
    }
  );
}

// ETAPE 3 RAJOUTER LES NOMS FR + on ajoute les raretés manquantes

async function ETAPE3() {
  const data = JSON.parse(fs.readFileSync("cleaned_test.json", "utf8"));
  const dataFR = JSON.parse(fs.readFileSync("./jsonFR.json", "utf8"));

  // pour chaque element de data, regarder si il y a le meme id dabs dataFR ET SI OUI, rajouter les fr: {name, set_name, image, fullName}
  var updatedData = data.map((pokemon) => {
    const matchingCard = dataFR.find((card) => card.pokemonID === pokemon.id);
    if (matchingCard) {
      var rarity =
        pokemon.rarity === null
          ? mapRaritySymbol[matchingCard.rarity]
          : pokemon.rarity;
      var packPoint =
        pokemon.pack_point === 0 || pokemon.pack_point === null
          ? packPointMap[rarity]
          : pokemon.pack_point;
      var tradeCost =
        pokemon.trade_cost === 0 || pokemon.trade_cost === null
          ? tradeCostMap[rarity]
          : pokemon.trade_cost;
      return {
        ...pokemon,
        rarity: rarity,
        pack_point: packPoint,
        trade_cost: tradeCost,
        raritySymbol: matchingCard.rarity,
        fr: {
          name: matchingCard.card_fr,
          set_name: matchingCard.set,
          image: `https://image.pokemonpocket.fr/${matchingCard.set}/${
            pokemon.number
          }.${
            matchingCard.set === "lumiere-triomphale" ||
            "rejouissances-rayonnantes"
              ? "webp"
              : "png"
          }`,
          fullName: matchingCard.card_fr + " " + pokemon.id,
        },
      };
    }
    return pokemon;
  });

  await fs.promises.writeFile(
    "cleaned_test.json",
    JSON.stringify(updatedData, null, 2),
    "utf8",
    (err) => {
      if (err) {
        console.error("Error writing the file:", err);
        return;
      }
      console.log("File has been cleaned and saved as cards.json");
    }
  );
}

// QUELLE EXTENSION ET CARTE PEUVENT ETRE TRADE
async function ETAPE4() {
  const data1 = JSON.parse(fs.readFileSync("cleaned_test.json", "utf8"));
  var updatedData = data1.map((pokemon) => {
    return {
      ...pokemon,
      isTradable:
        pokemon.rarity === null ||
        pokemon.rarity >= 6 ||
        !listeExtensions[pokemon.setId]?.isTradable
          ? false
          : true,
    };
  });

  // Sauvegarder le fichier mis à jour
  await fs.promises.writeFile(
    "cleaned_test.json",
    JSON.stringify(updatedData, null, 2),
    "utf8"
  );

  console.log("Transformation terminée !");
}

// CREER UN FICHIER JSON QUI COMPARE cards.json et cleaned_test.json. Ce json doit avoir 3 objets : nouveau, modifie, supprime.
// Le fichier cleaned_test.json est la version la plus recente et cards.json est l'ancienne version

async function ETAPE5() {
  const data1 = JSON.parse(fs.readFileSync("cleaned_test.json", "utf8"));
  const data2 = JSON.parse(fs.readFileSync("cards.json", "utf8"));

  const newCards = data1.filter(
    (card1) => !data2.some((card2) => card1.id === card2.id)
  );

  const modifiedCards = data1
    .filter((card1) => {
      const card2 = data2.find((card2) => card1.id === card2.id);
      return card2 && JSON.stringify(card1) !== JSON.stringify(card2);
    })
    .map((card1) => {
      const card2 = data2.find((card2) => card1.id === card2.id);
      const changes = {};
      for (const key in card1) {
        if (JSON.stringify(card1[key]) !== JSON.stringify(card2[key])) {
          changes[key] = { old: card2[key], new: card1[key] };
        }
      }
      return { id: card1.id, changes };
    });

  const deletedCards = data2.filter(
    (card2) => !data1.some((card1) => card1.id === card2.id)
  );

  const result = {
    new: newCards,
    modified: modifiedCards,
    deleted: deletedCards,
  };

  await fs.promises.writeFile(
    "compare.json",
    JSON.stringify(result, null, 2),
    "utf8"
  );
}

// remplacer le contenu de cards.json par le contenu de cleaned_test.json puis suppimer cleaned_test.json
async function ETAPE6() {
  fs.copyFile("cleaned_test.json", "cards.json", (err) => {
    if (err) throw err;
    console.log("cards.json was updated with cleaned_test.json");
  });
  deleteFiles();
}

(async function main() {
  await ETAPE1();
  await ETAPE2();
  await ETAPE3();
  await ETAPE4();
  await ETAPE5();
  await ETAPE6();
})();

// QUAND on est sur que tout est bon on peut faire ETAPE6


// deleteFiles();

// GENERE LA LISTE DES EXTENSIONS UNIQUES
// const dataEN = JSON.parse(fs.readFileSync('./cleaned_test.json', 'utf8'));

// // Utiliser un objet pour filtrer les extensions uniques
// const extensionsMap = {};

// dataEN.forEach(item => {
//     if (!extensionsMap[item.setId]) {
//         extensionsMap[item.setId] = {
//             extension_id: item.setId,
//             extension_en: item.en.set_name,
//             extension_fr: item.fr.set_name,
//             isTradable: null
//         };
//     }
// });

// // Écrire dans un fichier JSON
// fs.writeFileSync('listeExtensions.json', JSON.stringify(extensionsMap , null, 2), 'utf8', (err) => {
//     if (err) {
//         console.error('Error writing the file:', err);
//         return;
//     }
//     console.log('File has been cleaned and saved as listeExtensions.json');
// });

// ------------------------- FUNCTION CONSTANTES -------------------------
var extensionFRBySetId = {
  A1: "puissance-genetique",
  A1a: "l-ile-fabuleuse",
  A2: "choc-spatio-temporel",
  A2a: "lumiere-triomphale",
  A2b: "rejouissances-rayonnantes",
  "promo-a": "promo-a",
};

var mapRaritySymbol2 = {
  1: "♢",
  2: "♢♢",
  3: "♢♢♢",
  4: "♢♢♢♢",
  5: "☆",
  6: "☆☆",
  7: "☆☆☆",
  8: "✧",
  9: "✧✧",
  10: "♛",
  null: "-",
};

var mapRaritySymbol = {
  "♢": 1,
  "♢♢": 2,
  "♢♢♢": 3,
  "♢♢♢♢": 4,
  "☆": 5,
  "☆☆": 6,
  "☆☆☆": 7,
  "✧": 8,
  "✧✧": 9,
  "♛": 10,
  "-": null,
};

// Détermine le coût d'échange en fonction de la rareté
var tradeCostMap = {
  1: 0,
  2: 0,
  3: 120,
  4: 500,
  5: 400,
  6: 0,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
  null: 0,
};

// Détermine la rareté en fonction de packPoint
const rarityMap = {
  35: 1,
  70: 2,
  150: 3,
  500: 4,
  400: 5,
  1250: 6,
  1500: 7,
  1000: 8,
  1350: 9,
  2500: 10,
};

// Determine les packPoint en fonction de la rareté
const packPointMap = {
  1: 35,
  2: 70,
  3: 150,
  4: 500,
  5: 400,
  6: 1250,
  7: 1500,
  8: 1000,
  9: 1350,
  10: 2500,
};

var extensionFRBySetId = {
  "puissance-genetique": "A1",
  "l-ile-fabuleuse": "A1a",
  "choc-spatio-temporel": "A2",
  "lumiere-triomphale": "A2a",
  "rejouissances-rayonnantes": "A2b",
  "promo-a": "PROMO",
};
