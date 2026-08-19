import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { clerkPublishableKey, useAuthSession } from '@/auth/auth';
import { FieldInput, PoufIdle } from '@/ui/components/poufKit';
import { AppText, Button, Screen, SegmentedControl } from '@/ui/components/primitives';
import { colors, spacing } from '@/ui/theme';

type Mode = 'signIn' | 'signUp';

/**
 * Email + password auth via Clerk. Shown only when a Clerk key is
 * configured; local mode (no key) skips auth entirely and keeps all
 * data on-device.
 */
export default function SignIn() {
  const auth = useAuthSession();
  if (!clerkPublishableKey || auth.isSignedIn) {
    return <Redirect href="/" />;
  }
  return <ClerkSignIn />;
}

function ClerkSignIn() {
  const router = useRouter();
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingCode, setPendingCode] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const submit = async (): Promise<void> => {
    if (!signInLoaded || !signUpLoaded) return;
    setBusy(true);
    setError(undefined);
    try {
      if (mode === 'signIn') {
        const result = await signIn.create({ identifier: email, password });
        if (result.status === 'complete') {
          await setSignInActive({ session: result.createdSessionId });
          router.replace('/');
        } else {
          setError('Additional verification required — finish in the Clerk dashboard flow.');
        }
      } else if (!pendingCode) {
        await signUp.create({ emailAddress: email, password });
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setPendingCode(true);
      } else {
        const result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status === 'complete') {
          await setSignUpActive({ session: result.createdSessionId });
          router.replace('/');
        } else {
          setError('Verification incomplete. Check the code and try again.');
        }
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Something went wrong. Check your details and retry.';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen testID="sign-in-screen">
      <View style={styles.header}>
        <PoufIdle size={88} />
        <AppText variant="display" color={colors.mint}>
          Apex
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Progressive strength training, minus the spreadsheet.
        </AppText>
      </View>

      <SegmentedControl<Mode>
        options={[
          { value: 'signIn', label: 'Sign in' },
          { value: 'signUp', label: 'Create account' },
        ]}
        value={mode}
        onChange={(m) => {
          setMode(m);
          setPendingCode(false);
          setError(undefined);
        }}
        testID="sign-in-mode"
      />

      <View style={styles.form}>
        {!pendingCode ? (
          <>
            <FieldInput
              testID="sign-in-email"
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              accessibilityLabel="Email"
            />
            <FieldInput
              testID="sign-in-password"
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              autoComplete={mode === 'signIn' ? 'password' : 'new-password'}
              value={password}
              onChangeText={setPassword}
              accessibilityLabel="Password"
            />
          </>
        ) : (
          <FieldInput
            testID="sign-in-code"
            style={styles.input}
            placeholder="Verification code from your email"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            accessibilityLabel="Verification code"
          />
        )}
        {error ? (
          <AppText variant="caption" color={colors.danger} testID="sign-in-error">
            {error}
          </AppText>
        ) : null}
        <Button
          label={mode === 'signIn' ? 'Sign in' : pendingCode ? 'Verify email' : 'Create account'}
          onPress={() => void submit()}
          loading={busy}
          disabled={pendingCode ? code.length < 4 : email.length < 3 || password.length < 8}
          testID="sign-in-submit"
        />
        <AppText variant="caption" color={colors.textTertiary} style={styles.privacy}>
          Your training data is private to your account. We collect only what the app needs to
          work — no ads, no data sales.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: spacing.xxxl, gap: spacing.sm, alignItems: 'flex-start' },
  form: { marginTop: spacing.xl, gap: spacing.md },
  input: { minHeight: 56 },
  privacy: { marginTop: spacing.md, lineHeight: 18 },
});
