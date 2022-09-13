let express = require('express');

let app = express();

app.use(express.static(__dirname+'/dist/calculator-calories'));

app.get('/*', (req, resp) => {
    resp.sendFile(__dirname+'/dist/calculator-calories/index.html');
})

app.listen(process.env.PORT || 8080);