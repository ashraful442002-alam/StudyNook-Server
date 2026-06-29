const express = require('express');
const app = express();
const port = process.env.PORT || 5000;



// midlle ware
const cors = require("cors");
app.use(
    cors({
        origin:"http://localhost:5173",
        credentials:true,
    })
)
app.use(express.json())

// cookieParser
const cookieParser = require("cookie-parser");
app.use(cookieParser())




app.get('/', (req, res) => {
  res.send('Hello Server');
});

app.listen(port, () => {
  console.log(`StudyNook server app listening on port ${port}`);
});