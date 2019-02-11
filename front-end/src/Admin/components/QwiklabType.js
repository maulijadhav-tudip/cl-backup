import React, { Component } from "react";
import Select from "react-select";
import "react-select/dist/react-select.css";
import PropTypes from "prop-types";

class QwiklabType extends Component {
  static propTypes = {
    changeType: PropTypes.func.isRequired,
    Type: PropTypes.string.isRequired
  };
  constructor(props) {
    super(props);
    this.loadTypes = this.loadTypes.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      Type: "",
      selected: 0,
      Types: []
    };
  }
  //This function loads the dates of the data sets
  loadTypes() {
    let Types = [
      "Bulk token request (for FMM)",
      "Single token request (for Self-paced lab)"
    ];
    let index = Types.indexOf(this.props.Type);
    if (index === -1) index = 0;
    this.setState({
      Types: Types,
      Type: Types[index],
      selected: index
    });
    this.props.changeType(Types[index]);
  }

  componentDidMount() {
    this.loadTypes();
  }

  //When a different date is selected, update the state to the selected date
  handleChange(e) {
    this.props.changeType(this.state.Types[e.value]);

    this.setState({
      Type: this.state.Types[e.value],
      selected: e.value
    });
  }

  render() {
    //Add all dates to the dropdown bar correctly formatted
    var options = [];
    for (var j = 0; j < this.state.Types.length; j++) {
      options.push({
        value: j,
        label: this.state.Types[j]
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

export default QwiklabType;
