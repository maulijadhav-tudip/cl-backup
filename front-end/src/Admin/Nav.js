import React, { Component } from "react";
import { LinkContainer } from "react-router-bootstrap";
import PropTypes from "prop-types";

class Nav extends Component {
  static propTypes = {
    role: PropTypes.string.isRequired,
    isAuthenticated: PropTypes.bool.isRequired
  };
  render() {
    if (this.props.isAuthenticated && this.props.role === "admin")
      return (
        <nav className="navbar is-header">
          <div className="navbar-menu">
            <div className="navbar-start">
              {this.props.mode === "request" ? (
                <React.Fragment>
                  <LinkContainer to="/requests">
                    <a className="navbar-item">Requests</a>
                  </LinkContainer>
                  <LinkContainer to="/hot">
                    <a className="navbar-item">Hot Environments</a>
                  </LinkContainer>
                </React.Fragment>
              ) : null}
              {this.props.mode === "class" ? (
                <React.Fragment>
                  <LinkContainer to="/classes">
                    <a className="navbar-item">Classes</a>
                  </LinkContainer>
                </React.Fragment>
              ) : null}

              <LinkContainer to="/users">
                <a className="navbar-item">Users</a>
              </LinkContainer>
              <LinkContainer to="/labs">
                <a className="navbar-item">Labs</a>
              </LinkContainer>
              <LinkContainer to="/white">
                <a className="navbar-item">Whitelist</a>
              </LinkContainer>
              <LinkContainer to="/black">
                <a className="navbar-item">Blacklist</a>
              </LinkContainer>
              <LinkContainer to="/settings">
                <a className="navbar-item">Settings</a>
              </LinkContainer>
              <LinkContainer to="/self-test">
                <a className="navbar-item">Self Test</a>
              </LinkContainer>
              <LinkContainer to="/test-template">
                <a className="navbar-item">Test Template</a>
              </LinkContainer>
            </div>
          </div>
        </nav>
      );
    if (this.props.isAuthenticated && this.props.role === "instructor")
      return (
        <nav className="navbar is-header">
          <div className="navbar-menu">
            <div className="navbar-start">
              {this.props.mode === "request" ? (
                <React.Fragment>
                  <LinkContainer to="/requests">
                    <a className="navbar-item">Requests</a>
                  </LinkContainer>
                </React.Fragment>
              ) : null}
              {this.props.mode === "class" ? (
                <React.Fragment>
                  <LinkContainer to="/classes">
                    <a className="navbar-item">Classes</a>
                  </LinkContainer>
                </React.Fragment>
              ) : null}

              <LinkContainer to="/users">
                <a className="navbar-item">Users</a>
              </LinkContainer>
            </div>
          </div>
        </nav>
      );
    else {
      return <div />;
    }
  }
}

export default Nav;
