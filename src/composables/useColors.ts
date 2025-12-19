// Bootstrap-compatible color system
import { ref } from 'vue'

export function useColors() {
  const currentPresetName = ref<string>('light')

  const getColor = (colorName: string): string => {
    // Map Vuestic color names to Bootstrap colors
    const colorMap: Record<string, string> = {
      primary: '#0d6efd',
      secondary: '#6c757d',
      success: '#198754',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#0dcaf0',
      light: '#f8f9fa',
      dark: '#212529',
      'on-primary': '#ffffff',
      'on-secondary': '#ffffff',
      'on-success': '#ffffff',
      'on-danger': '#ffffff',
      'on-warning': '#000000',
      'on-info': '#000000',
      'on-light': '#000000',
      'on-dark': '#ffffff',
    }

    return colorMap[colorName] || colorMap['primary']
  }

  const applyPreset = (presetName: string) => {
    currentPresetName.value = presetName
    // Apply theme preset (simplified - just store the name)
    // In a real implementation, this would apply CSS variables or theme classes
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-bs-theme', presetName)
    }
  }

  const colorToRgba = (color: string, alpha: number): string => {
    // Remove # if present
    const hex = color.replace('#', '')

    // Handle 3-digit hex
    let r: number, g: number, b: number
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16)
      g = parseInt(hex[1] + hex[1], 16)
      b = parseInt(hex[2] + hex[2], 16)
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16)
      g = parseInt(hex.substring(2, 4), 16)
      b = parseInt(hex.substring(4, 6), 16)
    } else {
      // Fallback to default color if invalid
      r = 13
      g = 110
      b = 253
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return {
    getColor,
    applyPreset,
    currentPresetName,
    colorToRgba,
  }
}
