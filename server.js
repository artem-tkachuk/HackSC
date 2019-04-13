'use strict';

const smartcar = require('smartcar');
const express = require('express');

const app = express();

const port = 4000;

const authData = {
    clientId: '96907e36-d6af-44e6-8aef-0c7b718e247e',
    clientSecret: '3b2eb38b-b270-4ba7-af52-16490b73deef',
    redirectUri: 'http://localhost:4000/callback',//'https://securent.appspot.com/callback',
    scope: [
        'read_vehicle_info',
        'control_security',
        'control_security:unlock',
        'control_security:lock',
        'read_location',
        'read_odometer'
    ],
    testMode: true, // launch the Smartcar auth flow in test mode
};  //TODO do export in another file instead

const client = new smartcar.AuthClient(authData);

// Redirect to Smartcar's authentication flow
app.get('/login', function(req, res) {
    const link = client.getAuthUrl();
    // redirect to the link
    res.redirect(link);
});

// Handle Smartcar callback with auth code
app.get('/callback', function(req, res, next) {

    let access;

    if (req.query.error) {
        // the user denied your requested permissions
        return next(new Error(req.query.error));
    }                         //didn't grant permissions

    // exchange auth code for access token
    return client.exchangeCode(req.query.code)

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

            let odometer;
            let result = [];

            for (let i = 0; i < ids.length; i++) {

                odometer = await ids[i].odometer();
                let location = await ids[i].location();
                let info = await ids[i].info();

                result.push(Object.assign({}, odometer, location, info));

            }

            console.log(result);

            return result;

        })      //get infos

        .then(function(data) {

            //TODO upload to database / Firestore

            res.json(data);

        });

    // TODO refresh Token ??

});

app.listen(port, () => console.log(`Listening on port ${port}`));