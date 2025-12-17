
cat > src/composables/notification.d.ts << 'EOF'

export function useNotification(): {

  showAlert: (message: string, type?: string) => void;

};

EOF
