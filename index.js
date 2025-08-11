import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
const PORT = 3001;

app.use(cors()); // Enable CORS for all origins
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Bitrix Handler – initial login
app.all('/bitrix-handler', (req, res) => {
    const authId = req.body.AUTH_ID || req.query.AUTH_ID || '';
    const domain = req.body.DOMAIN || req.query.DOMAIN || '';
    const userId = req.body.USER_ID || req.query.USER_ID || '';

    if (!authId || !domain) {
        return res.status(400).send('Missing required Bitrix data');
    }

    // Redirect to React frontend with Bitrix data
    const frontendUrl = 'https://f96254440c6f.ngrok-free.app'; // 🔁 Replace with your actual frontend ngrok URL

    const redirectUrl = `${frontendUrl}?auth_id=${authId}&domain=${domain}&user_id=${userId}`;
    console.log('Redirecting to:', redirectUrl);

    res.redirect(redirectUrl);
});

// API to get Bitrix Deals
app.get('/get-deals', async (req, res) => {
    const { auth_id, domain } = req.query;
    if (!auth_id || !domain) {
        return res.status(400).json({ error: 'Missing auth_id or domain' });
    }
    //get current user

    let url = `https://${domain}/rest/user.current`
    const accessToken = auth_id;
    const response = await axios.get(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    const currentUser = response.data;
    console.log('Current User:', currentUser);
    if (!currentUser) {
        return res.status(401).json({ error: 'Unauthorized' }); 
    }
    try {
        const bitrixUrl = `https://${domain}/rest/crm.deal.list?auth=${auth_id}`;
        let data = {
            filter: {
                'ASSIGNED_BY_ID': currentUser.result.ID, // Use current user's ID
            },
            select: ['ID', 'TITLE', 'STAGE_ID', 'OPPORTUNITY','ASSIGNED_BY_ID'],
            order: { ID: 'DESC' },
        };
        const response = await axios.get(bitrixUrl, {
            params: data,
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching deals:', error.message);
        res.status(500).json({ error: 'Failed to fetch deals' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});
