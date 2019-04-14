'use strict';


const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const smartcar = require('smartcar');
var mysql = require('mysql');

const port = process.env.PORT || 8080;

app.set('trust proxy');
//app.use(bodyParser.json());

//TODO do export in another file instead
const authData = {
    clientId: '96907e36-d6af-44e6-8aef-0c7b718e247e',
    clientSecret: '3b2eb38b-b270-4ba7-af52-16490b73deef',
    redirectUri: 'https://securent.appspot.com/callback',
    scope: [
        'read_vehicle_info',
        'control_security',
        'control_security:unlock',
        'control_security:lock',
        'read_location',
        'read_odometer'
    ],
    testMode: true, // launch the Smartcar auth flow in test mode
};
const mysqlConfig = {
    host: "hsct1-mysqldb.ckdvpb3pnscg.us-east-1.rds.amazonaws.com",
    port: 3306,
    user: "hscadmin",
    password: "123qwert",
    database: "hacksc",
    timeout: 60000
};

const client = new smartcar.AuthClient(authData);
var sub = 'hi';


app.get('/', (req, res) => {
    res.send('<h1>Hello, World<h1>');
});

//TODO parse sub of the client
// Redirect to Smartcar's authentication flow
app.get('/login', function(req, res) {
    //sub = req.body.sub;
    const link = client.getAuthUrl();
    // redirect to the link
    res.redirect(link);
});


// Handle Smartcar callback with auth code
app.get('/callback', async function(req, res, next) {

    let access;

    console.log('hi!');

    if (req.query.error) {
        // the user denied your requested permissions
        return next(new Error(req.query.error));
    }                         //didn't grant permissions

    // exchange auth code for access token
    return await client.exchangeCode(req.query.code)

        .then(function(_access) {
            // in a production app you'll want to store this in some kind of persistent storage
            access = _access;
            // get the user's vehicles
            return smartcar.getVehicleIds(access.accessToken);

        })        //access token

        .then(async (res) => {

            // instantiate first vehicle in vehicle list

            let vehicles = [];

            for (let i = 0; i < res.vehicles.length; i++) {

                let car = await new smartcar.Vehicle(res.vehicles[i], access.accessToken);

                vehicles.push(car);

            }

            return vehicles;

            // get identifying information about a vehicle

        })           //get ids

        .then(async function(ids) {


            let result = [];

            for (let i = 0; i < ids.length; i++) {

                let location = await ids[i].location();
                let info = await ids[i].info();
                let {data: {distance}} = await ids[i].odometer();

                result.push(Object.assign({}, {"distance": distance}, info, location));

            }

            console.log(result);

            return result;

        })      //get infos

        .then(async function(data) {    //log into db

                let con = await mysql.createConnection(mysqlConfig);
                await con.connect(function(err) {
                    if (err) {
                        throw err;
                    }
                    console.log("Connected");
                });

                for (var i = 0; i < data.length; i++) {

                    var sql = 'INSERT INTO cars(id, sub, year, make, model, lat, lon, distance, age) VALUES(' + `'${data[i].id}', NULL/*'${sub}'*/, '${data[i].year}', '${data[i].make}', '${data[i].model}', '${data[i].data.latitude}', '${data[i].data.longitude}', '${data[i].distance}', '${data[i].age}');`;
                    //TODO fix sub!

                    console.log(sql);

                    await con.query(sql, function (err, result) {
                        if (err) {
                            throw err;
                        }

                        console.log("Result: " + result);

                    });

                }

                con.end();

            res.send('You have successfully added your vehicle(s) to our system! ');


            //assign to specific user*/



        });    //log to db



    // TODO refresh Token ??

});

app.get('/map', async function (req, res) {

   res.write("\n" +
       "\n" +
       "<div id=\"map\"></div>\n" +
       "\n" +
       "/* Always set the map height explicitly to define the size of the div\n" +
       "* element that contains the map. */\n" +
       "#map {\n" +
       "height: 100%;\n" +
       "}\n" +
       "/* Optional: Makes the sample page fill the window. */\n" +
       "html, body {\n" +
       "height: 100%;\n" +
       "margin: 0;\n" +
       "padding: 0;\n" +
       "}\n" +
       "\n" +
       "<!-- Replace the value of the key parameter with your own API key. -->\n" +
       "<script src=\"https://maps.googleapis.com/maps/api/js?key=AIzaSyCkUOdZ5y7hMm0yrcCQoCvLwzdM6M8s5qk&callback=initMap\" async defer></script>\n" +
       "\n" +
       "<!DOCTYPE html>\n" +
       "<html>\n" +
       "<head>\n" +
       "    <title>Simple Map</title>\n" +
       "    <meta name=\"viewport\" content=\"initial-scale=1.0\">\n" +
       "    <meta charset=\"utf-8\">\n" +
       "    <style>\n" +
       "        /* Always set the map height explicitly to define the size of the div\n" +
       "         * element that contains the map. */\n" +
       "        #map {\n" +
       "            height: 100%;\n" +
       "        }\n" +
       "        /* Optional: Makes the sample page fill the window. */\n" +
       "        html, body {\n" +
       "            height: 100%;\n" +
       "            margin: 0;\n" +
       "            padding: 0;\n" +
       "        }\n" +
       "    </style>\n" +
       "</head>\n" +
       "<body>\n" +
       "<div id=\"map\"></div>\n" +
       "<script>\n" +
       "    var map;\n" +
       "    async function initMap() {\n" +
       "        map = new google.maps.Map(document.getElementById('map'), {\n" +
       "            center: {lat:  39.067981, lng: -105.680725 },\n" +
       "            zoom: 8\n" +
       "        });\n" +
       "\n" +
       "        const url = 'https://hacksc-backend-1555207106499.appspot.com/cars';        //api endpoint\n" +
       "\n" +
       "        const data = await fetch(url).then((data) => {return data.json()}).then((res) => {return res});\n" +
       "\n" +
       "        console.log(data);\n" +
       "\n" +
       "        for (var i = 0; i < data.length; i++) {\n" +
       "            let marker = await new google.maps.Marker({\n" +
       "                position: {\n" +
       "                    \"lat\": data[i].lat,\n" +
       "                    \"lng\": data[i].lon\n" +
       "                },\n" +
       "                map: map,\n" +
       "                title: (data[i].make + \" \" + data[i].model).toString()\n" +
       "            });\n" +
       "\n" +
       "            await marker.setMap(map);\n" +
       "        }\n" +
       "\n" +
       "\n" +
       "    }\n" +
       "</script>\n" +
       "<script src=\"https://maps.googleapis.com/maps/api/js?key=AIzaSyAcx68ZlwaS0aWEWiW9mi-GMRkqjeEsNSg&callback=initMap\"\n" +
       "        async defer></script>\n" +
       "</body>\n" +
       "</html>");

        res.end();

});

app.listen(port, () => console.log(`Listening on port ${port}`));