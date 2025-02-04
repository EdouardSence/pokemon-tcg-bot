const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const postgres = require('postgres');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connexion à Supabase
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, { ssl: 'require' }); // SSL requis pour Supabase

// Middleware
app.use(express.json());
app.use(cors());

// 🔹 Récupérer tous les utilisateurs
app.get('/users', async (req, res) => {
    try {
        const users = await sql`SELECT * FROM "User"`;
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
    
});

// 🔹 Ajouter un utilisateur
app.post('/users', async (req, res) => {
    const { nom } = req.body;
    const { data, error } = await supabase.from('User').insert([{ nom }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 🔹 Récupérer les cartes d'un utilisateur
app.get('/users/:id/cartes', async (req, res) => {
    const userId = req.params.id;
    const { data, error } = await supabase
        .from('carteDonner')
        .select('*')
        .eq('idUser', userId);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 🔹 Assigner une carte à un utilisateur
app.post('/users/:id/cartes', async (req, res) => {
    const userId = req.params.id;
    const { idCarteDonner } = req.body;

    const { data, error } = await supabase
        .from('carteDonner')
        .insert([{ idCarteDonner, idUser: userId }])
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Lancer le serveur
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
