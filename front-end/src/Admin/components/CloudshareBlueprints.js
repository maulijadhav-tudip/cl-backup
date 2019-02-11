import React, { Component } from "react";
import "whatwg-fetch";
import Select from "react-select";
import "react-select/dist/react-select.css";
import PropTypes from "prop-types";
import base64 from "base-64";

class CloudshareBlueprints extends Component {
  static propTypes = {
    changeBlueprint: PropTypes.func.isRequired,
    blueprintId: PropTypes.string.isRequired
  };
  constructor(props) {
    super(props);
    this.loadBlueprints = this.loadBlueprints.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      blueprint: "",
      selected: 0,
      blueprints: []
    };
  }
  //This function loads the dates of the data sets
  loadBlueprints() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );
    fetch("/api/cloudshare/blueprints", {
      method: "GET",
      headers: headers
    })
      .then(function(response) {
        return response.json();
      })
      .then(json => {
        let blueprints = json;

        let index = blueprints.findIndex(x => x.id === this.props.blueprintId);
        if (index === -1) index = 0;
        this.setState({
          blueprints: blueprints,
          blueprint: blueprints[index],
          selected: index
        });
        this.props.changeBlueprint(blueprints[index]);
      })
      .catch(function(ex) {
        console.log("parsing failed", ex);
      });
  }

  componentDidMount() {
    this.loadBlueprints();
  }

  //When a different date is selected, update the state to the selected date
  handleChange(e) {
    this.props.changeBlueprint(this.state.blueprints[e.value]);

    this.setState({
      blueprint: this.state.blueprints[e.value],
      selected: e.value
    });
  }

  render() {
    //Add all dates to the dropdown bar correctly formatted
    var options = [];
    for (var j = 0; j < this.state.blueprints.length; j++) {
      options.push({
        value: j,
        label: this.state.blueprints[j]["name"]
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

export default CloudshareBlueprints;
