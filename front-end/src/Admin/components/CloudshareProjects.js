import React, { Component } from "react";
import "whatwg-fetch";
import Select from "react-select";
import "react-select/dist/react-select.css";
import PropTypes from "prop-types";
import base64 from "base-64";

class CloudshareProjects extends Component {
  static propTypes = {
    changeProject: PropTypes.func.isRequired,
    projectId: PropTypes.string.isRequired
  };
  constructor(props) {
    super(props);
    this.loadProjects = this.loadProjects.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      project: "",
      selected: 0,
      projects: []
    };
  }
  //This function loads the dates of the data sets
  loadProjects() {
    let headers = new Headers();
    headers.append(
      "Authorization",
      "Basic " + base64.encode(window.localStorage.getItem("authToken") + ":x")
    );
    fetch("/api/cloudshare/projects", {
      method: "GET",
      headers: headers
    })
      .then(function(response) {
        return response.json();
      })
      .then(json => {
        let index = json.findIndex(x => x.id === this.props.projectId);
        if (index === -1) index = 0;
        this.setState({
          projects: json,
          project: json[index],
          selected: index
        });
        this.props.changeProject(json[index]);
      })
      .catch(function(ex) {
        console.log("parsing failed", ex);
      });
  }

  componentDidMount() {
    this.loadProjects();
  }

  //When a different date is selected, update the state to the selected date
  handleChange(e) {
    this.props.changeProject(this.state.projects[e.value]);

    this.setState({
      project: this.state.projects[e.value],
      selected: e.value
    });
  }

  render() {
    //Add all dates to the dropdown bar correctly formatted
    var options = [];
    for (var j = 0; j < this.state.projects.length; j++) {
      options.push({
        value: j,
        label: this.state.projects[j]["name"]
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

export default CloudshareProjects;
