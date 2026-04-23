import { forwardRef } from "react";
import "./FormInput.css";

// essentally a form input component, that can mould iteself as input, picker from list, or whatever.
// its dynamic so you can create a form input element with this and also have a useRef variable reffering to it from parent. 
// so all its different avatars will have different useRef variable pointing to that element only.


// forwardRef: normally you can't pass a ref from a parent to a child in props, forwardRef makes it possible.
// ref is not passed in first argument of prop object {}, forwaredRef makes it that its passed as second argument as ref.
// as : Tag = "input" is simply renaming as to Tag so it can be used as a component inside(remember componenets must be Uppercase). 
const FormInput = forwardRef(function FormInput(
  { label, as: Tag = "input", className = "", wrapperClassName = "", children, ...props },
  ref   //<< note this is second argument and not in props object
) {

  // adds the Tag as a classname along with the list of className(s) provided. Then filters for any null, "" values in the list and then joins them wth " " gap. 
  const controlClassName = [Tag === "textarea" ? "textarea" : "input", className].filter(Boolean).join(" ");

  //same as above but this is class name for entire container which is <label/> the above classes are for the input element only. 
  const fieldClassName = ["field", wrapperClassName].filter(Boolean).join(" ");

  //needsChildren is only true if the element is not input or textarea as they don't have children.
  const needsChildren = Tag !== "input" && Tag !== "textarea";

  // One wrapper keeps labels, selects, and textareas aligned the same way.
  return (
    <label className={fieldClassName}>
      {label ? <span>{label}</span> : null}

       {/* ref is just a way to reference this form input element(doesn't matter what it is) its ref variable will be passed in from parent */}
       {/* also its not important that ref is passed in, it may not so its just null */}
      <Tag ref={ref} className={controlClassName} {...props}>

        {/* renders children only if needsChildren = true */}
        {needsChildren ? children : null}
      </Tag>
    </label>
  );
});

export default FormInput;
