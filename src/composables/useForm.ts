// Bootstrap-compatible form validation system
import { ref, reactive } from 'vue'

export interface FormValidationRule {
  (value: any): boolean | string
}

export interface FormField {
  value: any
  rules?: FormValidationRule[]
  error?: string
}

export function useForm() {
  const fields = reactive<Record<string, FormField>>({})
  const isValid = ref(true)

  const validate = (): boolean => {
    let formValid = true

    for (const key in fields) {
      const field = fields[key]
      if (field.rules && field.rules.length > 0) {
        for (const rule of field.rules) {
          const result = rule(field.value)
          if (result !== true) {
            field.error = typeof result === 'string' ? result : 'Invalid value'
            formValid = false
            break
          } else {
            field.error = undefined
          }
        }
      }
    }

    isValid.value = formValid
    return formValid
  }

  const resetValidation = () => {
    for (const key in fields) {
      fields[key].error = undefined
    }
    isValid.value = true
  }

  const reset = () => {
    for (const key in fields) {
      fields[key].value = ''
      fields[key].error = undefined
    }
    isValid.value = true
  }

  const registerField = (name: string, initialValue: any = '', rules: FormValidationRule[] = []) => {
    fields[name] = {
      value: initialValue,
      rules,
      error: undefined,
    }
    return fields[name]
  }

  return {
    isValid,
    validate,
    resetValidation,
    reset,
    registerField,
    fields,
  }
}
