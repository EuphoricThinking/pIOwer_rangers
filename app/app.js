const express = require('express');
const connection = require('./database/connection');
const bp = require('body-parser');

const port = 8000;
const app = express();
const db = connection.connection

app.set('view engine', 'pug');
app.set('views', 'views');
app.use(express.static('static'));

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

app.use((request, response, next) => {
    console.log(`Request recieved at ${new Date().toISOString()}`);
    next();
});

app.get('/substance', (request, response) => {
    const getSubstances = 'SELECT nazwa, id FROM Substancja ORDER BY nazwa';

    db.query(getSubstances, (err, result) => {
        if (err) {
            console.error('Substance query failed.');
            throw err;
        }

        const substances = [];
        result.forEach(element => {
            substances.push([element['nazwa'], element['id']]);
        });
        response.render('combo.pug', {substances: substances});
    });
});

app.post('/medicine' , (request, response) => {
    const substanceId = parseInt(request.body.dropDown);
    const getMedicine = `SELECT lek.nazwa, lek.zawartosc, lek.id
                            FROM Lek lek
                            JOIN Substancja sub
                            ON lek.substancja = sub.id WHERE sub.id = ?
                        ORDER BY lek.nazwa, lek.zawartosc`;
    
    db.query(getMedicine, substanceId, (err, result) => {
        if (err) {
            console.error('Medicine query failed.');
            throw err;
        }

        const medicine = [];
        result.forEach(record => {
            medicine.push([`${record['nazwa']} ${record['zawartosc']}`, record['id']]);
        });

        response.render('check.pug', {medicine: medicine});
    });
});

app.post('/prices', (request, response) => {
    const medicineIds = request.body;
    const commaIds = medicineIds instanceof Array ?
                     medicineIds.map(element => element).join(',') : medicineIds

    const getPrices = `SELECT lek.nazwa, lek.zawartosc, DATE_FORMAT(cena.dzien,'%m/%y') AS dzien, cena.wartosc 
                         FROM Lek lek JOIN Cena cena ON lek.id = cena.lek
                         WHERE lek.id IN ( ${commaIds} )
                       ORDER BY lek.nazwa, lek.zawartosc, cena.dzien`;

    db.query(getPrices, (err, result) => {
        if (err) {
            console.error('Prices query failed.');
            throw err;
        }

        const prices = [];
        result.forEach(record => {
            prices.push([`${record['nazwa']} ${record['zawartosc']}`, record['dzien'], record['wartosc']]);
        });

        response.send(JSON.stringify(prices));
    })
});

app.use('/',express.static('public'));

app.get('*', (request, response) => {
    console.log('The paths does not exist, redirecting to main page.');
    response.redirect('/substance');
})

module.exports = {port};
