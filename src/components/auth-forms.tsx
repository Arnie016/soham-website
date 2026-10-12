"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, Form } from "./ui";
export function LoginForm() {
  const router = useRouter();
  return (
    <Form
      noValidate
      endpoint="/api/login"
      label="Sign in"
      onSuccess={(d) => {
        router.push(d.user.role === "architect" ? "/studio" : "/portal");
        router.refresh();
      }}
    >
      <Field
        name="email"
        label="Email address"
        type="email"
        required
        autoComplete="username"
      />
      <Field
        name="password"
        label="Password"
        type="password"
        required
        autoComplete="current-password"
      />
      <p className="form-note">
        New client or forgotten your password?{" "}
        <a href="mailto:sohamkhetan@gmail.com?subject=Project%20workspace%20access">
          Ask Soham for an invitation
        </a>
        .
      </p>
    </Form>
  );
}
export function ActivationForm() {
  const [token, setToken] = useState("");
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    setToken(window.location.hash.slice(1));
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  if (complete)
    return (
      <div role="status">
        <h2>Your workspace is ready.</h2>
        <p>
          You can now sign in with the email address Soham invited and your new
          password.
        </p>
        <Link href="/login" className="button">
          Go to sign in
        </Link>
      </div>
    );
  return (
    <Form
      noValidate
      endpoint="/api/activate"
      label="Set password"
      transform={(d) => ({ ...d, token })}
      onSuccess={() => setComplete(true)}
    >
      <p className="form-note">
        Choose a password with at least 12 characters. A phrase of several words
        works well.
      </p>
      <Field
        name="password"
        type="password"
        label="New password"
        autoComplete="new-password"
        required
      />
      {!token && (
        <p className="error-message">
          Open the complete invitation link from Soham to set your password.
        </p>
      )}
    </Form>
  );
}
