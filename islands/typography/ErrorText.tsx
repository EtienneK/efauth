import { ComponentChildren } from "preact";

interface ErrorTextProps {
  styleClass?: string;
  children: ComponentChildren;
}

function ErrorText({ styleClass, children }: ErrorTextProps) {
  return (
    <p className={`text-center  text-error ${styleClass ?? ""}`}>{children}</p>
  );
}

export default ErrorText;
