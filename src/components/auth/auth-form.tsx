import { Link, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Spiral } from '@/components/loading-ui/spiral'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn, signUp } from '@/lib/auth-client'

const copy = {
  'sign-in': {
    title: (
      <>
        welcome <em>back</em>
      </>
    ),
    subtitle: 'Sign in to continue.',
    submit: 'Sign in',
    switchText: 'New to Vafey?',
    switchLink: { to: '/sign-up', label: 'Create an account' },
  },
  'sign-up': {
    title: (
      <>
        let's <em>begin</em>
      </>
    ),
    subtitle: 'Create your account to start learning.',
    submit: 'Create account',
    switchText: 'Already have an account?',
    switchLink: { to: '/sign-in', label: 'Sign in' },
  },
} as const

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const c = copy[mode]

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))

    setPending(true)
    const { error } =
      mode === 'sign-in'
        ? await signIn.email({ email, password })
        : await signUp.email({ email, password, name: String(form.get('name')) })
    setPending(false)

    if (error) return void toast.error(error.message ?? 'Something went wrong')
    await router.invalidate()
    await router.navigate({ to: '/' })
  }

  return (
    <div>
      <h1 className="font-serif text-5xl font-medium tracking-tight text-ink [&_em]:text-brand">{c.title}</h1>
      <p className="mt-3 text-ink-soft">{c.subtitle}</p>

      <form onSubmit={onSubmit} className="mt-8 grid gap-5">
        {mode === 'sign-up' && (
          <Field label="Full name" name="name" autoComplete="name" required />
        )}
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          minLength={8}
          required
        />
        <Button type="submit" disabled={pending} className="mt-2 h-11 rounded-lg text-[15px] font-semibold">
          {pending ? <Spiral className="size-5" /> : c.submit}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        {c.switchText}{' '}
        <Link to={c.switchLink.to} className="font-semibold text-ink underline-offset-4 hover:underline">
          {c.switchLink.label}
        </Link>
      </p>
    </div>
  )
}

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name} className="text-ink">
        {label}
      </Label>
      <Input id={name} name={name} className="h-11 rounded-lg border-line bg-white px-3.5 shadow-none" {...props} />
    </div>
  )
}
