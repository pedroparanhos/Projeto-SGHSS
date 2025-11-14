// Configuração de cores personalizadas do Tailwind
tailwind.config = {
    theme: {
        extend: {
            colors: {
                'fundo-principal': '#1E293B',
                'fundo-secundario': '#334155',
                'fundo-sidebar': '#0F172A', 
                'campo': '#475569',
                'texto-principal': '#F1F5F9',
                'texto-secundario': '#94A3B8',
                'ciano-vibrante': '#06B6D4',
                'azul-suave': '#22D3EE',
                'vermelho-erro': '#F43F5E',
                'amarelo-alerta': '#F59E0B',
                // Cores para o mapa de leitos
                'leito-livre': '#10B981', // green-500
                'leito-ocupado': '#EF4444', // red-500
                'leito-alta-hoje': '#EAB308', // yellow-500
                'leito-limpeza': '#F97316', // orange-500
                'leito-bloqueado': '#6B7280', // gray-500
            },
            fontFamily: {
                'sans': ['Inter', 'sans-serif'],
            }
        }
    }
}