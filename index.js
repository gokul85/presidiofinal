const express = require('express');
const mongoose = require('mongoose');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

mongoose.connect("mongodb+srv://gokul:gokul@cluster0.f9yyrqa.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.use('/api/auth', require('./routes/auth').router);
app.use('/api/flights', require('./routes/flight'));


app.listen(5000, () => {
    console.log(`Server is running`);
});

