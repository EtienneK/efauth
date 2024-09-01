import { useState } from "preact/hooks";

interface InputTextProps {
  labelTitle?: string;
  labelStyle?: string;
  type?: string;
  containerStyle?: string;
  defaultValue?: string;
  placeholder?: string;
  updateFormValue: (updateType: string, value: string) => void;
  updateType: string;
  required?: boolean;
}

function InputText(
  {
    labelTitle,
    labelStyle,
    type,
    containerStyle,
    defaultValue,
    placeholder,
    updateFormValue,
    updateType,
    required,
  }: InputTextProps,
) {
  const [value, setValue] = useState(defaultValue ?? "");

  const updateInputValue = (value: string) => {
    setValue(value);
    updateFormValue(updateType, value);
  };

  return (
    <div className={`form-control w-full ${containerStyle ?? ""}`}>
      {labelTitle
        ? (
          <label className="label">
            <span className={"label-text text-base-content " + labelStyle}>
              {labelTitle}
            </span>
          </label>
        )
        : undefined}
      <label class="input input-bordered flex items-center gap-2">
        <input
          type={type ?? "text"}
          value={value}
          placeholder={placeholder ?? ""}
          onChange={(e) =>
            updateInputValue((e.currentTarget as HTMLInputElement).value)}
          className="grow"
          required={required ?? false}
        />
      </label>
    </div>
  );
}

export default InputText;
