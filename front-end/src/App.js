import React, { Component } from "react";
import { Route } from "react-router-dom";
import base64 from "base-64";

import "./App.css";
import "./SelfTest.css";

import Login from "./Login";
import Home from "./Home";
import Users from "./Admin/Users";
import Labs from "./Admin/Labs";
import Nav from "./Admin/Nav";
import Header from "./Utils/Header";
import Lab from "./Admin/Lab";
import User from "./Admin/User";
import Requests from "./Admin/Requests";
import HotEnvironments from "./Admin/HotEnvironments";
import HotEnvironment from "./Admin/HotEnvironment";
import Settings from "./Admin/Settings";
import Classes from "./Admin/Classes";
import PrivateRoute from "./Utils/PrivateRoute";
import InstructorRoute from "./Utils/InstructorRoute";
import ClassPage from "./Admin/ClassPage";
import Whitelist from "./Admin/Whitelist";
import Blacklist from "./Admin/Blacklist";
import SelfTest from "./Admin/SelfTest";
import TestTemplate from "./Admin/TestTemplate";
import TestTemplateFrom from "./Admin/TestTemplateForm";

class App extends Component {
  constructor() {
    super();
    this.state = {
      isAuthenticated: null,
      role: null,
      mode: null,
      title: null,
      logo: null,
      userquestions: null,
      seat: null,
      welcome: null,
      modeLoading: false,
      titleLoading: false,
      userLoading: false,
      seatLoading: false,
      userquestionsLoading: false
    };
  }
  componentWillMount() {
    fetch("/api/mode", {
      method: "GET"
    })
      .then(
        function(response) {
          if (response.status === 200) {
            response.json().then(
              function(data) {
                this.setState({ mode: data, modeLoading: true });
              }.bind(this)
            );
          } else {
            this.logoutUser();
          }
        }.bind(this)
      )
      .catch(function(ex) {
        console.log(ex);
      });

    fetch("/api/userquestions", {
      method: "GET"
    })
      .then(
        function(response) {
          if (response.status === 200) {
            response.json().then(
              function(data) {
                this.setState({
                  userquestions: data,
                  userquestionsLoading: true
                });
              }.bind(this)
            );
          } else {
            this.logoutUser();
          }
        }.bind(this)
      )
      .catch(function(ex) {
        console.log(ex);
      });

    fetch("/api/seat", {
      method: "GET"
    })
      .then(
        function(response) {
          if (response.status === 200) {
            response.json().then(
              function(data) {
                this.setState({
                  seat: data,
                  seatLoading: true
                });
              }.bind(this)
            );
          } else {
            this.logoutUser();
          }
        }.bind(this)
      )
      .catch(function(ex) {
        console.log(ex);
      });

    fetch("/api/title", {
      method: "GET"
    })
      .then(
        function(response) {
          if (response.status === 200) {
            response.json().then(
              function(data) {
                this.setState({
                  title: data["title"],
                  welcome: data["welcome"],
                  logo: data["logo"],
                  titleLoading: true
                });
              }.bind(this)
            );
          } else {
            this.logoutUser();
          }
        }.bind(this)
      )
      .catch(function(ex) {
        console.log(ex);
      });

    if (window.localStorage.getItem("authToken")) {
      this.setState({ userLoading: false, isAuthenticated: true });
      let headers = new Headers();
      headers.append(
        "Authorization",
        "Basic " +
          base64.encode(window.localStorage.getItem("authToken") + ":x")
      );

      fetch("/api/user", {
        method: "GET",
        headers: headers
      })
        .then(
          function(response) {
            if (response.status === 200) {
              response.json().then(
                function(data) {
                  this.setState({ userLoading: true, role: data.role });
                }.bind(this)
              );
            } else {
              this.logoutUser();
            }
          }.bind(this)
        )
        .catch(function(ex) {
          console.log(ex);
        });
    } else {
      this.setState({ userLoading: true, role: "", isAuthenticated: false });
    }
  }

