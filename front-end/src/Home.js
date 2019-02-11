import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import PropTypes from "prop-types";

import Request from "./Request";
import Student from "./Student/Student";
import ClassLogin from "./ClassLogin";

class Home extends Component {
  static propTypes = {
    welcome: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    mode: PropTypes.string.isRequired,
    isAuthenticated: PropTypes.bool.isRequired,
    logoutUser: PropTypes.func.isRequired,
    login: PropTypes.func.isRequired,
    userquestions: PropTypes.bool.isRequired,
    seat: PropTypes.bool.isRequired
  };
  render() {
    if (!this.props.isAuthenticated) {
      if (this.props.mode === "request")
        return (
          <div>
            <Request
              welcome={this.props.welcome}
              userquestions={this.props.userquestions}
              seat={this.props.seat}
            />
          </div>
        );
      else if (this.props.mode === "class")
        return (
          <ClassLogin
            login={this.props.login.bind(this)}
            welcome={this.props.welcome}
            userquestions={this.props.userquestions}
          />
        );
    } else if (this.props.role === "student")
      return (
        <div>
          <Student />
        </div>
      );
    else {
      if (this.props.mode === "request")
        return (
          <Redirect
            to={{
              pathname: "/requests"
            }}
          />
        );
      else if (this.props.mode === "class")
        return (
          <Redirect
            to={{
              pathname: "/classes"
            }}
          />
        );
    }
  }
}

export default Home;
