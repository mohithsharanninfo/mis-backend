const express = require('express');
const cors = require('cors');
const client = require('./db'); //important
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
require('dotenv').config();

const app = express()
const port = process.env.PORT_NO || 9000

app.use(express.json())
app.use(cors({
    origin: ['http://localhost:3000','https://mis-frontend-eight.vercel.app','http://192.168.10.65:3000'],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
}))
app.use(cookieParser())

//app.use(bodyParser.json());

app.use('/api', require('./routes/index'))


app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})
