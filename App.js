// src/App.js

import 'bootstrap/dist/css/bootstrap.css';

import React, { Component, useState, useEffect } from 'react';

import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom';

import Modal from 'react-modal';

import { Table, Button } from 'reactstrap';

import { Header } from 'semantic-ui-react';
import Amplify, { Auth } from 'aws-amplify';
import aws_exports from './aws-exports';
// import "MyCustomSignUp.js";

import Iframe from 'react-iframe';

import { withAuthenticator } from 'aws-amplify-react';
Amplify.configure(aws_exports);

const customStyles = {
    content : {
        top                   : '50%',
        left                  : '50%',
        right                 : 'auto',
        bottom                : 'auto',
        marginRight           : '-50%',
        transform             : 'translate(-50%, -50%)'
    }
};

const Button2 = () => {
    const [clicked, setClicked] = useState(false);

    useEffect(() => {
        if (clicked) {
            // do something meaningful, Promises, if/else, whatever, and then
            window.open('https://securent.appspot.com/login', 'new');
        }
    });

    return (
        <button onClick={() => setClicked(true)}>Add Car</button>
);
};

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: '',
            modalIsOpen: false,
            carData: [],
        };

        this.popout = this.popout.bind(this);

        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }

    componentDidMount() {
        this.setUser();
        this.fetchData2();
    }

   /* fetchData2() {
        fetch('https://hacksc-backend-1555207106499.appspot.com/cars').then(response => {

            return response;

        }).then((data) => {
            return data.json();
        }).then(res => {
            this.setState({
                carData: res.data
            })
        });
    }
*/
    setUser() {
        Auth.currentAuthenticatedUser({
            bypassCache: false  // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
        }).then(user => {
            console.log(user.attributes.sub);
            this.setState({user: user.attributes.sub})
        })
            .catch(err => console.log(err));

    }

    popout() {
        this.setState({isPoppedOut: true});
    }

    openModal() {
        this.setState({modalIsOpen: true});
    }

    closeModal() {
        this.setState({modalIsOpen: false});
    }

    render() {
        return (
            <Router>
            <div align="center">
            <Link to="/" >Rent A Car</Link> | <Link to="/mycars">My Cars</Link> | <Link to="/profile">My Profile</Link>
        <p></p>

        <div align="center">
            <h2>Car Rental Platform</h2>

        <Table>
        <thead>
        <tr>
        <th>#</th>
        <th>Make</th>
        <th>Model</th>
        <th>Distance</th>
        </tr>
        </thead>
        <tbody>
        /*this.state.carData.map((dwellObj) => {
            return(
                <tr>
                <td className="text-center">{dwellObj['id']}</td>
                <td className="text-center">{dwellObj['make']} </td>
                <td className="text-center">{dwellObj['model']} </td>
                <td className="text-center">{dwellObj['distance']} </td>
                </tr>
            )
        })*/
        <tr>
        <td>1</td>
        <td>TESLA</td>
        <td>Model S</td>
        <td>45038.4</td>
        </tr>
        </tbody>
        </Table>
        </div>

        <Route exact path="/" component={RentACar} />
        <Route path="/mycars" component={MyCars} />
        <Route path="/profile" component={MyProfile} />
        </div>
        </Router>
    );


    }
}

function RentACar() {
    return (
        <div></div>
);
}

function MyCars() {
    return (
        <div>
        <h2>My Cars</h2>


    <Button2></Button2>

    </div>
);
}

function MyProfile() {
    return (
        <div>
        <h2>My Profile</h2>
    </div>
);
}


export default withAuthenticator(App, {includeGreetings: true});