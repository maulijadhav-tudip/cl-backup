import React, { Component } from "react";
import "whatwg-fetch";
import Select from "react-select";
import "react-select/dist/react-select.css";
import PropTypes from "prop-types";

class LabPicker extends Component {
  static propTypes = {
    changeLab: PropTypes.func.isRequired,
    all: PropTypes.bool.isRequired,
    lab: PropTypes.object.isRequired
  };
  constructor(props) {
    super(props);
    this.loadLabs = this.loadLabs.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      lab: "",
      selected: 0,
      labs: []
    };
  }
  //This function loads the dates of the data sets
  loadLabs() {
    fetch("/api/labs/enabled", {
      method: "GET"
    })
      .then(function(response) {
        return response.json();
      })
      .then(json => {
        let labs = json["data"].map(x => {
          x["_id"] = x["_id"]["$oid"];
          return x;
        });
        labs = labs.filter(x => !(!this.props.all && x.type !== "ravello"));
        labs.sort(function(a, b) {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });
        let index = labs.findIndex(x => x._id === this.props.lab._id);
        if (index === -1) index = 0;
        this.setState({
          labs: labs,
          lab: labs[index],
          selected: index
        });
        this.props.changeLab(labs[index]);
      })
      .catch(function(ex) {
        console.log("parsing failed", ex);
      });
  }

  componentDidMount() {
    this.loadLabs();
  }

  //When a different date is selected, update the state to the selected date
  handleChange(e) {
    if (!!e) {
      this.props.changeLab(this.state.labs[e.value]);

      this.setState({
        lab: this.state.labs[e.value],
        selected: e.value
      });
    }
  }

  render() {
    //Add all dates to the dropdown bar correctly formatted
    var options = [];
    for (var j = 0; j < this.state.labs.length; j++) {
      options.push({
        value: j,
        label: this.state.labs[j]["name"]
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

export default LabPicker;
