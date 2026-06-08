import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import generateRoutes from './routes/generate.js'; // alias

const app = express();
const PORT = process.env.PORT || 5000;

dotenv.config();

app.use(cors());
app.use(express.json());

app.use('/api/generate', generateRoutes);

app.get('/api/status', async (req, res) => {
    try {
        res.json({ message: "AI backend is running securely " })
    } catch (error) {
        console.error(error);
        res.json({ message: "error in running", error });
    }
})

app.listen(PORT, () => {
    console.log(`Server is running securely on http://localhost:${PORT}`);
});