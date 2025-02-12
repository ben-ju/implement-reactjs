/** @jsx CopyReactJS.createElement **/
/**
 * This function is responsible for creating a representation of a node element
 * */

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      // Here we're mapping in the children, in case the children is not an object representing an element like a <a></a> it means that this is probably a primitive value such as text...
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child),
      ),
    },
  };
}
/**
 * This function is responsible for creating nodes containing primitives values such as : INT, STRING...
 **/
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}
// We're defining the main object that will replace the "React" in our small ReactJS copy. Each time we're adding a functionnality we must add the function here.
const CopyReactJS = {
  createElement,
  render,
};

/**
 * This is the JSX default declaration, it's not a valid javascript unless it's transpiled to JS using tools like Babel **/
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);

/**
 * After being transpiled by Babel, the code above will look like this. (We're adding the comment at the top of the file to specify which function Babel should use to transpile our code, default use React)
 * const element = CopyReactJS.createElement(
 * "div",
 *  { id: "foo" },
 * CopyReactJS.createElement("a", null, "bar"),
 * CopyReactJS.createElement("b"),
 * );
 **/

// Getting the DOM Node in which we will append the element we've just created above
const container = document.getElementById("root");
// We're calling the function responsible to append the element inside the container in the DOM
CopyReactJS.render(element, container);

/**
 * This function is responsible for adding elements to the DOM
 * */

function render(element, DOMNode) {
  // The element we're trying to render can sometimes be a TEXT_ELEMENT
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);
  Object.keys(element)
    .filter((key) => key !== "children")
    .forEach((name) => {
      dom[name] = element.props[name];
    });
  element.props.children.forEach((child) => render(child, dom));
  DOMNode.appendChild(dom);
}
