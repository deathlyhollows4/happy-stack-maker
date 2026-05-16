import { lovable } from "@/integrations/lovable";

export function signInWithGoogle() {
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
}

export function signInWithGoogleSignUp() {
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
    extraParams: { prompt: "select_account" },
  });
}
