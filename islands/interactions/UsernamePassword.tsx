import { useState } from "preact/hooks";
import { client } from "../../trpc/client/interactions.ts";
import ErrorText from "../typography/ErrorText.tsx";
import InputText from "../../components/input/InputText.tsx";

interface UsernamePasswordProps {
  uid: string;
}

export default function UsernamePassword(props: UsernamePasswordProps) {
  const { uid } = props;

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loginObj, setLoginObj] = useState({
    username: "",
    password: "",
  });

  const updateFormValue = (updateType: string, value: string) => {
    setErrorMessage("");
    setLoginObj({ ...loginObj, [updateType]: value });
  };

  async function login(event: SubmitEvent) {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const result = await client(`/interactions/${uid}/trpc`).login
        .mutate({
          usernameOrEmail: loginObj.username,
          password: loginObj.password,
        });

      if (!result) {
        setErrorMessage("Invalid username or password.");
        setLoading(false);
        return;
      }
      window.location.href = result.redirectTo;
    } catch (err) {
      setLoading(false);
      console.error(err);
      setErrorMessage("An unknown error has occurred.");
    }
  }

  return (
    <>
      <form className="w-full max-w-xs" onSubmit={login}>
        <InputText
          defaultValue={loginObj.username}
          updateType="username"
          updateFormValue={updateFormValue}
          placeholder="Username or email address"
          required
        />

        <InputText
          defaultValue={loginObj.password}
          type="password"
          updateType="password"
          containerStyle="my-2"
          updateFormValue={updateFormValue}
          placeholder="Password"
          required
        />

        {
          /*
        <div className="text-right text-primary">
          <a href="/forgot-password">
            <span className="text-sm  inline-block  hover:text-primary hover:underline hover:cursor-pointer transition duration-200">
              Forgot Password?
            </span>
          </a>
        </div>
          */
        }
        {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : undefined}
        <button
          type="submit"
          className={"btn w-full btn-primary" +
            (loading ? " loading" : "")}
        >
          Login
        </button>

        {
          /*
        <div className="text-center mt-4">
          Don't have an account yet?{" "}
          <a href="/register">
            <span className="  inline-block  hover:text-primary hover:underline hover:cursor-pointer transition duration-200">
              Register
            </span>
          </a>
        </div>
        */
        }
      </form>
    </>
  );
}
