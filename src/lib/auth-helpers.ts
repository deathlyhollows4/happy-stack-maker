import { lovable } from "@/integrations/lovable/index";

const getRedirectUri = () => `${window.location.origin}/auth/callback`;

export function signInWithGoogle() {
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri: getRedirectUri(),
  });
}

export function signInWithGoogleSignUp() {
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri: getRedirectUri(),
    extraParams: { prompt: "select_account" },
  });
}
