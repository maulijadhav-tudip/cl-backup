import React from "react";
import { Route, Redirect } from "react-router-dom";

const InstructorRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={props =>
      rest.isAuthenticated === true &&
      (rest.role === "admin" || rest.role === "instructor") ? (
        <Component {...props} {...rest} />
      ) : (
        <Redirect
          to={{
            pathname: "/login",
            state: { from: props.location }
          }}
        />
      )
    }
  />
);
export default InstructorRoute;
