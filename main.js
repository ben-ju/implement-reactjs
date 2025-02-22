/**
 * This function is responsible for creating a representation of a node element
 */
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
  useState,
};

// --------------------------------------------------------------------------------
/**
 This is the JSX default declaration, it's not a valid javascript unless it's transpiled to JS using tools like Babel
(We're adding the comment at the top of the file to specify which function Babel should use to transpile our code, default use React)
 */

/** @jsx CopyReactJS.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);

/**
After being transpiled by Babel, the code above will look like this.

const element = CopyReactJS.createElement(
  "div",
  { id: "foo" },
  CopyReactJS.createElement("a", null, "bar"),
  CopyReactJS.createElement("b"),
);
**/

// --------------------------------------------------------------------------------
// Getting the DOM Node in which we will append the element we've just created above
const container = document.getElementById("root");
// We're calling the function responsible to append the element inside the container in the DOM
CopyReactJS.render(element, container);

// --------------------------------------------------------------------------------
/**
 * This function is responsible for adding elements to the DOM
 * BEFORE THE IMPLEMENTATION OF FIBERS
 * OLD -> render() | NEW -> createDom()
 * */

// function render(element, container) {
//   // The element we're trying to render can sometimes be a TEXT_ELEMENT, so we're creating a text node instead of a Node Element
//   const dom =
//     element.type == "TEXT_ELEMENT"
//       ? document.createTextNode("")
//       : document.createElement(element.type);
//   const isProperty = (key) => key !== "children";
//   Object.keys(element)
//     // For each node we're getting only properties and not children because they'll be created recursively with the render(child, dom) below
//     .filter(isProperty)
//     // For each properties set on the custom CreateElement we're not creating a real DOM element and passing it every props
//     .forEach((name) => {
//       dom[name] = element.props[name];
//     });
//   // Here we're now recursively creating a DOM element for each child
//   element.props.children.forEach((child) => render(child, dom));
//
//   // We're finally appending it to the container DOM (ID root in this case)
//   container.appendChild(dom);
// }
/**
 * We are now simply creating the dom passing the fiber (units of work), we remove the render function in this code so it doesn't block the main thread
 * AFTER THE IMPLEMENTATION OF FIBERS
 * OLD -> render()
 */
function createDom(fiber) {
  // The element we're trying to render can sometimes be a TEXT_ELEMENT, so we're creating a text node instead of a Node Element
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);
  const isProperty = (key) => key !== "children";
  Object.keys(fiber)
    // For each node we're getting only properties and not children because they'll be created recursively with the render(child, dom) below
    .filter(isProperty)
    // For each properties set on the custom CreateElement we're not creating a real DOM element and passing it every props
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });
  return dom;
}

// Reference another fiber, while this variable is set the WIP root rendering is not done so we're not commiting it to the DOM avoiding UI partial rendering
let nextUnitOfWork = null;
// Reference the whole Work In Progress fiber tree that we're building this tree is built upon the nextUnitOfWork variable, one by one
let wipRoot = null;
// Reference the current DOM that we've appended, it helps with comparison for update, delete...
let currentRoot = null;
// Reference the current DOM nodes that needs to be deleted
let deletions = null;
// --------------------------------------------------------------------------------
// FIBERS Implementation

// To create small units of work we will use a Fiber Tree data structure
// One of the goals of this data structure is to make it easy to find the next unit of work
// each fiber has a link to > first child > next sibling > its parent. Then it iterates again checking for child, siblings, parent...
// The next units of work is determined in this order : child, if no child -> sibling, if no sibling -> parent child and we go up until we find the root (end)
function render(element, container) {
  // Because the browser could interrupt our work before we finish rendering the whole tree, we'll track the `WORK IN PROGRESS FIBER TREE`
  // When we see that the Work In Progress tree has finish all the work (we check if there is a nextUnitOfWork, if not then the work is done), we then commit all the fiber tree to the DOM
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // this property keeps track of the current root appended in the DOM, the new Root we're building does know what the current DOM contains
    alternate: currentRoot,
  };
  // this array keeps track of which node element needs to be removed, since we can't read the useEffectTag from the oldFiberTree
  deletions = [];
  nextUnitOfWork = wipRoot;
}
// This function manages the work being commited by resetting the WIP root after being commited and setting the current root to the root we just appends (for future comparison)
// Reconciliation from ReactJS
function commitRoot() {
  // for each fiber in the deletions array we delete it
  deletions.forEach((fiber) => commitWork(fiber));
  // passing the WIP content every child to the DOM appending function
  commitWork(wipRoot.child);
  // Keeping track of the root appended to the DOM for comparison and delete, update...
  currentRoot = wipRoot;
  wipRoot = null;
}

// This function is responsible of appending the fibers to the DOM

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  // This would work only if there was no functionnal component resolution, but functionnal components does not have fiber dom
  // const domParent = fiber.parent.dom;

  // Then we need to loop, to get up to the fiber parents until we find a fiber with a dom
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;
  domParent.appendChild(fiber.dom);
  // If the fiber has a PLACEMENT effect tag we do the same as before, append the DOM node to the node from the parent fiber.
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
    // If it’s a DELETION, we do the opposite, remove the child.
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
    // And if it’s an UPDATE, we need to update the existing DOM node with the props that changed.
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
// this function handles the deletion, if the deletion happens on a functionnal component it will run recursively until it finds a dom to delete
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}
// This function handles the concurrent mode, it prevent from looping through the render method until every single DOM element have been created and appended, blocking the thread for too long
// We need to cut our code in small unit of work
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  // If there is  no other unit of work and we have something set in our WIP Root Tree then we commit it to the DOM so the user can see it
  // It avoids rendering missing UI because we would commit the work before ending every unitOfWork (first parameter) and it's pushing what we've built (second parameter)
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

