import { createFileRoute } from '@tanstack/react-router'
import { AuthForm } from '@/components/auth/auth-form'

export const Route = createFileRoute('/_auth/sign-up')({
  head: () => ({ meta: [{ title: 'Sign up · Vafey' }] }),
  component: () => <AuthForm mode="sign-up" />,
})
