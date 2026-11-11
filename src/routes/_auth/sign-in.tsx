import { createFileRoute } from '@tanstack/react-router'
import { AuthForm } from '@/components/auth/auth-form'

export const Route = createFileRoute('/_auth/sign-in')({
  head: () => ({ meta: [{ title: 'Sign in · Vafey' }] }),
  component: () => <AuthForm mode="sign-in" />,
})