// Those variables contains different comparison function to check if the key is an event, a property, a new props or to check wether the props is really gone
const isEvent = (key) => key !== key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (_, next) => (key) => !(key in next);
// This function is responsible of updating the dom by changing, deleting or updating the props
function updateDom(dom, prevProps, nextProps) {
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });
  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });
  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

let wipFiber = null;
let hookIndex = null;
// This methods handles hooks such as useState for the demo
function useState(initial) {
  // First we check if we have an old hook using the alternate property containing the old fiber
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];
  const hook = {
    // If we do have an old hook we copy the state, otherwise we initialize it for example writing : useState(1), if it's the first time instantiating the hook it will get the value 1 as initial
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };
  // We run the actions one by one
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action) => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };
  // We then add the hook to the wipFiber.hooks array defined in the updateFunctionnalComponent
  wipFiber.hooks.push(hook);
  // Finally we increment the index by one before returning the state along with a function to set a new state
  hookIndex++;
  // const counter, setCounter = useState(1)
  return [hook.state, setState];
}
// this function handles the case of a component being a function instead of a variable/dom
// It also includes the hooks management cf useState
function updateFunctionnalComponent(fiber) {
  wipFiber = fiber;
  // index linked to the array of hooks
  hookIndex = 0;
  // An array that represents every hooks in the functionnal components
  wipFiber.hooks = [];
  // If the fiber is a function then we run the function to get the children
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}
// this function handles the case of a component being a class dom
function updateHostComponent(fiber) {
  // First we create a new DOM
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
}
function performUnitOfWork(fiber) {
  // To add support to functionnal component we must determine if the fiber type is a function and then we dispatch to different functions
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionnalComponent(fiber);
  } else {
    updateHostComponent(fiber);
    // This is where the data structures works, we're first searching for a child if it exists
    // if not we're searching through siblings that we've defined above
    // if not we're searching onto the parent fiber siblings (uncles)
    if (fiber.child) {
      return fiber.child;
    }
    let nextFiber = fiber;
    while (nextFiber) {
      if (nextFiber.sibling) {
        return nextFiber.sibling;
      }
      nextFiber = nextFiber.parent;
    }
  }
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  // we're checking if the wipFiber has an equivalent in the current rendered DOM
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  // We'll iterate over an array and linked list at the same time to compare the newFiberElement and the oldRenderedElement
  while (index < elements.length || oldFiber != null) {
    while (index < elements.length) {
      const element = elements[index];
      let newFiber = null;

      const sameType = oldFiber && element && element.type == oldFiber.type;
      // checking if the two elements are the same type for example (<a>)
      // if it's true then we only need to update some properties : parent, props
      // We add a effectTag specifying that on this fiber the work we've done is only an update (lighter than replacing the entire node)
      if (sameType) {
        newFiber = {
          type: oldFiber.type,
          props: element.props,
          dom: oldFiber.dom,
          parent: wipFiber,
          alternate: oldFiber,
          effectTag: "UPDATE",
        };
        // TODO update the node
      }

      // If the element needs a DOM node then we add the effectTag placement (heavier since we need to create a new Node and append it)
      if (element && !sameType) {
        newFiber = {
          type: element.type,
          props: element.props,
          dom: null,
          parent: wipFiber,
          alternate: null,
          effectTag: "PLACEMENT",
        };
      }
      // If the element is just non existing then we delete it
      if (oldFiber && !sameType) {
        // since we don't have a new fiber to attach the effectTag we attach it to the oldFiber
        oldFiber.effectTag = "DELETION";
        // Since we commit the fiber tree from the wipRoot and not the oldFiber we don't know which one should be deleted so we must create an array that keep track of the nodes we want to remove
        deletions.push(oldFiber);
      }
      if (oldFiber) {
        oldFiber = oldFiber.sibling;
        const newFiber = {
          type: element.type,
          props: element.props,
          parent: wipFiber,
          dom: null,
        };
        if (index === 0) {
          wipFiber.child = newFiber;
        } else if (element) {
        } else {
          prevSibling.sibling = newFiber;
        }
        prevSibling = newFiber;
        index++;
      }
    }
  }
}

// The goal is to support functionnal components
/**
 Functionnal components are differents in two ways:

    the fiber from a function component doesn’t have a DOM node
    and the children come from running the function instead of getting them directly from the props
*/
// When transpiling it to JSX it will become :
/**
function App(props) {
  return CopyReactJS.createElement(
    "h1",
    null,
    "Hi ",
    props.name
  )
}
const functionElement = CopyReactJS.createElement(App, {
  name: "foo",
})
*/
/**@jsx CopyReactJS.createElement */
function App(props) {
  return <h1>Hi {props.name}</h1>;
}
const functionElement = <App name="foo" />;
const functionContainer = document.getElementById("root");
CopyReactJS.render(element, container);

// Now that we have handled the functionnal component we can also uses the hook to keep track of a state
// This is the uses of HOOKS in ReactJS
/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = Didact.useState(1);
  return <h1 onClick={() => setState((c) => c + 1)}>Count: {state}</h1>;
}
const counterElement = <Counter />;
