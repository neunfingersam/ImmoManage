interface WizardStepProps {
  step: number
  currentStep: number
  title: string
  children: React.ReactNode
}

export function WizardStep({ step, currentStep, title, children }: WizardStepProps) {
  const isActive = step === currentStep
  const isCompleted = step < currentStep

  return (
    <div className={`border rounded-xl p-4 ${isActive ? 'border-primary bg-primary/5' : isCompleted ? 'border-green-300 bg-green-50 dark:bg-green-950/20' : 'border-muted opacity-50'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
          ${isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          {isCompleted ? '✓' : step}
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      {isActive && <div className="pl-10">{children}</div>}
    </div>
  )
}
