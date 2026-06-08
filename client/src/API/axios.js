import axios from 'axios';

// Create a custom Axios instance pointing to our Node backend
const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

export default API;