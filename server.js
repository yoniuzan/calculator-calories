let express = require('express');

let app = express();

let port = process.env.PORT || 8080;

app.use(express.static(__dirname+'/dist/calculator-calories'));

app.get('/*', (req, resp) => {
    resp.sendFile(__dirname+'/dist/calculator-calories/index.html');
})

app.listen(port);