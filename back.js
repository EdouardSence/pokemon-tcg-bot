const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const postgres = require('postgres');
const cards = require('./assets/cards.json');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connexion à Supabase
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, { ssl: 'require' }); // SSL requis pour Supabase

// Middleware
app.use(express.json());
app.use(cors());


// Creer une fonction qui vérifie si l'utilisateur existe
async function checkUserExists(id) {
    const users = await sql`SELECT * FROM "user" WHERE id_discord = ${id}`;
    return users.length > 0;
}

async function getIdUserByDiscordId(id) {
    const users = await sql`SELECT id FROM "user" WHERE id_discord = ${id}`;
    return users[0].id;
}

// function who check if the card exists
async function checkCardExists(id) {
    // parcours cards et check si id existe
    for (let i = 0; i < cards.length; i++) {
        if (cards[i].id === id) {
            return true;
        }
    }
    return false;
}

// 🔹 Récupérer tous les utilisateurs
app.get('/users', async (req, res) => {
    try {
        const users = await sql`SELECT * FROM "user"`;
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔹 Ajouter un utilisateur besoin en parametre de id et de la langue
app.post('/users', async (req, res) => {
    const { id, langue } = req.body;
    langue = langue.toLowerCase();
    if (await checkUserExists(id)) { res.status(400).json({ error: 'Utilisateur déjà existant' }); return; }
    if (!id) { res.status(400).json({ error: "l'id est requis" }); return; }
    if (!langue) { res.status(400).json({ error: 'la langue est requise' }); return; }
    if(langue !== 'fr' && langue !== 'en') { res.status(400).json({ error: 'la langue doit être fr ou en' }); return; }

    try {
        const user = await sql`
            INSERT INTO "user" (id_discord, langue)
            VALUES (${id}, ${langue})
            RETURNING *`;
        res.status(201).json(user[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔹 Récupérer un utilisateur
app.get('/users/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        res.status(400).json({ error: "l'id est requis" });
        return;
    }

    try {
        // Exécution de la requête SQL
        const users = await sql`
            SELECT 
                u.id_discord, 
                u.langue,
                json_agg(DISTINCT gc.id_card) AS given_card,
                json_agg(DISTINCT rc.id_card) AS receive_card
            FROM 
                "user" u
            LEFT JOIN 
                given_card gc ON u.id = gc.id_user
            LEFT JOIN 
                receive_card rc ON u.id = rc.id_user
            WHERE 
                u.id_discord = ${id} 
            GROUP BY 
                u.id_discord, u.langue;
        `;

        // Vérification si l'utilisateur existe
        if (users.length === 0) {
            res.status(404).json({ error: 'Utilisateur non trouvé' });
            return;
        }

        // Renvoi des résultats sous le format JSON attendu
        var user = {
            id_discord: users[0].id_discord,
            langue: users[0].langue,
            given_card: users[0].given_card[0] === null ? [] : users[0].given_card,
            receive_card: users[0].receive_card[0] === null ? [] : users[0].receive_card
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔹 Ajouter une given_card à un utilisateur. il faut en parametres l'id de la carte et l'id discord
// on peut avoir une quantite, si celle-ci n'est pas renseignée, elle est à 1
app.post('/users/:id/given_card/:id_card', async (req, res) => {
    const { id,id_card } = req.params;
    const { amount } = req.body;

    if (!id) { res.status(400).json({ error: "l'id est requis" }); return; }
    if (!id_card) { res.status(400).json({ error: 'l\'id de la carte est requis' }); return; }

    let id_bd = await getIdUserByDiscordId(id);
    if (!id_bd) { res.status(404).json({ error: 'Utilisateur non trouvé' }); return; }

    console.log(checkCardExists(id_card))
    if ( !await checkCardExists(id_card)) { res.status(404).json({ error: 'Carte non trouvée' }); return; }
    
    try {
        const user = await sql`
            INSERT INTO given_card (id_user, id_card ${amount ? ', amount' : ''})
            VALUES (${id_bd}, ${id_card} ${amount ? `, ${amount}` : ''})
            RETURNING *`;
        res.status(201).json(user[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
);


// 🔹 Ajouter une receive_card à un utilisateur. il faut en parametres l'id de la carte et l'id discord
// on peut avoir une quantite, si celle-ci n'est pas renseignée, elle est à 1
app.post('/users/:id/receive_card/:id_card', async (req, res) => {
    const { id,id_card } = req.params;
    const { amount } = req.body;

    if (!id) { res.status(400).json({ error: "l'id est requis" }); return; }
    if (!id_card) { res.status(400).json({ error: 'l\'id de la carte est requis' }); return; }

    let id_bd = await getIdUserByDiscordId(id);
    if (!id_bd) { res.status(404).json({ error: 'Utilisateur non trouvé' }); return; }

    console.log(checkCardExists(id_card))
    if ( !await checkCardExists(id_card)) { res.status(404).json({ error: 'Carte non trouvée' }); return; }
    
    try {
        const user = await sql`
            INSERT INTO receive_card (id_user, id_card ${amount ? ', amount' : ''})
            VALUES (${id_bd}, ${id_card} ${amount ? `, ${amount}` : ''})
            RETURNING *`;
        res.status(201).json(user[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
);


// Lancer le serveur
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
