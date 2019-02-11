import React, { Component } from "react";
import Select from "react-select";
import "react-select/dist/react-select.css";
import PropTypes from "prop-types";

class StudentRoles extends Component {
  static propTypes = {
    changeRole: PropTypes.func.isRequired,
    role: PropTypes.string.isRequired
  };
  constructor(props) {
    super(props);
    this.loadRoles = this.loadRoles.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      role: "",
      selected: 0,
      roles: []
    };
  }
  //This function loads the dates of the data sets
  loadRoles() {
    let roles = ["student", "admin", "instructor"];
    let index = roles.indexOf(this.props.role);
    if (index === -1) index = 0;
    this.setState({
      roles: roles,
      role: roles[index],
      selected: index
    });
    this.props.changeRole(roles[index]);
  }

  componentDidMount() {
    this.loadRoles();
  }

  //When a different date is selected, update the state to the selected date
  handleChange(e) {
    this.props.changeRole(this.state.roles[e.value]);

    this.setState({
      role: this.state.roles[e.value],
      selected: e.value
    });
  }

  render() {
    //Add all dates to the dropdown bar correctly formatted
    var options = [];
    for (var j = 0; j < this.state.roles.length; j++) {
      options.push({
        value: j,
        label: this.state.roles[j]
      });
    }

    return (
      <div>
        <Select
          className="is-fullwidth"
          value={this.state.selected}
          options={options}
          onChange={e => this.handleChange(e)}
        />
      </div>
    );
  }
}

export default StudentRoles;
