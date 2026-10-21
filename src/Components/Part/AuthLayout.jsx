import Logo from './Logo'

const HERO_IMAGE = 'https://images.pexels.com/photos/9388882/pexels-photo-9388882.jpeg?auto=compress&cs=tinysrgb&w=1600'

// Split layout for sign in / sign up: inspiration image on large screens, form on the right.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-surface lg:block">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="max-w-md text-4xl leading-tight font-extrabold tracking-tight">Find ideas for everything you love.</p>
          <p className="mt-3 max-w-md text-white/80">Recipes, homes, style, travel and more. Save what inspires you.</p>
        </div>
      </div>

      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <Logo to="/signin" className="mb-8" />
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-ink-muted">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