  logoutUser() {
    window.localStorage.clear();
    this.setState({ isAuthenticated: false });
  }

  loginUser(token, role) {
    window.localStorage.setItem("authToken", token);
    window.localStorage.setItem("role", role);
    this.setState({ userLoading: true, isAuthenticated: true, role: role });
  }

  render() {
    if (
      this.state.userLoading &&
      this.state.modeLoading &&
      this.state.titleLoading &&
      this.state.userquestionsLoading &&
      this.state.seatLoading
    )
      return (
        <div>
          <Header
            logoutUser={this.logoutUser.bind(this)}
            isAuthenticated={this.state.isAuthenticated}
            logo={this.state.logo}
            title={this.state.title}
          />
          <Nav
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            mode={this.state.mode}
          />
          <Route
            exact
            path="/"
            render={props => (
              <Home
                isAuthenticated={this.state.isAuthenticated}
                role={this.state.role}
                mode={this.state.mode}
                logoutUser={this.logoutUser.bind(this)}
                welcome={this.state.welcome}
                login={this.loginUser.bind(this)}
                userquestions={this.state.userquestions}
                seat={this.state.seat}
              />
            )}
          />
          <PrivateRoute
            exact
            path="/settings"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={Settings}
          />
          <PrivateRoute
            exact
            path="/classes"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={Classes}
          />
          <PrivateRoute
            path="/class/:id"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={ClassPage}
          />
          <PrivateRoute
            exact
            path="/class"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={ClassPage}
          />
          <InstructorRoute
            exact
            path="/users"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            seat={this.state.seat}
            component={Users}
          />
          <PrivateRoute
            exact
            path="/users/:email"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={User}
          />
          <InstructorRoute
            exact
            path="/requests"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={Requests}
          />
          <PrivateRoute
            exact
            path="/labs"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={Labs}
          />

          <PrivateRoute
            exact
            path="/hot"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={HotEnvironments}
          />
          <PrivateRoute
            exact
            path="/hot/new"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={HotEnvironment}
          />
          <PrivateRoute
            exact
            path="/lab/ravello"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={Lab}
            new={true}
            type={"ravello"}
          />
          <PrivateRoute
            exact
            path="/lab/cloudshare"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={Lab}
            new={true}
            type={"cloudshare"}
          />
          <PrivateRoute
            exact
            path="/lab/azure"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={Lab}
            new={true}
            type={"azure"}
          />
          <PrivateRoute
            exact
            path="/lab/qwiklab"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={Lab}
            new={true}
            type={"qwiklab"}
          />
          <PrivateRoute
            exact
            path="/lab/custom"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={Lab}
            new={true}
            type={"custom"}
          />
          <PrivateRoute
            exact
            path="/lab/:id([0-9a-fA-f]{24})"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={Lab}
            new={false}
          />

          <PrivateRoute
            exact
            path="/lab"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={Lab}
          />
          <PrivateRoute
            exact
            path="/white"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={Whitelist}
          />
          <PrivateRoute
            exact
            path="/black"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={Blacklist}
          />
          <PrivateRoute
            exact
            path="/self-test"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={SelfTest}
          />
            <PrivateRoute
            exact
            path="/test-template"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={TestTemplate}
          />
          <PrivateRoute
            exact
            path="/edit-test-template/:name"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={TestTemplateFrom}
            new={false}
          />
          <PrivateRoute
            exact
            path="/new-test-template"
            isAuthenticated={this.state.isAuthenticated}
            role={this.state.role}
            component={TestTemplateFrom}
            type={"new template"}
          />
          <Route
            path="/login"
            render={props => (
              <Login
                {...props}
                login={this.loginUser.bind(this)}
                welcome={this.state.welcome}
                userquestions={this.state.userquestions}
              />
            )}
          />
        </div>
      );
    else {
      return <div />;
    }
  }
}

export default App;
