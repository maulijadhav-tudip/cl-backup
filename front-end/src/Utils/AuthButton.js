import React, { Component } from "react";
import { LinkContainer } from "react-router-bootstrap";
import PropTypes from "prop-types";

class AuthButton extends Component {
  static propTypes = {
    logoutUser: PropTypes.func.isRequired
  };
  render() {
    return this.props.isAuthenticated === false ? (
      <LinkContainer to="/login">
        <a className="navbar-item">Admin Login</a>
      </LinkContainer>
    ) : (
      <a className="navbar-item" onClick={() => this.props.logoutUser()}>
        Logout
      </a>
    );
  }
}

export default AuthButton;
