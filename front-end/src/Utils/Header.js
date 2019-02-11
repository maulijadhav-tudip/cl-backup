import React, { Component } from "react";
import { LinkContainer } from "react-router-bootstrap";
import AuthButton from "./AuthButton";
import PropTypes from "prop-types";

class Header extends Component {
  static propTypes = {
    logoutUser: PropTypes.func.isRequired,
    isAuthenticated: PropTypes.bool.isRequired,
    logo: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  };
  render() {
    return (
      <nav className="navbar is-header">
        <LinkContainer to="/">
          <div className="navbar-brand">
            <a className="navbar-item">
              <img alt="" src={this.props.logo} />
            </a>
            <a className="navbar-item">{this.props.title}</a>
          </div>
        </LinkContainer>
        <div className="navbar-menu">
          <div className="navbar-start" />
          <div className="navbar-end">
            <div className="navbar-item  is-right">
              <AuthButton
                logoutUser={this.props.logoutUser.bind(this)}
                isAuthenticated={this.props.isAuthenticated}
              />
            </div>
          </div>
        </div>
      </nav>
    );
  }
}

export default Header;
